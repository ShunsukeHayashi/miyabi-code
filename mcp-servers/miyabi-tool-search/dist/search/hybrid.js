/**
 * Hybrid Search Engine
 * Combines BM25 and Regex search for optimal results
 */
import { BM25SearchEngine } from "./bm25.js";
import { RegexSearchEngine } from "./regex.js";
export class HybridSearchEngine {
    bm25;
    regex;
    catalog;
    constructor(catalog) {
        this.catalog = catalog;
        this.bm25 = new BM25SearchEngine(catalog);
        this.regex = new RegexSearchEngine(catalog);
    }
    /**
     * Search for tools using hybrid approach
     */
    search(query, options = {}) {
        const { type = "hybrid", limit = 5, category, source, minScore = 0, } = options;
        let results;
        // Determine search type
        if (type === "regex" || this.looksLikeRegex(query)) {
            results = this.regex.search(query, limit * 2);
        }
        else if (type === "bm25") {
            results = this.bm25.search(query, limit * 2);
        }
        else {
            // Hybrid: combine both results
            results = this.hybridSearch(query, limit * 2);
        }
        // Apply filters
        if (category) {
            results = results.filter(r => r.tool.category === category);
        }
        if (source) {
            results = results.filter(r => r.tool.source === source);
        }
        if (minScore > 0) {
            results = results.filter(r => r.score >= minScore);
        }
        // Return top results
        return results.slice(0, limit);
    }
    /**
     * Hybrid search combining BM25 and Regex
     */
    hybridSearch(query, limit) {
        // Get results from both engines
        const bm25Results = this.bm25.search(query, limit);
        const regexPattern = this.queryToPattern(query);
        const regexResults = this.regex.search(regexPattern, limit);
        // Merge and deduplicate results
        return this.mergeResults(bm25Results, regexResults, limit);
    }
    /**
     * Merge results from multiple search engines
     */
    mergeResults(bm25Results, regexResults, limit) {
        const scoreMap = new Map();
        // Add BM25 results with weight
        for (const result of bm25Results) {
            const existing = scoreMap.get(result.tool.id);
            if (existing) {
                existing.score += result.score * 0.6;
                existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
            }
            else {
                scoreMap.set(result.tool.id, {
                    ...result,
                    score: result.score * 0.6,
                });
            }
        }
        // Add Regex results with weight
        for (const result of regexResults) {
            const existing = scoreMap.get(result.tool.id);
            if (existing) {
                existing.score += result.score * 0.4;
                existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
            }
            else {
                scoreMap.set(result.tool.id, {
                    ...result,
                    score: result.score * 0.4,
                });
            }
        }
        // Sort by combined score
        return [...scoreMap.values()]
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
    /**
     * Check if query looks like a regex pattern
     */
    looksLikeRegex(query) {
        // Check for common regex metacharacters
        return /[.*+?^${}()|[\]\\]/.test(query);
    }
    /**
     * Convert natural language query to regex pattern
     */
    queryToPattern(query) {
        // Split into words and create a pattern that matches any
        const words = query
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 2)
            .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // Escape special chars
        if (words.length === 0) {
            return query;
        }
        // Create pattern: match any word
        return words.join("|");
    }
    /**
     * Get always-loaded tools
     */
    getAlwaysLoadedTools() {
        const toolIds = this.catalog.byPriority["always"] || [];
        return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
    }
    /**
     * Get deferred tools
     */
    getDeferredTools() {
        return this.catalog.tools.filter(t => t.deferLoading);
    }
    /**
     * Get tools by category
     */
    getByCategory(category) {
        const toolIds = this.catalog.byCategory[category] || [];
        return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
    }
    /**
     * Get tools by source
     */
    getBySource(source) {
        const toolIds = this.catalog.bySource[source] || [];
        return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
    }
    /**
     * Get tools by server
     */
    getByServer(server) {
        const toolIds = this.catalog.byServer[server] || [];
        return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
    }
    /**
     * Get catalog reference
     */
    getCatalog() {
        return this.catalog;
    }
    /**
     * Get catalog statistics
     */
    getStats() {
        const bySource = {
            mcp: 0,
            rust_crate: 0,
            subagent: 0,
            builtin: 0,
        };
        const byPriority = {
            always: 0,
            high: 0,
            medium: 0,
            low: 0,
        };
        const byCategory = {};
        for (const tool of this.catalog.tools) {
            bySource[tool.source]++;
            byPriority[tool.priority]++;
            byCategory[tool.category] = (byCategory[tool.category] || 0) + 1;
        }
        return {
            totalTools: this.catalog.tools.length,
            bySource,
            byPriority,
            byCategory,
            alwaysLoadedCount: byPriority.always,
            deferredCount: this.catalog.tools.filter(t => t.deferLoading).length,
        };
    }
    /**
     * Suggest tools based on partial query (autocomplete)
     */
    suggest(partialQuery, limit = 5) {
        return this.bm25.suggest(partialQuery, limit);
    }
}
//# sourceMappingURL=hybrid.js.map