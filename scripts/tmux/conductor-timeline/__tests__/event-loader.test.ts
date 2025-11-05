/**
 * Event Loader Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventLoader } from '../events/event-loader';
import type { EventLoaderConfig } from '../types';

describe('EventLoader', () => {
  let testDir: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'event-loader-test-'));
  });

  afterEach(() => {
    // Cleanup test directory
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('loadRecentEvents', () => {
    it('should load events from JSON file', () => {
      const logFile = path.join(testDir, 'agent_log.json');
      const events = [
        {
          timestamp: new Date().toISOString(),
          agentName: 'カエデ',
          eventType: 'task_complete',
          issueNumber: 123,
          taskDescription: 'Implement feature X',
        },
      ];
      fs.writeFileSync(logFile, JSON.stringify(events), 'utf-8');

      const config: EventLoaderConfig = {
        logsPath: testDir,
        lookbackMinutes: 60,
        patterns: ['.json'],
      };

      const loader = new EventLoader(config);
      const loaded = loader.loadRecentEvents();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].agentName).toBe('カエデ');
      expect(loaded[0].eventType).toBe('task_complete');
      expect(loaded[0].issueNumber).toBe(123);
    });

    it('should load events from JSONL file', () => {
      const logFile = path.join(testDir, 'agent_log.jsonl');
      const event1 = {
        timestamp: new Date().toISOString(),
        agentName: 'カエデ',
        eventType: 'task_start',
      };
      const event2 = {
        timestamp: new Date().toISOString(),
        agentName: 'サクラ',
        eventType: 'task_complete',
      };
      fs.writeFileSync(logFile, JSON.stringify(event1) + '\n' + JSON.stringify(event2), 'utf-8');

      const config: EventLoaderConfig = {
        logsPath: testDir,
        lookbackMinutes: 60,
        patterns: ['.jsonl'],
      };

      const loader = new EventLoader(config);
      const loaded = loader.loadRecentEvents();

      expect(loaded).toHaveLength(2);
      // Both events have same timestamp (Date.now()), so order may vary
      const agentNames = loaded.map((e) => e.agentName).sort();
      expect(agentNames).toEqual(['カエデ', 'サクラ']);
    });

    it('should filter events by lookback window', () => {
      const logFile = path.join(testDir, 'agent_log.json');
      const now = Date.now();
      const events = [
        {
          timestamp: new Date(now - 30 * 60 * 1000).toISOString(), // 30 minutes ago
          agentName: 'カエデ',
          eventType: 'task_complete',
        },
        {
          timestamp: new Date(now - 90 * 60 * 1000).toISOString(), // 90 minutes ago
          agentName: 'サクラ',
          eventType: 'task_complete',
        },
      ];
      fs.writeFileSync(logFile, JSON.stringify(events), 'utf-8');

      const config: EventLoaderConfig = {
        logsPath: testDir,
        lookbackMinutes: 60, // Only last 60 minutes
        patterns: ['.json'],
      };

      const loader = new EventLoader(config);
      const loaded = loader.loadRecentEvents();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].agentName).toBe('カエデ');
    });

    it('should return empty array when no log files exist', () => {
      const config: EventLoaderConfig = {
        logsPath: testDir,
        lookbackMinutes: 60,
        patterns: ['.json'],
      };

      const loader = new EventLoader(config);
      const loaded = loader.loadRecentEvents();

      expect(loaded).toEqual([]);
    });

    it('should handle subdirectories recursively', () => {
      const subDir = path.join(testDir, 'subdir');
      fs.mkdirSync(subDir);

      const logFile1 = path.join(testDir, 'log1.json');
      const logFile2 = path.join(subDir, 'log2.json');

      fs.writeFileSync(
        logFile1,
        JSON.stringify([
          {
            timestamp: new Date().toISOString(),
            agentName: 'カエデ',
            eventType: 'task_complete',
          },
        ]),
        'utf-8'
      );

      fs.writeFileSync(
        logFile2,
        JSON.stringify([
          {
            timestamp: new Date().toISOString(),
            agentName: 'サクラ',
            eventType: 'task_start',
          },
        ]),
        'utf-8'
      );

      const config: EventLoaderConfig = {
        logsPath: testDir,
        lookbackMinutes: 60,
        patterns: ['.json'],
      };

      const loader = new EventLoader(config);
      const loaded = loader.loadRecentEvents();

      expect(loaded).toHaveLength(2);
      expect(loaded.map((e) => e.agentName).sort()).toEqual(['カエデ', 'サクラ']);
    });
  });
});
