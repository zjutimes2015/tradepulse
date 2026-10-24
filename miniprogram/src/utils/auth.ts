import Taro from '@tarojs/taro';
import { post } from '../api/client';

const TOKEN_KEY = 'tp_token';
const USER_KEY = 'tp_user';

/** 启动时检查登录态 */
export function checkLogin(): void {
  const token = Taro.getStorageSync(TOKEN_KEY);
  const currentPages = Taro.getCurrentPages();
  const current = currentPages[currentPages.length - 1];
  const isLoginPage = current?.route === 'pages/login/index';

  if (!token && !isLoginPage) {
    Taro.reLaunch({ url: '/pages/login/index' });
  }
}

export interface WechatUser {
  id: string;
  name: string;
  email?: string;
  hasLinkedIn: boolean;
  plan: string;
}

/** 微信一键登录 */
export async function loginWithWechat(): Promise<WechatUser> {
  const loginRes = await Taro.login();
  if (!loginRes.code) {
    throw new Error('获取微信登录凭证失败');
  }

  const user = await post<WechatUser>('/api/wechat/login', {
    code: loginRes.code,
  });

  // 后端返回的 token 放在 user 对象里
  Taro.setStorageSync(TOKEN_KEY, (user as unknown as { token: string }).token);
  Taro.setStorageSync(USER_KEY, JSON.stringify(user));
  return user;
}

export function getToken(): string {
  return Taro.getStorageSync(TOKEN_KEY);
}

export function getCachedUser(): WechatUser | null {
  const raw = Taro.getStorageSync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout(): void {
  Taro.removeStorageSync(TOKEN_KEY);
  Taro.removeStorageSync(USER_KEY);
  Taro.reLaunch({ url: '/pages/login/index' });
}
