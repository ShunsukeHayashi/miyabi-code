/**
 * Miyabi JSON Data Loader
 *
 * Loads and parses JSON data from various .ai/ directories:
 * - .ai/sessions (recursive) - Claude Code session metadata
 * - .ai/logs (recursive) - Agent execution logs
 * - .ai/codex-tasks (recursive) - Codex task status and results
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SessionData, CodexTaskStatus, ToolResult } from '../types/gradebook';

// ============================================================================
// JSON Loader Class
// ============================================================================

export class JSONLoader {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  /**
   * Load all session JSON files from .ai/sessions directory
   *
   * @param sessionsDir - Relative path to sessions directory (default: ".ai/sessions")
   * @returns Array of parsed session data
   */
  loadSessions(sessionsDir: string = '.ai/sessions'): SessionData[] {
    const fullPath = path.join(this.baseDir, sessionsDir);
    const sessionFiles = this.findJSONFiles(fullPath);

    return sessionFiles.map((file) => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(content);
        return this.normalizeSessionData(data, file);
      } catch (error: any) {
        console.warn(`Failed to parse session file ${file}: ${error.message}`);
        return null;
      }
    }).filter((data): data is SessionData => data !== null);
  }

  /**
   * Load all codex task status files from .ai/codex-tasks directory
   *
   * @param codexDir - Relative path to codex-tasks directory (default: ".ai/codex-tasks")
   * @returns Array of parsed codex task status
   */
  loadCodexTasks(codexDir: string = '.ai/codex-tasks'): CodexTaskStatus[] {
    const fullPath = path.join(this.baseDir, codexDir);
    const statusFiles = this.findJSONFiles(fullPath, 'status.json');

    return statusFiles.map((file) => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(content);
        return this.normalizeCodexTaskStatus(data, file);
      } catch (error: any) {
        console.warn(`Failed to parse codex task file ${file}: ${error.message}`);
        return null;
      }
    }).filter((data): data is CodexTaskStatus => data !== null);
  }

  /**
   * Load all log files from .ai/logs directory
   *
   * @param logsDir - Relative path to logs directory (default: ".ai/logs")
   * @returns Array of parsed log data (generic JSON objects)
   */
  loadLogs(logsDir: string = '.ai/logs'): Record<string, any>[] {
    const fullPath = path.join(this.baseDir, logsDir);
    const logFiles = this.findJSONFiles(fullPath);

    return logFiles.map((file) => {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(content);
        return { ...data, _source_file: file };
      } catch (error: any) {
        console.warn(`Failed to parse log file ${file}: ${error.message}`);
        return null;
      }
    }).filter((data): data is Record<string, any> => data !== null);
  }

  /**
   * Load a specific JSON file
   *
   * @param relativePath - Relative path to JSON file
   * @returns Parsed JSON data or null on error
   */
  loadFile(relativePath: string): Record<string, any> | null {
    const fullPath = path.join(this.baseDir, relativePath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      return null;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      console.warn(`Failed to parse file ${fullPath}: ${error.message}`);
      return null;
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Recursively find all JSON files in a directory
   *
   * @param dir - Directory to search
   * @param filenamePattern - Optional filename pattern to match (e.g., "status.json")
   * @returns Array of absolute file paths
   */
  private findJSONFiles(dir: string, filenamePattern?: string): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.findJSONFiles(fullPath, filenamePattern));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        if (!filenamePattern || entry.name === filenamePattern) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Normalize session data to SessionData type
   *
   * @param raw - Raw JSON data from session file
   * @param filePath - Source file path for debugging
   * @returns Normalized SessionData
   */
  private normalizeSessionData(raw: any, filePath: string): SessionData {
    return {
      session_id: raw.session_id || path.basename(filePath, '.json'),
      task: raw.task || raw.title || 'Unknown Task',
      agent_type: raw.agent_type || raw.agentType || raw.agent,
      status: raw.status || 'unknown',
      started_at: raw.started_at || raw.startedAt || raw.created_at || new Date().toISOString(),
      ended_at: raw.ended_at || raw.endedAt || raw.completed_at,
      tool_results: this.normalizeToolResults(raw.tool_results || raw.toolResults || []),
      metadata: raw.metadata || raw,
    };
  }

  /**
   * Normalize codex task status to CodexTaskStatus type
   *
   * @param raw - Raw JSON data from codex task file
   * @param filePath - Source file path for debugging
   * @returns Normalized CodexTaskStatus
   */
  private normalizeCodexTaskStatus(raw: any, filePath: string): CodexTaskStatus {
    return {
      task_id: raw.task_id || raw.taskId || path.basename(path.dirname(filePath)),
      issue_number: raw.issue_number || raw.issueNumber,
      status: raw.status || 'unknown',
      agent_type: raw.agent_type || raw.agentType,
      started_at: raw.started_at || raw.startedAt || new Date().toISOString(),
      completed_at: raw.completed_at || raw.completedAt,
      result: raw.result,
    };
  }

  /**
   * Normalize tool results array
   *
   * @param raw - Raw tool results data
   * @returns Array of normalized ToolResult objects
   */
  private normalizeToolResults(raw: any[]): ToolResult[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((result) => ({
      tool_name: result.tool_name || result.toolName || result.tool || 'unknown',
      timestamp: result.timestamp || new Date().toISOString(),
      success: result.success !== false, // default to true if not specified
      output: result.output || result.stdout,
      error: result.error || result.stderr,
    }));
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract issue number from session ID or task name
 *
 * Examples:
 * - "issue-270-feature" -> 270
 * - "codex-issue-688" -> 688
 * - "Fix bug in #123" -> 123
 *
 * @param text - Text to search for issue number
 * @returns Extracted issue number or undefined
 */
export function extractIssueNumber(text: string): number | undefined {
  // Match "issue-NNN" or "issue-NNN-*"
  const issueMatch = text.match(/issue[_-](\d+)/i);
  if (issueMatch) {
    return parseInt(issueMatch[1], 10);
  }

  // Match "#NNN" anywhere in text
  const hashMatch = text.match(/#(\d+)/);
  if (hashMatch) {
    return parseInt(hashMatch[1], 10);
  }

  return undefined;
}

/**
 * Group sessions by agent type
 *
 * @param sessions - Array of session data
 * @returns Map of agent type to sessions
 */
export function groupSessionsByAgent(sessions: SessionData[]): Map<string, SessionData[]> {
  const grouped = new Map<string, SessionData[]>();

  for (const session of sessions) {
    const agentType = session.agent_type || 'unknown';
    if (!grouped.has(agentType)) {
      grouped.set(agentType, []);
    }
    grouped.get(agentType)!.push(session);
  }

  return grouped;
}

/**
 * Filter sessions by date range
 *
 * @param sessions - Array of session data
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Filtered sessions
 */
export function filterSessionsByDateRange(
  sessions: SessionData[],
  startDate: Date,
  endDate: Date
): SessionData[] {
  return sessions.filter((session) => {
    const sessionDate = new Date(session.started_at);
    return sessionDate >= startDate && sessionDate <= endDate;
  });
}

/**
 * Calculate total duration from sessions
 *
 * @param sessions - Array of session data
 * @returns Total duration in seconds, or undefined if no durations available
 */
export function calculateTotalDuration(sessions: SessionData[]): number | undefined {
  let totalSeconds = 0;
  let hasAnyDuration = false;

  for (const session of sessions) {
    if (session.started_at && session.ended_at) {
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.ended_at).getTime();
      const durationMs = end - start;

      if (durationMs > 0) {
        totalSeconds += Math.floor(durationMs / 1000);
        hasAnyDuration = true;
      }
    }
  }

  return hasAnyDuration ? totalSeconds : undefined;
}
