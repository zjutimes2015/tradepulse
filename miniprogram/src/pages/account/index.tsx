import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { get } from '../../api/client';
import './index.less';

interface AccountStatus {
  status: 'connected' | 'connecting' | 'suspended' | 'none';
  type?: 'basic' | 'sales_navigator';
  email?: string;
  todaySent: number;
  todayConnected: number;
  dailySendLimit: number;
  dailyConnectLimit: number;
  warmupDays: number;
}

const STATUS_LABEL: Record<AccountStatus['status'], string> = {
  connected: '已连接',
  connecting: '连接中',
  suspended: '异常/受限',
  none: '未连接',
};

export default function AccountPage() {
  const [acc, setAcc] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await get<AccountStatus>('/api/mobile/settings/account');
      setAcc(res);
    } catch {
      // 默认未连接
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const goSettings = () => Taro.switchTab({ url: '/pages/settings/index' });

  if (loading || !acc) {
    return <View className='loading'>加载中…</View>;
  }

  return (
    <View className='account'>
      {/* 状态卡片 */}
      <View className='card'>
        <View className='status-row'>
          <Text className='status-dot' data-status={acc.status} />
          <Text className='status-text'>
            {STATUS_LABEL[acc.status]}
            {acc.type === 'sales_navigator' ? '（Sales Navigator）' : ''}
          </Text>
        </View>
        {acc.email ? <Text className='email'>🔒 {acc.email}</Text> : null}
      </View>

      {/* 今日额度 */}
      <View className='card'>
        <Text className='section-title'>今日已用额度</Text>
        <View className='quota-row'>
          <Text className='quota-label'>加好友</Text>
          <View className='quota-track'>
            <View
              className='quota-bar'
              style={{
                width: `${Math.min((acc.todayConnected / Math.max(acc.dailyConnectLimit, 1)) * 100, 100)}%`,
              }}
            />
          </View>
          <Text className='quota-num'>
            {acc.todayConnected}/{acc.dailyConnectLimit}
          </Text>
        </View>
        <View className='quota-row'>
          <Text className='quota-label'>发消息</Text>
          <View className='quota-track'>
            <View
              className='quota-bar'
              style={{
                width: `${Math.min((acc.todaySent / Math.max(acc.dailySendLimit, 1)) * 100, 100)}%`,
              }}
            />
          </View>
          <Text className='quota-num'>
            {acc.todaySent}/{acc.dailySendLimit}
          </Text>
        </View>
        {acc.warmupDays > 0 ? (
          <Text className='warmup-tip'>🛡️ 新号保护期：还需 {acc.warmupDays} 天（期间自动降速）</Text>
        ) : null}
      </View>

      {/* 操作 */}
      {acc.status === 'none' ? (
        <View className='card'>
          <Text className='section-title'>绑定 LinkedIn</Text>
          <Text className='guide-text'>绑定后 AI 才能替你加好友、发消息。建议用专门的获客账号。</Text>
          <Button className='btn-primary bind-btn' onClick={goSettings}>
            去设置页绑定
          </Button>
        </View>
      ) : (
        <View className='card'>
          <Text className='section-title'>风控提醒</Text>
          <Text className='guide-text'>
            LinkedIn 对自动化行为敏感。贸脉已内置每日限额和操作间隔，请勿在系统外同一账号大量操作。
          </Text>
        </View>
      )}
    </View>
  );
}
