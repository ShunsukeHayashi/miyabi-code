//! AI Model Marketplace
//!
//! Dynamic discovery, selection, and orchestration of AI models.
//!
//! # Features
//!
//! - Auto-discovery of available AI models from multiple providers
//! - Intelligent model selection based on requirements
//! - Cost optimization and performance tracking
//! - Provider abstraction for unified API access
//!
//! # Supported Providers
//!
//! - OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
//! - Anthropic (Claude 3.5 Sonnet, Claude Opus 4.5)
//! - Google (Gemini 1.5 Pro, Gemini 1.5 Flash)
//! - Meta (Llama 3.1)
//! - Stability AI (SDXL, SD3)
//! - Community models (via Ollama, HuggingFace)

mod connector;
mod discovery;
mod selection;

pub use connector::{ProviderConnector, ProviderConfig};
pub use discovery::ModelDiscovery;
pub use selection::{ModelRequirements, ModelSelector};

use crate::error::{MarketplaceError, Result};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// AI model listing in the marketplace
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIModelListing {
    /// Unique model identifier
    pub id: String,
    /// Human-readable model name
    pub name: String,
    /// Provider name
    pub provider: ModelProvider,
    /// Model category
    pub category: ModelCategory,
    /// Pricing information
    pub pricing: ModelPricing,
    /// Performance metrics
    pub performance: ModelPerformance,
    /// Model capabilities
    pub capabilities: Vec<ModelCapability>,
    /// Compatible frameworks/APIs
    pub compatibility: Vec<String>,
    /// Documentation URL
    pub documentation: String,
    /// Sample outputs
    pub samples: Vec<ModelSample>,
    /// Model status
    pub status: ModelStatus,
    /// Context window size (tokens)
    pub context_window: u32,
    /// Last updated timestamp
    pub last_updated: chrono::DateTime<chrono::Utc>,
}

/// AI model providers
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum ModelProvider {
    OpenAI,
    Anthropic,
    Google,
    Meta,
    Stability,
    Community,
    Custom(String),
}

impl std::fmt::Display for ModelProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::OpenAI => write!(f, "openai"),
            Self::Anthropic => write!(f, "anthropic"),
            Self::Google => write!(f, "google"),
            Self::Meta => write!(f, "meta"),
            Self::Stability => write!(f, "stability"),
            Self::Community => write!(f, "community"),
            Self::Custom(name) => write!(f, "{}", name),
        }
    }
}

/// Model categories
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ModelCategory {
    /// Text generation and chat
    Text,
    /// Image generation
    Image,
    /// Audio generation/transcription
    Audio,
    /// Video generation
    Video,
    /// Multimodal (text + image + audio)
    Multimodal,
    /// Specialized domain models
    Specialized,
    /// Code generation
    Code,
    /// Embedding models
    Embedding,
}

/// Model pricing structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelPricing {
    /// Pricing type
    pub pricing_type: PricingType,
    /// Base price (per unit)
    pub base_price: f64,
    /// Currency (e.g., "USD")
    pub currency: String,
    /// Pricing unit
    pub unit: PricingUnit,
    /// Volume discount tiers
    pub tiers: Vec<PricingTier>,
}

/// Pricing types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum PricingType {
    Free,
    PayPerUse,
    Subscription,
    Enterprise,
}

/// Pricing units
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PricingUnit {
    Token,
    Request,
    Minute,
    Month,
    Image,
}

/// Volume discount tier
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricingTier {
    pub min_units: u64,
    pub price_per_unit: f64,
    pub description: String,
}

/// Model performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelPerformance {
    /// Average latency in milliseconds
    pub latency_ms: u32,
    /// Throughput (requests per second)
    pub throughput: f32,
    /// Quality score (1-10)
    pub quality_score: f32,
    /// Reliability score (1-10)
    pub reliability_score: f32,
    /// Cost efficiency score (1-10)
    pub cost_efficiency: f32,
}

impl ModelPerformance {
    /// Calculate overall score (weighted average)
    pub fn overall_score(&self) -> f32 {
        // Weights: quality 40%, reliability 30%, cost 20%, speed 10%
        self.quality_score * 0.4
            + self.reliability_score * 0.3
            + self.cost_efficiency * 0.2
            + (10.0 - (self.latency_ms as f32 / 100.0).min(10.0)) * 0.1
    }
}

/// Model capabilities
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "kebab-case")]
pub enum ModelCapability {
    TextGeneration,
    Chat,
    Completion,
    ImageGeneration,
    ImageEditing,
    AudioTranscription,
    AudioGeneration,
    VideoGeneration,
    CodeGeneration,
    CodeCompletion,
    Reasoning,
    FunctionCalling,
    Streaming,
    Embeddings,
    Vision,
    MultiTurn,
}

/// Sample model output
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSample {
    pub input: String,
    pub output: String,
    pub tokens_used: u32,
    pub latency_ms: u32,
}

/// Model availability status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ModelStatus {
    Available,
    Limited,
    Deprecated,
    Maintenance,
    Unavailable,
}

/// Usage statistics for a model
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModelUsageStats {
    pub total_requests: u64,
    pub total_tokens: u64,
    pub total_cost_usd: f64,
    pub average_latency_ms: f64,
    pub error_rate: f64,
    pub last_used: Option<chrono::DateTime<chrono::Utc>>,
}

/// AI Model Marketplace
pub struct AIModelMarketplace {
    models: DashMap<String, AIModelListing>,
    connectors: DashMap<ModelProvider, Arc<dyn ProviderConnector>>,
    usage_stats: DashMap<String, ModelUsageStats>,
    discovery: Arc<ModelDiscovery>,
    selector: Arc<ModelSelector>,
    last_discovery: Arc<RwLock<Option<chrono::DateTime<chrono::Utc>>>>,
}

impl AIModelMarketplace {
    /// Create a new marketplace
    pub async fn new() -> Result<Self> {
        let marketplace = Self {
            models: DashMap::new(),
            connectors: DashMap::new(),
            usage_stats: DashMap::new(),
            discovery: Arc::new(ModelDiscovery::new()),
            selector: Arc::new(ModelSelector::new()),
            last_discovery: Arc::new(RwLock::new(None)),
        };

        // Initialize with known models
        marketplace.initialize_known_models().await;

        Ok(marketplace)
    }

    /// Initialize marketplace with well-known models
    async fn initialize_known_models(&self) {
        // Claude models
        self.register_model(AIModelListing {
            id: "claude-3-5-sonnet-20241022".to_string(),
            name: "Claude 3.5 Sonnet".to_string(),
            provider: ModelProvider::Anthropic,
            category: ModelCategory::Text,
            pricing: ModelPricing {
                pricing_type: PricingType::PayPerUse,
                base_price: 3.0,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: 800,
                throughput: 50.0,
                quality_score: 9.5,
                reliability_score: 9.0,
                cost_efficiency: 7.0,
            },
            capabilities: vec![
                ModelCapability::TextGeneration,
                ModelCapability::Chat,
                ModelCapability::CodeGeneration,
                ModelCapability::Reasoning,
                ModelCapability::FunctionCalling,
                ModelCapability::Vision,
            ],
            compatibility: vec!["openai-api".to_string(), "anthropic-api".to_string()],
            documentation: "https://docs.anthropic.com/claude/".to_string(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 200000,
            last_updated: chrono::Utc::now(),
        });

        self.register_model(AIModelListing {
            id: "claude-opus-4-5-20251101".to_string(),
            name: "Claude Opus 4.5".to_string(),
            provider: ModelProvider::Anthropic,
            category: ModelCategory::Text,
            pricing: ModelPricing {
                pricing_type: PricingType::PayPerUse,
                base_price: 15.0,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: 1500,
                throughput: 30.0,
                quality_score: 10.0,
                reliability_score: 9.5,
                cost_efficiency: 5.0,
            },
            capabilities: vec![
                ModelCapability::TextGeneration,
                ModelCapability::Chat,
                ModelCapability::CodeGeneration,
                ModelCapability::Reasoning,
                ModelCapability::FunctionCalling,
                ModelCapability::Vision,
            ],
            compatibility: vec!["openai-api".to_string(), "anthropic-api".to_string()],
            documentation: "https://docs.anthropic.com/claude/".to_string(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 200000,
            last_updated: chrono::Utc::now(),
        });

        // OpenAI models
        self.register_model(AIModelListing {
            id: "gpt-4o".to_string(),
            name: "GPT-4o".to_string(),
            provider: ModelProvider::OpenAI,
            category: ModelCategory::Multimodal,
            pricing: ModelPricing {
                pricing_type: PricingType::PayPerUse,
                base_price: 5.0,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: 600,
                throughput: 80.0,
                quality_score: 9.0,
                reliability_score: 9.5,
                cost_efficiency: 7.5,
            },
            capabilities: vec![
                ModelCapability::TextGeneration,
                ModelCapability::Chat,
                ModelCapability::CodeGeneration,
                ModelCapability::Vision,
                ModelCapability::FunctionCalling,
            ],
            compatibility: vec!["openai-api".to_string()],
            documentation: "https://platform.openai.com/docs/".to_string(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 128000,
            last_updated: chrono::Utc::now(),
        });

        self.register_model(AIModelListing {
            id: "gpt-4o-mini".to_string(),
            name: "GPT-4o Mini".to_string(),
            provider: ModelProvider::OpenAI,
            category: ModelCategory::Text,
            pricing: ModelPricing {
                pricing_type: PricingType::PayPerUse,
                base_price: 0.15,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: 300,
                throughput: 150.0,
                quality_score: 7.5,
                reliability_score: 9.5,
                cost_efficiency: 9.5,
            },
            capabilities: vec![
                ModelCapability::TextGeneration,
                ModelCapability::Chat,
                ModelCapability::FunctionCalling,
            ],
            compatibility: vec!["openai-api".to_string()],
            documentation: "https://platform.openai.com/docs/".to_string(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 128000,
            last_updated: chrono::Utc::now(),
        });

        // Google Gemini models
        self.register_model(AIModelListing {
            id: "gemini-1.5-pro".to_string(),
            name: "Gemini 1.5 Pro".to_string(),
            provider: ModelProvider::Google,
            category: ModelCategory::Multimodal,
            pricing: ModelPricing {
                pricing_type: PricingType::PayPerUse,
                base_price: 1.25,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: 700,
                throughput: 60.0,
                quality_score: 8.5,
                reliability_score: 9.0,
                cost_efficiency: 8.5,
            },
            capabilities: vec![
                ModelCapability::TextGeneration,
                ModelCapability::Chat,
                ModelCapability::CodeGeneration,
                ModelCapability::Vision,
                ModelCapability::AudioTranscription,
            ],
            compatibility: vec!["google-api".to_string(), "openai-api".to_string()],
            documentation: "https://ai.google.dev/docs".to_string(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 2000000,
            last_updated: chrono::Utc::now(),
        });

        self.register_model(AIModelListing {
            id: "gemini-1.5-flash".to_string(),
            name: "Gemini 1.5 Flash".to_string(),
            provider: ModelProvider::Google,
            category: ModelCategory::Text,
            pricing: ModelPricing {
                pricing_type: PricingType::PayPerUse,
                base_price: 0.075,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: 200,
                throughput: 200.0,
                quality_score: 7.0,
                reliability_score: 9.0,
                cost_efficiency: 9.8,
            },
            capabilities: vec![
                ModelCapability::TextGeneration,
                ModelCapability::Chat,
                ModelCapability::CodeGeneration,
            ],
            compatibility: vec!["google-api".to_string()],
            documentation: "https://ai.google.dev/docs".to_string(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 1000000,
            last_updated: chrono::Utc::now(),
        });

        tracing::info!("Initialized {} known models", self.models.len());
    }

    /// Register a model in the marketplace
    pub fn register_model(&self, model: AIModelListing) {
        self.models.insert(model.id.clone(), model);
    }

    /// Discover available models from all providers
    pub async fn discover_models(&self) -> Result<Vec<AIModelListing>> {
        let discovered = self.discovery.discover_all(&self.connectors).await?;

        for model in &discovered {
            self.models.insert(model.id.clone(), model.clone());
        }

        *self.last_discovery.write().await = Some(chrono::Utc::now());

        Ok(self.list_models())
    }

    /// List all available models
    pub fn list_models(&self) -> Vec<AIModelListing> {
        self.models.iter().map(|r| r.value().clone()).collect()
    }

    /// Get a specific model by ID
    pub fn get_model(&self, model_id: &str) -> Option<AIModelListing> {
        self.models.get(model_id).map(|r| r.value().clone())
    }

    /// Find models by provider
    pub fn find_by_provider(&self, provider: &ModelProvider) -> Vec<AIModelListing> {
        self.models
            .iter()
            .filter(|r| &r.value().provider == provider)
            .map(|r| r.value().clone())
            .collect()
    }

    /// Find models by category
    pub fn find_by_category(&self, category: &ModelCategory) -> Vec<AIModelListing> {
        self.models
            .iter()
            .filter(|r| &r.value().category == category)
            .map(|r| r.value().clone())
            .collect()
    }

    /// Find models by capability
    pub fn find_by_capability(&self, capability: &ModelCapability) -> Vec<AIModelListing> {
        self.models
            .iter()
            .filter(|r| r.value().capabilities.contains(capability))
            .map(|r| r.value().clone())
            .collect()
    }

    /// Select optimal model based on requirements
    pub async fn select_optimal_model(
        &self,
        requirements: &ModelRequirements,
    ) -> Result<AIModelListing> {
        let candidates: Vec<AIModelListing> = self.list_models();
        self.selector.select_best(candidates, requirements)
    }

    /// Record model usage
    pub fn record_usage(
        &self,
        model_id: &str,
        tokens: u64,
        latency_ms: u64,
        cost_usd: f64,
        error: bool,
    ) {
        self.usage_stats
            .entry(model_id.to_string())
            .and_modify(|stats| {
                let total_requests = stats.total_requests + 1;
                stats.average_latency_ms = (stats.average_latency_ms
                    * stats.total_requests as f64
                    + latency_ms as f64)
                    / total_requests as f64;

                stats.total_requests = total_requests;
                stats.total_tokens += tokens;
                stats.total_cost_usd += cost_usd;
                stats.last_used = Some(chrono::Utc::now());

                if error {
                    stats.error_rate = (stats.error_rate * (total_requests - 1) as f64 + 1.0)
                        / total_requests as f64;
                } else {
                    stats.error_rate =
                        stats.error_rate * (total_requests - 1) as f64 / total_requests as f64;
                }
            })
            .or_insert_with(|| ModelUsageStats {
                total_requests: 1,
                total_tokens: tokens,
                total_cost_usd: cost_usd,
                average_latency_ms: latency_ms as f64,
                error_rate: if error { 1.0 } else { 0.0 },
                last_used: Some(chrono::Utc::now()),
            });
    }

    /// Get usage statistics for a model
    pub fn get_usage_stats(&self, model_id: &str) -> Option<ModelUsageStats> {
        self.usage_stats.get(model_id).map(|r| r.value().clone())
    }

    /// Get aggregated usage statistics
    pub fn get_total_usage(&self) -> ModelUsageStats {
        let mut total = ModelUsageStats::default();

        for entry in self.usage_stats.iter() {
            let stats = entry.value();
            total.total_requests += stats.total_requests;
            total.total_tokens += stats.total_tokens;
            total.total_cost_usd += stats.total_cost_usd;
        }

        if total.total_requests > 0 {
            let mut weighted_latency = 0.0;
            let mut weighted_error = 0.0;

            for entry in self.usage_stats.iter() {
                let stats = entry.value();
                let weight = stats.total_requests as f64 / total.total_requests as f64;
                weighted_latency += stats.average_latency_ms * weight;
                weighted_error += stats.error_rate * weight;
            }

            total.average_latency_ms = weighted_latency;
            total.error_rate = weighted_error;
        }

        total
    }

    /// Register a provider connector
    pub fn register_connector(
        &self,
        provider: ModelProvider,
        connector: Arc<dyn ProviderConnector>,
    ) {
        self.connectors.insert(provider, connector);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_marketplace_creation() {
        let marketplace = AIModelMarketplace::new().await;
        assert!(marketplace.is_ok());

        let marketplace = marketplace.unwrap();
        assert!(!marketplace.list_models().is_empty());
    }

    #[tokio::test]
    async fn test_model_lookup() {
        let marketplace = AIModelMarketplace::new().await.unwrap();

        let model = marketplace.get_model("gpt-4o-mini");
        assert!(model.is_some());
        assert_eq!(model.unwrap().provider, ModelProvider::OpenAI);
    }

    #[tokio::test]
    async fn test_find_by_capability() {
        let marketplace = AIModelMarketplace::new().await.unwrap();

        let vision_models = marketplace.find_by_capability(&ModelCapability::Vision);
        assert!(!vision_models.is_empty());
    }

    #[tokio::test]
    async fn test_usage_tracking() {
        let marketplace = AIModelMarketplace::new().await.unwrap();

        marketplace.record_usage("gpt-4o-mini", 1000, 300, 0.015, false);
        marketplace.record_usage("gpt-4o-mini", 2000, 350, 0.030, false);

        let stats = marketplace.get_usage_stats("gpt-4o-mini");
        assert!(stats.is_some());

        let stats = stats.unwrap();
        assert_eq!(stats.total_requests, 2);
        assert_eq!(stats.total_tokens, 3000);
    }
}
