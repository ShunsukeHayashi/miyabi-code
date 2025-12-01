/**
 * BM25 Search Engine
 * Natural language search for tools using simple BM25-inspired scoring
 */
import { ToolCatalog, SearchResult } from "../catalog/types.js";
/**
 * Simple BM25 implementation for tool search
 */
export declare class BM25SearchEngine {
    private catalog;
    private invertedIndex;
    private documentLengths;
    private avgDocLength;
    private readonly k1;
    private readonly b;
    private readonly fieldWeights;
    constructor(catalog: ToolCatalog);
    /**
     * Build the inverted index
     */
    private buildIndex;
    /**
     * Get searchable text from a tool
     */
    private getDocumentText;
    /**
     * Tokenize text
     */
    private tokenize;
    /**
     * Calculate BM25 score for a document
     */
    private calculateScore;
    /**
     * Search for tools using natural language query
     */
    search(query: string, limit?: number): SearchResult[];
    /**
     * Identify which fields matched the query
     */
    private identifyMatchedFields;
    /**
     * Get suggestions for partial queries (autocomplete)
     */
    suggest(partialQuery: string, limit?: number): string[];
    /**
     * Get catalog statistics
     */
    getStats(): {
        totalDocs: number;
        avgDocLength: number;
        uniqueTerms: number;
    };
}
//# sourceMappingURL=bm25.d.ts.map