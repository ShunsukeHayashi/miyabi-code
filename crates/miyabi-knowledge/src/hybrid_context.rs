//! Hybrid context combining AST analysis and RAG vector search
//!
//! This module integrates AST-based code structure analysis with RAG vector search
//! to provide comprehensive context for LLM prompts.

use crate::ast_context::{FileContext, FileContextTracker};
use crate::searcher::{KnowledgeSearcher, SearchFilter};
use std::path::PathBuf;
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

/// Hybrid context searcher combining AST and RAG
pub struct HybridContextSearcher<S: KnowledgeSearcher> {
    /// AST tracker
    ast_tracker: FileContextTracker,

    /// RAG searcher
    rag_searcher: S,

    /// AST weight (0.0 - 1.0, remaining goes to RAG)
    ast_weight: f32,
}

impl<S: KnowledgeSearcher> HybridContextSearcher<S> {
    /// Create a new hybrid searcher
    ///
    /// # Arguments
    ///
    /// * `rag_searcher` - Vector database searcher
    /// * `ast_weight` - Weight for AST results (0.0 = RAG only, 1.0 = AST only)
    pub fn new(rag_searcher: S, ast_weight: f32) -> Result<Self> {
        let ast_tracker = FileContextTracker::new_rust()?;
        Ok(Self {
            ast_tracker,
            rag_searcher,
            ast_weight: ast_weight.clamp(0.0, 1.0),
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
            context_pieces.push(ContextPiece {
                source: ContextSource::Rag,
                content: result.content,
                score: result.score * (1.0 - self.ast_weight),
                file_path: None,
                line_range: None,
            });
        }

        // Add AST results if files provided
        if let Some(file_paths) = files {
            for path in file_paths {
                if path.extension().and_then(|e| e.to_str()) == Some("rs") {
                    if let Ok(file_context) = self.ast_tracker.parse_file(path) {
                        // Extract relevant symbols based on query
                        let relevant = self.extract_relevant_symbols(&file_context, query);

                        for (content, line_range) in relevant {
                            context_pieces.push(ContextPiece {
                                source: ContextSource::Ast,
                                content,
                                score: 0.8 * self.ast_weight, // AST matches are high confidence
                                file_path: Some(path.clone()),
                                line_range: Some(line_range),
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

    /// Format context pieces for prompt injection
    pub fn format_for_prompt(&self, pieces: &[ContextPiece], max_tokens: usize) -> String {
        let mut output = vec!["## Relevant Context".to_string()];
        let mut token_count = 0;
        let avg_chars_per_token = 4; // Rough estimate

        for (i, piece) in pieces.iter().enumerate() {
            let estimated_tokens = piece.content.len() / avg_chars_per_token;
            if token_count + estimated_tokens > max_tokens {
                break;
            }

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
                "\n### Context {} [{}] Score: {:.2}{}",
                i + 1,
                source_label,
                piece.score,
                location
            ));
            output.push(format!("```\n{}\n```", piece.content));

            token_count += estimated_tokens;
        }

        output.join("\n")
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
        }];

        let formatted = hybrid.format_for_prompt(&pieces, 1000);

        assert!(formatted.contains("Relevant Context"));
        assert!(formatted.contains("AST"));
        assert!(formatted.contains("test.rs"));
    }
}
