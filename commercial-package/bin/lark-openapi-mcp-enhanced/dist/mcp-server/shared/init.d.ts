import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServerOptions } from './types';
import * as larkmcp from '../../mcp-tool';
export declare function initMcpServer(options: McpServerOptions): {
    mcpServer: McpServer;
    larkClient: larkmcp.LarkMcpTool;
};
