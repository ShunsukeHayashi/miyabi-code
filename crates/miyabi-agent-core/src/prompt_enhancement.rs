//! Prompt enhancement utilities for agents
//!
//! This module provides optional prompt augmentation with RAG context from the knowledge base.
//! Agents can opt-in to prompt enhancement without modifying the BaseAgent trait.

use miyabi_knowledge::{
    AugmentationStrategy, PromptAugmenter, StandardPromptAugmenter, DEFAULT_MAX_CONTEXT_PIECES,
    DEFAULT_RELEVANCE_THRESHOLD, KnowledgeConfig, QdrantSearcher, SearchFilter,
};
use miyabi_types::error::{MiyabiError, Result};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Prompt enhancement configuration
#[derive(Debug, Clone)]
pub struct PromptEnhancementConfig {
    /// Enable prompt enhancement
    pub enabled: bool,

    /// Maximum context pieces to inject
    pub max_context_pieces: usize,

    /// Relevance threshold (0.0 - 1.0)
    pub relevance_threshold: f32,

    /// Augmentation strategy
    pub strategy: AugmentationStrategy,

    /// Filter results by agent type
    pub filter_by_agent: Option<String>,

    /// Filter results by outcome
    pub filter_by_outcome: Option<String>,
}

impl Default for PromptEnhancementConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            max_context_pieces: DEFAULT_MAX_CONTEXT_PIECES,
            relevance_threshold: DEFAULT_RELEVANCE_THRESHOLD,
            strategy: AugmentationStrategy::Prepend,
            filter_by_agent: None,
            filter_by_outcome: Some("success".to_string()), // Only successful executions by default
        }
    }
}

impl PromptEnhancementConfig {
    /// Create config with custom settings
    pub fn new(max_context_pieces: usize, relevance_threshold: f32) -> Self {
        Self {
            max_context_pieces,
            relevance_threshold,
            ..Default::default()
        }
    }

    /// Disable prompt enhancement
    pub fn disabled() -> Self {
        Self {
            enabled: false,
            ..Default::default()
        }
    }

    /// Set augmentation strategy
    pub fn with_strategy(mut self, strategy: AugmentationStrategy) -> Self {
        self.strategy = strategy;
        self
    }

    /// Filter by agent type
    pub fn with_agent_filter(mut self, agent: String) -> Self {
        self.filter_by_agent = Some(agent);
        self
    }

    /// Filter by outcome
    pub fn with_outcome_filter(mut self, outcome: String) -> Self {
        self.filter_by_outcome = Some(outcome);
        self
    }
}

/// Prompt enhancer for agents
///
/// Provides RAG-based context injection for agent prompts.
/// Thread-safe and can be shared across multiple agents.
pub struct AgentPromptEnhancer {
    augmenter: Arc<RwLock<StandardPromptAugmenter<QdrantSearcher>>>,
    config: PromptEnhancementConfig,
}

impl AgentPromptEnhancer {
    /// Create a new prompt enhancer
    ///
    /// # Arguments
    ///
    /// * `knowledge_config` - Knowledge base configuration
    /// * `enhancement_config` - Prompt enhancement configuration
    pub async fn new(
        knowledge_config: KnowledgeConfig,
        enhancement_config: PromptEnhancementConfig,
    ) -> Result<Self> {
        let searcher = QdrantSearcher::new(knowledge_config)
            .await
            .map_err(|e| MiyabiError::Config(format!("Failed to create Qdrant searcher: {}", e)))?;

        let augmenter = StandardPromptAugmenter::with_strategy(
            searcher,
            enhancement_config.strategy.clone(),
        );

        Ok(Self {
            augmenter: Arc::new(RwLock::new(augmenter)),
            config: enhancement_config,
        })
    }

    /// Enhance a prompt with relevant context
    ///
    /// # Arguments
    ///
    /// * `base_prompt` - Original prompt without context
    /// * `query` - Custom query for context retrieval (defaults to base_prompt)
    ///
    /// # Returns
    ///
    /// Enhanced prompt with injected context, or original prompt if enhancement is disabled
    pub async fn enhance(&self, base_prompt: &str, query: Option<&str>) -> Result<String> {
        if !self.config.enabled {
            return Ok(base_prompt.to_string());
        }

        let augmenter = self.augmenter.read().await;

        // Build search filter if specified
        let result = if self.config.filter_by_agent.is_some()
            || self.config.filter_by_outcome.is_some()
        {
            let mut filter = SearchFilter::default();

            if let Some(ref agent) = self.config.filter_by_agent {
                filter.agent = Some(agent.clone());
            }

            if let Some(ref outcome) = self.config.filter_by_outcome {
                filter.outcome = Some(outcome.clone());
            }

            augmenter
                .augment_filtered(
                    base_prompt,
                    query,
                    filter,
                    Some(self.config.max_context_pieces),
                    Some(self.config.relevance_threshold),
                )
                .await
        } else {
            augmenter
                .augment(
                    base_prompt,
                    query,
                    Some(self.config.max_context_pieces),
                    Some(self.config.relevance_threshold),
                )
                .await
        };

        result.map_err(|e| MiyabiError::Config(format!("Prompt enhancement failed: {}", e)))
    }

    /// Enhance with custom strategy
    pub async fn enhance_with_strategy(
        &self,
        base_prompt: &str,
        query: Option<&str>,
        strategy: AugmentationStrategy,
    ) -> Result<String> {
        if !self.config.enabled {
            return Ok(base_prompt.to_string());
        }

        let augmenter = self.augmenter.read().await;

        augmenter
            .augment_with_strategy(
                base_prompt,
                query,
                strategy,
                Some(self.config.max_context_pieces),
                Some(self.config.relevance_threshold),
            )
            .await
            .map_err(|e| MiyabiError::Config(format!("Prompt enhancement failed: {}", e)))
    }

    /// Check if enhancement is enabled
    pub fn is_enabled(&self) -> bool {
        self.config.enabled
    }

    /// Get current configuration
    pub fn config(&self) -> &PromptEnhancementConfig {
        &self.config
    }
}

/// Template variable replacer for agent prompts
///
/// Supports common template variables:
/// - `{{TASK_DESCRIPTION}}` - Task description
/// - `{{TASK_ID}}` - Task ID
/// - `{{AGENT_TYPE}}` - Agent type
/// - `{{CONTEXT}}` - RAG context (placeholder for PromptAugmenter)
pub struct PromptTemplate {
    template: String,
}

impl PromptTemplate {
    /// Create a new prompt template
    pub fn new(template: impl Into<String>) -> Self {
        Self {
            template: template.into(),
        }
    }

    /// Replace variables in the template
    ///
    /// # Arguments
    ///
    /// * `task_description` - Task description
    /// * `task_id` - Task ID
    /// * `agent_type` - Agent type
    pub fn render(
        &self,
        task_description: &str,
        task_id: &str,
        agent_type: &str,
    ) -> String {
        self.template
            .replace("{{TASK_DESCRIPTION}}", task_description)
            .replace("{{TASK_ID}}", task_id)
            .replace("{{AGENT_TYPE}}", agent_type)
    }

    /// Render with custom variables
    pub fn render_with_vars(
        &self,
        vars: &std::collections::HashMap<String, String>,
    ) -> String {
        let mut result = self.template.clone();
        for (key, value) in vars {
            result = result.replace(&format!("{{{{{}}}}}", key), value);
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prompt_template() {
        let template = PromptTemplate::new(
            "Agent: {{AGENT_TYPE}}\nTask ID: {{TASK_ID}}\nTask: {{TASK_DESCRIPTION}}",
        );

        let rendered = template.render("Generate code", "task-123", "CodeGenAgent");

        assert!(rendered.contains("Agent: CodeGenAgent"));
        assert!(rendered.contains("Task ID: task-123"));
        assert!(rendered.contains("Task: Generate code"));
    }

    #[test]
    fn test_prompt_template_with_vars() {
        let template = PromptTemplate::new("{{VAR1}} and {{VAR2}}");

        let mut vars = std::collections::HashMap::new();
        vars.insert("VAR1".to_string(), "Value1".to_string());
        vars.insert("VAR2".to_string(), "Value2".to_string());

        let rendered = template.render_with_vars(&vars);

        assert_eq!(rendered, "Value1 and Value2");
    }

    #[test]
    fn test_enhancement_config_default() {
        let config = PromptEnhancementConfig::default();

        assert!(config.enabled);
        assert_eq!(config.max_context_pieces, DEFAULT_MAX_CONTEXT_PIECES);
        assert_eq!(config.relevance_threshold, DEFAULT_RELEVANCE_THRESHOLD);
        assert_eq!(config.strategy, AugmentationStrategy::Prepend);
        assert_eq!(config.filter_by_outcome, Some("success".to_string()));
    }

    #[test]
    fn test_enhancement_config_disabled() {
        let config = PromptEnhancementConfig::disabled();

        assert!(!config.enabled);
    }

    #[test]
    fn test_enhancement_config_builder() {
        let config = PromptEnhancementConfig::new(3, 0.8)
            .with_strategy(AugmentationStrategy::Append)
            .with_agent_filter("CodeGenAgent".to_string())
            .with_outcome_filter("success".to_string());

        assert_eq!(config.max_context_pieces, 3);
        assert_eq!(config.relevance_threshold, 0.8);
        assert_eq!(config.strategy, AugmentationStrategy::Append);
        assert_eq!(config.filter_by_agent, Some("CodeGenAgent".to_string()));
        assert_eq!(config.filter_by_outcome, Some("success".to_string()));
    }
}
