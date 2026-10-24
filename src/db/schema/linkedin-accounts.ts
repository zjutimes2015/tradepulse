import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const linkedinAccountStatus = pgEnum('linkedin_account_status', [
  'connecting',
  'active',
  'suspended',
  'expired',
]);

export const linkedinAccountType = pgEnum('linkedin_account_type', [
  'basic',
  'sales_navigator',
]);

export const linkedinAccount = pgTable('linkedin_account', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  unipileAccountId: text('unipile_account_id').notNull(),
  type: linkedinAccountType('type').default('basic').notNull(),
  status: linkedinAccountStatus('status').default('connecting').notNull(),
  dailySendLimit: integer('daily_send_limit').default(20).notNull(),
  dailyConnectLimit: integer('daily_connect_limit').default(40).notNull(),
  warmupDays: integer('warmup_days').default(0).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
