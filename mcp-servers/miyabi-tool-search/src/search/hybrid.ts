/**
 * Hybrid Search Engine
 * Combines BM25 and Regex search for optimal results
 */

import { BM25SearchEngine } from "./bm25.js";
import { RegexSearchEngine } from "./regex.js";
import {
  ToolCatalog,
  ToolCatalogEntry,
  SearchResult,
  SearchOptions,
  CatalogStats,
  ToolSource,
  ToolPriority,
} from "../catalog/types.js";

export class HybridSearchEngine {
  private bm25: BM25SearchEngine;
  private regex: RegexSearchEngine;
  private catalog: ToolCatalog;

  constructor(catalog: ToolCatalog) {
    this.catalog = catalog;
    this.bm25 = new BM25SearchEngine(catalog);
    this.regex = new RegexSearchEngine(catalog);
  }

  /**
   * Search for tools using hybrid approach
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const {
      type = "hybrid",
      limit = 5,
      category,
      source,
      minScore = 0,
    } = options;

    let results: SearchResult[];

    // Determine search type
    if (type === "regex" || this.looksLikeRegex(query)) {
      results = this.regex.search(query, limit * 2);
    } else if (type === "bm25") {
      results = this.bm25.search(query, limit * 2);
    } else {
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
  private hybridSearch(query: string, limit: number): SearchResult[] {
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
  private mergeResults(
    bm25Results: SearchResult[],
    regexResults: SearchResult[],
    limit: number
  ): SearchResult[] {
    const scoreMap = new Map<string, SearchResult>();

    // Add BM25 results with weight
    for (const result of bm25Results) {
      const existing = scoreMap.get(result.tool.id);
      if (existing) {
        existing.score += result.score * 0.6;
        existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
      } else {
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
      } else {
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
  private looksLikeRegex(query: string): boolean {
    // Check for common regex metacharacters
    return /[.*+?^${}()|[\]\\]/.test(query);
  }

  /**
   * Convert natural language query to regex pattern
   */
  private queryToPattern(query: string): string {
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
  getAlwaysLoadedTools(): ToolCatalogEntry[] {
    const toolIds = this.catalog.byPriority["always"] || [];
    return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
  }

  /**
   * Get deferred tools
   */
  getDeferredTools(): ToolCatalogEntry[] {
    return this.catalog.tools.filter(t => t.deferLoading);
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ToolCatalogEntry[] {
    const toolIds = this.catalog.byCategory[category] || [];
    return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
  }

  /**
   * Get tools by source
   */
  getBySource(source: ToolSource): ToolCatalogEntry[] {
    const toolIds = this.catalog.bySource[source] || [];
    return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
  }

  /**
   * Get tools by server
   */
  getByServer(server: string): ToolCatalogEntry[] {
    const toolIds = this.catalog.byServer[server] || [];
    return toolIds.map(id => this.catalog.byId[id]).filter(Boolean);
  }

  /**
   * Get catalog reference
   */
  getCatalog(): ToolCatalog {
    return this.catalog;
  }

  /**
   * Get catalog statistics
   */
  getStats(): CatalogStats {
    const bySource: Record<ToolSource, number> = {
      mcp: 0,
      rust_crate: 0,
      subagent: 0,
      builtin: 0,
    };

    const byPriority: Record<ToolPriority, number> = {
      always: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byCategory: Record<string, number> = {};

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
  suggest(partialQuery: string, limit: number = 5): string[] {
    return this.bm25.suggest(partialQuery, limit);
  }
}
