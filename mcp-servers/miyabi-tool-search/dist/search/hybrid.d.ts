/**
 * Hybrid Search Engine
 * Combines BM25 and Regex search for optimal results
 */
import { ToolCatalog, ToolCatalogEntry, SearchResult, SearchOptions, CatalogStats, ToolSource } from "../catalog/types.js";
export declare class HybridSearchEngine {
    private bm25;
    private regex;
    private catalog;
    constructor(catalog: ToolCatalog);
    /**
     * Search for tools using hybrid approach
     */
    search(query: string, options?: SearchOptions): SearchResult[];
    /**
     * Hybrid search combining BM25 and Regex
     */
    private hybridSearch;
    /**
     * Merge results from multiple search engines
     */
    private mergeResults;
    /**
     * Check if query looks like a regex pattern
     */
    private looksLikeRegex;
    /**
     * Convert natural language query to regex pattern
     */
    private queryToPattern;
    /**
     * Get always-loaded tools
     */
    getAlwaysLoadedTools(): ToolCatalogEntry[];
    /**
     * Get deferred tools
     */
    getDeferredTools(): ToolCatalogEntry[];
    /**
     * Get tools by category
     */
    getByCategory(category: string): ToolCatalogEntry[];
    /**
     * Get tools by source
     */
    getBySource(source: ToolSource): ToolCatalogEntry[];
    /**
     * Get tools by server
     */
    getByServer(server: string): ToolCatalogEntry[];
    /**
     * Get catalog reference
     */
    getCatalog(): ToolCatalog;
    /**
     * Get catalog statistics
     */
    getStats(): CatalogStats;
    /**
     * Suggest tools based on partial query (autocomplete)
     */
    suggest(partialQuery: string, limit?: number): string[];
}
//# sourceMappingURL=hybrid.d.ts.map