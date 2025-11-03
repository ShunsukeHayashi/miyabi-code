/**
 * ErrorModal Component
 *
 * Displays user-friendly error messages with actionable solutions and retry functionality.
 */

import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ErrorInfo } from '../lib/errors';

export interface ErrorModalProps {
  error: ErrorInfo;
  onClose: () => void;
  onRetry?: () => void;
}

/**
 * ErrorModal component
 * Displays error information with severity-specific styling and actions
 */
export function ErrorModal({ error, onClose, onRetry }: ErrorModalProps) {
  const severityColors = {
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const severityIcons = {
    error: <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-600" aria-hidden="true" />,
    info: <Info className="w-6 h-6 text-blue-600" aria-hidden="true" />,
  };

  const severityTextColors = {
    error: 'text-red-900',
    warning: 'text-yellow-900',
    info: 'text-blue-900',
  };

  // Close modal on Escape key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
      aria-describedby="error-modal-description"
    >
      <div
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">{severityIcons[error.severity]}</div>
          <div className="flex-1 min-w-0">
            <h2
              id="error-modal-title"
              className={`text-xl font-bold mb-2 ${severityTextColors[error.severity]}`}
            >
              {error.title}
            </h2>
            <p id="error-modal-description" className="text-gray-700 text-sm">
              {error.message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900
                       focus-visible:ring-offset-2 rounded"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div
          className={`p-4 rounded-lg border ${severityColors[error.severity]} mb-6`}
        >
          <h3 className={`font-semibold mb-3 ${severityTextColors[error.severity]}`}>
            解決方法:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            {error.actions.map((action, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="flex-shrink-0 text-gray-400">→</span>
                <span className="flex-1">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="flex-1 py-2.5 px-4 bg-gray-900 text-white rounded-lg
                         hover:bg-gray-800 transition-colors font-medium
                         focus:outline-none focus-visible:ring-2
                         focus-visible:ring-gray-900 focus-visible:ring-offset-2"
            >
              再試行
            </button>
          )}
          <button
            onClick={onClose}
            className={`py-2.5 px-4 border border-gray-300 rounded-lg
                        hover:bg-gray-50 transition-colors font-medium
                        focus:outline-none focus-visible:ring-2
                        focus-visible:ring-gray-900 focus-visible:ring-offset-2
                        ${onRetry ? 'flex-1' : 'w-full'}`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;
