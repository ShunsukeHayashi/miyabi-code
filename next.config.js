const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode
  reactStrictMode: true,

  // 画像最適化設定（ダッシュボード用・ミニマル）
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },

  // スタンドアロン出力
  output: 'standalone',

  // SWC ミニファイア
  swcMinify: true,

  // TypeScript 型チェック
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },

  // ESLint チェック（production buildでは無視）
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
    dirs: ['app', 'components', 'lib', 'src'],
  },
};

// Sentry Webpack Plugin Options
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG || 'miyabi',
  project: process.env.SENTRY_PROJECT || 'dashboard',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // ソースマップアップロード設定
  silent: true,
  hideSourceMaps: process.env.NODE_ENV === 'production',
  widenClientFileUpload: true,

  // デバッグ設定
  debug: process.env.NODE_ENV === 'development',

  // 除外パターン
  ignore: [
    'node_modules',
    '.next',
    'public',
  ],
};

// Sentryで設定をラップ（本番環境またはSENTRY_DSNがある場合のみ）
module.exports = process.env.SENTRY_DSN || process.env.NODE_ENV === 'production'
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
