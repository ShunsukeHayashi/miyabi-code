/**
 * Miyabi Gradebook Score Calculator
 *
 * Calculates metrics and scores for tmux sessions and individual agents.
 * Implements weighted scoring system based on カエデ's design.
 */

import type {
  SessionGrade,
  AgentGrade,
  SessionMetrics,
  AgentMetrics,
  Grade,
  GradebookConfig,
  TaskExecution,
  TaskResult,
} from '../types/gradebook';
import type { CollectedData, AggregatedData, AgentData } from './collector';

// ============================================================================
// Calculator Class
// ============================================================================

export class GradebookCalculator {
  private config: GradebookConfig;

  constructor(config: GradebookConfig) {
    this.config = config;
  }

  /**
   * Calculate complete gradebook from collected data
   *
   * @param data - Collected data from all sources
   * @returns Complete session grade with all agents
   */
  calculateGradebook(data: CollectedData): SessionGrade {
    const { aggregated } = data;

    // Calculate agent grades first
    const agents = aggregated.agents.map((agentData) =>
      this.calculateAgentGrade(agentData, data)
    );

    // Calculate session metrics
    const metrics = this.calculateSessionMetrics(aggregated, agents);

    // Calculate overall session score
    const overall_score = this.calculateSessionScore(metrics);
    const grade = this.scoreToGrade(overall_score);

    return {
      session_id: aggregated.session_id,
      session_name: aggregated.session_name,
      started_at: aggregated.started_at,
      ended_at: aggregated.ended_at,
      duration_seconds: aggregated.duration_seconds,
      overall_score,
      grade,
      metrics,
      agents,
      generated_at: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  // ==========================================================================
  // Session Score Calculation
  // ==========================================================================

  /**
   * Calculate session-level metrics
   */
  private calculateSessionMetrics(aggregated: AggregatedData, agents: AgentGrade[]): SessionMetrics {
    const completion = this.calculateSessionCompletion(aggregated);
    const quality = this.calculateSessionQuality(aggregated, agents);
    const performance = this.calculateSessionPerformance(aggregated, agents);
    const collaboration = this.calculateSessionCollaboration(aggregated, agents);

    return { completion, quality, performance, collaboration };
  }

  /**
   * Calculate session completion metrics
   */
  private calculateSessionCompletion(aggregated: AggregatedData) {
    const { total_tasks, completed_tasks, failed_tasks } = aggregated;
    const completion_rate = total_tasks > 0 ? (completed_tasks / total_tasks) * 100 : 0;

    // Count issues closed and PRs merged (from task results)
    let issues_closed = 0;
    let prs_merged = 0;

    for (const agent of aggregated.agents) {
      for (const task of agent.tasks_completed) {
        if (task.result?.pr_url) prs_merged++;
        if (task.issue_number) issues_closed++;
      }
    }

    return {
      total_tasks,
      completed_tasks,
      failed_tasks,
      completion_rate,
      issues_closed,
      prs_merged,
    };
  }

  /**
   * Calculate session quality metrics
   */
  private calculateSessionQuality(aggregated: AggregatedData, agents: AgentGrade[]) {
    let total_tests = 0;
    let passed_tests = 0;
    let total_builds = 0;
    let successful_builds = 0;
    let total_review_iterations = 0;
    let total_errors = 0;
    let clippy_warnings = 0;

    for (const agent of aggregated.agents) {
      for (const task of agent.tasks_completed) {
        const result = task.result;
        if (!result) continue;

        if (result.tests_passed !== undefined && result.tests_failed !== undefined) {
          total_tests += result.tests_passed + result.tests_failed;
          passed_tests += result.tests_passed;
        }

        if (result.build_success !== undefined) {
          total_builds++;
          if (result.build_success) successful_builds++;
        }

        if (result.error_message) {
          total_errors++;
        }
      }
    }

    const test_pass_rate = total_tests > 0 ? (passed_tests / total_tests) * 100 : 100;
    const build_success_rate = total_builds > 0 ? (successful_builds / total_builds) * 100 : 100;

    // Estimate PR review iterations (average ~1.5 for healthy projects)
    const pr_review_iterations = aggregated.agents.length > 0
      ? aggregated.completed_tasks / aggregated.agents.length
      : 1.5;

    return {
      test_pass_rate,
      build_success_rate,
      pr_review_iterations,
      clippy_warnings,
      error_count: total_errors,
    };
  }

  /**
   * Calculate session performance metrics
   */
  private calculateSessionPerformance(aggregated: AggregatedData, agents: AgentGrade[]) {
    const { duration_seconds, completed_tasks, total_tasks } = aggregated;

    const tasks_per_hour = duration_seconds && duration_seconds > 0
      ? (completed_tasks / (duration_seconds / 3600))
      : 0;

    const average_task_duration_seconds = completed_tasks > 0 && duration_seconds
      ? duration_seconds / completed_tasks
      : 0;

    // Calculate idle time (estimated from agent uptimes)
    const agent_uptimes = agents.map((a) => a.metrics.performance.uptime_percentage);
    const average_uptime = agent_uptimes.length > 0
      ? agent_uptimes.reduce((sum, u) => sum + u, 0) / agent_uptimes.length
      : 100;
    const idle_time_percentage = 100 - average_uptime;

    // Parallel efficiency: actual agents working / total agents
    const active_agents = agents.filter((a) => a.metrics.completion.tasks_completed > 0).length;
    const parallel_efficiency = agents.length > 0
      ? (active_agents / agents.length) * 100
      : 0;

    return {
      tasks_per_hour,
      average_task_duration_seconds,
      idle_time_percentage,
      parallel_efficiency,
    };
  }

  /**
   * Calculate session collaboration metrics
   */
  private calculateSessionCollaboration(aggregated: AggregatedData, agents: AgentGrade[]) {
    // Handoff success rate: estimate based on task completion across agents
    const agent_completion_rates = agents.map((a) => a.metrics.completion.completion_rate);
    const handoff_success_rate = agent_completion_rates.length > 0
      ? agent_completion_rates.reduce((sum, r) => sum + r, 0) / agent_completion_rates.length
      : 100;

    // Merge conflicts: estimate from failed tasks
    const merge_conflicts = aggregated.failed_tasks;

    // Conductor interventions: count "blocked" tasks
    const conductor_interventions = aggregated.agents.reduce((sum, agent) => {
      return sum + agent.tasks_assigned.filter((t) => t.status === 'blocked').length;
    }, 0);

    return {
      handoff_success_rate,
      merge_conflicts,
      conductor_interventions,
    };
  }

  /**
   * Calculate overall session score using weighted average
   */
  private calculateSessionScore(metrics: SessionMetrics): number {
    const weights = this.config.scoring.weights.session;

    const completion_score = metrics.completion.completion_rate;
    const quality_score = (metrics.quality.test_pass_rate + metrics.quality.build_success_rate) / 2;
    const performance_score = Math.min(100, metrics.performance.tasks_per_hour * 10);
    const collaboration_score = metrics.collaboration.handoff_success_rate;

    return (
      completion_score * weights.completion +
      quality_score * weights.quality +
      performance_score * weights.performance +
      collaboration_score * weights.collaboration
    );
  }

  // ==========================================================================
  // Agent Score Calculation
  // ==========================================================================

  /**
   * Calculate agent-level grade
   */
  private calculateAgentGrade(agentData: AgentData, collectedData: CollectedData): AgentGrade {
    const metrics = this.calculateAgentMetrics(agentData);
    const score = this.calculateAgentScore(metrics);
    const grade = this.scoreToGrade(score);

    return {
      agent_id: agentData.agent_id,
      agent_name: agentData.agent_name,
      agent_type: agentData.agent_type as any,
      pane_id: agentData.pane_id || '',
      score,
      grade,
      metrics,
      tasks_assigned: agentData.tasks_assigned,
      tasks_completed: agentData.tasks_completed,
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate agent-level metrics
   */
  private calculateAgentMetrics(agentData: AgentData): AgentMetrics {
    const completion = this.calculateAgentCompletion(agentData);
    const quality = this.calculateAgentQuality(agentData);
    const performance = this.calculateAgentPerformance(agentData);
    const specialization = this.calculateAgentSpecialization(agentData);

    return { completion, quality, performance, specialization };
  }

  /**
   * Calculate agent completion metrics
   */
  private calculateAgentCompletion(agentData: AgentData) {
    const tasks_assigned = agentData.tasks_assigned.length;
    const tasks_completed = agentData.tasks_completed.length;
    const tasks_failed = agentData.tasks_assigned.filter((t) => t.status === 'failed').length;

    const completion_rate = tasks_assigned > 0 ? (tasks_completed / tasks_assigned) * 100 : 0;
    const failure_rate = tasks_assigned > 0 ? (tasks_failed / tasks_assigned) * 100 : 0;

    return {
      tasks_assigned,
      tasks_completed,
      tasks_failed,
      completion_rate,
      failure_rate,
    };
  }

  /**
   * Calculate agent quality metrics
   */
  private calculateAgentQuality(agentData: AgentData) {
    let total_tests = 0;
    let passed_tests = 0;
    let total_builds = 0;
    let successful_builds = 0;
    let pr_approved_first_time = 0;
    let total_prs = 0;
    let redo_count = 0;

    for (const task of agentData.tasks_completed) {
      const result = task.result;
      if (!result) continue;

      if (result.tests_passed !== undefined && result.tests_failed !== undefined) {
        total_tests += result.tests_passed + result.tests_failed;
        passed_tests += result.tests_passed;
      }

      if (result.build_success !== undefined) {
        total_builds++;
        if (result.build_success) successful_builds++;
      }

      if (result.pr_url) {
        total_prs++;
        // Assume PR approved if quality score is high
        if (result.quality_score && result.quality_score >= 90) {
          pr_approved_first_time++;
        }
      }
    }

    // Check for redo tasks (same issue number appearing multiple times)
    const issue_numbers = agentData.tasks_assigned
      .filter((t) => t.issue_number)
      .map((t) => t.issue_number);
    const unique_issues = new Set(issue_numbers);
    redo_count = issue_numbers.length - unique_issues.size;

    const test_pass_rate = total_tests > 0 ? (passed_tests / total_tests) * 100 : 100;
    const build_success_rate = total_builds > 0 ? (successful_builds / total_builds) * 100 : 100;
    const review_approval_rate = total_prs > 0 ? (pr_approved_first_time / total_prs) * 100 : 100;
    const redo_rate = agentData.tasks_assigned.length > 0
      ? (redo_count / agentData.tasks_assigned.length) * 100
      : 0;

    return {
      test_pass_rate,
      build_success_rate,
      review_approval_rate,
      redo_rate,
    };
  }

  /**
   * Calculate agent performance metrics
   */
  private calculateAgentPerformance(agentData: AgentData) {
    const durations = agentData.tasks_completed
      .map((t) => t.duration_seconds)
      .filter((d): d is number => d !== undefined);

    const average_task_duration_seconds = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    // Productivity score: composite of code changes & quality
    // Simplified: tasks completed per hour
    const total_duration = durations.reduce((sum, d) => sum + d, 0);
    const productivity_score = total_duration > 0
      ? Math.min(100, (agentData.tasks_completed.length / (total_duration / 3600)) * 20)
      : 0;

    // Uptime percentage: time spent on tasks vs total session time
    const uptime_percentage = agentData.tasks_assigned.length > 0
      ? (agentData.tasks_completed.length / agentData.tasks_assigned.length) * 100
      : 0;

    return {
      average_task_duration_seconds,
      productivity_score,
      uptime_percentage,
    };
  }

  /**
   * Calculate agent specialization metrics
   */
  private calculateAgentSpecialization(agentData: AgentData) {
    // Count task types
    const task_type_distribution: Record<string, number> = {};
    for (const task of agentData.tasks_assigned) {
      task_type_distribution[task.task_type] = (task_type_distribution[task.task_type] || 0) + 1;
    }

    // Find primary skill (most common task type)
    let primary_skill = 'General';
    let max_count = 0;
    for (const [type, count] of Object.entries(task_type_distribution)) {
      if (count > max_count) {
        max_count = count;
        primary_skill = this.taskTypeToSkill(type);
      }
    }

    // Skill match rate: % of tasks matching primary skill
    const skill_match_rate = agentData.tasks_assigned.length > 0
      ? (max_count / agentData.tasks_assigned.length) * 100
      : 0;

    return {
      primary_skill,
      skill_match_rate,
      task_type_distribution,
    };
  }

  /**
   * Calculate overall agent score using weighted average
   */
  private calculateAgentScore(metrics: AgentMetrics): number {
    const weights = this.config.scoring.weights.agent;

    const completion_score = metrics.completion.completion_rate;
    const quality_score = (metrics.quality.test_pass_rate + metrics.quality.build_success_rate) / 2;
    const performance_score = metrics.performance.productivity_score;
    const specialization_score = metrics.specialization.skill_match_rate;

    return (
      completion_score * weights.completion +
      quality_score * weights.quality +
      performance_score * weights.performance +
      specialization_score * weights.specialization
    );
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Convert numeric score to letter grade
   */
  private scoreToGrade(score: number): Grade {
    const thresholds = this.config.scoring.thresholds;

    if (score >= thresholds['A+']) return 'A+';
    if (score >= thresholds['A']) return 'A';
    if (score >= thresholds['A-']) return 'A-';
    if (score >= thresholds['B+']) return 'B+';
    if (score >= thresholds['B']) return 'B';
    if (score >= thresholds['B-']) return 'B-';
    if (score >= thresholds['C+']) return 'C+';
    if (score >= thresholds['C']) return 'C';
    if (score >= thresholds['C-']) return 'C-';
    if (score >= thresholds['D']) return 'D';
    return 'F';
  }

  /**
   * Map task type to skill name
   */
  private taskTypeToSkill(taskType: string): string {
    const skillMap: Record<string, string> = {
      implementation: 'Implementation',
      review: 'Code Review',
      deployment: 'Deployment',
      pr_creation: 'PR Management',
      issue_analysis: 'Issue Analysis',
      monitoring: 'Monitoring',
      documentation: 'Documentation',
      testing: 'Testing',
      bugfix: 'Bug Fixing',
      refactoring: 'Refactoring',
    };
    return skillMap[taskType] || 'General';
  }
}
