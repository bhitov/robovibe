import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    setupFiles: ['./tests/setup.ts'],
  },
  esbuild: {
    target: 'node18'
  }
});