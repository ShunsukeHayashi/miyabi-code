'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  eventId?: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Sentryにエラーを送信
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: true,
      },
    })

    this.setState({
      error,
      errorInfo,
      eventId,
    })

    // カスタムエラーハンドラーがあれば実行
    this.props.onError?.(error, errorInfo)

    // 開発環境でのログ出力
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)
      console.error('[ErrorBoundary] Error:', error)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReportFeedback = (): void => {
    if (this.state.eventId) {
      // Sentryのユーザーフィードバックダイアログを表示
      Sentry.showReportDialog({ eventId: this.state.eventId })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback
        error={this.state.error}
        onReset={this.handleReset}
        onReportFeedback={this.handleReportFeedback}
        hasEventId={!!this.state.eventId}
      />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  onReset: () => void
  onReportFeedback: () => void
  hasEventId: boolean
}

function ErrorFallback({ error, onReset, onReportFeedback, hasEventId }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
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
            アプリケーションエラーが発生しました
          </h2>
          <p className="text-gray-400 text-sm">
            予期しないエラーが発生しました。この問題は自動的に報告されています。
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-mono text-red-400 mb-2">Debug Information</h3>
            <p className="text-xs text-gray-300 font-mono text-left whitespace-pre-wrap">
              {error.name}: {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onReset}
            className="w-full py-2 px-4 bg-miyabi-blue hover:bg-miyabi-blue/80 text-white rounded-lg font-medium transition-colors"
          >
            再試行
          </button>

          {hasEventId && (
            <button
              onClick={onReportFeedback}
              className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors border border-gray-600"
            >
              問題を報告
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors border border-gray-600"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary