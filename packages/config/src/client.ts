// Client-safe configuration
import { clientEnvConfig } from './client-env';

export const clientConfig = {
  url: clientEnvConfig.clientUrl,
  serverUrl: clientEnvConfig.serverUrl,
  apiUrl: clientEnvConfig.apiUrl,
  adminApiUrl: 'http://localhost:3005', // Admin URLs are not needed in production client
  adminClientUrl: 'http://localhost:5174',
  DISABLE_ADMIN_AUTH: false, // Always false in production client
  clerk: {
    publishableKey: clientEnvConfig.clerkPublishableKey,
  },
} as const;