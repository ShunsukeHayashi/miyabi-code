/**
 * Lark MCP Enhanced - Unified Logging Implementation
 * Integrates with the standardized MCP logging system
 */
export declare const larkLogger: any;
export declare const requestLogger: any;
/**
 * Specialized logging functions for Lark MCP operations
 */
export declare class LarkMCPLogger {
    static logToolExecution(toolName: string, params: any, requestId: string): void;
    static logToolSuccess(toolName: string, result: any, requestId: string, duration: number): void;
    static logToolError(toolName: string, error: Error, requestId: string, duration: number): void;
    static logAPICall(endpoint: string, method: string, statusCode?: number): void;
    static logGenesisOperation(operation: string, sessionId: string, stage?: string): void;
    static logRateLimit(clientId: string, requestsRemaining: number, resetTime: string): void;
    static logPerformanceMetrics(metrics: {
        activeConnections: number;
        memoryUsage: string;
        requestsPerMinute: number;
        averageResponseTime: number;
    }): void;
}
/**
 * Legacy console replacement for gradual migration
 */
export declare const console: {
    log: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
};
export default larkLogger;
