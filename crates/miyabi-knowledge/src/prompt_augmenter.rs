//! Prompt augmentation with RAG context
//!
//! This module provides intelligent prompt enhancement by injecting relevant
//! context from the knowledge base using vector similarity search.

use crate::error::Result;
use crate::searcher::{KnowledgeSearcher, SearchFilter};
use crate::types::KnowledgeResult;
use async_trait::async_trait;

/// Minimum relevance score for context inclusion (0.0 - 1.0)
pub const DEFAULT_RELEVANCE_THRESHOLD: f32 = 0.7;

/// Default maximum number of context pieces to inject
pub const DEFAULT_MAX_CONTEXT_PIECES: usize = 5;

/// Prompt augmentation strategy
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AugmentationStrategy {
    /// Prepend context before the main prompt
    Prepend,

    /// Append context after the main prompt
    Append,

    /// Insert context at a specific placeholder
    Template,
}

/// Prompt augmenter trait for injecting RAG context
#[async_trait]
pub trait PromptAugmenter: Send + Sync {
    /// Augment a prompt with relevant context from knowledge base
    ///
    /// # Arguments
    ///
    /// * `base_prompt` - Original prompt without context
    /// * `query` - Query for context retrieval (defaults to base_prompt if None)
    /// * `max_pieces` - Maximum number of context pieces (default: 5)
    /// * `relevance_threshold` - Minimum relevance score (default: 0.7)
    ///
    /// # Returns
    ///
    /// Augmented prompt with injected context
    async fn augment(
        &self,
        base_prompt: &str,
        query: Option<&str>,
        max_pieces: Option<usize>,
        relevance_threshold: Option<f32>,
    ) -> Result<String>;

    /// Augment with custom strategy
    async fn augment_with_strategy(
        &self,
        base_prompt: &str,
        query: Option<&str>,
        strategy: AugmentationStrategy,
        max_pieces: Option<usize>,
        relevance_threshold: Option<f32>,
    ) -> Result<String>;

    /// Augment with filter
    async fn augment_filtered(
        &self,
        base_prompt: &str,
        query: Option<&str>,
        filter: SearchFilter,
        max_pieces: Option<usize>,
        relevance_threshold: Option<f32>,
    ) -> Result<String>;
}

/// Standard prompt augmenter implementation
pub struct StandardPromptAugmenter<S: KnowledgeSearcher> {
    /// Knowledge searcher
    searcher: S,

    /// Default augmentation strategy
    strategy: AugmentationStrategy,

    /// Template placeholder (used when strategy is Template)
    template_placeholder: String,
}

impl<S: KnowledgeSearcher> StandardPromptAugmenter<S> {
    /// Create a new standard prompt augmenter
    ///
    /// # Arguments
    ///
    /// * `searcher` - Knowledge searcher implementation
    /// * `strategy` - Default augmentation strategy (default: Prepend)
    pub fn new(searcher: S) -> Self {
        Self {
            searcher,
            strategy: AugmentationStrategy::Prepend,
            template_placeholder: "{{CONTEXT}}".to_string(),
        }
    }

    /// Create with custom strategy
    pub fn with_strategy(searcher: S, strategy: AugmentationStrategy) -> Self {
        Self {
            searcher,
            strategy,
            template_placeholder: "{{CONTEXT}}".to_string(),
        }
    }

    /// Set custom template placeholder
    pub fn with_placeholder(mut self, placeholder: String) -> Self {
        self.template_placeholder = placeholder;
        self
    }

    /// Format context pieces for injection
    fn format_context(&self, pieces: &[KnowledgeResult]) -> String {
        if pieces.is_empty() {
            return String::new();
        }

        let mut lines = vec!["## Relevant Context from Knowledge Base".to_string()];

        for (i, result) in pieces.iter().enumerate() {
            lines.push(format!(
                "\n### Context {} (Score: {:.2})",
                i + 1,
                result.score
            ));

            // Add metadata if available
            if let Some(agent) = &result.metadata.agent {
                lines.push(format!("**Agent**: {}", agent));
            }
            if let Some(issue) = result.metadata.issue_number {
                lines.push(format!("**Issue**: #{}", issue));
            }
            if let Some(task_type) = &result.metadata.task_type {
                lines.push(format!("**Task Type**: {}", task_type));
            }

            lines.push(format!("```\n{}\n```", result.content));
        }

        lines.push("\n---\n".to_string());
        lines.join("\n")
    }

    /// Filter results by relevance threshold
    fn filter_by_relevance(
        &self,
        results: Vec<KnowledgeResult>,
        threshold: f32,
    ) -> Vec<KnowledgeResult> {
        results
            .into_iter()
            .filter(|r| r.score >= threshold)
            .collect()
    }
}

#[async_trait]
impl<S: KnowledgeSearcher> PromptAugmenter for StandardPromptAugmenter<S> {
    async fn augment(
        &self,
        base_prompt: &str,
        query: Option<&str>,
        max_pieces: Option<usize>,
        relevance_threshold: Option<f32>,
    ) -> Result<String> {
        self.augment_with_strategy(
            base_prompt,
            query,
            self.strategy.clone(),
            max_pieces,
            relevance_threshold,
        )
        .await
    }

    async fn augment_with_strategy(
        &self,
        base_prompt: &str,
        query: Option<&str>,
        strategy: AugmentationStrategy,
        max_pieces: Option<usize>,
        relevance_threshold: Option<f32>,
    ) -> Result<String> {
        let query_text = query.unwrap_or(base_prompt);
        let max_pieces = max_pieces.unwrap_or(DEFAULT_MAX_CONTEXT_PIECES);
        let threshold = relevance_threshold.unwrap_or(DEFAULT_RELEVANCE_THRESHOLD);

        // Search for relevant context
        let mut results = self.searcher.search(query_text).await?;

        // Sort by score (descending)
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        // Filter by relevance threshold
        results = self.filter_by_relevance(results, threshold);

        // Take top N
        results.truncate(max_pieces);

        // If no relevant context, return original prompt
        if results.is_empty() {
            return Ok(base_prompt.to_string());
        }

        // Format context
        let context = self.format_context(&results);

        // Apply strategy
        let augmented = match strategy {
            AugmentationStrategy::Prepend => {
                format!("{}\n{}", context, base_prompt)
            }
            AugmentationStrategy::Append => {
                format!("{}\n{}", base_prompt, context)
            }
            AugmentationStrategy::Template => {
                base_prompt.replace(&self.template_placeholder, &context)
            }
        };

        Ok(augmented)
    }

    async fn augment_filtered(
        &self,
        base_prompt: &str,
        query: Option<&str>,
        filter: SearchFilter,
        max_pieces: Option<usize>,
        relevance_threshold: Option<f32>,
    ) -> Result<String> {
        let query_text = query.unwrap_or(base_prompt);
        let max_pieces = max_pieces.unwrap_or(DEFAULT_MAX_CONTEXT_PIECES);
        let threshold = relevance_threshold.unwrap_or(DEFAULT_RELEVANCE_THRESHOLD);

        // Search with filter
        let mut results = self.searcher.search_filtered(query_text, filter).await?;

        // Sort by score (descending)
        results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        // Filter by relevance threshold
        results = self.filter_by_relevance(results, threshold);

        // Take top N
        results.truncate(max_pieces);

        // If no relevant context, return original prompt
        if results.is_empty() {
            return Ok(base_prompt.to_string());
        }

        // Format and prepend context (default strategy for filtered search)
        let context = self.format_context(&results);
        Ok(format!("{}\n{}", context, base_prompt))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{KnowledgeId, KnowledgeMetadata};
    use chrono::Utc;

    // Mock searcher for testing
    struct MockSearcher {
        results: Vec<KnowledgeResult>,
    }

    #[async_trait]
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
            _entry_id: &KnowledgeId,
            _limit: usize,
        ) -> crate::error::Result<Vec<KnowledgeResult>> {
            Ok(Vec::new())
        }
    }

    #[tokio::test]
    async fn test_augment_with_high_relevance() {
        let mock_results = vec![KnowledgeResult {
            id: KnowledgeId::new(),
            content: "Use thiserror for error handling in Rust".to_string(),
            score: 0.85,
            metadata: KnowledgeMetadata {
                workspace: "test".to_string(),
                worktree: None,
                agent: Some("CodeGenAgent".to_string()),
                issue_number: Some(123),
                task_type: Some("feature".to_string()),
                tools_used: None,
                outcome: None,
                files_changed: None,
                extra: serde_json::Map::new(),
            },
            timestamp: Utc::now(),
        }];

        let searcher = MockSearcher {
            results: mock_results,
        };
        let augmenter = StandardPromptAugmenter::new(searcher);

        let base_prompt = "Generate error handling code";
        let augmented = augmenter
            .augment(base_prompt, None, None, None)
            .await
            .unwrap();

        assert!(augmented.contains("Relevant Context"));
        assert!(augmented.contains("thiserror"));
        assert!(augmented.contains("CodeGenAgent"));
        assert!(augmented.contains("#123"));
        assert!(augmented.contains(base_prompt));
    }

    #[tokio::test]
    async fn test_augment_below_threshold() {
        let mock_results = vec![KnowledgeResult {
            id: KnowledgeId::new(),
            content: "Low relevance content".to_string(),
            score: 0.5, // Below default threshold of 0.7
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

        let searcher = MockSearcher {
            results: mock_results,
        };
        let augmenter = StandardPromptAugmenter::new(searcher);

        let base_prompt = "Generate code";
        let augmented = augmenter
            .augment(base_prompt, None, None, None)
            .await
            .unwrap();

        // Should return original prompt (no relevant context)
        assert_eq!(augmented, base_prompt);
    }

    #[tokio::test]
    async fn test_augmentation_strategies() {
        let mock_results = vec![KnowledgeResult {
            id: KnowledgeId::new(),
            content: "Context content".to_string(),
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

        let searcher = MockSearcher {
            results: mock_results,
        };

        let base_prompt = "Base prompt";
        let augmenter = StandardPromptAugmenter::new(searcher);

        // Test Prepend (default)
        let result = augmenter
            .augment_with_strategy(base_prompt, None, AugmentationStrategy::Prepend, None, None)
            .await
            .unwrap();
        assert!(result.find("Relevant Context").unwrap() < result.find("Base prompt").unwrap());

        // Test Append
        let result = augmenter
            .augment_with_strategy(base_prompt, None, AugmentationStrategy::Append, None, None)
            .await
            .unwrap();
        assert!(result.find("Base prompt").unwrap() < result.find("Relevant Context").unwrap());

        // Test Template
        let template_prompt = "Start {{CONTEXT}} End";
        let result = augmenter
            .augment_with_strategy(
                template_prompt,
                None,
                AugmentationStrategy::Template,
                None,
                None,
            )
            .await
            .unwrap();
        assert!(result.contains("Start"));
        assert!(result.contains("Relevant Context"));
        assert!(result.contains("End"));
        assert!(!result.contains("{{CONTEXT}}"));
    }

    #[tokio::test]
    async fn test_max_pieces_limit() {
        let mock_results = vec![
            KnowledgeResult {
                id: KnowledgeId::new(),
                content: "Result 1".to_string(),
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
            },
            KnowledgeResult {
                id: KnowledgeId::new(),
                content: "Result 2".to_string(),
                score: 0.85,
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
            },
            KnowledgeResult {
                id: KnowledgeId::new(),
                content: "Result 3".to_string(),
                score: 0.8,
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
            },
        ];

        let searcher = MockSearcher {
            results: mock_results,
        };
        let augmenter = StandardPromptAugmenter::new(searcher);

        let base_prompt = "Test";
        let augmented = augmenter
            .augment(base_prompt, None, Some(2), None) // Max 2 pieces
            .await
            .unwrap();

        // Should contain only top 2 results
        assert!(augmented.contains("Result 1"));
        assert!(augmented.contains("Result 2"));
        assert!(!augmented.contains("Result 3"));
    }
}
