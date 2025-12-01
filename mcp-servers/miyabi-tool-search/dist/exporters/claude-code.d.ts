/**
 * Claude Code Configuration Exporter
 * Generates configuration files for Claude Code integration
 */
import { ToolCatalog } from "../catalog/types.js";
/**
 * Claude Code settings.json configuration
 */
export interface ClaudeCodeSettings {
    toolSearch: {
        enabled: boolean;
        searchType: "bm25" | "regex" | "hybrid";
        maxResults: number;
        catalogPath: string;
    };
    alwaysLoadedTools: string[];
    deferredCategories: string[];
    toolPriorities: Record<string, "always" | "high" | "medium" | "low">;
}
/**
 * Generate Claude Code settings configuration
 */
export declare function generateClaudeCodeSettings(catalog: ToolCatalog): ClaudeCodeSettings;
/**
 * Generate .mcp.json with defer_loading configuration
 */
export declare function generateMCPConfig(catalog: ToolCatalog, existingConfig?: object): object;
/**
 * Generate CLAUDE.md section for tool search documentation
 */
export declare function generateClaudeMDSection(catalog: ToolCatalog): string;
/**
 * Write all configuration files
 */
export declare function writeAllConfigs(catalog: ToolCatalog, outputDir: string): Promise<void>;
/**
 * Merge tool search config into existing settings
 */
export declare function mergeIntoExistingSettings(existingPath: string, catalog: ToolCatalog): object;
//# sourceMappingURL=claude-code.d.ts.map