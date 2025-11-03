/**
 * Miyabi Gradebook Reporter
 *
 * Generates human-readable Markdown reports and machine-readable JSON exports
 * from gradebook data.
 */

import type { SessionGrade, AgentGrade, Grade } from '../types/gradebook';
import { formatDuration } from '../utils/tmux-parser';

// ============================================================================
// Reporter Class
// ============================================================================

export class GradebookReporter {
  /**
   * Generate comprehensive Markdown report
   *
   * @param gradebook - Complete session gradebook
   * @returns Formatted Markdown report
   */
  generateMarkdownReport(gradebook: SessionGrade): string {
    const sections = [
      this.generateHeader(gradebook),
      this.generateOverallGrade(gradebook),
      this.generateSessionMetrics(gradebook),
      this.generateAgentPerformance(gradebook),
      this.generateFooter(gradebook),
    ];

    return sections.join('\n\n');
  }

  /**
   * Generate JSON export
   *
   * @param gradebook - Complete session gradebook
   * @returns JSON string (pretty-printed)
   */
  generateJSONExport(gradebook: SessionGrade): string {
    return JSON.stringify(gradebook, null, 2);
  }

  /**
   * Generate compact summary (for CLI output)
   *
   * @param gradebook - Complete session gradebook
   * @returns Compact summary string
   */
  generateSummary(gradebook: SessionGrade): string {
    const duration = gradebook.duration_seconds
      ? formatDuration(gradebook.duration_seconds)
      : 'N/A';

    const lines = [
      `🎓 Session: ${gradebook.session_name}`,
      `   Grade: ${this.gradeToEmoji(gradebook.grade)} ${gradebook.grade} (${gradebook.overall_score.toFixed(1)}/100)`,
      `   Duration: ${duration}`,
      `   Tasks: ${gradebook.metrics.completion.completed_tasks}/${gradebook.metrics.completion.total_tasks} completed`,
      `   Agents: ${gradebook.agents.length}`,
    ];

    return lines.join('\n');
  }

  // ==========================================================================
  // Markdown Report Sections
  // ==========================================================================

  private generateHeader(gradebook: SessionGrade): string {
    const duration = gradebook.duration_seconds
      ? formatDuration(gradebook.duration_seconds)
      : 'Ongoing';

    return `# 🎓 Miyabi Orchestra Gradebook

**Session**: ${gradebook.session_name}
**Period**: ${this.formatTimestamp(gradebook.started_at)} → ${
      gradebook.ended_at ? this.formatTimestamp(gradebook.ended_at) : 'Ongoing'
    }
**Duration**: ${duration}

---`;
  }

  private generateOverallGrade(gradebook: SessionGrade): string {
    const emoji = this.gradeToEmoji(gradebook.grade);
    const bar = this.generateGradeBar(gradebook.overall_score);

    return `## ${emoji} Overall Grade: ${gradebook.grade} (${gradebook.overall_score.toFixed(1)}/100)

${bar}

**Evaluation Breakdown**:
- 📊 Completion (30%): ${gradebook.metrics.completion.completion_rate.toFixed(1)}%
- ✨ Quality (40%): ${this.calculateQualityScore(gradebook).toFixed(1)}%
- ⚡ Performance (20%): ${this.calculatePerformanceScore(gradebook).toFixed(1)}%
- 🤝 Collaboration (10%): ${this.calculateCollaborationScore(gradebook).toFixed(1)}%

---`;
  }

  private generateSessionMetrics(gradebook: SessionGrade): string {
    const { completion, quality, performance, collaboration } = gradebook.metrics;

    return `## 🎯 Session Metrics

### 📊 Completion (30%)
- **Tasks**: ${completion.completed_tasks}/${completion.total_tasks} completed (${completion.completion_rate.toFixed(1)}%)
- **Issues**: ${completion.issues_closed} closed
- **PRs**: ${completion.prs_merged} merged
- **Failed**: ${completion.failed_tasks} tasks

### ✨ Quality (40%)
- **Test Pass Rate**: ${quality.test_pass_rate.toFixed(1)}% ${this.ratingEmoji(quality.test_pass_rate)}
- **Build Success Rate**: ${quality.build_success_rate.toFixed(1)}% ${this.ratingEmoji(quality.build_success_rate)}
- **PR Review Iterations**: ${quality.pr_review_iterations.toFixed(1)}
- **Errors**: ${quality.error_count}
${quality.clippy_warnings > 0 ? `- **Clippy Warnings**: ${quality.clippy_warnings}` : ''}

### ⚡ Performance (20%)
- **Tasks/Hour**: ${performance.tasks_per_hour.toFixed(2)}
- **Avg Task Duration**: ${formatDuration(performance.average_task_duration_seconds)}
- **Idle Time**: ${performance.idle_time_percentage.toFixed(1)}%
- **Parallel Efficiency**: ${performance.parallel_efficiency.toFixed(1)}% ${this.ratingEmoji(performance.parallel_efficiency)}

### 🤝 Collaboration (10%)
- **Handoff Success Rate**: ${collaboration.handoff_success_rate.toFixed(1)}% ${this.ratingEmoji(collaboration.handoff_success_rate)}
- **Merge Conflicts**: ${collaboration.merge_conflicts}
- **Conductor Interventions**: ${collaboration.conductor_interventions}

---`;
  }

  private generateAgentPerformance(gradebook: SessionGrade): string {
    const sortedAgents = [...gradebook.agents].sort((a, b) => b.score - a.score);

    const agentSections = sortedAgents.map((agent) => this.generateAgentSection(agent));

    return `## 👥 Agent Performance

${agentSections.join('\n\n')}

---`;
  }

  private generateAgentSection(agent: AgentGrade): string {
    const emoji = this.gradeToEmoji(agent.grade);
    const bar = this.generateGradeBar(agent.score);

    const recentTasks = agent.tasks_completed.slice(-3);
    const taskLines = recentTasks.map((task) => {
      const duration = task.duration_seconds ? formatDuration(task.duration_seconds) : 'N/A';
      const status = this.statusToEmoji(task.status);
      const issueRef = task.issue_number ? `#${task.issue_number}` : task.task_id.substring(0, 8);
      return `  - ${status} ${issueRef}: ${task.title.substring(0, 50)} (${duration})`;
    });

    return `### ${emoji} ${agent.agent_name} - Grade: ${agent.grade} (${agent.score.toFixed(1)}/100)

${bar}

**Completion**: ${agent.metrics.completion.tasks_completed}/${agent.metrics.completion.tasks_assigned} tasks (${agent.metrics.completion.completion_rate.toFixed(1)}%)
**Quality**: Test ${agent.metrics.quality.test_pass_rate.toFixed(1)}% | Build ${agent.metrics.quality.build_success_rate.toFixed(1)}% | Review ${agent.metrics.quality.review_approval_rate.toFixed(1)}%
**Performance**: ${formatDuration(agent.metrics.performance.average_task_duration_seconds)} avg | ${agent.metrics.performance.uptime_percentage.toFixed(1)}% uptime
**Specialization**: ${agent.metrics.specialization.primary_skill} (${agent.metrics.specialization.skill_match_rate.toFixed(1)}% match)

**Recent Tasks**:
${taskLines.length > 0 ? taskLines.join('\n') : '  _(No completed tasks)_'}`;
  }

  private generateFooter(gradebook: SessionGrade): string {
    return `## 📝 Report Information

**Generated**: ${this.formatTimestamp(gradebook.generated_at)}
**Version**: ${gradebook.version}

---

_Generated by Miyabi tmux Gradebook System_`;
  }

  // ==========================================================================
  // Formatting Utilities
  // ==========================================================================

  /**
   * Generate ASCII progress bar
   */
  private generateGradeBar(score: number): string {
    const filled = Math.floor(score / 5);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${score.toFixed(1)}%`;
  }

  /**
   * Map grade to emoji
   */
  private gradeToEmoji(grade: Grade): string {
    const emojiMap: Record<Grade, string> = {
      'A+': '🏆',
      'A': '🥇',
      'A-': '🥈',
      'B+': '🥉',
      'B': '😊',
      'B-': '🙂',
      'C+': '😐',
      'C': '😕',
      'C-': '😟',
      'D': '😰',
      'F': '❌',
    };
    return emojiMap[grade] || '❓';
  }

  /**
   * Map status to emoji
   */
  private statusToEmoji(status: string): string {
    const statusMap: Record<string, string> = {
      completed: '✅',
      in_progress: '⏳',
      failed: '❌',
      blocked: '🚧',
      cancelled: '🚫',
      pending: '⏸️',
    };
    return statusMap[status] || '❓';
  }

  /**
   * Rating emoji based on percentage
   */
  private ratingEmoji(percentage: number): string {
    if (percentage >= 95) return '🏆';
    if (percentage >= 85) return '⭐';
    if (percentage >= 75) return '👍';
    if (percentage >= 60) return '👌';
    if (percentage >= 50) return '⚠️';
    return '❌';
  }

  /**
   * Format timestamp to readable format
   */
  private formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Calculate quality score from metrics
   */
  private calculateQualityScore(gradebook: SessionGrade): number {
    const { quality } = gradebook.metrics;
    return (quality.test_pass_rate + quality.build_success_rate) / 2;
  }

  /**
   * Calculate performance score from metrics
   */
  private calculatePerformanceScore(gradebook: SessionGrade): number {
    const { performance } = gradebook.metrics;
    return Math.min(100, performance.tasks_per_hour * 10);
  }

  /**
   * Calculate collaboration score from metrics
   */
  private calculateCollaborationScore(gradebook: SessionGrade): number {
    const { collaboration } = gradebook.metrics;
    return collaboration.handoff_success_rate;
  }
}

// ============================================================================
// Export Utilities
// ============================================================================

/**
 * Save report to file
 *
 * @param content - Report content
 * @param filePath - Output file path
 */
export async function saveReport(content: string, filePath: string): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');

  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Generate timestamped filename
 *
 * @param baseName - Base name (e.g., "gradebook")
 * @param extension - File extension (e.g., "md", "json")
 * @returns Timestamped filename
 */
export function generateTimestampedFilename(baseName: string, extension: string): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/T/, '-')
    .replace(/:/g, '')
    .replace(/\..+/, '');
  return `${baseName}-${timestamp}.${extension}`;
}
