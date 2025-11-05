/**
 * Tmux Adapter
 *
 * Abstracts tmux CLI interactions for conductor timeline monitoring.
 * Provides testable interface for tmux command execution.
 */

import { execSync } from 'child_process';
import type { AgentPaneInfo, AgentState } from '../types/index.js';

// ============================================================================
// Shell Executor Interface
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
      const err = error as Error & { message: string };
      throw new Error(`Shell command failed: ${command}\n${err.message}`);
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
   * Get all panes in a tmux session
   */
  getPanes(sessionName: string): AgentPaneInfo[] {
    try {
      const output = this.executor.execute(
        `tmux list-panes -t ${sessionName} -F "#{pane_id}|#{pane_title}|#{pane_current_command}|#{pane_pid}"`
      );

      return output
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => this.parsePaneLine(line));
    } catch (error) {
      console.error(`Failed to get panes for session ${sessionName}:`, error);
      return [];
    }
  }

  /**
   * Parse a single pane line from tmux output
   */
  private parsePaneLine(line: string): AgentPaneInfo {
    const [pane_id, pane_title, current_command, pid] = line.split('|');

    const agent_name = this.extractAgentName(pane_title);
    const agent_type = this.extractAgentType(pane_title);
    const state = this.detectAgentState(current_command, pane_title);

    return {
      pane_id,
      pane_title,
      agent_name,
      agent_type,
      state,
      current_command,
      pid: parseInt(pid, 10),
    };
  }

  /**
   * Extract agent name from pane title
   *
   * Supports formats like:
   * - "🎺 サクラ (Review)"
   * - "🌸 キキョウ (Issue)"
   * - "✳ tmux評価システム設計"
   */
  private extractAgentName(paneTitle: string): string | null {
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
   */
  private extractAgentType(paneTitle: string): string | null {
    // Match patterns like "🎺 サクラ (Review)" -> "Review"
    const typeMatch = paneTitle.match(/\(([^)]+)\)/);
    return typeMatch ? typeMatch[1] : null;
  }

  /**
   * Detect agent state based on current command and pane title
   */
  private detectAgentState(currentCommand: string, _paneTitle: string): AgentState {
    // DEAD: If running bash/zsh shell only (not Claude Code)
    if (currentCommand === 'bash' || currentCommand === 'zsh' || currentCommand === 'sh') {
      return 'DEAD';
    }

    // RUN: If running a process that indicates active work
    if (
      currentCommand.includes('node') ||
      currentCommand.includes('cargo') ||
      currentCommand.includes('claude') ||
      currentCommand.includes('npm') ||
      currentCommand.includes('tsx')
    ) {
      return 'RUN';
    }

    // IDLE: Running Claude Code but no active execution
    // This would require pane content inspection for accurate detection
    return 'IDLE';
  }

  /**
   * Capture pane content for detailed state detection
   */
  capturePaneContent(paneId: string, startLine: number = -100): string {
    try {
      return this.executor.execute(`tmux capture-pane -t ${paneId} -p -S ${startLine}`);
    } catch (error) {
      console.error(`Failed to capture pane ${paneId}:`, error);
      return '';
    }
  }

  /**
   * Send text to a tmux pane
   */
  sendToPaneCommand(paneId: string, text: string): void {
    try {
      // Use double send-keys pattern for reliable input
      this.executor.execute(`tmux send-keys -t ${paneId} "${text.replace(/"/g, '\\"')}"`);
      // Small delay
      setTimeout(() => {
        this.executor.execute(`tmux send-keys -t ${paneId} Enter`);
      }, 100);
    } catch (error) {
      console.error(`Failed to send to pane ${paneId}:`, error);
    }
  }

  /**
   * Check if session exists
   */
  sessionExists(sessionName: string): boolean {
    try {
      this.executor.execute(`tmux has-session -t ${sessionName} 2>&1`);
      return true;
    } catch {
      return false;
    }
  }
}
