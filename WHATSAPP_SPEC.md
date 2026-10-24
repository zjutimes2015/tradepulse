# TradePulse 贸脉 — WhatsApp 沟通模块 SPEC

> 版本：v1.0 · 2026-08-02 · 状态：待评审
> 配套文档：DESIGN_DOC.md（产品总 Spec）· MINIPROGRAM_SPEC.md（小程序端 SPEC）· AGENTS.md（工程约束）

---

## 1. Current Context（现状）

- **市场事实**：海外 B2B 买家即时通讯使用率 82%（Meta 2025 跨境报告，vs 邮件 45%）；外贸邮件打开率 <3%。外贸客户的主战场已迁移到 WhatsApp。
- **合规事实**：2026 年 WhatsApp 个人号群发封号潮严重；官方 WhatsApp Business API（WABA）是唯一合规稳定路径。按对话计费：Service（24h 窗口内，客户发起）免费；Utility（订单/物流通知，商家发起）$0.004-0.031/对话；Marketing（营销模板）$0.025-0.086/对话；Authentication $0.004-0.027/对话（2026 年北美/各国费率）。
- **技术事实**：Unipile 已集成于 TradePulse（LinkedIn 通道，api27.unipile.com:15722），**Unipile 同时支持 WhatsApp/Email/Instagram/Telegram 统一 API**——WhatsApp 通道可复用现有 SDK/Webhook/账号体系。
- **业务现状**：TradePulse PC 版 build 已通过（7 轮修复），dev 验证中；MICHAEL DONE 为首个试验客户（美国 Amazon 卖家 + 巴西 Inbras 客户，均活跃于 WhatsApp）。
- **机会**：中国外贸工厂仍在用"个人号手动发消息+频繁封号"，无玩家提供"LinkedIn 获客 → WhatsApp 成交"一体化 + 中文界面 + Copilot 确认模式。

## 2. Requirements（需求）

### P0（MVP 必须有）

| ID | 需求 | 说明 |
|----|------|------|
| F1 | WhatsApp 账号连接 | 通过 Unipile 连接 WABA 账号，状态管理（connecting/active/suspended），复用 linkedin-accounts 模式 |
| F2 | 统一收件箱 | LinkedIn + WhatsApp 消息合并视图，会话按 lead 归组，实时同步（Webhook） |
| F3 | 24h 窗口 AI 回复 | 客户主动消息 → AI 起草回复（英文）→ Copilot 确认 → 发送。Service 会话，Meta 免费 |
| F4 | 回复意图分类 | AI 分类客户消息：询价/砍价/物流/售后/其他 → 路由到对应回复策略 |
| F5 | 客户视图打通 | 同一 lead 的 LinkedIn/WhatsApp 互动时间线合一；状态流转：线索→询盘→报价→订单→复购 |
| F6 | 订单/物流通知模板 | Utility 模板（订单确认/物流跟踪/付款回执），发送需确认，落库审计 |
| F7 | 模板管理 | 模板库 + Meta 审核状态跟踪（draft/pending/approved/rejected） |
| F8 | 中文界面 | 所有用户面向内容为中文；AI 生成的对外消息为英文 |

### P1（MVP 后 2 周内）

| ID | 需求 | 说明 |
|----|------|------|
| F9 | Marketing 模板合规触达 | 节日/新品/复购触达，仅发给已授权客户，严格限速 |
| F10 | 报价单生成 | 模板 + 产品参数填充（MICHAEL DONE 产品库），PDF 附件 |
| F11 | 多语言回复 | 西语/葡语回复（巴西客户场景），AI 自动检测语言 |
| F12 | 会话标签 | 自定义标签 + 快捷筛选（报价中/样品中/大客户） |

### 非功能需求（NF）

| ID | 约束 |
|----|------|
| NF1 | 合规红线：24h 窗口外禁止非模板消息；营销模板只发给已授权客户；拒绝"群发轰炸"模式 |
| NF2 | 操作审计：所有发送落库（send_logs 扩展 source 字段），风控可追溯 |
| NF3 | 限速保护：每账号每日模板发送上限（默认 50，可配）；新号阶梯放开 |
| NF4 | 关键 API 响应 < 1s；收件箱消息同步延迟 < 30s（Webhook 实时） |
| NF5 | 国内可访问：通过 BSP（YCloud 等）API 直连，不依赖代理 |
| NF6 | 模板审核失败通知：审核状态变化即时通知用户（邮件/微信） |

## 3. Design Decisions（设计决策）

### D1: WhatsApp 通道走 Unipile（复用），不走裸 Meta Cloud API
- **选 Unipile 因为**：① 已集成（api27 连通，token 在 .env），加 WhatsApp 账号连接即可；② 统一 API/Webhook 免维护多通道；③ LinkedIn+WhatsApp 同会话视图天然支持。
- 代价：Unipile 按账号收费；依赖第三方可用性。
- **待验证点（PoC 必做）**：Unipile 的 WhatsApp 实现是官方 API 模式还是 headless 模式——官方 API 无封号风险（首选）；headless 有残余风险（需评估，可能转 YCloud BSP 直连）。

### D2: 服务模式——"AI 起草 + 人确认"（Copilot）为唯一发送路径
- **选 Copilot 因为**：① WhatsApp 消息代表公司形象，发错不可撤回；② 24h 窗口内 Service 免费，确认成本低；③ 与 TradePulse LinkedIn Copilot 模式心智一致。
- 不做全自动 Auto 模式（外贸沟通容错率低，且模板消息一旦被投诉影响账号质量分）。

### D3: 24h 窗口内免费回复优先，模板消息按需付费
- **选这个成本结构因为**：客户主动询盘（最高价值场景）在 24h 窗口内 = Service 免费；商家主动的订单/物流通知用 Utility 模板（$0.01/条级）——外贸工厂月活 500 条成本 ≈ $5-15，毛利 >70%。
- Marketing 模板（贵+审核严）只用于 P1 复购触达，不做冷启动群发。

### D4: 独立模块不独立产品——并入 TradePulse
- **选并入因为**：客户/数据模型/获客逻辑完全重合；LinkedIn 找到客户→WhatsApp 谈成客户是同一销售漏斗的两段；避免双产品获客成本翻倍。
- 数据模型扩展（campaign/lead 加 source 字段），不新建孤立表。

### D5: 模板审核走 BSP/官方流程，应用层只管状态机
- **选应用层只管状态因为**：Meta 模板审核是外部流程（时长不定、人工介入），应用层做好 draft/pending/approved/rejected 状态跟踪 + 失败通知即可，不承诺自动过审。
- 模板内容策略：优先 Utility 类（报价/物流/订单），审核通过率高；Marketing 类后置。

## 4. Technical Design（技术设计）

### 4.1 系统架构（新增部分）

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│ 微信小程序    │────▶│  Next.js 15 后端  │────▶│   Unipile    │
│ (遥控器,已有) │     │  (已有)           │     │  api27       │
└──────────────┘     │                  │     │  ├ LinkedIn  │
┌──────────────┐     │  + WhatsApp 模块  │     │  └ WhatsApp  │◀── WABA/账号
│ PC 管理后台   │────▶│  inbox/template/  │     └─────────────┘
│ (已有)       │     │  reply-router     │          │
└──────────────┘     └───┬──────┬───────┘          │ Webhook
                         │      │                  ▼
              ┌──────────▼──┐ ┌─▼──────────────┐
              │ Neon Postgres│ │ OpenRouter/DeepSeek│
              │ +templates 表│ │ 意图分类+回复起草   │
              │ +send_logs   │ └────────────────┘
              └─────────────┘
```

### 4.2 数据模型（新增/扩展）

**whatsapp_account**（新增，复用 linkedin-accounts 模式）
- id (cuid2 PK) / userId / unipileAccountId / phoneNumber / status (connecting|active|suspended)
- dailyTemplateLimit (默认 50) / createdAt / updatedAt

**message_template**（新增）
- id / userId / name / category (utility|marketing|authentication)
- language / body（含 {{变量}} 占位符）/ metaStatus (draft|pending|approved|rejected)
- metaRejectionReason / lastUsedAt / createdAt / updatedAt

**lead 扩展**（修改）
- 加 `source` 字段：'linkedin' | 'whatsapp' | 'both'
- 加 `whatsappPhone` 字段
- 现有 status 流转扩展：new→contacted→replied→meeting_booked→converted→closed（不变，WhatsApp 会话驱动同流程）

**send_logs**（扩展，NF2 审计）
- 加 source / templateId / metaMessageId / category / cost

**conversation**（新增，统一会话）
- id / leadId / channel (linkedin|whatsapp) / externalConversationId / lastMessageAt / unreadCount / createdAt

### 4.3 核心模块（新增文件）

| 模块 | 路径 | 职责 |
|------|------|------|
| WhatsApp 客户端 | `src/lib/whatsapp/client.ts` | Unipile WhatsApp 通道封装（连接/发送/模板） |
| 收件箱 | `src/lib/whatsapp/inbox.ts` | 统一会话查询/同步/Webhook 处理 |
| 意图路由 | `src/lib/whatsapp/reply-router.ts` | AI 分类（询价/砍价/物流/售后）+ 回复策略分发 |
| 模板管理 | `src/lib/whatsapp/template.ts` | 模板 CRUD + Meta 审核状态机 + 变量填充 |
| 审计 | `src/lib/whatsapp/audit.ts` | send_logs 落库 + 限速检查 |

### 4.4 接口清单（新增）

| 接口 | 说明 |
|------|------|
| `POST /api/whatsapp/accounts` | 连接 WhatsApp 账号（Unipile OAuth） |
| `GET /api/whatsapp/inbox` | 统一收件箱（含 LinkedIn 消息） |
| `GET /api/whatsapp/conversations/:id` | 会话详情 + 时间线 |
| `POST /api/whatsapp/reply` | 24h 窗口内回复（Copilot：AI 起草→确认→发送） |
| `POST /api/whatsapp/templates` | 创建模板 |
| `POST /api/whatsapp/templates/:id/send` | 发送模板消息（Utility 场景） |
| `POST /api/whatsapp/webhook` | Unipile 消息事件推送（验签） |

### 4.5 环境变量（新增）

```
UNIPILE_WHATSAPP_WEBHOOK_SECRET  # 可复用现有 UNIPILE_WEBHOOK_SECRET 或独立
（BSP 直连备选：YCLOUD_API_KEY 等——PoC 结论后决定）
```

## 5. Testing Strategy（测试策略）

### 5.1 单元测试（重点：意图路由 + 限速器）
- reply-router：4 类意图分类准确率（用真实外贸询盘样本，目标 >85%）
- 模板变量填充：{{产品名}}/{{价格}} 替换正确、缺失变量报错
- 限速器：日模板上限（50）+ 新号阶梯逻辑
- 审计：send_logs 完整落库（source/templateId/cost）

### 5.2 集成测试（PoC 先行）
- **PoC（2 天）**：Unipile WhatsApp 账号连接 → 发 1 条 Service 测试消息 → 收 Webhook → 验证官方 API vs headless 模式。PoC 结论决定是否转 YCloud BSP。
- 完整链路：客户 WhatsApp 询盘 → Webhook → 收件箱 → AI 起草 → 确认 → 发送 → 落库
- 模板审核模拟：提交 1 个 Utility 模板（报价类）走 Meta 审核，记录周期

### 5.3 观察点（上线后监控）
- 回复率（目标 >30%，外贸询盘场景）
- 24h 窗口内回复占比（Service 免费占比，目标 >80%）
- 模板审核通过率（Utility 目标 >90%）
- 每客户月消息成本（目标 <$20）
- 账号健康度（质量分/投诉率——出现投诉即触发人工审查）

## 6. Rollout Strategy（上线策略）

### Phase 1：MVP（TradePulse 收尾后 2 周）
- [ ] PoC：Unipile WhatsApp 连通性验证（2 天，决策点）
- [ ] 账号连接 + 统一收件箱（F1/F2）
- [ ] 24h AI 回复（Copilot）（F3/F4）
- [ ] 客户视图打通（F5）
- [ ] MICHAEL DONE 实测：美国询盘跟进 + 巴西订单物流通知

### Phase 2：模板体系（+1 周）
- [ ] 模板管理 + Meta 审核状态机（F7）
- [ ] 订单/物流 Utility 模板（F6）
- [ ] 报价单生成（F10）
- [ ] 多语言回复（西语/葡语）（F11）

### Phase 3：商业化（+1 周）
- [ ] Marketing 合规触达（F9，复购场景）
- [ ] 定价：TradePulse 含 WhatsApp 模块 $199/月；独立模块 $99/月
- [ ] 会话标签 + 筛选（F12）

### 退出标准（失败即止损）
- PoC 发现 Unipile WhatsApp 为 headless 且封号风险不可控 → 转 YCloud BSP（成本+1-2 周）
- 30 天内 MICHAEL DONE 回复率 <20% 或消息成本 >$50/月 → 砍营销类功能，只保留询盘回复
- 模板审核 Utility 通过率 <70% → 内容策略重做（文案本地化+合规审查）
