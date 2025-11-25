/**
 * Tasks Service
 * Issue: #978 - Phase 3.1: API Client Implementation
 */

import { apiClient } from '../api';

// =============================================================================
// Types
// =============================================================================

export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskType = 'issue' | 'pr' | 'deployment' | 'review' | 'custom';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: number;
  repository?: string;
  issueNumber?: number;
  prNumber?: number;
  assignedAgent?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  progress?: number;
  logs?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateTaskRequest {
  type: TaskType;
  title: string;
  description?: string;
  repository?: string;
  issueNumber?: number;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface TasksListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// Tasks Service
// =============================================================================

export const tasksService = {
  /**
   * List all tasks with optional filters
   */
  list: async (params?: {
    status?: TaskStatus;
    type?: TaskType;
    repository?: string;
    page?: number;
    limit?: number;
  }): Promise<TasksListResponse> => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.type) queryParams.type = params.type;
    if (params?.repository) queryParams.repository = params.repository;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();

    return apiClient.get<TasksListResponse>('/tasks', queryParams);
  },

  /**
   * Get task by ID
   */
  get: async (taskId: string): Promise<Task> => {
    return apiClient.get<Task>(`/tasks/${taskId}`);
  },

  /**
   * Create a new task
   */
  create: async (data: CreateTaskRequest): Promise<Task> => {
    return apiClient.post<Task>('/tasks', data);
  },

  /**
   * Cancel a task
   */
  cancel: async (taskId: string): Promise<Task> => {
    return apiClient.post<Task>(`/tasks/${taskId}/cancel`);
  },

  /**
   * Retry a failed task
   */
  retry: async (taskId: string): Promise<Task> => {
    return apiClient.post<Task>(`/tasks/${taskId}/retry`);
  },

  /**
   * Get task logs
   */
  getLogs: async (taskId: string): Promise<{ logs: string[] }> => {
    return apiClient.get<{ logs: string[] }>(`/tasks/${taskId}/logs`);
  },

  /**
   * Get running tasks count
   */
  getRunningCount: async (): Promise<{ count: number }> => {
    return apiClient.get<{ count: number }>('/tasks/running/count');
  },

  /**
   * Get task queue status
   */
  getQueueStatus: async (): Promise<{
    queued: number;
    running: number;
    workers: number;
    avgWaitTime: number;
  }> => {
    return apiClient.get('/tasks/queue/status');
  },
};

export default tasksService;
