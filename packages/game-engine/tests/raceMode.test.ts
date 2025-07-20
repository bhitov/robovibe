import { describe, it, expect } from 'vitest';
import { Game } from '../src/Game';
import { buildGameConfig } from '@repo/game-config';
import { GameMode } from '@repo/game-config';

describe('Race Mode Specific Tests', () => {
  it('should have checkpoints configured', () => {
    const config = buildGameConfig(GameMode.RaceGame);
    const game = new Game(config);

    expect(game.getState().checkpoints.length).toBeGreaterThan(0);
  });

  it('should initialize with correct race progress', () => {
    const config = buildGameConfig(GameMode.RaceGame);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Racer');

    const progress = game.getState().botProgress.get('bot-p1')!;
    expect(progress.currentLap).toBe(0);
    expect(progress.nextCheckpoint).toBe(1);
    expect(progress.boostTicks).toBe(0);
    expect(progress.starTicks).toBe(0);
  });

  it('should have power-ups configured', () => {
    const config = buildGameConfig(GameMode.RaceGame);
    const game = new Game(config);

    const state = game.getState();
    expect(state.powerUps.size).toBeGreaterThan(0);
  });

  it('should apply speed boost to movement', () => {
    const config = buildGameConfig(GameMode.RaceGame);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Speedy');

    // Create a movement loop
    const moveLoop = () => ({ action: { type: 'move', dx: 1, dy: 0 } as const, store: {} });
    game.setBotLoop('p1', moveLoop);

    // Move without boost and record max velocity
    for (let i = 0; i < 10; i++) game.tick();
    const normalMaxVel = Array.from(game.getState().bots.values())[0]!.velocity;
    const normalSpeed = Math.sqrt(normalMaxVel.x ** 2 + normalMaxVel.y ** 2);

    // Reset velocity and apply boost
    const bot = Array.from(game.getState().bots.values())[0]!;
    bot.velocity = { x: 0, y: 0 };
    
    const progress = game.getState().botProgress.get('bot-p1')!;
    progress.boostTicks = 100;

    // Move with boost
    for (let i = 0; i < 10; i++) game.tick();
    const boostedMaxVel = Array.from(game.getState().bots.values())[0]!.velocity;
    const boostedSpeed = Math.sqrt(boostedMaxVel.x ** 2 + boostedMaxVel.y ** 2);

    // Boosted max speed should be higher (1.5x according to the code)
    expect(boostedSpeed).toBeGreaterThan(normalSpeed * 1.4);
  });

  it('should track laps for win condition', () => {
    const config = buildGameConfig(GameMode.RaceGame);
    config.lapsToWin = 1;
    config.winCondition = { type: 'laps', value: 1 };
    
    const game = new Game(config);
    game.addPlayer('p1', 0, 'Racer');

    // Manually set lap count to trigger win
    const progress = game.getState().botProgress.get('bot-p1')!;
    progress.currentLap = 1;

    game.tick();

    expect(game.getState().winner).toBe('Racer');
  });

  it('should provide nextCheckpoint coordinates to player', () => {
    const config = buildGameConfig(GameMode.RaceGame);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Racer');

    // Create a test loop that captures the input
    let capturedInput: any = null;
    const testLoop = (input: any) => {
      capturedInput = input;
      return { action: { type: 'move', dx: 0, dy: 0 } as const, store: {} };
    };
    
    game.setBotLoop('p1', testLoop);
    game.tick();

    // Verify race mode data is provided
    expect(capturedInput).toBeDefined();
    expect(capturedInput.nextCheckpoint).toBeDefined();
    expect(capturedInput.nextCheckpoint.x).toBeDefined();
    expect(capturedInput.nextCheckpoint.y).toBeDefined();
    expect(capturedInput.currentLap).toBe(0);
    expect(capturedInput.checkpoints).toBeDefined();
    expect(capturedInput.checkpoints.length).toBeGreaterThan(0);
    
    // All checkpoints should have x and y coordinates
    for (const cp of capturedInput.checkpoints) {
      expect(cp.x).toBeDefined();
      expect(cp.y).toBeDefined();
    }
  });
});