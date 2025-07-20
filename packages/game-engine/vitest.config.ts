import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 5000,
    // All tests live in ./tests
    include: ['tests/**/*.test.ts'],
  },
  esbuild: {
    target: 'node18',
  },
});