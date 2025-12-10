//! Creative Optimization Framework
//!
//! A/B testing, multivariate testing, and continuous optimization for creative outputs.
//!
//! # Features
//!
//! - A/B testing with statistical significance
//! - Multivariate testing
//! - Automatic variant optimization
//! - AI-powered variant generation
//! - Real-time metrics collection
//! - Collaborative experiment design

use crate::error::{OptimizationError, Result};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Optimization experiment definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationExperiment {
    pub id: String,
    pub name: String,
    pub description: String,
    pub experiment_type: ExperimentType,
    pub variants: Vec<ExperimentVariant>,
    pub metrics: Vec<OptimizationMetric>,
    pub target_audience: AudienceDefinition,
    pub duration: ExperimentDuration,
    pub status: ExperimentStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub ended_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Types of experiments
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ExperimentType {
    /// Simple A/B test
    AbTest,
    /// Multiple variants
    Multivariate,
    /// Automatic optimization
    AutoOptimize,
}

/// Experiment variant
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentVariant {
    pub id: String,
    pub name: String,
    pub description: String,
    pub configuration: VariantConfiguration,
    pub allocation: f64,
    pub results: VariantResults,
}

/// Variant configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariantConfiguration {
    pub ai_model: Option<String>,
    pub prompt_template: Option<String>,
    pub parameters: HashMap<String, serde_json::Value>,
}

impl Default for VariantConfiguration {
    fn default() -> Self {
        Self {
            ai_model: None,
            prompt_template: None,
            parameters: HashMap::new(),
        }
    }
}

/// Variant results
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct VariantResults {
    pub impressions: u64,
    pub conversions: u64,
    pub total_value: f64,
    pub metrics: HashMap<String, MetricValue>,
}

/// Metric value with statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricValue {
    pub count: u64,
    pub sum: f64,
    pub mean: f64,
    pub variance: f64,
    pub min: f64,
    pub max: f64,
}

impl Default for MetricValue {
    fn default() -> Self {
        Self {
            count: 0,
            sum: 0.0,
            mean: 0.0,
            variance: 0.0,
            min: f64::MAX,
            max: f64::MIN,
        }
    }
}

impl MetricValue {
    /// Update metric with new value using Welford's online algorithm
    pub fn update(&mut self, value: f64) {
        self.count += 1;
        self.sum += value;

        let delta = value - self.mean;
        self.mean += delta / self.count as f64;
        let delta2 = value - self.mean;
        self.variance += delta * delta2;

        self.min = self.min.min(value);
        self.max = self.max.max(value);
    }

    /// Get standard deviation
    pub fn std_dev(&self) -> f64 {
        if self.count < 2 {
            return 0.0;
        }
        (self.variance / (self.count - 1) as f64).sqrt()
    }
}

/// Optimization metric definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationMetric {
    pub id: String,
    pub name: String,
    pub metric_type: MetricType,
    pub goal: MetricGoal,
    pub weight: f64,
}

/// Metric types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MetricType {
    Conversion,
    Engagement,
    Quality,
    Revenue,
    Custom,
}

/// Metric goal direction
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MetricGoal {
    Maximize,
    Minimize,
    Target(OrderedFloat),
}

/// Wrapper for f64 to implement Eq
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct OrderedFloat(pub f64);

impl PartialEq for OrderedFloat {
    fn eq(&self, other: &Self) -> bool {
        self.0.to_bits() == other.0.to_bits()
    }
}

impl Eq for OrderedFloat {}

/// Target audience definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudienceDefinition {
    pub filters: Vec<AudienceFilter>,
    pub sample_size: Option<u64>,
    pub sample_percentage: Option<f64>,
}

impl Default for AudienceDefinition {
    fn default() -> Self {
        Self {
            filters: vec![],
            sample_size: None,
            sample_percentage: Some(100.0),
        }
    }
}

/// Audience filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudienceFilter {
    pub field: String,
    pub operator: FilterOperator,
    pub value: serde_json::Value,
}

/// Filter operators
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FilterOperator {
    Equals,
    NotEquals,
    Contains,
    GreaterThan,
    LessThan,
    In,
    NotIn,
}

/// Experiment duration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentDuration {
    pub duration_type: DurationType,
    pub value: Option<u64>,
    pub end_condition: Option<EndCondition>,
}

impl Default for ExperimentDuration {
    fn default() -> Self {
        Self {
            duration_type: DurationType::OpenEnded,
            value: None,
            end_condition: None,
        }
    }
}

/// Duration types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DurationType {
    Days,
    Impressions,
    Conversions,
    OpenEnded,
}

/// End condition for experiments
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndCondition {
    pub condition_type: EndConditionType,
    pub threshold: f64,
}

/// End condition types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum EndConditionType {
    StatisticalSignificance,
    MinimumSampleSize,
    MaxDuration,
}

/// Experiment status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ExperimentStatus {
    Draft,
    Running,
    Paused,
    Completed,
    Archived,
}

/// Experiment analysis results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentAnalysis {
    pub experiment_id: String,
    pub winning_variant: Option<String>,
    pub confidence_level: f64,
    pub variant_analyses: Vec<VariantAnalysis>,
    pub recommendation: String,
    pub analyzed_at: chrono::DateTime<chrono::Utc>,
}

/// Per-variant analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariantAnalysis {
    pub variant_id: String,
    pub conversion_rate: f64,
    pub lift_vs_control: f64,
    pub confidence: f64,
    pub p_value: f64,
    pub is_significant: bool,
}

/// Creative Optimization Framework
pub struct CreativeOptimizationFramework {
    experiments: DashMap<String, OptimizationExperiment>,
    assignments: DashMap<String, String>,
    metrics_buffer: Arc<RwLock<Vec<MetricEvent>>>,
}

/// Metric event for buffered processing
#[derive(Debug, Clone)]
struct MetricEvent {
    experiment_id: String,
    variant_id: String,
    metric_id: String,
    value: f64,
    timestamp: chrono::DateTime<chrono::Utc>,
}

impl CreativeOptimizationFramework {
    /// Create a new optimization framework
    pub async fn new() -> Result<Self> {
        Ok(Self {
            experiments: DashMap::new(),
            assignments: DashMap::new(),
            metrics_buffer: Arc::new(RwLock::new(Vec::new())),
        })
    }

    /// Create a new experiment
    pub fn create_experiment(&self, experiment: OptimizationExperiment) -> Result<String> {
        self.validate_experiment(&experiment)?;

        let experiment_id = experiment.id.clone();
        self.experiments.insert(experiment_id.clone(), experiment);

        tracing::info!(experiment_id = %experiment_id, "Experiment created");

        Ok(experiment_id)
    }

    /// Start an experiment
    pub fn start_experiment(&self, experiment_id: &str) -> Result<()> {
        let mut experiment = self
            .experiments
            .get_mut(experiment_id)
            .ok_or_else(|| OptimizationError::ExperimentNotFound(experiment_id.to_string()))?;

        if experiment.status == ExperimentStatus::Running {
            return Err(OptimizationError::AlreadyRunning(experiment_id.to_string()).into());
        }

        experiment.status = ExperimentStatus::Running;
        experiment.started_at = Some(chrono::Utc::now());

        tracing::info!(experiment_id = %experiment_id, "Experiment started");

        Ok(())
    }

    /// Stop an experiment
    pub fn stop_experiment(&self, experiment_id: &str) -> Result<()> {
        let mut experiment = self
            .experiments
            .get_mut(experiment_id)
            .ok_or_else(|| OptimizationError::ExperimentNotFound(experiment_id.to_string()))?;

        experiment.status = ExperimentStatus::Completed;
        experiment.ended_at = Some(chrono::Utc::now());

        tracing::info!(experiment_id = %experiment_id, "Experiment stopped");

        Ok(())
    }

    /// Get variant assignment for a user
    pub fn get_variant(&self, experiment_id: &str, user_id: &str) -> Result<ExperimentVariant> {
        let experiment = self
            .experiments
            .get(experiment_id)
            .ok_or_else(|| OptimizationError::ExperimentNotFound(experiment_id.to_string()))?;

        if experiment.status != ExperimentStatus::Running {
            return Err(OptimizationError::ExperimentNotFound(format!(
                "Experiment {} is not running",
                experiment_id
            ))
            .into());
        }

        let assignment_key = format!("{}:{}", experiment_id, user_id);

        // Check existing assignment
        if let Some(variant_id) = self.assignments.get(&assignment_key) {
            if let Some(variant) = experiment.variants.iter().find(|v| v.id == *variant_id) {
                return Ok(variant.clone());
            }
        }

        // Assign new variant based on allocation
        let variant = self.assign_variant(&experiment, user_id);
        self.assignments
            .insert(assignment_key, variant.id.clone());

        Ok(variant)
    }

    /// Record a metric value
    pub async fn record_metric(
        &self,
        experiment_id: &str,
        variant_id: &str,
        metric_id: &str,
        value: f64,
    ) -> Result<()> {
        let event = MetricEvent {
            experiment_id: experiment_id.to_string(),
            variant_id: variant_id.to_string(),
            metric_id: metric_id.to_string(),
            value,
            timestamp: chrono::Utc::now(),
        };

        let mut buffer = self.metrics_buffer.write().await;
        buffer.push(event);

        // Flush if buffer is large
        if buffer.len() >= 100 {
            self.flush_metrics_buffer(&mut buffer)?;
        }

        Ok(())
    }

    /// Record a conversion
    pub fn record_conversion(&self, experiment_id: &str, variant_id: &str, value: f64) {
        if let Some(mut experiment) = self.experiments.get_mut(experiment_id) {
            if let Some(variant) = experiment.variants.iter_mut().find(|v| v.id == variant_id) {
                variant.results.conversions += 1;
                variant.results.total_value += value;
            }
        }
    }

    /// Record an impression
    pub fn record_impression(&self, experiment_id: &str, variant_id: &str) {
        if let Some(mut experiment) = self.experiments.get_mut(experiment_id) {
            if let Some(variant) = experiment.variants.iter_mut().find(|v| v.id == variant_id) {
                variant.results.impressions += 1;
            }
        }
    }

    /// Analyze experiment results
    pub fn analyze_experiment(&self, experiment_id: &str) -> Result<ExperimentAnalysis> {
        let experiment = self
            .experiments
            .get(experiment_id)
            .ok_or_else(|| OptimizationError::ExperimentNotFound(experiment_id.to_string()))?;

        if experiment.variants.iter().all(|v| v.results.impressions < 100) {
            return Err(OptimizationError::InsufficientData.into());
        }

        let variant_analyses: Vec<VariantAnalysis> = experiment
            .variants
            .iter()
            .map(|v| self.analyze_variant(v, &experiment.variants[0]))
            .collect();

        let winning_variant = self.determine_winner(&variant_analyses);
        let confidence_level = variant_analyses
            .iter()
            .map(|a| a.confidence)
            .fold(0.0_f64, |a, b| a.max(b));

        let recommendation = self.generate_recommendation(&variant_analyses, &winning_variant);

        Ok(ExperimentAnalysis {
            experiment_id: experiment_id.to_string(),
            winning_variant,
            confidence_level,
            variant_analyses,
            recommendation,
            analyzed_at: chrono::Utc::now(),
        })
    }

    /// List all experiments
    pub fn list_experiments(&self) -> Vec<OptimizationExperiment> {
        self.experiments.iter().map(|e| e.value().clone()).collect()
    }

    /// Get experiment by ID
    pub fn get_experiment(&self, experiment_id: &str) -> Option<OptimizationExperiment> {
        self.experiments.get(experiment_id).map(|e| e.value().clone())
    }

    // Private helpers

    fn validate_experiment(&self, experiment: &OptimizationExperiment) -> Result<()> {
        if experiment.variants.is_empty() {
            return Err(OptimizationError::InvalidVariant("No variants defined".to_string()).into());
        }

        let total_allocation: f64 = experiment.variants.iter().map(|v| v.allocation).sum();
        if (total_allocation - 100.0).abs() > 0.01 {
            return Err(OptimizationError::InvalidVariant(format!(
                "Variant allocations must sum to 100%, got {}%",
                total_allocation
            ))
            .into());
        }

        Ok(())
    }

    fn assign_variant(
        &self,
        experiment: &OptimizationExperiment,
        user_id: &str,
    ) -> ExperimentVariant {
        // Simple hash-based assignment
        let hash = self.hash_user_id(user_id);
        let bucket = (hash % 10000) as f64 / 100.0;

        let mut cumulative = 0.0;
        for variant in &experiment.variants {
            cumulative += variant.allocation;
            if bucket < cumulative {
                return variant.clone();
            }
        }

        // Fallback to first variant
        experiment.variants[0].clone()
    }

    fn hash_user_id(&self, user_id: &str) -> u64 {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        user_id.hash(&mut hasher);
        hasher.finish()
    }

    fn flush_metrics_buffer(&self, buffer: &mut Vec<MetricEvent>) -> Result<()> {
        for event in buffer.drain(..) {
            if let Some(mut experiment) = self.experiments.get_mut(&event.experiment_id) {
                if let Some(variant) = experiment
                    .variants
                    .iter_mut()
                    .find(|v| v.id == event.variant_id)
                {
                    variant
                        .results
                        .metrics
                        .entry(event.metric_id)
                        .or_insert_with(MetricValue::default)
                        .update(event.value);
                }
            }
        }
        Ok(())
    }

    fn analyze_variant(
        &self,
        variant: &ExperimentVariant,
        control: &ExperimentVariant,
    ) -> VariantAnalysis {
        let conversion_rate = if variant.results.impressions > 0 {
            variant.results.conversions as f64 / variant.results.impressions as f64
        } else {
            0.0
        };

        let control_rate = if control.results.impressions > 0 {
            control.results.conversions as f64 / control.results.impressions as f64
        } else {
            0.0
        };

        let lift = if control_rate > 0.0 {
            (conversion_rate - control_rate) / control_rate * 100.0
        } else {
            0.0
        };

        // Simplified statistical significance calculation
        let (confidence, p_value) = self.calculate_significance(
            variant.results.conversions,
            variant.results.impressions,
            control.results.conversions,
            control.results.impressions,
        );

        VariantAnalysis {
            variant_id: variant.id.clone(),
            conversion_rate,
            lift_vs_control: lift,
            confidence,
            p_value,
            is_significant: p_value < 0.05,
        }
    }

    fn calculate_significance(
        &self,
        conversions_a: u64,
        impressions_a: u64,
        conversions_b: u64,
        impressions_b: u64,
    ) -> (f64, f64) {
        if impressions_a == 0 || impressions_b == 0 {
            return (0.0, 1.0);
        }

        let p1 = conversions_a as f64 / impressions_a as f64;
        let p2 = conversions_b as f64 / impressions_b as f64;

        let pooled = (conversions_a + conversions_b) as f64 / (impressions_a + impressions_b) as f64;

        let se = (pooled * (1.0 - pooled) * (1.0 / impressions_a as f64 + 1.0 / impressions_b as f64))
            .sqrt();

        if se == 0.0 {
            return (0.0, 1.0);
        }

        let z = (p1 - p2).abs() / se;

        // Approximate p-value from z-score
        let p_value = 2.0 * (1.0 - self.normal_cdf(z.abs()));
        let confidence = 1.0 - p_value;

        (confidence * 100.0, p_value)
    }

    fn normal_cdf(&self, x: f64) -> f64 {
        // Approximation of standard normal CDF
        let a1 = 0.254829592;
        let a2 = -0.284496736;
        let a3 = 1.421413741;
        let a4 = -1.453152027;
        let a5 = 1.061405429;
        let p = 0.3275911;

        let sign = if x < 0.0 { -1.0 } else { 1.0 };
        let x = x.abs() / 2.0_f64.sqrt();

        let t = 1.0 / (1.0 + p * x);
        let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * (-x * x).exp();

        0.5 * (1.0 + sign * y)
    }

    fn determine_winner(&self, analyses: &[VariantAnalysis]) -> Option<String> {
        analyses
            .iter()
            .filter(|a| a.is_significant && a.lift_vs_control > 0.0)
            .max_by(|a, b| {
                a.lift_vs_control
                    .partial_cmp(&b.lift_vs_control)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .map(|a| a.variant_id.clone())
    }

    fn generate_recommendation(
        &self,
        analyses: &[VariantAnalysis],
        winner: &Option<String>,
    ) -> String {
        match winner {
            Some(variant_id) => {
                if let Some(analysis) = analyses.iter().find(|a| a.variant_id == *variant_id) {
                    format!(
                        "Variant '{}' shows a {:.1}% lift with {:.1}% confidence. \
                         Recommend deploying this variant.",
                        variant_id, analysis.lift_vs_control, analysis.confidence
                    )
                } else {
                    "Unable to determine winner.".to_string()
                }
            }
            None => {
                let has_data = analyses.iter().any(|a| a.confidence > 0.0);
                if has_data {
                    "No statistically significant winner yet. Continue running the experiment.".to_string()
                } else {
                    "Insufficient data to make a recommendation. Need more traffic.".to_string()
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_experiment() -> OptimizationExperiment {
        OptimizationExperiment {
            id: "exp-1".to_string(),
            name: "Test Experiment".to_string(),
            description: "A test experiment".to_string(),
            experiment_type: ExperimentType::AbTest,
            variants: vec![
                ExperimentVariant {
                    id: "control".to_string(),
                    name: "Control".to_string(),
                    description: "Control variant".to_string(),
                    configuration: VariantConfiguration::default(),
                    allocation: 50.0,
                    results: VariantResults::default(),
                },
                ExperimentVariant {
                    id: "treatment".to_string(),
                    name: "Treatment".to_string(),
                    description: "Treatment variant".to_string(),
                    configuration: VariantConfiguration::default(),
                    allocation: 50.0,
                    results: VariantResults::default(),
                },
            ],
            metrics: vec![],
            target_audience: AudienceDefinition::default(),
            duration: ExperimentDuration::default(),
            status: ExperimentStatus::Draft,
            created_at: chrono::Utc::now(),
            started_at: None,
            ended_at: None,
        }
    }

    #[tokio::test]
    async fn test_framework_creation() {
        let framework = CreativeOptimizationFramework::new().await;
        assert!(framework.is_ok());
    }

    #[tokio::test]
    async fn test_experiment_creation() {
        let framework = CreativeOptimizationFramework::new().await.unwrap();

        let experiment = create_test_experiment();
        let result = framework.create_experiment(experiment);

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "exp-1");
    }

    #[tokio::test]
    async fn test_variant_assignment() {
        let framework = CreativeOptimizationFramework::new().await.unwrap();

        let mut experiment = create_test_experiment();
        experiment.status = ExperimentStatus::Running;
        framework.create_experiment(experiment).unwrap();

        // Same user should get same variant
        let variant1 = framework.get_variant("exp-1", "user-123").unwrap();
        let variant2 = framework.get_variant("exp-1", "user-123").unwrap();

        assert_eq!(variant1.id, variant2.id);
    }

    #[test]
    fn test_metric_value_update() {
        let mut metric = MetricValue::default();

        metric.update(10.0);
        metric.update(20.0);
        metric.update(30.0);

        assert_eq!(metric.count, 3);
        assert_eq!(metric.sum, 60.0);
        assert_eq!(metric.mean, 20.0);
        assert_eq!(metric.min, 10.0);
        assert_eq!(metric.max, 30.0);
    }
}
