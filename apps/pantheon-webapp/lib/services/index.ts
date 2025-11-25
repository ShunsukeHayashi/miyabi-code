/**
 * Services Index
 * Issue: #978 - Phase 3.1: API Client Implementation
 *
 * Re-exports all service modules for convenient importing.
 */

export { dashboardService } from './dashboard';
export type {
  DashboardSummary,
  RecentActivity,
  DashboardMetrics,
} from './dashboard';

export { tasksService } from './tasks';
export type {
  Task,
  TaskStatus,
  TaskType,
  CreateTaskRequest,
  TasksListResponse,
} from './tasks';

export { agentsService } from './agents';
export type {
  Agent,
  AgentStatus,
  AgentType,
  AgentExecution,
  AgentMetrics,
} from './agents';

export { authService } from './auth';
export type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  GitHubOAuthResponse,
  GitHubCallbackRequest,
} from './auth';
