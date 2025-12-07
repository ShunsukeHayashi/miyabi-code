import { PlatformOptions } from '@sentry/types'

// @ts-ignore
import { withSentry } from '@sentry/nextjs'

export const sentryConfig: PlatformOptions = {
  // Sentryプロジェクト設定 - 本番環境では環境変数を使用
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // パフォーマンストレーシング設定
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // エラーサンプリング設定
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // デバッグ設定
  debug: process.env.NODE_ENV !== 'production',

  // 環境設定
  environment: process.env.NODE_ENV || 'development',

  // リリースバージョン
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',

  // ユーザーコンテキスト設定
  beforeSend: (event, hint) => {
    // 開発環境では全てのエラーを送信
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry]', event, hint)
      return event
    }

    // 本番環境では特定の条件でフィルタリング
    if (event.exception) {
      const exception = event.exception.values?.[0]
      if (exception?.type === 'ChunkLoadError') {
        // チャンクロードエラーは除外（ブラウザ起因）
        return null
      }
    }

    return event
  },

  // トランザクション設定
  beforeSendTransaction: (event) => {
    // 静的アセットリクエストは除外
    if (event.transaction?.includes('/_next/static/')) {
      return null
    }
    return event
  },

  // タグ設定
  initialScope: {
    tags: {
      component: 'miyabi-dashboard',
      platform: 'nextjs'
    },
    contexts: {
      app: {
        name: 'miyabi-dashboard',
        version: process.env.npm_package_version || '1.0.0'
      }
    }
  },

  // 統合設定
  integrations: [
    // HTTPクライアントトレーシング有効
    // BrowserTracingは@sentry/nextjsで自動設定される
  ],

  // プロファイリング設定（オプション）
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // セッションリプレイ設定
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,

  // Next.js特有の設定
  hideSourceMaps: process.env.NODE_ENV === 'production',
  widenClientFileUpload: true,

  // ソースマップアップロード設定
  silent: true,
  org: process.env.SENTRY_ORG || 'miyabi',
  project: process.env.SENTRY_PROJECT || 'dashboard',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 除外するエラー
  ignoreErrors: [
    // ブラウザ拡張機能エラー
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    // ネットワーク関連エラー
    'NetworkError',
    'Failed to fetch',
    // その他一般的なエラー
    'Script error'
  ],

  // 除外するURL
  denyUrls: [
    // ブラウザ拡張機能
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ]
}

export default sentryConfig