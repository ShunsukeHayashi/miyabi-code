'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorContext {
  userId?: string
  userEmail?: string
  feature?: string
  action?: string
  [key: string]: any
}

export interface ErrorHandlerConfig {
  enableConsoleLogging?: boolean
  enableSentryReporting?: boolean
  enableUserFeedback?: boolean
}

class AppError extends Error {
  public readonly code: string
  public readonly severity: 'low' | 'medium' | 'high' | 'critical'
  public readonly context?: ErrorContext
  public readonly timestamp: string

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: ErrorContext
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.severity = severity
    this.context = context
    this.timestamp = new Date().toISOString()
  }
}

class ErrorHandler {
  private config: ErrorHandlerConfig

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableSentryReporting: true,
      enableUserFeedback: false,
      ...config,
    }
  }

  // 一般的なエラーハンドリング
  handle(error: Error | AppError, context?: ErrorContext): string | undefined {
    const errorId = this.generateErrorId()

    if (this.config.enableConsoleLogging) {
      console.group(`[ErrorHandler] ${error.name || 'Error'} (${errorId})`)
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
      if (context) console.error('Context:', context)
      console.groupEnd()
    }

    if (this.config.enableSentryReporting) {
      return this.reportToSentry(error, context, errorId)
    }

    return errorId
  }

  // API エラー専用ハンドリング
  handleApiError(error: any, endpoint: string, requestData?: any): string | undefined {
    const apiError = new AppError(
      error.message || 'API request failed',
      `API_ERROR_${error.status || 'UNKNOWN'}`,
      this.determineApiErrorSeverity(error.status),
      {
        endpoint,
        requestData,
        status: error.status,
        responseData: error.response?.data,
      }
    )

    return this.handle(apiError)
  }

  // 非同期エラーハンドリング
  handleAsyncError(promise: Promise<any>, context?: ErrorContext): Promise<any> {
    return promise.catch((error) => {
      const errorId = this.handle(error, context)
      throw new AppError(
        `Async operation failed: ${error.message}`,
        'ASYNC_ERROR',
        'medium',
        { ...context, originalError: error.message, errorId }
      )
    })
  }

  // ユーザーアクション関連エラー
  handleUserActionError(
    action: string,
    error: Error,
    userId?: string,
    additionalContext?: Record<string, any>
  ): string | undefined {
    const userError = new AppError(
      `User action "${action}" failed: ${error.message}`,
      'USER_ACTION_ERROR',
      'medium',
      {
        action,
        userId,
        ...additionalContext,
      }
    )

    return this.handle(userError)
  }

  // Sentryへの報告
  private reportToSentry(
    error: Error | AppError,
    context?: ErrorContext,
    errorId?: string
  ): string {
    const eventId = Sentry.captureException(error, {
      tags: {
        errorHandler: true,
        errorId,
        ...(error instanceof AppError && {
          errorCode: error.code,
          severity: error.severity,
        }),
      },
      contexts: {
        error: {
          id: errorId,
          timestamp: error instanceof AppError ? error.timestamp : new Date().toISOString(),
        },
        ...(context && { custom: context }),
      },
      user: context?.userId ? {
        id: context.userId,
        email: context.userEmail,
      } : undefined,
    })

    return eventId
  }

  // API エラーの重要度判定
  private determineApiErrorSeverity(status?: number): 'low' | 'medium' | 'high' | 'critical' {
    if (!status) return 'medium'
    if (status >= 500) return 'critical'
    if (status >= 400 && status < 500) return 'medium'
    return 'low'
  }

  // エラーID生成
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ユーザーフィードバック収集
  showFeedbackDialog(eventId: string): void {
    if (this.config.enableUserFeedback) {
      Sentry.showReportDialog({ eventId })
    }
  }
}

// グローバルエラーハンドラーのインスタンス
export const errorHandler = new ErrorHandler()

// React フック用コンポーネント
export function useErrorHandler(context?: ErrorContext) {
  useEffect(() => {
    // 未処理のPromise rejection をキャッチ
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorHandler.handle(
        new AppError(
          'Unhandled promise rejection',
          'UNHANDLED_REJECTION',
          'high',
          context
        )
      )
    }

    // グローバルエラーをキャッチ
    const handleGlobalError = (event: ErrorEvent) => {
      errorHandler.handle(
        new AppError(
          event.message,
          'GLOBAL_ERROR',
          'high',
          { ...context, filename: event.filename, lineno: event.lineno }
        )
      )
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleGlobalError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleGlobalError)
    }
  }, [context])

  return {
    handleError: (error: Error, additionalContext?: ErrorContext) =>
      errorHandler.handle(error, { ...context, ...additionalContext }),
    handleApiError: (error: any, endpoint: string, requestData?: any) =>
      errorHandler.handleApiError(error, endpoint, requestData),
    handleAsyncError: (promise: Promise<any>, additionalContext?: ErrorContext) =>
      errorHandler.handleAsyncError(promise, { ...context, ...additionalContext }),
    handleUserActionError: (action: string, error: Error, additionalContext?: Record<string, any>) =>
      errorHandler.handleUserActionError(action, error, context?.userId, {
        ...context,
        ...additionalContext,
      }),
  }
}

// エクスポート
export { AppError, ErrorHandler }
export default ErrorHandler