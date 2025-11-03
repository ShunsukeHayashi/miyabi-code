/**
 * Miyabi tmux Gradebook Type Definitions
 *
 * Comprehensive type system for evaluating tmux session and agent performance.
 * Based on design by カエデ (Kaede).
 */

// ============================================================================
// Core Grade Types
// ============================================================================

export type Grade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';

export interface SessionGrade {
  session_id: string;
  session_name: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  overall_score: number;  // 0-100
  grade: Grade;
  metrics: SessionMetrics;
  agents: AgentGrade[];
  generated_at: string;
  version: string;
}

export interface AgentGrade {
  agent_id: string;
  agent_name: string;
  agent_type: AgentType;
  pane_id: string;
  score: number;  // 0-100
  grade: Grade;
  metrics: AgentMetrics;
  tasks_assigned: TaskExecution[];
  tasks_completed: TaskExecution[];
  generated_at: string;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface SessionMetrics {
  completion: SessionCompletionMetrics;
  quality: SessionQualityMetrics;
  performance: SessionPerformanceMetrics;
  collaboration: CollaborationMetrics;
}

export interface SessionCompletionMetrics {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  completion_rate: number;  // 0-100
  issues_closed: number;
  prs_merged: number;
}

export interface SessionQualityMetrics {
  test_pass_rate: number;  // 0-100
  build_success_rate: number;  // 0-100
  pr_review_iterations: number;
  clippy_warnings: number;
  error_count: number;
}

export interface SessionPerformanceMetrics {
  tasks_per_hour: number;
  average_task_duration_seconds: number;
  idle_time_percentage: number;  // 0-100
  parallel_efficiency: number;  // 0-100, actual parallelism / theoretical max
}

export interface CollaborationMetrics {
  handoff_success_rate: number;  // 0-100
  merge_conflicts: number;
  conductor_interventions: number;
}

export interface AgentMetrics {
  completion: AgentCompletionMetrics;
  quality: AgentQualityMetrics;
  performance: AgentPerformanceMetrics;
  specialization: SpecializationMetrics;
}

export interface AgentCompletionMetrics {
  tasks_assigned: number;
  tasks_completed: number;
  tasks_failed: number;
  completion_rate: number;  // 0-100
  failure_rate: number;  // 0-100
}

export interface AgentQualityMetrics {
  test_pass_rate: number;  // 0-100
  build_success_rate: number;  // 0-100
  review_approval_rate: number;  // 0-100, PR approved without changes
  redo_rate: number;  // 0-100, tasks requiring re-implementation
}

export interface AgentPerformanceMetrics {
  average_task_duration_seconds: number;
  productivity_score: number;  // 0-100, composite of code changes & quality
  uptime_percentage: number;  // 0-100, active time / total time
}

export interface SpecializationMetrics {
  primary_skill: string;  // e.g., "Implementation", "Review", "Deploy"
  skill_match_rate: number;  // 0-100, tasks matching specialization
  task_type_distribution: Record<string, number>;  // task type -> count
}

// ============================================================================
// Task Execution Types
// ============================================================================

export interface TaskExecution {
  task_id: string;
  issue_number?: number;
  title: string;
  task_type: TaskType;
  status: TaskStatus;
  assigned_to: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  result?: TaskResult;
}

export type TaskType =
  | 'implementation'
  | 'review'
  | 'deployment'
  | 'pr_creation'
  | 'issue_analysis'
  | 'monitoring'
  | 'documentation'
  | 'testing'
  | 'bugfix'
  | 'refactoring';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'blocked'
  | 'cancelled';

export interface TaskResult {
  success: boolean;
  tests_passed?: number;
  tests_failed?: number;
  build_success?: boolean;
  pr_url?: string;
  commit_sha?: string;
  error_message?: string;
  quality_score?: number;  // 0-100
}

// ============================================================================
// Agent Types
// ============================================================================

export type AgentType =
  | 'CoordinatorAgent'
  | 'CodeGenAgent'
  | 'ReviewAgent'
  | 'DeploymentAgent'
  | 'PRAgent'
  | 'IssueAgent'
  | 'RefresherAgent'
  // Business Agents
  | 'AIEntrepreneurAgent'
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
  | 'AnalyticsAgent';

// ============================================================================
// Data Source Types
// ============================================================================

export interface SessionData {
  session_id: string;
  task: string;
  agent_type?: string;
  status: string;
  started_at: string;
  ended_at?: string;
  tool_results?: ToolResult[];
  metadata?: Record<string, any>;
}

export interface ToolResult {
  tool_name: string;
  timestamp: string;
  success: boolean;
  output?: string;
  error?: string;
}

export interface TmuxSessionInfo {
  session_name: string;
  session_created: number;  // Unix timestamp
  session_attached: number;
  panes: TmuxPaneInfo[];
}

export interface TmuxPaneInfo {
  pane_id: string;
  pane_title: string;
  pane_current_command: string;
  pane_pid: number;
  pane_active: boolean;
  pane_width: number;
  pane_height: number;
}

export interface CodexTaskStatus {
  task_id: string;
  issue_number?: number;
  status: string;
  agent_type?: string;
  started_at: string;
  completed_at?: string;
  result?: any;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface GradebookConfig {
  session_name: string;
  data_sources: DataSourceConfig;
  scoring: ScoringConfig;
  output: OutputConfig;
}

export interface DataSourceConfig {
  sessions_dir: string;  // e.g., ".ai/sessions"
  logs_dir: string;  // e.g., ".ai/logs"
  codex_tasks_dir: string;  // e.g., ".ai/codex-tasks"
  tmux_session_name?: string;  // optional, for live capture
}

export interface ScoringConfig {
  weights: ScoringWeights;
  thresholds: GradeThresholds;
}

export interface ScoringWeights {
  session: {
    completion: number;  // default: 0.30
    quality: number;  // default: 0.40
    performance: number;  // default: 0.20
    collaboration: number;  // default: 0.10
  };
  agent: {
    completion: number;  // default: 0.35
    quality: number;  // default: 0.35
    performance: number;  // default: 0.20
    specialization: number;  // default: 0.10
  };
}

export interface GradeThresholds {
  'A+': number;  // >= 95
  'A': number;   // >= 90
  'A-': number;  // >= 85
  'B+': number;  // >= 80
  'B': number;   // >= 75
  'B-': number;  // >= 70
  'C+': number;  // >= 65
  'C': number;   // >= 60
  'C-': number;  // >= 55
  'D': number;   // >= 50
  'F': number;   // < 50
}

export interface OutputConfig {
  format: 'json' | 'markdown' | 'both';
  output_dir: string;  // e.g., ".ai/gradebook"
  include_agent_details: boolean;
  include_task_history: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFIG: GradebookConfig = {
  session_name: 'Miyabi',
  data_sources: {
    sessions_dir: '.ai/sessions',
    logs_dir: '.ai/logs',
    codex_tasks_dir: '.ai/codex-tasks',
  },
  scoring: {
    weights: {
      session: {
        completion: 0.30,
        quality: 0.40,
        performance: 0.20,
        collaboration: 0.10,
      },
      agent: {
        completion: 0.35,
        quality: 0.35,
        performance: 0.20,
        specialization: 0.10,
      },
    },
    thresholds: {
      'A+': 95,
      'A': 90,
      'A-': 85,
      'B+': 80,
      'B': 75,
      'B-': 70,
      'C+': 65,
      'C': 60,
      'C-': 55,
      'D': 50,
      'F': 0,
    },
  },
  output: {
    format: 'both',
    output_dir: '.ai/gradebook',
    include_agent_details: true,
    include_task_history: true,
  },
};
