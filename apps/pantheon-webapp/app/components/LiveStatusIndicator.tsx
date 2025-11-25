/**
 * Live Status Indicator Component
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 *
 * Shows WebSocket connection status with animated indicators
 */

'use client';

import { useWebSocket } from '../contexts';
import type { ConnectionState } from '../../lib/websocket-client';

interface LiveStatusIndicatorProps {
  showLabel?: boolean;
  showLastUpdate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getStatusConfig(state: ConnectionState): {
  color: string;
  bgColor: string;
  label: string;
  animate: boolean;
} {
  switch (state) {
    case 'connected':
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        label: 'LIVE',
        animate: true,
      };
    case 'connecting':
      return {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        label: 'Connecting...',
        animate: true,
      };
    case 'reconnecting':
      return {
        color: 'bg-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        label: 'Reconnecting...',
        animate: true,
      };
    case 'disconnected':
      return {
        color: 'bg-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        label: 'Offline',
        animate: false,
      };
    case 'error':
      return {
        color: 'bg-red-500',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        label: 'Error',
        animate: false,
      };
    default:
      return {
        color: 'bg-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
        label: 'Unknown',
        animate: false,
      };
  }
}

function getSizeClasses(size: 'sm' | 'md' | 'lg'): {
  dot: string;
  text: string;
  container: string;
} {
  switch (size) {
    case 'sm':
      return { dot: 'w-2 h-2', text: 'text-xs', container: 'px-2 py-0.5' };
    case 'md':
      return { dot: 'w-2.5 h-2.5', text: 'text-sm', container: 'px-2.5 py-1' };
    case 'lg':
      return { dot: 'w-3 h-3', text: 'text-base', container: 'px-3 py-1.5' };
  }
}

export default function LiveStatusIndicator({
  showLabel = true,
  showLastUpdate = false,
  size = 'md',
  className = '',
}: LiveStatusIndicatorProps) {
  const { connectionState, lastEventTime } = useWebSocket();
  const config = getStatusConfig(connectionState);
  const sizeClasses = getSizeClasses(size);

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`flex items-center gap-1.5 rounded-full ${config.bgColor} ${sizeClasses.container}`}
      >
        <span className="relative flex">
          {config.animate && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${config.color} ${sizeClasses.dot}`} />
        </span>
        {showLabel && (
          <span
            className={`font-semibold ${sizeClasses.text} ${
              connectionState === 'connected'
                ? 'text-green-700 dark:text-green-400'
                : connectionState === 'error'
                ? 'text-red-700 dark:text-red-400'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {config.label}
          </span>
        )}
      </div>
      {showLastUpdate && lastEventTime && (
        <span className={`text-gray-500 dark:text-gray-400 ${sizeClasses.text}`}>
          Updated {formatLastUpdate(lastEventTime)}
        </span>
      )}
    </div>
  );
}
