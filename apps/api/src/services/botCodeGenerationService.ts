/**
 * Bot Code Generation Service
 * Shared service for generating bot code from user prompts
 * Used by both tRPC routes and socket handlers
 */

import { generateBotCode, type Model } from '@repo/openai';
import { isValidModel, buildGameConfig, buildSystemPrompt } from '@repo/game-config';
import { getGameMode } from '@repo/game-server';

export interface GenerateBotCodeParams {
  userPrompt: string;
  model: string;
  gameId: string;
}

export interface GenerateBotCodeResult {
  code: string;
  tokensUsed?: number;
  model: string;
}

/**
 * Generate bot code from a user prompt
 * @param params - Generation parameters
 * @returns Generated bot code and metadata
 * @throws Error if generation fails
 */
export async function generateBotCodeService(params: GenerateBotCodeParams): Promise<GenerateBotCodeResult> {
  const { userPrompt, model, gameId } = params;
  
  console.log('\n🤖 Bot code generation service:', {
    model,
    promptLength: userPrompt.length,
    gameId,
  });

  // Validate model
  if (!isValidModel(model)) {
    throw new Error('Invalid model specified');
  }

  // Get the game mode from the game server
  const gameMode = getGameMode(gameId);
  if (!gameMode) {
    throw new Error('Invalid game ID or game not found');
  }

  // Build system prompt using game configuration
  const gameConfig = buildGameConfig(gameMode);
  const systemPrompt = buildSystemPrompt(gameConfig);
  
  console.log('\n📋 Using system prompt for mode:', gameMode);
  console.log('System prompt length:', systemPrompt.length);
  console.log('\nFull system prompt:\n', systemPrompt);
  
  try {
    const response = await generateBotCode({
      model: model as Model,
      systemPrompt,
      userPrompt,
    });

    return {
      code: response.code,
      tokensUsed: response.tokensUsed,
      model: response.model,
    };
  } catch (error) {
    console.error('Bot code generation error:', error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error('Failed to generate bot code');
  }
}