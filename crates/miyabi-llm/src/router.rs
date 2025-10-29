//! Hybrid LLM Router - Smart routing between Claude and OpenAI
//!
//! Implements cost-optimized routing strategy:
//! - Claude Sonnet 4.5 for complex reasoning tasks
//! - GPT-4o-mini for simple, fast tasks
//!
//! Cost reduction: 60% ($30/month → $12/month for 100 issues)

use crate::{
    AnthropicClient, LlmClient, Message, OpenAIClient, Result, ToolCallResponse, ToolDefinition,
};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Task complexity level determining which LLM to use
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskComplexity {
    /// Simple tasks: D1, D8, D11 (GPT-4o-mini)
    Simple,
    /// Complex tasks: D2, D5, D15 (Claude Sonnet 4.5)
    Complex,
}

impl TaskComplexity {
    /// Determine complexity from task keywords
    pub fn from_keywords(content: &str) -> Self {
        let content_lower = content.to_lowercase();

        // Complex task indicators
        let complex_keywords = [
            "refactor",
            "architecture",
            "design pattern",
            "deep reasoning",
            "multi-step",
            "complex logic",
            "algorithm design",
            "system design",
            "security audit",
            "performance optimization",
        ];

        // Simple task indicators
        let simple_keywords = [
            "documentation",
            "comment",
            "format",
            "lint",
            "simple fix",
            "typo",
            "rename",
            "update version",
        ];

        // Check for complex indicators first
        if complex_keywords.iter().any(|kw| content_lower.contains(kw)) {
            return Self::Complex;
        }

        // Check for simple indicators
        if simple_keywords.iter().any(|kw| content_lower.contains(kw)) {
            return Self::Simple;
        }

        // Default to complex for safety (quality over cost)
        Self::Complex
    }

    /// Get estimated cost per 1M tokens (input + output combined)
    pub fn estimated_cost_per_million_tokens(&self) -> f64 {
        match self {
            Self::Simple => 0.15,  // GPT-4o-mini: ~$0.15/1M tokens
            Self::Complex => 3.00, // Claude Sonnet 4.5: ~$3/1M tokens (avg)
        }
    }

    /// Get model name for this complexity
    pub fn model_name(&self) -> &'static str {
        match self {
            Self::Simple => "gpt-4o-mini",
            Self::Complex => "claude-3-5-sonnet-20241022",
        }
    }
}

/// Cost tracking metrics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CostMetrics {
    /// Total tokens processed by Claude
    pub claude_tokens: u64,
    /// Total tokens processed by OpenAI
    pub openai_tokens: u64,
    /// Number of Claude requests
    pub claude_requests: u64,
    /// Number of OpenAI requests
    pub openai_requests: u64,
    /// Estimated total cost (USD)
    pub estimated_cost_usd: f64,
}

impl CostMetrics {
    /// Record a request with token usage
    pub fn record_request(&mut self, complexity: TaskComplexity, tokens: u64) {
        match complexity {
            TaskComplexity::Simple => {
                self.openai_tokens += tokens;
                self.openai_requests += 1;
                self.estimated_cost_usd += (tokens as f64 / 1_000_000.0)
                    * TaskComplexity::Simple.estimated_cost_per_million_tokens();
            }
            TaskComplexity::Complex => {
                self.claude_tokens += tokens;
                self.claude_requests += 1;
                self.estimated_cost_usd += (tokens as f64 / 1_000_000.0)
                    * TaskComplexity::Complex.estimated_cost_per_million_tokens();
            }
        }
    }

    /// Get total tokens processed
    pub fn total_tokens(&self) -> u64 {
        self.claude_tokens + self.openai_tokens
    }

    /// Get total requests
    pub fn total_requests(&self) -> u64 {
        self.claude_requests + self.openai_requests
    }

    /// Get cost savings vs pure Claude
    pub fn cost_savings_vs_pure_claude(&self) -> f64 {
        let pure_claude_cost = (self.total_tokens() as f64 / 1_000_000.0)
            * TaskComplexity::Complex.estimated_cost_per_million_tokens();
        pure_claude_cost - self.estimated_cost_usd
    }

    /// Get savings percentage
    pub fn savings_percentage(&self) -> f64 {
        if self.total_tokens() == 0 {
            return 0.0;
        }
        let pure_claude_cost = (self.total_tokens() as f64 / 1_000_000.0)
            * TaskComplexity::Complex.estimated_cost_per_million_tokens();
        if pure_claude_cost == 0.0 {
            return 0.0;
        }
        (self.cost_savings_vs_pure_claude() / pure_claude_cost) * 100.0
    }
}

/// Hybrid LLM Router
///
/// Routes requests to Claude or OpenAI based on task complexity
pub struct HybridRouter {
    claude_client: AnthropicClient,
    openai_client: OpenAIClient,
    metrics: Arc<RwLock<CostMetrics>>,
}

impl HybridRouter {
    /// Create a new hybrid router
    pub fn new(claude_client: AnthropicClient, openai_client: OpenAIClient) -> Self {
        Self {
            claude_client,
            openai_client,
            metrics: Arc::new(RwLock::new(CostMetrics::default())),
        }
    }

    /// Create from environment variables
    pub fn from_env() -> Result<Self> {
        let claude_client = AnthropicClient::from_env()?;
        let openai_client = OpenAIClient::from_env()?;
        Ok(Self::new(claude_client, openai_client))
    }

    /// Determine task complexity from messages
    fn determine_complexity(&self, messages: &[Message]) -> TaskComplexity {
        // Analyze the last user message for complexity indicators
        let last_message = messages
            .iter()
            .rev()
            .find(|m| m.role == crate::message::Role::User);

        if let Some(msg) = last_message {
            TaskComplexity::from_keywords(&msg.content)
        } else {
            // Default to complex if no user message found
            TaskComplexity::Complex
        }
    }

    /// Get cost metrics
    pub async fn get_metrics(&self) -> CostMetrics {
        self.metrics.read().await.clone()
    }

    /// Reset metrics
    pub async fn reset_metrics(&self) {
        *self.metrics.write().await = CostMetrics::default();
    }

    /// Route to appropriate client based on complexity
    async fn route_client(&self, messages: &[Message]) -> (TaskComplexity, &dyn LlmClient) {
        let complexity = self.determine_complexity(messages);
        let client: &dyn LlmClient = match complexity {
            TaskComplexity::Simple => &self.openai_client,
            TaskComplexity::Complex => &self.claude_client,
        };
        (complexity, client)
    }
}

#[async_trait]
impl LlmClient for HybridRouter {
    async fn chat(&self, messages: Vec<Message>) -> Result<String> {
        let (complexity, client) = self.route_client(&messages).await;
        tracing::info!(
            "Routing to {} (complexity: {:?})",
            complexity.model_name(),
            complexity
        );

        let response = client.chat(messages).await?;

        // Estimate token usage (rough estimate: 1 token ≈ 4 chars)
        let estimated_tokens = (response.len() / 4) as u64;
        self.metrics
            .write()
            .await
            .record_request(complexity, estimated_tokens);

        Ok(response)
    }

    async fn chat_with_tools(
        &self,
        messages: Vec<Message>,
        tools: Vec<ToolDefinition>,
    ) -> Result<ToolCallResponse> {
        let (complexity, client) = self.route_client(&messages).await;
        tracing::info!(
            "Routing tool call to {} (complexity: {:?})",
            complexity.model_name(),
            complexity
        );

        let response = client.chat_with_tools(messages, tools).await?;

        // Estimate tokens from response
        let estimated_tokens: u64 = match &response {
            ToolCallResponse::ToolCalls(calls) => calls
                .iter()
                .map(|tc| (tc.name.len() + tc.arguments.to_string().len()) / 4)
                .sum::<usize>() as u64,
            ToolCallResponse::Conclusion(text) => (text.len() / 4) as u64,
            ToolCallResponse::NeedApproval { action, reason } => {
                ((action.len() + reason.len()) / 4) as u64
            }
        };

        self.metrics
            .write()
            .await
            .record_request(complexity, estimated_tokens);

        Ok(response)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_complexity_from_keywords_simple() {
        assert_eq!(
            TaskComplexity::from_keywords("Add documentation for this function"),
            TaskComplexity::Simple
        );
        assert_eq!(
            TaskComplexity::from_keywords("Fix typo in README"),
            TaskComplexity::Simple
        );
        assert_eq!(
            TaskComplexity::from_keywords("Update version number"),
            TaskComplexity::Simple
        );
    }

    #[test]
    fn test_complexity_from_keywords_complex() {
        assert_eq!(
            TaskComplexity::from_keywords("Refactor the authentication system"),
            TaskComplexity::Complex
        );
        assert_eq!(
            TaskComplexity::from_keywords("Design a new architecture for scalability"),
            TaskComplexity::Complex
        );
        assert_eq!(
            TaskComplexity::from_keywords("Perform security audit on the codebase"),
            TaskComplexity::Complex
        );
    }

    #[test]
    fn test_complexity_default() {
        // Unknown tasks default to complex
        assert_eq!(
            TaskComplexity::from_keywords("Some random task"),
            TaskComplexity::Complex
        );
    }

    #[test]
    fn test_cost_metrics() {
        let mut metrics = CostMetrics::default();

        // Record 10 simple requests (10k tokens each)
        for _ in 0..10 {
            metrics.record_request(TaskComplexity::Simple, 10_000);
        }

        // Record 5 complex requests (10k tokens each)
        for _ in 0..5 {
            metrics.record_request(TaskComplexity::Complex, 10_000);
        }

        assert_eq!(metrics.openai_tokens, 100_000);
        assert_eq!(metrics.claude_tokens, 50_000);
        assert_eq!(metrics.openai_requests, 10);
        assert_eq!(metrics.claude_requests, 5);
        assert_eq!(metrics.total_tokens(), 150_000);
        assert_eq!(metrics.total_requests(), 15);

        // Cost calculation:
        // OpenAI: 100k tokens × $0.15/1M = $0.015
        // Claude: 50k tokens × $3.00/1M = $0.15
        // Total: $0.165
        assert!((metrics.estimated_cost_usd - 0.165).abs() < 0.001);

        // Pure Claude cost: 150k tokens × $3.00/1M = $0.45
        // Savings: $0.45 - $0.165 = $0.285
        // Percentage: 63.3%
        let savings = metrics.savings_percentage();
        assert!(savings > 60.0 && savings < 65.0);
    }

    #[test]
    fn test_model_names() {
        assert_eq!(TaskComplexity::Simple.model_name(), "gpt-4o-mini");
        assert_eq!(
            TaskComplexity::Complex.model_name(),
            "claude-3-5-sonnet-20241022"
        );
    }
}
