/**
 * Report Writer
 *
 * Writes timeline reports to tmux panes and JSONL files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { TmuxAdapter } from '../adapters/TmuxAdapter.js';
import { ReportFormatter } from './ReportFormatter.js';
import type { TimelineReport } from '../types/index.js';

export class ReportWriter {
  private tmuxAdapter: TmuxAdapter;
  private formatter: ReportFormatter;

  constructor(tmuxAdapter?: TmuxAdapter, formatter?: ReportFormatter) {
    this.tmuxAdapter = tmuxAdapter || new TmuxAdapter();
    this.formatter = formatter || new ReportFormatter();
  }

  /**
   * Write report to tmux pane
   */
  writeToTmuxPane(report: TimelineReport, paneId: string): boolean {
    try {
      const formatted = this.formatter.formatForTmux(report);

      // Clear pane first
      this.tmuxAdapter.sendToPaneCommand(paneId, 'clear');

      // Wait for clear to complete
      setTimeout(() => {
        // Send formatted report
        this.tmuxAdapter.sendToPaneCommand(paneId, formatted);
      }, 200);

      return true;
    } catch (error) {
      console.error(`Failed to write to tmux pane ${paneId}:`, error);
      return false;
    }
  }

  /**
   * Append report to JSONL file
   */
  appendToJSONL(report: TimelineReport, jsonlPath: string): boolean {
    try {
      // Ensure directory exists
      const dir = path.dirname(jsonlPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Format as JSONL
      const jsonlLine = this.formatter.formatForJSONL(report);

      // Append to file
      fs.appendFileSync(jsonlPath, jsonlLine + '\n', 'utf-8');

      return true;
    } catch (error) {
      console.error(`Failed to write to JSONL file ${jsonlPath}:`, error);
      return false;
    }
  }

  /**
   * Write report to both tmux pane and JSONL file
   */
  writeAll(report: TimelineReport, paneId?: string, jsonlPath?: string): boolean {
    let success = true;

    if (paneId) {
      success = this.writeToTmuxPane(report, paneId) && success;
    }

    if (jsonlPath) {
      success = this.appendToJSONL(report, jsonlPath) && success;
    }

    return success;
  }

  /**
   * Write compact summary to console
   */
  writeToConsole(report: TimelineReport): void {
    const summary = this.formatter.formatCompactSummary(report);
    console.log(summary);
  }

  /**
   * Write full report to console
   */
  writeFullToConsole(report: TimelineReport): void {
    const formatted = this.formatter.formatForTmux(report);
    console.log(formatted);
  }
}
