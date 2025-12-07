import * as Sentry from '@sentry/nextjs'

export function onRequestError(
  err: unknown,
  request: {
    method: string
    path: string
    headers: Record<string, string>
  }
) {
  console.error('Client request error:', err, 'for request:', request)
}

// ナビゲーション計測のためのフック
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart