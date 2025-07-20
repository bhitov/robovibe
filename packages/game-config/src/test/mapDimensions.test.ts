/**
 * Test to verify all maps have correct dimensions (30x20 for ASCII representation)
 * This test reports all failures before returning the final result
 */

import { describe, it, expect } from 'vitest';
import { battleMaps } from '../maps/battleMaps.js';
import { raceMaps } from '../maps/raceMaps.js';
import type { GameMap } from '../maps/index.js';

describe('Map Dimensions Validation', () => {
  it('should verify all maps have correct 30x20 dimensions', () => {
    const expectedWidth = 30;
    const expectedHeight = 20;
    const failedMaps: Array<{
      name: string;
      type: string;
      actualWidth: number;
      actualHeight: number;
      expectedWidth: number;
      expectedHeight: number;
    }> = [];

    // Helper function to validate a single map
    const validateMap = (map: GameMap, type: string) => {
      const actualHeight = map.ascii.length;
      
      // Check height first
      if (actualHeight !== expectedHeight) {
        failedMaps.push({
          name: map.name,
          type,
          actualWidth: map.ascii[0]?.length || 0,
          actualHeight,
          expectedWidth,
          expectedHeight
        });
        return;
      }
      
      // Check each row width individually
      for (let i = 0; i < map.ascii.length; i++) {
        const rowWidth = map.ascii[i]?.length ?? 0;
        if (rowWidth !== expectedWidth) {
          failedMaps.push({
            name: map.name,
            type,
            actualWidth: rowWidth,
            actualHeight,
            expectedWidth,
            expectedHeight
          });
          return; // Report first width failure and move to next map
        }
      }
    };

    // Test all battle maps
    battleMaps.forEach(map => validateMap(map, 'battle'));
    
    // Test all race maps
    raceMaps.forEach(map => validateMap(map, 'race'));

    // Report all failures
    if (failedMaps.length > 0) {
      console.log('\n❌ Maps with incorrect dimensions:');
      failedMaps.forEach(failure => {
        console.log(`  ${failure.type}: "${failure.name}" - ${failure.actualWidth}x${failure.actualHeight} (expected ${failure.expectedWidth}x${failure.expectedHeight})`);
      });
      console.log(`\nTotal failed maps: ${failedMaps.length}`);
    } else {
      console.log('\n✅ All maps have correct dimensions (30x20)');
    }

    // Calculate totals
    const totalBattleMaps = battleMaps.length;
    const totalRaceMaps = raceMaps.length;
    const totalMaps = totalBattleMaps + totalRaceMaps;
    
    console.log(`\n📊 Map Summary:`);
    console.log(`  Battle maps: ${totalBattleMaps}`);
    console.log(`  Race maps: ${totalRaceMaps}`);
    console.log(`  Total maps: ${totalMaps}`);
    console.log(`  Passed: ${totalMaps - failedMaps.length}`);
    console.log(`  Failed: ${failedMaps.length}`);

    // Final assertion
    expect(failedMaps.length).toBe(0);
  });
});