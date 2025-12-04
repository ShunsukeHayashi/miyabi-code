/**
 * GitHub Authentication MCP Tools
 *
 * Tools for GitHub OAuth Device Flow authentication
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * Register GitHub authentication tools on the MCP server
 */
export declare function registerAuthTools(server: McpServer, getToken: () => string | null, setToken: (token: string) => void): void;
//# sourceMappingURL=auth-tools.d.ts.map