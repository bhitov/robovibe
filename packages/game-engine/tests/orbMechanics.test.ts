import { describe, it, expect } from 'vitest';
import { Game } from '../src/Game';
import { buildGameConfig } from '@repo/game-config';
import { GameMode } from '@repo/game-config';
import type { BotInput } from '../src/types';

describe('Orb-specific Mechanics', () => {
  it.only('should correctly report nearby orbs in bot input', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    // Ensure we have orbs
    config.initialOrbs = 5;
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Scanner');

    let capturedInput: BotInput | null = null;
    const captureInputLoop = (input: BotInput) => {
      capturedInput = input;
      return { action: { type: 'idle' } as const, store: {} };
    };

    game.setBotLoop('p1', captureInputLoop);
    game.tick();

    // Should see some orbs
    expect(capturedInput!.orbs?.length).toBeGreaterThan(0);
    
    // Orbs should have required properties
    const firstOrb = capturedInput!.orbs[0];
    expect(firstOrb).toHaveProperty('id');
    expect(firstOrb).toHaveProperty('position');
    expect(firstOrb).toHaveProperty('distance');
    expect(firstOrb!.distance).toBeGreaterThan(0);
  });

  it('should sort orbs by distance', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    config.initialOrbs = 10;
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Sorter');

    let capturedInput: BotInput | null = null;
    const captureInputLoop = (input: BotInput) => {
      capturedInput = input;
      return { action: { type: 'idle' } as const, store: {} };
    };

    game.setBotLoop('p1', captureInputLoop);
    game.tick();

    const orbs = capturedInput!.orbs;
    expect(orbs.length).toBeGreaterThan(1);

    // Check they're sorted by distance
    for (let i = 1; i < orbs.length; i++) {
      expect(orbs[i]!.distance).toBeGreaterThanOrEqual(orbs[i-1]!.distance);
    }
  });


  it('should handle orb pickup correctly', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    config.initialOrbs = 1;
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Collector');

    // Position bot on the orb
    const bot = Array.from(game.getState().bots.values())[0]!;
    const orb = Array.from(game.getState().orbs.values())[0]!;
    bot.position = { ...orb.position };

    const pickupLoop = () => ({ action: { type: 'pickup' } as const, store: {} });
    game.setBotLoop('p1', pickupLoop);

    const orbsBefore = game.getState().orbs.size;
    game.tick();
    const orbsAfter = game.getState().orbs.size;

    expect(orbsAfter).toBe(orbsBefore - 1);
    expect(Array.from(game.getState().bots.values())[0]!.hasOrb).toBe(true);
  });

  it('should handle orb deposit correctly', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    const game = new Game(config);

    game.addPlayer('p1', 0, 'Depositor');

    // Give bot an orb and position at base
    const bot = Array.from(game.getState().bots.values())[0]!;
    const base = Array.from(game.getState().bases.values())[0]!;
    bot.hasOrb = true;
    bot.position = { ...base.position };

    const depositLoop = () => ({ action: { type: 'deposit' } as const, store: {} });
    game.setBotLoop('p1', depositLoop);

    const baseBefore = base.orbsDeposited;
    game.tick();
    
    expect(Array.from(game.getState().bots.values())[0]!.hasOrb).toBe(false);
    expect(Array.from(game.getState().bases.values())[0]!.orbsDeposited).toBe(baseBefore + 1);
    // Should spawn a new orb
    expect(game.getState().orbs.size).toBeGreaterThan(0);
  });
});