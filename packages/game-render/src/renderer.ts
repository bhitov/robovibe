import type { GameState, Bot, Orb, Base, OrbGameState, TankGameState } from '@repo/game-engine';
import { TILE_SIZE, BOT_RADIUS, ORB_RADIUS, BASE_RADIUS, POWER_UP_RADIUS } from '@repo/game-config';
import { FILE_LIST } from './file-list';

const GRID_SIZE = TILE_SIZE;

/**
 * Mapping from 4-bit neighbour signature (TRBL) to tile filename.
 * 1 = neighbour present, 0 = none.
 * Fallback to "fill.png" if key not found.
 */
// const TILE_LOOKUP: Record<string, string> = {
//   '0000': 'single.png',
//   '0100': 'horizontal_left.png',   // right
//   '0001': 'horizontal_right.png',  // left
//   '0101': 'horizontal_center.png', // left + right
//   '1000': 'vertical_bottom.png',   // top
//   '0010': 'vertical_top.png',      // bottom
//   '1010': 'vertical_center.png',   // top + bottom
//   '1100': 'bend_top_right.png',
//   '1001': 'bend_top_left.png',
//   '0110': 'bend_bottom_right.png',
//   '0011': 'bend_bottom_left.png',
//   // 3+ neighbours → four_corners
//   '1101': 'four_corners.png',
//   '1110': 'four_corners.png',
//   '0111': 'four_corners.png',
//   '1011': 'four_corners.png',
//   '1111': 'four_corners.png'
// };

type TileCache = Record<string, Record<string, HTMLImageElement>>;
const TILE_CACHE: TileCache = {};

/**
 * Ensure all required tile images for a colour are loaded.
 */
function loadTileImages(colour: string): void {
  if (TILE_CACHE[colour]) return; // Already loaded

  TILE_CACHE[colour] = {};
  const filenames = new Set<string>([...FILE_LIST])
  filenames.forEach(name => {
    const img = new Image();
    img.src = new URL(`../assets/${colour}/${name}`, import.meta.url).href;
    TILE_CACHE[colour]![name] = img;
  });
}

/**
 * Compute flags for 8-direction neighbours around a cell.
 */
function getNeighbourFlags(
  map: string[],
  row: number,
  col: number,
  isWall: (ch: string) => boolean
): boolean[] {
  const maxRow = map.length - 1;
  const maxCol = (map[0]?.length ?? 0) - 1;

  const charAt = (r: number, c: number): string =>
    r < 0 || r > maxRow || c < 0 || c > maxCol ? ' ' : (map[r]?.[c] ?? ' ');

  return [
    isWall(charAt(row - 1, col)),     // 0: N
    isWall(charAt(row - 1, col + 1)), // 1: NE
    isWall(charAt(row, col + 1)),     // 2: E
    isWall(charAt(row + 1, col + 1)), // 3: SE
    isWall(charAt(row + 1, col)),     // 4: S
    isWall(charAt(row + 1, col - 1)), // 5: SW
    isWall(charAt(row, col - 1)),     // 6: W
    isWall(charAt(row - 1, col - 1))  // 7: NW
  ];
}

/**
 * Decide which tile file to use based on 8-direction neighbour presence.
 * Falls back to 4-direction table if no explicit match exists.
 *
 * neighbours = [N, NE, E, SE, S, SW, W, NW]
 */
function determineTileFilename(neighbours: boolean[]): string {
  // return 'fill.png';
  // console.log(neighbours);
  const [N, NE, E, SE, S, SW, W, NW] = neighbours;

  if (W && N && E && S) {
    if (NE && SE && NW && SW) return 'fill.png';

    if (!NE && SE && NW && SW) return 'one_corners_top_right.png';
    if (NE && !SE && NW && SW) return 'one_corners_bottom_right.png';
    if (NE && SE && !NW && SW) return 'one_corners_top_left.png';
    if (NE && SE && NW && !SW) return 'one_corners_bottom_left.png';

    if (NW && NE) return 'two_corners_bottom.png'
    if (NE && SE) return 'two_corners_left.png'
    if (SE && SW) return 'two_corners_top.png'
    if (SW && NW) return 'two_corners_right.png'

    if (NW && SE) return 'fill.png'
    if (NE && SW) return 'fill.png'


    if (NE) return 'three_corners_top_right.png'
    if (SE) return 'three_corners_bottom_right.png'
    if (SW) return 'three_corners_bottom_left.png'
    if (NW) return 'three_corners_top_left.png'

    return 'four_corners.png'

  }

  if (!W && N && E && S) {
    if (NE && SE) return 'left.png';
    if (NE) return 'vertical_inner_connector_top_left.png'
    if (SE) return 'vertical_inner_connector_bottom_left.png'
    return 'vertical_single_connector_right.png'
  }

  if (W && N && !E && S) {
    if (NW && SW) return 'right.png';
    if (NW) return 'vertical_inner_connector_top_right.png'
    if (SW) return 'vertical_inner_connector_bottom_right.png'
    return 'vertical_single_connector_left.png'
  }

  if (W && !N && E && S) {
    if (SW && SE) return 'top.png';
    if (SW) return 'horizontal_inner_connector_top_left.png'
    if (SE) return 'horizontal_inner_connector_top_right.png'
    return 'horizontal_single_connector_bottom.png'
  }

  if (W && N && E && !S) {
    if (NW && NE) return 'bottom.png';
    if (NW) return 'horizontal_inner_connector_bottom_left.png'
    if (NE) return 'horizontal_inner_connector_bottom_right.png'
    return 'horizontal_single_connector_top.png'
  }


  if (N && S) return 'vertical_center.png'
  if (W && E) return 'horizontal_center.png'

  if (N && E) return NE ? 'bottom_left_outer.png' : 'bend_bottom_left.png';
  if (S && E) return SE ? 'top_left_outer.png' : 'bend_top_left.png';

  if (N && W) return NW ? 'bottom_right_outer.png' : 'bend_bottom_right.png';
  if (S && W) return SW ? 'top_right_outer.png' : 'bend_top_right.png';

  if (S) return 'vertical_top.png'
  if (N) return 'vertical_bottom.png'
  if (E) return 'horizontal_left.png'
  if (W) return 'horizontal_right.png'

  return 'single.png'

  // throw new Error('No tile found ');

  // return 'horizontal_single_connector_top.png'


  // SHOULD BE DONE HERE


//   if (N && E && !S && !W) return 'bend_top_right.png';
// 
//   // Straight vertical & horizontal
//   if (N && S && !E && !W) return 'vertical_center.png';
//   if (E && W && !N && !S) return 'horizontal_center.png';
// 
//   // Vertical ends
//   if (S && !N && !E && !W) return 'vertical_top.png';
//   if (N && !S && !E && !W) return 'vertical_bottom.png';
// 
//   // Horizontal ends
//   if (W && !E && !N && !S) return 'horizontal_right.png';
//   if (E && !W && !N && !S) return 'horizontal_left.png';
// 
//   // Outer corners (bend)
//   if (N && E && !S && !W) return 'bend_top_right.png';
//   if (N && W && !S && !E) return 'bend_top_left.png';
//   if (S && E && !N && !W) return 'bend_bottom_right.png';
// 
//   if (!W && N && E && S) {
//     if (NE && SE) return 'left.png';
//     if (NE) return 'vertical_inner_connector_top_left.png'
//     if (SE) return 'vertical_inner_connector_bottom_left.png'
//     return 'vertical_single_connector_right.png'
//   }
// 
//   if (W && N && !E && S) {
//     if (NE && SE) return 'left.png';
//     if (NE) return 'vertical_inner_connector_top_right.png'
//     if (SE) return 'vertical_inner_connector_bottom_right.png'
//     return 'vertical_single_connector_left.png'
//   }
// 
//   if (W && !N && E && S) return 'top_right_outer.png';
//   if (W && N && !E && S) return 'bottom_left_outer.png';
//   if (W && N && E && !S) return 'bottom_right_outer.png';
// 
//   if (N && E && !S && !W) return NE ? 'bend_bottom_left.png' : 'bottom_left_outer.png';
//   if (S && W && !N && !E) return NW ? 'bend_top_right.png' : 'top_right_outer.png';
//   if (S && E && !N && !W) return SE ? 'bend_top_left.png' : 'top_left_outer.png';
//   if (N && W && !S && !E) return SW ? 'bend_bottom_right.png' : 'bottom_right_outer.png';
// 
//   // Inner connectors (placeholder – tweak later)
//   if (E && W && N && !S) return 'horizontal_single_connector_top.png';
//   if (E && W && S && !N) return 'horizontal_single_connector_bottom.png';
//   if (N && S && W && !E) return 'vertical_single_connector_left.png';
//   if (N && S && E && !W) return 'vertical_single_connector_right.png';
// 
//   // Fallback to 4-direction key lookup
//   const key4 =
//     (N ? '1' : '0') +
//     (E ? '1' : '0') +
//     (S ? '1' : '0') +
//     (W ? '1' : '0');
//   return TILE_LOOKUP[key4] || 'fill.png';
}

/**
 * Draw the grid-aligned tile map using ASCII data.
 */
function drawTileMap(
  ctx: CanvasRenderingContext2D,
  mapAscii: string[] | undefined,
  colour: string
): void {
  if (!mapAscii) return;

  loadTileImages(colour);
  const imgCache = TILE_CACHE[colour];
  const heightCells = mapAscii.length;
  const widthCells = mapAscii[0]?.length ?? 0;

  const isWallChar = (ch: string): boolean =>
    ch === 'H' || ch === '-' || ch === '|' || ch === '+';

  for (let row = 0; row < heightCells; row++) {
    for (let col = 0; col < widthCells; col++) {
      const ch = mapAscii[row]?.[col];
      if (!ch) continue;
      if (!isWallChar(ch)) continue;

      const neighbours = getNeighbourFlags(mapAscii, row, col, isWallChar);
      const file = determineTileFilename(neighbours);
      // console.log(file);
      const img = imgCache?.[file];
      if (!img) continue;

      if (img.complete) {
        ctx.drawImage(img, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else {
        img.onload = () => {
          ctx.drawImage(img, col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        };
      }
    }
  }
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  width: number,
  height: number,
  showAsciiOverlay = false,
  tileColor: string = 'blue', // new parameter
  winConditionType?: string
): void {
  // Clear canvas
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  // Draw tile map first (based on ASCII, not walls list)
  drawTileMap(ctx, gameState.mapAscii, tileColor);

  // Draw grid overlay for debugging (optional; kept)
  // drawGrid(ctx, width, height);


  // Draw checkpoints (Race games only)
  if ('checkpoints' in gameState && Array.isArray(gameState.checkpoints)) {
    gameState.checkpoints.forEach((checkpoint, index) => {
      ctx.fillStyle = index === 0 ? '#f59e0b' : '#3b82f6'; // Start/finish line is orange
      ctx.beginPath();
      ctx.arc(checkpoint.x, checkpoint.y, 20, 0, Math.PI * 2);
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Draw checkpoint number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${index}`, checkpoint.x, checkpoint.y);
    });
  }

  // Draw bases (Orb games only)
  if ('bases' in gameState) {
    for (const base of gameState.bases.values()) {
      drawBase(ctx, base);
    }
  }

  // Draw orbs (Orb games only)
  if ('orbs' in gameState) {
    for (const orb of gameState.orbs.values()) {
      drawOrb(ctx, orb);
    }
  }

  // Draw bots
  for (const bot of gameState.bots.values()) {
    drawBot(ctx, bot, gameState.tickCount);
  }

  if ('powerUps' in gameState) {
    for (const pu of gameState.powerUps.values()) {
      drawPowerUp(ctx, pu);
    }
  }

  // Draw projectiles (Tank games only)
  if ('projectiles' in gameState) {
    for (const projectile of gameState.projectiles.values()) {
      drawProjectile(ctx, projectile);
    }
  }

  // Draw pipes (Flappy games only)
  if ('pipes' in gameState && Array.isArray(gameState.pipes)) {
    
    for (const pipe of gameState.pipes) {
      drawPipe(ctx, pipe, height);
    }
  }

  // Draw score
  drawScore(ctx, gameState, width, winConditionType);

  // Draw winner overlay
  if (gameState.winner) {
    const orbsToWin = 'orbsToWin' in gameState ? gameState.orbsToWin : undefined;
    drawWinnerOverlay(ctx, gameState.winner, width, height, orbsToWin);
  }
  
  // Draw ASCII overlay if enabled
  if (showAsciiOverlay && gameState.mapAscii) {
    drawAsciiOverlay(ctx, gameState.mapAscii, width, height);
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= width; x += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawBot(ctx: CanvasRenderingContext2D, bot: Bot, tickCount: number): void {
  const { x, y } = bot.position;

  // Star glow
  if ((bot as any).starTicks > 0) {    // passed via engine in botProgress
    const g = ctx.createRadialGradient(x, y, 0, x, y, BOT_RADIUS * 3);
    g.addColorStop(0, '#facc15');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(x - BOT_RADIUS * 3, y - BOT_RADIUS * 3, BOT_RADIUS * 6, BOT_RADIUS * 6);
  }

  ctx.save();
  // apply rotation if defined
  if (bot.rotation !== undefined) {
    ctx.translate(x, y);
    ctx.rotate((bot.rotation * Math.PI) / 180);
    ctx.translate(-x, -y);
  }

  // Wing/flap effect: small upward triangle for 5 ticks after flap
  const recentlyFlapped =
    bot.lastFlapTick !== undefined && tickCount - bot.lastFlapTick < 5;

  // Bot glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, BOT_RADIUS * 2);
  gradient.addColorStop(0, bot.color + '40');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - BOT_RADIUS * 2, y - BOT_RADIUS * 2, BOT_RADIUS * 4, BOT_RADIUS * 4);

  // Body
  ctx.fillStyle = bot.color;
  ctx.beginPath();
  ctx.arc(x, y, BOT_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Wing
  if (recentlyFlapped) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 6, y - 10);
    ctx.lineTo(x + 6, y - 10);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();

  // Bot border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, BOT_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Velocity indicator
  if (bot.velocity.x !== 0 || bot.velocity.y !== 0) {
    ctx.strokeStyle = bot.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + bot.velocity.x * 3, y + bot.velocity.y * 3);
    ctx.stroke();
  }

  // Orb indicator if carrying
  if (bot.hasOrb) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x, y - BOT_RADIUS - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect for carried orb
    const orbGlow = ctx.createRadialGradient(x, y - BOT_RADIUS - 5, 0, x, y - BOT_RADIUS - 5, 8);
    orbGlow.addColorStop(0, '#fbbf2480');
    orbGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGlow;
    ctx.fillRect(x - 12, y - BOT_RADIUS - 17, 24, 24);
  }
}

function drawOrb(ctx: CanvasRenderingContext2D, orb: Orb): void {
  const { x, y } = orb.position;

  // Orb glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, ORB_RADIUS * 3);
  gradient.addColorStop(0, '#fbbf2480');
  gradient.addColorStop(0.5, '#fbbf2440');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - ORB_RADIUS * 3, y - ORB_RADIUS * 3, ORB_RADIUS * 6, ORB_RADIUS * 6);

  // Orb body
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(x, y, ORB_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Inner glow
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, ORB_RADIUS / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBase(ctx: CanvasRenderingContext2D, base: Base): void {
  const { x, y } = base.position;
  const baseColor = base.team === 0 ? '#3b82f6' : base.team === 1 ? '#ef4444' : '#22c55e';

  // Base glow
  const gradient = ctx.createRadialGradient(x, y, BASE_RADIUS / 2, x, y, BASE_RADIUS * 2);
  gradient.addColorStop(0, baseColor + '60');
  gradient.addColorStop(0.5, baseColor + '30');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - BASE_RADIUS * 2, y - BASE_RADIUS * 2, BASE_RADIUS * 4, BASE_RADIUS * 4);

  // Base ring
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, BASE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = baseColor + '80';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, BASE_RADIUS - 5, 0, Math.PI * 2);
  ctx.stroke();

  // Deposited orbs counter
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(base.orbsDeposited.toString(), x, y);
}

function drawScore(ctx: CanvasRenderingContext2D, gameState: GameState, width: number, winConditionType?: string): void {
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let y = 10;
  if ('bases' in gameState) {
    for (const base of gameState.bases.values()) {
      const bot = Array.from(gameState.bots.values()).find(b => b.playerId === base.playerId);
      if (bot) {
        ctx.fillStyle = bot.color;
        ctx.fillText(`${bot.nickname}: ${String(base.orbsDeposited)} orbs`, 10, y);
        y += 20;
      }
    }
  }
  
  // Draw lives for tank mode (elimination win condition)
  if (winConditionType === 'elimination') {
    for (const bot of gameState.bots.values()) {
      if (bot.lives !== undefined && bot.lives > 0) {
        // Draw player name
        ctx.fillStyle = bot.color;
        ctx.fillText(`${bot.nickname}:`, 10, y);
        
        // Draw life indicators as circles (similar to orbs)
        const nameWidth = ctx.measureText(`${bot.nickname}: `).width;
        for (let i = 0; i < bot.lives; i++) {
          const lifeX = 10 + nameWidth + i * 20;
          const lifeY = y + 7;
          
          // Life circle with glow
          const gradient = ctx.createRadialGradient(lifeX, lifeY, 0, lifeX, lifeY, 8);
          gradient.addColorStop(0, bot.color + '80');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(lifeX - 8, lifeY - 8, 16, 16);
          
          // Life circle
          ctx.fillStyle = bot.color;
          ctx.beginPath();
          ctx.arc(lifeX, lifeY, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Inner highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(lifeX - 1, lifeY - 1, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        y += 20;
      }
    }
  }

  // Tick counter
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'right';
  ctx.fillText(`Tick: ${String(gameState.tickCount)}`, width - 10, 10);
}

function drawWinnerOverlay(ctx: CanvasRenderingContext2D, winner: string, width: number, height: number, orbsToWin?: number): void {
  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, height);

  // Winner text
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${winner} Wins!`, width / 2, height / 2);

  // Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  if (orbsToWin) {
    ctx.fillText(`First to ${orbsToWin} orbs!`, width / 2, height / 2 + 40);
  } else {
    ctx.fillText('Victory!', width / 2, height / 2 + 40);
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: { position: { x: number; y: number } }): void {
  const { x, y } = p.position;
  ctx.fillStyle = '#f97316'; // orange shell
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();

  // small glow
  const glowRadius = 10;
  const g = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  g.addColorStop(0, '#fdba7490');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(x - glowRadius, y - glowRadius, glowRadius * 2, glowRadius * 2);
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: { position: { x: number; y: number }; type: string }): void {
  const { x, y } = pu.position;
  switch (pu.type) {
    case 'speed':
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.arc(x, y, POWER_UP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', x, y);
      break;
    case 'star':
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(x, y - POWER_UP_RADIUS);
      for (let i = 1; i < 5; i++) {
        const angle = i * (Math.PI * 2) / 5 - Math.PI / 2;
        ctx.lineTo(x + Math.cos(angle) * POWER_UP_RADIUS, y + Math.sin(angle) * POWER_UP_RADIUS);
      }
      ctx.closePath();
      ctx.fill();
      break;
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: any, canvasHeight: number): void {
  const pipeWidth = 50;
  const pipeColor = '#22c55e';
  const pipeGap = pipe.gapY ? 120 : 120; // Default gap if not specified
  
  ctx.fillStyle = pipeColor;
  
  // Top pipe
  ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapY - pipeGap / 2);
  
  // Bottom pipe
  ctx.fillRect(pipe.x, pipe.gapY + pipeGap / 2, pipeWidth, canvasHeight - (pipe.gapY + pipeGap / 2));
  
  // Pipe borders
  ctx.strokeStyle = '#166534';
  ctx.lineWidth = 2;
  ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.gapY - pipeGap / 2);
  ctx.strokeRect(pipe.x, pipe.gapY + pipeGap / 2, pipeWidth, canvasHeight - (pipe.gapY + pipeGap / 2));
}

function drawAsciiOverlay(ctx: CanvasRenderingContext2D, mapAscii: string[], width: number, height: number): void {
  if (!mapAscii || mapAscii.length === 0) return;
  
  // Calculate cell dimensions based on map size
  const cellWidth = width / (mapAscii[0]?.length ?? 1);
  const cellHeight = height / mapAscii.length;
  
  // Semi-transparent overlay background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, height);
  
  // Draw ASCII characters
  ctx.font = `${Math.min(cellWidth, cellHeight) * 0.8}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let y = 0; y < mapAscii.length; y++) {
    const row = mapAscii[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char && char !== ' ') {
        // Color based on character type
        switch (char) {
          case 'H':
            ctx.fillStyle = '#6b7280'; // Gray for blocks
            break;
          case '-':
          case '|':
          case '+':
            ctx.fillStyle = '#4b5563'; // Darker gray for walls
            break;
          case 'B':
            ctx.fillStyle = '#3b82f6'; // Blue for bases
            break;
          case 'P':
            ctx.fillStyle = '#10b981'; // Green for power-ups
            break;
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            ctx.fillStyle = '#f59e0b'; // Orange for checkpoints
            break;
          default:
            ctx.fillStyle = '#ffffff'; // White for other characters
        }
        
        ctx.fillText(
          char,
          x * cellWidth + cellWidth / 2,
          y * cellHeight + cellHeight / 2
        );
      }
    }
  }
}
