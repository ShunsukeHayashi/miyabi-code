/**
 * Dashboard Data Types
 */

export interface WorktreeInfo {
  total: number;
  active: number;
  stale: number;
  names: string[];
}

export interface AgentExecution {
  name: string;
  status: 'running' | 'completed' | 'failed';
  issueNumber?: number;
}

export interface AgentStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  recent: AgentExecution[];
}

export interface IssueStats {
  open: number;
  inProgress: number;
  completedToday: number;
}

export interface Activity {
  description: string;
  timestamp: string;
}

export interface HistoryInfo {
  commitsToday: number;
  prsToday: number;
  issuesClosedToday: number;
  recentActivities: Activity[];
}

export interface SystemInfo {
  cpuUsage: number;
  memoryUsageMB: number;
  totalMemoryMB: number;
  diskUsage: number;
  uptimeSeconds: number;
}

export interface DashboardSnapshot {
  timestamp: string;
  worktrees: WorktreeInfo;
  agents: AgentStats;
  issues: IssueStats;
  history: HistoryInfo;
  system: SystemInfo;
}
