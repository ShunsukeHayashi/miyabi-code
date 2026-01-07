/**
 * Agent Types and Interfaces
 * Miyabi AI Agent Framework - Agent Management Types
 */

export type AgentRole =
  | 'code-reviewer'
  | 'issue-analyzer'
  | 'pr-assistant'
  | 'documentation'
  | 'testing'
  | 'security-auditor'
  | 'performance-optimizer'
  | 'dependency-updater'
  | 'custom';

export type AgentStatus = 'idle' | 'active' | 'paused' | 'error';

export type AgentTrigger =
  | 'issue_opened'
  | 'issue_labeled'
  | 'pr_opened'
  | 'pr_review_requested'
  | 'push'
  | 'schedule'
  | 'manual';

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  icon: string;
  defaultTriggers: AgentTrigger[];
  defaultPrompt: string;
  capabilities: string[];
  recommended: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  status: AgentStatus;
  installationId: number;
  repositories: string[];
  triggers: AgentTrigger[];
  customPrompt?: string;
  config: AgentConfig;
  stats: AgentStats;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

export interface AgentConfig {
  autoApprove: boolean;
  maxConcurrentTasks: number;
  responseTimeout: number;
  retryAttempts: number;
  labelFilters?: string[];
  branchFilters?: string[];
  filePatterns?: string[];
  excludePatterns?: string[];
}

export interface AgentStats {
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  avgResponseTime: number;
  successRate: number;
  lastTaskId?: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: 'issue_analysis' | 'code_review' | 'pr_comment' | 'documentation' | 'test_generation';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  triggerEvent: {
    type: AgentTrigger;
    repository: string;
    issueNumber?: number;
    prNumber?: number;
    ref?: string;
  };
  result?: {
    summary: string;
    actions: AgentAction[];
    metrics: {
      tokensUsed: number;
      processingTime: number;
    };
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AgentAction {
  type: 'comment' | 'label' | 'assign' | 'close' | 'approve' | 'request_changes' | 'create_pr';
  target: string;
  payload: Record<string, unknown>;
  executed: boolean;
  executedAt?: Date;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Automatically reviews pull requests for code quality, best practices, and potential bugs',
    role: 'code-reviewer',
    icon: 'code',
    defaultTriggers: ['pr_opened', 'pr_review_requested'],
    defaultPrompt: 'Review this code for quality, security issues, and best practices. Provide actionable feedback.',
    capabilities: ['Code analysis', 'Security scanning', 'Best practice checks', 'Inline comments'],
    recommended: true,
  },
  {
    id: 'issue-analyzer',
    name: 'Issue Analyzer',
    description: 'Analyzes new issues, categorizes them, and suggests solutions or relevant documentation',
    role: 'issue-analyzer',
    icon: 'search',
    defaultTriggers: ['issue_opened'],
    defaultPrompt: 'Analyze this issue, categorize it, and provide initial guidance or solutions.',
    capabilities: ['Issue categorization', 'Solution suggestions', 'Documentation linking', 'Priority assessment'],
    recommended: true,
  },
  {
    id: 'pr-assistant',
    name: 'PR Assistant',
    description: 'Helps with pull request management, including description generation and merge readiness checks',
    role: 'pr-assistant',
    icon: 'git-pull-request',
    defaultTriggers: ['pr_opened'],
    defaultPrompt: 'Analyze this PR, generate a comprehensive description, and check merge readiness.',
    capabilities: ['Description generation', 'Merge checks', 'Conflict detection', 'Changelog updates'],
    recommended: false,
  },
  {
    id: 'documentation',
    name: 'Documentation Bot',
    description: 'Automatically generates and updates documentation based on code changes',
    role: 'documentation',
    icon: 'file-text',
    defaultTriggers: ['push'],
    defaultPrompt: 'Analyze code changes and update relevant documentation.',
    capabilities: ['README updates', 'API docs', 'Code comments', 'Changelog entries'],
    recommended: false,
  },
  {
    id: 'testing',
    name: 'Test Generator',
    description: 'Generates test cases for new code and suggests improvements for existing tests',
    role: 'testing',
    icon: 'check-circle',
    defaultTriggers: ['pr_opened'],
    defaultPrompt: 'Analyze the code and generate comprehensive test cases.',
    capabilities: ['Unit tests', 'Integration tests', 'Edge case detection', 'Coverage analysis'],
    recommended: false,
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    description: 'Scans code for security vulnerabilities and suggests fixes',
    role: 'security-auditor',
    icon: 'shield',
    defaultTriggers: ['pr_opened', 'push'],
    defaultPrompt: 'Scan this code for security vulnerabilities and provide remediation steps.',
    capabilities: ['Vulnerability scanning', 'Dependency audit', 'Secret detection', 'Compliance checks'],
    recommended: true,
  },
];

export interface OnboardingState {
  step: 'welcome' | 'repositories' | 'first-agent' | 'integration-test' | 'complete';
  completedSteps: string[];
  selectedRepositories: string[];
  firstAgent?: Partial<Agent>;
  testResult?: {
    success: boolean;
    message: string;
    taskId?: string;
  };
}

export interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  tasksToday: number;
  tasksThisWeek: number;
  successRate: number;
  avgResponseTime: number;
  topAgent?: {
    id: string;
    name: string;
    tasksCompleted: number;
  };
}

export interface UsageMetrics {
  period: 'day' | 'week' | 'month';
  taskCount: number;
  tokenUsage: number;
  apiCalls: number;
  limit: number;
  remaining: number;
  resetAt: Date;
}
