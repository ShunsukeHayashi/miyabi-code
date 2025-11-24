/**
 * Enhanced Logger Utility
 *
 * Provides beautiful, structured logging for tmux-based UI/UX
 * Supports multiple output styles: default, claude-code, codex
 */
export type OutputStyle = 'default' | 'claude-code' | 'codex';
export declare class Logger {
    private static outputStyle;
    /**
     * Set output style dynamically
     */
    static setOutputStyle(style: OutputStyle): void;
    /**
     * Get current output style
     */
    static getOutputStyle(): OutputStyle;
    /**
     * Format timestamp for logs
     */
    private static timestamp;
    /**
     * Claude Code style prefix
     */
    private static claudePrefix;
    /**
     * Codex style prefix
     */
    private static codexPrefix;
    /**
     * Success message (green)
     */
    static success(message: string, details?: string): void;
    /**
     * Error message (red)
     */
    static error(message: string, error?: any): void;
    /**
     * Warning message (yellow)
     */
    static warn(message: string, details?: string): void;
    /**
     * Info message (blue)
     */
    static info(message: string, details?: string): void;
    /**
     * Debug message (gray) - only shown if DEBUG=true
     */
    static debug(message: string, data?: any): void;
    /**
     * Activity message (cyan) - for active processes
     */
    static activity(message: string, details?: string): void;
    /**
     * Boxed message for important announcements
     */
    static box(title: string, message: string, type?: 'success' | 'error' | 'info' | 'warn'): void;
    /**
     * HTTP Request log
     */
    static request(method: string, path: string, status?: number): void;
    /**
     * Task execution log
     */
    static task(action: 'started' | 'completed' | 'failed', taskName: string, jobId?: string): void;
    /**
     * Separator line
     */
    static separator(char?: string, length?: number): void;
    /**
     * Startup banner
     */
    static banner(title: string, version: string, port?: number): void;
    /**
     * Key-value pair display
     */
    static keyValue(key: string, value: any, indent?: number): void;
    /**
     * Section header
     */
    static section(title: string): void;
}
//# sourceMappingURL=logger.d.ts.map