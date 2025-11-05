/**
 * Timeline Aggregator
 *
 * Aggregates agent pane states and events into timeline summaries
 * for Conductor monitoring dashboard.
 */

import type { AgentPane, AgentEvent, TimelineAggregation } from '../types';

// ============================================================================
// Timeline Aggregator Class
// ============================================================================

export class TimelineAggregator {
  /**
   * Aggregate agent panes and events into timeline summary
   *
   * @param windowName - Window name being monitored
   * @param agentPanes - Current agent panes with states
   * @param recentEvents - Recent agent events
   * @returns Timeline aggregation result
   */
  aggregate(
    windowName: string,
    agentPanes: AgentPane[],
    recentEvents: AgentEvent[]
  ): TimelineAggregation {
    const agentStates = this.aggregateStates(agentPanes);
    const activeAgents = this.extractActiveAgents(agentPanes);

    return {
      timestamp: new Date(),
      windowName,
      agentStates,
      recentEvents,
      activeAgents,
    };
  }

  /**
   * Aggregate agent states into counts
   *
   * @param agentPanes - Agent panes with states
   * @returns State counts
   */
  private aggregateStates(agentPanes: AgentPane[]): { RUN: number; IDLE: number; DEAD: number } {
    const counts = {
      RUN: 0,
      IDLE: 0,
      DEAD: 0,
    };

    for (const pane of agentPanes) {
      counts[pane.state]++;
    }

    return counts;
  }

  /**
   * Extract names of active (RUN state) agents
   *
   * @param agentPanes - Agent panes with states
   * @returns Array of active agent names
   */
  private extractActiveAgents(agentPanes: AgentPane[]): string[] {
    return agentPanes
      .filter((pane) => pane.state === 'RUN' && pane.agentName)
      .map((pane) => pane.agentName as string);
  }

  /**
   * Get most recent event for each agent
   *
   * @param events - Agent events
   * @returns Map of agent name to most recent event
   */
  getMostRecentEventByAgent(events: AgentEvent[]): Map<string, AgentEvent> {
    const mostRecent = new Map<string, AgentEvent>();

    for (const event of events) {
      const existing = mostRecent.get(event.agentName);
      if (!existing || event.timestamp > existing.timestamp) {
        mostRecent.set(event.agentName, event);
      }
    }

    return mostRecent;
  }

  /**
   * Filter events by time window
   *
   * @param events - Agent events
   * @param windowMinutes - Time window in minutes
   * @returns Filtered events within time window
   */
  filterEventsByTimeWindow(events: AgentEvent[], windowMinutes: number): AgentEvent[] {
    const cutoffTime = new Date(Date.now() - windowMinutes * 60 * 1000);
    return events.filter((event) => event.timestamp >= cutoffTime);
  }

  /**
   * Group events by event type
   *
   * @param events - Agent events
   * @returns Map of event type to events
   */
  groupEventsByType(events: AgentEvent[]): Map<string, AgentEvent[]> {
    const grouped = new Map<string, AgentEvent[]>();

    for (const event of events) {
      const existing = grouped.get(event.eventType) || [];
      existing.push(event);
      grouped.set(event.eventType, existing);
    }

    return grouped;
  }

  /**
   * Calculate agent productivity score based on recent activity
   *
   * @param agentName - Agent name
   * @param events - Agent events
   * @param timeWindowMinutes - Time window for calculation (default: 60)
   * @returns Productivity score (0-100)
   */
  calculateProductivityScore(
    agentName: string,
    events: AgentEvent[],
    timeWindowMinutes: number = 60
  ): number {
    const recentEvents = this.filterEventsByTimeWindow(events, timeWindowMinutes).filter(
      (e) => e.agentName === agentName
    );

    if (recentEvents.length === 0) {
      return 0;
    }

    // Score based on event types
    let score = 0;
    for (const event of recentEvents) {
      switch (event.eventType) {
        case 'task_complete':
          score += 25;
          break;
        case 'task_start':
          score += 15;
          break;
        case 'task_failed':
          score += 5;
          break;
        case 'error':
          score -= 5;
          break;
        case 'idle':
          score += 0;
          break;
      }
    }

    // Normalize to 0-100 range
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate summary statistics for the timeline
   *
   * @param aggregation - Timeline aggregation
   * @param allEvents - All events for the time period
   * @returns Summary statistics object
   */
  generateSummaryStats(
    aggregation: TimelineAggregation,
    allEvents: AgentEvent[]
  ): {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    deadAgents: number;
    totalEvents: number;
    completedTasks: number;
    failedTasks: number;
    averageProductivity: number;
  } {
    const { agentStates } = aggregation;
    const eventsByType = this.groupEventsByType(allEvents);
    const completedTasks = (eventsByType.get('task_complete') || []).length;
    const failedTasks = (eventsByType.get('task_failed') || []).length;

    // Calculate average productivity across all agents
    const uniqueAgents = new Set(allEvents.map((e) => e.agentName));
    const productivityScores = Array.from(uniqueAgents).map((agentName) =>
      this.calculateProductivityScore(agentName, allEvents)
    );
    const averageProductivity =
      productivityScores.length > 0
        ? productivityScores.reduce((sum, score) => sum + score, 0) / productivityScores.length
        : 0;

    return {
      totalAgents: agentStates.RUN + agentStates.IDLE + agentStates.DEAD,
      activeAgents: agentStates.RUN,
      idleAgents: agentStates.IDLE,
      deadAgents: agentStates.DEAD,
      totalEvents: allEvents.length,
      completedTasks,
      failedTasks,
      averageProductivity: Math.round(averageProductivity),
    };
  }
}
