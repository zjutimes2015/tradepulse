# TradePulse 贸脉 — 产品需求文档（PRD v2.0）

> 版本：v2.0 · 2026-08-11 · 状态：MVP 收尾 + 竞品情报注入
> 配套文档：MINIPROGRAM_SPEC.md（小程序端）· WHATSAPP_SPEC.md（WhatsApp 扩展）· AGENTS.md（工程约束）
> 本文档基于 2026-08 竞品深挖（PhantomBuster / Clay / Gingiris）重写，核心变化：
> ① 新增竞品情报章节（PB/Clay 拆解结论 → 策略映射）
> ② 定价模型重构（对标 PB/Clay，透明化 + 双轨）
> ③ 新增内容获客资产（tradepulse-outbound-playbook 分发计划）
> ④ 需求清单新增 F15-F20（数据瀑布、定价透明页、playbook 资产、用量看板、客服 SOP、退出信号）

---

## 1. Current Context（现状）

- **产品定位**：面向中国外贸工厂/货代的 AI 海外客户开发助手。监控 LinkedIn 买家信号（融资/招人/扩张/职位变动/动态互动）→ AI 评分筛选高意向客户 → 自动生成个性化英文消息 → 用户确认后经 Unipile 桥接层发送 → 回复监控与 AI 起草回复。
- **一句话差异化**：**"Clay 需要 GTM 工程师，贸脉需要张总。"** —— 竞品要么贵（Clay $167-495/月，需 RevOps 专才配置瀑布），要么险（PhantomBuster cookie 模拟，封号高发）；贸脉 = 中文 + 微信小程序 + Copilot 人审 + ¥299/月，零配置开箱即用。
- **双端形态**：PC Web（配置+管理后台）+ 微信小程序（遥控器：看信号/点确认），共享同一后端。
- **用户画像**：张总——中国外贸工厂老板/业务员，40-55 岁，手机=微信，每天用 3-5 分钟，低频审批型使用。
- **首个试验客户**：MICHAEL DONE（用户自有雨刮器工厂），dogfooding 验证模式。
- **当前进度**：
  - PC 版骨架完成：Next.js 15 + Drizzle + Better Auth + 三张业务表 + LinkedIn/Unipile 执行层 + AI 信号/消息模块
  - Unipile 已注册连通（api27.unipile.com:15722，token 在 .env）
  - 小程序端 Taro 4 已写完并编译成功（touristappid 游客模式打开）
  - WhatsApp 扩展 SPEC 已定（WHATSAPP_SPEC.md），db/schema 已含 whatsapp.ts
  - 腾讯云国内服务器 + 域名备案 ✅
  - 待办：build 验证 → 首次 GitHub 提交（本 PRD 随附）→ Cloudflare 部署 → 生产 DB 迁移 → 首单跑通

---

## 2. 竞品情报（2026-08 实测深挖）

### 2.1 PhantomBuster —— 技术底座是负资产

| 维度 | 情报 | 对 TP 的含义 |
|---|---|---|
| 技术本质 | 云端 Puppeteer 无头浏览器 + session cookie 注入模拟登录 | **负资产**：违反 LinkedIn ToS、DOM 变更即坏、封号高发 |
| 对外 API | REST（X-Phantombuster-Key），**控制自动化但不控制数据**——无查询端点，先跑 Phantom 再下载结果 | TP 用 Unipile 官方桥接，合规+实时，架构先进一个世代 |
| 定价 | $69-439/月（≈¥500-3200），消耗制（执行小时+邮箱额度+AI 额度），实际贵 50-80% | **定价不透明是差评高发区**（Trustpilot 3.5/5），TP 必须一次说清 |
| 口碑 | G2 4.4 / Capterra 4.5 / Trustpilot 3.5——客服差、定价不透明、封号 | 被封号用户在流失 → 合规是 TP 的获客话术 |
| 启示 | 卖"活数据"不是"数据仓库"；Phantom+Workflow 两级抽象好 | TP 做"动作库+流程编排"两层；卖信号不卖数据库 |

### 2.2 Clay —— 数据层碾压，执行层空档

| 维度 | 情报 | 对 TP 的含义 |
|---|---|---|
| 公司 | 2017 成立，2025 ARR $100M（2023 $16M→2025 $100M），2026 估值 $5B | 赛道天花板极高，验证 LinkedIn 获客市场巨大 |
| 技术 | 200+ 数据供应商 marketplace + **Waterfall 瀑布富化**（邮箱命中率 78% vs 单源 42%）+ Claygent AI | 数据层是它的核武器，TP **不碰 marketplace**（正面打必死） |
| 信号 | job change / web intent / 竞争对手互动 | 与 TP 6 类信号撞车——但 Clay 是"广"，TP 是"深"（AI 评分可解释） |
| 定价 | Free→$167→$495→Enterprise，双币（Data Credits + Actions），Actions 用完即暂停 | 双币=隐藏成本；TP 订阅制透明价是差异化 |
| 致命弱点 | **需 GTM 工程师配置瀑布**，上手成本高（Zapier 文章实锤：多数团队外包给 agency） | **TP 营销话术最锋利的一句**："Clay 需要 GTM 工程师，贸脉需要张总" |
| 启示 | 垂直场景（中国外贸老板）+ AI 原生（信号→消息→回复全 AI）是 TP 的生存空间 | 做深不做广；数据层短期放弃，信号深度做成可量化卖点 |

### 2.3 Gingiris —— 技能分发是 2026 最便宜的获客杠杆

| 维度 | 情报 | 对 TP 的含义 |
|---|---|---|
| 模式 | 158 工具目录 + 41 个开源 Skill（MIT）+ 博客 SEO，三层漏斗：免费内容→信任→付费咨询/手册 | **playbook 不是给"人"读的，是给"AI agent"装的**（npx skills add 一键安装，1,936+ 次安装） |
| SKILL 结构 | SKILL.md 壳（四语言 description + Triggers 关键词）+ references/ 干货库；MIT 协议 | 直接复刻格式，半小时可产出 TP 版 playbook |
| 变现 | 免费 skill 引流 → Gumroad 手册 $249 → 咨询 | TP 免费 playbook 引流 → TP 官网/公众号转化（卖产品不卖咨询） |
| 启示 | AI 时代的流量入口是 agent 的工具库，不是 Google 搜索框 | TP 上线即发 playbook，在"AI 获客方法论"心智先占地 |

### 2.4 三条情报 → TP 策略映射表

| 竞品情报 | TP 策略 | 落地动作 |
|---|---|---|
| PB：cookie 封号高发、用户流失 | 合规即卖点 | 营销话术主打"永不封号"（Unipile 官方桥接 + Copilot 人审） |
| PB：定价不透明差评 | 定价透明化 | F16 定价透明页：一次说清 ¥299 含什么、不含什么 |
| Clay：需 GTM 工程师 | 零配置开箱即用 | 中文界面 + 微信小程序遥控器 + 默认 Copilot 模式 |
| Clay：数据瀑布碾压 | 不碰 marketplace，做信号深度 | AI 评分 0-100 可解释，从 1000 条筛 10 条对的 |
| Gingiris：skill 分发获客 | playbook 资产化 | F15 tradepulse-outbound-playbook 三渠道发布 |

---

## 3. Requirements（需求清单）

### P0（MVP 必须有）

| ID | 需求 | 说明 | 来源 |
|----|------|------|------|
| F1 | LinkedIn 账号连接 | Unipile OAuth 连接，basic / sales_navigator 两型，状态管理（连接中/活跃/挂起/过期） | 原 PRD |
| F2 | 投放管理 | 创建 Campaign：目标行业/地区/关键词/公司规模/信号类型，Copilot / Auto 双模式 | 原 PRD |
| F3 | 信号监控 | 每日扫描目标人群，检测 6 类信号（job_change/funding/hiring/expansion/post_engagement/competitor_engagement），AI 评分 0-100 | 原 PRD |
| F4 | AI 消息生成 | 基于信号详情生成个性化英文首条消息，用户确认后发送（Copilot 默认） | 原 PRD |
| F5 | 回复监控 | Unipile Webhook 接收回复 → 红点提醒 → AI 中文翻译 + 起草回复 → 确认发送 | 原 PRD |
| F6 | 数据漏斗 | 触达→好友→回复→会议→成交 五级漏斗，7d/30d | 原 PRD |
| F7 | 限速保护 | 每账号每日连接 ≤40 / 消息 ≤20，软硬双限（硬限在 Unipile 层，软限在应用层） | 原 PRD |
| F8 | 中文界面 | 所有用户面向内容为中文；AI 生成的对外消息为英文 | 原 PRD |
| F9 | **定价透明页** | PC 端定价页：¥299/月含什么（信号 200 条/月、消息 50 条/月、1 账号）、超出怎么收费、年付折扣——一次说清，不留"隐藏成本"（对标 PB 差评教训） | 新增 |
| F10 | **用量看板** | 每月用量实时展示（信号条数/消息条数/剩余额度），接近上限提前提醒——透明定价的配套 | 新增 |

### P1（MVP 后 2 周内）

| ID | 需求 | 说明 | 来源 |
|----|------|------|------|
| F11 | 会话流视图 | 与单个客户的消息往来时间线 | 原 PRD |
| F12 | 模板消息自定义 | 语气模板（商务/轻松/直给） | 原 PRD |
| F13 | 对方主页快照 | 头像/公司/职位摘要（后端抓取缓存） | 原 PRD |
| F14 | 微信支付 | JSAPI，¥299/月、¥699/月、年付折扣（小程序端） | 原 PRD |
| F15 | **Playbook 内容资产** | `tradepulse-outbound-playbook`：外贸获客方法论打包成 SKILL.md（Gingiris 格式：四语言 description + Triggers + references 干货库），发布 HuggingFace + skills.sh + GitHub 三渠道 | 新增（Gingiris 启示） |
| F16 | **信号评分可解释性** | 每个信号展示评分依据（"因为该买家 30 天内融资 + 扩招，匹配度 87/100"），对抗 Clay"黑箱瀑布"，让张总看懂为什么推这个客户 | 新增（Clay 对照） |
| F17 | **退出信号** | 客户长期不回复/已读不回 → 标记"放弃"并停止追触达（避免骚扰降账号权重） | 新增（风控补强） |

### P2（1-2 个月，视首单数据）

| ID | 需求 | 说明 | 来源 |
|----|------|------|------|
| F18 | WhatsApp 触达扩展 | 已定 WHATSAPP_SPEC.md：外贸老板常用 WhatsApp 联系海外客户，Unipile 已支持，扩一个发送通道 | 已有 SPEC |
| F19 | 数据瀑布轻量版 | 用 UnipifAPI（220 统一数据 API，$0.001/credit）做轻量富化：邮箱补充、公司规模验证——**不做 marketplace**，只做 2-3 个最常用字段 | 新增（Clay 数据层降级方案） |
| F20 | 竞品监控 | 监控 PB/Clay 定价变化与功能更新，季度竞品快照（防被下沉打击） | 新增（防守） |

### 非功能需求（NF）

| ID | 约束 |
|----|------|
| NF1 | 小程序代码零敏感词（不出现"翻墙/LinkedIn 自动化"），定位"外贸客户开发管理工具" |
| NF2 | 所有 LinkedIn/Unipile 调用只发生在后端，小程序零直连 |
| NF3 | 关键 API 响应 < 1s（国内服务器），信号列表 < 2s |
| NF4 | 通知防打扰：同一事件 24h 内最多推送 1 次，可全局开关 |
| NF5 | 操作审计：确认发送/回复必须落库（send_logs），风控可追溯 |
| NF6 | LinkedIn 风控：Copilot 模式优先（AI 生成→人确认→发送），降封号风险 |
| NF7 | **成本红线**：单条触达成本 < ¥1（AI 消息生成 + Unipile 调用），超出触发告警（单位经济守护） |

---

## 4. Design Decisions（设计决策）

### D1: 执行层选 Unipile API 桥接，而非浏览器自动化
- **选 Unipile 因为**：浏览器自动化（Playwright/Puppeteer 控制 LinkedIn）脆弱——DOM 变更即坏、封号风险高、维护成本爆炸（PhantomBuster 全公司的架构就建在这上面，Trustpilot 3.5 分）。Unipile 是成熟的 LinkedIn API 桥接服务，提供连接管理/搜索/消息/Webhook 全套能力。
- 代价：月费 + 每账号成本，依赖第三方可用性（单点故障风险，需监控）。

### D2: 小程序 = 遥控器，PC = 管理后台
- **选这个边界因为**：张总手机上不配置复杂参数（目标市场/关键词/模板），只做"看 + 点确认"；减少小程序页面复杂度 = 更快过审 + 更少 bug。
- PC 做"配 + 管理"：建投放、批量操作、数据导出。

### D3: 后端中转架构——小程序永不直连 Unipile
- **选后端中转因为**：① 审核安全（小程序代码零海外痕迹）；② 网络干净（用户设备只连国内服务器，全链路无墙）；③ 风控可控（限额/Copilot/审计全在后端）。
- 小程序只调自有 API（`/api/mobile/*`、`/api/wechat/*`）。
- 代价：多一跳延迟，国内同区域 < 50ms，可接受。

### D4: 双支付通道——海外 Waffo（PC 端）+ 国内微信支付（小程序端）
- **选双通道因为**："收款通道是出海产品的命脉，命脉不能只有一条"（IngredientLens 的 Creem 崩溃教训）。
- PC 端（海外客户）：Waffo Pancake（3.9% + $0.50）
- 小程序端（国内张总）：微信支付 JSAPI + 对公转账双轨

### D5: Copilot 模式为默认，Auto 模式需显式开启
- **选 Copilot 默认因为**：LinkedIn 自动化封号是最大风险；"机器生成信号 + 人确认发送"同时满足效率和风控。Auto 模式仅对已验证账号开放，且受更严限速。
- 这也是与 Clay（全自动瀑布）和 PB（全自动 cookie）的差异化：**人审 = 合规 = 卖点**。

### D6: AI 层走 OpenRouter（DeepSeek 主力），可切换
- **选 OpenRouter 因为**：一个 key 多模型，DeepSeek 性价比高（英文消息生成质量足够），可随时切更强模型（如 Claude）不用改代码。
- AI_BASE_URL/AI_MODEL 已参数化在 .env，无供应商锁定。

### D7: 定价模型——订阅制 + 用量透明（对标 PB/Clay 双币陷阱）
- **选订阅制因为**：① PB 的执行小时 + 邮箱额度消耗制被用户骂"隐形消费"（Trustpilot 差评主因）；② Clay 的 Data Credits + Actions 双币更复杂，张总看不懂；③ 张总习惯"包月"心智（¥299 一价全包）。
- **用量透明**：F9 定价页 + F10 用量看板配套，超量提前 3 天提醒，绝不静默断供。
- 梯度：¥299/月（1 账号，200 信号/50 消息）→ ¥699/月（3 账号，600 信号/200 消息）→ 年付 8 折。

### D8: 内容获客——playbook 分发优先于付费投放
- **选 playbook 因为**：Gingiris 验证——41 个免费 Skill（MIT）带来 1,936+ 次安装，AI agent 会引用你的方法论 = 2026 年的 SEO。TP 预算为零时，内容分发是最便宜的增长杠杆。
- F15 落地：按 Gingiris SKILL.md 格式写 `tradepulse-outbound-playbook`，发 HuggingFace + skills.sh + GitHub 三渠道，文末挂 TP 官网。
- 同时把 playbook 精华改写为公众号文章（国内张总获客）+ LinkedIn 英文帖（海外 AI 圈口碑）。

### D9: 不做数据 marketplace（Clay 主场，正面打必死）
- **明确不做**：200+ 数据供应商整合、瀑布富化引擎、广告受众推送。这是 Clay 的核武器（$100M ARR 的根基），TP 投入十年也追不上。
- **降级方案**：F19 用 UnifAPI 补 2-3 个最常用字段（邮箱/公司规模），够用就好。
- 反面论证：如果 TP 想做 marketplace，意味着产品从"外贸获客工具"变成"GTM 数据基础设施"，用户从张总变成 GTM 工程师——这是完全不同的生意，不是 TP 该做的。

### D10: 竞品防御——季度快照 + 下沉预警
- Clay $167 Launch 套餐正在下沉，PB 竞品文章满天飞（用户流失中）。TP 必须每季度做一次竞品快照（F20），盯三件事：① 竞品是否推出中文/小老板套餐；② 定价是否下探到 ¥500 以下；③ 是否有微信/小程序动作。任何一项触发 → 产品策略评审。

---

## 5. Technical Design（技术设计）

### 5.1 系统架构

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│ 微信小程序    │────▶│  Next.js 15 后端  │────▶│   Unipile    │
│ Taro 4       │     │  (国内腾讯云)      │     │  api27       │
│ 看+点确认     │◀────│  /api/mobile/*    │◀────│  Webhook     │
└──────────────┘     │  /api/wechat/*    │     └─────────────┘
                     └───┬──────┬───────┘
                         │      │
              ┌──────────▼──┐ ┌─▼──────────────┐
              │ Neon Postgres│ │ OpenRouter/DeepSeek│
              │ Drizzle ORM  │ │ 信号分析+消息生成   │
              └─────────────┘ └────────────────┘
```

### 5.2 数据模型（三张业务表 + 扩展）

**linkedin_account**（LinkedIn 账号）
- id (cuid2 PK) / userId / unipileAccountId / type (basic|sales_navigator) / status (connecting|active|suspended|expired)
- dailySendLimit (默认20) / dailyConnectLimit (默认40) / warmupDays / lastUsedAt / createdAt / updatedAt

**campaign**（投放）
- id / userId / name / status (draft|running|paused|completed) / mode (copilot|auto)
- targetIndustries / targetLocations / targetKeywords / targetCompanySize（jsonb 数组）
- signalTypes（jsonb） / dailySendLimit (默认10) / dailyConnectLimit (默认20) / messageTemplate
- 统计列：totalLeads / totalContacted / totalReplied / totalMeetings
- assignedAccountId → linkedin_account.id
- **新增**：usageBudget（jsonb：monthlySignalLimit / monthlyMessageLimit）/ usageResetAt

**lead**（线索）
- id / campaignId → campaign.id / userId
- 画像：linkedinProfileUrl / linkedinId / name / title / company / industry / location / profileHeadline
- AI：signalScore (0-100) / **scoreReason（新增：评分依据，F16 可解释性）** / signalSummary / signalDetails (jsonb: SignalDetail[]) / aiAnalysis
- 触达：messageGenerated / messageSent / sentAt / replyReceived / replyContent
- 状态：status (new|contacted|replied|meeting_booked|converted|closed|**abandoned（新增，F17 退出信号）**)
- 增强：email / phone / **enrichedAt（新增，F19 富化时间戳）**

**SignalDetail 接口**（信号明细）
```ts
interface SignalDetail {
  type: 'job_change' | 'funding' | 'hiring' | 'expansion' | 'post_engagement' | 'competitor_engagement';
  content: string;
  sourceUrl: string;
  detectedAt: string;
}
```

**新增表 usage_log**（用量日志，F10 用量看板）
- id / userId / accountId / metric (signal|message|connect) / amount / campaignId / createdAt
- 用途：用量看板实时数据源 + NF7 成本红线监控

### 5.3 核心模块（src/ 结构）

| 模块 | 路径 | 职责 |
|------|------|------|
| LinkedIn 业务层 | `src/lib/linkedin/` | client.ts（Unipile 客户端）/ search.ts（搜索+信号检测）/ outreach.ts（发送编排）/ webhook-handler.ts（回复监控） |
| AI 层 | `src/lib/ai/` | client.ts（LLM 客户端）/ signal-analysis.ts（信号强度评分+评分依据）/ message-generator.ts（消息生成）/ reply-handler.ts（回复处理） |
| 用量层 | `src/lib/usage/` | **新增**：用量记录（usage_log 写入）、配额校验（NF7 成本红线）、超量提醒（提前 3 天） |
| 数据库 | `src/db/schema/` | 三张业务表 + SignalDetail + usage_log + whatsapp.ts |
| 页面 | `src/app/[locale]/` | (marketing) 落地页+**定价页（F9）** / (protected) dashboard+campaigns+leads+signals+**usage（F10）**+settings / auth / docs |

### 5.4 接口清单（对外）

| 接口 | 端 | 说明 |
|------|-----|------|
| `/api/mobile/*` | 小程序→后端 | 看板/信号列表/信号详情/确认发送/回复列表/回复确认/漏斗/账号状态/用量 |
| `/api/wechat/*` | 小程序→后端 | 微信登录 code2session / 订阅消息 / 微信支付 JSAPI |
| Unipile Webhook | Unipile→后端 | 回复/连接请求事件推送（UNIPILE_WEBHOOK_SECRET 验签） |
| Waffo Webhook | Waffo→后端 | PC 端支付回调 |

### 5.5 环境变量（.env 23 项）

数据库 DATABASE_URL / 认证 BETTER_AUTH_SECRET + GITHUB/GOOGLE OAuth / AI（AI_API_KEY+AI_BASE_URL+AI_MODEL）/ Unipile（BASE_URL+ACCESS_TOKEN+WEBHOOK_SECRET）/ Waffo（MERCHANT_ID+PRIVATE_KEY）/ RESEND 邮件 / 对象存储（STORAGE_*）/ GA

---

## 6. Testing Strategy（测试策略）

### 6.1 单元测试（重点：AI 层 + 限速器 + 用量层）

- signal-analysis：6 类信号识别准确性、评分分布合理性、**scoreReason 可解释性（F16：评分依据是否真实可追溯，禁止幻觉）**
- message-generator：英文消息个性化（引用信号内容）、无幻觉（不编造对方公司信息）
- 限速器：软硬双限逻辑（40 连接/20 消息/天，跨时区重置）
- **usage 层（新增）**：配额校验边界（恰好用完/超 1 条）、超量提醒触发时机（提前 3 天）
- webhook-handler：验签失败拒绝、重复事件去重

### 6.2 集成测试

- Unipile 连通性：✅ 已实测（api27 连通，token 有效）
- 完整链路：搜索→检测信号→生成消息→发送→Webhook 回推（用 MICHAEL DONE 真实账号小规模跑 3-5 条）
- 数据库迁移：drizzle-kit push 到生产 Neon 后 schema 校验
- **成本红线（NF7）**：单条触达成本实测 < ¥1，超支触发告警

### 6.3 观察点（上线后监控指标）

- 发送成功率（Unipile API 错误率，目标 >95%）
- 回复率（目标 >10%，行业均值 5-15%）
- 好友接受率（连接请求维度）
- 封号/限速事件数（风控红线：出现 1 次即触发人工审查）
- 漏斗转化：触达→好友→回复→会议→成交
- **用量消耗速度（新增）**：¥299 套餐用户月均用量 vs 额度——定价是否合理（若 80% 用户用不完 = 定价偏高可提价；若 80% 超量 = 定价偏低需调梯度）

---

## 7. Rollout Strategy（上线策略）

### 阶段 1：收尾验证（当前）
- [x] build 修复（hole.tsx 语法错误）
- [x] 竞品深挖（PB/Clay/Gingiris，本文档）
- [ ] build 通过 → dev 起服务验证核心页面
- [ ] 生产数据库迁移（Neon）
- [ ] GitHub 首次提交 + 推送（本文档随附）

### 阶段 2：部署上线
- [ ] GitHub 推送（zjutimes2015/tradepulse，需 gh 登录）
- [ ] Cloudflare 部署（opennextjs-cloudflare，模板已配 deploy 脚本）
- [ ] 域名 + HTTPS 验证

### 阶段 3：首单跑通（2 周）
- [ ] MICHAEL DONE 接入：连接 LinkedIn 账号 → 建 1 个 Campaign（雨刮器目标市场）→ 跑通 3-5 条真实触达
- [ ] 验证 Copilot 流程体验（信号→消息→确认→发送→回复）
- [ ] 复盘数据：回复率/成本/耗时 → 校准 NF7 成本红线

### 阶段 4：内容获客（与阶段 3 并行）
- [ ] 写 `tradepulse-outbound-playbook`（Gingiris 格式，F15）
- [ ] 发布三渠道：HuggingFace + skills.sh + GitHub
- [ ] 精华改写公众号文章《中国工厂怎么用 AI 在 LinkedIn 上找美国买家》
- [ ] LinkedIn 英文帖（海外 AI 圈口碑）

### 阶段 5：商业化
- [ ] 小程序发布（AppID/备案/商户号/订阅模板——已列 MINIPROGRAM_SPEC）
- [ ] 定价验证：¥299/月起步（F9 透明定价页），MICHAEL DONE 案例作为获客素材
- [ ] 拓展 5 家外贸工厂种子客户
- [ ] 首次竞品快照（F20，季度制启动）

### 退出标准（失败即止损）
- 2 周内 MICHAEL DONE 首单跑不通（Unipile 发送失败/被封）→ 评估替代执行层
- 回复率 <5% 且无法改进 → 转向纯信号监控产品（不做触达）
- 单条触达成本 >¥3（NF7 红线 3 倍）且无法下降 → 暂停 Auto 模式，只留 Copilot

---

## 8. 附录：与竞品的定位对照（一句话版）

| 产品 | 一句话 | TP 的打法 |
|---|---|---|
| PhantomBuster | 云端 cookie 脚本农场（$69-439/月） | 合规替代："它会被封号，你不会" |
| Clay | GTM 数据基础设施（$167-495/月） | 垂直降维："它需要 GTM 工程师，你需要张总" |
| Gingiris | 增长方法论分发站（免费 skill + 付费咨询） | 借打法："用它的分发渠道，抢 AI 获客方法论心智" |
| **TradePulse** | **中国外贸老板的 AI 海外客户开发助手（¥299/月）** | **合规 + 垂直 + 透明 + 内容分发，四板斧** |
