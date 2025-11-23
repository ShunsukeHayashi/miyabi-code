import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export declare const completePrompts: {
    name: string;
    description: string;
    arguments: {
        name: string;
        description: string;
        required: boolean;
    }[];
    template: string;
}[];
/**
 * Register complete prompts with MCP server
 */
export declare function registerCompletePrompts(server: McpServer): void;
