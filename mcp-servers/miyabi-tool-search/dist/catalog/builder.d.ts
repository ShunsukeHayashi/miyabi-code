/**
 * Tool Catalog Builder
 * Collects tools from MCP servers, Rust crates, and subagents
 */
import { ToolCatalog } from "./types.js";
export declare class CatalogBuilder {
    private categoriesConfig;
    private tools;
    constructor();
    /**
     * Build complete tool catalog
     */
    build(): Promise<ToolCatalog>;
    /**
     * Collect tools from MCP servers
     */
    private collectMCPTools;
    /**
     * Get tools from a single MCP server
     */
    private getMCPServerTools;
    /**
     * Predefined tools for each server (used when server not running)
     */
    private getPredefinedTools;
    /**
     * Collect tools from Rust agent crates
     */
    private collectRustAgentTools;
    /**
     * Collect tools from subagent definitions
     */
    private collectSubagentTools;
    /**
     * Create a tool catalog entry
     */
    private createToolEntry;
    /**
     * Infer category from tool name and description
     */
    private inferCategory;
    /**
     * Determine tool priority
     */
    private determinePriority;
    /**
     * Extract keywords from tool name and description
     */
    private extractKeywords;
    /**
     * Generate aliases for tool
     */
    private generateAliases;
    /**
     * Format display name
     */
    private formatDisplayName;
    /**
     * Create the final catalog with indexes
     */
    private createCatalog;
}
/**
 * Build and save catalog
 */
export declare function buildAndSaveCatalog(outputPath: string): Promise<ToolCatalog>;
//# sourceMappingURL=builder.d.ts.map