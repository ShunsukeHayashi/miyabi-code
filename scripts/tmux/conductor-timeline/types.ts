/**
 * Conductor Timeline Types
 *
 * Type definitions for the Mission Control conductor timeline monitoring pipeline.
 */

/**
 * Agent execution state
 */
export type AgentState = 'RUN' | 'IDLE' | 'DEAD';

/**
 * Pane information from tmux
 */
export interface TmuxPane {
  id: string;
  window: string;
  title: string;
  pid: number;
  active: boolean;
  width: number;
  height: number;
  currentPath: string;
}

/**
 * Agent pane with state
 */
export interface AgentPane extends TmuxPane {
  agentName?: string;
  state: AgentState;
  lastActivity?: Date;
}

/**
 * Agent event from logs
 */
export interface AgentEvent {
  timestamp: Date;
  agentName: string;
  eventType: 'task_start' | 'task_complete' | 'task_failed' | 'idle' | 'error';
  issueNumber?: number;
  taskDescription?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Timeline aggregation result
 */
export interface TimelineAggregation {
  timestamp: Date;
  windowName: string;
  agentStates: {
    RUN: number;
    IDLE: number;
    DEAD: number;
  };
  recentEvents: AgentEvent[];
  activeAgents: string[];
}

/**
 * Timeline report output
 */
export interface TimelineReport {
  aggregation: TimelineAggregation;
  humanReadable: string;
  jsonLog: string;
}

/**
 * CLI options
 */
export interface ConductorTimelineOptions {
  window: string;
  outputPane?: string;
  logFile?: string;
  eventLookback?: number; // minutes
  refreshInterval?: number; // seconds
}

/**
 * Event loader configuration
 */
export interface EventLoaderConfig {
  logsPath: string;
  lookbackMinutes: number;
  patterns?: string[];
}

/**
 * Output writer configuration
 */
export interface WriterConfig {
  tmuxPane?: string;
  jsonLogPath?: string;
  appendMode: boolean;
}
