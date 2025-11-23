import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LarkMcpToolOptions, McpTool, ToolNameCase } from './types';
/**
 * Feishu/Lark MCP
 */
export declare class LarkMcpTool {
    private client;
    private userAccessToken;
    private tokenMode;
    private allTools;
    private rateLimitedHttp;
    /**
     * Feishu/Lark MCP
     * @param options Feishu/Lark Client Options
     */
    constructor(options: LarkMcpToolOptions);
    /**
     * Update User Access Token
     * @param userAccessToken User Access Token
     */
    updateUserAccessToken(userAccessToken: string): void;
    /**
     * Get MCP Tools
     * @returns MCP Tool Definition Array
     */
    getTools(): McpTool[];
    /**
     * Get rate limiting metrics
     * @returns Rate limiting metrics for all tiers
     */
    getRateLimitMetrics(): Record<string, import("../utils/rate-limiter").RateLimiterMetrics>;
    /**
     * Reset rate limiters
     */
    resetRateLimiters(): void;
    /**
     * Enable or disable rate limiting
     * @param enabled Whether to enable rate limiting
     */
    setRateLimitEnabled(enabled: boolean): void;
    /**
     * Register Tools to MCP Server
     * @param server MCP Server Instance
     */
    registerMcpServer(server: McpServer, options?: {
        toolNameCase?: ToolNameCase;
    }): void;
}
