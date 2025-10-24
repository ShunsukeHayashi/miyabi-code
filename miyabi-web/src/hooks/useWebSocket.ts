/**
 * WebSocket hook for real-time agent execution updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

export type AgentEvent =
  | {
      type: 'execution_started';
      execution_id: string;
      repository_id: string;
      issue_number: number;
      agent_type: string;
      timestamp: string;
    }
  | {
      type: 'execution_progress';
      execution_id: string;
      progress: number;
      message: string;
      timestamp: string;
    }
  | {
      type: 'execution_completed';
      execution_id: string;
      quality_score?: number;
      pr_number?: number;
      timestamp: string;
    }
  | {
      type: 'execution_failed';
      execution_id: string;
      error: string;
      timestamp: string;
    }
  | {
      type: 'execution_log';
      execution_id: string;
      log_level: string;
      message: string;
      timestamp: string;
    };

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  /** Optional execution ID to subscribe to specific execution logs */
  executionId?: string;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in milliseconds */
  reconnectDelay?: number;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  /** Connection status */
  status: ConnectionStatus;
  /** Last received event */
  lastEvent: AgentEvent | null;
  /** Send a message to the server */
  send: (message: string) => void;
  /** Manually connect */
  connect: () => void;
  /** Manually disconnect */
  disconnect: () => void;
}

/**
 * Custom hook for WebSocket connection to receive real-time agent execution updates
 *
 * @example
 * ```tsx
 * const { status, lastEvent, connect, disconnect } = useWebSocket({
 *   autoReconnect: true,
 * });
 *
 * useEffect(() => {
 *   if (lastEvent?.type === 'execution_completed') {
 *     toast.success('Agent execution completed!');
 *   }
 * }, [lastEvent]);
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    executionId,
    autoReconnect = true,
    reconnectDelay = 5000,
    maxReconnectAttempts = 10,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<AgentEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { accessToken } = useAuthStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any pending reconnect attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setStatus('connecting');

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    let url = `${wsUrl}/api/v1/ws`;

    // Add execution ID as query parameter if provided
    if (executionId) {
      url += `?execution_id=${executionId}`;
    }

    // Add auth token as query parameter
    if (accessToken) {
      url += `${executionId ? '&' : '?'}token=${accessToken}`;
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setStatus('connected');
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AgentEvent;
        setLastEvent(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setStatus('disconnected');
      wsRef.current = null;

      // Auto-reconnect if enabled and under max attempts
      if (
        autoReconnect &&
        reconnectAttemptsRef.current < maxReconnectAttempts
      ) {
        reconnectAttemptsRef.current += 1;
        console.log(
          `Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
        );

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectDelay);
      }
    };

    wsRef.current = ws;
  }, [
    executionId,
    accessToken,
    autoReconnect,
    reconnectDelay,
    maxReconnectAttempts,
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
  }, []);

  const send = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    lastEvent,
    send,
    connect,
    disconnect,
  };
}
