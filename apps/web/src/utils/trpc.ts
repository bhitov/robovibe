/**
 * tRPC client setup for API communication
 */
import { createTRPCReact, type CreateTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@repo/api';
import type { inferRouterOutputs } from '@trpc/server';

export const trpc: CreateTRPCReact<AppRouter, unknown> = createTRPCReact<AppRouter>();


/**
 * Type inference helpers for tRPC outputs (automatically handles serialization)
 * 
 * These types represent the actual data structure returned by tRPC queries,
 * where Date objects are automatically serialized to strings over HTTP.
 * 
 * Use these instead of the raw database types when working with tRPC query results
 * on the client side.
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;