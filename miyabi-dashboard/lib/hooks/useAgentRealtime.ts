/**
 * React hook for Agent real-time updates via WebSocket
 *
 * Connects to Miyabi Desktop WebSocket server and subscribes to 'agent:event' messages.
 * Provides real-time agent status updates and manages connection state.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getMiyabiWebSocket } from '../websocket';
import { AgentEvent, AgentEventType } from '../types';
import { Agent } from '../mockData';

export interface AgentRealtimeState {
  agents: Agent[];
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

export interface UseAgentRealtimeOptions {
  initialAgents?: Agent[];
  enableMockData?: boolean;
  wsUrl?: string;
}

/**
 * Hook to manage real-time agent updates via WebSocket
 *
 * @param options Configuration options
 * @returns Agent state and control functions
 */
export function useAgentRealtime(options: UseAgentRealtimeOptions = {}) {
  const {
    initialAgents = [],
    enableMockData = false,
    wsUrl = 'ws://localhost:9001'
  } = options;

  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef(getMiyabiWebSocket());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Convert AgentEvent to Agent status update
   */
  const mapEventToStatus = useCallback((eventType: AgentEventType): Agent['status'] => {
    switch (eventType) {
      case 'started':
      case 'progress':
        return 'active';
      case 'completed':
      case 'cancelled':
        return 'idle';
      case 'failed':
        return 'offline';
      default:
        return 'idle';
    }
  }, []);

  /**
   * Handle incoming agent events
   */
  const handleAgentEvent = useCallback((event: AgentEvent) => {
    console.log('[useAgentRealtime] Received agent event:', event);

    setAgents((prevAgents) => {
      const existingAgentIndex = prevAgents.findIndex(
        (agent) => agent.name === event.agent_name
      );

      const newStatus = mapEventToStatus(event.event_type);
      const currentTask = event.event_type === 'completed' || event.event_type === 'cancelled'
        ? undefined
        : event.message;

      if (existingAgentIndex >= 0) {
        // Update existing agent
        const updatedAgents = [...prevAgents];
        const existingAgent = updatedAgents[existingAgentIndex];

        updatedAgents[existingAgentIndex] = {
          ...existingAgent,
          status: newStatus,
          currentTask: currentTask || existingAgent.currentTask,
          tasksCompleted: event.event_type === 'completed'
            ? existingAgent.tasksCompleted + 1
            : existingAgent.tasksCompleted,
        };

        return updatedAgents;
      } else {
        // Add new agent
        const newAgent: Agent = {
          id: `agent-${Date.now()}-${Math.random()}`,
          name: event.agent_name,
          type: 'coding', // Default to coding, could be enhanced with metadata
          status: newStatus,
          currentTask,
          tasksCompleted: event.event_type === 'completed' ? 1 : 0,
        };

        return [...prevAgents, newAgent];
      }
    });

    setLastUpdate(new Date());
    setError(null);
  }, [mapEventToStatus]);

  /**
   * Check connection status periodically
   */
  const checkConnectionStatus = useCallback(() => {
    const ws = wsRef.current;
    const connected = ws.isConnected();

    setIsConnected(connected);

    if (!connected && !enableMockData) {
      setError('WebSocket disconnected. Attempting to reconnect...');
    } else {
      setError(null);
    }
  }, [enableMockData]);

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (enableMockData) {
      console.log('[useAgentRealtime] Mock data mode enabled, skipping WebSocket connection');
      return;
    }

    const ws = wsRef.current;

    // Register event handler
    ws.on<AgentEvent>('agent:event', handleAgentEvent);

    // Connect if not already connected
    if (!ws.isConnected()) {
      ws.connect();
    }

    // Start status check interval
    const statusInterval = setInterval(checkConnectionStatus, 2000);

    return () => {
      clearInterval(statusInterval);
      ws.off('agent:event', handleAgentEvent);
    };
  }, [enableMockData, handleAgentEvent, checkConnectionStatus]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    const ws = wsRef.current;
    ws.off('agent:event', handleAgentEvent);
    ws.disconnect();
    setIsConnected(false);
  }, [handleAgentEvent]);

  /**
   * Manually trigger a reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Auto-connect on mount
  useEffect(() => {
    const cleanup = connect();

    return () => {
      if (cleanup) cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    agents,
    isConnected,
    lastUpdate,
    error,
    reconnect,
    disconnect,
  };
}
