/**
 * Dashboard Hooks
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 *
 * Custom React hooks for dashboard data fetching with:
 * - Automatic data refresh
 * - Error handling with fallback to mock data
 * - Loading states
 * - Type-safe responses
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService, type DashboardSummary, type RecentActivity } from '../services';
import { agentsService, type Agent } from '../services';
import { tasksService, type Task, type TasksListResponse } from '../services';

// =============================================================================
// Types
// =============================================================================

export interface UseDashboardOptions {
  refreshInterval?: number;
  fallbackToMock?: boolean;
}

export interface DashboardState {
  summary: DashboardSummary | null;
  activities: RecentActivity[];
  agents: Agent[];
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// =============================================================================
// Mock Data Fallbacks
// =============================================================================

const mockSummary: DashboardSummary = {
  totalExecutions: 156,
  runningExecutions: 4,
  completedExecutions: 142,
  failedExecutions: 10,
  activeRepositories: 12,
  pendingPRs: 34,
  avgExecutionTime: 45,
  lastUpdated: new Date().toISOString(),
};

const mockActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'execution',
    agentType: 'CodeGen',
    status: 'completed',
    repository: 'miyabi-private',
    title: 'Implement dashboard API client',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    duration: 120,
  },
  {
    id: '2',
    type: 'pr',
    agentType: 'PR',
    status: 'completed',
    repository: 'miyabi-private',
    title: 'Create PR #1107 for API client',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'execution',
    agentType: 'Review',
    status: 'running',
    repository: 'miyabi-private',
    title: 'Code review for RBAC implementation',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
];

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'CoordinatorAgent',
    type: 'coordinator',
    status: 'online',
    description: 'Task orchestration and parallel execution',
    capabilities: ['task-decomposition', 'parallel-execution', 'dependency-resolution'],
    lastActive: new Date().toISOString(),
    executionCount: 245,
    successRate: 98.5,
    avgExecutionTime: 30,
  },
  {
    id: '2',
    name: 'CodeGenAgent',
    type: 'code_gen',
    status: 'busy',
    description: 'AI-driven code generation',
    capabilities: ['rust', 'typescript', 'python'],
    currentTask: 'Implementing dashboard components',
    lastActive: new Date().toISOString(),
    executionCount: 189,
    successRate: 95.2,
    avgExecutionTime: 120,
  },
  {
    id: '3',
    name: 'ReviewAgent',
    type: 'review',
    status: 'online',
    description: 'Code quality analysis and security scanning',
    capabilities: ['static-analysis', 'security-scan', 'quality-scoring'],
    lastActive: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    executionCount: 312,
    successRate: 99.1,
    avgExecutionTime: 45,
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    type: 'issue',
    title: 'Dashboard UI Modernization',
    description: 'Update dashboard with real-time data',
    status: 'running',
    priority: 1,
    repository: 'miyabi-private',
    issueNumber: 979,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    progress: 60,
  },
  {
    id: '2',
    type: 'pr',
    title: 'WebSocket Integration',
    status: 'pending',
    priority: 2,
    repository: 'miyabi-private',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

// =============================================================================
// useDashboardSummary Hook
// =============================================================================

export function useDashboardSummary(options: UseDashboardOptions = {}) {
  const { refreshInterval = 30000, fallbackToMock = true } = options;
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
        if (fallbackToMock) {
          setSummary(mockSummary);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fallbackToMock]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSummary();

    const interval = setInterval(fetchSummary, refreshInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchSummary, refreshInterval]);

  return { summary, isLoading, error, refetch: fetchSummary };
}

// =============================================================================
// useRecentActivities Hook
// =============================================================================

export function useRecentActivities(options: UseDashboardOptions & { limit?: number } = {}) {
  const { refreshInterval = 30000, fallbackToMock = true, limit = 20 } = options;
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
        if (fallbackToMock) {
          setActivities(mockActivities.slice(0, limit));
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fallbackToMock, limit]);

  useEffect(() => {
    mountedRef.current = true;
    fetchActivities();

    const interval = setInterval(fetchActivities, refreshInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchActivities, refreshInterval]);

  return { activities, isLoading, error, refetch: fetchActivities };
}

// =============================================================================
// useAgents Hook
// =============================================================================

export function useAgents(options: UseDashboardOptions = {}) {
  const { refreshInterval = 30000, fallbackToMock = true } = options;
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
        if (fallbackToMock) {
          setAgents(mockAgents);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fallbackToMock]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAgents();

    const interval = setInterval(fetchAgents, refreshInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchAgents, refreshInterval]);

  return { agents, isLoading, error, refetch: fetchAgents };
}

// =============================================================================
// useTasks Hook
// =============================================================================

export function useTasks(options: UseDashboardOptions & { status?: string; limit?: number } = {}) {
  const { refreshInterval = 30000, fallbackToMock = true, limit = 20 } = options;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response: TasksListResponse = await tasksService.list({ limit });
      if (mountedRef.current) {
        setTasks(response.tasks);
        setTotal(response.total);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tasks'));
        if (fallbackToMock) {
          setTasks(mockTasks.slice(0, limit));
          setTotal(mockTasks.length);
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fallbackToMock, limit]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTasks();

    const interval = setInterval(fetchTasks, refreshInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchTasks, refreshInterval]);

  return { tasks, total, isLoading, error, refetch: fetchTasks };
}

// =============================================================================
// useDashboard Combined Hook
// =============================================================================

export function useDashboard(options: UseDashboardOptions = {}) {
  const { refreshInterval = 30000, fallbackToMock = true } = options;
  const [state, setState] = useState<DashboardState>({
    summary: null,
    activities: [],
    agents: [],
    tasks: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const [summary, activities, agents, tasksResponse] = await Promise.allSettled([
        dashboardService.getSummary(),
        dashboardService.getRecentActivities({ limit: 20 }),
        agentsService.list(),
        tasksService.list({ limit: 10 }),
      ]);

      if (mountedRef.current) {
        setState({
          summary: summary.status === 'fulfilled' ? summary.value : (fallbackToMock ? mockSummary : null),
          activities: activities.status === 'fulfilled' ? activities.value.activities : (fallbackToMock ? mockActivities : []),
          agents: agents.status === 'fulfilled' ? agents.value : (fallbackToMock ? mockAgents : []),
          tasks: tasksResponse.status === 'fulfilled' ? tasksResponse.value.tasks : (fallbackToMock ? mockTasks : []),
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err : new Error('Failed to fetch dashboard data'),
          lastUpdated: new Date(),
        }));

        if (fallbackToMock) {
          setState((prev) => ({
            ...prev,
            summary: mockSummary,
            activities: mockActivities,
            agents: mockAgents,
            tasks: mockTasks,
          }));
        }
      }
    }
  }, [fallbackToMock]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();

    const interval = setInterval(fetchAll, refreshInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchAll, refreshInterval]);

  return { ...state, refetch: fetchAll };
}

export default useDashboard;
