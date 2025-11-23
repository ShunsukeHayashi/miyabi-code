/**
 * Services Index
 *
 * Central export point for all service modules.
 * Provides a clean API for components to consume backend services.
 *
 * Usage:
 * ```typescript
 * import { authService, tasksService } from '@/lib/services';
 *
 * const tasks = await tasksService.listTasks();
 * await authService.logout();
 * ```
 */

// Import service instances
import { authService, AuthService } from './auth';
import { tasksService, TasksService } from './tasks';
import { agentsService, AgentsService } from './agents';
import { repositoriesService, RepositoriesService } from './repositories';
import { dashboardService, DashboardService } from './dashboard';

// Re-export service instances and classes
export { authService, AuthService };
export type { User, TokenResponse, MockLoginRequest, RefreshTokenRequest } from './auth';

export { tasksService, TasksService };
export type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryFilters,
  TaskDependency,
} from './tasks';

export { agentsService, AgentsService };
export type { ExecuteAgentRequest, ExecuteAgentResponse } from './agents';

export { repositoriesService, RepositoriesService };
export type { Repository, CreateRepositoryRequest, GitHubIssue } from './repositories';

export { dashboardService, DashboardService };
export type {
  DashboardSummary,
  RecentExecution,
} from './dashboard';

// Legacy services (keep for backward compatibility)
export { generateDynamicUI, GeminiService, type GeminiUIResponse } from './geminiService';
export { swmlOptimizer, SWMLOptimizer } from './swmlOptimizer';

// Re-export commonly used types from API client
export type {
  SystemMetrics,
  DatabaseSchema,
  DeploymentInfo,
  InfrastructureStatus,
  ActivityEvent,
  ActivityStats,
  ApiError,
} from '../api/client';

/**
 * Service Registry
 *
 * For advanced use cases where you need to access services dynamically
 */
export const services = {
  auth: authService,
  tasks: tasksService,
  agents: agentsService,
  repositories: repositoriesService,
  dashboard: dashboardService,
} as const;

export type ServiceName = keyof typeof services;
