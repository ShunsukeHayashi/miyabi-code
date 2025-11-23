import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import type { Agent, AgentConfig, AgentMetrics } from '@/types/agent';
import type { InfrastructureTopology } from '@/types/infrastructure';
import type { Log, LogFilter, LogsListResponse } from '@/types/logs';
import type { Worktree, WorktreesListResponse, CreateWorktreeRequest } from '@/types/worktree';
import { mockAgents } from '../mockData';
import { mockInfrastructureTopology } from '../mockInfrastructureData';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.DEV;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Token refresh callback - set by AuthContext
let tokenRefreshCallback: (() => Promise<boolean>) | null = null;

export function setTokenRefreshCallback(callback: () => Promise<boolean>) {
  tokenRefreshCallback = callback;
}

// Types
export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_agents: number;
  total_tasks: number;
  completed_tasks: number;
  uptime_seconds: number;
}

export interface DatabaseSchema {
  tables: string[];
  total_records: number;
  size_bytes: number;
}

export interface DeploymentInfo {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  environment: string;
  created_at: string;
  completed_at?: string;
}

export interface InfrastructureStatus {
  services: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency_ms: number;
  }[];
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface DockerContainer {
  name: string;
  status: string;
  health: string;
  ports: string[];
}

export interface ServiceInfo {
  name: string;
  status: string;
  url: string | null;
  port: number | null;
}

export interface InfrastructureStatusDetailed {
  docker_containers: DockerContainer[];
  services: ServiceInfo[];
}

export interface TableInfo {
  name: string;
  owner: string;
  row_count: number | null;
}

export interface DatabaseStatusDetailed {
  connected: boolean;
  database_name: string;
  tables: TableInfo[];
  total_tables: number;
  connection_pool: {
    active_connections: number;
    idle_connections: number;
    max_connections: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  category: 'deployment' | 'agent' | 'system' | 'error';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface ActivityStats {
  totalEvents: number;
  todayEvents: number;
  activeIssues: number;
  uptime: number;
}

export interface DeploymentStage {
  name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface DeploymentStatusResponse {
  pipeline_name: string;
  current_stage: string;
  stages: DeploymentStage[];
  last_deployment: {
    version: string;
    deployed_at: string;
    deployed_by: string;
    status: string;
  } | null;
}

// Error handler utility
export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    return {
      message: axiosError.response?.data?.message ||
               axiosError.response?.data?.error ||
               axiosError.message ||
               'An unexpected error occurred',
      code: axiosError.code || 'UNKNOWN',
      status: axiosError.response?.status || 500,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'UNKNOWN',
    status: 500,
  };
}

// Sleep utility for retry delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiClient {
  private client: AxiosInstance;
  private retryCount: Map<string, number> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available (use access_token from AuthContext)
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Clear retry count on success
        const requestKey = `${response.config.method}-${response.config.url}`;
        this.retryCount.delete(requestKey);
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config;
        if (!config) return Promise.reject(error);

        const requestKey = `${config.method}-${config.url}`;
        const currentRetry = this.retryCount.get(requestKey) || 0;

        // Handle 401 Unauthorized - attempt token refresh first
        if (error.response?.status === 401 && config && !config.headers?.['X-Retry-After-Refresh']) {
          // Try to refresh the token
          if (tokenRefreshCallback) {
            const refreshSuccess = await tokenRefreshCallback();
            if (refreshSuccess) {
              // Retry the original request with new token
              const newToken = localStorage.getItem('access_token');
              if (newToken && config.headers) {
                config.headers.Authorization = `Bearer ${newToken}`;
                config.headers['X-Retry-After-Refresh'] = 'true';
              }
              return this.client.request(config);
            }
          }

          // Refresh failed - clear token and redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Retry on network errors or 5xx errors
        const shouldRetry =
          currentRetry < MAX_RETRIES &&
          (error.code === 'ECONNABORTED' ||
           error.code === 'ERR_NETWORK' ||
           (error.response?.status && error.response.status >= 500));

        if (shouldRetry) {
          this.retryCount.set(requestKey, currentRetry + 1);
          const delay = RETRY_DELAY * Math.pow(2, currentRetry); // Exponential backoff

          console.log(`[API] Retrying request (${currentRetry + 1}/${MAX_RETRIES}) after ${delay}ms`);
          await sleep(delay);

          return this.client.request(config);
        }

        // Clear retry count on final failure
        this.retryCount.delete(requestKey);
        return Promise.reject(error);
      }
    );
  }

  // System metrics endpoint
  async getSystemMetrics(): Promise<SystemMetrics> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      return {
        cpu_usage: Math.random() * 60 + 20,
        memory_usage: Math.random() * 40 + 30,
        disk_usage: Math.random() * 30 + 40,
        active_agents: Math.floor(Math.random() * 10) + 5,
        total_tasks: Math.floor(Math.random() * 1000) + 500,
        completed_tasks: Math.floor(Math.random() * 800) + 400,
        uptime_seconds: Math.floor(Math.random() * 86400) + 3600,
      };
    }
    const response = await this.client.get<SystemMetrics>('/system/metrics');
    return response.data;
  }

  // Agent endpoints
  async getAgents(): Promise<Agent[]> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      return mockAgents;
    }
    const response = await this.client.get<Agent[]>('/agents');
    return response.data;
  }

  async getAgent(id: string): Promise<Agent> {
    if (USE_MOCK_DATA) {
      await sleep(300);
      const agent = mockAgents.find((a) => a.id === id);
      if (!agent) throw new Error('Agent not found');
      return agent;
    }
    const response = await this.client.get<Agent>(`/agents/${id}`);
    return response.data;
  }

  async configureAgent(id: string, config: Partial<AgentConfig>): Promise<Agent> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      const agent = mockAgents.find((a) => a.id === id);
      if (!agent) throw new Error('Agent not found');
      return { ...agent, config: { ...agent.config, ...config } };
    }
    const response = await this.client.post<Agent>(`/agents/${id}/configure`, config);
    return response.data;
  }

  async startAgent(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await sleep(1000);
      console.log(`Mock: Starting agent ${id}`);
      return;
    }
    await this.client.post(`/agents/${id}/start`);
  }

  async stopAgent(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await sleep(1000);
      console.log(`Mock: Stopping agent ${id}`);
      return;
    }
    await this.client.post(`/agents/${id}/stop`);
  }

  async pauseAgent(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await sleep(800);
      console.log(`Mock: Pausing agent ${id}`);
      return;
    }
    await this.client.post(`/agents/${id}/pause`);
  }

  async resumeAgent(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await sleep(800);
      console.log(`Mock: Resuming agent ${id}`);
      return;
    }
    await this.client.post(`/agents/${id}/resume`);
  }

  async restartAgent(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await sleep(1500);
      console.log(`Mock: Restarting agent ${id}`);
      return;
    }
    await this.client.post(`/agents/${id}/restart`);
  }

  async getAgentMetrics(id: string): Promise<AgentMetrics> {
    if (USE_MOCK_DATA) {
      await sleep(300);
      const agent = mockAgents.find((a) => a.id === id);
      if (!agent) throw new Error('Agent not found');
      return agent.metrics;
    }
    const response = await this.client.get<AgentMetrics>(`/agents/${id}/metrics`);
    return response.data;
  }

  async getAgentLogs(id: string, limit = 100): Promise<string[]> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      const mockLogs = [
        `[${new Date().toISOString()}] Agent ${id} initialized`,
        `[${new Date().toISOString()}] Starting task processing`,
        `[${new Date().toISOString()}] Task #1234 completed successfully`,
        `[${new Date().toISOString()}] Task #1235 in progress`,
        `[${new Date().toISOString()}] Memory usage: 45.2%`,
        `[${new Date().toISOString()}] CPU usage: 32.1%`,
        `[${new Date().toISOString()}] Health check passed`,
      ];
      return mockLogs.slice(0, limit);
    }
    const response = await this.client.get<string[]>(`/agents/${id}/logs`, {
      params: { limit },
    });
    return response.data;
  }

  // Database endpoints
  async getDatabaseSchema(): Promise<DatabaseSchema> {
    if (USE_MOCK_DATA) {
      await sleep(400);
      return {
        tables: ['agents', 'tasks', 'users', 'logs', 'deployments'],
        total_records: 15420,
        size_bytes: 52428800, // 50MB
      };
    }
    const response = await this.client.get<DatabaseSchema>('/database/schema');
    return response.data;
  }

  async executeQuery(query: string): Promise<unknown[]> {
    if (USE_MOCK_DATA) {
      await sleep(600);
      return [
        { id: 1, name: 'Sample Result 1', created_at: new Date().toISOString() },
        { id: 2, name: 'Sample Result 2', created_at: new Date().toISOString() },
      ];
    }
    const response = await this.client.post<unknown[]>('/database/query', { query });
    return response.data;
  }

  async getDatabaseStatus(): Promise<{ status: string; connections: number; latency_ms: number }> {
    if (USE_MOCK_DATA) {
      await sleep(300);
      return {
        status: 'healthy',
        connections: Math.floor(Math.random() * 50) + 10,
        latency_ms: Math.floor(Math.random() * 20) + 5,
      };
    }
    const response = await this.client.get<{ status: string; connections: number; latency_ms: number }>('/database/status');
    return response.data;
  }

  // Deployment endpoints
  async getDeployments(): Promise<DeploymentInfo[]> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      return [
        {
          id: 'deploy-1',
          name: 'Production Deploy',
          status: 'success',
          environment: 'production',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date(Date.now() - 3000000).toISOString(),
        },
        {
          id: 'deploy-2',
          name: 'Staging Deploy',
          status: 'running',
          environment: 'staging',
          created_at: new Date().toISOString(),
        },
        {
          id: 'deploy-3',
          name: 'Dev Deploy',
          status: 'pending',
          environment: 'development',
          created_at: new Date().toISOString(),
        },
      ];
    }
    const response = await this.client.get<DeploymentInfo[]>('/deployments');
    return response.data;
  }

  async triggerDeployment(environment: string): Promise<DeploymentInfo> {
    if (USE_MOCK_DATA) {
      await sleep(800);
      return {
        id: `deploy-${Date.now()}`,
        name: `${environment} Deploy`,
        status: 'pending',
        environment,
        created_at: new Date().toISOString(),
      };
    }
    const response = await this.client.post<DeploymentInfo>('/deployments', { environment });
    return response.data;
  }

  async getDeploymentStatus(): Promise<DeploymentStatusResponse> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      return {
        pipeline_name: 'miyabi-production',
        current_stage: 'deploy',
        stages: [
          {
            name: 'build',
            status: 'completed',
            started_at: new Date(Date.now() - 600000).toISOString(),
            completed_at: new Date(Date.now() - 480000).toISOString(),
            duration_seconds: 120,
          },
          {
            name: 'test',
            status: 'completed',
            started_at: new Date(Date.now() - 480000).toISOString(),
            completed_at: new Date(Date.now() - 300000).toISOString(),
            duration_seconds: 180,
          },
          {
            name: 'deploy',
            status: 'running',
            started_at: new Date(Date.now() - 300000).toISOString(),
            completed_at: null,
            duration_seconds: null,
          },
          {
            name: 'verify',
            status: 'pending',
            started_at: null,
            completed_at: null,
            duration_seconds: null,
          },
        ],
        last_deployment: {
          version: '2.1.0',
          deployed_at: new Date(Date.now() - 86400000).toISOString(),
          deployed_by: 'system',
          status: 'success',
        },
      };
    }
    const response = await this.client.get<DeploymentStatusResponse>('/deployments/status');
    return response.data;
  }

  // Infrastructure endpoints
  async getInfrastructureStatus(): Promise<InfrastructureStatusDetailed> {
    if (USE_MOCK_DATA) {
      await sleep(400);
      return {
        docker_containers: [
          { name: 'miyabi-api', status: 'running', health: 'healthy', ports: ['8080:8080'] },
          { name: 'miyabi-db', status: 'running', health: 'healthy', ports: ['5432:5432'] },
          { name: 'miyabi-redis', status: 'running', health: 'healthy', ports: ['6379:6379'] },
          { name: 'miyabi-worker', status: 'running', health: 'healthy', ports: [] },
        ],
        services: [
          { name: 'API Server', status: 'running', url: 'http://localhost:8080', port: 8080 },
          { name: 'Database', status: 'running', url: null, port: 5432 },
          { name: 'Cache', status: 'running', url: null, port: 6379 },
          { name: 'Worker', status: 'running', url: null, port: null },
        ],
      };
    }
    const response = await this.client.get<InfrastructureStatusDetailed>('/infrastructure/status');
    return response.data;
  }

  async getDatabaseStatusDetailed(): Promise<DatabaseStatusDetailed> {
    if (USE_MOCK_DATA) {
      await sleep(400);
      return {
        connected: true,
        database_name: 'miyabi_production',
        tables: [
          { name: 'agents', owner: 'miyabi', row_count: 24 },
          { name: 'tasks', owner: 'miyabi', row_count: 1547 },
          { name: 'logs', owner: 'miyabi', row_count: 48293 },
          { name: 'deployments', owner: 'miyabi', row_count: 89 },
          { name: 'users', owner: 'miyabi', row_count: 12 },
        ],
        total_tables: 5,
        connection_pool: {
          active_connections: Math.floor(Math.random() * 20) + 5,
          idle_connections: Math.floor(Math.random() * 10) + 2,
          max_connections: 100,
        },
      };
    }
    const response = await this.client.get<DatabaseStatusDetailed>('/database/status/detailed');
    return response.data;
  }

  async getInfrastructureTopology(): Promise<InfrastructureTopology> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      return mockInfrastructureTopology;
    }
    const response = await this.client.get<InfrastructureTopology>('/infrastructure/topology');
    return response.data;
  }

  // Activity endpoints
  async getActivityStats(): Promise<ActivityStats> {
    if (USE_MOCK_DATA) {
      await sleep(400);
      return {
        totalEvents: 1247,
        todayEvents: 34,
        activeIssues: 2,
        uptime: 2592000, // 30 days in seconds
      };
    }
    const response = await this.client.get<ActivityStats>('/activity/stats');
    return response.data;
  }

  async getActivityEvents(limit = 50): Promise<ActivityEvent[]> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      const mockEvents: ActivityEvent[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          category: 'deployment',
          title: 'Deployment Completed',
          description: 'Infrastructure stack deployed successfully to production',
          severity: 'info',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          category: 'agent',
          title: 'Agent Started',
          description: 'CoordinatorAgent initialized on Layer 3',
          severity: 'info',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          category: 'system',
          title: 'System Health Check',
          description: 'All systems operational - CPU 23%, Memory 45%',
          severity: 'info',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          category: 'error',
          title: 'Database Connection Timeout',
          description: 'Connection pool exhausted - Auto-recovery initiated',
          severity: 'warning',
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          category: 'deployment',
          title: 'Deployment Started',
          description: 'Initiating deployment pipeline for version 2.1.0',
          severity: 'info',
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 21600000).toISOString(),
          category: 'agent',
          title: 'Task Completed',
          description: 'CodeGenAgent completed Issue #673 - PR created',
          severity: 'info',
        },
      ];
      return mockEvents.slice(0, limit);
    }
    const response = await this.client.get<ActivityEvent[]>('/activity/events', {
      params: { limit },
    });
    return response.data;
  }

  // Logs API
  async getLogs(filter?: LogFilter): Promise<LogsListResponse> {
    if (USE_MOCK_DATA) {
      await sleep(300);
      const mockLogs: Log[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'INFO',
          agent_type: 'CoordinatorAgent',
          message: 'Agent initialization completed successfully',
          session_id: 'sess-001',
          context: 'startup',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'DEBUG',
          agent_type: 'CodeGenAgent',
          message: 'Processing Issue #673 - analyzing requirements',
          session_id: 'sess-002',
          issue_number: 673,
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'WARN',
          agent_type: 'ReviewAgent',
          message: 'Rate limit approaching for GitHub API',
          session_id: 'sess-003',
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'ERROR',
          agent_type: 'DeploymentAgent',
          message: 'Deployment failed: Connection timeout to production server',
          session_id: 'sess-004',
          file: 'deployment.rs',
          line: 234,
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          level: 'INFO',
          agent_type: 'PRAgent',
          message: 'Pull request #156 created successfully',
          session_id: 'sess-005',
          issue_number: 156,
        },
      ];

      // Apply filters
      let filteredLogs = mockLogs;
      if (filter?.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      if (filter?.agent_type) {
        filteredLogs = filteredLogs.filter(log => log.agent_type === filter.agent_type);
      }
      if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.message.toLowerCase().includes(searchLower)
        );
      }

      return { logs: filteredLogs, total: filteredLogs.length };
    }
    const response = await this.client.get<LogsListResponse>('/logs', {
      params: filter,
    });
    return response.data;
  }

  // Worktrees API
  async getWorktrees(): Promise<WorktreesListResponse> {
    if (USE_MOCK_DATA) {
      await sleep(300);
      const mockWorktrees: Worktree[] = [
        {
          id: 'wt-001',
          path: '/worktrees/feature-auth',
          branch: 'feature/authentication',
          status: 'Active',
          issue_number: 123,
          agent_type: 'CodeGenAgent',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: 'wt-002',
          path: '/worktrees/fix-api',
          branch: 'fix/api-timeout',
          status: 'Idle',
          issue_number: 456,
          agent_type: 'ReviewAgent',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'wt-003',
          path: '/worktrees/refactor-core',
          branch: 'refactor/core-module',
          status: 'Completed',
          issue_number: 789,
          agent_type: 'PRAgent',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 43200000).toISOString(),
        },
        {
          id: 'wt-004',
          path: '/worktrees/deploy-prod',
          branch: 'deploy/production-v2',
          status: 'Error',
          agent_type: 'DeploymentAgent',
          created_at: new Date(Date.now() - 14400000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
      return { worktrees: mockWorktrees, total: mockWorktrees.length };
    }
    const response = await this.client.get<WorktreesListResponse>('/worktrees');
    return response.data;
  }

  async createWorktree(request: CreateWorktreeRequest): Promise<Worktree> {
    if (USE_MOCK_DATA) {
      await sleep(500);
      return {
        id: `wt-${Date.now()}`,
        path: `/worktrees/${request.branch.replace('/', '-')}`,
        branch: request.branch,
        status: 'Active',
        issue_number: request.issue_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    const response = await this.client.post<Worktree>('/worktrees', request);
    return response.data;
  }

  async deleteWorktree(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await sleep(300);
      return;
    }
    await this.client.delete(`/worktrees/${id}`);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      if (USE_MOCK_DATA) {
        await sleep(200);
        return true;
      }
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // Settings
  getApiUrl(): string {
    return API_BASE_URL;
  }

  isMockMode(): boolean {
    return USE_MOCK_DATA;
  }
}

export const apiClient = new ApiClient();
