// Shared configuration values that are safe for both client and server
// Uses environment variables with fallbacks for development
export const sharedConfig = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/uber_template",
  
  // Server
  PORT: process.env.PORT ?? "3001",
  NODE_ENV: (process.env.NODE_ENV ?? "development") as "development" | "production" | "test",
  
  // Client URLs
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5193",
  SERVER_URL: process.env.SERVER_URL ?? "http://localhost:3001",
  API_URL: process.env.API_URL ?? "http://localhost:3001",
  
  // Admin URLs
  ADMIN_API_URL: process.env.ADMIN_API_URL ?? "http://localhost:3005",
  ADMIN_CLIENT_URL: process.env.ADMIN_CLIENT_URL ?? "http://localhost:5174",
  
  // Development settings
  DISABLE_ADMIN_AUTH: process.env.DISABLE_ADMIN_AUTH === "true" || (process.env.NODE_ENV !== "production"), // Disabled in development by default
  
  // Clerk Auth (publishable key is safe for client)
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY ?? "pk_test_cmFwaWQtcGFudGhlci00OC5jbGVyay5hY2NvdW50cy5kZXYk",
} as const;