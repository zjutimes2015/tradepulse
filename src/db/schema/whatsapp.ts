import { pgTable, text, timestamp, integer, doublePrecision, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { lead } from './leads';

// WhatsApp 账号状态
export const whatsappAccountStatus = pgEnum('whatsapp_account_status', [
  'connecting',
  'active',
  'suspended',
]);

// 模板分类（对应 Meta 对话类别）
export const templateCategory = pgEnum('template_category', [
  'utility',
  'marketing',
  'authentication',
]);

// 模板审核状态（Meta 外部审核）
export const templateMetaStatus = pgEnum('template_meta_status', [
  'draft',
  'pending',
  'approved',
  'rejected',
]);

// 会话渠道
export const conversationChannel = pgEnum('conversation_channel', [
  'linkedin',
  'whatsapp',
]);

// 消息来源（审计用）
export const messageSource = pgEnum('message_source', [
  'linkedin',
  'whatsapp',
]);

// 消息发送状态
export const sendLogStatus = pgEnum('send_log_status', [
  'success',
  'failed',
]);

export const whatsappAccount = pgTable('whatsapp_account', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  unipileAccountId: text('unipile_account_id').notNull(),
  phoneNumber: text('phone_number').default('').notNull(),
  status: whatsappAccountStatus('status').default('connecting').notNull(),
  dailyTemplateLimit: integer('daily_template_limit').default(50).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messageTemplate = pgTable('message_template', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  category: templateCategory('category').default('utility').notNull(),
  language: text('language').default('en').notNull(),
  // 含 {{变量}} 占位符的模板正文
  body: text('body').notNull(),
  metaStatus: templateMetaStatus('meta_status').default('draft').notNull(),
  metaRejectionReason: text('meta_rejection_reason').default('').notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const conversation = pgTable('conversation', {
  id: text('id').primaryKey().$defaultFn(createId),
  leadId: text('lead_id').notNull().references(() => lead.id),
  channel: conversationChannel('channel').notNull(),
  externalConversationId: text('external_conversation_id').notNull(),
  lastMessageAt: timestamp('last_message_at'),
  unreadCount: integer('unread_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sendLog = pgTable('send_log', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  leadId: text('lead_id').references(() => lead.id),
  source: messageSource('source').notNull(),
  // 会话/消息外部 ID（Unipile/Meta）
  externalMessageId: text('external_message_id').default('').notNull(),
  templateId: text('template_id').references(() => messageTemplate.id),
  category: templateCategory('category'),
  content: text('content').default('').notNull(),
  // 美元成本（Meta 对话费），doublePrecision 足够
  cost: doublePrecision('cost').default(0).notNull(),
  status: sendLogStatus('status').default('success').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
