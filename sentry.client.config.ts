import * as Sentry from '@sentry/nextjs'

// クライアントサイドSentry初期化
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // パフォーマンス監視
  tracesSampleRate: 1.0,

  // セッションリプレイ
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // デバッグモード
  debug: process.env.NODE_ENV === 'development',

  // 環境とリリース
  environment: process.env.NODE_ENV || 'development',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',

  // ユーザーコンテキスト設定
  beforeSend: (event, hint) => {
    // 開発環境でのデバッグ
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry Client]', event, hint)
    }

    // チャンクロードエラーは除外
    if (event.exception) {
      const exception = event.exception.values?.[0]
      if (exception?.type === 'ChunkLoadError') {
        return null
      }
    }

    return event
  },

  // 統合設定
  integrations: [
    Sentry.replayIntegration({
      maskAllText: process.env.NODE_ENV === 'production',
      blockAllMedia: process.env.NODE_ENV === 'production',
    }),
    Sentry.browserTracingIntegration({
      // ナビゲーショントレーシング
      enableLongTask: true,
      enableInp: true,
    }),
  ],

  // 除外するエラー
  ignoreErrors: [
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    'NetworkError',
    'Failed to fetch',
    'Script error',
    // React DevTools
    '__REACT_DEVTOOLS_GLOBAL_HOOK__'
  ],

  // 除外するURL
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],

  // タグとコンテキスト
  initialScope: {
    tags: {
      component: 'miyabi-dashboard-client',
      platform: 'nextjs-client'
    },
    contexts: {
      app: {
        name: 'miyabi-dashboard',
        version: process.env.npm_package_version || '1.0.0'
      }
    }
  }
})