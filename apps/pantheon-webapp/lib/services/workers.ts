/**
 * Workers Service
 * Issue: #978 - Phase 3: Frontend Integration
 *
 * Provides API access to worker status and management
 */

import { apiClient } from '../api';

// =============================================================================
// Types
// =============================================================================

export type WorkerStatus = 'idle' | 'busy' | 'offline' | 'error';

export interface Worker {
  id: string;
  name: string;
  status: WorkerStatus;
  coordinator_id?: string;
  current_task_id?: string;
  cpu_usage: number;
  memory_usage: number;
  tasks_completed: number;
  tasks_failed: number;
  last_heartbeat?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkerListResponse {
  workers: Worker[];
  total: number;
}

export interface WorkerMetrics {
  worker_id: string;
  avg_cpu: number;
  avg_memory: number;
  tasks_per_hour: number;
  success_rate: number;
  uptime_hours: number;
}

// =============================================================================
// Workers Service
// =============================================================================

export const workersService = {
  /**
   * List all workers with optional filters
   */
  list: async (params?: {
    status?: WorkerStatus;
    coordinator_id?: string;
    page?: number;
    limit?: number;
  }): Promise<WorkerListResponse> => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.coordinator_id) queryParams.coordinator_id = params.coordinator_id;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();

    return apiClient.get<WorkerListResponse>('/workers', queryParams);
  },

  /**
   * Get worker by ID
   */
  get: async (workerId: string): Promise<Worker> => {
    return apiClient.get<Worker>(`/workers/${workerId}`);
  },

  /**
   * Get worker metrics
   */
  getMetrics: async (workerId: string): Promise<WorkerMetrics> => {
    return apiClient.get<WorkerMetrics>(`/workers/${workerId}/metrics`);
  },

  /**
   * Get workers summary (counts by status)
   */
  getSummary: async (): Promise<{
    total: number;
    idle: number;
    busy: number;
    offline: number;
    error: number;
  }> => {
    return apiClient.get('/workers/summary');
  },

  /**
   * Send heartbeat for a worker (admin only)
   */
  heartbeat: async (workerId: string): Promise<void> => {
    return apiClient.post(`/workers/${workerId}/heartbeat`);
  },
};

export default workersService;
