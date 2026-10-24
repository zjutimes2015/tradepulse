import { useState } from 'react';
import { Button, View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { loginWithWechat } from '../../utils/auth';
import './index.less';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const user = await loginWithWechat();
      Taro.showToast({ title: `欢迎，${user.name || '老板'}`, icon: 'none' });
      Taro.reLaunch({ url: '/pages/index/index' });
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '登录失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='login-page'>
      <View className='login-hero'>
        <Text className='login-logo'>贸脉</Text>
        <Text className='login-title'>外贸客户开发助手</Text>
        <Text className='login-sub'>AI 帮你找海外客户 · 写英文消息 · 跟进回复</Text>
      </View>

      <View className='login-features'>
        <View className='feature-row'>
          <Text className='feature-dot'>①</Text>
          <Text>AI 每天扫描目标市场，找出高意向买家</Text>
        </View>
        <View className='feature-row'>
          <Text className='feature-dot'>②</Text>
          <Text>自动生成英文消息，你只需点"确认"</Text>
        </View>
        <View className='feature-row'>
          <Text className='feature-dot'>③</Text>
          <Text>客户回复自动翻译成中文，AI 帮你起草回信</Text>
        </View>
      </View>

      <View className='login-footer'>
        <Button
          className='btn-primary login-btn'
          loading={loading}
          onClick={handleLogin}
        >
          微信一键登录
        </Button>
        <Text className='login-tip'>登录即代表同意《用户协议》和《隐私政策》</Text>
      </View>
    </View>
  );
}
