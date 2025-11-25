/**
 * API client configuration
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const storage = localStorage.getItem('miyabi-auth-storage');
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      // Clear auth state and redirect to login
      localStorage.removeItem('miyabi-auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Type Definitions
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  plan: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  repository_id: string | null;
  name: string;
  description: string | null;
  priority: 'P0' | 'P1' | 'P2';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  agent_type: string | null;
  issue_number: number | null;
  metadata: Record<string, unknown> | null;
  retry_count: number;
  max_retries: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  repository_id?: string;
  agent_type?: string;
  page?: number;
  limit?: number;
}

export interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface Agent {
  id: string;
  name: string;
  layer: number;
  status: string;
  uptime: number;
  tasks: {
    active: number;
    completed: number;
  };
  metrics: {
    cpu_usage: number;
    memory_usage: number;
    task_completion_rate: number;
    average_task_duration: number;
  };
  config: {
    max_concurrent_tasks: number;
    timeout_seconds: number;
    retry_attempts: number;
    enable_logging: boolean;
  };
}

export interface SystemOverview {
  total_agents: number;
  workers: {
    total: number;
    active: number;
    idle: number;
  };
  coordinators: {
    total: number;
    active: number;
  };
  coding_agents: {
    total: number;
    active: number;
    names: string[];
  };
  business_agents: {
    total: number;
    active: number;
    names: string[];
  };
}

// ============================================================================
// Organization API
// ============================================================================

export const organizationApi = {
  list: () => api.get<{ organizations: Organization[] }>('/organizations'),

  get: (orgId: string) => api.get<{ organization: Organization }>(`/organizations/${orgId}`),

  create: (data: { name: string; slug: string; description?: string }) =>
    api.post<{ organization: Organization }>('/organizations', data),

  update: (orgId: string, data: { name?: string; description?: string; settings?: Record<string, unknown> }) =>
    api.patch<{ organization: Organization }>(`/organizations/${orgId}`, data),

  delete: (orgId: string) => api.delete(`/organizations/${orgId}`),

  // Members
  listMembers: (orgId: string) =>
    api.get<{ members: OrganizationMember[] }>(`/organizations/${orgId}/members`),

  addMember: (orgId: string, data: { user_id: string; role: string }) =>
    api.post<{ member: OrganizationMember }>(`/organizations/${orgId}/members`, data),

  updateMember: (orgId: string, userId: string, data: { role: string }) =>
    api.patch<{ member: OrganizationMember }>(`/organizations/${orgId}/members/${userId}`, data),

  removeMember: (orgId: string, userId: string) =>
    api.delete(`/organizations/${orgId}/members/${userId}`),

  // Teams
  listTeams: (orgId: string) =>
    api.get<{ teams: Team[] }>(`/organizations/${orgId}/teams`),

  createTeam: (orgId: string, data: { name: string; description?: string }) =>
    api.post<{ team: Team }>(`/organizations/${orgId}/teams`, data),
};

// ============================================================================
// Task API
// ============================================================================

export const taskApi = {
  list: (filters?: TaskFilters) =>
    api.get<{ tasks: Task[]; total: number; page: number; limit: number }>('/tasks', { params: filters }),

  get: (taskId: string) => api.get<{ task: Task }>(`/tasks/${taskId}`),

  create: (data: {
    name: string;
    description?: string;
    priority?: string;
    repository_id?: string;
    agent_type?: string;
    issue_number?: number;
    metadata?: Record<string, unknown>;
  }) => api.post<{ task: Task }>('/tasks', data),

  update: (taskId: string, data: {
    name?: string;
    description?: string;
    priority?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }) => api.patch<{ task: Task }>(`/tasks/${taskId}`, data),

  delete: (taskId: string) => api.delete(`/tasks/${taskId}`),

  // Task lifecycle
  start: (taskId: string) => api.post<{ task: Task }>(`/tasks/${taskId}/start`),
  complete: (taskId: string) => api.post<{ task: Task }>(`/tasks/${taskId}/complete`),
  fail: (taskId: string) => api.post<{ task: Task }>(`/tasks/${taskId}/fail`),
  cancel: (taskId: string) => api.post<{ task: Task }>(`/tasks/${taskId}/cancel`),
  retry: (taskId: string) => api.post<{ task: Task }>(`/tasks/${taskId}/retry`),

  // Statistics
  stats: () => api.get<TaskStats>('/tasks/stats'),
};

// ============================================================================
// Agent API (Extended)
// ============================================================================

export const agentApi = {
  list: () => api.get<{ agents: Agent[] }>('/agents'),

  get: (agentId: string) => api.get<Agent | null>(`/agents/${agentId}`),

  execute: (agentType: string, data: { issue_number?: number; task_id?: string }) =>
    api.post<{ success: boolean; message: string }>(`/agents/${agentType}/execute`, data),

  // Worker/Coordinator status (Phase 2.2)
  listWorkers: () =>
    api.get<{ workers: Agent[]; total_count: number; active_count: number; idle_count: number }>('/agents/workers'),

  listCoordinators: () =>
    api.get<{ coordinators: Agent[]; total_count: number; active_count: number }>('/agents/coordinators'),

  getSystemOverview: () => api.get<SystemOverview>('/agents/overview'),
};

// ============================================================================
// Auth API (Extended for org switching)
// ============================================================================

export const authApi = {
  switchOrganization: (orgId: string) =>
    api.post<{ access_token: string; organization_id: string; organization_role: string }>(
      '/auth/switch-organization',
      { organization_id: orgId }
    ),

  mockLogin: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; user: { id: string; email: string; username: string } }>(
      '/auth/mock',
      data
    ),
};
