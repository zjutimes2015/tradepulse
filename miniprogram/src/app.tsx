import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import { checkLogin } from './utils/auth';

import './app.less';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    // 启动时检查登录态；token 无效则跳登录页
    checkLogin();
  });

  return children;
}

export default App;
