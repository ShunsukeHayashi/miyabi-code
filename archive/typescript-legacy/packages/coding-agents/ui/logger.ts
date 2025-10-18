/**
 * RichLogger — Beautiful CLI Output System
 *
 * Addresses Issue #4 - Rich CLI Output Styling
 *
 * Provides a unified API for rich terminal output with:
 * - Colors (chalk)
 * - Boxes (boxen)
 * - Tables (cli-table3)
 * - Spinners (ora)
 * - Gradients (gradient-string)
 * - ASCII Art (figlet)
 */

import chalk from 'chalk';
import boxen from 'boxen';
import ora, { Ora } from 'ora';
import gradient from 'gradient-string';
import figlet from 'figlet';
import logSymbols from 'log-symbols';
import { theme, agentColors, type AgentName } from './theme';

export interface LogOptions {
  prefix?: string;
  indent?: number;
  newline?: boolean;
}

export interface BoxOptions {
  title?: string;
  padding?: number;
  margin?: number;
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  borderColor?: string;
  align?: 'left' | 'center' | 'right';
}

type OutputMode = 'rich' | 'compact' | 'plain';

export class RichLogger {
  private indentLevel: number = 0;
  private mode: OutputMode;

  constructor(mode?: OutputMode) {
    // Detect mode from environment / TTY
    const envMode = (process.env.CODEX_HIL_STYLE || process.env.MIYABI_OUTPUT || '').toLowerCase();
    const detected: OutputMode | undefined =
      envMode === 'compact' ? 'compact' : envMode === 'plain' ? 'plain' : envMode === 'rich' ? 'rich' : undefined;

    // Default: compact on CI or non-TTY; otherwise rich
    this.mode = mode || detected || (!process.stdout.isTTY || process.env.CI ? 'compact' : 'rich');
  }

  setMode(mode: OutputMode) {
    this.mode = mode;
  }

  /**
   * Output raw text (no styling)
   */
  raw(text: string): void {
    console.log(text);
  }

  /**
   * Main header (large, gradient)
   */
  header(text: string, useGradient: boolean = true): void {
    const compact = this.mode !== 'rich';
    if (compact) {
      // Minimal header
      const t = this.mode === 'plain' ? text : chalk.bold(text);
      console.log(t);
      console.log(this.mode === 'plain' ? '===='.padEnd(Math.min(60, text.length + 4), '=') : theme.dividers.heavy);
      return;
    }
    console.log('');
    if (useGradient) {
      const gradientText = gradient(...theme.colors.gradient)(text);
      console.log(chalk.bold(gradientText));
    } else {
      console.log(chalk.hex(theme.colors.primary).bold(text));
    }
    console.log(theme.dividers.heavy);
    console.log('');
  }

  /**
   * Sub-header (medium, colored)
   */
  subheader(text: string): void {
    const compact = this.mode !== 'rich';
    if (compact) {
      const t = this.mode === 'plain' ? text : chalk.bold(text);
      console.log(t);
      console.log(this.mode === 'plain' ? '-'.repeat(Math.min(60, text.length)) : theme.dividers.light);
      return;
    }
    console.log('');
    console.log(chalk.hex(theme.colors.primary).bold(text));
    console.log(theme.dividers.light);
  }

  /**
   * Section header (small, with emoji)
   */
  section(emoji: string, text: string): void {
    const compact = this.mode !== 'rich';
    if (compact) {
      const label = this.mode === 'plain' ? text : chalk.hex(theme.colors.primary).bold(text);
      console.log(label);
      return;
    }
    console.log('');
    console.log(`${emoji} ${chalk.hex(theme.colors.primary).bold(text)}`);
  }

  /**
   * Success message
   */
  success(message: string, options: LogOptions = {}): void {
    const symbol = this.mode === 'plain' ? 'OK' : logSymbols.success;
    const styled = this.mode === 'plain' ? message : chalk.hex(theme.colors.success)(message);
    this.log(`${symbol} ${styled}`, options);
  }

  /**
   * Error message
   */
  error(message: string, error?: Error, options: LogOptions = {}): void {
    const symbol = this.mode === 'plain' ? 'ERR' : logSymbols.error;
    const styled = this.mode === 'plain' ? message : chalk.hex(theme.colors.error)(message);
    this.log(`${symbol} ${styled}`, options);

    if (error) {
      const indent = '  ';
      const detail = `${indent}${error.message}`;
      console.log(this.mode === 'plain' ? detail : chalk.hex(theme.colors.muted)(detail));
      if (error.stack) {
        const stackLines = error.stack.split('\n').slice(1, 4); // First 3 lines
        stackLines.forEach((line) => {
          const l = `${indent}${line.trim()}`;
          console.log(this.mode === 'plain' ? l : chalk.hex(theme.colors.muted)(l));
        });
      }
    }
  }

  /**
   * Warning message
   */
  warning(message: string, options: LogOptions = {}): void {
    const symbol = this.mode === 'plain' ? 'WARN' : logSymbols.warning;
    const styled = this.mode === 'plain' ? message : chalk.hex(theme.colors.warning)(message);
    this.log(`${symbol} ${styled}`, options);
  }

  /**
   * Warning message (alias for warning())
   */
  warn(message: string, options: LogOptions = {}): void {
    this.warning(message, options);
  }

  /**
   * Info message
   */
  info(message: string, options: LogOptions = {}): void {
    const symbol = this.mode === 'plain' ? 'INFO' : logSymbols.info;
    const styled = this.mode === 'plain' ? message : chalk.hex(theme.colors.info)(message);
    this.log(`${symbol} ${styled}`, options);
  }

  /**
   * Agent-specific message
   */
  agent(agentName: AgentName, message: string, options: LogOptions = {}): void {
    const color = agentColors[agentName] || theme.colors.agent;
    const label = this.mode === 'plain' ? agentName : chalk.hex(color).bold(agentName);
    const styled = this.mode === 'plain' ? message : chalk.white(message);
    const prefix = this.mode === 'rich' ? `${theme.symbols.robot} ` : '';
    this.log(`${prefix}${label}: ${styled}`, options);
  }

  /**
   * Human/Guardian message
   */
  human(message: string, options: LogOptions = {}): void {
    const styled = this.mode === 'plain' ? message : chalk.hex(theme.colors.human)(message);
    const prefix = this.mode === 'rich' ? `${theme.symbols.human} ` : '';
    this.log(`${prefix}${styled}`, options);
  }

  /**
   * Dimmed/muted message
   */
  muted(message: string, options: LogOptions = {}): void {
    const styled = this.mode === 'plain' ? message : chalk.hex(theme.colors.muted)(message);
    this.log(styled, options);
  }

  /**
   * Generic log with indentation support
   */
  log(message: string, options: LogOptions = {}): void {
    const indent = theme.spacing.indent.repeat(options.indent || this.indentLevel);
    const prefix = options.prefix ? `${options.prefix} ` : '';
    console.log(`${indent}${prefix}${message}`);
    if (options.newline) console.log('');
  }

  /**
   * Bullet list item
   */
  bullet(message: string, level: number = 0): void {
    const indent = theme.spacing.indent.repeat(level);
    const bullet = theme.symbols.bullet;
    console.log(`${indent}${bullet} ${message}`);
  }

  /**
   * Create a box around content
   */
  box(content: string, options: BoxOptions = {}): void {
    if (this.mode !== 'rich') {
      const title = options.title ? `[${options.title}]` : '';
      if (title) console.log(title);
      console.log(content);
      return;
    }
    const boxedContent = boxen(content, {
      padding: options.padding ?? 1,
      margin: options.margin ?? 0,
      borderStyle: options.borderStyle ?? 'round',
      borderColor: options.borderColor ?? theme.colors.primary,
      align: options.align ?? 'left',
      title: options.title,
      titleAlignment: 'center',
    });
    console.log(boxedContent);
  }

  /**
   * Start a spinner
   */
  startSpinner(text: string, spinnerType: string = 'dots'): Ora {
    const isEnabled = this.mode === 'rich' && process.stdout.isTTY && !process.env.CI;
    return ora({
      text: this.mode === 'plain' ? text : chalk.hex(theme.colors.info)(text),
      spinner: spinnerType as any,
      color: 'cyan',
      isEnabled,
    }).start();
  }

  /**
   * Stop a spinner with success
   */
  stopSpinnerSuccess(spinner: Ora, text?: string): void {
    spinner.succeed(text ? chalk.hex(theme.colors.success)(text) : undefined);
  }

  /**
   * Stop a spinner with failure
   */
  stopSpinnerFail(spinner: Ora, text?: string): void {
    spinner.fail(text ? chalk.hex(theme.colors.error)(text) : undefined);
  }

  /**
   * Stop a spinner with warning
   */
  stopSpinnerWarn(spinner: Ora, text?: string): void {
    spinner.warn(text ? chalk.hex(theme.colors.warning)(text) : undefined);
  }

  /**
   * Stop a spinner with info
   */
  stopSpinnerInfo(spinner: Ora, text?: string): void {
    spinner.info(text ? chalk.hex(theme.colors.info)(text) : undefined);
  }

  /**
   * ASCII art banner
   */
  banner(text: string, font: string = 'Standard'): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      figlet.text(
        text,
        {
          font: font as any,
          horizontalLayout: 'default',
          verticalLayout: 'default',
        },
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          const gradientText = gradient(...theme.colors.gradient)(data || '');
          console.log(gradientText);
          resolve();
        }
      );
    });
  }

  /**
   * Gradient text
   */
  gradient(text: string): void {
    const gradientText = gradient(...theme.colors.gradient)(text);
    console.log(gradientText);
  }

  /**
   * Divider line
   */
  divider(type: 'light' | 'heavy' | 'double' = 'light'): void {
    const dividerMap = {
      light: theme.dividers.light,
      heavy: theme.dividers.heavy,
      double: theme.dividers.double,
    };
    console.log(chalk.hex(theme.colors.muted)(dividerMap[type]));
  }

  /**
   * Empty line
   */
  newline(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      console.log('');
    }
  }

  /**
   * Increase indent level
   */
  indent(): void {
    this.indentLevel++;
  }

  /**
   * Decrease indent level
   */
  outdent(): void {
    if (this.indentLevel > 0) {
      this.indentLevel--;
    }
  }

  /**
   * Reset indent level
   */
  resetIndent(): void {
    this.indentLevel = 0;
  }

  /**
   * Progress bar (simple text-based)
   */
  progressBar(current: number, total: number, width: number = 30): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar =
      theme.progressBar.complete.repeat(filled) +
      theme.progressBar.incomplete.repeat(empty);

    return `${chalk.hex(theme.colors.primary)(bar)} ${percentage}%`;
  }

  /**
   * Key-value pair
   */
  keyValue(key: string, value: string, color: string = theme.colors.info): void {
    const keyStyled = chalk.hex(theme.colors.muted)(`${key}:`);
    const valueStyled = chalk.hex(color)(value);
    console.log(`${keyStyled} ${valueStyled}`);
  }

  /**
   * Status indicator
   */
  status(
    label: string,
    status: 'success' | 'error' | 'warning' | 'info' | 'pending'
  ): void {
    const symbolMap = {
      success: logSymbols.success,
      error: logSymbols.error,
      warning: logSymbols.warning,
      info: logSymbols.info,
      pending: '⏳',
    };

    const colorMap = {
      success: theme.colors.success,
      error: theme.colors.error,
      warning: theme.colors.warning,
      info: theme.colors.info,
      pending: theme.colors.muted,
    };

    const symbol = symbolMap[status];
    const color = colorMap[status];
    const styled = chalk.hex(color)(`${symbol} ${label}`);
    console.log(styled);
  }

  /**
   * Clear console
   */
  clear(): void {
    console.clear();
  }
}

// Export singleton instance
export const logger = new RichLogger();
