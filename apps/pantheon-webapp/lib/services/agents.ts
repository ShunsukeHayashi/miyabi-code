/**
 * Agents Service
 * Issue: #978 - Phase 3.1: API Client Implementation
 */

import { apiClient } from '../api';

// =============================================================================
// Types
// =============================================================================

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error';
export type AgentType =
  | 'coordinator'
  | 'code_gen'
  | 'review'
  | 'issue'
  | 'pr'
  | 'deployment'
  | 'refresher'
  | 'business';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  capabilities: string[];
  currentTask?: string;
  lastActive: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number;
  metadata?: Record<string, unknown>;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  taskId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  logs?: string[];
  result?: unknown;
}

export interface AgentMetrics {
  agentId: string;
  executionsToday: number;
  executionsWeek: number;
  successRate: number;
  avgDuration: number;
  errorRate: number;
}

// =============================================================================
// Agents Service
// =============================================================================

export const agentsService = {
  /**
   * List all agents
   */
  list: async (params?: {
    status?: AgentStatus;
    type?: AgentType;
  }): Promise<Agent[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.type) queryParams.type = params.type;

    const response = await apiClient.get<{ agents: Agent[] }>('/agents', queryParams);
    return response.agents;
  },

  /**
   * Get agent by ID
   */
  get: async (agentId: string): Promise<Agent> => {
    return apiClient.get<Agent>(`/agents/${agentId}`);
  },

  /**
   * Get agent executions
   */
  getExecutions: async (
    agentId: string,
    params?: {
      limit?: number;
      status?: string;
    }
  ): Promise<AgentExecution[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.status) queryParams.status = params.status;

    const response = await apiClient.get<{ executions: AgentExecution[] }>(
      `/agents/${agentId}/executions`,
      queryParams
    );
    return response.executions;
  },

  /**
   * Get agent metrics
   */
  getMetrics: async (agentId: string): Promise<AgentMetrics> => {
    return apiClient.get<AgentMetrics>(`/agents/${agentId}/metrics`);
  },

  /**
   * Get all agents status summary
   */
  getStatusSummary: async (): Promise<{
    online: number;
    offline: number;
    busy: number;
    error: number;
    total: number;
  }> => {
    return apiClient.get('/agents/status/summary');
  },

  /**
   * Trigger agent execution
   */
  execute: async (
    agentId: string,
    data: {
      taskType: string;
      params: Record<string, unknown>;
    }
  ): Promise<{ executionId: string }> => {
    return apiClient.post<{ executionId: string }>(`/agents/${agentId}/execute`, data);
  },

  /**
   * Stop agent execution
   */
  stop: async (agentId: string, executionId: string): Promise<void> => {
    return apiClient.post(`/agents/${agentId}/executions/${executionId}/stop`);
  },
};

export default agentsService;
