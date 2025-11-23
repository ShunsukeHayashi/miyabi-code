import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Global mock for API client (alias path)
vi.mock('@/lib/api/client', () => ({
  setTokenRefreshCallback: vi.fn(),
  handleApiError: vi.fn().mockImplementation((error: unknown) => ({
    message: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'UNKNOWN',
    status: 500,
  })),
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    getSystemMetrics: vi.fn().mockResolvedValue({
      cpu_usage: 25,
      memory_usage: 45,
      disk_usage: 60,
      active_agents: 5,
      total_tasks: 100,
      completed_tasks: 80,
      uptime_seconds: 3600,
    }),
    getAgents: vi.fn().mockResolvedValue([]),
    getAgent: vi.fn().mockResolvedValue(null),
    configureAgent: vi.fn().mockResolvedValue({}),
    startAgent: vi.fn().mockResolvedValue(undefined),
    stopAgent: vi.fn().mockResolvedValue(undefined),
    pauseAgent: vi.fn().mockResolvedValue(undefined),
    resumeAgent: vi.fn().mockResolvedValue(undefined),
    restartAgent: vi.fn().mockResolvedValue(undefined),
    getAgentMetrics: vi.fn().mockResolvedValue({}),
    getAgentLogs: vi.fn().mockResolvedValue([]),
    getDatabaseSchema: vi.fn().mockResolvedValue({ tables: [], total_records: 0, size_bytes: 0 }),
    executeQuery: vi.fn().mockResolvedValue([]),
    getDatabaseStatus: vi.fn().mockResolvedValue({ status: 'healthy', connections: 10, latency_ms: 5 }),
    getDeployments: vi.fn().mockResolvedValue([]),
    triggerDeployment: vi.fn().mockResolvedValue({}),
    getDeploymentStatus: vi.fn().mockResolvedValue({
      pipeline_name: 'test',
      current_stage: 'build',
      stages: [],
      last_deployment: null,
    }),
    getInfrastructureStatus: vi.fn().mockResolvedValue({
      docker_containers: [],
      services: [],
    }),
    getDatabaseStatusDetailed: vi.fn().mockResolvedValue({
      connected: true,
      database_name: 'test',
      tables: [],
      total_tables: 0,
      connection_pool: { active_connections: 0, idle_connections: 0, max_connections: 100 },
    }),
    getInfrastructureTopology: vi.fn().mockResolvedValue({
      vpc: { id: 'vpc-1', type: 'vpc', name: 'test-vpc', state: 'available' },
      publicSubnets: [],
      privateSubnets: [],
      natGateways: [],
      securityGroups: [],
      ecsServices: [],
      targetGroups: [],
      databases: [],
      caches: [],
      iamRoles: [],
    }),
    getActivityStats: vi.fn().mockResolvedValue({
      totalEvents: 0,
      todayEvents: 0,
      activeIssues: 0,
      uptime: 0,
    }),
    getActivityEvents: vi.fn().mockResolvedValue([]),
    getLogs: vi.fn().mockResolvedValue({
      logs: [
        {
          id: 'log-001',
          timestamp: '2025-01-20T16:05:23.456Z',
          level: 'INFO',
          agent_type: 'CoordinatorAgent',
          message: 'Agent initialization completed successfully',
          context: 'System startup',
          issue_number: 673,
          session_id: 'session-001',
          file: null,
          line: null,
        },
        {
          id: 'log-002',
          timestamp: '2025-01-20T16:05:24.123Z',
          level: 'DEBUG',
          agent_type: 'CodeGenAgent',
          message: 'Processing code generation request',
          context: null,
          issue_number: 156,
          session_id: 'session-001',
          file: null,
          line: null,
        },
        {
          id: 'log-003',
          timestamp: '2025-01-20T16:05:25.789Z',
          level: 'WARN',
          agent_type: 'ReviewAgent',
          message: 'Rate limit approaching for GitHub API',
          context: null,
          issue_number: null,
          session_id: 'session-002',
          file: null,
          line: null,
        },
        {
          id: 'log-004',
          timestamp: '2025-01-20T16:05:26.012Z',
          level: 'ERROR',
          agent_type: 'DeploymentAgent',
          message: 'Deployment failed: Connection timeout to production server',
          context: null,
          issue_number: null,
          session_id: 'session-003',
          file: 'deployment.rs',
          line: 234,
        },
      ],
      total: 4,
    }),
    getWorktrees: vi.fn().mockResolvedValue({
      worktrees: [
        {
          id: 'wt-001',
          path: '/worktrees/feature-auth',
          branch: 'feature/authentication',
          status: 'Active',
          issue_number: 123,
          agent_type: 'CodeGenAgent',
          created_at: '2025-01-15T10:30:00Z',
          updated_at: '2025-01-20T14:22:00Z',
        },
        {
          id: 'wt-002',
          path: '/worktrees/fix-api',
          branch: 'fix/api-timeout',
          status: 'Idle',
          issue_number: 456,
          agent_type: 'ReviewAgent',
          created_at: '2025-01-12T08:15:00Z',
          updated_at: '2025-01-18T16:45:00Z',
        },
        {
          id: 'wt-003',
          path: '/worktrees/refactor-core',
          branch: 'refactor/core-module',
          status: 'Completed',
          issue_number: 789,
          agent_type: 'PRAgent',
          created_at: '2025-01-10T14:20:00Z',
          updated_at: '2025-01-19T11:30:00Z',
        },
        {
          id: 'wt-004',
          path: '/worktrees/deploy-prod',
          branch: 'deploy/production-v2',
          status: 'Error',
          issue_number: null,
          agent_type: 'DeploymentAgent',
          created_at: '2025-01-08T09:00:00Z',
          updated_at: '2025-01-20T15:10:00Z',
        },
      ],
      total: 4,
    }),
    createWorktree: vi.fn().mockResolvedValue({
      id: 'wt-new',
      path: '/worktrees/new-feature',
      branch: 'feature/new-feature',
      status: 'Active',
      issue_number: null,
      agent_type: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    deleteWorktree: vi.fn().mockResolvedValue(undefined),
    getWorkflows: vi.fn().mockResolvedValue([]),
    executeWorkflow: vi.fn().mockResolvedValue({}),
    updateWorkflow: vi.fn().mockResolvedValue({}),
    healthCheck: vi.fn().mockResolvedValue(true),
    getApiUrl: vi.fn().mockReturnValue('http://localhost:8080'),
    isMockMode: vi.fn().mockReturnValue(true),
  },
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})
