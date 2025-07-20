/**
 * Simple example showing how to use createSandboxedFunction
 * for a RoboCode-style game bot
 */

import { createSandboxedFunction } from '../src/index.js';

// Example: Basic usage with pathFind
function basicExample() {
  console.log('=== Basic Example ===');
  
  // Your actual pathFind implementation
  const pathFind = (gridX: number, gridY: number) => {
    console.log(`Finding path to (${gridX}, ${gridY})`);
    return [
      { x: 0, y: 0 },
      { x: gridX, y: gridY }
    ];
  };

  // LLM-generated loop function as a string
  const loopString = `
    function loop(input, store) {
      const path = pathFind(10, 15);
      return { 
        action: { type: 'move', x: path[1].x }, 
        store 
      };
    }
  `;

  // Create sandboxed function with pathFind injected
  const loopFn = createSandboxedFunction({
    code: loopString,
    functionName: 'loop',
    timeout: 25,
    callbacks: { pathFind }
  });

  // Execute it
  const result = loopFn({ position: { x: 0, y: 0 } }, {});
  console.log('Result:', result);

  // Clean up
  loopFn.dispose();
}

// Example: Multiple callbacks for game bot
function gameExample() {
  console.log('\n=== Game Bot Example ===');
  
  // Game utility functions
  const callbacks = {
    pathFind: (targetX: number, targetY: number) => {
      // Simplified path - just direct line
      return [
        { x: 0, y: 0 },
        { x: Math.floor(targetX / 2), y: Math.floor(targetY / 2) },
        { x: targetX, y: targetY }
      ];
    },
    
    distance: (x1: number, y1: number, x2: number, y2: number) => 
      Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
    
    log: (msg: string) => console.log(`[Bot] ${msg}`)
  };

  // Bot code that uses multiple callbacks
  const botCode = `
    function loop(input, store) {
      log('Bot thinking...');
      
      // Find path to target
      const target = { x: 20, y: 30 };
      const path = pathFind(target.x, target.y);
      
      // Calculate distance to target
      const dist = distance(input.position.x, input.position.y, target.x, target.y);
      log('Distance to target: ' + dist);
      
      if (path.length > 1) {
        const next = path[1];
        return {
          action: {
            type: 'move',
            dx: next.x - input.position.x,
            dy: next.y - input.position.y
          },
          store: { ...store, targetPath: path }
        };
      }
      
      return { action: { type: 'idle' }, store };
    }
  `;

  const bot = createSandboxedFunction<(input: any, store: any) => any>({
    code: botCode,
    functionName: 'loop',
    timeout: 25,
    callbacks
  });

  // Simulate game ticks
  let position = { x: 0, y: 0 };
  let store = {};
  
  for (let i = 0; i < 3; i++) {
    console.log(`\nTick ${i + 1}:`);
    const result = bot({ position }, store);
    console.log('Action:', result.action);
    
    // Update position based on action
    if (result.action.type === 'move') {
      position.x += result.action.dx;
      position.y += result.action.dy;
      console.log('New position:', position);
    }
    
    store = result.store;
  }

  bot.dispose();
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  basicExample();
  gameExample();
}