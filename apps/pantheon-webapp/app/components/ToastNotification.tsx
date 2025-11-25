/**
 * Toast Notification Component
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 *
 * Shows toast notifications for WebSocket events
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWebSocketEvent } from '../contexts';
import type { WebSocketEvent, WebSocketEventType } from '../../lib/websocket-client';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  timestamp: Date;
}

interface ToastNotificationProps {
  maxToasts?: number;
  autoDismissTime?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableSound?: boolean;
}

function getToastConfig(eventType: WebSocketEventType): {
  type: Toast['type'];
  icon: React.ReactNode;
} {
  switch (eventType) {
    case 'agent_execution_started':
      return {
        type: 'info',
        icon: (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    case 'agent_execution_completed':
      return {
        type: 'success',
        icon: (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    case 'agent_execution_failed':
      return {
        type: 'error',
        icon: (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
    case 'task_status_changed':
      return {
        type: 'info',
        icon: (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      };
    case 'agent_status_changed':
      return {
        type: 'warning',
        icon: (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      };
    default:
      return {
        type: 'info',
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
}

function getToastTitle(event: WebSocketEvent): string {
  const { type, payload } = event;
  switch (type) {
    case 'agent_execution_started':
      return `${payload.agent_type || 'Agent'} Started`;
    case 'agent_execution_completed':
      return `${payload.agent_type || 'Agent'} Completed`;
    case 'agent_execution_failed':
      return `${payload.agent_type || 'Agent'} Failed`;
    case 'task_status_changed':
      return `Task ${payload.status || 'Updated'}`;
    case 'agent_status_changed':
      return `${payload.agent_type || 'Agent'} Status Changed`;
    case 'system_notification':
      return payload.title || 'System Notification';
    default:
      return 'Event';
  }
}

function getToastMessage(event: WebSocketEvent): string | undefined {
  const { payload } = event;
  return payload.title || payload.message || payload.repository;
}

function ToastItem({
  toast,
  onDismiss,
  config,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  config: ReturnType<typeof getToastConfig>;
}) {
  const bgColors: Record<Toast['type'], string> = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${bgColors[toast.type]} animate-slide-in`}
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{toast.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          {toast.timestamp.toLocaleTimeString()}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ToastNotification({
  maxToasts = 5,
  autoDismissTime = 5000,
  position = 'top-right',
  enableSound = false,
}: ToastNotificationProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (event: WebSocketEvent) => {
      const config = getToastConfig(event.type);
      const newToast: Toast = {
        id: `${Date.now()}-${Math.random()}`,
        type: config.type,
        title: getToastTitle(event),
        message: getToastMessage(event),
        timestamp: new Date(),
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });

      // Play notification sound if enabled
      if (enableSound && typeof window !== 'undefined') {
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }
    },
    [maxToasts, enableSound]
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Subscribe to WebSocket events
  useWebSocketEvent('all', addToast, [addToast]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0 || autoDismissTime === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(0, -1));
    }, autoDismissTime);

    return () => clearTimeout(timer);
  }, [toasts, autoDismissTime]);

  const positionClasses: Record<typeof position, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]`}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
          config={getToastConfig(toast.type as WebSocketEventType)}
        />
      ))}
      <style jsx global>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
