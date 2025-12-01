/**
 * Regex Search Engine
 * Pattern-based search for tools using regular expressions
 */
export class RegexSearchEngine {
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
    }
    /**
     * Search for tools using regex pattern
     */
    search(pattern, limit = 5) {
        if (!pattern.trim()) {
            return [];
        }
        // Validate pattern length (Anthropic limit: 200 chars)
        if (pattern.length > 200) {
            throw new Error("Regex pattern exceeds 200 character limit");
        }
        let regex;
        try {
            regex = new RegExp(pattern, "i");
        }
        catch (e) {
            throw new Error(`Invalid regex pattern: ${pattern}`);
        }
        const results = [];
        for (const tool of this.catalog.tools) {
            const matchResult = this.matchTool(regex, tool);
            if (matchResult.matched) {
                results.push({
                    tool,
                    score: matchResult.score,
                    matchedFields: matchResult.fields,
                });
            }
            if (results.length >= limit * 2) {
                // Collect more than needed for sorting
                break;
            }
        }
        // Sort by score and return top results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    /**
     * Match a tool against the regex pattern
     */
    matchTool(regex, tool) {
        let score = 0;
        const fields = [];
        // Check name (highest weight)
        if (regex.test(tool.name)) {
            score += 10;
            fields.push("name");
        }
        // Check display name
        if (regex.test(tool.displayName)) {
            score += 5;
            fields.push("displayName");
        }
        // Check description
        if (regex.test(tool.description)) {
            score += 3;
            fields.push("description");
        }
        // Check keywords
        if (tool.keywords.some(k => regex.test(k))) {
            score += 4;
            fields.push("keywords");
        }
        // Check aliases
        if (tool.aliases.some(a => regex.test(a))) {
            score += 2;
            fields.push("aliases");
        }
        // Check category
        if (regex.test(tool.category)) {
            score += 2;
            fields.push("category");
        }
        // Check subcategory
        if (tool.subcategory && regex.test(tool.subcategory)) {
            score += 1;
            fields.push("subcategory");
        }
        return {
            matched: score > 0,
            score,
            fields,
        };
    }
    /**
     * Validate regex pattern
     */
    validatePattern(pattern) {
        if (pattern.length > 200) {
            return { valid: false, error: "Pattern exceeds 200 character limit" };
        }
        try {
            new RegExp(pattern);
            return { valid: true };
        }
        catch (e) {
            return { valid: false, error: `Invalid regex: ${e.message}` };
        }
    }
    /**
     * Get tools by exact category match
     */
    getByCategory(category) {
        const toolIds = this.catalog.byCategory[category] || [];
        return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
    }
    /**
     * Get tools by server name pattern
     */
    getByServerPattern(pattern) {
        const regex = new RegExp(pattern, "i");
        return this.catalog.tools.filter(t => regex.test(t.server));
    }
    /**
     * Common search patterns
     */
    static PATTERNS = {
        // Category patterns
        git: "git_.*|branch_.*|commit_.*",
        github: "github_.*|issue_.*|pr_.*|pull_.*",
        monitoring: "resource_.*|process_.*|log_.*|network_.*",
        files: "read_.*|write_.*|list_.*|file_.*",
        tmux: "tmux_.*|session_.*|pane_.*",
        obsidian: "obsidian_.*|note_.*|vault_.*",
        gemini: "gemini_.*|generate_.*",
        // Action patterns
        create: "create_.*|new_.*|add_.*",
        read: "get_.*|list_.*|read_.*|search_.*",
        update: "update_.*|edit_.*|modify_.*",
        delete: "delete_.*|remove_.*",
    };
}
//# sourceMappingURL=regex.js.map