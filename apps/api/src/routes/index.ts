import { router } from './trpc.js';
import { gameRouter } from './game.js';
import { userRouter } from './user.js';

// Create the main app router
export const appRouter = router({
  game: gameRouter,
  user: userRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;