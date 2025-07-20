import { TILE_SIZE, BOT_RADIUS } from '@repo/game-config';

/**
 * Grid position helper.
 */
export interface GridPos {
  row: number;
  col: number;
}

/**
 * Thick line-of-sight check between two grid cells.
 * The strip width ≈ BOT_RADIUS ensures the bot (not a point) fits.
 * Strategy:
 *   • Work in pixel space for precision.
 *   • Compute all t values (0–1) where the *centre* segment crosses
 *     vertical or horizontal grid lines (x = n·TILE_SIZE, y = n·TILE_SIZE).
 *   • Sort {0,…intersections…,1}.  Each consecutive pair lies entirely
 *     inside a single tile.  Sample the midpoint tMid of that sub-segment.
 *   • For the thick strip, test offset points p ± n·halfWidth where
 *       n is the perpendicular unit vector.
 *   • If ANY sampled offset hits a solid tile → LOS blocked.
 */
export function hasLOS(
  mapAscii: string[],
  // a: GridPos,
  // a: GridPos,
  a: { x: number; y: number },
  b: GridPos
): boolean {
  const toPixelCentre = (g: GridPos): { x: number; y: number } => ({
    x: g.col * TILE_SIZE + TILE_SIZE / 2,
    y: g.row * TILE_SIZE + TILE_SIZE / 2,
  });

  const toGrid = (p: { x: number; y: number }): GridPos => ({
    row: Math.floor(p.y / TILE_SIZE),
    col: Math.floor(p.x / TILE_SIZE),
  });

  const inBounds = (g: GridPos): boolean =>
    g.row >= 0 &&
    g.row < mapAscii.length &&
    g.col >= 0 &&
    g.col < (mapAscii[g.row]?.length ?? 0);

  const isWalkable = (g: GridPos): boolean => {
    if (!inBounds(g)) return false;
    const ch = mapAscii[g.row]?.[g.col] ?? 'H';
    return ch !== 'H' && ch !== '-' && ch !== '|' && ch !== '+';
  };

  const startPix: { x: number; y: number } = a; //toPixelCentre(a);
  const endPix   = toPixelCentre(b);

  const vx = endPix.x - startPix.x;
  const vy = endPix.y - startPix.y;
  const len = Math.hypot(vx, vy) || 1;
  // Unit vectors
  const ux = vx / len;
  const uy = vy / len;
  const nx = -uy;  // perpendicular
  const ny =  ux;
  const halfWidth = TILE_SIZE * .90; // BOT_RADIUS; // * 0.9;

  // Gather intersection parameters (t) with vertical grid lines
  const ts: number[] = [0, 1]; // include segment ends
  if (vx !== 0) {
    const xMin = Math.min(startPix.x, endPix.x);
    const xMax = Math.max(startPix.x, endPix.x);
    const colStart = Math.floor(xMin / TILE_SIZE);
    const colEnd   = Math.floor(xMax / TILE_SIZE);
    for (let c = colStart; c <= colEnd; c++) {
      const xLine = c * TILE_SIZE;
      const t = (xLine - startPix.x) / vx;
      if (t > 0 && t < 1) ts.push(t);
    }
  }
  // Intersection parameters with horizontal grid lines
  if (vy !== 0) {
    const yMin = Math.min(startPix.y, endPix.y);
    const yMax = Math.max(startPix.y, endPix.y);
    const rowStart = Math.floor(yMin / TILE_SIZE);
    const rowEnd   = Math.floor(yMax / TILE_SIZE);
    for (let r = rowStart; r <= rowEnd; r++) {
      const yLine = r * TILE_SIZE;
      const t = (yLine - startPix.y) / vy;
      if (t > 0 && t < 1) ts.push(t);
    }
  }

  ts.sort((p, q) => p - q);

  // For every sub-segment, sample at midpoint
  for (let i = 0; i < ts.length - 1; i++) {
    const tMid = (ts[i]! + ts[i + 1]!) / 2;
    const cx = startPix.x + vx * tMid;
    const cy = startPix.y + vy * tMid;

    for (const sign of [-1, 1] as const) {
      const px = cx + nx * halfWidth * sign;
      const py = cy + ny * halfWidth * sign;
      const cell: GridPos = toGrid({ x: px, y: py });
      if (!isWalkable(cell)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Direction vector returned to the bot loop.
 * dx / dy are already normalised to a maximum length of 1
 * so they can be fed straight into a `{type:'move', dx, dy}` action.
 */
export interface DirVector {
  dx: number;
  dy: number;
}

/**
 * A* path-finder for bot code.
 *
 * mapAscii        – Same array the engine provides to every bot.
 * botPos / goalPos – Pixel coordinates ({x,y}) in the arena space.
 *
 * The algorithm:
 *   1. Converts pixel coordinates → grid cells using TILE_SIZE.
 *   2. Runs A* over an 8-connected grid (diagonals allowed) where
 *      'H', '-', '|', '+' are solid obstacles.
 *   3. If a path is found, takes the first step on that path,
 *      converts that step’s *centre pixel* back to arena coords,
 *      and returns the *normalised* vector from bot → that centre.
 *
 * It is intentionally simple (array open set) to minimise code size;
 * maps are small (≤ 30x15) so performance is fine.
 */
export function pathFind(
  mapAscii: string[],
  botPos: { x: number; y: number },
  goalPos: { x: number; y: number }
): DirVector {

  const output = (x: number, y: number) => ({ dx: x, dy: y, x, y}) // ---------- helpers ----------
  const toGrid = (p: { x: number; y: number }): GridPos => ({
    row: Math.floor(p.y / TILE_SIZE),
    col: Math.floor(p.x / TILE_SIZE),
  });

  const toPixelCentre = (g: GridPos): { x: number; y: number } => ({
    x: g.col * TILE_SIZE + TILE_SIZE / 2,
    y: g.row * TILE_SIZE + TILE_SIZE / 2,
  });

  const key = (g: GridPos): string => `${g.row},${g.col}`;

  const inBounds = (g: GridPos): boolean =>
    g.row >= 0 &&
    g.row < mapAscii.length &&
    g.col >= 0 &&
    g.col < (mapAscii[g.row]?.length ?? 0);

  const isWalkable = (g: GridPos): boolean => {
    const ch = mapAscii[g.row]?.[g.col] ?? 'H';
    return ch !== 'H' && ch !== '-' && ch !== '|' && ch !== '+';
  };

  // ---------- early exits ----------
  const start = toGrid(botPos);
  const goal = toGrid(goalPos);

  if (start.row === goal.row && start.col === goal.col) {
    return output(0, 0);
  }
  if (!inBounds(goal) || !isWalkable(goal)) {
    return output(0, 0);
  }

  // ---------- A* search ----------
  interface Node extends GridPos {
    f: number;
    g: number;
  }

  const DIRS8: GridPos[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
//    { row: -1, col: -1 },
//    { row: -1, col: 1 },
//    { row: 1, col: -1 },
//    { row: 1, col: 1 },
  ];

  const open: Node[] = [{ ...start, f: 0, g: 0 }];
  const cameFrom = new Map<string, GridPos>();
  const gScore = new Map<string, number>().set(key(start), 0);

  const heur = (a: GridPos, b: GridPos): number =>
    Math.hypot(a.row - b.row, a.col - b.col);

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    if (current.row === goal.row && current.col === goal.col) break;

    for (const d of DIRS8) {
      const nb: GridPos = { row: current.row + d.row, col: current.col + d.col };
      if (!inBounds(nb) || !isWalkable(nb)) continue;

      const tentativeG = (gScore.get(key(current)) ?? Infinity) +
        (d.row === 0 || d.col === 0 ? 1 : Math.SQRT2);

      if (tentativeG < (gScore.get(key(nb)) ?? Infinity)) {
        cameFrom.set(key(nb), current);
        gScore.set(key(nb), tentativeG);
        open.push({ ...nb, g: tentativeG, f: tentativeG + heur(nb, goal) });
      }
    }
  }

  // ---------- reconstruct path ----------
  const path: GridPos[] = [];
  let step: GridPos | undefined = goal;
  while (step) {
    path.push(step);
    step = cameFrom.get(key(step));
    if (step && step.row === start.row && step.col === start.col) {
      path.push(start);
      break;
    }
  }
  if (path.length <= 1) return { dx: 0, dy: 0 };
  path.reverse(); // start → goal

  // ---------- line-of-sight smoothing ----------
// (old inline hasLOS removed – now using the exported helper)

  let targetCell = path[1]; // default: next step
  for (let i = path.length - 1; i >= 1; i--) {
    if (hasLOS(mapAscii, botPos, path[i]!)) {
    // if (hasLOS(mapAscii, start, path[i]!)) {
      targetCell = path[i];
      break;
    }
  }

  const targetPix = toPixelCentre(targetCell!);
  const vec = { dx: targetPix.x - botPos.x, dy: targetPix.y - botPos.y };
  const mag = Math.hypot(vec.dx, vec.dy) || 1;
  return output(vec.dx / mag, vec.dy / mag)
}