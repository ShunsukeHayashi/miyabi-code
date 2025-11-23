export type WorktreeStatus = 'Active' | 'Idle' | 'Completed' | 'Error';

export interface Worktree {
  id: string;
  path: string;
  branch: string;
  status: WorktreeStatus;
  issue_number?: number;
  agent_type?: string;
  created_at: string;
  updated_at: string;
}

export interface WorktreesListResponse {
  worktrees: Worktree[];
  total: number;
}

export interface CreateWorktreeRequest {
  branch: string;
  base_branch?: string;
  issue_number?: number;
}
