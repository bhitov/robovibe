/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-console */

import { describe, it, expect } from 'vitest';
import { createSandboxedFunction } from './index.js';

describe('createSandboxedFunction', () => {
  it('should create a sandboxed function that can access callbacks', () => {
    const add = (a: number, b: number) => a + b;
    const multiply = (x: number, y: number) => x * y;

    const fn = createSandboxedFunction({
      code: `
        function calculate(a, b) {
          const sum = add(a, b);
          const product = multiply(sum, 2);
          return product;
        }
      `,
      functionName: 'calculate',
      callbacks: { add, multiply }
    });

    const result = fn(5, 3);
    expect(result).toBe(16); // (5 + 3) * 2

    fn.dispose();
  });

  it('should work with game bot example', () => {
    const pathFind = (gridX: number, gridY: number) => {
      return [
        { x: 0, y: 0 },
        { x: Math.floor(gridX / 2), y: Math.floor(gridY / 2) },
        { x: gridX, y: gridY }
      ];
    };

    const loop = createSandboxedFunction<(input: any, store: any) => any>({
      code: `
        function loop(input, store) {
          const target = { x: 10, y: 15 };
          const path = pathFind(target.x, target.y);
          
          if (path.length > 1) {
            const nextStep = path[1];
            return {
              action: {
                type: 'move',
                dx: nextStep.x - input.position.x,
                dy: nextStep.y - input.position.y
              },
              store: { ...store, currentPath: path }
            };
          }
          
          return { action: { type: 'idle' }, store };
        }
      `,
      functionName: 'loop',
      timeout: 25,
      callbacks: { pathFind }
    });

    const input = { position: { x: 0, y: 0 } };
    const store = {};
    const result = loop(input, store);

    expect(result.action.type).toBe('move');
    expect(result.action.dx).toBe(5);
    expect(result.action.dy).toBe(7);
    expect(result.store.currentPath).toHaveLength(3);

    loop.dispose();
  });

  it('should handle multiple callbacks', () => {
    const callbacks = {
      distance: (x1: number, y1: number, x2: number, y2: number) =>
        Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
      clamp: (value: number, min: number, max: number) =>
        Math.max(min, Math.min(max, value)),
      log: (msg: string) => { console.log(`[Test] ${msg}`); }
    };

    const fn = createSandboxedFunction({
      code: `
        function process(x1, y1, x2, y2) {
          log('Processing coordinates');
          const dist = distance(x1, y1, x2, y2);
          const clamped = clamp(dist, 0, 10);
          return clamped;
        }
      `,
      functionName: 'process',
      callbacks
    });

    const result = fn(0, 0, 20, 20);
    expect(result).toBe(10); // Distance ~28.28, clamped to 10

    fn.dispose();
  });

  it('should enforce timeout', () => {
    const fn = createSandboxedFunction({
      code: `
        function infiniteLoop() {
          while (true) {
            // This would run forever
          }
        }
      `,
      functionName: 'infiniteLoop',
      timeout: 10
    });

    expect(() => fn()).toThrow('exceeded timeout');
    fn.dispose();
  });

  it('should throw error if function not found', () => {
    expect(() => {
      createSandboxedFunction({
        code: 'const x = 42;',
        functionName: 'nonExistent'
      });
    }).toThrow('Function "nonExistent" not found');
  });

  it('should isolate from Node.js globals', () => {
    const fn = createSandboxedFunction({
      code: `
        function checkGlobals() {
          return {
            hasProcess: typeof process !== 'undefined',
            hasRequire: typeof require !== 'undefined',
            hasFs: typeof fs !== 'undefined'
          };
        }
      `,
      functionName: 'checkGlobals'
    });

    const result = fn();
    expect(result).toEqual({
      hasProcess: false,
      hasRequire: false,
      hasFs: false
    });

    fn.dispose();
  });

  it('should handle complex data structures', () => {
    const processData = (data: any[]) => {
      return data.map(item => ({
        ...item,
        processed: true,
        score: item.value * 2
      }));
    };

    const fn = createSandboxedFunction({
      code: `
        function transform(items) {
          const processed = processData(items);
          return {
            count: processed.length,
            totalScore: processed.reduce((sum, item) => sum + item.score, 0),
            items: processed
          };
        }
      `,
      functionName: 'transform',
      callbacks: { processData }
    });

    const input = [
      { id: 1, value: 10 },
      { id: 2, value: 20 },
      { id: 3, value: 30 }
    ];

    const result = fn(input);
    expect(result.count).toBe(3);
    expect(result.totalScore).toBe(120);
    expect(result.items[0].processed).toBe(true);

    fn.dispose();
  });

  it('should handle errors in callbacks gracefully', () => {
    const throwError = () => {
      throw new Error('Callback error');
    };

    const fn = createSandboxedFunction({
      code: `
        function testError() {
          try {
            throwError();
          } catch (e) {
            return 'Error caught: ' + e.message;
          }
        }
      `,
      functionName: 'testError',
      callbacks: { throwError }
    });

    const result = fn();
    expect(result).toBe('Error caught: Callback error');

    fn.dispose();
  });
});