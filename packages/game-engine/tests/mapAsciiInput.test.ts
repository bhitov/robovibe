import { describe, it, expect } from 'vitest';
import { Game } from '../src/Game';
import { buildGameConfig, GameMode } from '@repo/game-config';

describe('Map ASCII Input', () => {
  it('should pass ASCII map and grid position to bot', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    const game = new Game(config);
    game.addPlayer('test-player');
    
    let capturedInput: any = null;
    game.setBotLoop('test-player', (input, store) => {
      capturedInput = input;
      return { action: { type: 'idle' } as const, store };
    });
    
    // Run a tick to capture the input
    game.tick();
    
    // Check that mapAscii is passed
    expect(capturedInput).toBeDefined();
    expect(capturedInput.mapAscii).toBeDefined();
    expect(Array.isArray(capturedInput.mapAscii)).toBe(true);
    expect(capturedInput.mapAscii.length).toBeGreaterThan(0);
    
    // Check that gridPosition is calculated
    expect(capturedInput.gridPosition).toBeDefined();
    expect(capturedInput.gridPosition.row).toBeDefined();
    expect(capturedInput.gridPosition.col).toBeDefined();
    expect(capturedInput.gridPosition.row).toBeGreaterThanOrEqual(0);
    expect(capturedInput.gridPosition.col).toBeGreaterThanOrEqual(0);
  });

  it('should calculate grid position correctly', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    const game = new Game(config);
    game.addPlayer('test-player');
    
    let capturedInput: any = null;
    game.setBotLoop('test-player', (input, store) => {
      capturedInput = input;
      return { action: { type: 'idle' } as const, store };
    });
    
    // Get bot and move it to a known position
    const state = game.getState();
    const bot = Array.from(state.bots.values())[0];
    
    // Move to top-left corner
    bot!.position = { x: 0, y: 0 };
    game.tick();
    expect(capturedInput.gridPosition).toEqual({ row: 0, col: 0 });
    
    // Move to a position that should map to a specific grid cell
    // Assuming arena is 600x400 and map is 30x20 (typical for these games)
    // Each cell would be 20x20 pixels
    bot!.position = { x: 50, y: 50 }; // Should be at grid position (2, 2)
    game.tick();
    
    // Calculate expected grid position based on actual map dimensions
    const mapWidth = capturedInput.mapAscii[0].length;
    const mapHeight = capturedInput.mapAscii.length;
    const cellWidth = config.arenaWidth / mapWidth;
    const cellHeight = config.arenaHeight / mapHeight;
    const expectedCol = Math.floor(50 / cellWidth);
    const expectedRow = Math.floor(50 / cellHeight);
    
    expect(capturedInput.gridPosition).toEqual({ row: expectedRow, col: expectedCol });
  });

  it('should show map characters correctly', () => {
    const config = buildGameConfig(GameMode.OrbGame);
    const game = new Game(config);
    game.addPlayer('test-player');
    
    let capturedInput: any = null;
    game.setBotLoop('test-player', (input, store) => {
      capturedInput = input;
      return { action: { type: 'idle' } as const, store };
    });
    
    game.tick();
    
    // Check that the map contains expected characters
    const mapString = capturedInput.mapAscii.join('');
    
    // Should contain blocks (H)
    expect(mapString).toContain('H');
    
    // Should contain bases (B) in orb games
    if (config.allowedActions.deposit) {
      expect(mapString).toContain('B');
    }
    
    // Should contain dots (empty spaces)
    expect(mapString).toContain('.');
  });
});