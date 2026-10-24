/**
 * 请求封装：统一 JWT 头 / 错误处理 / 401 跳登录
 * 后端 base URL 从环境变量注入（Taro 编译时）
 */

const BASE_URL = process.env.TARO_APP_API_BASE_URL || 'http://localhost:3000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: Record<string, unknown>;
  /** 是否携带 JWT（默认 true） */
  auth?: boolean;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export class ApiError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', data, auth = true } = options;

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = Taro.getStorageSync('tp_token');
    if (token) {
      header.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const res = await Taro.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header,
      timeout: 15000,
    });

    const body = res.data as ApiResponse<T>;

    if (res.statusCode === 401) {
      // token 失效 → 清空并跳登录
      Taro.removeStorageSync('tp_token');
      Taro.reLaunch({ url: '/pages/login/index' });
      throw new ApiError('登录已过期，请重新登录', 401);
    }

    if (res.statusCode >= 400 || !body.ok) {
      throw new ApiError(body.error || `请求失败(${res.statusCode})`, res.statusCode);
    }

    return body.data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // 网络层错误（超时/断网）
    throw new ApiError('网络异常，请检查网络后重试', -1);
  }
}

export const get = <T>(path: string, options?: RequestOptions) =>
  request<T>(path, { ...options, method: 'GET' });

export const post = <T>(path: string, data?: Record<string, unknown>, options?: RequestOptions) =>
  request<T>(path, { ...options, method: 'POST', data });

export const patch = <T>(path: string, data?: Record<string, unknown>, options?: RequestOptions) =>
  request<T>(path, { ...options, method: 'PATCH', data });
