import Taro from '@tarojs/taro';

/**
 * 订阅消息授权封装。
 * 微信订阅消息为"一次性授权"：每次发送前需用户点击授权。
 * 策略：在用户完成关键操作（确认发送/确认回复）后调用，最大化授权覆盖率。
 */
export async function requestSubscribe(templateIds: string[]): Promise<boolean> {
  if (!templateIds.length) return false;

  try {
    const res = await Taro.requestSubscribeMessage({
      tmplIds: templateIds,
    });

    // 任一模板授权成功即视为成功
    return templateIds.some((id) => res[id] === 'accept');
  } catch {
    return false;
  }
}

/** 格式化时间：xx分钟前 / xx小时前 / MM-DD */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '';

  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}天前`;
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 评分颜色 class */
export function scoreClass(score: number): string {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-mid';
  return 'score-low';
}

/** 信号类型中文标签 */
export const SIGNAL_TYPE_LABELS: Record<string, string> = {
  job_change: '职位变动',
  funding: '融资',
  hiring: '招聘扩张',
  expansion: '公司扩张',
  content_engagement: '内容互动',
  competitor_engagement: '竞品互动',
};

export function signalLabels(types: string[] | undefined): string[] {
  if (!types?.length) return [];
  return types.map((t) => SIGNAL_TYPE_LABELS[t] || t);
}
