/**
 * Configuration for TankCombat mode
 * Top-down tank battles with physics-based movement and projectiles
 */

import type { GameModeConfig } from '../types.js';

export const TankCombatConfig: GameModeConfig = {
  systemPrompt: `You are a code generator for a tank combat bot. Generate ONLY a JavaScript function with this exact signature:

function loop(input, store) {
  // Your code here
  return { action, store };
}

The input object contains:
- botPosition: {x, y} - tank's current position
- velocity: {x, y} - tank's current velocity
- rotation: number - tank's rotation in degrees
- health: number - current health (0-100)
- canFire: boolean - whether tank can fire (not in cooldown)
- tanks: Array of {id, position: {x, y}, rotation, health, distance}
- nearbyWalls: Array of {position: {x, y}, distance}
- projectiles: Array of {position: {x, y}, velocity: {x, y}, distance}
- lives: number - remaining lives

Available actions:
- {type: 'move', velocity: number} - move forward/backward (-1 to 1)
- {type: 'turn', velocity: number} - turn left/right (-1 to 1)  
- {type: 'fire', dx: number, dy: number} - fire a shell in direction (dx, dy) relative to tank position (3 second cooldown)
- {type: 'idle'} - do nothing

The store object persists between ticks. Use it to remember state.

Tank specs: 100 HP, max speed 8 pixels/tick, 10°/tick turn rate.
Shells do 40 damage, travel at 15 pixels/tick.
Each tank starts with 1 life. When killed, the tank is eliminated from the game.

IMPORTANT: Return ONLY the function code, no explanations or markdown.`,
  
  defaultBotPrompts: [
    "Move strategically and fire at enemies while avoiding their shots",
    "Use positioning and cover to survive and eliminate opponents",
    "Circle strafe around enemies while firing to avoid return fire",
    "Use hit-and-run tactics to deal damage while staying mobile",
    "Predict enemy movement and lead your shots for better accuracy"
  ],
  
  description: "Top-down tank combat. Drive, rotate, and fire shells. Last tank standing wins!",
  
  settings: {
    arenaWidth: 600,
    arenaHeight: 400,
    maxSpeed: 8,
    visionRadius: 10000,
    tickRate: 30,
    maxHealth: 100,
    maxPlayers: 16,
    bulletSpeed: 15,
    turnRate: 10,
    fireCooldown: 90,
    maxLives: 1,
    respawnDelay: 90
  },
  
  subModes: [
    {
      name: "Open Arena",
      description: "Tank combat in open space",
      settings: {}
    },
    {
      name: "Close Quarters",
      description: "Intense close combat",
      settings: {
        maxPlayers: 8
      }
    },
    {
      name: "Battle Royale",
      description: "More tanks in same arena",
      settings: {
        maxPlayers: 32
      }
    }
  ]
};