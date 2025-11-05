/**
 * Timeline Aggregator
 *
 * Aggregates tmux pane information and event data to generate timeline reports.
 */

import type {
  TimelineReport,
  AgentStatesSummary,
  AgentPaneInfo,
  ConductorStatus,
  ConductorEvent,
} from '../types/index.js';
import { TmuxAdapter } from '../adapters/TmuxAdapter.js';
import { EventLoader } from '../loaders/EventLoader.js';

export class TimelineAggregator {
  private tmuxAdapter: TmuxAdapter;
  private eventLoader: EventLoader;

  constructor(tmuxAdapter?: TmuxAdapter, eventLoader?: EventLoader) {
    this.tmuxAdapter = tmuxAdapter || new TmuxAdapter();
    this.eventLoader = eventLoader || new EventLoader();
  }

  /**
   * Generate a complete timeline report
   */
  generateReport(sessionName: string, windowMinutes: number = 60): TimelineReport {
    // Get current agent states from tmux
    const agentStates = this.aggregateAgentStates(sessionName);

    // Load recent events
    const conductorEvents = this.eventLoader.loadConductorAssignments(windowMinutes);
    const timelineEvents = this.eventLoader.conductorEventsToTimeline(conductorEvents);

    // Get recent completions
    const recentCompletions = this.eventLoader.getRecentCompletions(windowMinutes);

    // Get conductor status
    const conductorStatus = this.getConductorStatus(conductorEvents);

    return {
      generated_at: new Date(),
      session_name: sessionName,
      agent_states: agentStates,
      recent_events: timelineEvents.slice(0, 10), // Top 10 most recent
      recent_completions: recentCompletions.slice(0, 5), // Top 5 most recent
      conductor_status: conductorStatus,
    };
  }

  /**
   * Aggregate agent states from tmux panes
   */
  private aggregateAgentStates(sessionName: string): AgentStatesSummary {
    const panes = this.tmuxAdapter.getPanes(sessionName);

    // Filter panes that look like agents (have agent_name or agent_type)
    const agentPanes = panes.filter((pane) => pane.agent_name || pane.agent_type);

    const summary: AgentStatesSummary = {
      total: agentPanes.length,
      run: agentPanes.filter((p) => p.state === 'RUN').length,
      idle: agentPanes.filter((p) => p.state === 'IDLE').length,
      dead: agentPanes.filter((p) => p.state === 'DEAD').length,
      agents: agentPanes,
    };

    return summary;
  }

  /**
   * Get conductor status from recent events
   */
  private getConductorStatus(events: ConductorEvent[]): ConductorStatus | undefined {
    if (events.length === 0) {
      return undefined;
    }

    const latestEvent = events[0];

    return {
      conductor_name: latestEvent.conductor,
      last_cycle: latestEvent.cycle,
      last_activity: latestEvent.timestamp,
      mode: latestEvent.mode,
    };
  }

  /**
   * Detect if an agent pane is actively running based on content
   */
  private detectActiveExecution(paneContent: string): boolean {
    // Look for indicators of active execution
    const activeIndicators = [
      'Executing',
      'Running',
      'Processing',
      'Building',
      'Testing',
      'Agent.*starting',
      'Agent.*running',
      'Tool.*executing',
    ];

    return activeIndicators.some((indicator) => new RegExp(indicator, 'i').test(paneContent));
  }

  /**
   * Enhance agent state detection with pane content analysis
   */
  enhanceAgentStates(agents: AgentPaneInfo[]): AgentPaneInfo[] {
    return agents.map((agent) => {
      // If already RUN or DEAD, keep the state
      if (agent.state === 'RUN' || agent.state === 'DEAD') {
        return agent;
      }

      // For IDLE, check pane content for active execution
      const content = this.tmuxAdapter.capturePaneContent(agent.pane_id, -50);
      const isActive = this.detectActiveExecution(content);

      return {
        ...agent,
        state: isActive ? 'RUN' : 'IDLE',
      };
    });
  }
}
