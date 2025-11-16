import { AlertCircle, AlertTriangle, Info, ExternalLink, X } from "lucide-react";
import type { ErrorInfo } from "../lib/errors";
import type { ReactElement } from "react";

export interface ErrorModalProps {
  error: ErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
}

const severityConfig: Record<
  ErrorInfo["severity"],
  { container: string; icon: ReactElement; badge: string }
> = {
  error: {
    container: "bg-red-50 border-red-200",
    icon: <AlertCircle className="w-6 h-6 text-red-600" />,
    badge: "エラー",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200",
    icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
    badge: "警告",
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    icon: <Info className="w-6 h-6 text-blue-600" />,
    badge: "情報",
  },
};

export function ErrorModal({ error, onClose, onRetry }: ErrorModalProps) {
  if (!error) {
    return null;
  }

  const severity = severityConfig[error.severity];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-start space-x-4">
            <div
              className={`w-12 h-12 rounded-xl bg-white border flex items-center justify-center shadow-inner ${severity.container}`}
            >
              {severity.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-semibold tracking-wide uppercase text-gray-400">
                  {severity.badge}
                </span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs font-mono text-gray-400">{error.code}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{error.title}</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{error.message}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close error dialog"
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className={`rounded-xl border p-4 space-y-3 ${severity.container}`}>
            <div className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
              <span>推奨されるアクション</span>
            </div>
            <ul className="space-y-2">
              {error.actions.map((action, index) => (
                <li key={index} className="flex items-start space-x-3 text-sm text-gray-700">
                  <span className="text-gray-400">{index + 1}.</span>
                  <span className="leading-relaxed">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {error.helpUrl && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-blue-800 font-medium">サポートドキュメントを見る</div>
              <a
                href={error.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 space-x-2"
              >
                <span>開く</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center space-x-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              再試行する
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
