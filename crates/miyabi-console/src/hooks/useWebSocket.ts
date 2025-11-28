import { useEffect, useRef, useState, useCallback } from 'react';

export interface WsEvent {
  type: 'agent_status' | 'agent_started' | 'agent_progress' | 'agent_completed' | 'task_updated' | 'log_entry' | 'issue_update' | 'pr_update' | 'deployment_update' | 'worktree_update' | 'notification';
  [key: string]: any;
}

export interface WsAgentStatus {
  type: 'agent_status';
  agent_type: string;
  status: string;
  issue_number?: number;
  timestamp: string;
}

export interface WsLogEntry {
  type: 'log_entry';
  id: string;
  timestamp: string;
  level: string;
  agent_type?: string;
  message: string;
  context?: string;
  issue_number?: number;
  session_id: string;
  file?: string;
  line?: number;
}

export interface WsNotification {
  type: 'notification';
  level: string;
  message: string;
  timestamp: string;
}

// Issue #1175: Agent execution events
export interface WsAgentStarted {
  type: 'agent_started';
  agent_type: string;
  issue_number: number;
  execution_id: string;
  timestamp: string;
}

export interface WsAgentProgress {
  type: 'agent_progress';
  agent_type: string;
  progress: number; // 0-100
  message: string;
  execution_id: string;
  timestamp: string;
}

export interface WsAgentCompleted {
  type: 'agent_completed';
  agent_type: string;
  execution_id: string;
  result: {
    success: boolean;
    quality_score?: number;
    pr_number?: number;
    error?: string;
  };
  timestamp: string;
}

export interface WsTaskUpdated {
  type: 'task_updated';
  task_id: string;
  status: string;
  timestamp: string;
}

export type WebSocketEvent = WsAgentStatus | WsAgentStarted | WsAgentProgress | WsAgentCompleted | WsTaskUpdated | WsLogEntry | WsNotification;

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  onMessage?: (event: WebSocketEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/api/v1/ws',
    autoConnect = true,
    reconnectInterval = 5000,
    onMessage,
    onError,
    onOpen,
    onClose,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(autoConnect);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      console.log('[WebSocket] Connecting to', url);
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        if (onOpen) onOpen();

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketEvent = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', data.type);
          setLastEvent(data);
          if (onMessage) onMessage(data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        if (onError) onError(error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        if (onClose) onClose();

        // Auto-reconnect if enabled
        if (shouldReconnectRef.current && reconnectInterval > 0) {
          console.log(`[WebSocket] Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  }, [url, reconnectInterval, onMessage, onError, onOpen, onClose]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting...');
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoConnect, connect]);

  return {
    isConnected,
    lastEvent,
    connect,
    disconnect,
    sendMessage,
  };
};
