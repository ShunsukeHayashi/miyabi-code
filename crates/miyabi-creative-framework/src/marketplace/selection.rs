//! Model selection and optimization

use crate::error::{MarketplaceError, Result};
use crate::marketplace::{
    AIModelListing, ModelCapability, ModelCategory, ModelProvider, ModelStatus,
};
use serde::{Deserialize, Serialize};

/// Requirements for model selection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRequirements {
    /// Required capabilities
    pub capabilities: Vec<ModelCapability>,
    /// Preferred category
    pub category: Option<ModelCategory>,
    /// Preferred providers (in order of preference)
    pub preferred_providers: Vec<ModelProvider>,
    /// Maximum price per 1M tokens (USD)
    pub max_price_per_million: Option<f64>,
    /// Minimum quality score
    pub min_quality_score: Option<f32>,
    /// Maximum latency in milliseconds
    pub max_latency_ms: Option<u32>,
    /// Minimum context window size
    pub min_context_window: Option<u32>,
    /// Optimization priority
    pub priority: SelectionPriority,
}

impl Default for ModelRequirements {
    fn default() -> Self {
        Self {
            capabilities: vec![],
            category: None,
            preferred_providers: vec![],
            max_price_per_million: None,
            min_quality_score: None,
            max_latency_ms: None,
            min_context_window: None,
            priority: SelectionPriority::Balanced,
        }
    }
}

impl ModelRequirements {
    /// Create requirements for cost-optimized selection
    pub fn cost_optimized() -> Self {
        Self {
            priority: SelectionPriority::Cost,
            ..Default::default()
        }
    }

    /// Create requirements for quality-optimized selection
    pub fn quality_optimized() -> Self {
        Self {
            priority: SelectionPriority::Quality,
            min_quality_score: Some(8.0),
            ..Default::default()
        }
    }

    /// Create requirements for speed-optimized selection
    pub fn speed_optimized() -> Self {
        Self {
            priority: SelectionPriority::Speed,
            max_latency_ms: Some(500),
            ..Default::default()
        }
    }

    /// Builder pattern: add required capability
    pub fn with_capability(mut self, capability: ModelCapability) -> Self {
        self.capabilities.push(capability);
        self
    }

    /// Builder pattern: set category
    pub fn with_category(mut self, category: ModelCategory) -> Self {
        self.category = Some(category);
        self
    }

    /// Builder pattern: add preferred provider
    pub fn prefer_provider(mut self, provider: ModelProvider) -> Self {
        self.preferred_providers.push(provider);
        self
    }

    /// Builder pattern: set max price
    pub fn with_max_price(mut self, price: f64) -> Self {
        self.max_price_per_million = Some(price);
        self
    }

    /// Builder pattern: set min quality
    pub fn with_min_quality(mut self, quality: f32) -> Self {
        self.min_quality_score = Some(quality);
        self
    }

    /// Builder pattern: set max latency
    pub fn with_max_latency(mut self, latency_ms: u32) -> Self {
        self.max_latency_ms = Some(latency_ms);
        self
    }

    /// Builder pattern: set min context window
    pub fn with_min_context(mut self, context: u32) -> Self {
        self.min_context_window = Some(context);
        self
    }
}

/// Selection priority
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum SelectionPriority {
    /// Optimize for lowest cost
    Cost,
    /// Optimize for highest quality
    Quality,
    /// Optimize for lowest latency
    Speed,
    /// Balance all factors
    #[default]
    Balanced,
}

/// Model selector for intelligent model selection
pub struct ModelSelector {
    /// Weight configuration for scoring
    weights: SelectionWeights,
}

/// Weights for model scoring
#[derive(Debug, Clone)]
pub struct SelectionWeights {
    pub quality: f32,
    pub cost: f32,
    pub speed: f32,
    pub reliability: f32,
}

impl Default for SelectionWeights {
    fn default() -> Self {
        Self {
            quality: 0.35,
            cost: 0.25,
            speed: 0.20,
            reliability: 0.20,
        }
    }
}

impl SelectionWeights {
    pub fn for_priority(priority: SelectionPriority) -> Self {
        match priority {
            SelectionPriority::Cost => Self {
                quality: 0.20,
                cost: 0.50,
                speed: 0.15,
                reliability: 0.15,
            },
            SelectionPriority::Quality => Self {
                quality: 0.55,
                cost: 0.10,
                speed: 0.15,
                reliability: 0.20,
            },
            SelectionPriority::Speed => Self {
                quality: 0.20,
                cost: 0.15,
                speed: 0.50,
                reliability: 0.15,
            },
            SelectionPriority::Balanced => Self::default(),
        }
    }
}

/// Scored model candidate
#[derive(Debug, Clone)]
pub struct ScoredModel {
    pub model: AIModelListing,
    pub score: f32,
    pub breakdown: ScoreBreakdown,
}

/// Score breakdown by factor
#[derive(Debug, Clone)]
pub struct ScoreBreakdown {
    pub quality_score: f32,
    pub cost_score: f32,
    pub speed_score: f32,
    pub reliability_score: f32,
    pub provider_bonus: f32,
}

impl ModelSelector {
    /// Create a new model selector
    pub fn new() -> Self {
        Self {
            weights: SelectionWeights::default(),
        }
    }

    /// Create with custom weights
    pub fn with_weights(weights: SelectionWeights) -> Self {
        Self { weights }
    }

    /// Select the best model from candidates based on requirements
    pub fn select_best(
        &self,
        candidates: Vec<AIModelListing>,
        requirements: &ModelRequirements,
    ) -> Result<AIModelListing> {
        let scored = self.score_candidates(candidates, requirements);

        if scored.is_empty() {
            return Err(MarketplaceError::ModelNotFound(
                "No models match the requirements".to_string(),
            )
            .into());
        }

        // Return the highest scoring model
        Ok(scored.into_iter().next().unwrap().model)
    }

    /// Score and rank all candidate models
    pub fn score_candidates(
        &self,
        candidates: Vec<AIModelListing>,
        requirements: &ModelRequirements,
    ) -> Vec<ScoredModel> {
        let weights = SelectionWeights::for_priority(requirements.priority);

        let mut scored: Vec<ScoredModel> = candidates
            .into_iter()
            .filter(|model| self.meets_requirements(model, requirements))
            .map(|model| self.score_model(&model, requirements, &weights))
            .collect();

        // Sort by score descending
        scored.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

        scored
    }

    /// Check if a model meets the requirements
    fn meets_requirements(
        &self,
        model: &AIModelListing,
        requirements: &ModelRequirements,
    ) -> bool {
        // Must be available
        if model.status != ModelStatus::Available {
            return false;
        }

        // Check required capabilities
        for cap in &requirements.capabilities {
            if !model.capabilities.contains(cap) {
                return false;
            }
        }

        // Check category if specified
        if let Some(ref cat) = requirements.category {
            if &model.category != cat {
                return false;
            }
        }

        // Check price limit
        if let Some(max_price) = requirements.max_price_per_million {
            if model.pricing.base_price > max_price {
                return false;
            }
        }

        // Check quality floor
        if let Some(min_quality) = requirements.min_quality_score {
            if model.performance.quality_score < min_quality {
                return false;
            }
        }

        // Check latency ceiling
        if let Some(max_latency) = requirements.max_latency_ms {
            if model.performance.latency_ms > max_latency {
                return false;
            }
        }

        // Check context window
        if let Some(min_context) = requirements.min_context_window {
            if model.context_window < min_context {
                return false;
            }
        }

        true
    }

    /// Score a single model
    fn score_model(
        &self,
        model: &AIModelListing,
        requirements: &ModelRequirements,
        weights: &SelectionWeights,
    ) -> ScoredModel {
        // Normalize scores to 0-10 range
        let quality_score = model.performance.quality_score;
        let reliability_score = model.performance.reliability_score;

        // Cost score: lower is better, normalize inversely
        let cost_score = (10.0 - (model.pricing.base_price / 2.0).min(10.0)).max(0.0) as f32;

        // Speed score: lower latency is better
        let speed_score = (10.0 - (model.performance.latency_ms as f32 / 200.0).min(10.0)).max(0.0);

        // Provider preference bonus
        let provider_bonus = if requirements.preferred_providers.is_empty() {
            0.0
        } else {
            match requirements
                .preferred_providers
                .iter()
                .position(|p| p == &model.provider)
            {
                Some(0) => 1.0,
                Some(1) => 0.5,
                Some(_) => 0.25,
                None => 0.0,
            }
        };

        let weighted_score = quality_score * weights.quality
            + cost_score * weights.cost
            + speed_score * weights.speed
            + reliability_score * weights.reliability
            + provider_bonus;

        ScoredModel {
            model: model.clone(),
            score: weighted_score,
            breakdown: ScoreBreakdown {
                quality_score,
                cost_score,
                speed_score,
                reliability_score,
                provider_bonus,
            },
        }
    }

    /// Get model recommendations with explanations
    pub fn get_recommendations(
        &self,
        candidates: Vec<AIModelListing>,
        requirements: &ModelRequirements,
        limit: usize,
    ) -> Vec<ModelRecommendation> {
        let scored = self.score_candidates(candidates, requirements);

        scored
            .into_iter()
            .take(limit)
            .map(|sm| ModelRecommendation {
                model: sm.model,
                score: sm.score,
                breakdown: sm.breakdown,
                explanation: self.generate_explanation(&sm.breakdown, requirements),
            })
            .collect()
    }

    fn generate_explanation(
        &self,
        breakdown: &ScoreBreakdown,
        requirements: &ModelRequirements,
    ) -> String {
        let mut reasons = Vec::new();

        match requirements.priority {
            SelectionPriority::Cost if breakdown.cost_score > 7.0 => {
                reasons.push("Excellent cost efficiency");
            }
            SelectionPriority::Quality if breakdown.quality_score > 8.0 => {
                reasons.push("Outstanding quality performance");
            }
            SelectionPriority::Speed if breakdown.speed_score > 7.0 => {
                reasons.push("Fast response times");
            }
            SelectionPriority::Balanced => {
                if breakdown.quality_score > 7.0 {
                    reasons.push("Good quality");
                }
                if breakdown.cost_score > 7.0 {
                    reasons.push("Reasonable cost");
                }
            }
            _ => {}
        }

        if breakdown.reliability_score > 8.0 {
            reasons.push("High reliability");
        }

        if breakdown.provider_bonus > 0.0 {
            reasons.push("Preferred provider");
        }

        if reasons.is_empty() {
            "Meets requirements".to_string()
        } else {
            reasons.join(", ")
        }
    }
}

impl Default for ModelSelector {
    fn default() -> Self {
        Self::new()
    }
}

/// Model recommendation with explanation
#[derive(Debug, Clone)]
pub struct ModelRecommendation {
    pub model: AIModelListing,
    pub score: f32,
    pub breakdown: ScoreBreakdown,
    pub explanation: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::marketplace::{
        ModelPerformance, ModelPricing, PricingType, PricingUnit,
    };

    fn create_test_model(id: &str, quality: f32, price: f64, latency: u32) -> AIModelListing {
        AIModelListing {
            id: id.to_string(),
            name: id.to_string(),
            provider: ModelProvider::OpenAI,
            category: ModelCategory::Text,
            pricing: ModelPricing {
                pricing_type: PricingType::PayPerUse,
                base_price: price,
                currency: "USD".to_string(),
                unit: PricingUnit::Token,
                tiers: vec![],
            },
            performance: ModelPerformance {
                latency_ms: latency,
                throughput: 100.0,
                quality_score: quality,
                reliability_score: 9.0,
                cost_efficiency: 8.0,
            },
            capabilities: vec![ModelCapability::TextGeneration, ModelCapability::Chat],
            compatibility: vec![],
            documentation: String::new(),
            samples: vec![],
            status: ModelStatus::Available,
            context_window: 128000,
            last_updated: chrono::Utc::now(),
        }
    }

    #[test]
    fn test_model_selection() {
        let selector = ModelSelector::new();

        let candidates = vec![
            create_test_model("cheap", 6.0, 0.15, 300),
            create_test_model("quality", 9.5, 3.0, 800),
            create_test_model("balanced", 8.0, 1.0, 500),
        ];

        // Cost priority should select cheap model
        let requirements = ModelRequirements::cost_optimized();
        let best = selector.select_best(candidates.clone(), &requirements).unwrap();
        assert_eq!(best.id, "cheap");

        // Quality priority should select quality model
        let requirements = ModelRequirements::quality_optimized();
        let best = selector.select_best(candidates.clone(), &requirements).unwrap();
        assert_eq!(best.id, "quality");
    }

    #[test]
    fn test_requirements_filtering() {
        let selector = ModelSelector::new();

        let candidates = vec![
            create_test_model("model1", 7.0, 1.0, 500),
            create_test_model("model2", 9.0, 5.0, 800),
        ];

        // Filter by max price
        let requirements = ModelRequirements::default().with_max_price(2.0);
        let scored = selector.score_candidates(candidates.clone(), &requirements);
        assert_eq!(scored.len(), 1);
        assert_eq!(scored[0].model.id, "model1");

        // Filter by min quality
        let requirements = ModelRequirements::default().with_min_quality(8.0);
        let scored = selector.score_candidates(candidates, &requirements);
        assert_eq!(scored.len(), 1);
        assert_eq!(scored[0].model.id, "model2");
    }
}
