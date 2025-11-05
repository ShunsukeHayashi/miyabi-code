/**
 * Event Loader
 *
 * Loads agent execution events from .ai/logs directory
 * and provides filtering by time range.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AgentEvent, EventLoaderConfig } from '../types';

// ============================================================================
// Event Loader Class
// ============================================================================

export class EventLoader {
  private config: EventLoaderConfig;

  constructor(config: EventLoaderConfig) {
    this.config = config;
  }

  /**
   * Load all recent events within the lookback window
   *
   * @returns Array of agent events sorted by timestamp (newest first)
   */
  loadRecentEvents(): AgentEvent[] {
    const allEvents = this.loadAllEvents();
    const cutoffTime = new Date(Date.now() - this.config.lookbackMinutes * 60 * 1000);

    return allEvents
      .filter((event) => event.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Load all events from log files
   *
   * @returns Array of all agent events
   */
  private loadAllEvents(): AgentEvent[] {
    const logFiles = this.findLogFiles();
    const events: AgentEvent[] = [];

    for (const file of logFiles) {
      const fileEvents = this.parseLogFile(file);
      events.push(...fileEvents);
    }

    return events;
  }

  /**
   * Find all log files matching configured patterns
   *
   * @returns Array of absolute file paths
   */
  private findLogFiles(): string[] {
    if (!fs.existsSync(this.config.logsPath)) {
      console.warn(`Logs directory not found: ${this.config.logsPath}`);
      return [];
    }

    const files: string[] = [];
    const entries = fs.readdirSync(this.config.logsPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(this.config.logsPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subConfig = { ...this.config, logsPath: fullPath };
        const subLoader = new EventLoader(subConfig);
        files.push(...subLoader.findLogFiles());
      } else if (entry.isFile() && this.matchesPattern(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Check if filename matches configured patterns
   *
   * @param filename - Filename to check
   * @returns True if matches any pattern
   */
  private matchesPattern(filename: string): boolean {
    const patterns = this.config.patterns || ['.json', '.jsonl'];

    return patterns.some((pattern) => filename.endsWith(pattern));
  }

  /**
   * Parse log file and extract agent events
   *
   * Supports both single JSON and JSON Lines (.jsonl) formats
   *
   * @param filePath - Path to log file
   * @returns Array of agent events
   */
  private parseLogFile(filePath: string): AgentEvent[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Try JSON Lines format first
      if (filePath.endsWith('.jsonl')) {
        return this.parseJSONLines(content, filePath);
      }

      // Try single JSON object
      return this.parseSingleJSON(content, filePath);
    } catch (error) {
      console.warn(`Failed to parse log file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Parse JSON Lines format
   *
   * @param content - File content
   * @param filePath - Source file path
   * @returns Array of agent events
   */
  private parseJSONLines(content: string, filePath: string): AgentEvent[] {
    const events: AgentEvent[] = [];
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        const event = this.normalizeEvent(data, filePath);
        if (event) {
          events.push(event);
        }
      } catch (error) {
        console.warn(`Failed to parse JSON line in ${filePath}:`, error);
      }
    }

    return events;
  }

  /**
   * Parse single JSON object
   *
   * @param content - File content
   * @param filePath - Source file path
   * @returns Array of agent events
   */
  private parseSingleJSON(content: string, filePath: string): AgentEvent[] {
    try {
      const data = JSON.parse(content);

      // If it's an array, process each item
      if (Array.isArray(data)) {
        return data
          .map((item) => this.normalizeEvent(item, filePath))
          .filter((event): event is AgentEvent => event !== null);
      }

      // Single object
      const event = this.normalizeEvent(data, filePath);
      return event ? [event] : [];
    } catch (error) {
      console.warn(`Failed to parse JSON file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Normalize raw log data to AgentEvent
   *
   * @param raw - Raw log data
   * @param filePath - Source file path for debugging
   * @returns Normalized AgentEvent or null if invalid
   */
  private normalizeEvent(raw: unknown, filePath: string): AgentEvent | null {
    if (typeof raw !== 'object' || raw === null) {
      return null;
    }

    const obj = raw as Record<string, unknown>;

    // Extract timestamp
    const timestamp = this.extractTimestamp(obj);
    if (!timestamp) {
      console.warn(`Missing timestamp in ${filePath}:`, obj);
      return null;
    }

    // Extract agent name
    const agentName = this.extractAgentName(obj);
    if (!agentName) {
      console.warn(`Missing agent name in ${filePath}:`, obj);
      return null;
    }

    // Extract event type
    const eventType = this.extractEventType(obj);

    return {
      timestamp,
      agentName,
      eventType,
      issueNumber: this.extractIssueNumber(obj),
      taskDescription: this.extractTaskDescription(obj),
      metadata: obj as Record<string, unknown>,
    };
  }

  /**
   * Extract timestamp from raw data
   */
  private extractTimestamp(obj: Record<string, unknown>): Date | null {
    const candidates = [
      obj.timestamp,
      obj.time,
      obj.created_at,
      obj.createdAt,
      obj.date,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        const date = new Date(candidate);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Extract agent name from raw data
   */
  private extractAgentName(obj: Record<string, unknown>): string | null {
    const candidates = [
      obj.agent_name,
      obj.agentName,
      obj.agent,
      obj.name,
      obj.executor,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Extract event type from raw data
   */
  private extractEventType(obj: Record<string, unknown>): AgentEvent['eventType'] {
    const typeStr = String(
      obj.event_type || obj.eventType || obj.type || obj.status || 'idle'
    ).toLowerCase();

    // Map various string representations to our event types
    if (typeStr.includes('start') || typeStr.includes('begin')) {
      return 'task_start';
    }
    if (typeStr.includes('complete') || typeStr.includes('success') || typeStr.includes('done')) {
      return 'task_complete';
    }
    if (typeStr.includes('fail') || typeStr.includes('error')) {
      return 'task_failed';
    }
    if (typeStr.includes('error')) {
      return 'error';
    }

    return 'idle';
  }

  /**
   * Extract issue number from raw data
   */
  private extractIssueNumber(obj: Record<string, unknown>): number | undefined {
    const candidates = [
      obj.issue_number,
      obj.issueNumber,
      obj.issue,
      obj.issue_id,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number') {
        return candidate;
      }
      if (typeof candidate === 'string') {
        const match = candidate.match(/\d+/);
        if (match) {
          return parseInt(match[0], 10);
        }
      }
    }

    // Try to extract from task description
    if (typeof obj.task === 'string' || typeof obj.description === 'string') {
      const text = String(obj.task || obj.description);
      const match = text.match(/#(\d+)|issue[_-](\d+)/i);
      if (match) {
        return parseInt(match[1] || match[2], 10);
      }
    }

    return undefined;
  }

  /**
   * Extract task description from raw data
   */
  private extractTaskDescription(obj: Record<string, unknown>): string | undefined {
    const candidates = [
      obj.task_description,
      obj.taskDescription,
      obj.description,
      obj.task,
      obj.message,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }

    return undefined;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create default EventLoaderConfig
 *
 * @param baseDir - Base directory (default: current working directory)
 * @param lookbackMinutes - Lookback time window in minutes (default: 60)
 * @returns EventLoaderConfig
 */
export function createDefaultConfig(
  baseDir: string = process.cwd(),
  lookbackMinutes: number = 60
): EventLoaderConfig {
  return {
    logsPath: path.join(baseDir, '.ai/logs'),
    lookbackMinutes,
    patterns: ['.json', '.jsonl'],
  };
}
