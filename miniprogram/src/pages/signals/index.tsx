import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { fetchSignals, Signal } from '../../api/signals';
import { formatRelativeTime, scoreClass, signalLabels } from '../../utils/format';
import './index.less';

type StatusFilter = 'pending' | 'sent' | 'ignored';

export default function SignalsPage() {
  const [items, setItems] = useState<Signal[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [loading, setLoading] = useState(true);

  const load = async (status: StatusFilter) => {
    setLoading(true);
    try {
      const res = await fetchSignals({ status, limit: 50 });
      setItems(res.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const openDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/signal-detail/index?id=${id}` });
  };

  return (
    <View className='signals'>
      {/* 筛选 */}
      <View className='filter-bar'>
        {(
          [
            ['pending', '待确认'],
            ['sent', '已发送'],
            ['ignored', '已忽略'],
          ] as [StatusFilter, string][]
        ).map(([key, label]) => (
          <View
            key={key}
            className={`filter-item ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </View>
        ))}
      </View>

      {/* 列表 */}
      {loading ? (
        <View className='empty'>加载中…</View>
      ) : items.length === 0 ? (
        <View className='empty'>
          <Text>暂无{filter === 'pending' ? '待确认' : filter === 'sent' ? '已发送' : '已忽略'}信号</Text>
          <Text className='empty-sub'>
            {filter === 'pending' ? 'AI 正在扫描目标市场，有高意向客户会自动出现在这里' : ''}
          </Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} className='signal-card card' onClick={() => openDetail(item.id)}>
            <View className='signal-head'>
              <Text className='signal-name'>{item.name}</Text>
              <Text className={`signal-score ${scoreClass(item.signalScore)}`}>
                {item.signalScore}
              </Text>
            </View>
            <Text className='signal-company'>
              {item.company} · {item.title}
            </Text>
            <View className='signal-tags'>
              {signalLabels(item.signalTypes).map((label) => (
                <Text key={label} className='tag'>
                  {label}
                </Text>
              ))}
            </View>
            <Text className='signal-summary'>{item.signalSummary}</Text>
            <View className='signal-foot'>
              <Text className='signal-time'>{formatRelativeTime(item.createdAt)}</Text>
              <Text className='signal-action'>{item.status === 'pending' ? '查看详情 ›' : ''}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
