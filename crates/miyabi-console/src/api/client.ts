import axios from 'axios';

// Get API base URL from environment with validation
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;

  // In development, fallback to localhost is acceptable
  if (import.meta.env.DEV) {
    return envUrl || 'http://localhost:8080/api/v1';
  }

  // In production/staging, require explicit configuration
  if (!envUrl) {
    console.error('[Miyabi Console] VITE_API_BASE_URL is not configured. API calls will fail.');
    // Return a placeholder that will clearly fail
    return '/api/v1';
  }

  return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('[Miyabi Console] API Base URL:', API_BASE_URL);
}

export interface AgentStatus {
  name: string;
  type: 'Coding' | 'Business';
  status: string;
  capabilities: string[];
  current_task: string | null;
  tmux_pane: string | null;
}

export interface AgentsListResponse {
  agents: AgentStatus[];
}

export interface Label {
  name: string;
  color: string;
}

export interface Issue {
  number: number;
  title: string;
  state: string;
  labels: Label[];
  assignees: string[];
  created_at: string;
  updated_at: string;
  body: string | null;
}

export interface IssuesListResponse {
  issues: Issue[];
  total: number;
}

export const agentsApi = {
  list: () => apiClient.get<AgentsListResponse>('/agents'),
  getStatus: (agentType: string) => apiClient.get<AgentStatus>(`/agents/${agentType}`),
  execute: (agentType: string, payload: { issue_number?: number; task_id?: string }) =>
    apiClient.post(`/agents/${agentType}/execute`, payload),
};

export const issuesApi = {
  list: () => apiClient.get<IssuesListResponse>('/issues'),
  get: (issueNumber: number) => apiClient.get<Issue>(`/issues/${issueNumber}`),
};

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  head_branch: string;
  base_branch: string;
  draft: boolean;
  mergeable: boolean;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface PRsListResponse {
  prs: PullRequest[];
  total: number;
}

export const prsApi = {
  list: () => apiClient.get<PRsListResponse>('/prs'),
  get: (prNumber: number) => apiClient.get<PullRequest>(`/prs/${prNumber}`),
};

export interface Worktree {
  id: string;
  path: string;
  branch: string;
  status: string;
  issue_number: number | null;
  agent_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorktreesListResponse {
  worktrees: Worktree[];
  total: number;
}

export const worktreesApi = {
  list: () => apiClient.get<WorktreesListResponse>('/worktrees'),
  get: (id: string) => apiClient.get<Worktree>(`/worktrees/${id}`),
};

export interface Deployment {
  id: string;
  version: string;
  environment: string;
  status: string;
  deployment_type: string;
  pr_number: number | null;
  commit_sha: string;
  deployed_by: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  health_check_status: string;
  rollback_available: boolean;
}

export interface DeploymentsListResponse {
  deployments: Deployment[];
  total: number;
}

export const deploymentsApi = {
  list: () => apiClient.get<DeploymentsListResponse>('/deployments'),
  get: (id: string) => apiClient.get<Deployment>(`/deployments/${id}`),
};

export interface LDDLog {
  id: string;
  timestamp: string;
  level: string;
  agent_type: string | null;
  message: string;
  context: string | null;
  issue_number: number | null;
  session_id: string;
  file: string | null;
  line: number | null;
}

export interface LogsListResponse {
  logs: LDDLog[];
  total: number;
}

export const logsApi = {
  list: () => apiClient.get<LogsListResponse>('/logs'),
};
