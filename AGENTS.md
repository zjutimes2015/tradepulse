# TradePulse / 贸脉 — AI 海外客户开发助手

## 项目概述
AI-powered LinkedIn outbound tool for Chinese factories/exporters to find overseas buyers.

## 技术栈
- Next.js 15 (App Router)
- Neon PostgreSQL + Drizzle ORM
- Unipile API (LinkedIn automation bridge)
- OpenRouter / DeepSeek (AI signal analysis & message generation)
- Waffo Pancake (payment)
- Better Auth (auth)

## 目录结构
```
src/
├── app/[locale]/dashboard/     ← 主仪表盘
├── app/[locale]/campaigns/     ← 投放管理
├── app/[locale]/leads/         ← 客户列表
├── app/[locale]/signals/       ← 信号监控
├── app/[locale]/settings/      ← 设置
├── lib/linkedin/               ← LinkedIn 业务层
│   ├── client.ts               ← Unipile 客户端
│   ├── search.ts               ← 搜索 + 信号检测
│   ├── outreach.ts             ← 发送编排
│   └── webhook-handler.ts      ← 回复监控
├── lib/ai/                     ← AI 层
│   ├── client.ts               ← LLM 客户端
│   ├── signal-analysis.ts      ← 信号强度评分
│   ├── message-generator.ts    ← 消息生成
│   └── reply-handler.ts        ← 回复处理
└── db/schema/                  ← 数据库模型
    ├── linkedin-accounts.ts
    ├── campaigns.ts
    └── leads.ts
```

## 开发命令
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建
- `pnpm db:push` - 同步数据库 schema
- `pnpm db:generate` - 生成 migration

## 关键约束
1. LinkedIn 限速：每天每个号 ≤ 20 连接请求 + 80 消息
2. Copilot 模式优先：AI 生成消息，用户确认后发送
3. 中文界面：所有用户面向内容为中文
