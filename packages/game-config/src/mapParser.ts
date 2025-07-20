/**
 * ASCII map parser
 *
 * A designer provides a grid of characters, e.g.
 * ```
 * WWWWWWWWW
 * W..B..P.W
 * WCCHHC..W
 * W2..1...W
 * WWWWWWWWW
 * ```
 * Call `parseAsciiMap(ascii)` to get WallSegment[], bases, checkpoints, powerUps.
 *
 * Legend (editable in CHAR object):
 *  - – horizontal thin wall
 *  | – vertical   thin wall
 *  + – connector (joins all adjacent wall edges)
 *  H – heavy/full block (solid cell, outer edges become walls)
 *  B – base spawn (Orb modes)
 *  P – power-up spawn (type randomised later)
 *  0-9 A-Z – checkpoints in the given order
 */

import type { ParsedMap, Vector2D, WallSegment } from './types.js';
import { TILE_SIZE } from './constants.js';

const CELL = TILE_SIZE; // px per ASCII cell

const CHAR = {
  wallHoriz: '-',
  wallVert: '|',
  block: 'H',
  base: 'B',
  power: 'P',
  connector: '+',
} as const;

const ORDER_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Convert an ASCII grid into engine geometry.
 * @param ascii  multi-line string or string[]
 * @param cellSize overrides the default 20px grid if needed
 */
export function parseAsciiMap(
  ascii: string | string[],
  cellSize: number = CELL
): ParsedMap {
  const rows = (Array.isArray(ascii) ? ascii : ascii.split('\n'))
    .map(r => r.replace(/\r/g, '')) // windows newlines
    .filter(r => r.length > 0);

  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));

  const get = (x: number, y: number): string | undefined =>
    rows[y]?.[x];

  const walls: WallSegment[] = [];
  const bases: Vector2D[] = [];
  const powerUps: Vector2D[] = [];
  const blocks: { x: number; y: number; width: number; height: number }[] = [];
  const checkpointMap = new Map<string, Vector2D>();

  const center = (x: number, y: number): Vector2D => ({
    x: x * cellSize + cellSize / 2,
    y: y * cellSize + cellSize / 2,
  });

  const addWall = (start: Vector2D, end: Vector2D): void => {
    walls.push({ start, end });
  };

  const isWallChar = (ch: string | undefined): boolean => {
    return ch === CHAR.wallHoriz || ch === CHAR.wallVert || ch === CHAR.block || ch === CHAR.connector;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = get(x, y);
      if (!ch) continue;
      

      // ---------- Bases ----------
      if (ch === CHAR.base) {
        bases.push(center(x, y));
        continue; // B is empty space otherwise
      }

      // ---------- Power-ups ----------
      if (ch === CHAR.power) {
        powerUps.push(center(x, y));
        continue;
      }

      // ---------- Checkpoints ----------
      if (ORDER_CHARS.includes(ch) && ch !== CHAR.block) {
        checkpointMap.set(ch, center(x, y));
        continue;
      }

      // ---------- Heavy blocks ----------
      if (ch === CHAR.block) {
        // Add as a filled block instead of walls
        blocks.push({
          x: x * cellSize,
          y: y * cellSize,
          width: cellSize,
          height: cellSize
        });
        continue;
      }

      // ---------- Thin walls ----------
      if (ch === CHAR.wallHoriz) {
        const yMid = y * cellSize + cellSize / 2;
        addWall(
          { x: x * cellSize, y: yMid },
          { x: (x + 1) * cellSize, y: yMid }
        );
        continue;
      }

      if (ch === CHAR.wallVert) {
        const xMid = x * cellSize + cellSize / 2;
        addWall(
          { x: xMid, y: y * cellSize },
          { x: xMid, y: (y + 1) * cellSize }
        );
        continue;
      }

      // ---------- Connector ----------
      if (ch === CHAR.connector) {
        const connectorCenter = center(x, y);
        const neighbors = [
          { dx: 0, dy: -1 }, // up
          { dx: 1, dy: 0 },  // right
          { dx: 0, dy: 1 },  // down
          { dx: -1, dy: 0 }, // left
        ];

        for (const { dx, dy } of neighbors) {
          const neighborChar = get(x + dx, y + dy);
          if (isWallChar(neighborChar)) {
            const neighborCenter = center(x + dx, y + dy);
            addWall(connectorCenter, neighborCenter);
          }
        }
        continue;
      }
    }
  }

  // ----- Sort checkpoints by glyph order -----
  const checkpoints = Array.from(checkpointMap.entries())
    .sort(([a], [b]) => ORDER_CHARS.indexOf(a) - ORDER_CHARS.indexOf(b))
    .map(([, pos]) => pos);

  return { walls, blocks, bases, checkpoints, powerUps };

  // ---------- helper ----------
  function isBlock(ix: number, iy: number): boolean {
    const c = get(ix, iy);
    return c === CHAR.block;
  }
}