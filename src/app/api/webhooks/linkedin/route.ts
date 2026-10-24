/**
 * Unipile Webhook 处理
 * 监听 LinkedIn 消息回复、连接请求接受等事件
 */

import { NextRequest, NextResponse } from 'next/server';

// Webhook 事件类型
interface UnipileWebhookEvent {
  type: string;
  data: {
    account_id: string;
    from_id: string;
    from_name: string;
    text: string;
    conversation_id?: string;
    timestamp: string;
  };
}

/**
 * 处理收到的消息回复
 */
async function handleMessageReceived(event: UnipileWebhookEvent) {
  const { account_id, from_id, from_name, text } = event.data;

  console.log(
    `[Webhook] 收到回复: ${from_name} (${from_id}) -> ${text}`,
  );

  // 1. 查找对应的 Lead 记录
  // 2. 用 AI 分析回复意图
  // 3. 更新 Lead 状态 + 通知用户

  // TODO: 实现数据库查找和 AI 分析逻辑
}

/**
 * 处理连接请求被接受
 */
async function handleConnectionAccepted(event: UnipileWebhookEvent) {
  const { account_id, from_id, from_name } = event.data;
  console.log(
    `[Webhook] 连接请求被接受: ${from_name} (${from_id})`,
  );
  // TODO: 更新 Lead 状态
}

/**
 * Webhook 入口
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('x-unipile-signature') || '';
  const payload = await req.text();

  // TODO: 验证 webhook 签名（Unipile 文档待确认）
  // const isValid = verifyWebhookSignature(payload, signature, WEBHOOK_SECRET);

  try {
    const event: UnipileWebhookEvent = JSON.parse(payload);

    switch (event.type) {
      case 'message.received':
        await handleMessageReceived(event);
        break;
      case 'connection.accepted':
        await handleConnectionAccepted(event);
        break;
      default:
        console.log(`[Webhook] 未处理的事件类型: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] 处理失败:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 },
    );
  }
}
