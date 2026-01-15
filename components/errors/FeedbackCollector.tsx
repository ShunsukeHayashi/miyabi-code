'use client';

import { useState, useCallback } from 'react';
import * as Sentry from '@sentry/nextjs';

interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'other'
  message: string
  email?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
  attachments?: File[]
}

interface FeedbackCollectorProps {
  isOpen: boolean
  onClose: () => void
  eventId?: string
  defaultType?: FeedbackData['type']
  context?: Record<string, any>
}

export function FeedbackCollector({
  isOpen,
  onClose,
  eventId,
  defaultType = 'bug',
  context = {},
}: FeedbackCollectorProps) {
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: defaultType,
    message: '',
    email: '',
    severity: 'medium',
    context,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Sentryにフィードバックを送信
      const feedbackEventId = eventId || Sentry.captureMessage('User Feedback', 'info');

      // カスタムフィードバックイベントも送信
      Sentry.captureEvent({
        message: 'User Feedback Collected',
        level: 'info',
        tags: {
          feedback_type: feedback.type,
          feedback_severity: feedback.severity,
        },
        extra: {
          feedback: feedback.message,
          context: feedback.context,
          userEmail: feedback.email,
          feedbackEventId,
        },
        contexts: {
          feedback: {
            type: feedback.type,
            severity: feedback.severity,
            message: feedback.message,
            timestamp: new Date().toISOString(),
          },
        },
      });

      setSubmitStatus('success');

      // 成功したら3秒後に閉じる
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
        setFeedback({
          type: defaultType,
          message: '',
          email: '',
          severity: 'medium',
          context,
        });
      }, 3000);

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [feedback, eventId, onClose, defaultType, context]);

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">フィードバック</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {submitStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                フィードバックを送信しました
              </h3>
              <p className="text-gray-400 text-sm">
                貴重なご意見をありがとうございます。改善に活用させていただきます。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* フィードバックタイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  フィードバックの種類
                </label>
                <select
                  value={feedback.type}
                  onChange={(e) => setFeedback({ ...feedback, type: e.target.value as FeedbackData['type'] })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                >
                  <option value="bug">バグ報告</option>
                  <option value="feature">機能リクエスト</option>
                  <option value="improvement">改善提案</option>
                  <option value="other">その他</option>
                </select>
              </div>

              {/* 重要度 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  重要度
                </label>
                <select
                  value={feedback.severity}
                  onChange={(e) => setFeedback({ ...feedback, severity: e.target.value as FeedbackData['severity'] })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">緊急</option>
                </select>
              </div>

              {/* メッセージ */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  詳細 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={feedback.message}
                  onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                  placeholder="問題の詳細、再現手順、期待する動作などを詳しく教えてください..."
                  rows={4}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent resize-none"
                />
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  メールアドレス（任意）
                </label>
                <input
                  type="email"
                  value={feedback.email}
                  onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
                  placeholder="回答をご希望の場合はメールアドレスを入力してください"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                />
              </div>

              {submitStatus === 'error' && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <p className="text-red-400 text-sm">
                    送信に失敗しました。もう一度お試しください。
                  </p>
                </div>
              )}

              {/* ボタン */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors border border-gray-600"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={!feedback.message.trim() || isSubmitting}
                  className="flex-1 py-2 px-4 bg-miyabi-blue hover:bg-miyabi-blue/80 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? '送信中...' : '送信'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// フィードバック収集フック
export function useFeedbackCollector() {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<Record<string, any>>({});

  const openFeedback = useCallback((
    initialContext: Record<string, any> = {},
    eventId?: string,
  ) => {
    setContext({
      ...initialContext,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      eventId,
    });
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
    setContext({});
  }, []);

  return {
    isOpen,
    openFeedback,
    closeFeedback,
    context,
  };
}

// フローティングフィードバックボタン
export function FloatingFeedbackButton() {
  const { isOpen, openFeedback, closeFeedback, context } = useFeedbackCollector();

  return (
    <>
      <button
        onClick={() => openFeedback()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-miyabi-blue hover:bg-miyabi-blue/80 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-40 flex items-center justify-center"
        title="フィードバックを送信"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <FeedbackCollector
        isOpen={isOpen}
        onClose={closeFeedback}
        context={context}
      />
    </>
  );
}

export default FeedbackCollector;
