import OpenAI from 'openai';
import { serverConfig as config } from '@repo/config/server';
import type { CompletionRequest, CompletionResponse } from './types.js';

let client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (!client) {
    const apiKey = config.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in config');
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}

export async function generateBotCode(request: CompletionRequest): Promise<CompletionResponse> {
  const openai = getClient();

  const completion = await openai.chat.completions.create({
    model: request.model,
    messages: [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt }
    ],
    temperature: request.temperature ?? 0.6,
    max_tokens: request.maxTokens ?? 2000,
  });

  const response = completion.choices[0]?.message.content ?? '';
  // eslint-disable-next-line no-console
  console.log('OpenAI response:', response);
  
  // Extract code from response - look for function definition
  // This regex matches the entire function including nested braces
  const codeMatch = /function\s+loop\s*\([^)]*\)\s*\{[\s\S]*\}/.exec(response);
  if (!codeMatch) {
    // eslint-disable-next-line no-console
    console.error('No loop function found in response');
  }
  const code = codeMatch ? codeMatch[0] : response;

  return {
    code,
    tokensUsed: completion.usage?.total_tokens ?? 0,
    model: request.model,
  };
}