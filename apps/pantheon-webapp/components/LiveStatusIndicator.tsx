/**
 * Live Status Indicator Component
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 *
 * Displays WebSocket connection status and last update time.
 */

'use client';

import { useWebSocket, useConnectionState } from '../app/contexts/WebSocketContext';
import { ConnectionState } from '../lib/websocket-client';

interface LiveStatusIndicatorProps {
  showLastUpdate?: boolean;
  compact?: boolean;
  className?: string;
}

function formatLastUpdate(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 5) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  return date.toLocaleTimeString();
}

function StatusBadge({
  state,
  compact,
}: {
  state: ConnectionState;
  compact: boolean;
}) {
  const configs: Record<
    ConnectionState,
    { color: string; bgColor: string; label: string; pulse: boolean }
  > = {
    connected: {
      color: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      label: 'LIVE',
      pulse: true,
    },
    connecting: {
      color: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      label: 'Connecting',
      pulse: true,
    },
    reconnecting: {
      color: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      label: 'Reconnecting',
      pulse: true,
    },
    disconnected: {
      color: 'text-gray-600 dark:text-gray-400',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      label: 'Offline',
      pulse: false,
    },
    error: {
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      label: 'Error',
      pulse: false,
    },
  };

  const config = configs[state];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
    >
      <span
        className={`w-2 h-2 mr-1.5 rounded-full ${
          state === 'connected'
            ? 'bg-green-500'
            : state === 'connecting' || state === 'reconnecting'
            ? 'bg-yellow-500'
            : state === 'error'
            ? 'bg-red-500'
            : 'bg-gray-400'
        } ${config.pulse ? 'animate-pulse' : ''}`}
      />
      {!compact && config.label}
    </span>
  );
}

export function LiveStatusIndicator({
  showLastUpdate = true,
  compact = false,
  className = '',
}: LiveStatusIndicatorProps) {
  const { lastEventTime, connect } = useWebSocket();
  const { state, hasError } = useConnectionState();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <StatusBadge state={state} compact={compact} />

      {showLastUpdate && !compact && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Updated {formatLastUpdate(lastEventTime)}
        </span>
      )}

      {hasError && (
        <button
          onClick={connect}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Navbar connection status - more compact version
 */
export function NavbarConnectionStatus() {
  const { state, isReconnecting, hasError } = useConnectionState();
  const { connect } = useWebSocket();

  if (state === 'connected') {
    return (
      <div className="flex items-center space-x-1.5 text-green-600 dark:text-green-400">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium">Live</span>
      </div>
    );
  }

  if (isReconnecting) {
    return (
      <div className="flex items-center space-x-1.5 text-orange-600 dark:text-orange-400">
        <svg
          className="w-3 h-3 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span className="text-xs font-medium">Reconnecting</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <button
        onClick={connect}
        className="flex items-center space-x-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
      >
        <span className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-xs font-medium">Offline - Click to reconnect</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400">
      <span className="w-2 h-2 bg-gray-400 rounded-full" />
      <span className="text-xs font-medium">Offline</span>
    </div>
  );
}

export default LiveStatusIndicator;
