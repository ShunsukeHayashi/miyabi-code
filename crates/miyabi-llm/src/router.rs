//! Hybrid LLM Router - Smart routing between Claude, OpenAI, and Google
//!
//! Implements 3-tier cost-optimized routing strategy:
//! - GPT-4o-mini for simple, fast tasks ($0.15/1M tokens)
//! - Gemini Flash for medium complexity tasks ($0.2/1M tokens)
//! - Claude Sonnet 4.5 for complex reasoning tasks ($3.0/1M tokens)
//!
//! Cost reduction: 60-70% vs pure Claude approach

use crate::{
    AnthropicClient, GoogleClient, LlmClient, Message, OpenAIClient, Result, ToolCallResponse,
    ToolDefinition,
};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Task complexity level determining which LLM to use
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskComplexity {
    /// Simple tasks: Documentation, formatting, typos (GPT-4o-mini)
    Simple,
    /// Medium tasks: Standard coding, testing, reviews (Gemini Flash)
    Medium,
    /// Complex tasks: Architecture, refactoring, security (Claude Sonnet 4.5)
    Complex,
}

impl TaskComplexity {
    /// Determine complexity from task keywords
    pub fn from_keywords(content: &str) -> Self {
        let content_lower = content.to_lowercase();

        // Complex task indicators (highest priority)
        let complex_keywords = [
            "refactor",
            "architecture",
            "design pattern",
            "deep reasoning",
            "system design",
            "security audit",
            "performance optimization",
            "distributed system",
            "concurrency",
            "memory safety",
        ];

        // Simple task indicators (lowest priority)
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

        // Medium task indicators (standard development)
        let medium_keywords = [
            "implement",
            "add feature",
            "bug fix",
            "test",
            "review",
            "integration",
            "api",
            "endpoint",
            "function",
            "method",
            "class",
            "struct",
        ];

        // Check for complex indicators first (most expensive, best quality)
        if complex_keywords.iter().any(|kw| content_lower.contains(kw)) {
            return Self::Complex;
        }

        // Check for simple indicators (cheapest, fastest)
        if simple_keywords.iter().any(|kw| content_lower.contains(kw)) {
            return Self::Simple;
        }

        // Check for medium indicators
        if medium_keywords.iter().any(|kw| content_lower.contains(kw)) {
            return Self::Medium;
        }

        // Default to medium for unknown tasks (balanced approach)
        Self::Medium
    }

    /// Get estimated cost per 1M tokens (input + output combined)
    pub fn estimated_cost_per_million_tokens(&self) -> f64 {
        match self {
            Self::Simple => 0.15,  // GPT-4o-mini: ~$0.15/1M tokens
            Self::Medium => 0.20,  // Gemini Flash: ~$0.20/1M tokens
            Self::Complex => 3.00, // Claude Sonnet 4.5: ~$3/1M tokens (avg)
        }
    }

    /// Get model name for this complexity
    pub fn model_name(&self) -> &'static str {
        match self {
            Self::Simple => "gpt-4o-mini",
            Self::Medium => "gemini-1.5-flash",
            Self::Complex => "claude-3-5-sonnet-20241022",
        }
    }

    /// Get provider name for this complexity
    pub fn provider_name(&self) -> &'static str {
        match self {
            Self::Simple => "openai",
            Self::Medium => "google",
            Self::Complex => "anthropic",
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
    /// Total tokens processed by Google
    pub google_tokens: u64,
    /// Number of Claude requests
    pub claude_requests: u64,
    /// Number of OpenAI requests
    pub openai_requests: u64,
    /// Number of Google requests
    pub google_requests: u64,
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
            },
            TaskComplexity::Medium => {
                self.google_tokens += tokens;
                self.google_requests += 1;
                self.estimated_cost_usd += (tokens as f64 / 1_000_000.0)
                    * TaskComplexity::Medium.estimated_cost_per_million_tokens();
            },
            TaskComplexity::Complex => {
                self.claude_tokens += tokens;
                self.claude_requests += 1;
                self.estimated_cost_usd += (tokens as f64 / 1_000_000.0)
                    * TaskComplexity::Complex.estimated_cost_per_million_tokens();
            },
        }
    }

    /// Get total tokens processed
    pub fn total_tokens(&self) -> u64 {
        self.claude_tokens + self.openai_tokens + self.google_tokens
    }

    /// Get total requests
    pub fn total_requests(&self) -> u64 {
        self.claude_requests + self.openai_requests + self.google_requests
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
/// Routes requests to Claude, OpenAI, or Google based on task complexity
pub struct HybridRouter {
    claude_client: AnthropicClient,
    openai_client: OpenAIClient,
    google_client: GoogleClient,
    metrics: Arc<RwLock<CostMetrics>>,
}

impl HybridRouter {
    /// Create a new hybrid router
    pub fn new(
        claude_client: AnthropicClient,
        openai_client: OpenAIClient,
        google_client: GoogleClient,
    ) -> Self {
        Self {
            claude_client,
            openai_client,
            google_client,
            metrics: Arc::new(RwLock::new(CostMetrics::default())),
        }
    }

    /// Create from environment variables
    pub fn from_env() -> Result<Self> {
        let claude_client = AnthropicClient::from_env()?;
        let openai_client = OpenAIClient::from_env()?;
        let google_client = GoogleClient::from_env()?.with_flash(); // Use Flash for cost-effectiveness
        Ok(Self::new(claude_client, openai_client, google_client))
    }

    /// Determine task complexity from messages
    fn determine_complexity(&self, messages: &[Message]) -> TaskComplexity {
        // Analyze the last user message for complexity indicators
        let last_message = messages.iter().rev().find(|m| m.role == crate::Role::User);

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
            TaskComplexity::Medium => &self.google_client,
            TaskComplexity::Complex => &self.claude_client,
        };
        (complexity, client)
    }
}

#[async_trait]
impl LlmClient for HybridRouter {
    async fn chat(&self, messages: Vec<Message>) -> Result<String> {
        let (complexity, client) = self.route_client(&messages).await;
        tracing::info!("Routing to {} (complexity: {:?})", complexity.model_name(), complexity);

        let response = client.chat(messages).await?;

        // Estimate token usage (rough estimate: 1 token ≈ 4 chars)
        let estimated_tokens = (response.len() / 4) as u64;
        self.metrics.write().await.record_request(complexity, estimated_tokens);

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
            ToolCallResponse::Conclusion { text } => (text.len() / 4) as u64,
            ToolCallResponse::NeedApproval { action, reason } => {
                ((action.len() + reason.len()) / 4) as u64
            },
        };

        self.metrics.write().await.record_request(complexity, estimated_tokens);

        Ok(response)
    }

    fn provider_name(&self) -> &str {
        "hybrid-router"
    }

    fn model_name(&self) -> &str {
        "gpt-4o-mini + gemini-1.5-flash + claude-3-5-sonnet"
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
        assert_eq!(TaskComplexity::from_keywords("Fix typo in README"), TaskComplexity::Simple);
        assert_eq!(TaskComplexity::from_keywords("Update version number"), TaskComplexity::Simple);
    }

    #[test]
    fn test_complexity_from_keywords_medium() {
        assert_eq!(
            TaskComplexity::from_keywords("Implement new API endpoint"),
            TaskComplexity::Medium
        );
        assert_eq!(
            TaskComplexity::from_keywords("Add feature for user authentication"),
            TaskComplexity::Medium
        );
        assert_eq!(
            TaskComplexity::from_keywords("Bug fix in the payment integration"),
            TaskComplexity::Medium
        );
        assert_eq!(
            TaskComplexity::from_keywords("Write tests for the struct"),
            TaskComplexity::Medium
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
        assert_eq!(
            TaskComplexity::from_keywords("Implement distributed system consensus"),
            TaskComplexity::Complex
        );
    }

    #[test]
    fn test_complexity_default() {
        // Unknown tasks default to medium
        assert_eq!(TaskComplexity::from_keywords("Some random task"), TaskComplexity::Medium);
    }

    #[test]
    fn test_cost_metrics() {
        let mut metrics = CostMetrics::default();

        // Record 10 simple requests (10k tokens each)
        for _ in 0..10 {
            metrics.record_request(TaskComplexity::Simple, 10_000);
        }

        // Record 10 medium requests (10k tokens each)
        for _ in 0..10 {
            metrics.record_request(TaskComplexity::Medium, 10_000);
        }

        // Record 5 complex requests (10k tokens each)
        for _ in 0..5 {
            metrics.record_request(TaskComplexity::Complex, 10_000);
        }

        assert_eq!(metrics.openai_tokens, 100_000);
        assert_eq!(metrics.google_tokens, 100_000);
        assert_eq!(metrics.claude_tokens, 50_000);
        assert_eq!(metrics.openai_requests, 10);
        assert_eq!(metrics.google_requests, 10);
        assert_eq!(metrics.claude_requests, 5);
        assert_eq!(metrics.total_tokens(), 250_000);
        assert_eq!(metrics.total_requests(), 25);

        // Cost calculation:
        // OpenAI: 100k tokens × $0.15/1M = $0.015
        // Google: 100k tokens × $0.20/1M = $0.020
        // Claude: 50k tokens × $3.00/1M = $0.15
        // Total: $0.185
        assert!((metrics.estimated_cost_usd - 0.185).abs() < 0.001);

        // Pure Claude cost: 250k tokens × $3.00/1M = $0.75
        // Savings: $0.75 - $0.185 = $0.565
        // Percentage: 75.3%
        let savings = metrics.savings_percentage();
        assert!(savings > 73.0 && savings < 78.0);
    }

    #[test]
    fn test_cost_metrics_3tier_breakdown() {
        let mut metrics = CostMetrics::default();

        // Simulate realistic workload distribution:
        // 30% simple, 50% medium, 20% complex
        for _ in 0..30 {
            metrics.record_request(TaskComplexity::Simple, 10_000);
        }
        for _ in 0..50 {
            metrics.record_request(TaskComplexity::Medium, 10_000);
        }
        for _ in 0..20 {
            metrics.record_request(TaskComplexity::Complex, 10_000);
        }

        assert_eq!(metrics.total_requests(), 100);
        assert_eq!(metrics.total_tokens(), 1_000_000);

        // Cost breakdown:
        // OpenAI: 300k × $0.15/1M = $0.045
        // Google: 500k × $0.20/1M = $0.100
        // Claude: 200k × $3.00/1M = $0.600
        // Total: $0.745
        assert!((metrics.estimated_cost_usd - 0.745).abs() < 0.001);

        // Pure Claude: 1M × $3.00/1M = $3.00
        // Savings: $3.00 - $0.745 = $2.255 (75.2%)
        let savings = metrics.savings_percentage();
        assert!(savings > 74.0 && savings < 76.0);
    }

    #[test]
    fn test_model_names() {
        assert_eq!(TaskComplexity::Simple.model_name(), "gpt-4o-mini");
        assert_eq!(TaskComplexity::Medium.model_name(), "gemini-1.5-flash");
        assert_eq!(TaskComplexity::Complex.model_name(), "claude-3-5-sonnet-20241022");
    }

    #[test]
    fn test_provider_names() {
        assert_eq!(TaskComplexity::Simple.provider_name(), "openai");
        assert_eq!(TaskComplexity::Medium.provider_name(), "google");
        assert_eq!(TaskComplexity::Complex.provider_name(), "anthropic");
    }
}
