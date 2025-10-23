//! Hybrid context combining AST analysis and RAG vector search
//!
//! This module integrates AST-based code structure analysis with RAG vector search
//! to provide comprehensive context for LLM prompts.

use crate::ast_context::{FileContext, FileContextTracker};
use crate::searcher::{KnowledgeSearcher, SearchFilter};
use std::collections::HashMap;
use std::path::PathBuf;
use std::time::{Duration, SystemTime};
use thiserror::Error;

/// Errors that can occur during hybrid context operations
#[derive(Error, Debug)]
pub enum HybridContextError {
    /// AST parsing error
    #[error("AST error: {0}")]
    AstError(#[from] crate::ast_context::AstError),

    /// Vector search error
    #[error("Search error: {0}")]
    SearchError(#[from] crate::error::KnowledgeError),

    /// I/O error
    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, HybridContextError>;

/// Represents a piece of context with relevance score
#[derive(Debug, Clone)]
pub struct ContextPiece {
    /// Source of context (AST or RAG)
    pub source: ContextSource,

    /// Content
    pub content: String,

    /// Relevance score (0.0 - 1.0)
    pub score: f32,

    /// File path (if applicable)
    pub file_path: Option<PathBuf>,

    /// Line range (if applicable)
    pub line_range: Option<(usize, usize)>,

    /// Priority for context pruning (0 = lowest, 10 = highest)
    pub priority: u8,
}

impl ContextPiece {
    /// Calculate priority based on source and score
    fn calculate_priority(source: &ContextSource, score: f32) -> u8 {
        match source {
            // AST matches are high confidence, prioritize based on score
            ContextSource::Ast => {
                if score >= 0.9 {
                    10
                } else if score >= 0.8 {
                    9
                } else if score >= 0.7 {
                    8
                } else {
                    7
                }
            }
            // RAG matches prioritized by score
            ContextSource::Rag => {
                if score >= 0.9 {
                    9
                } else if score >= 0.8 {
                    8
                } else if score >= 0.7 {
                    7
                } else if score >= 0.6 {
                    6
                } else {
                    5
                }
            }
            // Hybrid (both sources agree) gets highest priority
            ContextSource::Hybrid => 10,
        }
    }
}

/// Source of context
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContextSource {
    /// From AST analysis
    Ast,

    /// From RAG vector search
    Rag,

    /// Hybrid (both sources agree)
    Hybrid,
}

/// Cache entry for AST parsing results
#[derive(Debug, Clone)]
struct CacheEntry {
    /// Cached file context
    context: FileContext,

    /// Timestamp when cached
    cached_at: SystemTime,

    /// File modification time at cache time
    file_mtime: SystemTime,
}

/// Hybrid context searcher combining AST and RAG
pub struct HybridContextSearcher<S: KnowledgeSearcher> {
    /// AST tracker
    ast_tracker: FileContextTracker,

    /// RAG searcher
    rag_searcher: S,

    /// AST weight (0.0 - 1.0, remaining goes to RAG)
    ast_weight: f32,

    /// AST parse cache (path -> (context, timestamp))
    ast_cache: HashMap<PathBuf, CacheEntry>,

    /// Cache TTL (time-to-live)
    cache_ttl: Duration,

    /// Maximum cache size (number of entries)
    max_cache_size: usize,
}

impl<S: KnowledgeSearcher> HybridContextSearcher<S> {
    /// Create a new hybrid searcher
    ///
    /// # Arguments
    ///
    /// * `rag_searcher` - Vector database searcher
    /// * `ast_weight` - Weight for AST results (0.0 = RAG only, 1.0 = AST only)
    pub fn new(rag_searcher: S, ast_weight: f32) -> Result<Self> {
        Self::new_with_cache(rag_searcher, ast_weight, Duration::from_secs(300), 100)
    }

    /// Create a new hybrid searcher with custom cache settings
    ///
    /// # Arguments
    ///
    /// * `rag_searcher` - Vector database searcher
    /// * `ast_weight` - Weight for AST results (0.0 = RAG only, 1.0 = AST only)
    /// * `cache_ttl` - Cache time-to-live
    /// * `max_cache_size` - Maximum number of cached entries
    pub fn new_with_cache(
        rag_searcher: S,
        ast_weight: f32,
        cache_ttl: Duration,
        max_cache_size: usize,
    ) -> Result<Self> {
        let ast_tracker = FileContextTracker::new_rust()?;
        Ok(Self {
            ast_tracker,
            rag_searcher,
            ast_weight: ast_weight.clamp(0.0, 1.0),
            ast_cache: HashMap::new(),
            cache_ttl,
            max_cache_size,
        })
    }

    /// Search for context using both AST and RAG
    ///
    /// # Arguments
    ///
    /// * `query` - Search query
    /// * `files` - Files to analyze with AST (optional)
    /// * `limit` - Maximum number of results
    ///
    /// # Returns
    ///
    /// Combined and ranked context pieces from both sources
    pub async fn search(
        &mut self,
        query: &str,
        files: Option<&[PathBuf]>,
        limit: usize,
    ) -> Result<Vec<ContextPiece>> {
        // Get RAG results
        let rag_results = self
            .rag_searcher
            .search(query)
            .await
            .map_err(HybridContextError::SearchError)?;

        let mut context_pieces = Vec::new();

        // Convert RAG results to context pieces
        for result in rag_results {
            let score = result.score * (1.0 - self.ast_weight);
            let source = ContextSource::Rag;
            context_pieces.push(ContextPiece {
                source: source.clone(),
                content: result.content,
                score,
                file_path: None,
                line_range: None,
                priority: ContextPiece::calculate_priority(&source, score),
            });
        }

        // Add AST results if files provided
        if let Some(file_paths) = files {
            for path in file_paths {
                if path.extension().and_then(|e| e.to_str()) == Some("rs") {
                    // Try to get from cache first
                    if let Some(file_context) = self.get_cached_or_parse(path)? {
                        // Extract relevant symbols based on query
                        let relevant = self.extract_relevant_symbols(&file_context, query);

                        for (content, line_range) in relevant {
                            let score = 0.8 * self.ast_weight; // AST matches are high confidence
                            let source = ContextSource::Ast;
                            context_pieces.push(ContextPiece {
                                source: source.clone(),
                                content,
                                score,
                                file_path: Some(path.clone()),
                                line_range: Some(line_range),
                                priority: ContextPiece::calculate_priority(&source, score),
                            });
                        }
                    }
                }
            }
        }

        // Sort by score and take top N
        context_pieces.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        context_pieces.truncate(limit);

        Ok(context_pieces)
    }

    /// Search specific files with AST analysis only
    pub fn search_files(&mut self, files: &[PathBuf]) -> Result<Vec<FileContext>> {
        let mut contexts = Vec::new();

        for path in files {
            if path.extension().and_then(|e| e.to_str()) == Some("rs") {
                let context = self.ast_tracker.parse_file(path)?;
                contexts.push(context);
            }
        }

        Ok(contexts)
    }

    /// Format context pieces for prompt injection with priority-based pruning
    ///
    /// Implements multi-pass pruning algorithm:
    /// 1. First pass: Include all priority 10 items (critical)
    /// 2. Second pass: Include priority 9-8 items until 80% budget
    /// 3. Third pass: Fill remaining budget with priority 7-5 items
    pub fn format_for_prompt(&self, pieces: &[ContextPiece], max_tokens: usize) -> String {
        let avg_chars_per_token = 4; // Rough estimate
        let mut output = vec!["## Relevant Context".to_string()];
        let mut included_pieces = Vec::new();
        let mut token_count = 0;

        // Sort by priority (descending) and score (descending)
        let mut sorted_pieces: Vec<_> = pieces.iter().collect();
        sorted_pieces.sort_by(|a, b| {
            b.priority
                .cmp(&a.priority)
                .then_with(|| b.score.partial_cmp(&a.score).unwrap())
        });

        // Multi-pass pruning algorithm
        // Pass 1: Critical items (priority 10)
        for piece in sorted_pieces.iter() {
            if piece.priority == 10 {
                let estimated_tokens = piece.content.len() / avg_chars_per_token;
                if token_count + estimated_tokens <= max_tokens {
                    included_pieces.push(*piece);
                    token_count += estimated_tokens;
                }
            }
        }

        // Pass 2: High priority items (priority 9-8) until 80% budget
        let budget_80_percent = (max_tokens as f32 * 0.8) as usize;
        if token_count < budget_80_percent {
            for piece in sorted_pieces.iter() {
                if piece.priority >= 8 && piece.priority < 10 {
                    let estimated_tokens = piece.content.len() / avg_chars_per_token;
                    if token_count + estimated_tokens <= budget_80_percent {
                        included_pieces.push(*piece);
                        token_count += estimated_tokens;
                    }
                }
            }
        }

        // Pass 3: Fill remaining budget with medium priority items (priority 7-5)
        for piece in sorted_pieces.iter() {
            if piece.priority >= 5 && piece.priority < 8 {
                let estimated_tokens = piece.content.len() / avg_chars_per_token;
                if token_count + estimated_tokens <= max_tokens {
                    included_pieces.push(*piece);
                    token_count += estimated_tokens;
                }
            }
        }

        // Format output
        for (i, piece) in included_pieces.iter().enumerate() {
            let source_label = match piece.source {
                ContextSource::Ast => "AST",
                ContextSource::Rag => "RAG",
                ContextSource::Hybrid => "Hybrid",
            };

            let location = piece
                .file_path
                .as_ref()
                .map(|p| {
                    if let Some((start, end)) = piece.line_range {
                        format!(" ({}:L{}-L{})", p.display(), start, end)
                    } else {
                        format!(" ({})", p.display())
                    }
                })
                .unwrap_or_default();

            output.push(format!(
                "\n### Context {} [{}] Priority: {} Score: {:.2}{}",
                i + 1,
                source_label,
                piece.priority,
                piece.score,
                location
            ));
            output.push(format!("```\n{}\n```", piece.content));
        }

        // Add metadata footer
        output.push(format!(
            "\n---\n**Included**: {} pieces | **Estimated tokens**: {} / {}",
            included_pieces.len(),
            token_count,
            max_tokens
        ));

        output.join("\n")
    }

    /// Get cached file context or parse the file
    ///
    /// Implements cache invalidation based on:
    /// 1. TTL expiration
    /// 2. File modification time change
    fn get_cached_or_parse(&mut self, path: &std::path::Path) -> Result<Option<FileContext>> {
        let now = SystemTime::now();

        // Get file metadata
        let metadata = match std::fs::metadata(path) {
            Ok(m) => m,
            Err(_) => return Ok(None), // File doesn't exist or can't read
        };

        let file_mtime = metadata
            .modified()
            .unwrap_or_else(|_| SystemTime::UNIX_EPOCH);

        // Check cache
        if let Some(entry) = self.ast_cache.get(path) {
            // Check if cache is still valid
            let cache_age = now
                .duration_since(entry.cached_at)
                .unwrap_or(Duration::from_secs(0));

            if cache_age < self.cache_ttl && entry.file_mtime == file_mtime {
                // Cache hit - return cached context
                return Ok(Some(entry.context.clone()));
            } else {
                // Cache expired or file modified - remove entry
                self.ast_cache.remove(path);
            }
        }

        // Cache miss - parse file
        let context = self.ast_tracker.parse_file(path)?;

        // Add to cache (with LRU eviction if needed)
        if self.ast_cache.len() >= self.max_cache_size {
            self.evict_lru_entry();
        }

        self.ast_cache.insert(
            path.to_path_buf(),
            CacheEntry {
                context: context.clone(),
                cached_at: now,
                file_mtime,
            },
        );

        Ok(Some(context))
    }

    /// Evict least recently used cache entry
    fn evict_lru_entry(&mut self) {
        if let Some(oldest_key) = self
            .ast_cache
            .iter()
            .min_by_key(|(_, entry)| entry.cached_at)
            .map(|(k, _)| k.clone())
        {
            self.ast_cache.remove(&oldest_key);
        }
    }

    /// Clear the AST parse cache
    pub fn clear_cache(&mut self) {
        self.ast_cache.clear();
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> (usize, usize) {
        (self.ast_cache.len(), self.max_cache_size)
    }

    /// Extract relevant symbols from file context based on query
    fn extract_relevant_symbols(
        &self,
        context: &FileContext,
        query: &str,
    ) -> Vec<(String, (usize, usize))> {
        let query_lower = query.to_lowercase();
        let mut relevant = Vec::new();

        for symbol in &context.symbols {
            // Match by symbol name
            if symbol.name.to_lowercase().contains(&query_lower) {
                relevant.push((
                    format!("{} {}", symbol.kind_str(), symbol.name),
                    (symbol.start_line, symbol.end_line),
                ));
                continue;
            }

            // Match by doc comment
            if let Some(doc) = &symbol.doc_comment {
                if doc.to_lowercase().contains(&query_lower) {
                    relevant.push((
                        format!("{} {} // {}", symbol.kind_str(), symbol.name, doc),
                        (symbol.start_line, symbol.end_line),
                    ));
                }
            }
        }

        relevant
    }
}

impl crate::ast_context::CodeSymbol {
    /// Get string representation of symbol kind
    fn kind_str(&self) -> &str {
        match self.kind {
            crate::ast_context::SymbolKind::Function => "fn",
            crate::ast_context::SymbolKind::Struct => "struct",
            crate::ast_context::SymbolKind::Enum => "enum",
            crate::ast_context::SymbolKind::Trait => "trait",
            crate::ast_context::SymbolKind::Impl => "impl",
            crate::ast_context::SymbolKind::Const => "const",
            crate::ast_context::SymbolKind::Static => "static",
            crate::ast_context::SymbolKind::TypeAlias => "type",
            crate::ast_context::SymbolKind::Module => "mod",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::KnowledgeResult;

    // Mock searcher for testing
    struct MockSearcher {
        results: Vec<KnowledgeResult>,
    }

    #[async_trait::async_trait]
    impl KnowledgeSearcher for MockSearcher {
        async fn search(&self, _query: &str) -> crate::error::Result<Vec<KnowledgeResult>> {
            Ok(self.results.clone())
        }

        async fn search_filtered(
            &self,
            _query: &str,
            _filter: SearchFilter,
        ) -> crate::error::Result<Vec<KnowledgeResult>> {
            Ok(self.results.clone())
        }

        async fn find_similar(
            &self,
            _entry_id: &crate::types::KnowledgeId,
            _limit: usize,
        ) -> crate::error::Result<Vec<KnowledgeResult>> {
            Ok(Vec::new())
        }
    }

    #[tokio::test]
    async fn test_hybrid_search() {
        use crate::types::KnowledgeMetadata;
        use chrono::Utc;

        let mock_results = vec![KnowledgeResult {
            id: crate::types::KnowledgeId::new(),
            content: "Mock RAG result".to_string(),
            score: 0.9,
            metadata: KnowledgeMetadata {
                workspace: "test".to_string(),
                worktree: None,
                agent: None,
                issue_number: None,
                task_type: None,
                tools_used: None,
                outcome: None,
                files_changed: None,
                extra: serde_json::Map::new(),
            },
            timestamp: Utc::now(),
        }];

        let mock_searcher = MockSearcher {
            results: mock_results,
        };

        let mut hybrid = HybridContextSearcher::new(mock_searcher, 0.5).unwrap();

        let results = hybrid.search("test query", None, 10).await.unwrap();

        assert!(!results.is_empty());
        assert_eq!(results[0].source, ContextSource::Rag);
    }

    #[test]
    fn test_format_for_prompt() {
        let mock_searcher = MockSearcher {
            results: Vec::new(),
        };

        let hybrid = HybridContextSearcher::new(mock_searcher, 0.5).unwrap();

        let pieces = vec![ContextPiece {
            source: ContextSource::Ast,
            content: "fn test() {}".to_string(),
            score: 0.9,
            file_path: Some(PathBuf::from("test.rs")),
            line_range: Some((1, 3)),
            priority: 10,
        }];

        let formatted = hybrid.format_for_prompt(&pieces, 1000);

        assert!(formatted.contains("Relevant Context"));
        assert!(formatted.contains("AST"));
        assert!(formatted.contains("test.rs"));
        assert!(formatted.contains("Priority: 10"));
    }

    #[test]
    fn test_priority_based_pruning() {
        let mock_searcher = MockSearcher {
            results: Vec::new(),
        };

        let hybrid = HybridContextSearcher::new(mock_searcher, 0.5).unwrap();

        // Create pieces with different priorities
        let pieces = vec![
            ContextPiece {
                source: ContextSource::Hybrid,
                content: "Critical hybrid match".to_string(),
                score: 0.95,
                file_path: None,
                line_range: None,
                priority: 10,
            },
            ContextPiece {
                source: ContextSource::Ast,
                content: "High priority AST".to_string(),
                score: 0.85,
                file_path: None,
                line_range: None,
                priority: 9,
            },
            ContextPiece {
                source: ContextSource::Rag,
                content: "Medium priority RAG".to_string(),
                score: 0.65,
                file_path: None,
                line_range: None,
                priority: 6,
            },
            ContextPiece {
                source: ContextSource::Rag,
                content: "Low priority RAG".to_string(),
                score: 0.55,
                file_path: None,
                line_range: None,
                priority: 5,
            },
        ];

        // Small token budget - should prioritize high priority items
        let formatted = hybrid.format_for_prompt(&pieces, 20); // Very small budget

        // Priority 10 should always be included
        assert!(formatted.contains("Critical hybrid match"));
        // Priority 9 might be included depending on token count
        // Priority 6 and 5 likely excluded due to budget
    }

    #[test]
    fn test_cache_functionality() {
        let mock_searcher = MockSearcher {
            results: Vec::new(),
        };

        let mut hybrid = HybridContextSearcher::new_with_cache(
            mock_searcher,
            0.5,
            Duration::from_secs(1), // 1 second TTL
            2,                      // Max 2 entries
        )
        .unwrap();

        // Initially empty cache
        let (size, max) = hybrid.cache_stats();
        assert_eq!(size, 0);
        assert_eq!(max, 2);

        // Clear cache should work even when empty
        hybrid.clear_cache();
        let (size, _) = hybrid.cache_stats();
        assert_eq!(size, 0);
    }

    #[test]
    fn test_cache_eviction() {
        use std::time::SystemTime;

        let mock_searcher = MockSearcher {
            results: Vec::new(),
        };

        let mut hybrid = HybridContextSearcher::new_with_cache(
            mock_searcher,
            0.5,
            Duration::from_secs(300), // 5 minutes TTL
            2,                        // Max 2 entries
        )
        .unwrap();

        // Manually add cache entries to test eviction
        let path1 = PathBuf::from("test1.rs");
        let path2 = PathBuf::from("test2.rs");
        let path3 = PathBuf::from("test3.rs");

        let dummy_context = FileContext {
            path: path1.clone(),
            symbols: vec![],
            total_lines: 0,
            language: "rust".to_string(),
            imports: vec![],
        };

        let now = SystemTime::now();

        // Add first entry
        hybrid.ast_cache.insert(
            path1.clone(),
            CacheEntry {
                context: dummy_context.clone(),
                cached_at: now,
                file_mtime: now,
            },
        );

        // Add second entry
        hybrid.ast_cache.insert(
            path2.clone(),
            CacheEntry {
                context: dummy_context.clone(),
                cached_at: now + Duration::from_secs(1),
                file_mtime: now,
            },
        );

        assert_eq!(hybrid.ast_cache.len(), 2);

        // Add third entry - should trigger eviction of oldest (path1)
        hybrid.ast_cache.insert(
            path3.clone(),
            CacheEntry {
                context: dummy_context.clone(),
                cached_at: now + Duration::from_secs(2),
                file_mtime: now,
            },
        );

        // Manually evict LRU entry
        hybrid.evict_lru_entry();

        assert_eq!(hybrid.ast_cache.len(), 2);
        assert!(!hybrid.ast_cache.contains_key(&path1)); // Oldest should be evicted
    }

    #[test]
    fn test_calculate_priority() {
        // AST with high score
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Ast, 0.9),
            10
        );
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Ast, 0.85),
            9
        );
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Ast, 0.75),
            8
        );
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Ast, 0.65),
            7
        );

        // RAG with varying scores
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Rag, 0.9),
            9
        );
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Rag, 0.85),
            8
        );
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Rag, 0.65),
            6
        );
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Rag, 0.55),
            5
        );

        // Hybrid always gets max priority
        assert_eq!(
            ContextPiece::calculate_priority(&ContextSource::Hybrid, 0.5),
            10
        );
    }
}
