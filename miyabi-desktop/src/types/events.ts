/**
 * Type definitions for Miyabi Tauri events
 *
 * These types match the Rust event structures from src-tauri/src/events.rs
 */

// ==================== Agent Events ====================

export type AgentEventType = 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';

export interface AgentEvent {
  agent_name: string;
  event_type: AgentEventType;
  issue_number?: number;
  message: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// ==================== Worktree Events ====================

export type WorktreeEventType = 'created' | 'updated' | 'deleted' | 'status_changed';

export interface WorktreeEvent {
  worktree_path: string;
  event_type: WorktreeEventType;
  branch: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// ==================== GitHub Events ====================

export interface GitHubEvent {
  number: number;
  event_type: string;
  title: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// ==================== System Events ====================

export type Severity = 'info' | 'warning' | 'error' | 'critical';

export interface SystemEvent {
  event_type: string;
  severity: Severity;
  message: string;
  timestamp: string;
  metadata: Record<string, any>;
}

// ==================== Helper Types ====================

/**
 * All possible event types
 */
export type MiyabiEvent = AgentEvent | WorktreeEvent | GitHubEvent | SystemEvent;

/**
 * Event channel names
 */
export type EventChannel = 'agent:event' | 'worktree:event' | 'github:event' | 'system:event';
