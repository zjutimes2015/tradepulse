/**
 * LinkedIn Outreach 编排层
 * 整合搜索 → AI分析 → 消息生成 → 发送 → 回复监控 全流程
 */

import { searchProfiles, sendMessage, sendConnectionRequest } from './client';
import { batchAnalyzeLeads } from '@/lib/ai/signal-analysis';
import { batchGenerateMessages } from '@/lib/ai/message-generator';

export interface OutreachConfig {
  accountId: string;
  campaignId: string;
  companyInfo: {
    name: string;
    description: string;
    valueProposition: string;
  };
  dailyLimit: number;
}

/**
 * 搜索并分析潜在客户
 * 返回按信号强度排序的客户列表
 */
export async function discoverAndScoreLeads(
  config: OutreachConfig,
  searchParams: {
    keywords: string;
    industries?: string[];
    location?: string;
    limit?: number;
  },
): Promise<any[]> {
  // 1. 搜索 LinkedIn
  const profiles = await searchProfiles({
    accountId: config.accountId,
    keywords: searchParams.keywords,
    industries: searchParams.industries,
    location: searchParams.location,
    limit: searchParams.limit || 50,
  });

  if (profiles.length === 0) return [];

  // 2. AI 分析信号强度
  const analysisResults = await batchAnalyzeLeads(profiles);

  // 3. 合并分析结果、排序
  const scoredLeads = profiles
    .map((profile) => ({
      ...profile,
      signalScore: analysisResults.get(profile.linkedinId)?.score || 0,
      signalSummary: analysisResults.get(profile.linkedinId)?.summary || '',
      signals: analysisResults.get(profile.linkedinId)?.signals || [],
      suggestedApproach:
        analysisResults.get(profile.linkedinId)?.suggestedApproach || '',
    }))
    .sort((a, b) => b.signalScore - a.signalScore);

  return scoredLeads;
}

/**
 * 为一批客户生成个性化消息
 */
export async function prepareOutreachMessages(
  leads: any[],
  config: OutreachConfig,
): Promise<any[]> {
  const leadsWithInfo = leads.map((lead) => ({
    leadInfo: {
      linkedinId: lead.linkedinId || lead.id,
      name: lead.name,
      title: lead.title,
      company: lead.company,
      industry: lead.industry,
      signals: lead.signals || [],
      suggestedApproach: lead.suggestedApproach || '',
    },
    companyInfo: config.companyInfo,
  }));

  const messages = await batchGenerateMessages(leadsWithInfo);

  return leads.map((lead) => ({
    ...lead,
    generatedMessage: messages.get(lead.linkedinId || lead.id) || {
      connectionNote: '',
      followUpMessage: '',
      personalizationSource: '',
    },
  }));
}

/**
 * 执行客户触达（Copilot 模式）
 * 注意：此函数仅为消息准备，实际发送需要用户确认
 */
export async function prepareSingleLeadMessage(
  lead: any,
  config: OutreachConfig,
) {
  const { generatePersonalizedMessage } = await import(
    '@/lib/ai/message-generator'
  );

  const message = await generatePersonalizedMessage(
    {
      name: lead.name,
      title: lead.title,
      company: lead.company,
      industry: lead.industry,
      signals: lead.signals || [],
      suggestedApproach: lead.suggestedApproach || '',
    },
    config.companyInfo,
  );

  return { ...lead, generatedMessage: message };
}

/**
 * 执行发送（用户确认后调用）
 */
export async function executeSend(
  accountId: string,
  leadId: string,
  message: string,
  type: 'connection' | 'message',
): Promise<boolean> {
  try {
    if (type === 'connection') {
      await sendConnectionRequest(accountId, leadId, message);
    } else {
      await sendMessage(accountId, leadId, message);
    }
    return true;
  } catch (error) {
    console.error('Send failed:', error);
    return false;
  }
}
