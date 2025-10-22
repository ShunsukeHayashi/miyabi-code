// WebSocket Context Provider - Single shared connection for all components

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Agent, SystemStatus } from '../lib/api-client';
import type { TaskRetryEvent, TaskCancelEvent, ErrorInfo } from '../types/error-types';

const WS_URL = import.meta.env.VITE_API_URL?.replace('http', 'ws') + '/ws' || 'ws://localhost:3001/ws';
const RECONNECT_INTERVAL = 3000; // 3 seconds

type DashboardUpdate =
  | { type: 'agents'; agents: Agent[] }
  | { type: 'systemstatus'; status: SystemStatus }
  | { type: 'error'; error: ErrorInfo }
  | { type: 'taskretry'; event: TaskRetryEvent }
  | { type: 'taskcancel'; event: TaskCancelEvent }
  | { type: 'ping' };

interface WebSocketContextValue {
  agents: Agent[] | null;
  systemStatus: SystemStatus | null;
  isConnected: boolean;
  error: Error | null;
  taskRetryEvents: TaskRetryEvent[];
  taskCancelEvents: TaskCancelEvent[];
  errorEvents: ErrorInfo[];
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [taskRetryEvents, setTaskRetryEvents] = useState<TaskRetryEvent[]>([]);
  const [taskCancelEvents, setTaskCancelEvents] = useState<TaskCancelEvent[]>([]);
  const [errorEvents, setErrorEvents] = useState<ErrorInfo[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnect = useRef(true);

  const connect = useCallback(() => {
    try {
      console.log('[WebSocket Context] Connecting to', WS_URL);
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WebSocket Context] Connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: DashboardUpdate = JSON.parse(event.data);

          switch (data.type) {
            case 'agents':
              console.log('[WebSocket Context] Received agents update:', data.agents.length, 'agents');
              setAgents(data.agents);
              break;
            case 'systemstatus':
              console.log('[WebSocket Context] Received system status update');
              setSystemStatus(data.status);
              break;
            case 'error':
              console.log('[WebSocket Context] Received error event:', data.error);
              setErrorEvents((prev) => [data.error, ...prev].slice(0, 100));
              break;
            case 'taskretry':
              console.log('[WebSocket Context] Received task retry event:', data.event);
              setTaskRetryEvents((prev) => [data.event, ...prev].slice(0, 100));

              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🔄 Task Retry', {
                  body: `Task ${data.event.task_id} retry attempt ${data.event.retry_count}${data.event.reason ? `: ${data.event.reason}` : ''}`,
                  icon: '/favicon.ico',
                });
              }
              break;
            case 'taskcancel':
              console.log('[WebSocket Context] Received task cancel event:', data.event);
              setTaskCancelEvents((prev) => [data.event, ...prev].slice(0, 100));

              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('❌ Task Cancelled', {
                  body: `Task ${data.event.task_id} cancelled: ${data.event.reason}`,
                  icon: '/favicon.ico',
                });
              }
              break;
            case 'ping':
              // Ignore ping messages
              break;
            default:
              console.warn('[WebSocket Context] Unknown message type:', data);
          }
        } catch (err) {
          console.error('[WebSocket Context] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket Context] Error:', event);
        setError(new Error('WebSocket connection error'));
      };

      ws.onclose = (event) => {
        console.log('[WebSocket Context] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect if should reconnect
        if (shouldReconnect.current) {
          console.log('[WebSocket Context] Reconnecting in', RECONNECT_INTERVAL, 'ms');
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, RECONNECT_INTERVAL);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket Context] Connection error:', err);
      setError(err as Error);

      // Reconnect on error
      if (shouldReconnect.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, RECONNECT_INTERVAL);
      }
    }
  }, []);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      console.log('[WebSocket Context] Cleanup: closing connection');
      shouldReconnect.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const value: WebSocketContextValue = {
    agents,
    systemStatus,
    isConnected,
    error,
    taskRetryEvents,
    taskCancelEvents,
    errorEvents,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to access WebSocket context
export function useWebSocketContext(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}
