import { describe, it, expect } from 'vitest';
import { Game } from '../src/Game';
import { buildGameConfig } from '@repo/game-config';
import { GameMode } from '@repo/game-config';
import { BotInput } from '../src';

const idleLoop = () => ({ action: { type: 'idle' } as const, store: {} });

describe('Unified Game - Basic Runtime', () => {
  it('initializes, ticks, and resets without error for all game modes', () => {
    const modes = [
      GameMode.OrbGame,
      GameMode.TankCombat,
      GameMode.RaceGame
    ];

    for (const mode of modes) {
      const config = buildGameConfig(mode);
      const game = new Game(config);

      // Add two dummy players
      game.addPlayer('p1', 0, 'Alpha');
      game.addPlayer('p2', 1, 'Bravo');

      // Register simple bot loops
      game.setBotLoop('p1', idleLoop);
      game.setBotLoop('p2', idleLoop);

      // Tick the game a few times
      for (let i = 0; i < 5; i++) game.tick();

      const stateAfter = game.getState();
      expect(stateAfter.tickCount).toBe(5);
      expect(stateAfter.bots.size).toBe(2);

      // Reset and verify counters clear
      game.reset();
      const stateReset = game.getState();
      expect(stateReset.tickCount).toBe(0);
      expect(stateReset.winner).toBeNull();
    }
  });
});

describe('OrbGame Mode', () => {
  it('should handle orb pickup and deposit', () => {
    const config = buildGameConfig(GameMode.OrbGame,{ mapName: 'Classic Arena'})
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Player1');
    
    // Bot that picks up nearest orb
    const pickupLoop = (input: BotInput) => {
      if (!input.hasOrb && input.orbs?.length > 0) {
        const orb = input.orbs[0];
        if (!orb) return { action: { type: 'idle' as const} as const, store: {} };

        if (orb && orb.distance < 20) {
          return { action: { type: 'pickup'  as const} as const, store: {} };
        }

        return { 
          action: { type: 'move' as const, dx: orb.position.x - input.botPosition.x, dy: orb.position.y - input.botPosition.y } as const, 
          store: {} 
        };
      }
      return { action: { type: 'idle' as const} as const, store: {} };
    };

    game.setBotLoop('p1', pickupLoop);

    const initialOrbs = game.getState().orbs.size;
    expect(initialOrbs).toBeGreaterThan(0);

    // Run until bot picks up an orb
    for (let i = 0; i < 100; i++) {
      game.tick();
      const bot = Array.from(game.getState().bots.values())[0];
      if (bot?.hasOrb) break;
    }

    const bot = Array.from(game.getState().bots.values())[0];
    expect(bot?.hasOrb).toBe(true);
    expect(game.getState().orbs.size).toBe(initialOrbs - 1);
  });

  it('should track orbs deposited and check win condition', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Winner');
    
    // Manually set bot to have orb and be at base
    const state = game.getState();
    const bot = Array.from(state.bots.values())[0]!;
    const base = Array.from(state.bases.values())[0]!;
    
    bot.hasOrb = true;
    bot.position = { ...base.position };

    // Deposit orb
    const depositLoop = () => ({ action: { type: 'deposit' as const }, store: {} });
    game.setBotLoop('p1', depositLoop);
    
    // Set orbs to win to 1 for quick test
    const customConfig = { ...config, orbsToWin: 1, winCondition: { type: 'orbs' as const, value: 1 } };
    const quickGame = new Game(customConfig);
    quickGame.addPlayer('p1', 0, 'Winner');
    
    // Give bot an orb and position at base
    const quickState = quickGame.getState();
    const quickBot = Array.from(quickState.bots.values())[0]!;
    const quickBase = Array.from(quickState.bases.values())[0]!;
    quickBot.hasOrb = true;
    quickBot.position = { ...quickBase.position };
    
    quickGame.setBotLoop('p1', depositLoop);
    quickGame.tick();
    
    expect(quickGame.getState().winner).toBe('Winner');
  });
});

describe('TankCombat Mode', () => {
  it('should spawn projectiles when firing', () => {
    const config = buildGameConfig(GameMode.TankCombat);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Tank1');
    game.addPlayer('p2', 1, 'Tank2');

    const fireLoop = () => ({ action: { type: 'fire' } as const, store: {} });
    game.setBotLoop('p1', fireLoop);
    game.setBotLoop('p2', idleLoop);

    // First tick should spawn a projectile
    game.tick();
    expect(game.getState().projectiles.size).toBe(1);

    // Continue ticking - should respect cooldown
    for (let i = 0; i < 5; i++) game.tick();
    expect(game.getState().projectiles.size).toBeLessThanOrEqual(2);
  });

  it('should damage bots when hit by projectiles', () => {
    const config = buildGameConfig(GameMode.TankCombat);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Shooter');
    game.addPlayer('p2', 1, 'Target');

    // Position bots facing each other
    const state = game.getState();
    const shooter = Array.from(state.bots.values())[0]!;
    const target = Array.from(state.bots.values())[1]!;
    
    shooter.position = { x: 100, y: 200 };
    shooter.rotation = 0; // facing right
    target.position = { x: 200, y: 200 };
    target.health = 100;

    const fireLoop = () => ({ action: { type: 'fire' } as const, store: {} });
    game.setBotLoop('p1', fireLoop);
    game.setBotLoop('p2', idleLoop);

    // Let projectile travel
    for (let i = 0; i < 20; i++) {
      game.tick();
    }

    const updatedTarget = Array.from(game.getState().bots.values())[1]!;
    expect(updatedTarget.health).toBeLessThan(100);
  });
});

describe('RaceGame Mode', () => {
  it('should handle power-up pickups', () => {
    const config = buildGameConfig(GameMode.RaceGame);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Racer');
    game.setBotLoop('p1', idleLoop);

    const state = game.getState();
    const bot = Array.from(state.bots.values())[0]!;
    const progress = state.botProgress.get(bot.id)!;

    // Position bot on a power-up
    const powerUp = Array.from(state.powerUps.values())[0];
    if (powerUp) {
      bot.position = { ...powerUp.position };
      game.tick();

      const updatedProgress = game.getState().botProgress.get(bot.id)!;
      // Should have either boost or star
      expect(updatedProgress.boostTicks + updatedProgress.starTicks).toBeGreaterThan(0);
    }
  });
});

describe('Win Conditions', () => {
  it.skip('should handle elimination win condition', () => {
    const config = buildGameConfig(GameMode.TankCombat);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Survivor');
    game.addPlayer('p2', 1, 'Eliminated');

    // Set p2 health to 0
    const bots = Array.from(game.getState().bots.values());
    bots[1]!.health = 0;

    game.tick();

    expect(game.getState().winner).toBe('Survivor');
  });

  it('should handle survival win condition', () => {
    const config = buildGameConfig(GameMode.FlappyGame);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Survivor');
    game.addPlayer('p2', 1, 'Crashed');

    // Set p2 lives to 0
    const progress2 = game.getState().botProgress.get('bot-p2')!;
    progress2.lives = 0;

    game.tick();

    expect(game.getState().winner).toBe('Survivor');
  });

  it('should handle laps win condition', () => {
    const customConfig = buildGameConfig(GameMode.RaceGame);
    customConfig.lapsToWin = 2;
    customConfig.winCondition = { type: 'laps', value: 2 };
    
    const game = new Game(customConfig);
    game.addPlayer('p1', 0, 'Racer');

    // Simulate completing 2 laps
    const progress = game.getState().botProgress.get('bot-p1')!;
    progress.currentLap = 2;

    game.tick();

    expect(game.getState().winner).toBe('Racer');
  });
});