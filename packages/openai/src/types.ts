import type { ModelKey } from '@repo/game-config';

export type Model = ModelKey;

export interface CompletionRequest {
  model: Model;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResponse {
  code: string;
  tokensUsed: number;
  model: Model;
}