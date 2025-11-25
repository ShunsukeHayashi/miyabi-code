/**
 * Dashboard Service
 * Issue: #978 - Phase 3.1: API Client Implementation
 */

import { apiClient } from '../api';

// =============================================================================
// Types
// =============================================================================

export interface DashboardSummary {
  totalExecutions: number;
  running: number;
  completed: number;
  failed: number;
  repositories: number;
  pullRequests: number;
  avgExecutionTime: number;
  lastUpdated: string;
}

export interface RecentActivity {
  id: string;
  type: 'execution' | 'pr' | 'issue' | 'deployment';
  agentType: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  repository: string;
  title: string;
  timestamp: string;
  duration?: number;
  details?: string;
}

export interface DashboardMetrics {
  executionsPerDay: Array<{
    date: string;
    count: number;
    success: number;
    failed: number;
  }>;
  agentUtilization: Array<{
    agent: string;
    percentage: number;
  }>;
  repositoryActivity: Array<{
    repository: string;
    executions: number;
    prs: number;
  }>;
}

// =============================================================================
// Dashboard Service
// =============================================================================

export const dashboardService = {
  /**
   * Get dashboard summary metrics
   */
  getSummary: async (): Promise<DashboardSummary> => {
    return apiClient.get<DashboardSummary>('/dashboard/summary');
  },

  /**
   * Get recent activities
   */
  getRecentActivities: async (params?: {
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<RecentActivity[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.status) queryParams.status = params.status;
    if (params?.type) queryParams.type = params.type;

    const response = await apiClient.get<{ activities: RecentActivity[] }>(
      '/dashboard/recent',
      queryParams
    );
    return response.activities;
  },

  /**
   * Get dashboard metrics for charts
   */
  getMetrics: async (params?: {
    timeRange?: '24h' | '7d' | '30d' | '90d';
  }): Promise<DashboardMetrics> => {
    return apiClient.get<DashboardMetrics>('/dashboard/metrics', {
      time_range: params?.timeRange || '7d',
    });
  },

  /**
   * Get execution details by ID
   */
  getExecutionDetails: async (executionId: string) => {
    return apiClient.get<{
      id: string;
      status: string;
      agent: string;
      repository: string;
      logs: string[];
      startedAt: string;
      completedAt?: string;
    }>(`/dashboard/executions/${executionId}`);
  },
};

export default dashboardService;
