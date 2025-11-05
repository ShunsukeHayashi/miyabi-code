export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
    getPath: (name: 'home' | 'appData' | 'userData' | 'temp') => Promise<string>;
  };

  worktree: {
    list: () => Promise<WorktreeSummary[]>;
    cleanup: (worktreePath: string) => Promise<{ success: boolean; message?: string }>;
    open: (worktreePath: string) => Promise<{ success: boolean; message?: string }>;
    copyPath: (worktreePath: string) => Promise<{ success: boolean; message?: string }>;
    getGraph: () => Promise<WorktreeGraphData>;
  };

  agent: {
    startMonitoring: () => Promise<{ success: boolean; error?: string }>;
    stopMonitoring: () => Promise<{ success: boolean; error?: string }>;
    getRunning: () => Promise<{ success: boolean; agents?: AgentMetadata[]; error?: string }>;
    getAll: () => Promise<{ success: boolean; agents?: AgentMetadata[]; error?: string }>;
    get: (agentId: string) => Promise<{ success: boolean; agent?: AgentMetadata; error?: string }>;
    pause: (agentId: string) => Promise<{ success: boolean; error?: string }>;
    cancel: (agentId: string) => Promise<{ success: boolean; error?: string }>;
  };

  project: {
    open: (projectPath?: string) => Promise<ProjectValidation>;
    close: () => Promise<{ success: boolean }>;
    current: () => Promise<{ success: boolean; project: MiyabiProject | null }>;
    recent: () => Promise<{ success: boolean; projects: MiyabiProject[] }>;
    execute: (command: string, args?: string[]) => Promise<CommandResult>;
  };

  fileWatcher: {
    start: (projectPath: string, config?: WatcherConfig) => Promise<{ success: boolean; error?: string }>;
    stop: () => Promise<{ success: boolean; error?: string }>;
    status: () => Promise<{ success: boolean; isWatching: boolean; watchedPath: string | null; error?: string }>;
  };

  cli: {
    execute: (command: string, args?: string[], options?: CommandOptions) => Promise<{ success: boolean; result?: CommandResult; error?: string }>;
    kill: (commandId: string) => Promise<{ success: boolean }>;
    running: () => Promise<{ success: boolean; commands?: RunningCommand[] }>;
    check: () => Promise<{ success: boolean; available: boolean; version?: string; path?: string }>;
  };

  system: {
    getInfo: () => Promise<SystemInfo>;
  };

  dashboard: {
    getSnapshot: () => Promise<DashboardSnapshot>;
  };

  github: {
    initialize: (token: string, repository: string) => Promise<{ success: boolean; error?: string }>;
    syncIssues: () => Promise<{ success: boolean; synced: number; error?: string }>;
    getIssues: (filter?: IssueFilter) => Promise<{ success: boolean; issues?: GitHubIssue[]; error?: string }>;
    getIssue: (issueNumber: number) => Promise<{ success: boolean; issue?: GitHubIssue; error?: string }>;
    getLabels: () => Promise<{ success: boolean; labels?: string[]; error?: string }>;
    getMilestones: () => Promise<{ success: boolean; milestones?: string[]; error?: string }>;
  };

  history: {
    recordTask: (task: TaskExecution) => Promise<{ success: boolean; error?: string }>;
    getHistory: (options?: HistoryFilter) => Promise<{ success: boolean; history?: TaskExecution[]; error?: string }>;
    getStatistics: (days?: number) => Promise<{ success: boolean; stats?: TaskStatistics; error?: string }>;
    getHealthHistory: (hours?: number) => Promise<{ success: boolean; health?: SystemHealth[]; error?: string }>;
    getCurrentHealth: () => Promise<{ success: boolean; health?: SystemHealth | null; error?: string }>;
  };

  notification: {
    send: (options: NotificationOptions) => Promise<{ success: boolean; id?: string; error?: string }>;
    getAll: () => Promise<{ success: boolean; notifications?: StoredNotification[]; error?: string }>;
    getUnreadCount: () => Promise<{ success: boolean; count?: number; error?: string }>;
    markAsRead: (id: string) => Promise<{ success: boolean; error?: string }>;
    dismiss: (id: string) => Promise<{ success: boolean; error?: string }>;
    markAllAsRead: () => Promise<{ success: boolean; error?: string }>;
    clearAll: () => Promise<{ success: boolean; error?: string }>;
    getPreferences: () => Promise<{ success: boolean; preferences?: NotificationPreferences; error?: string }>;
    updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<{ success: boolean; error?: string }>;
  };

  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

export type WorktreeStatus = 'active' | 'idle' | 'stuck';

export interface WorktreeSummary {
  id: string;
  name: string;
  path: string;
  branch: string;
  head?: string;
  status: WorktreeStatus;
  lastAccessed: string;
  diskUsageMb: number;
  issueNumber?: number | null;
  agentName?: string | null;
  dirty: boolean;
}

export interface WorktreeGraphCommit {
  sha: string;
  parents: string[];
  message: string;
  date: number;
  branches: string[];
  isWorktreeHead: boolean;
  worktree?: WorktreeSummary;
}

export interface WorktreeGraphData {
  commits: WorktreeGraphCommit[];
  branches: string[];
  worktrees: WorktreeSummary[];
}

export type AgentStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface AgentMetadata {
  id: string;
  type: string;
  issueNumber: number | null;
  status: AgentStatus;
  progress: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
  logFile?: string;
  commandId?: string;
}

export interface LogEntry {
  agentId: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface Project {
  name: string;
  path: string;
  lastOpened: number;
}

export interface MiyabiProject {
  name: string;
  path: string;
  miyabiYml: string | null;
  gitRoot: string | null;
  lastOpened: number;
  recentFiles: string[];
}

export interface ProjectValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  project?: MiyabiProject;
  success: boolean;
  cancelled?: boolean;
}

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

export interface CommandOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
}

export interface RunningCommand {
  id: string;
  command: string;
  args: string[];
  duration: number;
}

export interface WatcherConfig {
  ignored?: string[];
  persistent?: boolean;
  ignoreInitial?: boolean;
  awaitWriteFinish?: boolean | {
    stabilityThreshold?: number;
    pollInterval?: number;
  };
}

export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: number;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
}

export interface DashboardSnapshot {
  worktrees: {
    total: number;
    active: number;
    idle: number;
    stuck: number;
    orphaned: number;
    lastUpdated: string;
  };
  agents: {
    total: number;
    active: number;
    inactive: number;
    uniqueAgents: number;
    recentlyExecuted: Array<{
      taskId: string;
      agentName: string;
      status: string;
      completedAt?: string;
      durationSec?: number | null;
    }>;
  };
  issues: {
    open: number;
    inProgress: number;
    done: number;
    topPriority: Array<{
      issueNumber: number;
      title: string;
      status: 'open' | 'in_progress' | 'done';
      lastUpdated: string;
      agentName?: string | null;
    }>;
  };
  history: {
    recentRuns: Array<{
      id: string;
      issueNumber?: number | null;
      agentName?: string | null;
      status: string;
      completedAt?: string;
      durationSec?: number | null;
    }>;
    successRate: number;
    avgDurationSec: number;
  };
  system: {
    platform: string;
    arch: string;
    cpuCores: number;
    totalMemoryGb: number;
    freeMemoryGb: number;
    uptimeHours: number;
  };
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  milestone: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  comments: number;
  pull_request?: {
    url: string;
  };
}

export interface IssueFilter {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  milestone?: string;
  search?: string;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskType = 'agent' | 'cli' | 'worktree' | 'sync';

export interface TaskExecution {
  id: string;
  taskType: TaskType;
  taskName: string;
  issueNumber?: number;
  agentType?: string;
  status: TaskStatus;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  processes: {
    total: number;
    miyabiProcesses: number;
  };
}

export interface TaskStatistics {
  total: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
  avgDuration: number;
  byType: Record<string, {
    count: number;
    successRate: number;
    avgDuration: number;
  }>;
}

export interface HistoryFilter {
  limit?: number;
  offset?: number;
  taskType?: TaskType;
  status?: TaskStatus;
  startDate?: number;
  endDate?: number;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationAction {
  type: string;
  text: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  silent?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
  timeout?: number;
  sound?: boolean;
  badge?: boolean;
}

export interface StoredNotification extends NotificationOptions {
  id: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  badge: boolean;
  nativeNotifications: boolean;
  types: {
    info: boolean;
    success: boolean;
    warning: boolean;
    error: boolean;
  };
  priorities: {
    low: boolean;
    normal: boolean;
    high: boolean;
    urgent: boolean;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
