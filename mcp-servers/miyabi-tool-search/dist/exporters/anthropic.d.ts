/**
 * Anthropic API Exporter
 * Generates tool definitions compatible with Anthropic's Tool Search API
 */
import { ToolCatalog, AnthropicToolDefinition } from "../catalog/types.js";
/**
 * Export catalog for Anthropic API with defer_loading support
 */
export declare function exportForAnthropicAPI(catalog: ToolCatalog, options?: {
    includeSearchTool?: boolean;
    searchToolType?: "bm25" | "regex";
}): AnthropicToolDefinition[];
/**
 * Export for MCP toolset configuration
 */
export declare function exportForMCPToolset(catalog: ToolCatalog): Record<string, MCPToolsetConfig>;
interface MCPToolsetConfig {
    type: "mcp_toolset";
    mcp_server_name: string;
    default_config: {
        defer_loading: boolean;
    };
    configs: Record<string, {
        defer_loading: boolean;
    }>;
}
/**
 * Generate API request body with tool search
 */
export declare function generateAPIRequest(catalog: ToolCatalog, options: {
    model?: string;
    maxTokens?: number;
    messages: Array<{
        role: string;
        content: string;
    }>;
}): object;
/**
 * Calculate token savings from defer_loading
 */
export declare function calculateTokenSavings(catalog: ToolCatalog): {
    withoutDeferLoading: number;
    withDeferLoading: number;
    savings: number;
    savingsPercent: number;
};
/**
 * Generate Python SDK code example
 */
export declare function generatePythonExample(catalog: ToolCatalog): string;
/**
 * Generate TypeScript SDK code example
 */
export declare function generateTypeScriptExample(catalog: ToolCatalog): string;
export {};
//# sourceMappingURL=anthropic.d.ts.map