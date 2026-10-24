/**
 * AI 消息生成模块
 * 基于信号分析结果，为每个客户生成个性化消息
 */

import { getOpenAIClient } from '@/lib/ai/client';

const MESSAGE_PROMPT = `你是一个专业的B2B外贸销售文案。你的任务是根据客户信息生成个性化的LinkedIn连接请求附言或消息。

规则：
1. 消息必须基于客户的真实动态（职位变更、公司新闻、发文等），不能泛泛而谈
2. 控制在 200 字符以内（LinkedIn限制）
3. 语气专业但不生硬，自然如真人
4. 不要直接推销，先建立联系
5. 如果是连接请求附言，以自我介绍结尾
6. 语言：英文（因为客户是海外买家）

模板格式参考：
- "Congratulations on [具体的成就/动态]! I've been following [公司名]'s growth in [行业]. Would love to connect and learn more."
- "Interesting post about [话题]. I work with [行业] companies on [价值主张]. Would be great to connect."

请严格按照以下JSON格式返回：
{
  "connectionNote": "连接请求附言（150字以内）",
  "followUpMessage": "连接后的跟进消息（可选，可留空）",
  "personalizationSource": "消息是基于客户的什么动态生成的"
}`;

export interface GeneratedMessage {
  connectionNote: string;
  followUpMessage: string;
  personalizationSource: string;
}

export async function generatePersonalizedMessage(
  leadInfo: {
    name: string;
    title: string;
    company: string;
    industry: string;
    signals: Array<{ type: string; content: string }>;
    suggestedApproach?: string;
  },
  companyInfo?: {
    name: string;
    description: string;
    valueProposition: string;
  },
): Promise<GeneratedMessage> {
  const client = getOpenAIClient();

  const prompt = {
    lead: leadInfo,
    company: companyInfo || {
      name: 'Our Company',
      description: 'Manufacturing and trading company',
      valueProposition: 'High-quality products with competitive pricing',
    },
  };

  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL || 'deepseek/deepseek-chat',
    messages: [
      { role: 'system', content: MESSAGE_PROMPT },
      { role: 'user', content: JSON.stringify(prompt, null, 2) },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

/**
 * 批量生成消息
 */
export async function batchGenerateMessages(
  leads: Array<{ leadInfo: any; companyInfo?: any }>,
): Promise<Map<string, GeneratedMessage>> {
  const results = new Map<string, GeneratedMessage>();
  const concurrency = 3;

  for (let i = 0; i < leads.length; i += concurrency) {
    const chunk = leads.slice(i, i + concurrency);
    const promises = chunk.map(async ({ leadInfo, companyInfo }) => {
      try {
        const message = await generatePersonalizedMessage(
          leadInfo,
          companyInfo,
        );
        results.set(leadInfo.linkedinId, message);
      } catch (error) {
        console.error(`Failed to generate message for ${leadInfo.name}:`, error);
      }
    });
    await Promise.all(promises);
  }

  return results;
}
