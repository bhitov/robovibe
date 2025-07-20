import { describe, it, expect } from 'vitest';
import { pathFind, hasLOS, GridPos } from '../src/pathFind';
import { TILE_SIZE } from '@repo/game-config';

  const toPixelCentre = (g: GridPos): { x: number; y: number } => ({
    x: g.col * TILE_SIZE + TILE_SIZE / 2,
    y: g.row * TILE_SIZE + TILE_SIZE / 2,
  });
/**
 * Helpers
 */
const mag = (v: { dx: number; dy: number }): number =>
  Math.hypot(v.dx, v.dy);

/**
 * Test helper that:
 * 1. Finds P (start) and G (goal) positions in the map
 * 2. Converts grid positions to world coordinates
 * 3. Strips P and G from the map
 * 4. Runs pathFind from P to G
 */
function testPathFind(mapLines: string[]): { dx: number; dy: number } {
  let startPos: { x: number; y: number } | null = null;
  let goalPos: { x: number; y: number } | null = null;
  
  // Find P and G positions
  for (let row = 0; row < mapLines.length; row++) {
    for (let col = 0; col < mapLines[row]!.length; col++) {
      const char = mapLines[row]![col];
      if (char === 'P') {
        startPos = {
          x: col * TILE_SIZE + TILE_SIZE / 2,
          y: row * TILE_SIZE + TILE_SIZE / 2
        };
      } else if (char === 'G') {
        goalPos = {
          x: col * TILE_SIZE + TILE_SIZE / 2,
          y: row * TILE_SIZE + TILE_SIZE / 2
        };
      }
    }
  }
  
  if (!startPos || !goalPos) {
    throw new Error('Map must contain both P (start) and G (goal)');
  }
  
  // Strip P and G from the map
  const cleanMap = mapLines.map(line => 
    line.replace(/P/g, '.').replace(/G/g, '.')
  );
  
  return pathFind(cleanMap, startPos, goalPos);
}

describe('pathFind helper', () => {
  it('returns a diagonal direction in an open field', () => {
    const mapAscii = Array(5).fill('.....'); // 5×5 empty grid

    // Start at (0,0) – top-left cell centre
    const botPos = { x: TILE_SIZE / 2, y: TILE_SIZE / 2 };
    // Goal at (4,4) – bottom-right cell centre
    const goalPos = {
      x: 4 * TILE_SIZE + TILE_SIZE / 2,
      y: 4 * TILE_SIZE + TILE_SIZE / 2,
    };

    const dir = pathFind(mapAscii, botPos, goalPos);

    // Should point roughly down-right (dx ≈ dy ≈ 0.707)
    expect(dir.dx).toBeGreaterThan(0.6);
    expect(dir.dy).toBeGreaterThan(0.6);
    expect(Math.abs(dir.dx - dir.dy)).toBeLessThan(0.1);
    expect(mag(dir)).toBeCloseTo(1, 3);
  });

  it('avoids a vertical wall blocking the straight path', () => {
    /* Grid (5×5)
       0 1 2 3 4
     0 . . . . .
     1 . H . . .
     2 . H . . .
     3 . H . . .
     4 . . . . .
       Start = cell (0,2) centre
       Goal  = cell (4,2) centre
       Direct horizontal is blocked by the H column, so the first
       direction must include a vertical component (dy ≠ 0).
    */
    const mapAscii = [
      '.H...',
      '.H...',
      '.H...',
      '.H...',
      '.....',
    ];

    const botPos = { x: TILE_SIZE / 2, y: 2 * TILE_SIZE + TILE_SIZE / 2 };
    const goalPos = {
      x: 4 * TILE_SIZE + TILE_SIZE / 2,
      y: 2 * TILE_SIZE + TILE_SIZE / 2,
    };

    const dir = pathFind(mapAscii, botPos, goalPos);
    console.log('vertical wall test dir: ', dir);

    expect(dir.dx).toBeCloseTo(0, 3);       // not running right into the wall
    expect(Math.abs(dir.dy)).toBeGreaterThan(0.9); // must move up or down to skirt wall
    expect(mag(dir)).toBeCloseTo(1, 3);
  });

  it('returns zero vector when already at the goal', () => {
    const mapAscii = ['.'];
    const botPos = { x: TILE_SIZE / 2, y: TILE_SIZE / 2 };
    const goalPos = { ...botPos };

    const dir = pathFind(mapAscii, botPos, goalPos);

    expect(dir.dx).toEqual(0);
    expect(dir.dy).toEqual(0);
  });

  it("doesn't try to go through corners", () => {
    const mapAscii = [
      'G....',
      '..HH.',
      '.HP..',
      '.HHH.',
      '.....'
    ];
    
    const dir = testPathFind(mapAscii);
    
    console.log('Direction returned:', dir);
    
    // P is at (2, 2) and needs to go right first to avoid the corner
    // Should point exactly right (dx = 1, dy = 0)
    expect(dir.dx).toBeCloseTo(1, 3);
    expect(dir.dy).toBeCloseTo(0, 3);
    expect(mag(dir)).toBeCloseTo(1, 3);
  });
});

describe('hasLOS helper', () => {
  it('blocks LOS that would cut a corner diagonally', () => {
    const mapAscii = [
      'G....',
      '..HH.',
      '.H...', // P would be at (2,2) in testPathFind below
      '.HHH.',
      '.....',
    ];

    const start: { row: number; col: number } = { row: 2, col: 2 };
    const blockedTarget: { row: number; col: number } = { row: 1, col: 1 }; // NW diagonal

    expect(hasLOS(mapAscii, toPixelCentre(start), blockedTarget)).toBe(false);
  });

  it('allows LOS in open space', () => {
    const openMap = Array(3).fill('...');

    expect(hasLOS(openMap, toPixelCentre({ row: 0, col: 0 }), { row: 2, col: 2 })).toBe(true);
  });
});