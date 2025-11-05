/**
 * Output Formatter
 *
 * Formats timeline aggregation results for human-readable display
 * and structured JSON logging.
 */

import type { TimelineAggregation, TimelineReport } from '../types';

// ============================================================================
// Formatter Class
// ============================================================================

export class TimelineFormatter {
  /**
   * Format timeline aggregation into complete report
   *
   * @param aggregation - Timeline aggregation data
   * @returns Timeline report with both human-readable and JSON formats
   */
  format(aggregation: TimelineAggregation): TimelineReport {
    return {
      aggregation,
      humanReadable: this.formatHumanReadable(aggregation),
      jsonLog: this.formatJSON(aggregation),
    };
  }

  /**
   * Format aggregation for human-readable display (tmux pane)
   *
   * @param aggregation - Timeline aggregation data
   * @returns Formatted string for display
   */
  private formatHumanReadable(aggregation: TimelineAggregation): string {
    const { windowName, agentStates, recentEvents, activeAgents } = aggregation;
    const timestamp = this.formatTimestamp(aggregation.timestamp);

    // Header
    const lines: string[] = [];
    lines.push('═'.repeat(80));
    lines.push(`🎯 Conductor Timeline Report - ${windowName}`);
    lines.push(`📅 ${timestamp}`);
    lines.push('═'.repeat(80));
    lines.push('');

    // Agent States Summary
    lines.push('📊 Agent States:');
    lines.push(
      `   🟢 RUN:  ${this.padRight(agentStates.RUN.toString(), 3)} ${this.progressBar(agentStates.RUN, this.totalAgents(agentStates))}`
    );
    lines.push(
      `   🟡 IDLE: ${this.padRight(agentStates.IDLE.toString(), 3)} ${this.progressBar(agentStates.IDLE, this.totalAgents(agentStates))}`
    );
    lines.push(
      `   🔴 DEAD: ${this.padRight(agentStates.DEAD.toString(), 3)} ${this.progressBar(agentStates.DEAD, this.totalAgents(agentStates))}`
    );
    lines.push('');

    // Active Agents
    if (activeAgents.length > 0) {
      lines.push('⚡ Active Agents:');
      lines.push(`   ${activeAgents.join(', ')}`);
      lines.push('');
    }

    // Recent Events
    if (recentEvents.length > 0) {
      lines.push('📜 Recent Events (Latest 5):');
      const latestEvents = recentEvents.slice(0, 5);
      for (const event of latestEvents) {
        lines.push(this.formatEvent(event));
      }
    } else {
      lines.push('📜 Recent Events:');
      lines.push('   No recent events');
    }

    lines.push('');
    lines.push('═'.repeat(80));

    return lines.join('\n');
  }

  /**
   * Format aggregation as JSON for structured logging
   *
   * @param aggregation - Timeline aggregation data
   * @returns JSON string
   */
  private formatJSON(aggregation: TimelineAggregation): string {
    return JSON.stringify(
      {
        timestamp: aggregation.timestamp.toISOString(),
        window: aggregation.windowName,
        states: aggregation.agentStates,
        active_agents: aggregation.activeAgents,
        recent_events: aggregation.recentEvents.slice(0, 10).map((event) => ({
          timestamp: event.timestamp.toISOString(),
          agent: event.agentName,
          type: event.eventType,
          issue: event.issueNumber,
          task: event.taskDescription,
        })),
      },
      null,
      2
    );
  }

  /**
   * Format single event for display
   *
   * @param event - Agent event
   * @returns Formatted event string
   */
  private formatEvent(event: {
    timestamp: Date;
    agentName: string;
    eventType: string;
    issueNumber?: number;
    taskDescription?: string;
  }): string {
    const time = this.formatShortTime(event.timestamp);
    const icon = this.getEventIcon(event.eventType);
    const issue = event.issueNumber ? `#${event.issueNumber}` : '';
    const task = event.taskDescription || 'No description';

    return `   ${time} ${icon} ${this.padRight(event.agentName, 10)} ${this.padRight(issue, 6)} ${task.substring(0, 40)}`;
  }

  /**
   * Get icon for event type
   *
   * @param eventType - Event type
   * @returns Icon emoji
   */
  private getEventIcon(eventType: string): string {
    switch (eventType) {
      case 'task_start':
        return '▶️';
      case 'task_complete':
        return '✅';
      case 'task_failed':
        return '❌';
      case 'error':
        return '⚠️';
      case 'idle':
        return '💤';
      default:
        return '📌';
    }
  }

  /**
   * Format timestamp for display
   *
   * @param date - Date object
   * @returns Formatted timestamp string
   */
  private formatTimestamp(date: Date): string {
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  /**
   * Format short time (HH:MM:SS)
   *
   * @param date - Date object
   * @returns Formatted time string
   */
  private formatShortTime(date: Date): string {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  /**
   * Create progress bar
   *
   * @param value - Current value
   * @param total - Total value
   * @param width - Bar width (default: 20)
   * @returns Progress bar string
   */
  private progressBar(value: number, total: number, width: number = 20): string {
    if (total === 0) return '[' + ' '.repeat(width) + ']';

    const filled = Math.round((value / total) * width);
    const empty = width - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
  }

  /**
   * Pad string to the right
   *
   * @param str - String to pad
   * @param length - Target length
   * @returns Padded string
   */
  private padRight(str: string, length: number): string {
    return str.padEnd(length, ' ');
  }

  /**
   * Calculate total agents
   *
   * @param agentStates - Agent state counts
   * @returns Total number of agents
   */
  private totalAgents(agentStates: { RUN: number; IDLE: number; DEAD: number }): number {
    return agentStates.RUN + agentStates.IDLE + agentStates.DEAD;
  }
}
