# [TradePulse 情绪截流 + 价值分层] Design Document

> 来源：刘小排 design_doc_template
> 日期：2026-08-09
> 关联：基于 SailSniper AI 海外社媒营销逻辑（信息覆盖/情绪窗口/价值分层/信任预埋），剔除灰色路线（指纹伪造/批量养号），只取合规可落地部分

## Current Context

- TradePulse（贸脉）是面向中国工厂/外贸企业的 LinkedIn 海外客户开发 SaaS。技术栈：Next.js 15 (App Router) + Neon PostgreSQL + Drizzle ORM + Unipile API + OpenRouter/DeepSeek + Waffo Pancake + Better Auth。
- 现有能力：LinkedIn 信号监控（signals 模块）→ 线索评分（lead.signalScore）→ AI 消息生成（message-generator）→ 发送编排（outreach）→ 回复监控（webhook-handler）。数据模型：lead 表含 signalScore/signalSummary/signalDetails，SignalDetail 类型为 job_change | funding | hiring | expansion | post_engagement | competitor_engagement。
- 痛点/差距：
  1. 现有信号类型全是"积极事件"（融资/扩招/跳槽），**没有覆盖"情绪窗口"**——用户吐槽、抱怨竞品、表达急需的时刻，恰恰是转化率最高的时机（SailSniper 核心逻辑：卖水最好的时刻是TA在沙漠的时候）。
  2. lead 只有一个 0-100 的 signalScore，**没有价值分层**——无法区分"高净值潜客"和"白嫖党"，对所有人一视同仁发消息，低意向用户浪费配额（LinkedIn 每天 ≤20 连接 + 80 消息）。
  3. 没有"信任预埋/轻互动"阶段——跳过点赞、评论等混脸熟步骤直接发推销消息，转化率低且容易被举报（LinkedIn 风控）。

## Requirements

### Functional Requirements

1. **情绪信号检测**：扩展 SignalDetail 类型，新增情绪类信号（complaint / frustration / urgent_need / competitor_negative / praise_competitor），AI 对 LinkedIn 帖子/评论做情绪识别+意图打分。
2. **情绪窗口捕捉**：信号带 `sentiment_score`（-100 到 +100）和 `window_expires_at`（情绪窗口过期时间，默认 72 小时），窗口内信号进入"紧急队列"优先处理。
3. **价值分层（Lead Scoring 2.0）**：lead 表新增 `value_score`（0-100，消费意愿）+ `tier`（A/B/C/D 四层），AI 基于画像+行为+互动反馈动态更新。A=高净值（立即跟进），B=潜力（培育），C=观察（轻互动），D=过滤（不消耗配额）。
4. **轻互动培育（信任预埋）**：对 B/C 层 lead 自动执行拟人化轻互动（点赞、非营销评论），记录互动次数与反馈（回关/回复），达到阈值后升级到 A 层再发消息。互动频次受 LinkedIn 限速约束。
5. **共情话术模板**：message-generator 新增情绪共情模式——先认同情绪（"理解您的供应商让您失望了"）+ 再提供方案，替代硬广推销。
6. **竞品盲区狙击**：监控目标客户/竞品帖子下的负面反馈，自动生成"补位"策略（不@竞品、不贬低，只呈现自身优势）。

### Non-Functional Requirements

- **性能**：情绪分析延迟 < 5s/条（DeepSeek 流式）；全量重算分层每日 1 次（后台任务）。
- **可扩展**：信号类型用 jsonb 存，新类型无需迁移；后续可扩展 Twitter/Reddit 源（保留 source_platform 字段）。
- **可观测**：每类信号计数、分层分布、轻互动成功率、窗口内转化率 4 个核心指标。
- **安全**：严格遵守 LinkedIn 限速（≤20 连接 + 80 消息/天/号）；Copilot 模式优先——AI 生成建议，用户确认后执行；不碰任何账号伪造/指纹模拟（合规红线）。

## Design Decisions

### 1. 情绪信号 vs 事件信号：并存而非替代

Will implement 双轨制信号体系 because:
- 现有 job_change/funding 等事件信号是"积极入场"逻辑（客户在扩张=有采购需求），情绪信号是"痛点入场"逻辑（客户在吐槽=对现状不满），两类互补，覆盖不同转化场景。
- Trade-off：增加 AI 调用成本（每条帖子多一次情绪分析）。缓解：先用关键词粗筛（complaint/frustrated/disappointed 等 + 领域词），只对命中候选做 LLM 深度分析。

### 2. 价值分层：规则+AI 混合评分

Will implement 混合评分（规则权重 + AI 主观分）because:
- 纯规则（title/company_size/followers）可解释但粗糙；纯 AI 主观分灵活但不可复现。
- 方案：`value_score = 0.4×画像分(规则) + 0.3×行为分(互动反馈) + 0.3×AI意愿分(LLM判断)`。
- Alternatives considered：全 AI 打分（不可调试）、全规则（漏掉隐性高净值）。

### 3. 轻互动：Unipile 现有能力内实现，不加新依赖

Will implement 轻互动通过现有 Unipile client 扩展 because:
- 已验证 Unipile 支持 LinkedIn 点赞/评论（token 在 env），避免引入新的自动化层。
- 不新增"自动养号/指纹"功能——这是 SailSniper 被否掉的部分，与项目合规定位冲突。

## Technical Design

### 1. Core Components

```python
# lib/ai/sentiment-analysis.ts — 情绪识别（新增）
class SentimentAnalyzer:
    """对 LinkedIn 帖子/评论做情绪识别，输出情绪类型+强度+意图"""
    async def analyze(text: str, topic: str) -> SentimentResult:
        # returns { type: 'complaint'|'frustration'|'urgent_need'|'competitor_negative'|'praise_competitor'|'neutral',
        #           sentiment_score: -100..100, urgency: 0..100,
        #           summary: str, suggested_angle: str }

# lib/ai/lead-scoring.ts — 价值分层（新增）
class LeadScorer:
    """混合评分：画像规则 + 互动反馈 + AI 意愿分 → value_score + tier"""
    async def score(lead: Lead, profile: ProfileData, interactions: Interaction[]) -> LeadScore:
        # value_score = 0.4*profile_score + 0.3*behavior_score + 0.3*ai_intent_score
        # tier: A>=75, B>=55, C>=35, D<35

# lib/linkedin/interaction.ts — 轻互动编排（新增）
class LightInteractor:
    """对 B/C 层 lead 执行点赞/评论轻互动，记录反馈，升级分层"""
    async def interact(lead: Lead, action: 'like'|'comment') -> InteractionResult
    async def maybe_upgrade(lead: Lead) -> TierChange | None
        # 3次互动+1次回关 → 升级 A 层 → 触发 outreach
```

### 2. Data Models

```python
# db/schema/leads.ts — 扩展
class SignalDetail:  # 扩展 type 枚举
    type: 'job_change' | 'funding' | 'hiring' | 'expansion' | 'post_engagement'
        | 'competitor_engagement'
        | 'complaint' | 'frustration' | 'urgent_need' | 'competitor_negative' | 'praise_competitor'
    content: str; sourceUrl: str; detectedAt: str
    sentiment_score?: number   # -100..100（情绪信号必有）
    window_expires_at?: string # 情绪窗口过期时间

class Lead:  # 新增字段
    value_score: int       # 0-100 消费意愿分
    tier: 'A' | 'B' | 'C' | 'D'   # 价值分层
    tier_reason: string    # 分层依据（可解释）
    interaction_count: int  # 轻互动次数
    interaction_history: jsonb  # [{type:'like'|'comment', at, feedback:'replied'|'followed_back'|'none'}]

# db/schema/signals.ts — 新增（如独立信号表）
class Signal:
    id, leadId, type, sentiment_score, urgency, window_expires_at,
    source_platform: 'linkedin' (预留 'twitter'|'reddit'), content, detectedAt, handled: bool
```

### 3. Integration Points

- **数据流**：Unipile 拉取帖子/评论 → sentiment-analysis 情绪打分 → 命中情绪信号写入 Signal 表（窗口 72h）→ lead-scoring 更新 value_score/tier → B/C 层进 LightInteractor 轻互动队列 → 达阈值升级 A 层 → 现有 outreach 发送 → webhook-handler 回访更新互动反馈。
- **API 契约**：`POST /api/signals/reclassify`（手动重算）；`GET /api/leads?tier=A`（分层筛选）；`POST /api/leads/:id/interact`（手动触发轻互动）。
- **与现有模块关系**：完全复用现有 lib/linkedin/client.ts、lib/ai/message-generator.ts、webhook-handler.ts；新增 sentiment-analysis.ts、lead-scoring.ts、interaction.ts 三个文件。

### 4. Files Changes

- **新增**：`src/lib/ai/sentiment-analysis.ts`、`src/lib/ai/lead-scoring.ts`、`src/lib/linkedin/interaction.ts`
- **修改**：`src/db/schema/leads.ts`（新增字段+扩展 SignalDetail）、`src/db/schema/index.ts`（如新增 signals 表）、`src/app/[locale]/leads/page.tsx`（分层筛选 UI）、`src/app/[locale]/signals/page.tsx`（情绪信号展示+窗口倒计时）、`src/lib/ai/message-generator.ts`（共情话术模式）、`src/lib/ai/signal-analysis.ts`（接入情绪分析）
- **不动**：payment、auth、campaigns 核心逻辑、linkedin-accounts

## Implementation Plan

1. **Phase 1：数据层 + 情绪分析（3-4天）**
   - 扩展 schema（leads 新字段 + SignalDetail 枚举）
   - sentiment-analysis.ts（关键词粗筛 + LLM 深度分析）
   - signal-analysis.ts 接入情绪打分
   - 预期：现有信号流能产出情绪信号

2. **Phase 2：价值分层 + 轻互动（4-5天）**
   - lead-scoring.ts（混合评分）
   - interaction.ts（轻互动编排 + 限速控制）
   - leads 页面分层筛选 + 信号页面情绪窗口 UI
   - 预期：B/C 层自动轻互动，A 层触发 outreach

3. **Phase 3：生产就绪（3天）**
   - 共情话术模板接入 message-generator
   - 指标埋点（窗口内转化率、分层分布）
   - 后台定时重算（每日全量分层）
   - 预期：完整闭环，可上真实账号

## Testing Strategy

### Unit Tests

- sentiment-analysis：5 类情绪样本各 5 条，断言类型+分数区间；中性文本不误判为情绪信号。
- lead-scoring：给定画像/行为/AI 分，断言 value_score 计算与 tier 阈值；边界值 74/75、54/55。
- interaction：mock Unipile 响应，断言限速（≤20/天）、升级阈值（3 互动+1 回关）。

### Integration Tests

- 场景：mock LinkedIn 帖子"我们现在的供应商交货太慢了"，断言 → 情绪信号 complaint + urgency>70 → lead 进入 B 层 → 轻互动 3 次 → 升级 A → 生成共情话术（先认同后方案）。
- 环境：Neon 测试库 + mock Unipile；数据：预置 50 条帖子样本。

## Observability

### Logging

- 情绪分析：每条信号记录 model/耗时/命中类型（info）；LLM 超时降级记录（warn）。
- 轻互动：每次互动记录 lead/action/平台响应（info）；限速触发记录（warn）。
- 分层变更：A/B/C/D 升降级记录原因（tier_reason）。

### Metrics

- 情绪信号量（按类型计数）——目标：单号日均 ≥5 条有效情绪信号
- 分层分布（A/B/C/D 占比）——健康：A≥10%、D≤40%
- 轻互动成功率（回关/回复率）——目标 ≥15%
- 窗口内转化率（72h 内情绪信号 lead → replied）——目标 ≥20%（对比现有非情绪信号转化率）

## Future Considerations

### Potential Enhancements

- 扩展平台源：Twitter/X、Reddit（source_platform 已预留），情绪截流覆盖更广。
- 情绪热力图：按行业/地区聚合情绪趋势，反向指导选品（SailSniper"反向数据决策"）。
- 自动问答知识库：沉淀高频吐槽→标准答复，减少 AI 调用成本。
- WhatsApp 侧复用：whatsapp.ts 已有，情绪分析可用于 WhatsApp 询盘分级。

### Known Limitations

- LinkedIn 公开数据有限，情绪信号主要来自帖子/评论/公司动态，覆盖面受平台 API 限制。
- 轻互动仍受严格限速（≤20 互动/天），大规模培育需要多账号（合规前提下）。
- 情绪分析依赖 LLM，成本随信号量线性增长——关键词粗筛只能部分缓解。

## Dependencies

### Development Dependencies

- 现有：Next.js 15、Drizzle ORM、Unipile、OpenRouter/DeepSeek、Neon
- 新增：无（复用现有 AI client 与 Unipile client）
- 测试：vitest（复用现有）

## Security Considerations

- **合规红线（最高优先级）**：不实现账号指纹伪造、批量养号、自动注册等对抗平台功能；轻互动严格在 LinkedIn 允许速率内。
- 数据保护：Lead 互动历史含个人行为数据，仅本人/授权用户可见；数据库加密沿用现有。
- API 安全：新增接口走现有 auth 中间件（Better Auth），无未授权访问。
- 审计：分层变更与互动操作记录操作者（用户 or 系统），可追溯。

## Rollout Strategy

1. Development：Phase 1-3 本地开发 + Neon 测试库
2. Testing：单元 + 集成测试通过
3. Staging：部署到 staging 环境，用 mock 账号跑 3 天全流程
4. Production：灰度——先给 1 个测试用户开情绪信号+分层（不开自动轻互动），确认无风控问题后全量
5. Monitoring：上线后 2 周盯窗口内转化率 + 账号健康度（无风控警告）

## References

- SailSniper PPT（D:\HuaweiMoveData\Users\MICHAEL AN\Desktop\SailSniper-AI海外社媒品牌营销增长软件.pptx）——情绪窗口/价值分层/信任预埋三概念来源（剔除指纹基座）
- TradePulse AGENTS.md（/mnt/d/tradepulse/AGENTS.md）——现有架构与限速约束
- 哥飞方法论 skill（gefei-seo-outbound）——"AI 做勘探，人做决策"合规原则
- complaint-scout skill——情绪监控方法论（国内版验证过需求真实）
