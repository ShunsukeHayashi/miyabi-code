import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // デバッグモード
  debug: process.env.NODE_ENV === 'development',

  // 環境とリリース
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',

  // Edge Runtime特有の設定
  beforeSend: (event, hint) => {
    // 開発環境でのデバッグ
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry Edge]', event, hint)
    }

    return event
  },

  // タグとコンテキスト
  initialScope: {
    tags: {
      component: 'miyabi-dashboard-edge',
      platform: 'nextjs-edge'
    },
    contexts: {
      app: {
        name: 'miyabi-dashboard',
        version: process.env.npm_package_version || '1.0.0'
      },
      runtime: {
        name: 'edge'
      }
    }
  }
})

export const init = Sentry.init