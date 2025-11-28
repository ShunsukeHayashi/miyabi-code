/**
 * Miyabi Agent SDK Types
 * @module types
 */

import { z } from 'zod';

// ============================================================================
// Agent Types
// ============================================================================

export type AgentCategory = 'coding' | 'business';

export type CodingAgentType =
  | 'CoordinatorAgent'
  | 'CodeGenAgent'
  | 'ReviewAgent'
  | 'IssueAgent'
  | 'PRAgent'
  | 'DeploymentAgent'
  | 'RefresherAgent';

export type BusinessAgentType =
  | 'AIEntrepreneurAgent'
  | 'SelfAnalysisAgent'
  | 'MarketResearchAgent'
  | 'PersonaAgent'
  | 'ProductConceptAgent'
  | 'ProductDesignAgent'
  | 'ContentCreationAgent'
  | 'FunnelDesignAgent'
  | 'SNSStrategyAgent'
  | 'MarketingAgent'
  | 'SalesAgent'
  | 'CRMAgent'
  | 'AnalyticsAgent'
  | 'YouTubeAgent'
  | 'JonathanIveDesignAgent'
  | 'NoteAgent'
  | 'ImageGenAgent'
  | 'HonokaAgent';

export type AgentType = CodingAgentType | BusinessAgentType;

// ============================================================================
// Agent Definition
// ============================================================================

export interface AgentDefinition {
  name: AgentType;
  category: AgentCategory;
  description: string;
  capabilities: string[];
  inputSchema: z.ZodType<unknown>;
  outputSchema: z.ZodType<unknown>;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface AgentExecutionRequest {
  agentType: AgentType;
  input: Record<string, unknown>;
  context?: ExecutionContext;
  options?: ExecutionOptions;
}

export interface ExecutionContext {
  organizationId?: string;
  userId?: string;
  issueNumber?: number;
  repositoryUrl?: string;
  workingDirectory?: string;
}

export interface ExecutionOptions {
  timeout?: number;
  maxRetries?: number;
  parallel?: boolean;
}

export interface AgentExecutionResult<T = unknown> {
  success: boolean;
  agentType: AgentType;
  output?: T;
  error?: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Orchestration Types
// ============================================================================

export interface DAGNode {
  id: string;
  agentType: AgentType;
  input: Record<string, unknown>;
  dependencies: string[];
}

export interface DAG {
  nodes: DAGNode[];
}

export interface OrchestrationResult {
  success: boolean;
  results: Map<string, AgentExecutionResult>;
  totalDurationMs: number;
  criticalPath: string[];
}

// ============================================================================
// Hook Types
// ============================================================================

export type HookStage = 'pre' | 'post';

export interface HookContext {
  stage: HookStage;
  agentType: AgentType;
  input: Record<string, unknown>;
  result?: AgentExecutionResult;
}

export type HookFunction = (context: HookContext) => Promise<void> | void;

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const ExecutionContextSchema = z.object({
  organizationId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  issueNumber: z.number().int().positive().optional(),
  repositoryUrl: z.string().url().optional(),
  workingDirectory: z.string().optional(),
});

export const ExecutionOptionsSchema = z.object({
  timeout: z.number().int().positive().default(300000),
  maxRetries: z.number().int().min(0).max(5).default(3),
  parallel: z.boolean().default(false),
});
