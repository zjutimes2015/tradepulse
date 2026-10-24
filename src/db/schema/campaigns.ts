import { pgTable, text, timestamp, integer, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import { linkedinAccount } from './linkedin-accounts';

export const campaignStatus = pgEnum('campaign_status', [
  'draft',
  'running',
  'paused',
  'completed',
]);

export const campaignMode = pgEnum('campaign_mode', [
  'copilot',
  'auto',
]);

export const campaign = pgTable('campaign', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  status: campaignStatus('status').default('draft').notNull(),
  mode: campaignMode('mode').default('copilot').notNull(),
  // Target market config
  targetIndustries: jsonb('target_industries').$type<string[]>().default([]),
  targetLocations: jsonb('target_locations').$type<string[]>().default([]),
  targetKeywords: jsonb('target_keywords').$type<string[]>().default([]),
  targetCompanySize: jsonb('target_company_size').$type<string[]>().default([]),
  // Signal monitoring
  signalTypes: jsonb('signal_types').$type<string[]>().default([]),
  // Daily budget
  dailySendLimit: integer('daily_send_limit').default(10).notNull(),
  dailyConnectLimit: integer('daily_connect_limit').default(20).notNull(),
  // Message template
  messageTemplate: text('message_template').default('').notNull(),
  // Stats
  totalLeads: integer('total_leads').default(0).notNull(),
  totalContacted: integer('total_contacted').default(0).notNull(),
  totalReplied: integer('total_replied').default(0).notNull(),
  totalMeetings: integer('total_meetings').default(0).notNull(),
  // Account assignment
  assignedAccountId: text('assigned_account_id').references(() => linkedinAccount.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
