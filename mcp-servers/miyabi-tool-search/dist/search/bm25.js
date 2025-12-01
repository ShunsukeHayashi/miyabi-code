/**
 * BM25 Search Engine
 * Natural language search for tools using simple BM25-inspired scoring
 */
/**
 * Simple BM25 implementation for tool search
 */
export class BM25SearchEngine {
    catalog;
    invertedIndex = new Map();
    documentLengths = new Map();
    avgDocLength = 0;
    // BM25 parameters
    k1 = 1.2;
    b = 0.75;
    // Field weights
    fieldWeights = {
        name: 3.0,
        displayName: 2.0,
        description: 1.5,
        keywords: 2.0,
        aliases: 1.5,
        category: 1.0,
    };
    constructor(catalog) {
        this.catalog = catalog;
        this.buildIndex();
    }
    /**
     * Build the inverted index
     */
    buildIndex() {
        let totalLength = 0;
        for (const tool of this.catalog.tools) {
            const docText = this.getDocumentText(tool);
            const tokens = this.tokenize(docText);
            const termFreqs = new Map();
            // Count term frequencies
            for (const token of tokens) {
                termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
            }
            // Update inverted index
            for (const [term, freq] of termFreqs) {
                if (!this.invertedIndex.has(term)) {
                    this.invertedIndex.set(term, new Map());
                }
                this.invertedIndex.get(term).set(tool.id, freq);
            }
            // Store document length
            this.documentLengths.set(tool.id, tokens.length);
            totalLength += tokens.length;
        }
        this.avgDocLength = totalLength / this.catalog.tools.length || 1;
    }
    /**
     * Get searchable text from a tool
     */
    getDocumentText(tool) {
        return [
            // Repeat weighted fields for emphasis
            ...Array(3).fill(tool.name),
            ...Array(2).fill(tool.displayName),
            tool.description,
            ...Array(2).fill(tool.keywords.join(" ")),
            tool.aliases.join(" "),
            tool.category,
            tool.subcategory || "",
        ].join(" ");
    }
    /**
     * Tokenize text
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length > 1);
    }
    /**
     * Calculate BM25 score for a document
     */
    calculateScore(docId, queryTerms) {
        const docLength = this.documentLengths.get(docId) || 1;
        const N = this.catalog.tools.length;
        let score = 0;
        for (const term of queryTerms) {
            const termDocs = this.invertedIndex.get(term);
            if (!termDocs)
                continue;
            const tf = termDocs.get(docId) || 0;
            if (tf === 0)
                continue;
            const df = termDocs.size;
            const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
            const numerator = tf * (this.k1 + 1);
            const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
            score += idf * (numerator / denominator);
        }
        return score;
    }
    /**
     * Search for tools using natural language query
     */
    search(query, limit = 5) {
        if (!query.trim()) {
            return [];
        }
        const queryTerms = this.tokenize(query);
        if (queryTerms.length === 0) {
            return [];
        }
        const scores = [];
        // Calculate scores for all documents that contain at least one query term
        const candidateDocs = new Set();
        for (const term of queryTerms) {
            const termDocs = this.invertedIndex.get(term);
            if (termDocs) {
                for (const docId of termDocs.keys()) {
                    candidateDocs.add(docId);
                }
            }
        }
        for (const docId of candidateDocs) {
            const score = this.calculateScore(docId, queryTerms);
            if (score > 0) {
                scores.push({ id: docId, score });
            }
        }
        // Sort by score and return top results
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(({ id, score }) => {
            const tool = this.catalog.byId[id];
            return {
                tool,
                score,
                matchedFields: this.identifyMatchedFields(query, tool),
            };
        })
            .filter((r) => r.tool !== undefined);
    }
    /**
     * Identify which fields matched the query
     */
    identifyMatchedFields(query, tool) {
        const queryTerms = this.tokenize(query);
        const matched = [];
        const checkField = (fieldName, value) => {
            const text = Array.isArray(value) ? value.join(" ") : value;
            const fieldTokens = this.tokenize(text);
            for (const term of queryTerms) {
                if (fieldTokens.some((t) => t.includes(term) || term.includes(t))) {
                    matched.push(fieldName);
                    break;
                }
            }
        };
        checkField("name", tool.name);
        checkField("displayName", tool.displayName);
        checkField("description", tool.description);
        checkField("keywords", tool.keywords);
        checkField("aliases", tool.aliases);
        checkField("category", tool.category);
        return [...new Set(matched)];
    }
    /**
     * Get suggestions for partial queries (autocomplete)
     */
    suggest(partialQuery, limit = 5) {
        const suggestions = new Set();
        const lowerQuery = partialQuery.toLowerCase();
        for (const tool of this.catalog.tools) {
            // Check tool name
            if (tool.name.toLowerCase().includes(lowerQuery)) {
                suggestions.add(tool.name);
            }
            // Check keywords
            for (const keyword of tool.keywords) {
                if (keyword.toLowerCase().includes(lowerQuery)) {
                    suggestions.add(keyword);
                }
            }
            // Check aliases
            for (const alias of tool.aliases) {
                if (alias.toLowerCase().includes(lowerQuery)) {
                    suggestions.add(alias);
                }
            }
            if (suggestions.size >= limit) {
                break;
            }
        }
        return [...suggestions].slice(0, limit);
    }
    /**
     * Get catalog statistics
     */
    getStats() {
        return {
            totalDocs: this.catalog.tools.length,
            avgDocLength: this.avgDocLength,
            uniqueTerms: this.invertedIndex.size,
        };
    }
}
//# sourceMappingURL=bm25.js.map