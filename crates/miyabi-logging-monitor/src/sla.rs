//! SLA (Service Level Agreement) monitoring

use crate::{LogMonitorError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};
use uuid::Uuid;

/// SLA threshold configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlaThreshold {
    /// Metric name
    pub metric_name: String,
    /// Maximum allowed value
    pub max_value: f64,
    /// Minimum allowed value
    pub min_value: f64,
    /// Whether this threshold is enabled
    pub enabled: bool,
}

impl SlaThreshold {
    /// Create a new SLA threshold
    pub fn new(metric_name: String, min_value: f64, max_value: f64) -> Self {
        Self { metric_name, max_value, min_value, enabled: true }
    }

    /// Create a max-only threshold
    pub fn max_only(metric_name: String, max_value: f64) -> Self {
        Self { metric_name, max_value, min_value: f64::MIN, enabled: true }
    }

    /// Create a min-only threshold
    pub fn min_only(metric_name: String, min_value: f64) -> Self {
        Self { metric_name, max_value: f64::MAX, min_value, enabled: true }
    }

    /// Check if a value violates this threshold
    pub fn is_violated(&self, value: f64) -> bool {
        if !self.enabled {
            return false;
        }
        value < self.min_value || value > self.max_value
    }
}

/// SLA violation record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlaViolation {
    pub id: Uuid,
    pub metric_name: String,
    pub actual_value: f64,
    pub threshold: SlaThreshold,
    pub timestamp: DateTime<Utc>,
    pub context: HashMap<String, String>,
}

impl SlaViolation {
    /// Create a new SLA violation record
    pub fn new(metric_name: String, actual_value: f64, threshold: SlaThreshold) -> Self {
        Self {
            id: Uuid::new_v4(),
            metric_name,
            actual_value,
            threshold,
            timestamp: Utc::now(),
            context: HashMap::new(),
        }
    }

    /// Add context to this violation
    pub fn with_context(mut self, key: String, value: String) -> Self {
        self.context.insert(key, value);
        self
    }
}

/// SLA monitor
#[derive(Debug, Clone)]
pub struct SlaMonitor {
    thresholds: Arc<RwLock<HashMap<String, SlaThreshold>>>,
    violations: Arc<RwLock<Vec<SlaViolation>>>,
}

impl Default for SlaMonitor {
    fn default() -> Self {
        Self::new()
    }
}

impl SlaMonitor {
    /// Create a new SLA monitor
    pub fn new() -> Self {
        Self { thresholds: Arc::new(RwLock::new(HashMap::new())), violations: Arc::new(RwLock::new(Vec::new())) }
    }

    /// Register an SLA threshold
    pub async fn register_threshold(&self, threshold: SlaThreshold) {
        info!(
            "Registering SLA threshold: {} (min: {}, max: {})",
            threshold.metric_name, threshold.min_value, threshold.max_value
        );

        let mut thresholds = self.thresholds.write().await;
        thresholds.insert(threshold.metric_name.clone(), threshold);
    }

    /// Check a metric value against SLA thresholds
    pub async fn check_metric(&self, metric_name: &str, value: f64) -> Result<()> {
        let thresholds = self.thresholds.read().await;

        if let Some(threshold) = thresholds.get(metric_name) {
            if threshold.is_violated(value) {
                warn!(
                    "SLA violation detected: {} = {} (min: {}, max: {})",
                    metric_name, value, threshold.min_value, threshold.max_value
                );

                let violation = SlaViolation::new(metric_name.to_string(), value, threshold.clone());

                let mut violations = self.violations.write().await;
                violations.push(violation);

                return Err(LogMonitorError::SlaViolation(format!(
                    "{} = {} violates threshold (min: {}, max: {})",
                    metric_name, value, threshold.min_value, threshold.max_value
                )));
            }
        }

        Ok(())
    }

    /// Get all violations
    pub async fn get_violations(&self) -> Vec<SlaViolation> {
        self.violations.read().await.clone()
    }

    /// Get violations for a specific metric
    pub async fn get_violations_for_metric(&self, metric_name: &str) -> Vec<SlaViolation> {
        self.violations
            .read()
            .await
            .iter()
            .filter(|v| v.metric_name == metric_name)
            .cloned()
            .collect()
    }

    /// Clear all violations
    pub async fn clear_violations(&self) {
        info!("Clearing all SLA violations");
        self.violations.write().await.clear();
    }

    /// Get violation count
    pub async fn violation_count(&self) -> usize {
        self.violations.read().await.len()
    }

    /// Export violations to JSON
    pub async fn export_violations_json(&self) -> Result<String> {
        let violations = self.violations.read().await;
        serde_json::to_string_pretty(&*violations).map_err(|e| LogMonitorError::ExportFailed(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sla_threshold_new() {
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);
        assert_eq!(threshold.metric_name, "latency");
        assert!((threshold.min_value - 0.0).abs() < f64::EPSILON);
        assert!((threshold.max_value - 5000.0).abs() < f64::EPSILON);
        assert!(threshold.enabled);
    }

    #[test]
    fn test_sla_threshold_max_only() {
        let threshold = SlaThreshold::max_only("error_rate".to_string(), 0.01);
        assert_eq!(threshold.metric_name, "error_rate");
        assert_eq!(threshold.min_value, f64::MIN);
        assert!((threshold.max_value - 0.01).abs() < f64::EPSILON);
    }

    #[test]
    fn test_sla_threshold_min_only() {
        let threshold = SlaThreshold::min_only("success_rate".to_string(), 0.99);
        assert_eq!(threshold.metric_name, "success_rate");
        assert!((threshold.min_value - 0.99).abs() < f64::EPSILON);
        assert_eq!(threshold.max_value, f64::MAX);
    }

    #[test]
    fn test_sla_threshold_is_violated() {
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);

        assert!(!threshold.is_violated(2500.0));
        assert!(threshold.is_violated(-1.0));
        assert!(threshold.is_violated(6000.0));
    }

    #[test]
    fn test_sla_threshold_disabled() {
        let mut threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);
        threshold.enabled = false;

        assert!(!threshold.is_violated(6000.0));
    }

    #[test]
    fn test_sla_violation_new() {
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);
        let violation = SlaViolation::new("latency".to_string(), 6000.0, threshold);

        assert_eq!(violation.metric_name, "latency");
        assert!((violation.actual_value - 6000.0).abs() < f64::EPSILON);
    }

    #[test]
    fn test_sla_violation_with_context() {
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);
        let violation = SlaViolation::new("latency".to_string(), 6000.0, threshold)
            .with_context("segment_id".to_string(), "42".to_string());

        assert_eq!(violation.context.len(), 1);
        assert_eq!(violation.context.get("segment_id"), Some(&"42".to_string()));
    }

    #[tokio::test]
    async fn test_sla_monitor_new() {
        let monitor = SlaMonitor::new();
        assert_eq!(monitor.violation_count().await, 0);
    }

    #[tokio::test]
    async fn test_sla_monitor_register_threshold() {
        let monitor = SlaMonitor::new();
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);

        monitor.register_threshold(threshold).await;

        // No direct way to check threshold count, but we can test check_metric
        assert!(monitor.check_metric("latency", 2500.0).await.is_ok());
    }

    #[tokio::test]
    async fn test_sla_monitor_check_metric_pass() {
        let monitor = SlaMonitor::new();
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);

        monitor.register_threshold(threshold).await;

        let result = monitor.check_metric("latency", 2500.0).await;
        assert!(result.is_ok());
        assert_eq!(monitor.violation_count().await, 0);
    }

    #[tokio::test]
    async fn test_sla_monitor_check_metric_violation() {
        let monitor = SlaMonitor::new();
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);

        monitor.register_threshold(threshold).await;

        let result = monitor.check_metric("latency", 6000.0).await;
        assert!(result.is_err());
        assert_eq!(monitor.violation_count().await, 1);
    }

    #[tokio::test]
    async fn test_sla_monitor_get_violations() {
        let monitor = SlaMonitor::new();
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);

        monitor.register_threshold(threshold).await;
        let _ = monitor.check_metric("latency", 6000.0).await;

        let violations = monitor.get_violations().await;
        assert_eq!(violations.len(), 1);
        assert_eq!(violations[0].metric_name, "latency");
    }

    #[tokio::test]
    async fn test_sla_monitor_get_violations_for_metric() {
        let monitor = SlaMonitor::new();

        let threshold1 = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);
        let threshold2 = SlaThreshold::new("error_rate".to_string(), 0.0, 0.01);

        monitor.register_threshold(threshold1).await;
        monitor.register_threshold(threshold2).await;

        let _ = monitor.check_metric("latency", 6000.0).await;
        let _ = monitor.check_metric("error_rate", 0.02).await;
        let _ = monitor.check_metric("latency", 7000.0).await;

        let latency_violations = monitor.get_violations_for_metric("latency").await;
        assert_eq!(latency_violations.len(), 2);
    }

    #[tokio::test]
    async fn test_sla_monitor_clear_violations() {
        let monitor = SlaMonitor::new();
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);

        monitor.register_threshold(threshold).await;
        let _ = monitor.check_metric("latency", 6000.0).await;

        assert_eq!(monitor.violation_count().await, 1);

        monitor.clear_violations().await;
        assert_eq!(monitor.violation_count().await, 0);
    }

    #[tokio::test]
    async fn test_sla_monitor_export_violations_json() {
        let monitor = SlaMonitor::new();
        let threshold = SlaThreshold::new("latency".to_string(), 0.0, 5000.0);

        monitor.register_threshold(threshold).await;
        let _ = monitor.check_metric("latency", 6000.0).await;

        let json = monitor.export_violations_json().await.unwrap();
        println!("JSON output: {}", json);
        assert!(json.contains("latency"));
        assert!(json.contains("6000"));
    }
}
