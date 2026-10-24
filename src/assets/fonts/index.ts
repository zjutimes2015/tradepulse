import localFont from 'next/font/local';

/**
 * 1. Fonts Documentation
 * https://mksaas.com/docs/fonts
 *
 * 2. Local fonts (self-hosted) — 避免 build 时访问 Google Fonts（国内网络被墙导致构建失败）
 * - Font files downloaded from https://gwfh.mranftl.com/fonts
 * - All files in ./ (see *.woff2)
 */

// https://fonts.google.com/noto/specimen/Noto+Sans
export const fontNotoSans = localFont({
  src: [
    { path: './noto-sans-v42-latin-500.woff2', weight: '500', style: 'normal' },
    { path: './noto-sans-v42-latin-600.woff2', weight: '600', style: 'normal' },
    { path: './noto-sans-v42-latin-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-noto-sans',
});

// https://fonts.google.com/noto/specimen/Noto+Serif
export const fontNotoSerif = localFont({
  src: [
    { path: './noto-serif-v33-latin-regular.woff2', weight: '400', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-noto-serif',
});

// https://fonts.google.com/noto/specimen/Noto+Sans+Mono
export const fontNotoSansMono = localFont({
  src: [
    { path: './noto-sans-mono-v37-latin-regular.woff2', weight: '400', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-noto-sans-mono',
});

// https://fonts.google.com/specimen/Bricolage+Grotesque
export const fontBricolageGrotesque = localFont({
  src: [
    { path: './bricolage-grotesque-v9-latin-regular.woff2', weight: '400', style: 'normal' },
    { path: './bricolage-grotesque-v9-latin-500.woff2', weight: '500', style: 'normal' },
    { path: './bricolage-grotesque-v9-latin-600.woff2', weight: '600', style: 'normal' },
    { path: './bricolage-grotesque-v9-latin-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-bricolage-grotesque',
});
