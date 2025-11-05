/**
 * Conductor Timeline Type Definitions
 *
 * Type system for tmux monitoring, agent state detection, and timeline reporting.
 */

// ============================================================================
// Agent States
// ============================================================================

export type AgentState = 'RUN' | 'IDLE' | 'DEAD';

export interface AgentPaneInfo {
  pane_id: string;
  pane_title: string;
  agent_name: string | null;
  agent_type: string | null;
  state: AgentState;
  current_command: string;
  pid: number;
  last_activity?: Date;
}

// ============================================================================
// Timeline Events
// ============================================================================

export interface TimelineEvent {
  timestamp: Date;
  event_type: 'task_started' | 'task_completed' | 'task_failed' | 'agent_idle' | 'agent_dead';
  agent_id: string;
  agent_name?: string;
  issue_number?: number;
  task_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ConductorEvent {
  timestamp: Date;
  cycle: number;
  mode: string;
  conductor: string;
  assignments: Record<string, unknown>; // Flexible type for agent assignments
  completed_this_cycle: CompletedTask[];
}

export interface AgentAssignment {
  agent: string;
  current_status: string;
  issue?: number;
  issues?: number[];
  prs?: number[];
  action: string;
  new_assignment?: {
    issue: number;
    title: string;
    priority: string;
    estimated_duration: string;
    assigned_at: string;
    rationale: string;
  };
}

export interface CompletedTask {
  issue: number;
  agent: string;
  title: string;
}

// ============================================================================
// Timeline Report
// ============================================================================

export interface TimelineReport {
  generated_at: Date;
  session_name: string;
  agent_states: AgentStatesSummary;
  recent_events: TimelineEvent[];
  recent_completions: CompletedTask[];
  conductor_status?: ConductorStatus;
}

export interface AgentStatesSummary {
  total: number;
  run: number;
  idle: number;
  dead: number;
  agents: AgentPaneInfo[];
}

export interface ConductorStatus {
  conductor_name: string;
  last_cycle: number;
  last_activity: Date;
  mode: string;
}

// ============================================================================
// Configuration
// ============================================================================

export interface ConductorTimelineConfig {
  session_name: string;
  logs_dir: string;
  output_pane?: string;
  jsonl_output_path?: string;
  window_minutes?: number;
}

// ============================================================================
// Output Formats
// ============================================================================

export interface JSONLTimelineEntry {
  timestamp: string;
  session_name: string;
  agent_states: {
    run: number;
    idle: number;
    dead: number;
  };
  recent_events: Array<{
    timestamp: string;
    event_type: string;
    agent_id: string;
    description: string;
  }>;
}
