# [TradePulse 探索腿 / 主动学习] Design Document

> 来源：刘小排 design_doc_template
> 日期：2026-10-05
> 关联：OpenOutreach Gate 拆解（/mnt/d/OpenOutreach解析/OpenOutreach源码拆解.md）·
>       SPEC-情绪截流-价值分层.md · MINIPROGRAM_SPEC.md
> 目标：给 TradePulse 加上"探索腿"，与现有"利用腿"（signalScore）组成主动学习闭环

---

## Current Context

- **系统概述**：TradePulse（贸脉）是面向中国工厂/外贸企业的 LinkedIn 海外客户开发
  SaaS。技术栈：Next.js 15 (App Router) + Neon PostgreSQL + Drizzle ORM + Unipile API
  + OpenRouter/DeepSeek + Better Auth + 微信小程序（Taro 4）。
- **现有判断层（利用腿）**：`src/lib/ai/signal-analysis.ts` 用 DeepSeek 对 profile 输出
  0-100 的 signalScore（点估计）；`src/lib/linkedin/outreach.ts` 的
  `discoverAndScoreLeads` 直接 `sort((a,b)=>b.signalScore-a.signalScore)`，永远只发分
  最高的。
- **数据模型**：`lead` 表含 signalScore / signalSummary / signalDetails(jsonb) /
  status(new/contacted/replied/meeting_booked/converted/closed) / messageSent /
  replyReceived / replyContent 等。
- **痛点与差距**：
  1. **纯利用、零探索**：所有配额砸在"当前分最高"的 lead 上。冷启动时 LLM 对所有
     lead 都是盲猜，却输出一个看起来笃定的 0-100 分。
  2. **零学习闭环**：每次 LLM 判断相互独立。用户在 Copilot 模式下的确认/拒绝、以及
     回复/不回复——这些**免费的真值标签完全没有被利用**。系统不会越用越准。
  3. **无不确定性度量**：0-100 是点估计，没有"这个判断有多可信"。模型不知道自己
     对什么不确定。
  4. **稀缺配额错配**：LinkedIn ≤20 连接 / 80 消息（每天每号）是稀缺资源，等价于
     OpenOutreach 的 credit。全部给利用，就没有余量去探索"未知区域"，导致长期困在
     初始盲猜里。

---

## Requirements

### Functional Requirements

1. **向量化**：把 lead 的 profile 文本（title + headline + industry + 信号摘要）编码
   为固定维度的 embedding，落库。
2. **概率预测**：对每个 lead 输出 `predict_prob`（P(fit) ∈ [0,1]），而非仅一个 0-100
   分。0-100 分保留为兼容字段。
3. **不确定性度量**：对每个 lead 输出 `uncertainty`（0-1）与 `information_gain`
   （信息增益代理值，非负）。
4. **双池划分**：把候选 lead 分入"利用池"（高 P(fit)）与"探索池"（高信息增益），
   两类池的选取标准不同、互斥。
5. **配额双轨分配**：每日 LinkedIn 配额按可配置比例分给利用/探索；冷启动与稳态两套
   默认值。
6. **标签自动采集**：从现有动作中免费采集真值标签——
   - Copilot 确认发送 → 正样本（label=1，source=copilot_confirm）
   - Copilot 划掉/拒绝 → 负样本（label=0，source=copilot_reject）
   - 收到回复 → 强正样本（label=1，weight=2，source=reply）
   - 发送后 N 天无回复 → 弱负样本（label=0，weight=0.5，source=timeout）
7. **增量学习**：样本量足够时（≥ MIN_TRAIN_SAMPLES），用全部标签增量重训轻量分类器，
   更新预测。
8. **可解释**：每个被推荐的 lead 展示"为什么推它"——利用池显示"P(fit)=0.82，因为…
   （沿用 signalSummary）"，探索池显示"信息增益高，因为离已知样本远 / 模型不确定"。
9. **冷启动保护与自我退休**：探索腿使用**绝对下限**阈值（非分位数），随标注增多自然
   不再达标而自我退休；利用腿阈值宁低勿高。
10. **集成不破坏 Copilot**：所有新逻辑对现有确认-发送流程透明；`outreach.ts` 的对外
    契约不变。

### Non-Functional Requirements

- **性能**：embedding + 预测 < 2s / lead（批量并发 3）；每日配额计算 < 500ms。
- **成本**：单 lead 判定不增加 LLM 调用次数（复用现有 signal-analysis 输出）；embedding
  走独立 API，单条成本量级 $0.0000x（见 Dependencies）。
- **可扩展**：预测器算法接口化（`FitPredictor`），GP / 分类器 / 规则可替换而不动调用方。
- **可观测**：探索/利用贡献比、学习曲线（预测准确率随标注数上升）、每日配额消耗。
- **安全/合规**：严格遵守 LinkedIn 限速（≤20 连接 / 80 消息 / 天 / 号）；标签数据仅
  本人可见；不实现任何账号伪造/指纹模拟。

---

## Design Decisions

### D1: 不确定性来源 —— 选 embedding + 轻量分类器（方案 C 简化版）

Will implement 方案 C because:
- 方案 A（LLM 多次采样求方差）：TP 已在为 LLM 付费，3-5 倍采样成本不可接受。
- 方案 B（LLM 自报 confidence + 距离）：LLM 自报置信度校准极差（嘴上 90% 实际命中
  60%），单独用不可靠。
- 方案 C（embedding + 浅层分类器）：embedding 走 API 便宜；浅层分类器（逻辑回归 / kNN）
  纯 TS 可跑、可解释、无 GPU/Python 侧车。
- Trade-off：需要引入 embedding 服务与一个新表；冷启动时无标签，分类器不可用——由
  D2 的距离项 + D6 的冷启动配额覆盖。

### D2: 信息增益用 BALD 的廉价代理（距离 + 决策边界接近度）

Will implement 代理公式 because:
- 完整 BALD 需要 GP 后验（Python + 矩阵运算），与 TS 栈冲突，且对当前样本量是过度
  设计。
- 代理：`information_gain = 0.6 × (1 - |p - 0.5| × 2) + 0.4 × norm_dist_to_nearest_labeled`。
  第一项对应 BALD 在 P≈0.5 处的峰值（模型最不确定 = 最能学习）；第二项补"分布外
  未知"（离所有已知样本都远）。
- Trade-off：它是启发式，不是真 BALD；但对"该给谁标签"的排序足够。
- Alternatives considered：纯距离（忽略预测分布）、纯不确定性（忽略分布外）。

### D3: 不引入 Python 服务，全 TS 实现

Will implement 在 Next.js 内 because:
- TP 是单一 TS 栈，跨语言侧车会引入部署复杂度和故障点。
- 逻辑回归 / kNN 用纯 TS（或 `ml-knn` / `ml-logistic-regression`）实现，384 维下
  性能充足。
- Trade-off：放弃 GP 的理论最优性，换取运维简单和上线速度。
- Alternative：把 OpenOutFind 的 `openoutlearn.GPBaldQualifier` 做成 Python 微服务——
  否决，违背"轻"的原则。

### D4: 双轨配额按冷启动/稳态切换（抄 OpenOutFind 三态）

Will implement 两档配额 because:
- 抄 OpenOutfind 的 cold / explore / exploit 三态，简化为 TP 的两档：
  - **cold**（已标注样本 < 15）：探索 70% / 利用 30%
  - **稳态**：利用 70% / 探索 30%
- 冷启动阶段证据不足，多探索能最快让系统学会"谁是我的客户"；稳态后证据充分，以
  利用为主。
- Trade-off：比例是拍的值，需真实数据校准；放 `.env` 可调，不硬编码。

### D5: 阈值宁低勿高 + 绝对下限 + 自我退休

Will implement 绝对下限阈值 because:
- 抄 OpenOutFind 血泪教训：`min_gp_confidence` 从 0.9 降到 0.7，因为 0.9 时"一个 pool
  够不到的门，是把流水线关死，而不是把花费管住"。
- 探索腿用 `min_information_gain`（绝对下限，默认 0.15），**禁用分位数规则**——
  分位数永远非空，根本不是门，会让探索永远停不下来。
- 随标注增多，信息增益普遍下降，低于下限 → 探索腿自然自我退休，配额回流给利用。
- Trade-off：下限值需实测调优；给两个 campaign 的放行率作为校准指标。

### D6: 标签来自 Copilot + 结果信号（免费采集）

Will implement 免费标签回流 because:
- 用户在 Copilot 模式下的确认/拒绝是最高质量的人工标签，且已经在发生，零新增成本。
- 回复是最强正信号（真金白银的意向）；超时未回复是弱负信号。
- Trade-off：确认/拒绝存在用户偷懒（无脑点确认）的噪声；用 weight 区分强/弱标签，
  并在 Observability 里监控确认率异常。

---

## Technical Design

### 1. Core Components

```typescript
// src/lib/ai/embedding.ts — 向量化
export interface Embedder {
  /** 把 lead 的文本表征编码为固定维度向量 */
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  readonly dim: number; // 384（BAAI/bge-small-en-v1.5）
}
export function buildLeadText(lead: {
  title: string; company: string; industry: string;
  profileHeadline: string; signalSummary?: string;
}): string; // 拼接为可表征文本

// src/lib/ai/fit-predictor.ts — 预测器（利用腿的概率化）
export interface FitPrediction {
  predictProb: number;      // P(fit) ∈ [0,1]
  uncertainty: number;      // 0-1，越高越不确定
  informationGain: number;  // BALD 代理值，≥0
  model: 'lr' | 'knn' | 'cold'; // 冷启动时 model='cold'
}
export interface FitPredictor {
  predict(embedding: number[]): FitPrediction;
  train(samples: { embedding: number[]; label: 0|1; weight: number }[]): void;
  readonly fitted: boolean;
}

// src/lib/ai/acquisition.ts — 采集规划（双池 + 配额）
export interface AcquisitionPlan {
  exploit: LeadCandidate[]; // 利用池：按 predictProb 降序
  explore: LeadCandidate[]; // 探索池：按 informationGain 降序
  quota: { exploit: number; explore: number };
  phase: 'cold' | 'steady';
}
export function planAcquisition(
  candidates: LeadCandidate[], predictor: FitPredictor,
  accountDailyLimit: number, labeledCount: number,
): AcquisitionPlan;

// src/lib/ai/label-collector.ts — 标签采集
export type LabelSource = 'copilot_confirm' | 'copilot_reject' | 'reply' | 'timeout';
export function recordLabel(params: {
  leadId: string; label: 0|1; source: LabelSource;
  weight?: number; // reply→2, timeout→0.5, 其余→1
}): Promise<void>;
export async function retrainIfReady(predictor: FitPredictor): Promise<boolean>;
```

### 2. Data Models

```typescript
// src/db/schema/leads.ts — 扩展 lead 表
// 新增字段：
//   embedding        vector(384)   —— Neon 原生支持 pgvector；降级方案：jsonb
//   predictProb      real          默认 0
//   uncertainty      real          默认 0
//   informationGain  real          默认 0
//   labeled          boolean       默认 false
//
// 新增表：lead_label（真值标签流）
export const leadLabel = pgTable('lead_label', {
  id: text('id').primaryKey().$defaultFn(createId),
  leadId: text('lead_id').notNull().references(() => lead.id),
  campaignId: text('campaign_id').notNull(),
  userId: text('user_id').notNull(),
  label: integer('label').notNull(),               // 0 | 1
  weight: real('weight').default(1).notNull(),     // 强/弱标签
  source: text('source').notNull(),                // LabelSource
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 新增表：acquisition_log（每日配额与决策留痕）
export const acquisitionLog = pgTable('acquisition_log', {
  id: text('id').primaryKey().$defaultFn(createId),
  userId: text('user_id').notNull(),
  campaignId: text('campaign_id').notNull(),
  day: text('day').notNull(),                      // YYYY-MM-DD
  phase: text('phase').notNull(),                  // cold | steady
  exploitCount: integer('exploit_count').default(0).notNull(),
  exploreCount: integer('explore_count').default(0).notNull(),
  labeledTotal: integer('labeled_total').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 3. Integration Points

数据流：
```
LinkedIn 搜索
  → batchAnalyzeLeads（现有，出 signalScore）
  → Embedder.embedBatch（新增）
  → FitPredictor.predict（新增，出 P/不确定性/信息增益）
  → planAcquisition（新增，划分利用池/探索池 + 配额）
  → 利用池：走现有 generatePersonalizedMessage → Copilot 确认 → executeSend
     探索池：走轻互动 / 低成本试探（可先复用发送，标记为 explore）
  → 用户确认/拒绝 → recordLabel（新增）
  → 回复 Webhook（现有）→ recordLabel(label=1, source=reply)
  → 定时任务（现有 cron）→ 超时判定 → recordLabel(label=0, source=timeout)
  → retrainIfReady（新增，cron 内）→ 模型更新 → 下一轮预测更准
```

API 契约：
- `GET /api/leads?pool=exploit|explore` — 分层筛选（小程序遥控器用）
- `POST /api/leads/:id/label` — 手动打标（可选）
- 现有 `/api/*` 契约不变。

与现有模块的关系：
- **复用**：`lib/ai/client.ts`（LLM 客户端）、`lib/ai/signal-analysis.ts`（保留为
  利用腿的语义依据，其输出进入 lead embedding 文本）、`lib/linkedin/outreach.ts`
  （发送编排）、`lib/linkedin/webhook-handler.ts`（回复）。
- **新增**：`embedding.ts`、`fit-predictor.ts`、`acquisition.ts`、`label-collector.ts`。

### 4. Files Changes

- **新增**：
  - `src/lib/ai/embedding.ts`
  - `src/lib/ai/fit-predictor.ts`
  - `src/lib/ai/acquisition.ts`
  - `src/lib/ai/label-collector.ts`
  - `src/db/schema/lead-label.ts`、`src/db/schema/acquisition-log.ts`
  - `src/db/migrations/00XX_*.sql`（pgvector 扩展 + 新表）
- **修改**：
  - `src/db/schema/leads.ts`（新增 4 字段 + 关系）
  - `src/db/schema/index.ts`（导出新表）
  - `src/lib/linkedin/outreach.ts`（`discoverAndScoreLeads` 后接 `planAcquisition`）
  - `src/app/[locale]/leads/page.tsx`（分层视图 + 可解释性展示）
  - `src/app/api/leads/route.ts`（pool 筛选参数）
  - cron 任务文件（重训 + 超时打标）
- **不动**：payment、auth、campaigns 核心逻辑、linkedin-accounts、小程序审核相关代码。

---

## Implementation Plan

1. **Phase 1：向量化 + 概率化 + 双池（不复训，纯静态）** — 3-4 天
   - 新增 embedding.ts（对接 embedding API）
   - 新增 fit-predictor.ts 的 `cold` 模式（无标签时用 signalScore 归一化作 P 的代理）
   - 新增 acquisition.ts（双池 + 配额，冷启动档）
   - lead 表加字段 + migration（pgvector）
   - outreach.ts 接入 planAcquisition
   - 预期：每日配额按 70/30 分配给探索/利用，可解释性 UI 上线

2. **Phase 2：标签回流 + 增量学习** — 4-5 天
   - 新增 label-collector.ts
   - lead_label / acquisition_log 表
   - Copilot 确认/拒绝、回复 Webhook、超时 cron 三处打标接入
   - fit-predictor.ts 实现逻辑回归训练（`train`）+ `retrainIfReady`
   - 预期：模型随标注增长，预测准确率可观测上升

3. **Phase 3：生产就绪** — 3 天
   - 阈值校准（跑两个 campaign 看放行率，抄 OpenOutFind 的"宁低勿高"）
   - 指标埋点（探索/利用贡献、学习曲线）
   - 定时重训调度（每日 1 次）
   - 预期：闭环可上真实账号，探索腿能自我退休

---

## Testing Strategy

### Unit Tests
- `embedding.buildLeadText`：给定 lead，断言拼接文本稳定、含关键字段。
- `fit-predictor`：给定固定样本集，断言拟合后 P(fit) 单调、边界值（P=0.5 时
  uncertainty=1）。
- `acquisition.planAcquisition`：
  - cold 阶段断言配额 70/30；
  - 稳态断言 30/70；
  - 断言利用池/探索池互斥；
  - 断言信息增益低于下限的 lead 不进探索池。
- `label-collector`：断言四种 source 的 weight 正确（reply=2、timeout=0.5）。
- Mock 策略：embedding API 用固定向量 mock；LLM 用固定 JSON mock。

### Integration Tests
- 场景：预置 50 条 profile（10 条已标注）→ 断言 planAcquisition 产出非空双池，
  配额和 = 日限额，探索池 non-empty。
- 场景：模拟 3 次 Copilot 确认 + 2 次拒绝 → 断言 lead_label 落库、
  retrainIfReady 触发、predictProb 发生变化。
- 环境：Neon 测试库（含 pgvector 扩展）；mock Unipile / embedding / LLM。

---

## Observability

### Logging
- 每次 planAcquisition：记录 phase / 配额 / 双池大小（info）。
- 每次 recordLabel：记录 leadId / label / source / weight（info）。
- 每次 retrain：记录样本数 / 拟合前后训练准确率（info）；样本不足跳过（debug）。
- 阈值未达标导致探索池为空：记录（warn）——回声 OpenOutFind "gate 关闭→discovery
  接管"的思路，此处在 TP 是"探索腿退休→配额回流利用"。

### Metrics
- **探索/利用贡献比**：每日实际发出中 explore / exploit 占比，对比目标配额。
- **学习曲线**：predictProb 的排序质量（如 top-decile 命中率）随 labeled_total 上升。
- **确认率异常**：copilot_confirm 比例 > 95% 或 < 20% → 报警（用户可能在无脑点或
  系统推荐严重失准）。
- **探索腿退休点**：labeled_total 达到多少后探索池自然为空。

---

## Future Considerations

### Potential Enhancements
- 升级到真 GP / BALD（把 `FitPredictor` 实现换掉即可，接口不动）。
- 情绪信号（SPEC-情绪截流）的 sentiment_score 并入 embedding 文本，增强表征。
- 多臂老虎机（Thompson Sampling）替代固定配额比例，自动学最优探索率。
- 跨用户联邦：多个张总的标签共享（需脱敏 + 合规评审）。

### Known Limitations
- 代理公式是启发式，非理论最优 BALD。
- 冷启动阶段（<15 标签）预测器不可用，退化为 signalScore 归一化代理。
- 标签噪声：用户无脑确认会污染训练集，靠 weight + 异常监控缓解。
- embedding 依赖外部 API（可用性/成本/延迟单点）。

---

## Dependencies

### Development Dependencies
- 现有：Next.js 15、Drizzle、Neon、OpenRouter/DeepSeek、vitest。
- **新增**：
  - embedding 服务（三选一）：
    - 硅基流动 BAAI/bge-m3（OpenAI 兼容，中文+多语，便宜）— 推荐
    - 智谱 embedding-3（国内，稳定）
    - Jina embeddings（英文强）
  - `pgvector`（Neon 原生支持，需 `CREATE EXTENSION vector`）
  - TS 数值库：`ml-knn` 或自写逻辑回归（384 维，无重依赖）

---

## Security Considerations

- **认证**：新增 API 走现有 Better Auth 中间件，无未授权访问。
- **数据保护**：lead embedding 与标签含个人行为数据，仅本人/授权用户可见；沿用现有
  数据库加密。
- **合规红线（最高优先级）**：不实现账号指纹伪造、批量养号、自动注册；配额双轨仍
  严格在 LinkedIn 允许速率内（≤20 连接 / 80 消息 / 天 / 号）。
- **审计**：每次打标与重训落库，可追溯。

---

## Rollout Strategy

1. **Development**：Phase 1-3 本地开发 + Neon 测试库（含 pgvector）。
2. **Testing**：单元 + 集成测试通过。
3. **Staging**：用 mock 账号跑 3 天全流程，观察配额分配与学习曲线。
4. **Production 灰度**：先给 1 个测试用户（MICHAEL DONE，dogfooding）开探索腿
   （先手动确认配额比例，不开自动重训），确认无风控问题后全量。
5. **Monitoring**：上线后 2 周盯"探索/利用贡献比"与账号健康度（无风控警告）。

---

## References

- `/mnt/d/OpenOutreach解析/OpenOutreach源码拆解.md` — Gate 成本控制、双门设计、
  阈值调优血泪史（本文档的设计源头）
- `D:\tradepulse\docs\SPEC-情绪截流-价值分层.md` — 价值分层（利用腿）现状
- `D:\tradepulse\DESIGN_DOC.md`（PRD v2.0）— TP 整体产品定义、竞品情报
- `D:\tradepulse\AGENTS.md` — 工程约束、LinkedIn 限速
- OpenOutFind 参考实现：`core/pipeline/ready_pool.py`（Gate）、`core/conf.py`
  （双阈值）、`core/ml/qualifier.py`（GP/BALD）
