import { useEffect, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { fetchDashboard, DashboardSummary } from '../../api/dashboard';
import './index.less';

export default function IndexPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetchDashboard();
      setData(res);
    } catch {
      // 网络错误保留空态
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // 每次回到页面刷新（onShow）
  }, []);

  const goSignals = () => Taro.switchTab({ url: '/pages/signals/index' });
  const goReplies = () => Taro.switchTab({ url: '/pages/replies/index' });
  const goStats = () => Taro.navigateTo({ url: '/pages/stats/index' });
  const goAccount = () => Taro.navigateTo({ url: '/pages/account/index' });

  return (
    <View className='dashboard'>
      {/* 顶部问候 */}
      <View className='header'>
        <View>
          <Text className='greeting'>早上好，老板</Text>
          <Text className='sub'>今天的海外客户进展</Text>
        </View>
        <View className='plan-badge' onClick={goAccount}>
          {data?.plan || '免费版'}
        </View>
      </View>

      {/* LinkedIn 状态条 */}
      <View className='linkedin-bar' onClick={goAccount}>
        {data?.linkedInStatus === 'connected' ? (
          <Text>✅ LinkedIn 已连接 · 今日已触达 {data.todayTouch} 人</Text>
        ) : data?.linkedInStatus === 'connecting' ? (
          <Text>⏳ LinkedIn 连接中，请稍候…</Text>
        ) : (
          <Text>⚠️ 尚未连接 LinkedIn，去绑定</Text>
        )}
      </View>

      {/* 待办卡片 */}
      <View className='todo-card card'>
        <View className='todo-item' onClick={goSignals}>
          <Text className='todo-num score-high'>{data?.pendingSignals ?? 0}</Text>
          <Text className='todo-label'>待确认信号</Text>
          <Text className='todo-arrow'>›</Text>
        </View>
        <View className='todo-divider' />
        <View className='todo-item' onClick={goReplies}>
          <Text className='todo-num score-mid'>
            {data?.unreadReplies ?? 0}
          </Text>
          <Text className='todo-label'>未读回复</Text>
          <Text className='todo-arrow'>›</Text>
        </View>
      </View>

      {/* 今日数据 */}
      <View className='stats-grid'>
        <View className='stat-card card' onClick={goStats}>
          <Text className='stat-num'>{data?.todayTouch ?? 0}</Text>
          <Text className='stat-label'>今日触达</Text>
        </View>
        <View className='stat-card card' onClick={goStats}>
          <Text className='stat-num'>{data?.todayConnections ?? 0}</Text>
          <Text className='stat-label'>新增好友</Text>
        </View>
        <View className='stat-card card' onClick={goStats}>
          <Text className='stat-num'>{data?.todayReplies ?? 0}</Text>
          <Text className='stat-label'>今日回复</Text>
        </View>
        <View className='stat-card card' onClick={goStats}>
          <Text className='stat-num'>{data?.meetings ?? 0}</Text>
          <Text className='stat-label'>约会议</Text>
        </View>
      </View>

      {/* 快捷操作 */}
      <View className='quick-actions'>
        <Button className='btn-primary quick-btn' onClick={goSignals}>
          处理待确认信号
        </Button>
      </View>

      {/* 引导卡片（无 LinkedIn 时显示） */}
      {!loading && data?.linkedInStatus === 'none' && (
        <View className='guide-card card'>
          <Text className='guide-title'>🚀 3 步开始获客</Text>
          <Text className='guide-step'>1. 绑定 LinkedIn 账号（设置页）</Text>
          <Text className='guide-step'>2. 在电脑端设置目标市场</Text>
          <Text className='guide-step'>3. 回来点"确认"就能发消息</Text>
          <Button className='btn-ghost guide-btn' onClick={goAccount}>
            去绑定
          </Button>
        </View>
      )}
    </View>
  );
}
