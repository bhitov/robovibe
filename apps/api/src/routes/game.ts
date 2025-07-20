import { router, publicProcedure } from './trpc.js';
import { z } from 'zod';
import { isValidModel } from '@repo/game-config';
import { generateBotCodeService } from '../services/botCodeGenerationService.js';
// Admin system removed - no longer need database imports

export const gameRouter = router({
  generateBotCode: publicProcedure
    .input(z.object({
      userPrompt: z.string(),
      model: z.string().refine(isValidModel, { message: 'Invalid model' }),
      gameId: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await generateBotCodeService({
          userPrompt: input.userPrompt,
          model: input.model,
          gameId: input.gameId,
        });

        return result;
      } catch (error) {
        console.error('Bot code generation error:', error);
        throw new Error('Failed to generate bot code');
      }
    }),
});