// Client-safe configuration that works with Vite and browser environments
// This file provides a way to access environment variables in the browser

// Type definitions for environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_CLIENT_URL?: string
  readonly VITE_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Helper function to get environment variables safely
function getEnvVar(key: string, defaultValue: string): string {
  // In browser/Vite environment
  if (typeof window !== 'undefined' && typeof import !== 'undefined' && import.meta && import.meta.env) {
    return (import.meta.env as any)[key] ?? defaultValue;
  }
  
  // In Node.js environment (for SSR or build time)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? defaultValue;
  }
  
  return defaultValue;
}

// Client configuration with environment variable support
export const clientEnvConfig = {
  // API URL
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3001'),
  
  // Client URL
  clientUrl: getEnvVar('VITE_CLIENT_URL', 'http://localhost:5193'),
  
  // Server URL
  serverUrl: getEnvVar('VITE_SERVER_URL', 'http://localhost:3001'),
  
  // Clerk Publishable Key
  clerkPublishableKey: getEnvVar('VITE_CLERK_PUBLISHABLE_KEY', 'pk_test_cmFwaWQtcGFudGhlci00OC5jbGVyay5hY2NvdW50cy5kZXYk'),
} as const;