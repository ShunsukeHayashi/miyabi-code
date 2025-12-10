//! Provider connectors for AI model integration

use crate::error::Result;
use crate::marketplace::AIModelListing;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

/// Provider configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderConfig {
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub timeout_ms: u64,
    pub max_retries: u32,
    pub rate_limit_rpm: Option<u32>,
}

impl Default for ProviderConfig {
    fn default() -> Self {
        Self {
            api_key: None,
            base_url: None,
            timeout_ms: 30000,
            max_retries: 3,
            rate_limit_rpm: None,
        }
    }
}

/// Creative task for model execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreativeTask {
    pub id: String,
    pub task_type: TaskType,
    pub input: serde_json::Value,
    pub parameters: TaskParameters,
}

/// Types of creative tasks
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
    TextGeneration,
    Chat,
    ImageGeneration,
    CodeGeneration,
    Embedding,
    AudioTranscription,
}

/// Task execution parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskParameters {
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub stop_sequences: Vec<String>,
    pub system_prompt: Option<String>,
}

impl Default for TaskParameters {
    fn default() -> Self {
        Self {
            max_tokens: Some(4096),
            temperature: Some(0.7),
            top_p: Some(0.9),
            stop_sequences: vec![],
            system_prompt: None,
        }
    }
}

/// Result from creative task execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreativeResult {
    pub task_id: String,
    pub output: serde_json::Value,
    pub usage: UsageInfo,
    pub latency_ms: u64,
    pub model_id: String,
}

/// Usage information from model execution
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UsageInfo {
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub total_tokens: u32,
    pub estimated_cost_usd: f64,
}

/// Provider connector trait
#[async_trait]
pub trait ProviderConnector: Send + Sync {
    /// Get provider name
    fn name(&self) -> &str;

    /// List available models from this provider
    async fn list_available_models(&self) -> Result<Vec<AIModelListing>>;

    /// Check if the provider is configured and available
    async fn check_availability(&self) -> Result<bool>;

    /// Execute a creative task on a specific model
    async fn execute(&self, model_id: &str, task: CreativeTask) -> Result<CreativeResult>;

    /// Get provider configuration
    fn config(&self) -> &ProviderConfig;
}

/// Mock provider for testing
pub struct MockProvider {
    config: ProviderConfig,
    models: Vec<AIModelListing>,
}

impl MockProvider {
    pub fn new(models: Vec<AIModelListing>) -> Self {
        Self {
            config: ProviderConfig::default(),
            models,
        }
    }
}

#[async_trait]
impl ProviderConnector for MockProvider {
    fn name(&self) -> &str {
        "mock"
    }

    async fn list_available_models(&self) -> Result<Vec<AIModelListing>> {
        Ok(self.models.clone())
    }

    async fn check_availability(&self) -> Result<bool> {
        Ok(true)
    }

    async fn execute(&self, model_id: &str, task: CreativeTask) -> Result<CreativeResult> {
        Ok(CreativeResult {
            task_id: task.id,
            output: serde_json::json!({
                "text": "Mock response",
                "model": model_id,
            }),
            usage: UsageInfo {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
                estimated_cost_usd: 0.001,
            },
            latency_ms: 100,
            model_id: model_id.to_string(),
        })
    }

    fn config(&self) -> &ProviderConfig {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::marketplace::{
        ModelCategory, ModelPerformance, ModelPricing, ModelProvider, ModelStatus,
        PricingType, PricingUnit,
    };

    #[tokio::test]
    async fn test_mock_provider() {
        let models = vec![AIModelListing {
            id: "test-model".to_string(),
            name: "Test Model".to_string(),
            provider: ModelProvider::Custom("mock".to_string()),
            category: ModelCategory::Text,
            pricing: ModelPricing {
                pricing_type: PricingType::Free,
                base_price: 0.0,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: 100,
                throughput: 100.0,
                quality_score: 8.0,
                reliability_score: 9.0,
                cost_efficiency: 10.0,
            },
            capabilities: vec![],
            compatibility: vec![],
            documentation: String::new(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 4096,
            last_updated: chrono::Utc::now(),
        }];

        let provider = MockProvider::new(models);

        assert!(provider.check_availability().await.unwrap());
        assert_eq!(provider.list_available_models().await.unwrap().len(), 1);
    }
}
