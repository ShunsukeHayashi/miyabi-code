/**
 * MCP Adapter - Converts STDIO MCP servers to HTTP/SSE endpoints
 *
 * This adapter spawns STDIO MCP servers as child processes and translates
 * HTTP requests to JSON-RPC messages for the STDIO transport.
 */
import { EventEmitter } from 'events';
interface MCPServerConfig {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
}
export declare class MCPAdapter extends EventEmitter {
    private process;
    private config;
    private messageBuffer;
    private pendingRequests;
    private requestId;
    private isReady;
    constructor(config: MCPServerConfig);
    /**
     * Start the STDIO MCP server process
     */
    start(): Promise<void>;
    /**
     * Send MCP initialize request
     */
    private initialize;
    /**
     * Handle stdout data from MCP server
     */
    private handleStdout;
    /**
     * Handle JSON-RPC response from MCP server
     */
    private handleResponse;
    /**
     * Send JSON-RPC request to MCP server
     */
    sendRequest(method: string, params?: any): Promise<any>;
    /**
     * List available tools from MCP server
     */
    listTools(): Promise<any>;
    /**
     * Call a tool on the MCP server
     */
    callTool(name: string, args?: any): Promise<any>;
    /**
     * Stop the MCP server process
     */
    stop(): void;
    /**
     * Check if server is ready
     */
    ready(): boolean;
}
export {};
