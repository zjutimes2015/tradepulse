import { pgTable, text, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { campaign } from './campaigns';

export const leadStatus = pgEnum('lead_status', [
  'new',
  'contacted',
  'replied',
  'meeting_booked',
  'converted',
  'closed',
]);

export const leadSource = pgEnum('lead_source', [
  'linkedin',
  'whatsapp',
  'both',
]);

export const lead = pgTable('lead', {
  id: text('id').primaryKey().$defaultFn(createId),
  campaignId: text('campaign_id').notNull().references(() => campaign.id),
  userId: text('user_id').notNull(),
  // 来源渠道（LinkedIn 获客 / WhatsApp 询盘 / 双渠道）
  source: leadSource('source').default('linkedin').notNull(),
  // Profile data
  linkedinProfileUrl: text('linkedin_profile_url').default('').notNull(),
  linkedinId: text('linkedin_id').default('').notNull(),
  name: text('name').notNull(),
  title: text('title').default('').notNull(),
  company: text('company').default('').notNull(),
  industry: text('industry').default('').notNull(),
  location: text('location').default('').notNull(),
  profileHeadline: text('profile_headline').default('').notNull(),
  // AI analysis
  signalScore: integer('signal_score').default(0).notNull(),
  signalSummary: text('signal_summary').default('').notNull(),
  signalDetails: jsonb('signal_details').$type<SignalDetail[]>().default([]),
  aiAnalysis: text('ai_analysis').default('').notNull(),
  // Outreach
  messageGenerated: text('message_generated').default('').notNull(),
  messageSent: boolean('message_sent').default(false).notNull(),
  sentAt: timestamp('sent_at'),
  replyReceived: boolean('reply_received').default(false).notNull(),
  replyContent: text('reply_content').default('').notNull(),
  // Status
  status: leadStatus('status').default('new').notNull(),
  // Enrichment
  email: text('email').default(''),
  phone: text('phone').default(''),
  whatsappPhone: text('whatsapp_phone').default(''),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export interface SignalDetail {
  type: 'job_change' | 'funding' | 'hiring' | 'expansion' | 'post_engagement' | 'competitor_engagement';
  content: string;
  sourceUrl: string;
  detectedAt: string;
}
