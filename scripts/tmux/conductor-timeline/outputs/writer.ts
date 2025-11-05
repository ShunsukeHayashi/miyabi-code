/**
 * Output Writer
 *
 * Writes formatted timeline reports to tmux panes and JSON log files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { TimelineReport, WriterConfig } from '../types';

// ============================================================================
// Writer Class
// ============================================================================

export class TimelineWriter {
  private config: WriterConfig;

  constructor(config: WriterConfig) {
    this.config = config;
  }

  /**
   * Write timeline report to configured outputs
   *
   * @param report - Timeline report to write
   */
  write(report: TimelineReport): void {
    // Write to tmux pane if configured
    if (this.config.tmuxPane) {
      this.writeToTmuxPane(report.humanReadable, this.config.tmuxPane);
    }

    // Write to JSON log file if configured
    if (this.config.jsonLogPath) {
      this.writeToJSONLog(report.jsonLog, this.config.jsonLogPath);
    }
  }

  /**
   * Write text to tmux pane
   *
   * @param text - Text to display
   * @param paneId - Tmux pane identifier
   */
  private writeToTmuxPane(text: string, paneId: string): void {
    try {
      // Clear pane content first
      execSync(`tmux send-keys -t ${paneId} C-l`, { encoding: 'utf-8' });

      // Send text line by line to avoid buffer overflow
      const lines = text.split('\n');
      for (const line of lines) {
        // Escape special characters for shell
        const escaped = line.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        execSync(`tmux send-keys -t ${paneId} "${escaped}"`, { encoding: 'utf-8' });
        execSync(`tmux send-keys -t ${paneId} Enter`, { encoding: 'utf-8' });
      }

      console.log(`✅ Report written to tmux pane: ${paneId}`);
    } catch (error) {
      console.error(`Failed to write to tmux pane ${paneId}:`, error);
    }
  }

  /**
   * Write JSON to log file
   *
   * @param jsonStr - JSON string to write
   * @param filePath - Target file path
   */
  private writeToJSONLog(jsonStr: string, filePath: string): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Append or overwrite based on config
      if (this.config.appendMode && fs.existsSync(filePath)) {
        // Append mode: add newline and JSON
        fs.appendFileSync(filePath, '\n' + jsonStr);
      } else {
        // Overwrite mode: write JSON
        fs.writeFileSync(filePath, jsonStr, 'utf-8');
      }

      console.log(`✅ Report written to JSON log: ${filePath}`);
    } catch (error) {
      console.error(`Failed to write to JSON log ${filePath}:`, error);
    }
  }

  /**
   * Write text to stdout (for CLI output)
   *
   * @param text - Text to output
   */
  writeToStdout(text: string): void {
    console.log(text);
  }

  /**
   * Write JSON to stdout (for CLI output)
   *
   * @param jsonStr - JSON string to output
   */
  writeJSONToStdout(jsonStr: string): void {
    console.log(jsonStr);
  }

  /**
   * Clear tmux pane content
   *
   * @param paneId - Tmux pane identifier
   */
  clearPane(paneId: string): void {
    try {
      execSync(`tmux send-keys -t ${paneId} C-l`, { encoding: 'utf-8' });
      console.log(`✅ Cleared tmux pane: ${paneId}`);
    } catch (error) {
      console.error(`Failed to clear tmux pane ${paneId}:`, error);
    }
  }

  /**
   * Append text to existing tmux pane content
   *
   * @param text - Text to append
   * @param paneId - Tmux pane identifier
   */
  appendToTmuxPane(text: string, paneId: string): void {
    try {
      const lines = text.split('\n');
      for (const line of lines) {
        const escaped = line.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        execSync(`tmux send-keys -t ${paneId} "${escaped}"`, { encoding: 'utf-8' });
        execSync(`tmux send-keys -t ${paneId} Enter`, { encoding: 'utf-8' });
      }
    } catch (error) {
      console.error(`Failed to append to tmux pane ${paneId}:`, error);
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create default WriterConfig for tmux output
 *
 * @param paneId - Tmux pane identifier
 * @returns WriterConfig
 */
export function createTmuxWriterConfig(paneId: string): WriterConfig {
  return {
    tmuxPane: paneId,
    appendMode: false,
  };
}

/**
 * Create default WriterConfig for JSON log output
 *
 * @param logPath - JSON log file path
 * @param appendMode - Whether to append or overwrite (default: true)
 * @returns WriterConfig
 */
export function createJSONWriterConfig(logPath: string, appendMode: boolean = true): WriterConfig {
  return {
    jsonLogPath: logPath,
    appendMode,
  };
}

/**
 * Create default WriterConfig for both tmux and JSON output
 *
 * @param paneId - Tmux pane identifier
 * @param logPath - JSON log file path
 * @param appendMode - Whether to append or overwrite (default: true)
 * @returns WriterConfig
 */
export function createDualWriterConfig(
  paneId: string,
  logPath: string,
  appendMode: boolean = true
): WriterConfig {
  return {
    tmuxPane: paneId,
    jsonLogPath: logPath,
    appendMode,
  };
}
