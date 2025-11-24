export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TaskType = 'agent' | 'action' | 'review' | 'deploy' | 'coordinator';

export interface TaskNode {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  agent?: string;
  issue_number?: number;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  error?: string;
  output?: string;
}

export interface TaskEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TaskDAG {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  nodes: TaskNode[];
  edges: TaskEdge[];
  issue_number?: number;
}

export interface TaskDAGListResponse {
  dags: TaskDAG[];
  total: number;
}
