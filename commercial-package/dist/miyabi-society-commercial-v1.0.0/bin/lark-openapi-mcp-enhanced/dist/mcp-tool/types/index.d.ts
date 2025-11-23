import * as lark from '@larksuiteoapi/node-sdk';
import { ProjectName, ToolName } from '../tools';
import { CallToolResult } from '@modelcontextprotocol/sdk/types';
import { RateLimiterConfig } from '../../utils/rate-limiter';
export type ToolNameCase = 'snake' | 'camel' | 'kebab' | 'dot';
export declare enum TokenMode {
    AUTO = "auto",
    USER_ACCESS_TOKEN = "user_access_token",
    TENANT_ACCESS_TOKEN = "tenant_access_token"
}
export interface McpHandlerOptions {
    userAccessToken?: string;
    tool?: McpTool;
}
export type McpHandler = (client: lark.Client, params: any, options: McpHandlerOptions) => Promise<CallToolResult> | CallToolResult;
/**
 * MCP工具类型定义
 */
export interface McpTool {
    project: string;
    name: string;
    description: string;
    schema: any;
    sdkName?: string;
    path?: string;
    httpMethod?: string;
    accessTokens?: string[];
    supportFileUpload?: boolean;
    supportFileDownload?: boolean;
    customHandler?: McpHandler;
}
/**
 * 注册工具选项
 */
export interface ToolsFilterOptions {
    language?: 'zh' | 'en';
    allowTools?: ToolName[];
    allowProjects?: ProjectName[];
    tokenMode?: TokenMode;
}
export type LarkClientOptions = Partial<ConstructorParameters<typeof lark.Client>[0]>;
export interface RateLimitingOptions {
    /** Enable rate limiting (default: true) */
    enabled?: boolean;
    /** Custom rate limiting configurations for different tiers */
    rateLimits?: Record<string, RateLimiterConfig>;
    /** Logger for rate limiting events */
    logger?: {
        warn: (message: string) => void;
        info: (message: string) => void;
        debug: (message: string) => void;
    };
}
export interface LarkMcpToolOptions extends LarkClientOptions {
    client?: lark.Client;
    appId?: string;
    appSecret?: string;
    toolsOptions?: ToolsFilterOptions;
    tokenMode?: TokenMode;
    rateLimiting?: RateLimitingOptions;
}
