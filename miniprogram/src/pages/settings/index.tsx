import { useState } from 'react';
import { View, Text, Switch, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getCachedUser, logout } from '../../utils/auth';
import { patch } from '../../api/client';
import './index.less';

export default function SettingsPage() {
  const user = getCachedUser();
  const [notifyReply, setNotifyReply] = useState(true);
  const [notifySignal, setNotifySignal] = useState(true);
  const [saving, setSaving] = useState(false);

  const saveSettings = async (key: string, value: boolean) => {
    setSaving(true);
    try {
      await patch('/api/mobile/settings', { [key]: value });
    } catch {
      // 本地状态已变，失败也不回滚（下次同步）
    } finally {
      setSaving(false);
    }
  };

  const onReplyChange = (v: boolean) => {
    setNotifyReply(v);
    saveSettings('notifyReply', v);
  };

  const onSignalChange = (v: boolean) => {
    setNotifySignal(v);
    saveSettings('notifySignal', v);
  };

  const goAccount = () => Taro.navigateTo({ url: '/pages/account/index' });
  const goStats = () => Taro.navigateTo({ url: '/pages/stats/index' });

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) logout();
      },
    });
  };

  return (
    <View className='settings'>
      {/* 用户信息 */}
      <View className='user-card card'>
        <View className='avatar'>{user?.name?.charAt(0) || '贸'}</View>
        <View className='user-info'>
          <Text className='user-name'>{user?.name || '外贸老板'}</Text>
          <Text className='user-plan'>{user?.plan || '免费版'} · {user?.hasLinkedIn ? '已绑定 LinkedIn' : '未绑定 LinkedIn'}</Text>
        </View>
      </View>

      {/* 通知设置 */}
      <View className='group card'>
        <Text className='group-title'>通知</Text>
        <View className='row'>
          <Text className='row-label'>客户回复提醒</Text>
          <Switch checked={notifyReply} onChange={(e) => onReplyChange(e.detail.value)} color='#1f6feb' />
        </View>
        <View className='row'>
          <Text className='row-label'>新信号提醒</Text>
          <Switch checked={notifySignal} onChange={(e) => onSignalChange(e.detail.value)} color='#1f6feb' />
        </View>
      </View>

      {/* 常用入口 */}
      <View className='group card'>
        <Text className='group-title'>快捷入口</Text>
        <View className='row clickable' onClick={goAccount}>
          <Text className='row-label'>LinkedIn 账号</Text>
          <Text className='row-arrow'>›</Text>
        </View>
        <View className='row clickable' onClick={goStats}>
          <Text className='row-label'>数据统计</Text>
          <Text className='row-arrow'>›</Text>
        </View>
      </View>

      {/* 关于 */}
      <View className='group card'>
        <Text className='group-title'>关于</Text>
        <View className='row'>
          <Text className='row-label'>版本</Text>
          <Text className='row-value'>v0.1.0</Text>
        </View>
        <View className='row'>
          <Text className='row-label'>功能说明</Text>
          <Text className='row-value'>AI 外贸获客，请在电脑端配置目标市场</Text>
        </View>
      </View>

      <Button className='logout-btn' onClick={handleLogout}>
        退出登录
      </Button>
    </View>
  );
}
