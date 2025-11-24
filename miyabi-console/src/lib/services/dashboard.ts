/**
 * Dashboard Service
 *
 * Handles all dashboard-related API calls including summary stats,
 * recent executions, and system metrics.
 */

import { apiClient } from '../api/client';
import type { SystemMetrics, ActivityStats, ActivityEvent } from '../api/client';

export interface DashboardSummary {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  failedTasks: number;
  successRate: number;
  avgTaskDuration: number;
}

export interface RecentExecution {
  id: string;
  agentType: string;
  issueNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export class DashboardService {
  /**
   * Get dashboard summary statistics
   */
  async getSummary(): Promise<DashboardSummary> {
    // Mock implementation - replace with actual API call once backend endpoint is ready
    const agents = await apiClient.getAgents();
    const activeAgents = agents.filter(a => a.status === 'active').length;

    return {
      totalAgents: agents.length,
      activeAgents,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      failedTasks: 0,
      successRate: 0,
      avgTaskDuration: 0,
    };
  }

  /**
   * Get recent agent executions
   */
  async getRecentExecutions(_limit = 10): Promise<RecentExecution[]> {
    // TODO: Implement actual API call with limit parameter
    // Mock implementation for now
    return [];
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    return await apiClient.getSystemMetrics();
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(): Promise<ActivityStats> {
    return await apiClient.getActivityStats();
  }

  /**
   * Get recent activity events
   */
  async getActivityEvents(limit = 50): Promise<ActivityEvent[]> {
    return await apiClient.getActivityEvents(limit);
  }

  /**
   * Refresh dashboard data
   * Useful for real-time updates
   */
  async refresh(): Promise<{
    summary: DashboardSummary;
    metrics: SystemMetrics;
    stats: ActivityStats;
  }> {
    const [summary, metrics, stats] = await Promise.all([
      this.getSummary(),
      this.getSystemMetrics(),
      this.getActivityStats(),
    ]);

    return { summary, metrics, stats };
  }
}

// Singleton instance
export const dashboardService = new DashboardService();
