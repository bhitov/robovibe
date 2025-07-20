/**
 * Configuration for OrbGame mode
 * Standard orb collection gameplay in a 600x400 arena
 */

import type { GameModeConfig } from '../types.js';

export const OrbGameConfig: GameModeConfig = {
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
- base: {id, position: {x, y}, distance} - your base
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
    "Move towards the nearest orb and pick it up, then return to my base to deposit it",
    "Collect orbs efficiently by planning the shortest route between orbs and my base",
    "Avoid other bots while collecting orbs and focus on speed",
    "Use strategic positioning to block enemies from reaching orbs",
    "Prioritize orbs that are closer to my base to minimize travel time"
  ],
  
  description: "Dash around, grab glowing orbs, deliver them to your base. First to 20 deposits wins!",
  
  settings: {
    arenaWidth: 600,
    arenaHeight: 400,
    maxSpeed: 8,
    pickupRadius: 20,
    depositRadius: 30,
    visionRadius: 10000, // Effectively infinite vision
    orbsToWin: 20,
    tickRate: 30
  },
  
  subModes: [
    {
      name: "Standard",
      description: "Classic orb collection gameplay",
      settings: {}
    },
    {
      name: "Speed Run",
      description: "Faster gameplay with higher acceleration and speed",
      settings: {
        maxSpeed: 12,
        orbsToWin: 15
      }
    },
    {
      name: "Precision",
      description: "Smaller pickup radius for skilled players",
      settings: {
        pickupRadius: 15,
        depositRadius: 25
      }
    },
    {
      name: "Marathon",
      description: "Longer games with more orbs needed to win",
      settings: {
        orbsToWin: 30
      }
    }
  ],
  
  demoPrompts: [
    {
      name: "Grab and Deposit",
      text: "If you do not have an orb, run towards the nearest orb then pick it up. If you have an orb, run back to your base and deposit it."
    },
    {
      name: "Just Up",
      text: "Run straight up."
    }
  ]
};