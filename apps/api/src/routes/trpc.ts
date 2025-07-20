import { initTRPC, TRPCError } from '@trpc/server';
import { db, eq } from '@repo/db';
import { z } from 'zod';
import type { Context } from '../context.js';

// Initialize tRPC with context
const t = initTRPC.context<Context>().create();

// Create router
export const router = t.router;

// Public procedure - no authentication required
export const publicProcedure = t.procedure;

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // userId is guaranteed to be non-null here
    },
  });
});

// Add your application-specific routers here