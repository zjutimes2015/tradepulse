import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { fetchSignalDetail, confirmSend, ignoreSignal, Signal } from '../../api/signals';
import { requestSubscribe } from '../../utils/format';
import { signalLabels } from '../../utils/format';
import './index.less';

// 订阅消息模板 ID（审核通过后填入）
const SUBSCRIBE_TEMPLATE_IDS: string[] = [];

export default function SignalDetailPage() {
  const router = useRouter();
  const id = router.params.id || '';

  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await fetchSignalDetail(id);
      setSignal(res);
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleConfirm = async () => {
    if (!signal || submitting) return;
    setSubmitting(true);
    try {
      await confirmSend(signal.id);
      // 关键操作后请求订阅授权（下次推送可用）
      await requestSubscribe(SUBSCRIBE_TEMPLATE_IDS);
      Taro.showToast({ title: '已发送 ✓', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 600);
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '发送失败',
        icon: 'none',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleIgnore = async () => {
    if (!signal || submitting) return;
    setSubmitting(true);
    try {
      await ignoreSignal(signal.id);
      Taro.showToast({ title: '已忽略', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 600);
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !signal) {
    return <View className='loading'>加载中…</View>;
  }

  return (
    <View className='detail'>
      {/* 客户信息 */}
      <View className='card'>
        <View className='head'>
          <Text className='name'>{signal.name}</Text>
          <Text className='score'>{signal.signalScore}</Text>
        </View>
        <Text className='company'>
          {signal.company} · {signal.title}
        </Text>
        {signal.location ? <Text className='location'>📍 {signal.location}</Text> : null}
      </View>

      {/* 信号依据 */}
      <View className='card'>
        <Text className='section-title'>为什么找他（AI 分析）</Text>
        <View className='tags'>
          {signalLabels(signal.signalTypes).map((label) => (
            <Text key={label} className='tag'>
              {label}
            </Text>
          ))}
        </View>
        <Text className='summary'>{signal.signalSummary}</Text>
      </View>

      {/* AI 消息预览 */}
      {signal.status === 'pending' ? (
        <View className='card'>
          <Text className='section-title'>AI 拟好的英文消息</Text>
          <View className='message-box'>
            <Text className='message-text'>{signal.aiMessage || '生成中…'}</Text>
          </View>
          <Text className='hint'>发送后对方会收到加好友申请 + 这条消息</Text>

          {/* 操作按钮 */}
          <View className='actions'>
            <Button className='btn-ghost action-btn' onClick={handleIgnore} disabled={submitting}>
              忽略
            </Button>
            <Button
              className='btn-primary action-btn'
              onClick={handleConfirm}
              loading={submitting}
            >
              确认发送
            </Button>
          </View>
        </View>
      ) : (
        <View className='card'>
          <Text className='section-title'>已发送的消息</Text>
          <View className='message-box muted'>
            <Text className='message-text'>{signal.aiMessage || '（无记录）'}</Text>
          </View>
          {signal.status === 'replied' ? (
            <Text className='status-badge'>💬 对方已回复，去"回复"页查看</Text>
          ) : (
            <Text className='status-badge'>⏳ 等待对方回应…</Text>
          )}
        </View>
      )}
    </View>
  );
}
