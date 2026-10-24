/**
 * AI 回复处理模块
 * 分析客户回复的意图，给出跟进建议
 */

import { getOpenAIClient } from '@/lib/ai/client';

const REPLY_PROMPT = `你是一个B2B外贸销售助理。客户回复了你的LinkedIn消息，请分析回复意图并给出跟进建议。

请分析：
1. 客户是否感兴趣？
2. 应该继续聊还是暂时放一放？
3. 建议的下一条消息内容是什么？

严格按照以下JSON格式输出：
{
  "sentiment": "positive|neutral|negative",
  "interestLevel": "high|medium|low",
  "shouldFollowUp": true|false,
  "suggestedReply": "建议的回复内容",
  "nextAction": "下一步建议（如：约会议、发资料、等待等）"
}`;

export interface ReplyAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  interestLevel: 'high' | 'medium' | 'low';
  shouldFollowUp: boolean;
  suggestedReply: string;
  nextAction: string;
}

export async function analyzeReply(
  originalMessage: string,
  reply: string,
  leadInfo: { name: string; title: string; company: string },
): Promise<ReplyAnalysis> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL || 'deepseek/deepseek-chat',
    messages: [
      { role: 'system', content: REPLY_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({ originalMessage, reply, leadInfo }, null, 2),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}
