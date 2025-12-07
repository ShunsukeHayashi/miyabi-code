import * as Sentry from '@sentry/nextjs'

// サーバーサイドSentry初期化
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // デバッグモード
  debug: process.env.NODE_ENV === 'development',

  // 環境とリリース
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',

  // サーバーサイド特有の設定
  beforeSend: (event, hint) => {
    // 開発環境でのデバッグ
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry Server]', event, hint)
    }

    return event
  },

  // 統合設定
  integrations: [
    // Next.jsのHTTP統合は自動で含まれる
  ],

  // 除外するエラー
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],

  // タグとコンテキスト
  initialScope: {
    tags: {
      component: 'miyabi-dashboard-server',
      platform: 'nextjs-server'
    },
    contexts: {
      app: {
        name: 'miyabi-dashboard',
        version: process.env.npm_package_version || '1.0.0'
      },
      runtime: {
        name: 'node',
        version: process.version
      }
    }
  }
})