/**
 * MCP Router - Routes requests to appropriate MCP servers
 *
 * Manages multiple MCP adapters and provides unified routing
 */
import { MCPAdapter } from './mcp-adapter.js';
export declare class MCPRouter {
    private servers;
    private initialized;
    constructor();
    /**
     * Initialize all MCP servers
     */
    initialize(): Promise<void>;
    /**
     * Get server by name
     */
    getServer(name: string): MCPAdapter | undefined;
    /**
     * Get status of all servers
     */
    getStatus(): {
        initialized: boolean;
        servers: string[];
        total: number;
        ready: number;
    };
    /**
     * List all available tools from all servers
     */
    listAllTools(): Promise<any>;
    /**
     * Call tool on specific server
     */
    callTool(serverName: string, toolName: string, args?: any): Promise<any>;
    /**
     * Shutdown all servers
     */
    shutdown(): Promise<void>;
}
export declare function getMCPRouter(): MCPRouter;
