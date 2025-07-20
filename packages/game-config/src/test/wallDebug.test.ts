/**
 * Wall debugging test - specifically test H block parsing and wall generation
 */

import { describe, it, expect } from 'vitest';
import { parseAsciiMap } from '../mapParser.js';
import { getMapByName } from '../maps/index.js';
import { buildGameConfig } from '../configBuilder.js';
import { GameMode } from '../types.js';

describe('Wall Debugging Tests', () => {
  it('should parse simple H block test map correctly', () => {
    const testMap = getMapByName('Simple H Block Test');
    expect(testMap).toBeDefined();
    
    if (testMap) {
      const parsed = parseAsciiMap(testMap.ascii);
      
      // Should have walls from H blocks
      expect(parsed.walls.length).toBeGreaterThan(0);
      
      // Log detailed info about the walls
      console.log(`🧪 Simple H Block Test map parsed:`);
      console.log(`  - Walls: ${parsed.walls.length}`);
      console.log(`  - Bases: ${parsed.bases.length}`);
      console.log(`  - Checkpoints: ${parsed.checkpoints.length}`);
      console.log(`  - PowerUps: ${parsed.powerUps.length}`);
      
      // Log first few walls for debugging
      parsed.walls.slice(0, 5).forEach((wall, index) => {
        console.log(`  - Wall ${index + 1}: (${wall.start.x}, ${wall.start.y}) -> (${wall.end.x}, ${wall.end.y})`);
      });
    }
  });
  
  it('should generate config with walls from H block test map', () => {
    const config = buildGameConfig(GameMode.TankCombat, { mapName: 'Simple H Block Test' });
    
    expect(config).toBeDefined();
    expect(config.walls).toBeDefined();
    expect(config.walls!.length).toBeGreaterThan(0);
    
    console.log(`🧪 TankCombat config with Simple H Block Test:`);
    console.log(`  - Arena: ${config.arenaWidth}x${config.arenaHeight}`);
    console.log(`  - Walls: ${config.walls!.length}`);
    console.log(`  - Allowed actions: ${JSON.stringify(config.allowedActions)}`);
  });
  
  it('should parse large H block test map correctly', () => {
    const testMap = getMapByName('Large H Block Test');
    expect(testMap).toBeDefined();
    
    if (testMap) {
      const parsed = parseAsciiMap(testMap.ascii);
      
      // Should have walls from H blocks
      expect(parsed.walls.length).toBeGreaterThan(0);
      
      console.log(`🧪 Large H Block Test map parsed:`);
      console.log(`  - Walls: ${parsed.walls.length}`);
      console.log(`  - Expected more walls due to larger H block formation`);
    }
  });
  
  it('should parse H block race test map with checkpoints', () => {
    const testMap = getMapByName('H Block Race Test');
    expect(testMap).toBeDefined();
    
    if (testMap) {
      const parsed = parseAsciiMap(testMap.ascii);
      
      // Should have walls from H blocks
      expect(parsed.walls.length).toBeGreaterThan(0);
      
      // Should have checkpoints (0 and 1)
      expect(parsed.checkpoints.length).toBe(2);
      
      console.log(`🧪 H Block Race Test map parsed:`);
      console.log(`  - Walls: ${parsed.walls.length}`);
      console.log(`  - Checkpoints: ${parsed.checkpoints.length}`);
      console.log(`  - Checkpoint 0: (${parsed.checkpoints[0]?.x}, ${parsed.checkpoints[0]?.y})`);
      console.log(`  - Checkpoint 1: (${parsed.checkpoints[1]?.x}, ${parsed.checkpoints[1]?.y})`);
    }
  });
  
  it('should test individual H block parsing', () => {
    // Test a minimal H block
    const testAscii = [
      '...',
      '.H.',
      '...',
    ];
    
    const parsed = parseAsciiMap(testAscii);
    
    // A single H block should create 4 walls (top, right, bottom, left)
    expect(parsed.walls.length).toBe(4);
    
    console.log(`🧪 Single H block test:`);
    console.log(`  - Walls created: ${parsed.walls.length}`);
    parsed.walls.forEach((wall, index) => {
      console.log(`  - Wall ${index + 1}: (${wall.start.x}, ${wall.start.y}) -> (${wall.end.x}, ${wall.end.y})`);
    });
  });
});