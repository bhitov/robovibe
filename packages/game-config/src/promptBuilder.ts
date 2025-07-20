import type { GameConfig } from './gameConfig.js';
import { TILE_SIZE } from './constants.js';

// Universal pre-prompt that explains the loop function structure
const UNIVERSAL_PRE_PROMPT = `You are a code generator for a game bot. Generate ONLY a JavaScript function with this exact signature:

function loop(input, store) {
  // Your code here
  return { action, store };
}

The function must:
- Take two parameters: input (game state) and store (persistent memory)
- Return an object with { action, store }
- The store object persists between ticks. Use it to remember state.
- Execute in under 25ms or it will be terminated

IMPORTANT: Return ONLY the function code, no explanations or markdown.`;

export function buildSystemPrompt(config: GameConfig): string {
  const parts: string[] = [UNIVERSAL_PRE_PROMPT];
  
  // Add input description
  parts.push('\nThe input object contains:');
  parts.push('- botPosition: {x, y} - bot\'s current position');
  parts.push('- velocity: {x, y} - bot\'s current velocity');
  
  if (config.allowedActions.fire) {
    parts.push('- health: number - current health (0-100)');
    parts.push('- canFire: boolean - whether tank can fire (not in cooldown)');
  }
  
  if (config.allowedActions.pickup) {
    parts.push('- hasOrb: boolean - whether bot is carrying an orb');
    parts.push('- orbs: Array of {id, position: {x, y}, distance}');
  }
  
  if (config.allowedActions.deposit) {
    parts.push('- base: {id, position: {x, y}, team?, distance} - your base');
  }
  
  if (config.allowedActions.fire) {
    parts.push('- tanks: Array of {id, position: {x, y}, rotation, health, distance}');
    parts.push('- projectiles: Array of {id, position: {x, y}, velocity: {x, y}, distance}');
  } else if (config.allowedActions.pickup || config.allowedActions.deposit) {
    parts.push('- enemies: Array of {id, position: {x, y}, team?, distance}');
  }
  
  // ASCII map information
  parts.push('- mapAscii: Array of strings - the game board layout as a text map (row 0 = top, increases downward)');
  parts.push('- gridPosition: {row, col} - your current position in the ASCII map grid (row 0 = top, col 0 = left)');
  parts.push(`- Each tile in the map is ${TILE_SIZE}x${TILE_SIZE} pixels`);
  parts.push('\nASCII Map Legend:');
  parts.push('  H = Block/Wall');
  
  if (config.allowedActions.pickup) {
    parts.push('  O = Orb (spawns in tile centers, one per tile)');
  }
  
  if (config.allowedActions.deposit) {
    parts.push('  B = Base');
  }
  
  if (config.checkpoints && config.checkpoints.length > 0) {
    parts.push('  0-9 = Checkpoints');
  }
  
  if (config.powerUpSpawns) {
    parts.push('  P = Power-up spawn location');
  }
  
  parts.push('  . or (space) = Empty space');
  
  if (config.powerUpSpawns) {
    parts.push('- powerUps: Array of {id, position: {x, y}, type, distance}');
  }
  
  if (config.checkpoints && config.checkpoints.length > 0) {
    parts.push('- nextCheckpoint: {x, y} - coordinates of the next checkpoint to reach');
    parts.push('- currentLap: number - number of completed laps');
    parts.push('- checkpoints: Array of {x, y} - all checkpoint positions in order');
  }
  
  // Add available actions
  parts.push('\nAvailable actions:');
  
  if (config.allowedActions.move) {
    parts.push('- {type: \'move\', dx: number, dy: number} - accelerate in direction (dx, dy)');
  }
  
  if (config.allowedActions.fire) {
    parts.push(`- {type: 'fire'} - fire a projectile (${String(config.fireCooldown ?? 90)} tick cooldown)`);
  }
  
  if (config.allowedActions.pickup) {
    parts.push(`- {type: 'pickup'} - pick up nearby orb (within ${String(config.pickupRadius ?? 20)} units) - orbs are NOT picked up automatically, you MUST use the pickup action`);
  }
  
  if (config.allowedActions.deposit) {
    parts.push(`- {type: 'deposit'} - deposit orb at base (within ${String(config.depositRadius ?? 30)} units) - orbs are NOT deposited automatically, you MUST use the deposit action`);
  }
  
  parts.push('- {type: \'idle\'} - do nothing');
  
  // Add game-specific details
  parts.push(`\nArena is ${String(config.arenaWidth)}x${String(config.arenaHeight)}.`);
  
  parts.push('Movement is physics-based with velocity and friction.');
  
  if (config.allowedActions.fire) {
    parts.push(`Projectiles travel at ${String(config.bulletSpeed ?? 8)} units/tick and do 20 damage.`);
  }
  
  if (config.powerUpSpawns) {
    parts.push('Power-ups: Speed (1.5x speed boost), Star (invincibility + stun enemies on contact)');
  }

  // Utility helpers available to your bot
  parts.push('\nUtility functions available:');
  parts.push('- pathFind(mapAscii, botPosition, goalPosition) → {dx,dy}\n' +
             '    Finds shortest path avoiding walls (H,-,|,+). Returns normalized direction vector.');
  
  // Add win condition
  switch (config.winCondition.type) {
    case 'orbs':
      parts.push(`\nWin by depositing ${String(config.winCondition.value)} orbs at your base.`);
      break;
    case 'elimination':
      parts.push('\nWin by being the last tank alive.');
      break;
    case 'survival':
      parts.push('\nWin by surviving the longest.');
      break;
    case 'laps':
      parts.push(`\nWin by completing ${String(config.winCondition.value)} laps around the track.`);
      break;
  }
  
  return parts.join('\n');
}

// Combined demo and bot prompts from all games
export const allDemoPrompts = [
  // Orb game prompts
  {
    name: "Orb Collector",
    text: "If I don't have an orb, move towards the nearest orb and pick it up. If I have an orb, move to my base and deposit it."
  },
  {
    name: "Orb Collector Avoider",
    text: "If I don't have an orb, move towards the nearest orb and pick it up. If I have an orb, move to my base and deposit it. " +
          "Use the mapAscii to plan routes around walls (H characters) and check my gridPosition to understand where I am"
  },
  {
    name: "Strategic Collector",
    text: "Find the orb that is furthest from enemy bots and closest to my base, then collect it."
  },
  {
    name: "Aggressive Blocker",
    text: "If an enemy has an orb, move to block their path to their base. Otherwise collect orbs normally."
  },
  
  // Tank prompts
  {
    name: "Tank Hunter",
    text: "Turn towards the nearest enemy tank and fire. Move forward while firing to close distance."
  },
  {
    name: "Circle Strafer",
    text: "Circle around enemies while keeping them in my sights. Fire whenever I can."
  },
  {
    name: "Defensive Tank",
    text: "Keep distance from enemies. Turn and fire at approaching tanks, then back away."
  },
  
  // Flappy prompts
  {
    name: "Simple Flapper",
    text: "Flap when my y position is greater than 200"
  },
  {
    name: "Steady Flight",
    text: "Try to maintain altitude at y=150 by flapping when below that height"
  },
  {
    name: "Pipe Navigator",
    text: "Look ahead for the next pipe gap and flap to align with its center"
  },
  
  // Race prompts
  {
    name: "Simple Racer",
    text: "Always move forward at full speed and turn towards the next checkpoint"
  },
  {
    name: "Speed Demon",
    text: "Head towards the nearest speed boost powerup, then race to checkpoints"
  },
  {
    name: "Aggressive Racer",
    text: "If I have star power, ram into nearby opponents. Otherwise focus on checkpoints and grab powerups when close"
  },
  
  // Universal prompts
  {
    name: "Just Up",
    text: "Move straight up continuously"
  },
  {
    name: "Spinner",
    text: "Turn in circles while moving forward slowly"
  },
  {
    name: "Wanderer",
    text: "Move in random directions, changing direction every 30 ticks (use store.tick to count)"
  }
];

// Bot strategy prompts
export const botStrategyPrompts = [
  "Move efficiently and complete the objective as quickly as possible",
  "Avoid enemies while focusing on the main goal",
  "Use aggressive tactics to disrupt opponents",
  "Play defensively and survive as long as possible",
  "Balance offense and defense based on the situation",
  "Exploit game mechanics to gain an advantage",
  "Adapt strategy based on enemy behavior",
  "Focus on controlling key areas of the map",
  "Prioritize targets based on threat level",
  "Use hit-and-run tactics to stay safe"
];