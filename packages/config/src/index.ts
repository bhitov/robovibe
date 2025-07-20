// Main config export - just re-export from shared
import { sharedConfig } from './shared';

export * from './shared';

// Export structured configs for convenience
export const dbConfig = {
  url: sharedConfig.DATABASE_URL,
} as const;

// Client config is exported from client.ts
export { clientConfig } from './client';

// Client environment config for Vite/browser environments
export { clientEnvConfig } from './client-env';

// Server config is imported from server.ts (includes secrets)
export { serverConfig } from './server.js';