/**
 * Regex Search Engine
 * Pattern-based search for tools using regular expressions
 */
import { ToolCatalog, ToolCatalogEntry, SearchResult } from "../catalog/types.js";
export declare class RegexSearchEngine {
    private catalog;
    constructor(catalog: ToolCatalog);
    /**
     * Search for tools using regex pattern
     */
    search(pattern: string, limit?: number): SearchResult[];
    /**
     * Match a tool against the regex pattern
     */
    private matchTool;
    /**
     * Validate regex pattern
     */
    validatePattern(pattern: string): {
        valid: boolean;
        error?: string;
    };
    /**
     * Get tools by exact category match
     */
    getByCategory(category: string): ToolCatalogEntry[];
    /**
     * Get tools by server name pattern
     */
    getByServerPattern(pattern: string): ToolCatalogEntry[];
    /**
     * Common search patterns
     */
    static readonly PATTERNS: {
        readonly git: "git_.*|branch_.*|commit_.*";
        readonly github: "github_.*|issue_.*|pr_.*|pull_.*";
        readonly monitoring: "resource_.*|process_.*|log_.*|network_.*";
        readonly files: "read_.*|write_.*|list_.*|file_.*";
        readonly tmux: "tmux_.*|session_.*|pane_.*";
        readonly obsidian: "obsidian_.*|note_.*|vault_.*";
        readonly gemini: "gemini_.*|generate_.*";
        readonly create: "create_.*|new_.*|add_.*";
        readonly read: "get_.*|list_.*|read_.*|search_.*";
        readonly update: "update_.*|edit_.*|modify_.*";
        readonly delete: "delete_.*|remove_.*";
    };
}
//# sourceMappingURL=regex.d.ts.map