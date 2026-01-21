/**
 * MiyabiCode Core Types
 * MIYABI AGENT SOCIETY - AI Coding Agent
 */

// ============================================
// LLM Provider Types
// ============================================

export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'local';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}

// ============================================
// Agent Types
// ============================================

export type AgentType =
  | 'conductor'  // しきるん
  | 'codegen'    // カエデ
  | 'review'     // サクラ
  | 'pr'         // ツバキ
  | 'deploy'     // ボタン
  | 'workflow';  // ながれるん

export interface Agent {
  id: AgentType;
  name: string;
  emoji: string;
  description: string;
  capabilities: string[];
}

export const AGENTS: Record<AgentType, Agent> = {
  conductor: {
    id: 'conductor',
    name: 'しきるん',
    emoji: '🎭',
    description: 'Conductor - Task distribution',
    capabilities: ['task-decomposition', 'agent-routing', 'progress-tracking'],
  },
  codegen: {
    id: 'codegen',
    name: 'カエデ',
    emoji: '🍁',
    description: 'CodeGen - Code generation',
    capabilities: ['code-generation', 'implementation', 'testing'],
  },
  review: {
    id: 'review',
    name: 'サクラ',
    emoji: '🌸',
    description: 'Review - Code review',
    capabilities: ['code-review', 'quality-check', 'security-audit'],
  },
  pr: {
    id: 'pr',
    name: 'ツバキ',
    emoji: '🌺',
    description: 'PR - Pull request management',
    capabilities: ['pr-creation', 'merge-management', 'conflict-resolution'],
  },
  deploy: {
    id: 'deploy',
    name: 'ボタン',
    emoji: '🌼',
    description: 'Deploy - Deployment',
    capabilities: ['deployment', 'rollback', 'health-check'],
  },
  workflow: {
    id: 'workflow',
    name: 'ながれるん',
    emoji: '🌊',
    description: 'Workflow automation',
    capabilities: ['n8n-workflows', 'automation', 'monitoring'],
  },
};

// ============================================
// tmux Types
// ============================================

export interface TmuxConfig {
  session: string;
  target: string;
  permanentPaneId?: string; // %N format
}

export interface TmuxMessage {
  target: string;
  message: string;
  type?: 'command' | 'keystrokes';
}

// ============================================
// MCP Types
// ============================================

export interface MCPConfig {
  enabled: string[];
  progressiveDisclosure?: boolean;
}

export interface MCPTool {
  category: string;
  name: string;
  description: string;
}

// ============================================
// GitHub Types
// ============================================

export interface GitHubConfig {
  owner: string;
  repo: string;
  token?: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  author?: string;
  assignees?: string[];
  createdAt?: Date | string;
}

export interface GitHubPR {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  head: string;
  base: string;
  sourceBranch?: string;
  targetBranch?: string;
  ciStatus?: 'pending' | 'success' | 'failure';
  reviewers?: string[];
}

export interface GitHubClientConfig {
  owner: string;
  repo: string;
  token?: string;
}

export interface GitHubClientInterface {
  getIssue(issueNumber: number): Promise<GitHubIssue>;
  listIssues(options?: { state?: string; labels?: string[]; limit?: number }): Promise<GitHubIssue[]>;
  createPR(params: { title: string; body: string; sourceBranch: string; targetBranch: string; draft?: boolean }): Promise<number>;
  listPRs(): Promise<GitHubPR[]>;
  getRepo(): Promise<{ owner: string; repo: string; defaultBranch: string }>;
  createIssue(title: string, body: string): Promise<number>;
  addComment(issueNumber: number, body: string): Promise<void>;
  getDefaultBranch(): Promise<string>;
  mergePR(prNumber: number, method?: 'merge' | 'squash' | 'rebase'): Promise<void>;
}

export interface GitHubMetrics {
  openIssues?: number;
  openPRs?: number;
  avgMergeTime?: number;
  apiCalls?: number;
  cacheHits?: number;
  errors?: number;
}

// ============================================
// Workflow Types (Issue-Driven Development)
// ============================================

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger?: 'manual' | 'issue' | 'schedule' | { type: string; config?: Record<string, unknown> };
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentId?: AgentType;
  type?: 'agent' | 'github' | 'delay' | 'workflow' | 'command' | 'approval';
  continueOnError?: boolean;
  config?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  steps: WorkflowStepExecution[];
}

export interface WorkflowStepExecution {
  id: string;
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface WorkflowConfig {
  branchNaming: 'conventional' | 'custom';
  commitFormat: 'conventional' | 'custom';
  prTemplate?: string;
}

export interface TaskContext {
  issue?: GitHubIssue;
  branch?: string;
  agent?: AgentType;
  files?: string[];
}

// ============================================
// Configuration Schema
// ============================================

export interface MiyabiCodeConfig {
  name: string;
  version?: string;
  llm: LLMConfig;
  mcp: MCPConfig;
  tmux?: TmuxConfig;
  github?: GitHubConfig;
  workflow?: WorkflowConfig;
}

// ============================================
// Error Types
// ============================================

export class MiyabiCodeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MiyabiCodeError';
  }
}

export enum ErrorCode {
  // LLM Errors
  LLM_PROVIDER_ERROR = 'LLM_PROVIDER_ERROR',
  LLM_API_ERROR = 'LLM_API_ERROR',
  LLM_RATE_LIMIT = 'LLM_RATE_LIMIT',

  // Agent Errors
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  AGENT_EXECUTION_ERROR = 'AGENT_EXECUTION_ERROR',

  // tmux Errors
  TMUX_CONNECTION_ERROR = 'TMUX_CONNECTION_ERROR',
  TMUX_SEND_ERROR = 'TMUX_SEND_ERROR',

  // MCP Errors
  MCP_CONNECTION_ERROR = 'MCP_CONNECTION_ERROR',
  MCP_TOOL_ERROR = 'MCP_TOOL_ERROR',

  // GitHub Errors
  GITHUB_API_ERROR = 'GITHUB_API_ERROR',
  GITHUB_AUTH_ERROR = 'GITHUB_AUTH_ERROR',

  // Config Errors
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_NOT_FOUND = 'CONFIG_NOT_FOUND',

  // Workflow Errors
  WORKFLOW_ERROR = 'WORKFLOW_ERROR',
}
