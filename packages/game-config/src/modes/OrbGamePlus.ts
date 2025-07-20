/**
 * Configuration for OrbGamePlus mode
 * Enhanced orb collection with larger arena and more orbs
 */

import type { GameModeConfig } from '../types.js';

export const OrbGamePlusConfig: GameModeConfig = {
  systemPrompt: `You are a code generator for a game bot. Generate ONLY a JavaScript function with this exact signature:

function loop(input, store) {
  // Your code here
  return { action, store };
}

The input object contains:
- botPosition: {x, y} - bot's current position
- velocity: {x, y} - bot's current velocity
- hasOrb: boolean - whether bot is carrying an orb
- orbs: Array of {id, position: {x, y}, distance}
- base: {id, position: {x, y}, distance} - bot's own base
- enemies: Array of {id, position: {x, y}, distance}

Available actions:
- {type: 'move', dx: number, dy: number} - accelerate in direction (dx, dy)
- {type: 'pickup'} - pick up nearby orb (within 20 units)
- {type: 'deposit'} - deposit orb at base (within 30 units)
- {type: 'idle'} - do nothing

The store object persists between ticks. Use it to remember state.

Arena is 600x400. Movement is physics-based with velocity.

IMPORTANT: Return ONLY the function code, no explanations or markdown.`,
  
  defaultBotPrompts: [
    "Collect orbs strategically in this larger arena with more competition",
    "Use the extra space to avoid enemies while collecting orbs efficiently",
    "Take advantage of the larger arena to find isolated orbs",
    "Plan longer routes efficiently in the expanded playing field",
    "Use corners and edges of the larger arena to avoid confrontation"
  ],
  
  description: "Enhanced orb collection with a larger arena and more orbs for intense competition!",
  
  settings: {
    arenaWidth: 600,
    arenaHeight: 400,
    maxSpeed: 8,
    pickupRadius: 20,
    depositRadius: 30,
    visionRadius: 10000,
    orbsToWin: 20,
    tickRate: 30
  },
  
  subModes: [
    {
      name: "Standard Plus",
      description: "Enhanced orb collection with larger arena",
      settings: {}
    },
    {
      name: "Mega Collection", 
      description: "More orbs to collect",
      settings: {
        orbsToWin: 30
      }
    },
    {
      name: "Speed Plus",
      description: "Fast-paced action in the larger arena",
      settings: {
        maxSpeed: 12,
        orbsToWin: 15
      }
    }
  ],
  
  demoPrompts: [
    {
      name: "Grab and DDeposit",
      text: "If you do not have an orb, run towards the nearest orb then pick it up. If you have an orb, run back to your base and deposit it."
    },
    {
      name: "Strategic Collection",
      text: "Find the orb that is furthest from enemy bots and closest to my base, then collect it."
    }
  ]
};