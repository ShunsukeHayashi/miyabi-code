/**
 * Miyabi A2A Dashboard Type Definitions
 *
 * This file contains TypeScript type definitions that mirror the Rust types
 * defined in crates/miyabi-a2a/src/http/routes.rs
 *
 * IMPORTANT: Keep these types in sync with Rust definitions
 */

/**
 * Agent Category
 * Maps to Rust: AgentCategory (routes.rs:19-24)
 */
export type AgentCategory = "coding" | "business";

/**
 * Agent Status
 * Maps to Rust: AgentStatus (routes.rs:26-33)
 */
export type AgentStatus = "active" | "working" | "idle" | "error";

/**
 * Agent Color (Role-based color coding)
 * Maps to Rust: AgentColor (routes.rs:35-42)
 */
export type AgentColor = "leader" | "executor" | "analyst" | "support";

/**
 * Agent Structure
 * Maps to Rust: Agent (routes.rs:7-17)
 *
 * @property id - Unique agent identifier (number, not string!)
 * @property name - Japanese display name (e.g., "しきるん")
 * @property role - English agent type (e.g., "Coordinator")
 * @property category - Agent category (coding or business)
 * @property status - Current agent status
 * @property tasks - Number of active tasks (not taskCount!)
 * @property color - Role-based color classification
 * @property description - Agent description in Japanese
 */
export interface Agent {
  id: number;
  name: string;
  role: string;
  category: AgentCategory;
  status: AgentStatus;
  tasks: number;
  color: AgentColor;
  description: string;
}

/**
 * System Status
 * Maps to Rust: SystemStatus (routes.rs:45-54)
 */
export interface SystemStatus {
  status: string;
  active_agents: number;
  total_agents: number;
  active_tasks: number;
  queued_tasks: number;
  task_throughput: number;
  avg_completion_time: number;
}

/**
 * System Status (Camel Case version for frontend convenience)
 * Use this for UI components if you prefer camelCase
 */
export interface SystemStatusCamel {
  status: string;
  activeAgents: number;
  totalAgents: number;
  activeTasks: number;
  queuedTasks: number;
  taskThroughput: number;
  avgCompletionTime: number;
}

/**
 * Timeline Event
 * Maps to Rust: TimelineEvent (routes.rs:56-72)
 */
export interface TimelineEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  task_id?: string;
  agent_id?: string;
  agent_name?: string;
  agent_type?: string;
}

/**
 * DAG Node (Workflow Task Node)
 * Maps to Rust: DagNode (routes.rs:127-135)
 */
export interface DagNode {
  id: string;
  label: string;
  status: "pending" | "working" | "completed" | "failed";
  agent: string;
  agentType: string;
}

/**
 * DAG Edge (Workflow Task Dependency)
 * Maps to Rust: DagEdge (routes.rs:138-144)
 */
export interface DagEdge {
  from: string;
  to: string;
  type: string;
}

/**
 * DAG Data (Complete Workflow Graph)
 * Maps to Rust: DagData (routes.rs:147-153)
 */
export interface DagData {
  workflowId: string;
  nodes: DagNode[];
  edges: DagEdge[];
}

/**
 * WebSocket Dashboard Update Message
 * Maps to Rust: DashboardUpdate (websocket.rs:19-26)
 */
export type DashboardUpdate =
  | { type: "agents"; agents: Agent[] }
  | { type: "systemstatus"; status: SystemStatus }
  | { type: "ping" };

/**
 * Metrics for dashboard charts
 */
export interface Metrics {
  tasksPerHour: number;
  avgCompletionTime: number;
  successRate?: number;
  errorRate?: number;
}

/**
 * Health status enum
 */
export type HealthStatus = "healthy" | "warning" | "critical" | "error";

/**
 * Extended System Status with health status
 */
export interface ExtendedSystemStatus extends SystemStatus {
  health: HealthStatus;
}

/**
 * Error and warning types (for UI)
 */
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
  retryCount?: number;
  nextRetryAt?: string;
}

/**
 * Type guard to check if value is Agent
 */
export function isAgent(value: any): value is Agent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.role === "string" &&
    typeof value.tasks === "number"
  );
}

/**
 * Type guard to check if value is SystemStatus
 */
export function isSystemStatus(value: any): value is SystemStatus {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.status === "string" &&
    typeof value.active_agents === "number" &&
    typeof value.total_agents === "number"
  );
}

/**
 * Convert snake_case SystemStatus to camelCase
 */
export function toCamelCaseStatus(status: SystemStatus): SystemStatusCamel {
  return {
    status: status.status,
    activeAgents: status.active_agents,
    totalAgents: status.total_agents,
    activeTasks: status.active_tasks,
    queuedTasks: status.queued_tasks,
    taskThroughput: status.task_throughput,
    avgCompletionTime: status.avg_completion_time,
  };
}
