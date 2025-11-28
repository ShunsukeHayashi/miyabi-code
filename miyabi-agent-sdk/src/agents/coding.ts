/**
 * Coding Agent Definitions
 * @module agents/coding
 */

import { z } from 'zod';
import type { AgentDefinition } from '../types.js';

// ============================================================================
// CoordinatorAgent
// ============================================================================

export const CoordinatorAgentInputSchema = z.object({
  task: z.string().describe('Task description to coordinate'),
  issueNumber: z.number().optional(),
  subTasks: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});

export const CoordinatorAgentOutputSchema = z.object({
  plan: z.array(z.object({
    id: z.string(),
    agentType: z.string(),
    description: z.string(),
    dependencies: z.array(z.string()),
    estimatedDuration: z.number().optional(),
  })),
  criticalPath: z.array(z.string()),
  totalEstimatedDuration: z.number().optional(),
});

export const CoordinatorAgent: AgentDefinition = {
  name: 'CoordinatorAgent',
  category: 'coding',
  description: 'Task decomposition and orchestration agent',
  capabilities: [
    'Analyze complex tasks and break them into subtasks',
    'Create DAG-based execution plans',
    'Identify critical paths',
    'Coordinate parallel agent execution',
  ],
  inputSchema: CoordinatorAgentInputSchema,
  outputSchema: CoordinatorAgentOutputSchema,
};

// ============================================================================
// CodeGenAgent
// ============================================================================

export const CodeGenAgentInputSchema = z.object({
  issueNumber: z.number(),
  language: z.string().default('rust'),
  description: z.string(),
  context: z.string().optional(),
  testRequired: z.boolean().default(true),
});

export const CodeGenAgentOutputSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    action: z.enum(['create', 'modify', 'delete']),
  })),
  tests: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })).optional(),
  summary: z.string(),
});

export const CodeGenAgent: AgentDefinition = {
  name: 'CodeGenAgent',
  category: 'coding',
  description: 'Code generation agent using Claude',
  capabilities: [
    'Generate code from specifications',
    'Write unit tests',
    'Refactor existing code',
    'Fix bugs based on issue descriptions',
  ],
  inputSchema: CodeGenAgentInputSchema,
  outputSchema: CodeGenAgentOutputSchema,
};

// ============================================================================
// ReviewAgent
// ============================================================================

export const ReviewAgentInputSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    diff: z.string().optional(),
  })),
  checkSecurity: z.boolean().default(true),
  checkPerformance: z.boolean().default(true),
  checkStyle: z.boolean().default(true),
});

export const ReviewAgentOutputSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(0).max(100),
  issues: z.array(z.object({
    severity: z.enum(['info', 'warning', 'error', 'critical']),
    file: z.string(),
    line: z.number().optional(),
    message: z.string(),
    suggestion: z.string().optional(),
  })),
  summary: z.string(),
});

export const ReviewAgent: AgentDefinition = {
  name: 'ReviewAgent',
  category: 'coding',
  description: 'Code review and quality assessment agent',
  capabilities: [
    'Static code analysis',
    'Security vulnerability scanning',
    'Performance issue detection',
    'Style and best practice checking',
  ],
  inputSchema: ReviewAgentInputSchema,
  outputSchema: ReviewAgentOutputSchema,
};

// ============================================================================
// IssueAgent
// ============================================================================

export const IssueAgentInputSchema = z.object({
  issueNumber: z.number().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  action: z.enum(['analyze', 'create', 'update', 'label']).default('analyze'),
  labels: z.array(z.string()).optional(),
});

export const IssueAgentOutputSchema = z.object({
  issueNumber: z.number(),
  analysis: z.object({
    type: z.string(),
    priority: z.string(),
    complexity: z.string(),
    suggestedLabels: z.array(z.string()),
    relatedIssues: z.array(z.number()),
  }).optional(),
  url: z.string().optional(),
});

export const IssueAgent: AgentDefinition = {
  name: 'IssueAgent',
  category: 'coding',
  description: 'GitHub Issue analysis and management agent',
  capabilities: [
    'Analyze issue content and infer labels',
    'Create new issues from templates',
    'Link related issues',
    'Prioritize issues based on content',
  ],
  inputSchema: IssueAgentInputSchema,
  outputSchema: IssueAgentOutputSchema,
};

// ============================================================================
// PRAgent
// ============================================================================

export const PRAgentInputSchema = z.object({
  issueNumber: z.number(),
  branchName: z.string(),
  title: z.string().optional(),
  body: z.string().optional(),
  files: z.array(z.string()).optional(),
  draft: z.boolean().default(false),
});

export const PRAgentOutputSchema = z.object({
  prNumber: z.number(),
  url: z.string(),
  title: z.string(),
  state: z.enum(['open', 'closed', 'merged']),
});

export const PRAgent: AgentDefinition = {
  name: 'PRAgent',
  category: 'coding',
  description: 'Pull Request creation and management agent',
  capabilities: [
    'Create PRs with proper formatting',
    'Link PRs to issues',
    'Generate PR descriptions from commits',
    'Handle PR lifecycle',
  ],
  inputSchema: PRAgentInputSchema,
  outputSchema: PRAgentOutputSchema,
};

// ============================================================================
// DeploymentAgent
// ============================================================================

export const DeploymentAgentInputSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  service: z.string(),
  version: z.string().optional(),
  rollback: z.boolean().default(false),
  healthCheck: z.boolean().default(true),
});

export const DeploymentAgentOutputSchema = z.object({
  success: z.boolean(),
  environment: z.string(),
  version: z.string(),
  url: z.string().optional(),
  healthStatus: z.enum(['healthy', 'unhealthy', 'unknown']),
  logs: z.array(z.string()).optional(),
});

export const DeploymentAgent: AgentDefinition = {
  name: 'DeploymentAgent',
  category: 'coding',
  description: 'CI/CD deployment automation agent',
  capabilities: [
    'Deploy to AWS (Lambda, EC2, S3)',
    'Health check verification',
    'Automatic rollback on failure',
    'Environment variable management',
  ],
  inputSchema: DeploymentAgentInputSchema,
  outputSchema: DeploymentAgentOutputSchema,
};

// ============================================================================
// RefresherAgent
// ============================================================================

export const RefresherAgentInputSchema = z.object({
  scope: z.enum(['issues', 'prs', 'all']).default('all'),
  staleThresholdDays: z.number().default(7),
  autoClose: z.boolean().default(false),
  notifyOwners: z.boolean().default(true),
});

export const RefresherAgentOutputSchema = z.object({
  staleItems: z.array(z.object({
    type: z.enum(['issue', 'pr']),
    number: z.number(),
    title: z.string(),
    lastActivity: z.string(),
    action: z.enum(['notified', 'closed', 'updated']),
  })),
  summary: z.string(),
});

export const RefresherAgent: AgentDefinition = {
  name: 'RefresherAgent',
  category: 'coding',
  description: 'Issue and PR staleness monitoring agent',
  capabilities: [
    'Detect stale issues and PRs',
    'Send reminders to owners',
    'Auto-close abandoned items',
    'Update project status',
  ],
  inputSchema: RefresherAgentInputSchema,
  outputSchema: RefresherAgentOutputSchema,
};

// ============================================================================
// Export All Coding Agents
// ============================================================================

export const CodingAgents = {
  CoordinatorAgent,
  CodeGenAgent,
  ReviewAgent,
  IssueAgent,
  PRAgent,
  DeploymentAgent,
  RefresherAgent,
} as const;
