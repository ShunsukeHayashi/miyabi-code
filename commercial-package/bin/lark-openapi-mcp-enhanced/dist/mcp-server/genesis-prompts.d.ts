import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export declare const genesisPrompts: {
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
 * Register Genesis prompts with MCP server
 */
export declare function registerGenesisPrompts(server: McpServer): void;
