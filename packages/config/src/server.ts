// Server configuration (shared + secrets)
import { sharedConfig } from './shared.js';
import { secretConfig } from './secret.js';

export const serverConfig = {
  ...sharedConfig,
  ...secretConfig,
  clerk: {
    secretKey: secretConfig.CLERK_SECRET_KEY,
    webhookSecret: secretConfig.CLERK_WEBHOOK_SECRET,
  },
  port: Number(sharedConfig.PORT) ?? 3001,
  isTest: sharedConfig.NODE_ENV === 'test',
  isDevelopment: sharedConfig.NODE_ENV === 'development',
  JWT_SECRET: secretConfig.JWT_SECRET,
};