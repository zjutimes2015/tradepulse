export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/index/index',
    'pages/signals/index',
    'pages/signal-detail/index',
    'pages/replies/index',
    'pages/reply-detail/index',
    'pages/stats/index',
    'pages/account/index',
    'pages/settings/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '贸脉',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f6f8',
  },
  tabBar: {
    color: '#8a8f99',
    selectedColor: '#1f6feb',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
      },
      {
        pagePath: 'pages/signals/index',
        text: '信号',
      },
      {
        pagePath: 'pages/replies/index',
        text: '回复',
      },
      {
        pagePath: 'pages/settings/index',
        text: '我的',
      },
    ],
  },
  permission: {
    'scope.userLocation': {
      desc: '用于匹配目标市场的时区信息',
    },
  },
});
