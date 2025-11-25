/**
 * WebSocket Context
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 *
 * Provides WebSocket connection state and event subscriptions
 * throughout the React component tree.
 */

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  WebSocketClient,
  ConnectionState,
  WebSocketEvent,
  WebSocketEventType,
  getWebSocketClient,
} from '../../lib/websocket-client';
import { auth } from '../../lib/api';

// =============================================================================
// Types
// =============================================================================

interface WebSocketContextValue {
  connectionState: ConnectionState;
  lastEventTime: Date | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  subscribe: (
    eventType: WebSocketEventType | 'all',
    handler: (event: WebSocketEvent) => void
  ) => () => void;
  send: (data: unknown) => boolean;
}

interface WebSocketProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
  fallbackPollingInterval?: number;
}

// =============================================================================
// Context
// =============================================================================

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

export function WebSocketProvider({
  children,
  autoConnect = true,
  fallbackPollingInterval = 30000,
}: WebSocketProviderProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket client
  useEffect(() => {
    clientRef.current = getWebSocketClient();

    // Subscribe to connection state changes
    const unsubscribeConnection = clientRef.current.onConnectionChange((state) => {
      setConnectionState(state);

      // Start fallback polling if disconnected/error
      if (state === 'error' || state === 'disconnected') {
        startFallbackPolling();
      } else if (state === 'connected') {
        stopFallbackPolling();
      }
    });

    // Auto-connect if enabled and authenticated
    if (autoConnect && auth.isAuthenticated()) {
      const token = auth.getAccessToken();
      clientRef.current.connect(token || undefined);
    }

    return () => {
      unsubscribeConnection();
      stopFallbackPolling();
    };
  }, [autoConnect]);

  // Update last event time when client receives events
  useEffect(() => {
    if (!clientRef.current) return;

    const unsubscribe = clientRef.current.subscribe('all', () => {
      setLastEventTime(new Date());
    });

    return unsubscribe;
  }, []);

  // Fallback polling mechanism
  const startFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    console.log('[WebSocket] Starting fallback polling');
    pollingIntervalRef.current = setInterval(() => {
      // Emit a synthetic event to trigger UI refreshes
      setLastEventTime(new Date());
    }, fallbackPollingInterval);
  }, [fallbackPollingInterval]);

  const stopFallbackPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('[WebSocket] Stopping fallback polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Connection methods
  const connect = useCallback(() => {
    const token = auth.getAccessToken();
    clientRef.current?.connect(token || undefined);
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
  }, []);

  // Subscribe to events
  const subscribe = useCallback(
    (
      eventType: WebSocketEventType | 'all',
      handler: (event: WebSocketEvent) => void
    ) => {
      if (!clientRef.current) {
        return () => {};
      }
      return clientRef.current.subscribe(eventType, handler);
    },
    []
  );

  // Send message
  const send = useCallback((data: unknown) => {
    return clientRef.current?.send(data) ?? false;
  }, []);

  const value: WebSocketContextValue = {
    connectionState,
    lastEventTime,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    subscribe,
    send,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// =============================================================================
// Event Hook
// =============================================================================

export function useWebSocketEvent(
  eventType: WebSocketEventType | 'all',
  handler: (event: WebSocketEvent) => void,
  deps: React.DependencyList = []
) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, handler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribe, eventType, ...deps]);
}

// =============================================================================
// Connection State Hook
// =============================================================================

export function useConnectionState(): {
  state: ConnectionState;
  isConnected: boolean;
  isReconnecting: boolean;
  hasError: boolean;
} {
  const { connectionState } = useWebSocket();

  return {
    state: connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: connectionState === 'reconnecting',
    hasError: connectionState === 'error',
  };
}

export default WebSocketContext;
