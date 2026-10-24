/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.styl';

declare namespace NodeJS {
  interface ProcessEnv {
    /** Taro 编译环境：weapp / h5 / alipay / tt / qq / jd / swan / rn */
    TARO_ENV: 'weapp' | 'h5' | 'alipay' | 'tt' | 'qq' | 'jd' | 'swan' | 'rn';
    /** 后端 API 地址（编译时注入） */
    TARO_APP_API_BASE_URL?: string;
  }
}

declare function defineAppConfig(config: Record<string, unknown>): void;
declare function definePageConfig(config: Record<string, unknown>): void;
