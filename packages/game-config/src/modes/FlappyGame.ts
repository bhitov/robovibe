import type { GameModeConfig } from '../types.js';

export const FlappyGameConfig: GameModeConfig = {
  systemPrompt: `You are a code generator for a flappy-bird style bot. Generate ONLY a JavaScript function with this exact signature:

function loop(input, store) {
  // Your code here
  return { action, store };
}

The input object contains:
- position: {x, y}
- velocity: {x, y}
- nearbyWalls: [] // always empty
Return {type:'flap'} to flap or {type:'idle'} to do nothing.
Flap has a cooldown of 15 ticks.

IMPORTANT: Return ONLY the function code.`,
  defaultBotPrompts: [
    "Flap whenever about to hit the bottom pipe",
    "Maintain mid-gap altitude",
  ],
  description: "Side-scrolling pipe dodging – survive the longest!",
  settings: {
    arenaWidth: 600,
    arenaHeight: 400,
    maxSpeed: 0,
    acceleration: 0,
    friction: 0,
    visionRadius: 10000,
    tickRate: 30,
    gravity: 0.8,
    flapStrength: 10,
    flapCooldown: 15,
    pipeFrequency: 60,
    pipeGap: 120,
    lives: 3,
    initialSpeed: 2,
    speedIncrement: 0.1,
  },
  subModes: [],
  demoPrompts: [
    {
      name: "Simple Flapper",
      text: "Flap when my y position is greater than 200"
    },
    {
      name: "Steady Flight",
      text: "Try to maintain altitude at y=150 by flapping when below that height"
    },
    {
      name: "Pipe Avoider",
      text: "Check the nearest pipe gap position and flap to stay aligned with it"
    }
  ]
};