/**
 * OpenRouter / OpenAI 兼容客户端
 * 供 AI 模块使用
 */

import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.AI_API_KEY || '',
    });
  }
  return client;
}
