/**
 * User router for user-specific operations
 * Handles user profile updates, nickname management, etc.
 */

import { router, protectedProcedure, publicProcedure } from './trpc.js';
import { db, users, updateUserSchema, eq } from '@repo/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  /**
   * Get current user's profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    console.log('in getProfile');
    console.log(ctx.userId);
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, ctx.userId))
      .limit(1);

    if (!user) {
      // Development only: Create user just-in-time if not found
      // In production, users should be created via webhook
      console.log('User not found, creating just-in-time for development');
      
      // Get user info from Clerk (you'll need to add Clerk SDK for this)
      // For now, create a basic user
      const newUser = {
        clerkUserId: ctx.userId,
        email: `${ctx.userId}@temp.com`, // You'd get this from Clerk
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      [user] = await db
        .insert(users)
        .values(newUser)
        .returning();
        
      console.log('Created user:', user);
    }

    return user;
  }),

  /**
   * Update user profile (including nickname)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        nickname: z.string().min(1).max(20).optional(),
        // Add other updatable fields as needed
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkUserId, ctx.userId))
        .returning();

      if (!updatedUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return updatedUser;
    }),

  /**
   * Check if a nickname is available
   */
  checkNicknameAvailability: publicProcedure
    .input(
      z.object({
        nickname: z.string().min(1).max(20),
      })
    )
    .query(async ({ input }) => {
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.nickname, input.nickname))
        .limit(1);

      return {
        available: existingUser.length === 0,
      };
    }),
});