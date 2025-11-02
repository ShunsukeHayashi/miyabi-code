// Agent execution API wrapper for Tauri

import { safeInvoke, safeListen } from "./tauri-utils";

/**
 * Agent type definitions (mirrors Rust AgentType enum)
 */
export type AgentType =
  // Coding Agents
  | "coordinator_agent"
  | "code_gen_agent"
  | "review_agent"
  | "issue_agent"
  | "pr_agent"
  | "deployment_agent"
  | "refresher_agent"
  // Business Agents - Strategy & Planning
  | "ai_entrepreneur_agent"
  | "product_concept_agent"
  | "product_design_agent"
  | "funnel_design_agent"
  | "persona_agent"
  | "self_analysis_agent"
  // Business Agents - Marketing & Content
  | "market_research_agent"
  | "marketing_agent"
  | "content_creation_agent"
  | "sns_strategy_agent"
  | "youtube_agent"
  // Business Agents - Sales & Analytics
  | "sales_agent"
  | "crm_agent"
  | "analytics_agent";

/**
 * Agent execution status
 */
export type AgentExecutionStatus =
  | "starting"
  | "running"
  | "success"
  | "failed"
  | "stopped";

/**
 * Agent execution request
 */
export interface AgentExecutionRequest {
  agent_type: AgentType;
  issue_number?: number;
  args: string[];
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  execution_id: string;
  agent_type: AgentType;
  status: AgentExecutionStatus;
  exit_code?: number;
  duration_ms?: number;
  output: string[];
}

/**
 * Agent metadata for UI display
 */
export interface AgentMetadata {
  type: AgentType;
  displayName: string;
  characterName: string;
  category: "coding" | "business-strategy" | "business-marketing" | "business-sales";
  description: string;
  color: string;
}

/**
 * All available agents with metadata
 */
export const AVAILABLE_AGENTS: AgentMetadata[] = [
  // Coding Agents
  {
    type: "coordinator_agent",
    displayName: "CoordinatorAgent",
    characterName: "しきるん",
    category: "coding",
    description: "タスク統括・並行実行制御Agent",
    color: "#ef4444", // Red
  },
  {
    type: "code_gen_agent",
    displayName: "CodeGenAgent",
    characterName: "つくるん",
    category: "coding",
    description: "コード生成実行Agent",
    color: "#10b981", // Green
  },
  {
    type: "review_agent",
    displayName: "ReviewAgent",
    characterName: "めだまん",
    category: "coding",
    description: "コード品質判定Agent",
    color: "#3b82f6", // Blue
  },
  {
    type: "deployment_agent",
    displayName: "DeploymentAgent",
    characterName: "はこぶん",
    category: "coding",
    description: "デプロイ実行Agent",
    color: "#f59e0b", // Amber
  },
  {
    type: "pr_agent",
    displayName: "PRAgent",
    characterName: "まとめるん",
    category: "coding",
    description: "Pull Request作成Agent",
    color: "#8b5cf6", // Purple
  },
  {
    type: "issue_agent",
    displayName: "IssueAgent",
    characterName: "みつけるん",
    category: "coding",
    description: "Issue分析Agent",
    color: "#06b6d4", // Cyan
  },
  {
    type: "refresher_agent",
    displayName: "RefresherAgent",
    characterName: "つなぐん",
    category: "coding",
    description: "Issue状態監視Agent",
    color: "#6b7280", // Gray
  },

  // Business Agents - Strategy
  {
    type: "ai_entrepreneur_agent",
    displayName: "AI起業家Agent",
    characterName: "AI起業家",
    category: "business-strategy",
    description: "包括的なビジネスプラン作成",
    color: "#ec4899", // Pink
  },
  {
    type: "self_analysis_agent",
    displayName: "自己分析Agent",
    characterName: "自己分析",
    category: "business-strategy",
    description: "キャリア・スキル分析",
    color: "#a855f7", // Purple
  },
  {
    type: "product_concept_agent",
    displayName: "プロダクトコンセプトAgent",
    characterName: "コンセプト",
    category: "business-strategy",
    description: "USP・収益モデル設計",
    color: "#14b8a6", // Teal
  },

  // Business Agents - Marketing
  {
    type: "market_research_agent",
    displayName: "市場調査Agent",
    characterName: "市場調査",
    category: "business-marketing",
    description: "競合分析・市場トレンド",
    color: "#f97316", // Orange
  },
  {
    type: "marketing_agent",
    displayName: "マーケティングAgent",
    characterName: "マーケティング",
    category: "business-marketing",
    description: "広告・SEO・SNS集客",
    color: "#eab308", // Yellow
  },
  {
    type: "content_creation_agent",
    displayName: "コンテンツ制作Agent",
    characterName: "コンテンツ",
    category: "business-marketing",
    description: "動画・記事・教材制作",
    color: "#84cc16", // Lime
  },

  // Business Agents - Sales
  {
    type: "sales_agent",
    displayName: "セールスAgent",
    characterName: "セールス",
    category: "business-sales",
    description: "リード→顧客転換最大化",
    color: "#22c55e", // Green
  },
  {
    type: "crm_agent",
    displayName: "CRM管理Agent",
    characterName: "CRM",
    category: "business-sales",
    description: "顧客満足度・LTV最大化",
    color: "#06b6d4", // Cyan
  },
  {
    type: "analytics_agent",
    displayName: "データ分析Agent",
    characterName: "分析",
    category: "business-sales",
    description: "KPI追跡・PDCA実行",
    color: "#8b5cf6", // Violet
  },
];

/**
 * Execute an agent
 */
export async function executeAgent(
  request: AgentExecutionRequest
): Promise<AgentExecutionResult> {
  const result = await safeInvoke<AgentExecutionResult>("execute_agent_command", { request });
  if (!result) {
    throw new Error("Tauri runtime not available - cannot execute agent");
  }
  return result;
}

/**
 * Listen to agent execution status updates
 */
export async function listenToAgentStatus(
  callback: (result: AgentExecutionResult) => void
): Promise<() => void> {
  return await safeListen<AgentExecutionResult>(
    "agent-execution-status",
    callback
  );
}

/**
 * Listen to agent output (stdout/stderr)
 */
export async function listenToAgentOutput(
  executionId: string,
  callback: (line: string) => void
): Promise<() => void> {
  return await safeListen<string>(
    `agent-output-${executionId}`,
    callback
  );
}

/**
 * Get agent metadata by type
 */
export function getAgentMetadata(type: AgentType): AgentMetadata | undefined {
  return AVAILABLE_AGENTS.find((agent) => agent.type === type);
}

/**
 * Get agents by category
 */
export function getAgentsByCategory(
  category: AgentMetadata["category"]
): AgentMetadata[] {
  return AVAILABLE_AGENTS.filter((agent) => agent.category === category);
}
