/**
 * Timeline Aggregator Tests
 */

import { TimelineAggregator } from '../timeline/aggregator';
import type { AgentPane, AgentEvent } from '../types';

describe('TimelineAggregator', () => {
  let aggregator: TimelineAggregator;

  beforeEach(() => {
    aggregator = new TimelineAggregator();
  });

  describe('aggregate', () => {
    it('should aggregate agent panes and events correctly', () => {
      const agentPanes: AgentPane[] = [
        {
          id: '%1',
          window: 'Miyabi',
          title: '🌸 カエデ (Implementation)',
          pid: 12345,
          active: true,
          width: 120,
          height: 30,
          currentPath: '/Users/test',
          agentName: 'カエデ',
          state: 'RUN',
          lastActivity: new Date(),
        },
        {
          id: '%2',
          window: 'Miyabi',
          title: '🎺 サクラ (Review)',
          pid: 12346,
          active: false,
          width: 120,
          height: 30,
          currentPath: '/Users/test',
          agentName: 'サクラ',
          state: 'IDLE',
        },
        {
          id: '%3',
          window: 'Miyabi',
          title: '🌼 ツバキ (Testing)',
          pid: 99999,
          active: false,
          width: 120,
          height: 30,
          currentPath: '/Users/test',
          agentName: 'ツバキ',
          state: 'DEAD',
        },
      ];

      const recentEvents: AgentEvent[] = [
        {
          timestamp: new Date(),
          agentName: 'カエデ',
          eventType: 'task_complete',
          issueNumber: 123,
          taskDescription: 'Completed feature X',
        },
      ];

      const result = aggregator.aggregate('Miyabi', agentPanes, recentEvents);

      expect(result.windowName).toBe('Miyabi');
      expect(result.agentStates).toEqual({
        RUN: 1,
        IDLE: 1,
        DEAD: 1,
      });
      expect(result.activeAgents).toEqual(['カエデ']);
      expect(result.recentEvents).toHaveLength(1);
    });

    it('should handle empty agent panes', () => {
      const result = aggregator.aggregate('Miyabi', [], []);

      expect(result.agentStates).toEqual({
        RUN: 0,
        IDLE: 0,
        DEAD: 0,
      });
      expect(result.activeAgents).toEqual([]);
      expect(result.recentEvents).toEqual([]);
    });
  });

  describe('getMostRecentEventByAgent', () => {
    it('should return most recent event for each agent', () => {
      const events: AgentEvent[] = [
        {
          timestamp: new Date('2024-11-05T10:00:00Z'),
          agentName: 'カエデ',
          eventType: 'task_start',
        },
        {
          timestamp: new Date('2024-11-05T11:00:00Z'),
          agentName: 'カエデ',
          eventType: 'task_complete',
        },
        {
          timestamp: new Date('2024-11-05T10:30:00Z'),
          agentName: 'サクラ',
          eventType: 'task_start',
        },
      ];

      const mostRecent = aggregator.getMostRecentEventByAgent(events);

      expect(mostRecent.size).toBe(2);
      expect(mostRecent.get('カエデ')?.eventType).toBe('task_complete');
      expect(mostRecent.get('サクラ')?.eventType).toBe('task_start');
    });
  });

  describe('filterEventsByTimeWindow', () => {
    it('should filter events within time window', () => {
      const now = Date.now();
      const events: AgentEvent[] = [
        {
          timestamp: new Date(now - 30 * 60 * 1000), // 30 minutes ago
          agentName: 'カエデ',
          eventType: 'task_complete',
        },
        {
          timestamp: new Date(now - 90 * 60 * 1000), // 90 minutes ago
          agentName: 'サクラ',
          eventType: 'task_complete',
        },
      ];

      const filtered = aggregator.filterEventsByTimeWindow(events, 60);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].agentName).toBe('カエデ');
    });
  });

  describe('calculateProductivityScore', () => {
    it('should calculate productivity score based on events', () => {
      const events: AgentEvent[] = [
        {
          timestamp: new Date(),
          agentName: 'カエデ',
          eventType: 'task_complete',
        },
        {
          timestamp: new Date(),
          agentName: 'カエデ',
          eventType: 'task_start',
        },
        {
          timestamp: new Date(),
          agentName: 'サクラ',
          eventType: 'task_complete',
        },
      ];

      const score = aggregator.calculateProductivityScore('カエデ', events, 60);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return 0 for agent with no events', () => {
      const events: AgentEvent[] = [];

      const score = aggregator.calculateProductivityScore('カエデ', events, 60);

      expect(score).toBe(0);
    });
  });

  describe('generateSummaryStats', () => {
    it('should generate summary statistics', () => {
      const aggregation = {
        timestamp: new Date(),
        windowName: 'Miyabi',
        agentStates: {
          RUN: 2,
          IDLE: 1,
          DEAD: 0,
        },
        recentEvents: [],
        activeAgents: ['カエデ', 'サクラ'],
      };

      const allEvents: AgentEvent[] = [
        {
          timestamp: new Date(),
          agentName: 'カエデ',
          eventType: 'task_complete',
        },
        {
          timestamp: new Date(),
          agentName: 'サクラ',
          eventType: 'task_failed',
        },
      ];

      const stats = aggregator.generateSummaryStats(aggregation, allEvents);

      expect(stats.totalAgents).toBe(3);
      expect(stats.activeAgents).toBe(2);
      expect(stats.idleAgents).toBe(1);
      expect(stats.deadAgents).toBe(0);
      expect(stats.totalEvents).toBe(2);
      expect(stats.completedTasks).toBe(1);
      expect(stats.failedTasks).toBe(1);
    });
  });
});
