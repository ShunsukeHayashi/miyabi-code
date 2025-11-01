/**
 * Dashboard Snapshot Types
 *
 * Type definitions for the dashboard snapshot feature.
 * These types are shared between the frontend and the Tauri backend via IPC.
 */

/**
 * Worktree information
 */
export interface WorktreeInfo {
  /** Total number of worktrees */
  total: number;
  /** Number of active worktrees */
  active: number;
  /** Number of stale worktrees */
  stale: number;
  /** List of worktree names */
  names: string[];
}

/**
 * Agent execution statistics
 */
export interface AgentStats {
  /** Total number of agents */
  total: number;
  /** Number of running agents */
  running: number;
  /** Number of completed agents */
  completed: number;
  /** Number of failed agents */
  failed: number;
  /** Recent agent executions */
  recent: AgentExecution[];
}

/**
 * Agent execution record
 */
export interface AgentExecution {
  /** Agent name */
  name: string;
  /** Execution status */
  status: 'running' | 'completed' | 'failed';
  /** Start timestamp */
  startedAt: string;
  /** End timestamp (if completed/failed) */
  endedAt?: string;
  /** Associated issue number */
  issueNumber?: number;
}

/**
 * Issue/Task statistics
 */
export interface IssueStats {
  /** Total number of open issues */
  open: number;
  /** Number of in-progress issues */
  inProgress: number;
  /** Number of completed issues today */
  completedToday: number;
  /** Recent issues */
  recent: IssueInfo[];
}

/**
 * Issue information
 */
export interface IssueInfo {
  /** Issue number */
  number: number;
  /** Issue title */
  title: string;
  /** Issue state */
  state: 'open' | 'closed';
  /** Issue labels */
  labels: string[];
  /** Creation timestamp */
  createdAt: string;
  /** Update timestamp */
  updatedAt: string;
}

/**
 * History timeline information
 */
export interface HistoryInfo {
  /** Number of commits today */
  commitsToday: number;
  /** Number of PRs created today */
  prsToday: number;
  /** Number of issues closed today */
  issuesClosedToday: number;
  /** Recent activities */
  recentActivities: ActivityRecord[];
}

/**
 * Activity record
 */
export interface ActivityRecord {
  /** Activity type */
  type: 'commit' | 'pr' | 'issue' | 'agent';
  /** Activity description */
  description: string;
  /** Timestamp */
  timestamp: string;
  /** Related entity (e.g., PR number, issue number) */
  relatedId?: string;
}

/**
 * System resource information
 */
export interface SystemInfo {
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Memory usage in MB */
  memoryUsageMB: number;
  /** Total memory in MB */
  totalMemoryMB: number;
  /** Disk usage percentage (0-100) */
  diskUsage: number;
  /** System uptime in seconds */
  uptimeSeconds: number;
}

/**
 * Complete dashboard snapshot
 */
export interface DashboardSnapshot {
  /** Worktree information */
  worktrees: WorktreeInfo;
  /** Agent statistics */
  agents: AgentStats;
  /** Issue statistics */
  issues: IssueStats;
  /** History information */
  history: HistoryInfo;
  /** System information */
  system: SystemInfo;
  /** Snapshot timestamp */
  timestamp: string;
}

/**
 * Dashboard error
 */
export interface DashboardError {
  /** Error message */
  message: string;
  /** Error code (optional) */
  code?: string;
  /** Error details (optional) */
  details?: unknown;
}
