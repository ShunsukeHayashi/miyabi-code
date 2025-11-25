/**
 * Real-Time Data Hooks
 * Issue: #980 - Phase 3.3: Real-Time WebSocket Integration
 *
 * Hooks that combine WebSocket events with REST API data for real-time updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, useWebSocketEvent } from '../../app/contexts';
import { dashboardService, agentsService, tasksService } from '../services';
import type { DashboardSummary, RecentActivity, Agent, Task } from '../services';
import type { WebSocketEvent } from '../websocket-client';

// =============================================================================
// Types
// =============================================================================

export interface UseRealTimeOptions {
  initialFetch?: boolean;
  pollingInterval?: number; // Fallback polling when WS disconnected
  enablePolling?: boolean;
}

// =============================================================================
// useRealTimeSummary Hook
// =============================================================================

export function useRealTimeSummary(options: UseRealTimeOptions = {}) {
  const { initialFetch = true, pollingInterval = 60000, enablePolling = true } = options;
  const { isConnected } = useWebSocket();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await dashboardService.getSummary();
      if (mountedRef.current) {
        setSummary(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch summary'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Handle real-time updates
  useWebSocketEvent(
    'all',
    useCallback(
      (event: WebSocketEvent) => {
        // Update summary based on event type
        if (
          event.type === 'agent_execution_started' ||
          event.type === 'agent_execution_completed' ||
          event.type === 'agent_execution_failed'
        ) {
          // Refetch summary to get accurate counts
          fetchSummary();
        }
      },
      [fetchSummary]
    ),
    [fetchSummary]
  );

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    if (initialFetch) {
      fetchSummary();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialFetch, fetchSummary]);

  // Fallback polling when disconnected
  useEffect(() => {
    if (!enablePolling || isConnected) return;

    const interval = setInterval(fetchSummary, pollingInterval);
    return () => clearInterval(interval);
  }, [enablePolling, isConnected, pollingInterval, fetchSummary]);

  return { summary, isLoading, error, refetch: fetchSummary, isRealTime: isConnected };
}

// =============================================================================
// useRealTimeActivities Hook
// =============================================================================

export function useRealTimeActivities(options: UseRealTimeOptions & { limit?: number } = {}) {
  const { initialFetch = true, pollingInterval = 60000, enablePolling = true, limit = 20 } = options;
  const { isConnected } = useWebSocket();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchActivities = useCallback(async () => {
    try {
      const response = await dashboardService.getRecentActivities({ limit });
      if (mountedRef.current) {
        setActivities(response.activities);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  // Handle real-time updates
  useWebSocketEvent(
    'all',
    useCallback(
      (event: WebSocketEvent) => {
        if (
          event.type === 'agent_execution_started' ||
          event.type === 'agent_execution_completed' ||
          event.type === 'agent_execution_failed'
        ) {
          // Add new activity to the top
          const newActivity: RecentActivity = {
            id: event.payload.execution_id || `${Date.now()}`,
            type: 'execution',
            agentType: event.payload.agent_type || 'Unknown',
            status:
              event.type === 'agent_execution_started'
                ? 'running'
                : event.type === 'agent_execution_completed'
                ? 'completed'
                : 'failed',
            repository: event.payload.repository || 'unknown',
            title: event.payload.title || `${event.payload.agent_type} execution`,
            timestamp: event.payload.timestamp,
          };

          setActivities((prev) => {
            // Update existing or add new
            const existing = prev.findIndex((a) => a.id === newActivity.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = newActivity;
              return updated;
            }
            return [newActivity, ...prev].slice(0, limit);
          });
        }
      },
      [limit]
    ),
    [limit]
  );

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    if (initialFetch) {
      fetchActivities();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialFetch, fetchActivities]);

  // Fallback polling
  useEffect(() => {
    if (!enablePolling || isConnected) return;

    const interval = setInterval(fetchActivities, pollingInterval);
    return () => clearInterval(interval);
  }, [enablePolling, isConnected, pollingInterval, fetchActivities]);

  return { activities, isLoading, error, refetch: fetchActivities, isRealTime: isConnected };
}

// =============================================================================
// useRealTimeAgents Hook
// =============================================================================

export function useRealTimeAgents(options: UseRealTimeOptions = {}) {
  const { initialFetch = true, pollingInterval = 60000, enablePolling = true } = options;
  const { isConnected } = useWebSocket();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await agentsService.list();
      if (mountedRef.current) {
        setAgents(data);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch agents'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Handle real-time updates
  useWebSocketEvent(
    'agent_status_changed',
    useCallback((event: WebSocketEvent) => {
      setAgents((prev) => {
        return prev.map((agent) => {
          if (agent.id === event.payload.agent_id || agent.type === event.payload.agent_type) {
            return {
              ...agent,
              status: (event.payload.status as Agent['status']) || agent.status,
              currentTask: event.payload.title,
              lastActive: event.payload.timestamp,
            };
          }
          return agent;
        });
      });
    }, []),
    []
  );

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    if (initialFetch) {
      fetchAgents();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialFetch, fetchAgents]);

  // Fallback polling
  useEffect(() => {
    if (!enablePolling || isConnected) return;

    const interval = setInterval(fetchAgents, pollingInterval);
    return () => clearInterval(interval);
  }, [enablePolling, isConnected, pollingInterval, fetchAgents]);

  return { agents, isLoading, error, refetch: fetchAgents, isRealTime: isConnected };
}

// =============================================================================
// useRealTimeTasks Hook
// =============================================================================

export function useRealTimeTasks(options: UseRealTimeOptions & { limit?: number } = {}) {
  const { initialFetch = true, pollingInterval = 60000, enablePolling = true, limit = 20 } = options;
  const { isConnected } = useWebSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await tasksService.list({ limit });
      if (mountedRef.current) {
        setTasks(response.tasks);
        setTotal(response.total);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  // Handle real-time updates
  useWebSocketEvent(
    'task_status_changed',
    useCallback((event: WebSocketEvent) => {
      setTasks((prev) => {
        return prev.map((task) => {
          if (task.id === event.payload.task_id) {
            return {
              ...task,
              status: (event.payload.status as Task['status']) || task.status,
            };
          }
          return task;
        });
      });
    }, []),
    []
  );

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    if (initialFetch) {
      fetchTasks();
    }
    return () => {
      mountedRef.current = false;
    };
  }, [initialFetch, fetchTasks]);

  // Fallback polling
  useEffect(() => {
    if (!enablePolling || isConnected) return;

    const interval = setInterval(fetchTasks, pollingInterval);
    return () => clearInterval(interval);
  }, [enablePolling, isConnected, pollingInterval, fetchTasks]);

  return { tasks, total, isLoading, error, refetch: fetchTasks, isRealTime: isConnected };
}

export default {
  useRealTimeSummary,
  useRealTimeActivities,
  useRealTimeAgents,
  useRealTimeTasks,
};
