import { pgTable, text, integer, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { z } from "zod";

/**
 * Users table - synced with Clerk authentication
 * This table stores user data synced from Clerk via webhooks
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(), // Clerk's user ID
  email: text("email").notNull(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  
  // Game-specific fields
  nickname: text("nickname"), // User's chosen game nickname
  
  // Guest mode support
  isGuest: boolean("is_guest").notNull().default(false),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional user data from Clerk
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
});

// Zod schemas for validation
export const insertUserSchema = z.object({
  clerkUserId: z.string().min(1),
  email: z.string().email(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  nickname: z.string().min(1).max(20).optional(), // Game nickname validation
  isGuest: z.boolean().optional().default(false),
  metadata: z.record(z.any()).optional(),
});

export const updateUserSchema = insertUserSchema.partial().omit({ clerkUserId: true });

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

