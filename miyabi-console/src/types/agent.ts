export type AgentStatus = 'active' | 'idle' | 'error' | 'offline';

export interface AgentMetrics {
  cpuUsage: number;
  memoryUsage: number;
  taskCompletionRate: number;
  averageTaskDuration: number;
}

export interface AgentConfig {
  maxConcurrentTasks: number;
  timeoutSeconds: number;
  retryAttempts: number;
  enableLogging: boolean;
}

export interface Agent {
  id: string;
  name: string;
  layer: number;
  status: AgentStatus;
  uptime: number;
  tasks: {
    active: number;
    completed: number;
  };
  metrics: AgentMetrics;
  config: AgentConfig;
}

export interface AgentsPageState {
  agents: Agent[];
  selectedAgent: Agent | null;
  isLoading: boolean;
  filterLayer?: number;
  sortBy: 'name' | 'status' | 'uptime' | 'tasks';
}
