/**
 * Report Formatter
 *
 * Formats timeline reports for human-readable (tmux pane) and machine-readable (JSONL) output.
 */

import type { TimelineReport, JSONLTimelineEntry } from '../types/index.js';

export class ReportFormatter {
  /**
   * Format report for tmux pane display (human-readable)
   */
  formatForTmux(report: TimelineReport): string {
    const lines: string[] = [];

    // Header
    lines.push('════════════════════════════════════════════════════════════════');
    lines.push('🎯 Conductor Timeline Report');
    lines.push(`📅 ${report.generated_at.toLocaleString()}`);
    lines.push(`📺 Session: ${report.session_name}`);
    lines.push('════════════════════════════════════════════════════════════════');
    lines.push('');

    // Agent States Summary
    lines.push('📊 Agent States:');
    lines.push(`   Total: ${report.agent_states.total}`);
    lines.push(`   ▶️  RUN:  ${report.agent_states.run}`);
    lines.push(`   ⏸️  IDLE: ${report.agent_states.idle}`);
    lines.push(`   💀 DEAD: ${report.agent_states.dead}`);
    lines.push('');

    // Agent Details
    if (report.agent_states.agents.length > 0) {
      lines.push('🤖 Agents:');
      for (const agent of report.agent_states.agents) {
        const stateIcon = agent.state === 'RUN' ? '▶️' : agent.state === 'IDLE' ? '⏸️' : '💀';
        const name = agent.agent_name || 'Unknown';
        const type = agent.agent_type ? `(${agent.agent_type})` : '';
        lines.push(`   ${stateIcon} ${name} ${type} - ${agent.pane_id}`);
      }
      lines.push('');
    }

    // Conductor Status
    if (report.conductor_status) {
      lines.push('🎼 Conductor Status:');
      lines.push(`   Name: ${report.conductor_status.conductor_name}`);
      lines.push(`   Mode: ${report.conductor_status.mode}`);
      lines.push(`   Cycle: ${report.conductor_status.last_cycle}`);
      lines.push(`   Last Activity: ${report.conductor_status.last_activity.toLocaleTimeString()}`);
      lines.push('');
    }

    // Recent Completions
    if (report.recent_completions.length > 0) {
      lines.push('✅ Recent Completions:');
      for (const completion of report.recent_completions) {
        lines.push(`   • #${completion.issue}: ${completion.title} (${completion.agent})`);
      }
      lines.push('');
    }

    // Recent Events
    if (report.recent_events.length > 0) {
      lines.push('📜 Recent Events:');
      for (const event of report.recent_events.slice(0, 5)) {
        const time = event.timestamp.toLocaleTimeString();
        const icon = this.getEventIcon(event.event_type);
        lines.push(`   ${icon} [${time}] ${event.description}`);
      }
      lines.push('');
    }

    lines.push('════════════════════════════════════════════════════════════════');

    return lines.join('\n');
  }

  /**
   * Format report for JSONL output (machine-readable)
   */
  formatForJSONL(report: TimelineReport): string {
    const entry: JSONLTimelineEntry = {
      timestamp: report.generated_at.toISOString(),
      session_name: report.session_name,
      agent_states: {
        run: report.agent_states.run,
        idle: report.agent_states.idle,
        dead: report.agent_states.dead,
      },
      recent_events: report.recent_events.slice(0, 10).map((event) => ({
        timestamp: event.timestamp.toISOString(),
        event_type: event.event_type,
        agent_id: event.agent_id,
        description: event.description,
      })),
    };

    return JSON.stringify(entry);
  }

  /**
   * Get icon for event type
   */
  private getEventIcon(eventType: string): string {
    switch (eventType) {
      case 'task_started':
        return '🚀';
      case 'task_completed':
        return '✅';
      case 'task_failed':
        return '❌';
      case 'agent_idle':
        return '⏸️';
      case 'agent_dead':
        return '💀';
      default:
        return '📝';
    }
  }

  /**
   * Format a compact one-line summary
   */
  formatCompactSummary(report: TimelineReport): string {
    const { run, idle, dead } = report.agent_states;
    return `[${report.session_name}] RUN:${run} IDLE:${idle} DEAD:${dead} | Last update: ${report.generated_at.toLocaleTimeString()}`;
  }
}
