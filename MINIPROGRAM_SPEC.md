# TradePulse 贸脉 - 微信小程序端 SPEC

> 版本：v1.0 · 2026-07-31 · 状态：待评审
> 配套文档：DESIGN_DOC.md（产品总 Spec）· AGENTS.md（工程约束）

---

## 1. Current Context（现状）

- PC Web 版已完成骨架：Next.js 15 + Drizzle + Better Auth + 三张业务表（linkedin-accounts / campaigns / leads）+ LinkedIn/Unipile 执行层 + AI 信号/消息模块，`pnpm build` 通过
- Unipile 已注册并连通：`api27.unipile.com:15722`，Access Token 已写入 `.env`
- 腾讯云国内服务器 + 域名备案：✅ 已完成（小程序后端与 HTTPS 域名前置条件满足）
- 目标用户：中国外贸工厂老板/业务员（以下简称"张总"），40-55 岁，手机 = 微信，每天使用 3-5 分钟，低频审批型使用模式

## 2. Requirements（需求）

### P0（MVP 必须有）

| ID | 需求 | 说明 |
|----|------|------|
| F1 | 微信一键登录 | wx.login → code2session → openid 绑定用户，无密码 |
| F2 | 今日看板 | 待确认信号数 / 未读回复数 / 今日触达数 / 漏斗摘要 |
| F3 | 信号列表 | 高意向客户列表，AI 评分排序，状态筛选（待确认/已发送/已忽略） |
| F4 | 信号详情 + 确认发送 | 信号标签、AI 英文消息预览、[确认发送]/[忽略] 按钮 |
| F5 | 回复列表 | 未读红点，回复来自海外客户 |
| F6 | 回复详情 + 确认回复 | 原文 + AI 中文翻译 + AI 起草回复 + [确认发送] |
| F7 | 数据漏斗 | 触达→好友→回复→会议→成交 五级漏斗，7d/30d |
| F8 | LinkedIn 账号状态 | 已连接/异常/限速警告，一目了然 |
| F9 | 订阅消息 + 短信通知 | 有回复 → 双通道推送；待确认 → 订阅消息推送 |
| F10 | 微信支付 | JSAPI 支付，¥299/月、¥699/月、年付折扣 |

### P1（MVP 后 2 周内）

| ID | 需求 | 说明 |
|----|------|------|
| F11 | 目标市场配置（轻量） | 小程序内改行业/地区/职位关键词，PC 深度配置 |
| F12 | 信号详情内查看对方主页快照 | 头像/公司/职位摘要（后端抓取缓存） |
| F13 | 会话流视图 | 与单个客户的消息往来时间线 |
| F14 | 模板消息自定义 | 更换 AI 消息的语气模板（商务/轻松/直给） |

### 非功能需求（NF）

| ID | 约束 |
|----|------|
| NF1 | 小程序代码不得出现"翻墙/LinkedIn 自动化"等敏感词，定位"外贸客户开发管理工具" |
| NF2 | 所有 LinkedIn/Unipile 调用只发生在后端，小程序零直连 |
| NF3 | 关键 API 响应 < 1s（国内服务器），信号列表 < 2s |
| NF4 | 通知防打扰：同一事件 24h 内最多推送 1 次，可全局开关 |
| NF5 | 操作审计：确认发送/回复必须落库（send_logs），风控可追溯 |
| NF6 | 支持 iOS/Android 微信，iPhone 全系 + 主流安卓，基础库 ≥ 3.0 |

## 3. Design Decisions（设计决策）

### D1: 小程序框架选 Taro（React）而非原生/uni-app
- **选 Taro 因为**：用户技术栈是 React/Next.js，Taro 使用 React 语法，组件与 hooks 心智可复用；一套代码未来可编译支付宝/抖音小程序（外贸老板也有用这些的）
- 放弃原生：wxml/wxss 语法栈与现有技能不匹配，维护双栈成本高
- 放弃 uni-app：Vue 语法，与 Next.js 项目割裂

### D2: 后端中转架构——小程序永不直连 Unipile
- **选后端中转因为**：① 审核安全（小程序代码零海外痕迹）；② 网络干净（用户设备只连国内服务器，全链路无墙）；③ 风控可控（限额、Copilot 确认、审计全部在后端）
- 小程序只调自有 Next.js API（`/api/mobile/*`、`/api/wechat/*`）
- 风险：多一跳延迟，国内同区域 < 50ms，可接受

### D3: 通知双通道——订阅消息 + 阿里云短信
- **选双通道因为**：微信订阅消息为"一次性授权"（每次推送前需用户重新点授权），单通道会漏关键事件
- 策略：
  - 客户有回复（高价值事件）→ 订阅消息 + 短信双发（短信 ¥0.04/条，仅此事件用）
  - 待确认信号（中价值）→ 仅订阅消息
  - 用户在小程序内每次关键操作后弹订阅授权，最大化授权覆盖
- 备选：若订阅消息模板审核被拒，全部降级为短信 + 小程序内红点

### D4: 支付走微信支付 JSAPI（国内）
- **选微信支付因为**：目标客户只信任微信支付；Waffo 是海外收款通道（给 IngredientLens 用），国内 B 端客户走微信支付 + 对公转账双轨
- 前置：企业主体小程序 + 微信支付商户号（申请周期 1-3 天，需营业执照）
- 年付优惠：¥299/月 → ¥2990/年（省 ¥598）

### D5: 小程序 = 遥控器，PC = 管理后台（功能边界）
- 小程序只做"看 + 点确认"：信号、回复、漏斗、账号状态
- PC 做"配 + 管理"：建投放、配目标、批量操作、数据导出
- 原因：张总在手机上不配置复杂参数；减少小程序页面复杂度 = 更快过审 + 更少 bug

### D6: 合规包装
- 名称：贸脉（英文 TradePulse 仅技术命名）
- 类目：企业管理 > 外贸客户管理（按微信实际可用类目调整）
- 文案口径："AI 帮你跟进海外客户"，绝不出现 LinkedIn/自动化/代理等词

### D7: 小程序备案确认
- 域名备案 ≠ 小程序备案。小程序需在微信公众平台单独提交 ICP 备案（2023.9 起强制）
- 假设用户已完成或立即启动，未完成则阻塞发布（不阻塞开发）

## 4. Technical Design（技术设计）

### 4.1 总体架构

```
┌─────────────────────┐
│ 微信小程序（Taro）    │  张总手机：看板/确认/回复/漏斗
│ 页面 9 个 + TabBar 4 │
└──────────┬──────────┘
           │ HTTPS（wxs 合法域名 = 已备案域名）
┌──────────▼──────────┐
│ Next.js 后端（国内）  │  现有项目扩展：/api/wechat/* /api/mobile/*
│ 业务逻辑/限额/审计/AI │  + 微信支付 + 阿里云短信
└──────────┬──────────┘
           │ HTTPS（服务器间）
┌──────────▼──────────┐
│ Unipile（海外）      │  LinkedIn 执行：加好友/消息/收回复
└──────────┬──────────┘
           │ Webhook 回调
┌──────────▼──────────┐
│ 通知网关             │  订阅消息 + 短信 → 张总手机
└─────────────────────┘
```

### 4.2 页面结构（Taro）

```
miniprogram/
├── package.json
├── config/
│   ├── index.ts          # Taro 编译配置（appid、weapp 平台）
│   └── dev.ts / prod.ts
├── project.config.json   # 微信开发者工具项目配置
└── src/
    ├── app.config.ts     # 页面注册 + TabBar(首页/信号/回复/我的) + 订阅模板ID
    ├── app.tsx           # 启动：登录态检查
    ├── api/
    │   ├── client.ts     # 请求封装（JWT 头、错误码、401 跳登录）
    │   ├── auth.ts       # login / subscribe
    │   ├── signals.ts    # list / detail / confirm / ignore
    │   ├── replies.ts    # list / detail / confirm / regenerate
    │   ├── dashboard.ts  # 看板 + 统计
    │   └── settings.ts   # get / patch / account-status
    ├── pages/
    │   ├── login/index.tsx          # 微信一键登录
    │   ├── index/index.tsx          # 今日看板（Tab）
    │   ├── signals/index.tsx        # 信号列表（Tab）
    │   ├── signal-detail/index.tsx  # 信号详情+确认发送
    │   ├── replies/index.tsx        # 回复列表（Tab）
    │   ├── reply-detail/index.tsx   # 回复详情+确认回复
    │   ├── stats/index.tsx          # 数据漏斗
    │   ├── account/index.tsx        # LinkedIn 账号状态
    │   └── settings/index.tsx       # 我的（Tab：通知/目标/关于）
    ├── components/
    │   ├── signal-card.tsx          # 信号卡片（评分/标签/摘要）
    │   ├── message-preview.tsx      # 英文消息预览（可复制）
    │   ├── empty-state.tsx
    │   └── confirm-dialog.tsx       # 确认弹窗（防误触）
    └── utils/
        ├── auth.ts        # token 存取（storage）
        ├── subscribe.ts   # 订阅授权封装（requestSubscribeMessage）
        └── format.ts      # 时间/数字/评分颜色
```

### 4.3 API 接口清单（后端新增，全部需登录态）

| 方法 | 路径 | 说明 | 依赖现有模块 |
|------|------|------|-------------|
| POST | /api/wechat/login | wx.login code → jscode2session → openid 绑定 → 返回 JWT | Better Auth 或自定义 JWT |
| POST | /api/wechat/subscribe | 记录订阅授权结果 | - |
| GET | /api/mobile/dashboard | 看板聚合（待确认/未读/今日触达/漏斗） | leads, campaigns |
| GET | /api/mobile/signals | 信号列表 ?status=&page=&limit= | leads + signal-analysis |
| GET | /api/mobile/signals/:id | 信号详情（含 AI 消息全文） | leads |
| POST | /api/mobile/signals/:id/confirm | 确认发送（触发 outreach.executeSend） | linkedin/outreach.ts |
| POST | /api/mobile/signals/:id/ignore | 忽略 | leads |
| GET | /api/mobile/replies | 回复列表 ?unread=1 | webhook-handler 落库数据 |
| GET | /api/mobile/replies/:id | 回复详情（原文+AI 翻译+起草回复） | ai/reply-handler.ts |
| POST | /api/mobile/replies/:id/confirm | 确认发送回复 | linkedin/outreach.ts |
| POST | /api/mobile/replies/:id/regenerate | 重新起草回复 | ai/message-generator.ts |
| GET | /api/mobile/stats | 漏斗数据 ?range=7d\|30d | leads 聚合 |
| GET | /api/mobile/settings | 通知开关/目标摘要/账号状态 | linkedin-accounts |
| PATCH | /api/mobile/settings | 通知开关等轻量配置 | - |

> 短信发送由后端在 Webhook 处理时内部触发（阿里云 SMS SDK），不暴露给小程序。

### 4.4 数据库新增表

```sql
-- 微信用户绑定
CREATE TABLE wechat_users (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  openid      TEXT NOT NULL UNIQUE,
  unionid     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 通知记录
CREATE TABLE notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  type       TEXT NOT NULL,           -- message_reply | signal_ready | system
  title      TEXT NOT NULL,
  body       TEXT,
  payload    JSONB,                    -- { lead_id, reply_id, ... }
  channel    TEXT NOT NULL,            -- wechat_subscribe | sms
  status     TEXT NOT NULL DEFAULT 'sent',  -- sent | failed
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 操作审计（风控）
CREATE TABLE send_logs (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  lead_id    TEXT REFERENCES leads(id),
  action     TEXT NOT NULL,           -- confirm_send | confirm_reply | ignore | regenerate
  detail     JSONB,                    -- 请求上下文：消息内容/评分/耗时
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.5 微信登录链路（关键细节）

1. 小程序 `wx.login()` 拿 `code`
2. POST `/api/wechat/login` → 后端调 `https://api.weixin.qq.com/sns/jscode2session?appid=&secret=&js_code=&grant_type=authorization_code`
3. 返回 `openid` → 查 `wechat_users`，无则创建并绑定到新/现有用户
4. 签发 JWT（沿用 Better Auth 的 session 机制或独立 mobile token，二选一，**推荐独立 token**：与 PC session 解耦，小程序 token 有效期 30 天 + 自动续期）
5. 小程序存 storage，所有 `/api/mobile/*` 请求带 `Authorization: Bearer <token>`

> 环境变量新增：`WECHAT_APPID`、`WECHAT_APP_SECRET`、`SMS_ACCESS_KEY_ID`、`SMS_ACCESS_KEY_SECRET`、`WECHAT_PAY_MCH_ID`、`WECHAT_PAY_API_KEY`

### 4.6 通知链路（有回复场景）

```
Unipile Webhook（message received）
  → 后端校验 + 落库（lead 更新 + 新增回复）
  → AI 分析（reply-handler：翻译/意图/起草回复）
  → 写 notifications 表
  → 发订阅消息（模板 ID 映射）→ 失败则仅短信
  → 发阿里云短信（仅 message_reply 事件）
  → 小程序红点（下次打开拉取未读数）
```

幂等：Webhook 事件带 `event_id`，notifications 表对 (user_id, event_id) 唯一，重复回调不重复推送。

## 5. Testing Strategy（测试策略）

| 层级 | 内容 |
|------|------|
| 后端单测 | wechat login 的 openid 绑定幂等；signals confirm 的限额校验；notifications 去重 |
| API 集成 | 用微信测试号跑通 code2session；Postman 全量 mobile 接口（模拟 JWT） |
| 真机测试（重点） | iPhone 15 + 小米：登录、订阅授权弹窗、确认发送、短信接收 |
| Webhook 联调 | Unipile 沙箱触发 message received → 通知全链路（订阅+短信） |
| 支付测试 | 微信支付沙箱：¥0.01 支付 → 回调 → 订阅状态开通 |
| 边界 | 无 LinkedIn 账号时看板空态；token 过期自动跳登录；弱网超时重试 |
| 审核自检 | 全量代码 grep 敏感词：linkedin/自动化/翻墙/proxy → 零命中 |

## 6. Rollout Strategy（上线计划）

| 阶段 | 内容 | 工期 |
|------|------|------|
| 0 | 微信公众平台：注册企业小程序 + 类目申请 + 小程序 ICP 备案 + 微信支付商户号（**现在启动，与开发并行**） | 3-7 天（等待） |
| 1 | Taro 脚手架 + 登录链路 + 看板 + 信号列表/详情/确认 | 5 天 |
| 2 | 回复列表/详情/确认 + 数据漏斗 + 账号状态 | 4 天 |
| 3 | 订阅消息 + 短信 + 微信支付 + 设置页 | 3 天 |
| 4 | 后端 mobile API 联调 + 真机测试 + 审核自检 | 3 天 |
| 5 | 提审 → 修复 → 上线 | 3-7 天（等待） |

**总计：约 3 周（含等待期）。**

里程碑：
- M1（Week 1）：张总能在小程序看到信号并确认发送
- M2（Week 2）：回复闭环（收到回复 → 中文翻译 → 确认回复）
- M3（Week 3）：付费可用（微信支付 + 通知全通）

## 7. 风险与对策

| 风险 | 等级 | 对策 |
|------|------|------|
| 订阅消息模板审核被拒 | 中 | 降级：短信 + 小程序红点；换类目再申 |
| 小程序审核敏感词 | 中 | D6 文案规范 + 审核自检步骤 |
| 微信支付商户号延迟 | 中 | 并行启动；先用对公转账收款（人工开通） |
| jscode2session 依赖 appid/secret 安全 | 低 | 存后端 env，绝不进小程序代码 |
| Taro 构建在 D 盘慢 | 低 | 构建产物放 node_modules 缓存，必要时 WSL 内构建 |
| 张总不习惯"确认"操作 | 低 | 首次引导动画 + 默认 Copilot 提示文案 |

## 8. 环境变量增量清单

```bash
# 微信小程序
WECHAT_APPID=""
WECHAT_APP_SECRET=""
# 阿里云短信
SMS_ACCESS_KEY_ID=""
SMS_ACCESS_KEY_SECRET=""
SMS_SIGN_NAME=""          # 签名：贸脉
SMS_TEMPLATE_CODE=""      # 回复提醒模板
# 微信支付
WECHAT_PAY_MCH_ID=""
WECHAT_PAY_API_KEY=""
WECHAT_PAY_NOTIFY_URL="https://<域名>/api/wechat/pay/notify"
```

## 9. 待确认事项（阻塞项）

1. 小程序 AppID（企业主体）——用户注册后提供
2. 小程序 ICP 备案是否已完成（域名备案 ≠ 小程序备案）
3. 微信支付商户号申请状态
4. 订阅消息模板：需在公众平台「公共模板库」选可用模板，审核通过后把模板 ID 给开发
