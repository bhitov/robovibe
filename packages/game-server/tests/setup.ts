/**
 * Test setup for game-server package
 * Configures test environment and utilities
 */

import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});