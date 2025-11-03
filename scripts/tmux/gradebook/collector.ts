/**
 * Miyabi Gradebook Data Collector
 *
 * Collects and aggregates data from multiple sources:
 * - tmux session and pane information
 * - Claude Code session metadata (.ai/sessions)
 * - Codex task status (.ai/codex-tasks)
 * - Agent execution logs (.ai/logs)
 */

import type {
  GradebookConfig,
  TmuxSessionInfo,
  SessionData,
  CodexTaskStatus,
  TaskExecution,
  TaskType,
  TaskStatus,
  AgentType,
} from '../types/gradebook';
import { TmuxParser } from '../utils/tmux-parser';
import { JSONLoader, extractIssueNumber, calculateTotalDuration } from '../utils/json-loader';

// ============================================================================
// Collected Data Interfaces
// ============================================================================

export interface CollectedData {
  tmux: TmuxSessionInfo | null;
  sessions: SessionData[];
  codexTasks: CodexTaskStatus[];
  logs: Record<string, any>[];
  aggregated: AggregatedData;
}

export interface AggregatedData {
  session_id: string;
  session_name: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  agents: AgentData[];
}

export interface AgentData {
  agent_id: string;
  agent_name: string;
  agent_type: AgentType | string;
  pane_id?: string;
  tasks_assigned: TaskExecution[];
  tasks_completed: TaskExecution[];
}

// ============================================================================
// Data Collector Class
// ============================================================================

export class DataCollector {
  private config: GradebookConfig;
  private tmuxParser: TmuxParser;
  private jsonLoader: JSONLoader;

  constructor(config: GradebookConfig, tmuxParser?: TmuxParser, jsonLoader?: JSONLoader) {
    this.config = config;
    this.tmuxParser = tmuxParser || new TmuxParser();
    this.jsonLoader = jsonLoader || new JSONLoader();
  }

  /**
   * Collect all data sources for gradebook evaluation
   *
   * @returns Collected and aggregated data
   */
  async collect(): Promise<CollectedData> {
    console.log('📊 Collecting gradebook data...');

    // Collect tmux session info
    const tmux = this.collectTmuxData();

    // Collect JSON data
    const sessions = this.jsonLoader.loadSessions(this.config.data_sources.sessions_dir);
    const codexTasks = this.jsonLoader.loadCodexTasks(this.config.data_sources.codex_tasks_dir);
    const logs = this.jsonLoader.loadLogs(this.config.data_sources.logs_dir);

    console.log(`  ✅ tmux: ${tmux ? 'Available' : 'Not available'}`);
    console.log(`  ✅ sessions: ${sessions.length} files`);
    console.log(`  ✅ codex tasks: ${codexTasks.length} files`);
    console.log(`  ✅ logs: ${logs.length} files`);

    // Aggregate data
    const aggregated = this.aggregateData(tmux, sessions, codexTasks, logs);

    return {
      tmux,
      sessions,
      codexTasks,
      logs,
      aggregated,
    };
  }

  /**
   * Collect tmux session data (if available)
   *
   * @returns Tmux session info or null if not available
   */
  private collectTmuxData(): TmuxSessionInfo | null {
    const sessionName = this.config.data_sources.tmux_session_name || this.config.session_name;

    if (!this.tmuxParser.sessionExists(sessionName)) {
      console.warn(`  ⚠️  tmux session "${sessionName}" not found, skipping live data`);
      return null;
    }

    try {
      return this.tmuxParser.parseSession(sessionName);
    } catch (error: any) {
      console.warn(`  ⚠️  Failed to parse tmux session: ${error.message}`);
      return null;
    }
  }

  /**
   * Aggregate data from all sources into structured format
   *
   * @param tmux - Tmux session info
   * @param sessions - Claude Code sessions
   * @param codexTasks - Codex task status
   * @param logs - Agent logs
   * @returns Aggregated data for gradebook
   */
  private aggregateData(
    tmux: TmuxSessionInfo | null,
    sessions: SessionData[],
    codexTasks: CodexTaskStatus[],
    logs: Record<string, any>[]
  ): AggregatedData {
    // Determine session timeframe
    const allStartTimes = [
      ...sessions.map((s) => new Date(s.started_at).getTime()),
      ...codexTasks.map((t) => new Date(t.started_at).getTime()),
    ].filter((t) => !isNaN(t));

    const started_at = allStartTimes.length > 0
      ? new Date(Math.min(...allStartTimes)).toISOString()
      : new Date().toISOString();

    const allEndTimes = [
      ...sessions.filter((s) => s.ended_at).map((s) => new Date(s.ended_at!).getTime()),
      ...codexTasks.filter((t) => t.completed_at).map((t) => new Date(t.completed_at!).getTime()),
    ].filter((t) => !isNaN(t));

    const ended_at = allEndTimes.length > 0
      ? new Date(Math.max(...allEndTimes)).toISOString()
      : undefined;

    // Calculate duration
    const duration_seconds = calculateTotalDuration(sessions);

    // Build agent data
    const agents = this.buildAgentData(tmux, sessions, codexTasks, logs);

    // Calculate task counts
    const total_tasks = codexTasks.length + sessions.length;
    const completed_tasks = [
      ...codexTasks.filter((t) => t.status === 'completed'),
      ...sessions.filter((s) => s.status === 'completed'),
    ].length;
    const failed_tasks = [
      ...codexTasks.filter((t) => t.status === 'failed'),
      ...sessions.filter((s) => s.status === 'failed'),
    ].length;

    return {
      session_id: tmux?.session_name || this.config.session_name,
      session_name: this.config.session_name,
      started_at,
      ended_at,
      duration_seconds,
      total_tasks,
      completed_tasks,
      failed_tasks,
      agents,
    };
  }

  /**
   * Build per-agent data from all sources
   *
   * @param tmux - Tmux session info
   * @param sessions - Claude Code sessions
   * @param codexTasks - Codex task status
   * @param logs - Agent logs
   * @returns Array of agent data
   */
  private buildAgentData(
    tmux: TmuxSessionInfo | null,
    sessions: SessionData[],
    codexTasks: CodexTaskStatus[],
    logs: Record<string, any>[]
  ): AgentData[] {
    const agentMap = new Map<string, AgentData>();

    // Initialize agents from tmux panes
    if (tmux) {
      for (const pane of tmux.panes) {
        const agentName = this.tmuxParser.extractAgentName(pane.pane_title);
        const agentType = this.tmuxParser.extractAgentType(pane.pane_title);

        if (agentName) {
          const agentKey = this.tmuxParser.mapAgentNameToKey(agentName);
          agentMap.set(agentKey, {
            agent_id: agentKey,
            agent_name: agentName,
            agent_type: (agentType as AgentType) || 'unknown',
            pane_id: pane.pane_id,
            tasks_assigned: [],
            tasks_completed: [],
          });
        }
      }
    }

    // Add tasks from sessions
    for (const session of sessions) {
      const agentType = session.agent_type || 'unknown';
      const task = this.sessionToTaskExecution(session);

      if (!agentMap.has(agentType)) {
        agentMap.set(agentType, {
          agent_id: agentType,
          agent_name: agentType,
          agent_type: agentType as AgentType,
          tasks_assigned: [],
          tasks_completed: [],
        });
      }

      const agent = agentMap.get(agentType)!;
      agent.tasks_assigned.push(task);

      if (session.status === 'completed') {
        agent.tasks_completed.push(task);
      }
    }

    // Add tasks from codex tasks
    for (const codexTask of codexTasks) {
      const agentType = codexTask.agent_type || 'coordinator';
      const task = this.codexTaskToTaskExecution(codexTask);

      if (!agentMap.has(agentType)) {
        agentMap.set(agentType, {
          agent_id: agentType,
          agent_name: agentType,
          agent_type: agentType as AgentType,
          tasks_assigned: [],
          tasks_completed: [],
        });
      }

      const agent = agentMap.get(agentType)!;
      agent.tasks_assigned.push(task);

      if (codexTask.status === 'completed') {
        agent.tasks_completed.push(task);
      }
    }

    return Array.from(agentMap.values());
  }

  /**
   * Convert SessionData to TaskExecution
   *
   * @param session - Session data
   * @returns Task execution object
   */
  private sessionToTaskExecution(session: SessionData): TaskExecution {
    const issueNumber = extractIssueNumber(session.session_id) || extractIssueNumber(session.task);
    const duration_seconds = session.started_at && session.ended_at
      ? (new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000
      : undefined;

    return {
      task_id: session.session_id,
      issue_number: issueNumber,
      title: session.task,
      task_type: this.inferTaskType(session.task, session.agent_type),
      status: this.normalizeStatus(session.status),
      assigned_to: session.agent_type || 'unknown',
      started_at: session.started_at,
      completed_at: session.ended_at,
      duration_seconds,
    };
  }

  /**
   * Convert CodexTaskStatus to TaskExecution
   *
   * @param codexTask - Codex task status
   * @returns Task execution object
   */
  private codexTaskToTaskExecution(codexTask: CodexTaskStatus): TaskExecution {
    const duration_seconds = codexTask.started_at && codexTask.completed_at
      ? (new Date(codexTask.completed_at).getTime() - new Date(codexTask.started_at).getTime()) / 1000
      : undefined;

    return {
      task_id: codexTask.task_id,
      issue_number: codexTask.issue_number,
      title: codexTask.task_id,
      task_type: this.inferTaskType(codexTask.task_id, codexTask.agent_type),
      status: this.normalizeStatus(codexTask.status),
      assigned_to: codexTask.agent_type || 'unknown',
      started_at: codexTask.started_at,
      completed_at: codexTask.completed_at,
      duration_seconds,
      result: codexTask.result,
    };
  }

  /**
   * Infer task type from task title and agent type
   *
   * @param taskTitle - Task title
   * @param agentType - Agent type
   * @returns Inferred task type
   */
  private inferTaskType(taskTitle: string, agentType?: string): TaskType {
    const lowerTitle = taskTitle.toLowerCase();

    if (agentType?.includes('Review')) return 'review';
    if (agentType?.includes('Deploy')) return 'deployment';
    if (agentType?.includes('PR')) return 'pr_creation';
    if (agentType?.includes('Issue')) return 'issue_analysis';

    if (lowerTitle.includes('bug') || lowerTitle.includes('fix')) return 'bugfix';
    if (lowerTitle.includes('test')) return 'testing';
    if (lowerTitle.includes('doc')) return 'documentation';
    if (lowerTitle.includes('refactor')) return 'refactoring';

    return 'implementation';
  }

  /**
   * Normalize status string to TaskStatus
   *
   * @param status - Raw status string
   * @returns Normalized TaskStatus
   */
  private normalizeStatus(status: string): TaskStatus {
    const lower = status.toLowerCase();

    if (lower.includes('complete') || lower === 'done' || lower === 'success') return 'completed';
    if (lower.includes('fail') || lower === 'error') return 'failed';
    if (lower.includes('progress') || lower === 'running') return 'in_progress';
    if (lower.includes('block')) return 'blocked';
    if (lower.includes('cancel')) return 'cancelled';

    return 'pending';
  }
}
