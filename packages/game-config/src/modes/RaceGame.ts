import type { GameModeConfig, GameSettings } from '../types.js';

// Define PowerUpType locally to avoid circular dependency
enum PowerUpType {
  Speed = 'speed',
  Star = 'star'
}

export const simpleCircuit = {
  name: 'Simple Circuit',
  walls: [
    // rectangular outer bounds (redundant segments ok)
    { start: { x: 50, y: 50 }, end: { x: 550, y: 50 } },
    { start: { x: 550, y: 50 }, end: { x: 550, y: 350 } },
    { start: { x: 550, y: 350 }, end: { x: 50, y: 350 } },
    { start: { x: 50, y: 350 }, end: { x: 50, y: 50 } },
  ],
  checkpoints: [
    { x: 100, y: 200 }, // start/finish
    { x: 300, y: 60 },
    { x: 500, y: 200 },
    { x: 300, y: 340 },
  ],
  powerUps: [
    { position: { x: 300, y: 200 }, type: PowerUpType.Speed },
    { position: { x: 300, y: 120 }, type: PowerUpType.Star },
  ],
};

export const RaceGameConfig: GameModeConfig = {
  systemPrompt: `You are a code generator for a racing bot. Generate ONLY a JavaScript function with this exact signature:

function loop(input, store) {
  // Your code here
  return { action, store };
}

The input object contains:
- botPosition: {x, y} - kart's current position
- velocity: {x, y} - kart's current velocity
- rotation: number - kart's rotation in degrees
- nextCheckpoint: {x, y} - coordinates of the next checkpoint to reach
- currentLap: number - number of completed laps
- checkpoints: Array of {x, y} - all checkpoint positions in order
- powerUps: Array of {id, position: {x, y}, type, distance} - speed boosts and star power
- enemies: Array of {id, position: {x, y}, distance} - other racers
- mapAscii: Array of strings - track layout (H=walls, 0-9=checkpoints, P=powerups)
- gridPosition: {row, col} - current position in ASCII map

Available actions:
- {type: 'move', velocity: number} - accelerate forward/backward (-1 to 1)
- {type: 'turn', velocity: number} - turn left/right (-1 to 1)
- {type: 'idle'} - do nothing

The store object persists between ticks. Use it to remember state.

Race around checkpoints in order (0→1→2→...→0) to complete laps.
Power-ups: Speed (1.5x boost), Star (invincibility + stun opponents).
First to complete ${3} laps wins!

Arena is 600x400 pixels. Movement is physics-based with momentum and friction.

IMPORTANT: Return ONLY the function code, no explanations or markdown.`,
  
  defaultBotPrompts: [
    'Follow the checkpoints in order and finish laps quickly',
    'Take tight corners and grab speed boosts',
    'Navigate efficiently between checkpoints using nextCheckpoint coordinates',
  ],
  description: 'Top-down kart racing with checkpoints, power-ups, and lap tracking. Race to complete the most laps first!',
  settings: {
    arenaWidth: 600,
    arenaHeight: 400,
    maxSpeed: 10,
    visionRadius: 10000,
    tickRate: 30,
    turnRate: 6,
    powerUpRespawn: 600,
    lapsToWin: 3,
  } as GameSettings,
  subModes: [],
  demoPrompts: [
    {
      name: "Simple Racer",
      text: "Move forward and turn towards input.nextCheckpoint to reach each checkpoint in order"
    },
    {
      name: "Speed Demon",
      text: "Head towards the nearest speed boost powerup, then race to input.nextCheckpoint"
    },
    {
      name: "Aggressive Racer",
      text: "If I have star power, ram into nearby opponents. Otherwise navigate to input.nextCheckpoint and grab powerups when close"
    },
    {
      name: "Smart Navigator",
      text: "Calculate the angle to input.nextCheckpoint and turn smoothly. Check input.currentLap to track progress and grab powerups if they're less than 50 units away"
    }
  ]
};