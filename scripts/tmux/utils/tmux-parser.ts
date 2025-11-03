/**
 * Miyabi tmux Parser
 *
 * Parses tmux command outputs and converts them into structured TypeScript objects.
 * Supports testability by abstracting shell interactions behind an interface.
 */

import { execSync } from 'child_process';
import type { TmuxSessionInfo, TmuxPaneInfo } from '../types/gradebook';

// ============================================================================
// Shell Abstraction Interface
// ============================================================================

export interface ShellExecutor {
  execute(command: string): string;
}

/**
 * Real shell executor using child_process.execSync
 */
export class RealShellExecutor implements ShellExecutor {
  execute(command: string): string {
    try {
      return execSync(command, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    } catch (error: any) {
      throw new Error(`Shell command failed: ${command}\n${error.message}`);
    }
  }
}

/**
 * Mock shell executor for testing
 */
export class MockShellExecutor implements ShellExecutor {
  private responses: Map<string, string> = new Map();

  setResponse(command: string, response: string): void {
    this.responses.set(command, response);
  }

  execute(command: string): string {
    const response = this.responses.get(command);
    if (response === undefined) {
      throw new Error(`No mock response configured for command: ${command}`);
    }
    return response;
  }
}

// ============================================================================
// Tmux Parser Class
// ============================================================================

export class TmuxParser {
  private executor: ShellExecutor;

  constructor(executor?: ShellExecutor) {
    this.executor = executor || new RealShellExecutor();
  }

  /**
   * Parse tmux session information
   *
   * @param sessionName - Name of the tmux session to parse
   * @returns Parsed session information with panes
   */
  parseSession(sessionName: string): TmuxSessionInfo {
    const sessionOutput = this.executor.execute(
      `tmux list-sessions -F "#{session_name}|#{session_created}|#{session_attached}" | grep "^${sessionName}|"`
    );

    const [name, created, attached] = sessionOutput.trim().split('|');

    const panesOutput = this.executor.execute(
      `tmux list-panes -t ${sessionName} -F "#{pane_id}|#{pane_title}|#{pane_current_command}|#{pane_pid}|#{pane_active}|#{pane_width}|#{pane_height}"`
    );

    const panes = this.parsePanes(panesOutput);

    return {
      session_name: name,
      session_created: parseInt(created, 10),
      session_attached: parseInt(attached, 10),
      panes,
    };
  }

  /**
   * Parse tmux panes output
   *
   * @param output - Raw output from `tmux list-panes` command
   * @returns Array of parsed pane information
   */
  private parsePanes(output: string): TmuxPaneInfo[] {
    return output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        const [pane_id, pane_title, pane_current_command, pane_pid, pane_active, pane_width, pane_height] =
          line.split('|');

        return {
          pane_id,
          pane_title,
          pane_current_command,
          pane_pid: parseInt(pane_pid, 10),
          pane_active: pane_active === '1',
          pane_width: parseInt(pane_width, 10),
          pane_height: parseInt(pane_height, 10),
        };
      });
  }

  /**
   * Capture pane content for analysis
   *
   * @param paneId - Pane identifier (e.g., "%1", "%2")
   * @param startLine - Optional start line (-S parameter for tmux)
   * @returns Captured pane content as string
   */
  capturePaneContent(paneId: string, startLine?: number): string {
    const startLineArg = startLine !== undefined ? `-S ${startLine}` : '-S -100';
    return this.executor.execute(`tmux capture-pane -t ${paneId} -p ${startLineArg}`);
  }

  /**
   * Extract agent name from pane title
   *
   * Pane titles follow formats like:
   * - "✳ tmux評価システム設計"
   * - "🎺 サクラ (Review)"
   * - "🌸 キキョウ (Issue)"
   *
   * @param paneTitle - Pane title from tmux
   * @returns Extracted agent name or null
   */
  extractAgentName(paneTitle: string): string | null {
    // Match patterns like "🎺 サクラ (Review)" -> "サクラ"
    const agentMatch = paneTitle.match(/[🎺🌸🌼💮🏵️✳️]\s+(\S+)\s*\(/);
    if (agentMatch) {
      return agentMatch[1];
    }

    // Match patterns like "カエデ" without parentheses
    const simpleMatch = paneTitle.match(/[🎺🌸🌼💮🏵️✳️]\s+(\S+)/);
    if (simpleMatch) {
      return simpleMatch[1];
    }

    return null;
  }

  /**
   * Extract agent type from pane title
   *
   * @param paneTitle - Pane title from tmux
   * @returns Extracted agent type or null
   */
  extractAgentType(paneTitle: string): string | null {
    // Match patterns like "🎺 サクラ (Review)" -> "Review"
    const typeMatch = paneTitle.match(/\(([^)]+)\)/);
    return typeMatch ? typeMatch[1] : null;
  }

  /**
   * Map agent name to agent key used in data structures
   *
   * @param agentName - Human-readable agent name (e.g., "カエデ", "サクラ")
   * @returns Agent key for data structures (e.g., "kaede_codex1", "sakura_codex2")
   */
  mapAgentNameToKey(agentName: string): string {
    const keyMap: Record<string, string> = {
      カエデ: 'kaede_codex1',
      サクラ: 'sakura_codex2',
      ツバキ: 'tsubaki_codex3',
      ボタン: 'botan_codex4',
      キキョウ: 'kikyo_codex5',
      アヤメ: 'ayame_codex6',
      スミレ: 'sumire_codex7',
    };
    return keyMap[agentName] || agentName.toLowerCase();
  }

  /**
   * Check if session exists
   *
   * @param sessionName - Name of the tmux session
   * @returns True if session exists, false otherwise
   */
  sessionExists(sessionName: string): boolean {
    try {
      this.executor.execute(`tmux has-session -t ${sessionName} 2>&1`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all session names
   *
   * @returns Array of session names
   */
  getAllSessions(): string[] {
    try {
      const output = this.executor.execute(`tmux list-sessions -F "#{session_name}"`);
      return output
        .trim()
        .split('\n')
        .filter((line) => line.length > 0);
    } catch (error) {
      return [];
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse duration from human-readable format (e.g., "1h 23m", "45m 12s", "30s")
 *
 * @param durationStr - Duration string
 * @returns Duration in seconds, or undefined if parsing fails
 */
export function parseDuration(durationStr: string): number | undefined {
  const hours = durationStr.match(/(\d+)h/);
  const minutes = durationStr.match(/(\d+)m/);
  const seconds = durationStr.match(/(\d+)s/);

  let totalSeconds = 0;

  if (hours) totalSeconds += parseInt(hours[1], 10) * 3600;
  if (minutes) totalSeconds += parseInt(minutes[1], 10) * 60;
  if (seconds) totalSeconds += parseInt(seconds[1], 10);

  return totalSeconds > 0 ? totalSeconds : undefined;
}

/**
 * Format duration in seconds to human-readable string
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration (e.g., "1h 23m", "45m 12s", "30s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}
