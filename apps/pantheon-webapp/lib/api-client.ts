/**
 * Miyabi Web API Client
 * Issue: #978 Phase 3.1 - API Client Implementation
 *
 * Production-ready API client with:
 * - Authentication token management
 * - Request/response interceptors
 * - Retry logic with exponential backoff
 * - Comprehensive error handling
 * - TypeScript types for all responses
 */

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

// Token storage (browser-only)
let authToken: string | null = null;

/**
 * Set authentication token
 */
export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('miyabi_auth_token', token);
    } else {
      localStorage.removeItem('miyabi_auth_token');
    }
  }
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('miyabi_auth_token');
  }
  return authToken;
}

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Core fetch wrapper with retry logic
 */
async function fetchWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const body = await response.text();
        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(body);
        } catch {
          parsedBody = body;
        }

        const error = new ApiError(response.status, response.statusText, parsedBody);

        // Don't retry on client errors (except rate limiting)
        if (response.status < 500 && response.status !== 429) {
          throw error;
        }

        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-retryable errors
      if (error instanceof ApiError && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Retry with exponential backoff
      if (attempt < retries) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.warn(`API request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Unknown API error');
}

// =====================================================
// Type Definitions
// =====================================================

export interface User {
  id: string;
  github_id: number;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Repository {
  id: string;
  user_id: string;
  github_repo_id: number;
  owner: string;
  name: string;
  full_name: string;
  is_active: boolean;
  organization_id?: string;
  created_at: string;
  updated_at: string;
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

export interface Task {
  id: string;
  user_id: string;
  repository_id?: string;
  name: string;
  description?: string;
  priority: 'P0' | 'P1' | 'P2';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  agent_type?: string;
  issue_number?: number;
  retry_count: number;
  max_retries: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface DashboardSummary {
  total_executions: number;
  running: number;
  completed: number;
  failed: number;
  repositories: number;
  prs_created: number;
}

export interface RecentExecution {
  id: string;
  agent_type: string;
  status: string;
  repository_name: string;
  issue_number?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Workflow {
  id: string;
  repository_id: string;
  name: string;
  description?: string;
  dag_definition: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// =====================================================
// API Methods
// =====================================================

/**
 * Authentication API
 */
export const authApi = {
  /**
   * Initiate GitHub OAuth flow
   */
  initiateGitHubOAuth: (redirect?: string) => {
    const params = new URLSearchParams();
    if (redirect) params.set('redirect', redirect);
    window.location.href = `${API_BASE_URL}/auth/github?${params.toString()}`;
  },

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken: string) =>
    fetchWithRetry<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  /**
   * Logout
   */
  logout: () =>
    fetchWithRetry<void>('/auth/logout', {
      method: 'POST',
    }),

  /**
   * Switch organization context
   */
  switchOrganization: (organizationId?: string) =>
    fetchWithRetry<{ access_token: string; organization_id?: string; organization_role?: string }>(
      '/auth/switch-organization',
      {
        method: 'POST',
        body: JSON.stringify({ organization_id: organizationId }),
      }
    ),

  /**
   * Mock login (development only)
   */
  mockLogin: (githubId: number, email: string, name?: string) =>
    fetchWithRetry<TokenResponse>('/auth/mock', {
      method: 'POST',
      body: JSON.stringify({ github_id: githubId, email, name }),
    }),
};

/**
 * Dashboard API
 */
export const dashboardApi = {
  /**
   * Get dashboard summary
   */
  getSummary: () => fetchWithRetry<DashboardSummary>('/dashboard/summary'),

  /**
   * Get recent executions
   */
  getRecentExecutions: (limit = 20) =>
    fetchWithRetry<RecentExecution[]>(`/dashboard/recent?limit=${limit}`),
};

/**
 * Tasks API
 */
export const tasksApi = {
  /**
   * List tasks with optional filters
   */
  list: (params?: {
    status?: string;
    priority?: string;
    repository_id?: string;
    agent_type?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.repository_id) query.set('repository_id', params.repository_id);
    if (params?.agent_type) query.set('agent_type', params.agent_type);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return fetchWithRetry<{ tasks: Task[]; total: number; page: number; limit: number }>(
      `/tasks?${query.toString()}`
    );
  },

  /**
   * Get single task
   */
  get: (taskId: string) => fetchWithRetry<Task>(`/tasks/${taskId}`),

  /**
   * Create new task
   */
  create: (task: {
    name: string;
    description?: string;
    repository_id?: string;
    priority?: string;
    agent_type?: string;
    issue_number?: number;
    metadata?: Record<string, unknown>;
  }) =>
    fetchWithRetry<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  /**
   * Update task
   */
  update: (
    taskId: string,
    updates: {
      name?: string;
      description?: string;
      priority?: string;
      status?: string;
      metadata?: Record<string, unknown>;
    }
  ) =>
    fetchWithRetry<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  /**
   * Delete task
   */
  delete: (taskId: string) =>
    fetchWithRetry<void>(`/tasks/${taskId}`, {
      method: 'DELETE',
    }),

  /**
   * Cancel task
   */
  cancel: (taskId: string) =>
    fetchWithRetry<Task>(`/tasks/${taskId}/cancel`, {
      method: 'POST',
    }),
};

/**
 * Agents API
 */
export const agentsApi = {
  /**
   * List all agents
   */
  list: () => fetchWithRetry<{ agents: Agent[] }>('/agents'),

  /**
   * Execute agent
   */
  execute: (params: {
    repository_id: string;
    issue_number: number;
    agent_type: string;
    options?: {
      use_worktree?: boolean;
      auto_pr?: boolean;
      slack_notify?: boolean;
    };
  }) =>
    fetchWithRetry<{ execution_id: string }>('/agents/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

/**
 * Repositories API
 */
export const repositoriesApi = {
  /**
   * List repositories
   */
  list: () => fetchWithRetry<Repository[]>('/repositories'),

  /**
   * Get single repository
   */
  get: (repositoryId: string) => fetchWithRetry<Repository>(`/repositories/${repositoryId}`),

  /**
   * Connect repository
   */
  create: (fullName: string) =>
    fetchWithRetry<Repository>('/repositories', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName }),
    }),
};

/**
 * Workflows API
 */
export const workflowsApi = {
  /**
   * List workflows
   */
  list: () => fetchWithRetry<Workflow[]>('/workflows'),

  /**
   * Get single workflow
   */
  get: (workflowId: string) => fetchWithRetry<Workflow>(`/workflows/${workflowId}`),

  /**
   * Create workflow
   */
  create: (workflow: {
    repository_id: string;
    name: string;
    description?: string;
    dag_definition: Record<string, unknown>;
  }) =>
    fetchWithRetry<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    }),
};

/**
 * Organizations API
 */
export const organizationsApi = {
  /**
   * List user's organizations
   */
  list: () => fetchWithRetry<Organization[]>('/organizations'),

  /**
   * Get single organization
   */
  get: (orgId: string) => fetchWithRetry<Organization>(`/organizations/${orgId}`),

  /**
   * Create organization
   */
  create: (org: { name: string; slug: string; description?: string }) =>
    fetchWithRetry<Organization>('/organizations', {
      method: 'POST',
      body: JSON.stringify(org),
    }),
};

/**
 * Health API
 */
export const healthApi = {
  /**
   * Check API health
   */
  check: () => fetchWithRetry<{ status: string; timestamp: string }>('/health'),
};

// Export all APIs
export const api = {
  auth: authApi,
  dashboard: dashboardApi,
  tasks: tasksApi,
  agents: agentsApi,
  repositories: repositoriesApi,
  workflows: workflowsApi,
  organizations: organizationsApi,
  health: healthApi,
};

export default api;
