import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { fetchReplyDetail, confirmReply, regenerateReply, Reply } from '../../api/replies';
import { requestSubscribe } from '../../utils/format';
import './index.less';

// 订阅消息模板 ID（审核通过后填入）
const SUBSCRIBE_TEMPLATE_IDS: string[] = [];

export default function ReplyDetailPage() {
  const router = useRouter();
  const id = router.params.id || '';

  const [reply, setReply] = useState<Reply | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    try {
      const res = await fetchReplyDetail(id);
      setReply(res);
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleRegenerate = async () => {
    if (!reply || regenerating) return;
    setRegenerating(true);
    try {
      const res = await regenerateReply(reply.id);
      setReply({ ...reply, suggestedReply: res.suggestedReply });
    } catch {
      Taro.showToast({ title: '重新起草失败', icon: 'none' });
    } finally {
      setRegenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!reply || submitting) return;
    setSubmitting(true);
    try {
      await confirmReply(reply.id);
      await requestSubscribe(SUBSCRIBE_TEMPLATE_IDS);
      Taro.showToast({ title: '已回复 ✓', icon: 'success' });
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

  if (loading || !reply) {
    return <View className='loading'>加载中…</View>;
  }

  const intentLabel =
    reply.interestLevel >= 70 ? '🔥 高意向' : reply.interestLevel >= 40 ? '👍 有兴趣' : '👀 观望中';

  return (
    <View className='reply-detail'>
      {/* 客户 */}
      <View className='card'>
        <Text className='name'>{reply.leadName}</Text>
        <Text className='company'>{reply.leadCompany}</Text>
        <Text className='intent'>{intentLabel}</Text>
      </View>

      {/* 原文 + 翻译 */}
      <View className='card'>
        <Text className='section-title'>客户原话（英文）</Text>
        <View className='box'>
          <Text className='box-text'>{reply.originalText}</Text>
        </View>

        <Text className='section-title split'>中文翻译</Text>
        <View className='box highlight'>
          <Text className='box-text'>{reply.translatedText || '（翻译生成中…）'}</Text>
        </View>
      </View>

      {/* AI 起草回复 */}
      {reply.status !== 'replied' ? (
        <View className='card'>
          <View className='section-head'>
            <Text className='section-title'>AI 起草的回复（英文）</Text>
            <Text className='regenerate' onClick={handleRegenerate}>
              {regenerating ? '起草中…' : '换一版'}
            </Text>
          </View>
          <View className='box'>
            <Text className='box-text'>{reply.suggestedReply || '起草中…'}</Text>
          </View>
          {reply.nextAction ? (
            <Text className='next-action'>下一步建议：{reply.nextAction}</Text>
          ) : null}

          <View className='actions'>
            <Button
              className='btn-primary action-btn'
              onClick={handleConfirm}
              loading={submitting}
            >
              确认回复
            </Button>
          </View>
        </View>
      ) : (
        <View className='card'>
          <Text className='section-title'>已回复</Text>
          <View className='box muted'>
            <Text className='box-text'>{reply.suggestedReply || '（无记录）'}</Text>
          </View>
          <Text className='status-badge'>✅ 等待对方下一步回应</Text>
        </View>
      )}
    </View>
  );
}
