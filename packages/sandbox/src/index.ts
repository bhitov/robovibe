/**
 * Secure sandbox implementation using isolated-vm
 * Provides safe execution of untrusted code with function injection support
 */

import ivm from 'isolated-vm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Callbacks can have any signature
export type SandboxCallbacks = Record<string, (...args: any[]) => any>;

export interface CreateSandboxedFunctionOptions {
  code: string;
  functionName: string;
  timeout?: number;
  callbacks?: SandboxCallbacks;
  memoryLimit?: number;
}

/**
 * Creates a sandboxed function that can be called repeatedly with injected callbacks
 * 
 * @param options Configuration for the sandboxed function
 * @returns A function that executes in the sandbox with access to provided callbacks
 * 
 * @example
 * ```typescript
 * const pathFind = (x: number, y: number) => [{ x: 0, y: 0 }, { x, y }];
 * 
 * const loopFn = createSandboxedFunction({
 *   code: 'function loop(input, store) { 
 *     const path = pathFind(10, 20); 
 *     return { action: "move", path }; 
 *   }',
 *   functionName: 'loop',
 *   timeout: 25,
 *   callbacks: { pathFind }
 * });
 * 
 * const result = loopFn(inputData, storeData);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unnecessary-type-parameters -- Generic function type needs any and T is used for type inference
export function createSandboxedFunction<T extends (...args: any[]) => any>({
  code,
  functionName,
  timeout = 1000,
  callbacks = {},
  memoryLimit = 8
}: CreateSandboxedFunctionOptions): T & { dispose: () => void } {
  const isolate = new ivm.Isolate({ memoryLimit });
  const context = isolate.createContextSync();
  const jail = context.global;

  // Inject callbacks into the sandbox
  for (const [name, callback] of Object.entries(callbacks)) {
    jail.setSync(name, new ivm.Callback((...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Result can be any type
      const result = callback(...args);
      return new ivm.ExternalCopy(result).copyInto();
    }));
  }

  // Compile and run the code to define the function
  const script = isolate.compileScriptSync(code);
  script.runSync(context);

  // Get reference to the function
  const fnRef = context.global.getSync(functionName, { reference: true });

  if (fnRef.typeof !== 'function') {
    context.release();
    isolate.dispose();
    throw new Error(`Function "${functionName}" not found in code`);
  }

  // Return a wrapper function that executes in the sandbox
  const sandboxedFn = ((...args: unknown[]): unknown => {
    try {
      // Convert arguments to ExternalCopy
      const argsCopy = args.map(arg => new ivm.ExternalCopy(arg).copyInto());

      // Call the function synchronously
      const resultRef = fnRef.applySync(undefined, argsCopy, {
        timeout,
        result: { copy: true }
      });

      return resultRef;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Script execution timed out')) {
        throw new Error(`Function execution exceeded timeout of ${String(timeout)}ms`);
      }
      throw error;
    }
  }) as T;

  // Add a dispose method to clean up resources
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- Adding dispose method
  (sandboxedFn as any).dispose = (): void => {
    context.release();
    isolate.dispose();
  };

  return sandboxedFn as T & { dispose: () => void };
}

