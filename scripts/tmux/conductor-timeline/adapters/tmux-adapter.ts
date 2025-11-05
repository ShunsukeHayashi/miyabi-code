/**
 * Tmux Adapter
 *
 * Abstraction layer for tmux CLI operations to support pane monitoring
 * and agent state detection.
 */

import { execSync } from 'child_process';
import type { TmuxPane, AgentPane, AgentState } from '../types';

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Shell command failed: ${command}\n${errorMessage}`);
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
// Tmux Adapter Class
// ============================================================================

export class TmuxAdapter {
  private executor: ShellExecutor;

  constructor(executor?: ShellExecutor) {
    this.executor = executor || new RealShellExecutor();
  }

  /**
   * List all panes in a specific window
   *
   * @param windowName - Window name (e.g., "Miyabi", "10")
   * @returns Array of pane information
   */
  listPanes(windowName: string): TmuxPane[] {
    try {
      const output = this.executor.execute(
        `tmux list-panes -t ${windowName} -F "#{pane_id}|#{window_name}|#{pane_title}|#{pane_pid}|#{pane_active}|#{pane_width}|#{pane_height}|#{pane_current_path}"`
      );

      return this.parsePanes(output);
    } catch (error) {
      console.error(`Failed to list panes for window: ${windowName}`, error);
      return [];
    }
  }

  /**
   * Parse tmux panes output
   *
   * @param output - Raw output from `tmux list-panes` command
   * @returns Array of parsed pane information
   */
  private parsePanes(output: string): TmuxPane[] {
    return output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => {
        const [id, window, title, pid, active, width, height, currentPath] = line.split('|');

        return {
          id,
          window,
          title,
          pid: parseInt(pid, 10),
          active: active === '1',
          width: parseInt(width, 10),
          height: parseInt(height, 10),
          currentPath,
        };
      });
  }

  /**
   * Capture pane content for activity analysis
   *
   * @param paneId - Pane identifier (e.g., "%1", "%2")
   * @param lines - Number of lines to capture (default: 100)
   * @returns Captured pane content as string
   */
  capturePaneContent(paneId: string, lines: number = 100): string {
    try {
      return this.executor.execute(`tmux capture-pane -t ${paneId} -p -S -${lines}`);
    } catch (error) {
      console.error(`Failed to capture pane content: ${paneId}`, error);
      return '';
    }
  }

  /**
   * Send text to a specific pane
   *
   * @param paneId - Pane identifier
   * @param text - Text to send
   * @param pressEnter - Whether to press Enter after sending text
   */
  sendKeys(paneId: string, text: string, pressEnter: boolean = false): void {
    try {
      this.executor.execute(`tmux send-keys -t ${paneId} "${text.replace(/"/g, '\\"')}"`);
      if (pressEnter) {
        this.executor.execute(`tmux send-keys -t ${paneId} Enter`);
      }
    } catch (error) {
      console.error(`Failed to send keys to pane: ${paneId}`, error);
    }
  }

  /**
   * Extract agent name from pane title
   *
   * Pane titles follow formats like:
   * - "🌸 カエデ (Implementation)"
   * - "🎺 サクラ (Review)"
   * - "🌼 ツバキ (Testing)"
   *
   * @param paneTitle - Pane title from tmux
   * @returns Extracted agent name or undefined
   */
  extractAgentName(paneTitle: string): string | undefined {
    // Match patterns like "🎺 サクラ (Review)" -> "サクラ"
    const agentMatch = paneTitle.match(/[\u{1F3BA}\u{1F338}\u{1F33C}\u{1F4AE}\u{1F3F5}\u{2733}]\s+(\S+)\s*\(/u);
    if (agentMatch) {
      return agentMatch[1];
    }

    // Match patterns like "カエデ" without parentheses
    const simpleMatch = paneTitle.match(/[\u{1F3BA}\u{1F338}\u{1F33C}\u{1F4AE}\u{1F3F5}\u{2733}]\s+(\S+)/u);
    if (simpleMatch) {
      return simpleMatch[1];
    }

    return undefined;
  }

  /**
   * Determine agent state based on pane activity
   *
   * @param pane - Pane information
   * @param content - Recent pane content
   * @returns Agent state (RUN, IDLE, DEAD)
   */
  determineAgentState(pane: TmuxPane, content: string): AgentState {
    // Check for process activity
    const hasRecentActivity = this.hasRecentActivity(content);
    const isProcessRunning = this.isProcessRunning(pane.pid);

    if (!isProcessRunning) {
      return 'DEAD';
    }

    if (hasRecentActivity) {
      return 'RUN';
    }

    return 'IDLE';
  }

  /**
   * Check if pane has recent activity
   *
   * @param content - Pane content
   * @returns True if recent activity detected
   */
  private hasRecentActivity(content: string): boolean {
    // Look for common activity indicators
    const activityIndicators = [
      /\[.*\]\s+[A-Z]+:/i, // Log messages like "[INFO] Processing..."
      /Running|Executing|Processing/i,
      /✓|✗|→|⚠️/, // Progress indicators
      /\d{2}:\d{2}:\d{2}/, // Timestamps
    ];

    return activityIndicators.some((pattern) => pattern.test(content));
  }

  /**
   * Check if process is running
   *
   * @param pid - Process ID
   * @returns True if process exists
   */
  private isProcessRunning(pid: number): boolean {
    try {
      const output = this.executor.execute(`ps -p ${pid}`);
      return output.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert TmuxPane to AgentPane with state detection
   *
   * @param pane - Tmux pane information
   * @returns Agent pane with state
   */
  async toAgentPane(pane: TmuxPane): Promise<AgentPane> {
    const agentName = this.extractAgentName(pane.title);
    const content = this.capturePaneContent(pane.id, 50);
    const state = this.determineAgentState(pane, content);

    return {
      ...pane,
      agentName,
      state,
      lastActivity: state === 'RUN' ? new Date() : undefined,
    };
  }

  /**
   * Get all agent panes from a window
   *
   * @param windowName - Window name
   * @returns Array of agent panes with states
   */
  async getAgentPanes(windowName: string): Promise<AgentPane[]> {
    const panes = this.listPanes(windowName);
    const agentPanes = await Promise.all(panes.map((pane) => this.toAgentPane(pane)));

    // Filter only panes with agent names
    return agentPanes.filter((pane) => pane.agentName !== undefined);
  }
}
