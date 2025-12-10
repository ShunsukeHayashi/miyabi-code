'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Sentryにグローバルエラーを報告
    Sentry.captureException(error, {
      tags: {
        component: 'global-error',
        digest: error.digest,
      },
      contexts: {
        react: {
          errorBoundary: 'global',
        },
      },
    })
  }, [error])

  return (
    <html>
      <body className="bg-gray-950 text-white min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-gray-900 border border-red-800 rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-900/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              重大なエラーが発生しました
            </h2>
            <p className="text-gray-400 text-sm">
              アプリケーションで予期しない重大なエラーが発生しました。この問題は自動的に報告されています。
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-mono text-red-400 mb-2">Debug Information</h3>
              <p className="text-xs text-gray-300 font-mono text-left whitespace-pre-wrap">
                {error.name}: {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-400 font-mono text-left mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full py-2 px-4 bg-miyabi-blue hover:bg-miyabi-blue/80 text-white rounded-lg font-medium transition-colors"
            >
              再試行
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors border border-gray-600"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}