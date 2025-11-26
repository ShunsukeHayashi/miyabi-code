/**
 * Coordinators Service
 * Issue: #978 - Phase 3: Frontend Integration
 *
 * Provides API access to coordinator status and management
 */

import { apiClient } from '../api';

// =============================================================================
// Types
// =============================================================================

export type CoordinatorStatus = 'active' | 'inactive' | 'maintenance';

export interface Coordinator {
  id: string;
  name: string;
  host: string;
  status: CoordinatorStatus;
  worker_count: number;
  max_workers: number;
  cpu_usage?: number;
  memory_usage?: number;
  region?: string;
  capabilities: string[];
  last_heartbeat?: string;
  created_at: string;
  updated_at: string;
}

export interface CoordinatorListResponse {
  coordinators: Coordinator[];
  total: number;
}

export interface CoordinatorMetrics {
  coordinator_id: string;
  active_workers: number;
  total_tasks_processed: number;
  avg_task_duration: number;
  success_rate: number;
  queue_depth: number;
}

// =============================================================================
// Coordinators Service
// =============================================================================

export const coordinatorsService = {
  /**
   * List all coordinators
   */
  list: async (params?: {
    status?: CoordinatorStatus;
    page?: number;
    limit?: number;
  }): Promise<CoordinatorListResponse> => {
    const queryParams: Record<string, string> = {};
    if (params?.status) queryParams.status = params.status;
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();

    return apiClient.get<CoordinatorListResponse>('/coordinators', queryParams);
  },

  /**
   * Get coordinator by ID
   */
  get: async (coordinatorId: string): Promise<Coordinator> => {
    return apiClient.get<Coordinator>(`/coordinators/${coordinatorId}`);
  },

  /**
   * Get coordinator metrics
   */
  getMetrics: async (coordinatorId: string): Promise<CoordinatorMetrics> => {
    return apiClient.get<CoordinatorMetrics>(`/coordinators/${coordinatorId}/metrics`);
  },

  /**
   * Get coordinators summary
   */
  getSummary: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    total_workers: number;
  }> => {
    return apiClient.get('/coordinators/summary');
  },

  /**
   * Get workers for a specific coordinator
   */
  getWorkers: async (coordinatorId: string): Promise<{
    workers: Array<{
      id: string;
      name: string;
      status: string;
      current_task_id?: string;
    }>;
  }> => {
    return apiClient.get(`/coordinators/${coordinatorId}/workers`);
  },
};

export default coordinatorsService;
