/**
 * Event Loader
 *
 * Loads and parses conductor events and timeline data from .ai/logs directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ConductorEvent, TimelineEvent, CompletedTask } from '../types/index.js';

export class EventLoader {
  private logsDir: string;

  constructor(logsDir: string = '.ai/logs/conductor') {
    this.logsDir = logsDir;
  }

  /**
   * Load the most recent conductor assignment
   */
  loadLatestConductorAssignment(): ConductorEvent | null {
    try {
      const files = this.getConductorFiles();
      if (files.length === 0) {
        return null;
      }

      // Sort by filename (timestamp in name) and get latest
      const latestFile = files.sort().reverse()[0];
      const filePath = path.join(this.logsDir, latestFile);

      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      return this.parseConductorEvent(data);
    } catch (error) {
      console.error('Failed to load conductor assignment:', error);
      return null;
    }
  }

  /**
   * Load conductor assignments within a time window
   */
  loadConductorAssignments(windowMinutes: number): ConductorEvent[] {
    try {
      const files = this.getConductorFiles();
      const cutoffTime = Date.now() - windowMinutes * 60 * 1000;

      const events: ConductorEvent[] = [];

      for (const file of files) {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs >= cutoffTime) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          const event = this.parseConductorEvent(data);
          if (event) {
            events.push(event);
          }
        }
      }

      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to load conductor assignments:', error);
      return [];
    }
  }

  /**
   * Get all conductor assignment files
   */
  private getConductorFiles(): string[] {
    try {
      if (!fs.existsSync(this.logsDir)) {
        return [];
      }

      return fs
        .readdirSync(this.logsDir)
        .filter(
          (file) =>
            (file.startsWith('assignment-') || file.startsWith('task-assignment-')) && file.endsWith('.json')
        );
    } catch {
      return [];
    }
  }

  /**
   * Parse conductor event from JSON data
   */
  private parseConductorEvent(data: Record<string, unknown>): ConductorEvent | null {
    try {
      return {
        timestamp: new Date(data.timestamp as string),
        cycle: (data.cycle as number) || 0,
        mode: (data.mode as string) || 'UNKNOWN',
        conductor: (data.conductor as string) || 'Unknown',
        assignments: (data.assignments || {}) as Record<string, unknown>,
        completed_this_cycle: (data.completed_this_cycle as CompletedTask[]) || [],
      };
    } catch (error) {
      console.error('Failed to parse conductor event:', error);
      return null;
    }
  }

  /**
   * Extract completed tasks from recent conductor events
   */
  getRecentCompletions(windowMinutes: number = 60): CompletedTask[] {
    const events = this.loadConductorAssignments(windowMinutes);
    const completions: CompletedTask[] = [];

    for (const event of events) {
      if (event.completed_this_cycle && event.completed_this_cycle.length > 0) {
        completions.push(...event.completed_this_cycle);
      }
    }

    return completions;
  }

  /**
   * Convert conductor events to timeline events
   */
  conductorEventsToTimeline(events: ConductorEvent[]): TimelineEvent[] {
    const timelineEvents: TimelineEvent[] = [];

    for (const event of events) {
      // Add completion events
      if (event.completed_this_cycle) {
        for (const task of event.completed_this_cycle) {
          timelineEvents.push({
            timestamp: event.timestamp,
            event_type: 'task_completed',
            agent_id: task.agent,
            agent_name: task.agent,
            issue_number: task.issue,
            description: `Completed: ${task.title}`,
          });
        }
      }

      // Add assignment events
      if (event.assignments) {
        for (const [agentKey, assignmentData] of Object.entries(event.assignments)) {
          const assignment = assignmentData as Record<string, unknown>;
          const newAssignment = assignment.new_assignment as Record<string, unknown> | undefined;

          if (newAssignment) {
            timelineEvents.push({
              timestamp: event.timestamp,
              event_type: 'task_started',
              agent_id: agentKey,
              agent_name: (assignment.agent as string) || agentKey,
              issue_number: (newAssignment.issue as number) || undefined,
              description: `Started: ${(newAssignment.title as string) || 'Unknown task'}`,
            });
          }
        }
      }
    }

    return timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
