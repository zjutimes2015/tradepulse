/**
 * Unipile 客户端封装
 * 处理 LinkedIn 账号连接、API 调用、会话维护
 */

const BASE_URL = process.env.UNIPILE_BASE_URL || '';
const ACCESS_TOKEN = process.env.UNIPILE_ACCESS_TOKEN || '';

interface UnipileConfig {
  baseUrl: string;
  accessToken: string;
}

// 简单的 fetch 封装，避免依赖 unipile-node-sdk（减少安装）
async function unipileFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Unipile API error:', response.status, error);
    throw new Error(`Unipile API error: ${response.status}`);
  }

  return response.json();
}

/**
 * 连接 LinkedIn 账号
 */
export async function connectLinkedInAccount(
  username: string,
  password: string,
): Promise<{ accountId: string }> {
  const result = await unipileFetch<{ id: string }>('/api/v1/accounts', {
    method: 'POST',
    body: JSON.stringify({
      provider: 'LINKEDIN',
      username,
      password,
    }),
  });
  return { accountId: result.id };
}

/**
 * 断开 LinkedIn 账号
 */
export async function disconnectLinkedInAccount(
  accountId: string,
): Promise<void> {
  await unipileFetch(`/api/v1/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

/**
 * 获取账号状态
 */
export async function getAccountStatus(
  accountId: string,
): Promise<{ status: string; dailyUsage: number }> {
  const result = await unipileFetch<{ status: string }>(
    `/api/v1/accounts/${accountId}`,
  );
  return { status: result.status, dailyUsage: 0 };
}

/**
 * 发送 LinkedIn 消息
 */
export async function sendMessage(
  accountId: string,
  recipientId: string,
  text: string,
): Promise<{ messageId: string }> {
  const result = await unipileFetch<{ id: string }>(
    '/api/v1/messages',
    {
      method: 'POST',
      body: JSON.stringify({
        account_id: accountId,
        recipient_id: recipientId,
        text,
      }),
    },
  );
  return { messageId: result.id };
}

/**
 * 发送连接请求（带附言）
 */
export async function sendConnectionRequest(
  accountId: string,
  recipientId: string,
  message?: string,
): Promise<{ invitationId: string }> {
  const result = await unipileFetch<{ id: string }>(
    '/api/v1/invitations',
    {
      method: 'POST',
      body: JSON.stringify({
        account_id: accountId,
        recipient_id: recipientId,
        message,
      }),
    },
  );
  return { invitationId: result.id };
}

/**
 * 搜索 LinkedIn 用户
 */
export async function searchProfiles(params: {
  accountId: string;
  keywords?: string;
  currentCompany?: string[];
  industries?: string[];
  location?: string;
  limit?: number;
}): Promise<any[]> {
  const { accountId, keywords, currentCompany, industries, location, limit = 20 } = params;
  const result = await unipileFetch<any>(
    `/api/v1/search?account_id=${accountId}&keywords=${encodeURIComponent(keywords || '')}&limit=${limit}`,
  );
  return result.items || [];
}
