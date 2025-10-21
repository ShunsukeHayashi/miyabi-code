// System status types
export interface SystemStatus {
  health: "healthy" | "warning" | "error";
  activeTasks: number;
  queuedTasks: number;
  lastUpdated: string;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  type: "coordinator" | "codegen" | "review" | "issue" | "pr" | "deploy" | "hooks";
  status: "active" | "idle" | "working" | "error";
  taskCount: number;
  currentTask: string | null;
}

// Metrics types
export interface Metrics {
  tasksPerHour: number;
  avgCompletionTime: number;
  activeAgents: number;
}

// Timeline event types
export interface TimelineEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  taskId?: string;
  agentId?: string;
  agentName?: string;
  agentType?: string;
}

// Error and warning types
export interface ErrorItem {
  id: string;
  type: "critical" | "warning";
  message: string;
  timestamp: string;
  agentId?: string;
  agentName?: string;
  agentType?: string;
  taskId?: string;
  workflowId: string;
}

// DAG types
export interface DagNode {
  id: string;
  label: string;
  status: "completed" | "working" | "waiting" | "failed";
  agent?: string;
}

export interface DagEdge {
  from: string;
  to: string;
  type: "depends_on";
}

export interface Dag {
  nodes: DagNode[];
  edges: DagEdge[];
}
