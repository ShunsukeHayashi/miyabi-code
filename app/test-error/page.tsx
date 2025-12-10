'use client'

import { useState } from 'react'
import { useErrorHandler } from '@/components/errors/ErrorHandler'
import { useFeedbackCollector } from '@/components/errors/FeedbackCollector'
import FeedbackCollector from '@/components/errors/FeedbackCollector'

export default function TestErrorPage() {
  const [testState, setTestState] = useState(0)
  const { handleError, handleUserActionError, handleApiError } = useErrorHandler({
    feature: 'error-testing',
    userId: 'test-user',
  })

  const { isOpen, openFeedback, closeFeedback, context } = useFeedbackCollector()

  // エラータイプ別テスト関数
  const testRuntimeError = () => {
    try {
      // 意図的にランタイムエラーを発生
      const obj: any = null
      obj.someMethod()
    } catch (error) {
      handleError(error as Error, { action: 'runtime-error-test' })
    }
  }

  const testUserActionError = () => {
    try {
      // 意図的にユーザーアクションエラーを発生
      throw new Error('User action failed')
    } catch (error) {
      handleUserActionError('button-click', error as Error, { buttonId: 'test-button' })
    }
  }

  const testApiError = () => {
    // 模擬APIエラー
    const mockApiError = {
      status: 500,
      message: 'Internal Server Error',
      response: { data: { error: 'Database connection failed' } }
    }
    handleApiError(mockApiError, '/api/test', { testData: 'mock-request' })
  }

  const testAsyncError = async () => {
    // 非同期エラーのテスト
    const failingPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Async operation failed')), 100)
    })

    try {
      await failingPromise
    } catch (error) {
      handleError(error as Error, { action: 'async-error-test' })
    }
  }

  const testComponentError = () => {
    // React エラーバウンダリをテスト
    setTestState(-1) // これによりレンダリングエラーを発生させる
  }

  const testPerformanceIssue = () => {
    // パフォーマンス問題をシミュレート
    const start = performance.now()

    // 重い計算をシミュレート
    let result = 0
    for (let i = 0; i < 10000000; i++) {
      result += Math.random()
    }

    const duration = performance.now() - start
    console.log(`Heavy computation took ${duration}ms, result: ${result}`)
  }

  const TestComponent = () => {
    if (testState === -1) {
      throw new Error('Component render error for testing')
    }
    return <div>Test component rendered successfully (state: {testState})</div>
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            エラーモニタリング テストページ
          </h1>
          <p className="text-gray-400">
            Sentryエラーモニタリング、パフォーマンス監視、フィードバック収集機能のテスト
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* エラーテスト */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">エラーテスト</h2>
            <div className="space-y-3">
              <button
                onClick={testRuntimeError}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                ランタイムエラー発生
              </button>

              <button
                onClick={testUserActionError}
                className="w-full py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                ユーザーアクションエラー発生
              </button>

              <button
                onClick={testApiError}
                className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
              >
                APIエラー発生
              </button>

              <button
                onClick={testAsyncError}
                className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                非同期エラー発生
              </button>

              <button
                onClick={testComponentError}
                className="w-full py-2 px-4 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors"
              >
                コンポーネントエラー発生
              </button>
            </div>
          </div>

          {/* パフォーマンステスト */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">パフォーマンステスト</h2>
            <div className="space-y-3">
              <button
                onClick={testPerformanceIssue}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                重い計算実行（パフォーマンス監視）
              </button>

              <div className="text-sm text-gray-400">
                開発者ツールのコンソールでパフォーマンスログを確認してください
              </div>
            </div>
          </div>

          {/* フィードバックテスト */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">フィードバックテスト</h2>
            <div className="space-y-3">
              <button
                onClick={() => openFeedback({ testMode: true })}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                フィードバックモーダル表示
              </button>

              <div className="text-sm text-gray-400">
                右下のフローティングボタンからも送信可能です
              </div>
            </div>
          </div>

          {/* テストコンポーネント */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">テストコンポーネント</h2>
            <div className="space-y-3">
              <TestComponent />

              <button
                onClick={() => setTestState(testState + 1)}
                className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                状態更新（正常）
              </button>
            </div>
          </div>
        </div>

        {/* 状態表示 */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">現在の状態</h2>
          <pre className="text-sm text-gray-300 bg-gray-800 p-4 rounded-lg overflow-auto">
            {JSON.stringify({
              testState,
              timestamp: new Date().toISOString(),
              userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
              url: typeof window !== 'undefined' ? window.location.href : 'SSR',
            }, null, 2)}
          </pre>
        </div>

        {/* 使用方法 */}
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">テスト手順</h2>
          <ol className="text-gray-300 space-y-2 list-decimal list-inside">
            <li>Sentryプロジェクトを設定し、DSNを環境変数に設定してください</li>
            <li>各エラーテストボタンを押して、Sentryダッシュボードでエラーが記録されることを確認</li>
            <li>パフォーマンステストを実行して、開発者ツールでメトリクスを確認</li>
            <li>フィードバック機能をテストして、Sentryでユーザーフィードバックが記録されることを確認</li>
            <li>ネットワークタブで、Sentryへのリクエストが送信されることを確認</li>
          </ol>
        </div>
      </div>

      <FeedbackCollector
        isOpen={isOpen}
        onClose={closeFeedback}
        context={context}
        defaultType="bug"
      />
    </div>
  )
}