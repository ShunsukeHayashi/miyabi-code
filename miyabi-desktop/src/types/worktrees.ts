export interface WorktreeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
}

export interface GraphMetadata {
  generated_at: string;
  repo_root: string;
  branch_count: number;
  worktree_count: number;
}

export type GraphNode = BranchGraphNode | WorktreeGraphNode;

export interface BranchGraphNode {
  kind: 'branch';
  id: string;
  label: string;
  branch: BranchNode;
}

export interface WorktreeGraphNode {
  kind: 'worktree';
  id: string;
  label: string;
  worktree: WorktreeNode;
}

export interface BranchNode {
  name: string;
  head?: string;
  upstream?: string;
  latest_commit_time?: string;
}

export interface WorktreeNode {
  path: string;
  branch: string;
  head?: string;
  base_commit?: string;
  status: WorktreeStatus;
  locked_reason?: string;
  issue_number?: number;
  agent?: AgentInfo;
  last_commit_time?: string;
}

export type WorktreeStatus = 'active' | 'locked' | 'stale';

export interface AgentInfo {
  agent_type?: string;
  agent_name?: string;
  execution_mode?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: 'branch_hierarchy' | 'branch_worktree';
}
