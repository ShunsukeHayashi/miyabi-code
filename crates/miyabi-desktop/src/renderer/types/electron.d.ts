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
    getGraph: () => Promise<WorktreeGraphData>;
  };

  agent: {
    getRunning: () => Promise<AgentMetadata[]>;
    pause: (agentId: string) => Promise<{ success: boolean }>;
    cancel: (agentId: string) => Promise<{ success: boolean }>;
  };

  project: {
    open: (projectPath: string) => Promise<Project>;
    close: () => Promise<{ success: boolean }>;
  };

  system: {
    getInfo: () => Promise<SystemInfo>;
  };

  dashboard: {
    getSnapshot: () => Promise<DashboardSnapshot>;
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

export interface AgentMetadata {
  id: string;
  type: string;
  issueNumber: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: number;
}

export interface Project {
  name: string;
  path: string;
  lastOpened: number;
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

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
