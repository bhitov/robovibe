/**
 * tRPC context creation
 * Provides authentication context and other shared data to all tRPC procedures
 */

import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Request } from 'express';
import { getUserId } from './middleware/auth.js';

/**
 * Context available in all tRPC procedures
 */
export interface Context {
  userId: string | null;
  isAuthenticated: boolean;
  req: Request;
}

/**
 * Creates context for each tRPC request
 */
export const createContext = ({ req, res }: CreateExpressContextOptions): Context => {
  const userId = getUserId(req);
  
  return {
    userId,
    isAuthenticated: !!userId,
    req,
  };
};