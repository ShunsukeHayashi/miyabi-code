import { useState, useEffect, useCallback } from 'react';
import type { StoredNotification, NotificationType } from '../types/electron';

/**
 * Toast position
 */
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

/**
 * Toast duration in milliseconds
 */
const DEFAULT_TOAST_DURATION = 5000;
const MAX_VISIBLE_TOASTS = 5;

/**
 * NotificationToast Component
 * Displays in-app notification toasts
 */
export default function NotificationToast({ position = 'top-right' }: { position?: ToastPosition }) {
  const [toasts, setToasts] = useState<StoredNotification[]>([]);

  useEffect(() => {
    // Listen for new notifications
    const handleNewNotification = (notification: StoredNotification) => {
      setToasts((prev) => {
        const updated = [notification, ...prev];
        // Keep only the latest MAX_VISIBLE_TOASTS
        return updated.slice(0, MAX_VISIBLE_TOASTS);
      });

      // Auto-dismiss after duration
      if (notification.timeout !== 0) {
        const duration = notification.timeout || DEFAULT_TOAST_DURATION;
        setTimeout(() => {
          dismissToast(notification.id);
        }, duration);
      }
    };

    // Listen for notification updates
    const handleNotificationUpdated = (notification: StoredNotification) => {
      if (notification.dismissed) {
        dismissToast(notification.id);
      }
    };

    // Listen for clear all
    const handleNotificationsCleared = () => {
      setToasts([]);
    };

    window.electron.on('notification:new', handleNewNotification);
    window.electron.on('notification:updated', handleNotificationUpdated);
    window.electron.on('notification:cleared', handleNotificationsCleared);

    return () => {
      window.electron.removeListener('notification:new', handleNewNotification);
      window.electron.removeListener('notification:updated', handleNotificationUpdated);
      window.electron.removeListener('notification:cleared', handleNotificationsCleared);
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    window.electron.notification.dismiss(id);
  }, []);

  const handleToastClick = useCallback((notification: StoredNotification) => {
    window.electron.notification.markAsRead(notification.id);
    dismissToast(notification.id);
  }, [dismissToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 pointer-events-none ${getPositionClasses(position)}`}
      style={{ maxWidth: '400px' }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          notification={toast}
          onDismiss={() => dismissToast(toast.id)}
          onClick={() => handleToastClick(toast)}
        />
      ))}
    </div>
  );
}

/**
 * Individual Toast Component
 */
function Toast({
  notification,
  onDismiss,
  onClick,
}: {
  notification: StoredNotification;
  onDismiss: () => void;
  onClick: () => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(onDismiss, 300); // Wait for exit animation
  }, [onDismiss]);

  const typeConfig = getTypeConfig(notification.type || 'info');

  return (
    <div
      className={`
        pointer-events-auto
        bg-background-light border border-background-lighter rounded-lg shadow-lg
        p-4 cursor-pointer
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'}
        hover:shadow-xl hover:border-${typeConfig.color}/50
      `}
      onClick={onClick}
      style={{
        animation: isExiting ? 'slideOut 300ms ease-out' : 'slideIn 300ms ease-out',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 text-2xl`}>{typeConfig.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-foreground pr-6">{notification.title}</h4>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm text-foreground-muted line-clamp-3">{notification.body}</p>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle action
                    onDismiss();
                  }}
                  className={`
                    px-3 py-1 rounded text-xs font-medium transition-colors
                    bg-${typeConfig.color}/20 hover:bg-${typeConfig.color}/30
                    text-${typeConfig.color}
                  `}
                >
                  {action.text}
                </button>
              ))}
            </div>
          )}

          {/* Priority indicator */}
          {notification.priority && ['high', 'urgent'].includes(notification.priority) && (
            <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
              <span>⚠️</span>
              <span className="uppercase font-medium">{notification.priority} Priority</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar for timeout */}
      {notification.timeout && notification.timeout > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1 bg-${typeConfig.color} rounded-b-lg`}
          style={{
            animation: `progressBar ${notification.timeout}ms linear`,
          }}
        />
      )}
    </div>
  );
}

/**
 * Get CSS classes for toast position
 */
function getPositionClasses(position: ToastPosition): string {
  switch (position) {
    case 'top-right':
      return 'top-4 right-4';
    case 'top-left':
      return 'top-4 left-4';
    case 'bottom-right':
      return 'bottom-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'top-center':
      return 'top-4 left-1/2 transform -translate-x-1/2';
    case 'bottom-center':
      return 'bottom-4 left-1/2 transform -translate-x-1/2';
    default:
      return 'top-4 right-4';
  }
}

/**
 * Get configuration for notification type
 */
function getTypeConfig(type: NotificationType): {
  icon: string;
  color: string;
} {
  switch (type) {
    case 'success':
      return { icon: '✅', color: 'green-500' };
    case 'error':
      return { icon: '❌', color: 'red-500' };
    case 'warning':
      return { icon: '⚠️', color: 'yellow-500' };
    case 'info':
    default:
      return { icon: 'ℹ️', color: 'blue-500' };
  }
}

/**
 * Global styles for animations
 * Add this to your global CSS file (index.css)
 */
export const notificationAnimationStyles = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  @keyframes progressBar {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;
