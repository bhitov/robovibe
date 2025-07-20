/**
 * Authentication middleware using Clerk
 * Handles user authentication and authorization for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, ClerkExpressWithAuth, LooseAuthProp, StrictAuthProp } from '@clerk/clerk-sdk-node';
import { serverConfig } from '@repo/config';

// Initialize Clerk with both keys
process.env.CLERK_SECRET_KEY = serverConfig.clerk.secretKey;
process.env.CLERK_PUBLISHABLE_KEY = serverConfig.CLERK_PUBLISHABLE_KEY;

// Extend the Express Request type to include Clerk auth
declare global {
  namespace Express {
    interface Request extends StrictAuthProp {}
  }
}

/**
 * Middleware that requires authentication - blocks unauthenticated requests
 */
export const requireAuth = ClerkExpressRequireAuth();

/**
 * Middleware that adds auth information but doesn't require it
 * Useful for routes that need to work for both authenticated and guest users
 */
export const withAuth = ClerkExpressWithAuth();

/**
 * Helper middleware to extract user ID from Clerk auth
 * Must be used after requireAuth or withAuth
 */
export const extractUserId = (req: Request, res: Response, next: NextFunction) => {
  if (req.auth?.userId) {
    (req as any).userId = req.auth.userId;
  }
  next();
};

/**
 * Check if the current request is from an authenticated user
 */
export const isAuthenticated = (req: Request): boolean => {
  return !!req.auth?.userId;
};

/**
 * Get the current user's Clerk ID
 */
export const getUserId = (req: Request): string | null => {
  return req.auth?.userId || null;
};