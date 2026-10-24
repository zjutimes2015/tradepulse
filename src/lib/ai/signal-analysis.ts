/**
 * AI 信号分析模块
 * 分析 LinkedIn 动态中的购买信号，输出意向评分
 */

import { getOpenAIClient } from '@/lib/ai/client';

const SIGNAL_PROMPT = `你是一个B2B销售情报分析师。你需要分析下面的LinkedIn用户信息，判断他们是否正在寻找新的供应商。

请从以下维度分析：
1. 职位变动：刚升职/换工作的人更可能有采购需求（+20分）
2. 公司招聘：正在大规模招聘说明公司在扩张（+15分）
3. 融资情况：刚融资的公司有钱花（+20分）
4. 内容互动：最近点赞/评论了行业相关内容（+10分）
5. 公司扩张：开设新办公室/新市场（+15分）
6. 竞品互动：关注或互动了竞争对手的帖子（+5分）

请严格按照以下JSON格式输出：
{
  "score": 0-100,
  "summary": "一句话总结为什么这个人是高/低意向客户",
  "signals": [
    {
      "type": "job_change|funding|hiring|expansion|post_engagement|competitor_engagement",
      "content": "具体信号描述",
      "confidence": "high|medium|low"
    }
  ],
  "suggestedApproach": "建议用什么话题发起联系"
}`;

export interface SignalAnalysisResult {
  score: number;
  summary: string;
  signals: Array<{
    type: string;
    content: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  suggestedApproach: string;
}

export async function analyzeProfileSignals(
  profileData: {
    name: string;
    title: string;
    company: string;
    industry: string;
    headline: string;
    recentPosts?: string[];
  },
): Promise<SignalAnalysisResult> {
  const client = getOpenAIClient();

  const userContent = JSON.stringify(profileData, null, 2);

  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL || 'deepseek/deepseek-chat',
    messages: [
      { role: 'system', content: SIGNAL_PROMPT },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

/**
 * 批量分析逻辑
 * 在 Campaign 运行时，每搜到一批新用户就调用此函数
 */
export async function batchAnalyzeLeads(
  leads: any[],
): Promise<Map<string, SignalAnalysisResult>> {
  const results = new Map<string, SignalAnalysisResult>();

  // 并行分析，限制并发数
  const concurrency = 3;
  const chunks = [];
  for (let i = 0; i < leads.length; i += concurrency) {
    chunks.push(leads.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (lead) => {
      try {
        const result = await analyzeProfileSignals({
          name: lead.name,
          title: lead.title,
          company: lead.company,
          industry: lead.industry,
          headline: lead.headline,
        });
        results.set(lead.linkedinId, result);
      } catch (error) {
        console.error(`Failed to analyze lead ${lead.linkedinId}:`, error);
      }
    });
    await Promise.all(promises);
  }

  return results;
}
