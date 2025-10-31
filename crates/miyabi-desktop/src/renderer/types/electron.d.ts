export interface ElectronAPI {
  app: {
    getVersion: () => Promise<string>;
    getName: () => Promise<string>;
    getPath: (name: 'home' | 'appData' | 'userData' | 'temp') => Promise<string>;
  };

  worktree: {
    getAll: () => Promise<WorktreeMetadata[]>;
    delete: (worktreePath: string) => Promise<{ success: boolean }>;
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

  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
}

export interface WorktreeMetadata {
  path: string;
  branch: string;
  status: 'active' | 'idle' | 'stuck' | 'orphaned' | 'corrupted';
  lastAccessed: number;
  diskUsage: number;
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

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
