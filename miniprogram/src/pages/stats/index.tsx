import { useEffect, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { get } from '../../api/client';
import './index.less';

interface FunnelItem {
  key: string;
  label: string;
  value: number;
  color: string;
}

export default function StatsPage() {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [funnel, setFunnel] = useState<FunnelItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (r: '7d' | '30d') => {
    setLoading(true);
    try {
      const res = await get<{ funnel: FunnelItem[] }>(`/api/mobile/stats?range=${r}`);
      setFunnel(res.funnel || []);
    } catch {
      setFunnel([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(range);
  }, [range]);

  const max = Math.max(...funnel.map((f) => f.value), 1);

  return (
    <View className='stats'>
      <View className='range-bar'>
        {(
          [
            ['7d', '近 7 天'],
            ['30d', '近 30 天'],
          ] as ['7d' | '30d', string][]
        ).map(([key, label]) => (
          <View
            key={key}
            className={`range-item ${range === key ? 'active' : ''}`}
            onClick={() => setRange(key)}
          >
            {label}
          </View>
        ))}
      </View>

      {loading ? (
        <View className='empty'>加载中…</View>
      ) : funnel.length === 0 ? (
        <View className='empty'>
          <Text>暂无数据</Text>
          <Text className='empty-sub'>跑几天投放后，这里会展示获客漏斗</Text>
        </View>
      ) : (
        <View className='funnel card'>
          {funnel.map((item, idx) => {
            const ratio = Math.round((item.value / max) * 100);
            const pct = idx === 0 ? '100%' : item.value === 0 ? '0%' : `${Math.round((item.value / funnel[0].value) * 100)}%`;
            return (
              <View key={item.key} className='funnel-row'>
                <Text className='funnel-label'>{item.label}</Text>
                <View className='funnel-track'>
                  <View
                    className='funnel-bar'
                    style={{ width: `${Math.max(ratio, 4)}%`, background: item.color }}
                  />
                </View>
                <Text className='funnel-value'>{item.value}</Text>
                <Text className='funnel-pct'>{pct}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View className='tip card'>
        <Text className='tip-title'>💡 怎么提升转化？</Text>
        <Text className='tip-line'>· 触达多但好友少 → 换个开场白，别一上来就推销</Text>
        <Text className='tip-line'>· 好友多但回复少 → 先发行业内容混脸熟，再谈合作</Text>
        <Text className='tip-line'>· 回复多但会议少 → 主动约 Zoom，别等对方开口</Text>
      </View>
    </View>
  );
}
