import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { fetchReplies, Reply } from '../../api/replies';
import { formatRelativeTime } from '../../utils/format';
import './index.less';

export default function RepliesPage() {
  const [items, setItems] = useState<Reply[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetchReplies({ page: 1 });
      setItems(res.items);
      setUnread(res.unread);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/reply-detail/index?id=${id}` });
  };

  return (
    <View className='replies'>
      {unread > 0 && (
        <View className='unread-bar'>
          {unread} 条未读回复，尽快跟进
        </View>
      )}

      {loading ? (
        <View className='empty'>加载中…</View>
      ) : items.length === 0 ? (
        <View className='empty'>
          <Text>暂无回复</Text>
          <Text className='empty-sub'>客户回复后会自动翻译成中文出现在这里</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} className='reply-card card' onClick={() => openDetail(item.id)}>
            <View className='reply-head'>
              <Text className='reply-name'>
                {item.leadName}
                {item.status === 'unread' && <Text className='dot'>●</Text>}
              </Text>
              <Text className='reply-time'>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            <Text className='reply-company'>{item.leadCompany}</Text>
            <Text className='reply-preview'>{item.translatedText || item.originalText}</Text>
            <View className='reply-foot'>
              <Text className='reply-intent'>
                {item.interestLevel >= 70 ? '🔥 高意向' : item.interestLevel >= 40 ? '👍 有兴趣' : '👀 观望中'}
              </Text>
              <Text className='reply-action'>
                {item.status === 'unread' ? '查看并回复 ›' : '继续跟进 ›'}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
