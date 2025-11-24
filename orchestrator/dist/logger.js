"use strict";
/**
 * Enhanced Logger Utility
 *
 * Provides beautiful, structured logging for tmux-based UI/UX
 * Supports multiple output styles: default, claude-code, codex
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
// Prevent terminal color queries (OSC 10/11) in tmux
if (process.env.TMUX) {
    chalk_1.default.level = 2; // Force 256 color mode, avoid true color queries
}
class Logger {
    /**
     * Set output style dynamically
     */
    static setOutputStyle(style) {
        this.outputStyle = style;
    }
    /**
     * Get current output style
     */
    static getOutputStyle() {
        return this.outputStyle;
    }
    /**
     * Format timestamp for logs
     */
    static timestamp() {
        if (this.outputStyle === 'codex') {
            return ''; // Codex style: no timestamps
        }
        const now = new Date();
        const time = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        if (this.outputStyle === 'claude-code') {
            return chalk_1.default.dim(`${time} │`);
        }
        return chalk_1.default.gray(`[${time}]`);
    }
    /**
     * Claude Code style prefix
     */
    static claudePrefix(icon, color) {
        return `${color(icon)}`;
    }
    /**
     * Codex style prefix
     */
    static codexPrefix(label) {
        return chalk_1.default.bold(`[${label.toUpperCase()}]`);
    }
    /**
     * Success message (green)
     */
    static success(message, details) {
        if (this.outputStyle === 'claude-code') {
            console.log(`${this.timestamp()} ${chalk_1.default.green('✓')} ${message}`);
            if (details)
                console.log(chalk_1.default.dim(`  ${details}`));
        }
        else if (this.outputStyle === 'codex') {
            console.log(`${this.codexPrefix('ok')} ${chalk_1.default.green(message)}`);
            if (details)
                console.log(`         ${chalk_1.default.dim(details)}`);
        }
        else {
            console.log(`${this.timestamp()} ${chalk_1.default.green.bold('✓')} ${chalk_1.default.green(message)}`);
            if (details) {
                console.log(chalk_1.default.gray(`    ${details}`));
            }
        }
    }
    /**
     * Error message (red)
     */
    static error(message, error) {
        if (this.outputStyle === 'claude-code') {
            console.log(`${this.timestamp()} ${chalk_1.default.red('✗')} ${chalk_1.default.red(message)}`);
            if (error?.message)
                console.log(chalk_1.default.dim(`  Error: ${error.message}`));
        }
        else if (this.outputStyle === 'codex') {
            console.log(`${this.codexPrefix('error')} ${chalk_1.default.red(message)}`);
            if (error?.message)
                console.log(`         ${chalk_1.default.dim(error.message)}`);
        }
        else {
            console.log(`${this.timestamp()} ${chalk_1.default.red.bold('✗')} ${chalk_1.default.red(message)}`);
            if (error) {
                if (error.message) {
                    console.log(chalk_1.default.gray(`    Error: ${error.message}`));
                }
                if (process.env.DEBUG) {
                    console.log(chalk_1.default.gray(error.stack));
                }
            }
        }
    }
    /**
     * Warning message (yellow)
     */
    static warn(message, details) {
        if (this.outputStyle === 'claude-code') {
            console.log(`${this.timestamp()} ${chalk_1.default.yellow('⚠')} ${message}`);
            if (details)
                console.log(chalk_1.default.dim(`  ${details}`));
        }
        else if (this.outputStyle === 'codex') {
            console.log(`${this.codexPrefix('warn')} ${chalk_1.default.yellow(message)}`);
            if (details)
                console.log(`         ${chalk_1.default.dim(details)}`);
        }
        else {
            console.log(`${this.timestamp()} ${chalk_1.default.yellow.bold('⚠')} ${chalk_1.default.yellow(message)}`);
            if (details) {
                console.log(chalk_1.default.gray(`    ${details}`));
            }
        }
    }
    /**
     * Info message (blue)
     */
    static info(message, details) {
        if (this.outputStyle === 'claude-code') {
            console.log(`${this.timestamp()} ${chalk_1.default.blue('ℹ')} ${message}`);
            if (details)
                console.log(chalk_1.default.dim(`  ${details}`));
        }
        else if (this.outputStyle === 'codex') {
            console.log(`${this.codexPrefix('info')} ${chalk_1.default.blue(message)}`);
            if (details)
                console.log(`         ${chalk_1.default.dim(details)}`);
        }
        else {
            console.log(`${this.timestamp()} ${chalk_1.default.blue.bold('ℹ')} ${chalk_1.default.blue(message)}`);
            if (details) {
                console.log(chalk_1.default.gray(`    ${details}`));
            }
        }
    }
    /**
     * Debug message (gray) - only shown if DEBUG=true
     */
    static debug(message, data) {
        if (process.env.DEBUG) {
            console.log(`${this.timestamp()} ${chalk_1.default.gray.bold('◆')} ${chalk_1.default.gray(message)}`);
            if (data) {
                console.log(chalk_1.default.gray(`    ${JSON.stringify(data, null, 2)}`));
            }
        }
    }
    /**
     * Activity message (cyan) - for active processes
     */
    static activity(message, details) {
        console.log(`${this.timestamp()} ${chalk_1.default.cyan.bold('⟳')} ${chalk_1.default.cyan(message)}`);
        if (details) {
            console.log(chalk_1.default.gray(`    ${details}`));
        }
    }
    /**
     * Boxed message for important announcements
     */
    static box(title, message, type = 'info') {
        const colors = {
            success: { border: 'green', title: chalk_1.default.green.bold },
            error: { border: 'red', title: chalk_1.default.red.bold },
            info: { border: 'cyan', title: chalk_1.default.cyan.bold },
            warn: { border: 'yellow', title: chalk_1.default.yellow.bold },
        };
        const color = colors[type];
        const content = `${color.title(title)}\n\n${message}`;
        console.log((0, boxen_1.default)(content, {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: color.border,
        }));
    }
    /**
     * HTTP Request log
     */
    static request(method, path, status) {
        const methodColor = method === 'GET' ? chalk_1.default.green : chalk_1.default.blue;
        const statusText = status
            ? (status < 400 ? chalk_1.default.green(`${status}`) : chalk_1.default.red(`${status}`))
            : '';
        console.log(`${this.timestamp()} ${methodColor(method.padEnd(6))} ${path} ${statusText}`);
    }
    /**
     * Task execution log
     */
    static task(action, taskName, jobId) {
        const icons = {
            started: { icon: '▶', color: chalk_1.default.cyan },
            completed: { icon: '✓', color: chalk_1.default.green },
            failed: { icon: '✗', color: chalk_1.default.red },
        };
        const { icon, color } = icons[action];
        const idText = jobId ? chalk_1.default.gray(`[${jobId}]`) : '';
        console.log(`${this.timestamp()} ${color.bold(icon)} ${color(`Task ${action}`)} ${chalk_1.default.white.bold(taskName)} ${idText}`);
    }
    /**
     * Separator line
     */
    static separator(char = '─', length = 60) {
        console.log(chalk_1.default.gray(char.repeat(length)));
    }
    /**
     * Startup banner
     */
    static banner(title, version, port) {
        const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║  ${chalk_1.default.cyan.bold(title.padEnd(55))}  ║
║  ${chalk_1.default.gray(`Version: ${version}`.padEnd(55))}  ║
${port ? `║  ${chalk_1.default.gray(`Port: ${port}`.padEnd(55))}  ║` : ''}
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `;
        console.log(banner);
    }
    /**
     * Key-value pair display
     */
    static keyValue(key, value, indent = 0) {
        const spaces = ' '.repeat(indent);
        console.log(`${spaces}${chalk_1.default.gray(key + ':')} ${chalk_1.default.white(String(value))}`);
    }
    /**
     * Section header
     */
    static section(title) {
        console.log();
        console.log(chalk_1.default.bold.underline(title));
    }
}
exports.Logger = Logger;
Logger.outputStyle = process.env.OUTPUT_STYLE || 'default';
//# sourceMappingURL=logger.js.map