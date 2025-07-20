# Sandbox Package

A secure JavaScript sandbox implementation using `isolated-vm` that allows safe execution of untrusted code with function injection support.

## Features

- **Secure Isolation**: Code runs in completely isolated V8 contexts
- **Function Injection**: Pass callbacks into the sandbox using native `ivm.Callback`
- **Memory Limits**: Configurable memory limits (default 8MB)
- **Timeout Protection**: Execution timeout to prevent infinite loops
- **No Node.js Access**: Prevents access to Node.js APIs and global objects

## Installation

```bash
pnpm add @repo/sandbox
```

## Usage

### Basic Example

```typescript
import { createSandboxedFunction } from '@repo/sandbox';

// Your actual pathfinding implementation
const pathFind = (gridX: number, gridY: number) => {
  return [{ x: 0, y: 0 }, { x: gridX, y: gridY }];
};

// Create a sandboxed function with callbacks
const loopFn = createSandboxedFunction({
  code: `
    function loop(input, store) {
      const path = pathFind(10, 15);
      return { 
        action: { type: 'move', target: path[1] }, 
        store 
      };
    }
  `,
  functionName: 'loop',
  timeout: 25,
  callbacks: { pathFind }
});

// Execute the function
const result = loopFn({ position: { x: 0, y: 0 } }, {});
console.log(result); // { action: { type: 'move', target: { x: 10, y: 15 } }, store: {} }

// Clean up when done
loopFn.dispose();
```

### Game Bot Example

```typescript
import { createSandboxedFunction } from '@repo/sandbox';

// Game utility functions
const callbacks = {
  pathFind: (gridX: number, gridY: number) => {
    // Your A* or other pathfinding algorithm
    return calculatePath(currentPos, { x: gridX, y: gridY });
  },
  
  distance: (x1: number, y1: number, x2: number, y2: number) => 
    Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
  
  findNearest: (type: string, position: { x: number, y: number }) => {
    // Find nearest entity of given type
    return gameState.entities
      .filter(e => e.type === type)
      .sort((a, b) => distance(position, a.pos) - distance(position, b.pos))[0];
  },
  
  log: (msg: string) => console.log(`[Bot] ${msg}`)
};

// LLM-generated bot code
const botCode = `
function loop(input, store) {
  // Initialize store
  if (!store.target) {
    store.target = null;
  }
  
  // Find nearest orb
  const orb = findNearest('orb', input.position);
  
  if (orb) {
    const dist = distance(input.position.x, input.position.y, orb.x, orb.y);
    log('Found orb at distance: ' + dist);
    
    if (dist < 20) {
      return { action: { type: 'pickup' }, store };
    }
    
    const path = pathFind(orb.x, orb.y);
    if (path.length > 1) {
      return {
        action: {
          type: 'move',
          dx: path[1].x - input.position.x,
          dy: path[1].y - input.position.y
        },
        store: { ...store, target: orb }
      };
    }
  }
  
  return { action: { type: 'idle' }, store };
}
`;

// Create the bot function
const bot = createSandboxedFunction<(input: any, store: any) => any>({
  code: botCode,
  functionName: 'loop',
  timeout: 25, // 25ms per tick
  callbacks
});

// Game loop
setInterval(() => {
  const input = getGameState(); // Your game state
  const store = botStore.get(playerId) || {};
  
  const result = bot(input, store);
  executeAction(result.action);
  botStore.set(playerId, result.store);
}, 100);

// Clean up when game ends
bot.dispose();
```

## API Reference

### createSandboxedFunction

```typescript
function createSandboxedFunction<T extends (...args: any[]) => any>(options: {
  code: string;           // JavaScript code containing the function
  functionName: string;   // Name of the function to extract
  timeout?: number;       // Execution timeout in ms (default: 1000)
  callbacks?: object;     // Functions to inject into the sandbox
  memoryLimit?: number;   // Memory limit in MB (default: 8)
}): T & { dispose: () => void }
```

Creates a sandboxed function that can be called repeatedly.

#### Parameters

- `code`: JavaScript code that defines the function
- `functionName`: Name of the function to extract from the code
- `timeout`: Maximum execution time per call in milliseconds
- `callbacks`: Object containing functions to inject into the sandbox
- `memoryLimit`: Memory limit for the isolate in MB

#### Returns

A function that executes in the sandbox with an additional `dispose()` method for cleanup.

## Security Considerations

- Functions run in completely isolated V8 contexts
- No access to Node.js APIs (`process`, `require`, `fs`, etc.)
- Memory usage is limited to prevent resource exhaustion
- Execution timeouts prevent infinite loops
- Callbacks are wrapped with `ivm.Callback` for safe cross-isolate communication

## Best Practices

1. **Always dispose**: Call `fn.dispose()` when done to free resources
2. **Keep callbacks simple**: Complex callbacks may have performance overhead
3. **Validate inputs**: Validate data in callbacks before processing
4. **Handle errors**: Wrap callback logic in try-catch when needed
5. **Use TypeScript**: Type your functions for better IDE support

```typescript
// Good: Typed function
const fn = createSandboxedFunction<(x: number, y: number) => Point>({
  code: '...',
  functionName: 'calculate'
});

// Good: Resource cleanup
try {
  const result = fn(10, 20);
} finally {
  fn.dispose();
}
```

## Examples

See the [examples directory](./examples) for more detailed examples.