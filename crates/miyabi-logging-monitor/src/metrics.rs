//! Metrics collection and tracking

use crate::{LogMonitorError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};
use uuid::Uuid;

/// Metric type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MetricType {
    Counter,
    Gauge,
    Histogram,
    Timer,
}

/// Metric value
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum MetricValue {
    Counter(u64),
    Gauge(f64),
    Histogram(Vec<f64>),
    Timer(f64),
}

/// A single metric data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metric {
    pub id: Uuid,
    pub name: String,
    pub metric_type: MetricType,
    pub value: MetricValue,
    pub tags: HashMap<String, String>,
    pub timestamp: DateTime<Utc>,
}

impl Metric {
    /// Create a new counter metric
    pub fn counter(name: String, value: u64) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            metric_type: MetricType::Counter,
            value: MetricValue::Counter(value),
            tags: HashMap::new(),
            timestamp: Utc::now(),
        }
    }

    /// Create a new gauge metric
    pub fn gauge(name: String, value: f64) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            metric_type: MetricType::Gauge,
            value: MetricValue::Gauge(value),
            tags: HashMap::new(),
            timestamp: Utc::now(),
        }
    }

    /// Create a new timer metric
    pub fn timer(name: String, duration_ms: f64) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            metric_type: MetricType::Timer,
            value: MetricValue::Timer(duration_ms),
            tags: HashMap::new(),
            timestamp: Utc::now(),
        }
    }

    /// Add a tag to this metric
    pub fn with_tag(mut self, key: String, value: String) -> Self {
        self.tags.insert(key, value);
        self
    }

    /// Add multiple tags to this metric
    pub fn with_tags(mut self, tags: HashMap<String, String>) -> Self {
        self.tags.extend(tags);
        self
    }
}

/// Metrics collector
#[derive(Debug, Clone)]
pub struct MetricsCollector {
    metrics: Arc<RwLock<Vec<Metric>>>,
}

impl Default for MetricsCollector {
    fn default() -> Self {
        Self::new()
    }
}

impl MetricsCollector {
    /// Create a new metrics collector
    pub fn new() -> Self {
        Self {
            metrics: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Record a metric
    pub async fn record(&self, metric: Metric) -> Result<()> {
        debug!("Recording metric: {} = {:?}", metric.name, metric.value);

        let mut metrics = self.metrics.write().await;
        metrics.push(metric);

        Ok(())
    }

    /// Record a counter increment
    pub async fn increment_counter(&self, name: String, value: u64) -> Result<()> {
        let metric = Metric::counter(name, value);
        self.record(metric).await
    }

    /// Record a gauge value
    pub async fn record_gauge(&self, name: String, value: f64) -> Result<()> {
        let metric = Metric::gauge(name, value);
        self.record(metric).await
    }

    /// Record a timer duration
    pub async fn record_timer(&self, name: String, duration_ms: f64) -> Result<()> {
        let metric = Metric::timer(name, duration_ms);
        self.record(metric).await
    }

    /// Get all metrics
    pub async fn get_all(&self) -> Vec<Metric> {
        self.metrics.read().await.clone()
    }

    /// Get metrics by name
    pub async fn get_by_name(&self, name: &str) -> Vec<Metric> {
        self.metrics
            .read()
            .await
            .iter()
            .filter(|m| m.name == name)
            .cloned()
            .collect()
    }

    /// Clear all metrics
    pub async fn clear(&self) {
        info!("Clearing all metrics");
        self.metrics.write().await.clear();
    }

    /// Get metric count
    pub async fn count(&self) -> usize {
        self.metrics.read().await.len()
    }

    /// Export metrics to JSON
    pub async fn export_json(&self) -> Result<String> {
        let metrics = self.metrics.read().await;
        serde_json::to_string_pretty(&*metrics)
            .map_err(|e| LogMonitorError::ExportFailed(e.to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metric_counter() {
        let metric = Metric::counter("requests".to_string(), 42);
        assert_eq!(metric.name, "requests");
        assert_eq!(metric.metric_type, MetricType::Counter);
        match metric.value {
            MetricValue::Counter(v) => assert_eq!(v, 42),
            _ => panic!("Expected counter value"),
        }
    }

    #[test]
    fn test_metric_gauge() {
        let metric = Metric::gauge("cpu_usage".to_string(), 75.5);
        assert_eq!(metric.name, "cpu_usage");
        assert_eq!(metric.metric_type, MetricType::Gauge);
        match metric.value {
            MetricValue::Gauge(v) => assert!((v - 75.5).abs() < f64::EPSILON),
            _ => panic!("Expected gauge value"),
        }
    }

    #[test]
    fn test_metric_timer() {
        let metric = Metric::timer("request_duration".to_string(), 123.45);
        assert_eq!(metric.name, "request_duration");
        assert_eq!(metric.metric_type, MetricType::Timer);
        match metric.value {
            MetricValue::Timer(v) => assert!((v - 123.45).abs() < f64::EPSILON),
            _ => panic!("Expected timer value"),
        }
    }

    #[test]
    fn test_metric_with_tag() {
        let metric = Metric::counter("requests".to_string(), 1)
            .with_tag("endpoint".to_string(), "/api/v1".to_string());
        assert_eq!(metric.tags.len(), 1);
        assert_eq!(metric.tags.get("endpoint"), Some(&"/api/v1".to_string()));
    }

    #[test]
    fn test_metric_with_tags() {
        let mut tags = HashMap::new();
        tags.insert("method".to_string(), "GET".to_string());
        tags.insert("status".to_string(), "200".to_string());

        let metric = Metric::counter("requests".to_string(), 1).with_tags(tags);
        assert_eq!(metric.tags.len(), 2);
    }

    #[tokio::test]
    async fn test_metrics_collector_new() {
        let collector = MetricsCollector::new();
        assert_eq!(collector.count().await, 0);
    }

    #[tokio::test]
    async fn test_metrics_collector_record() {
        let collector = MetricsCollector::new();
        let metric = Metric::counter("test".to_string(), 1);

        collector.record(metric).await.unwrap();
        assert_eq!(collector.count().await, 1);
    }

    #[tokio::test]
    async fn test_metrics_collector_increment_counter() {
        let collector = MetricsCollector::new();

        collector
            .increment_counter("requests".to_string(), 5)
            .await
            .unwrap();
        assert_eq!(collector.count().await, 1);

        let metrics = collector.get_by_name("requests").await;
        assert_eq!(metrics.len(), 1);
    }

    #[tokio::test]
    async fn test_metrics_collector_record_gauge() {
        let collector = MetricsCollector::new();

        collector
            .record_gauge("cpu_usage".to_string(), 45.0)
            .await
            .unwrap();
        assert_eq!(collector.count().await, 1);
    }

    #[tokio::test]
    async fn test_metrics_collector_record_timer() {
        let collector = MetricsCollector::new();

        collector
            .record_timer("latency".to_string(), 123.45)
            .await
            .unwrap();
        assert_eq!(collector.count().await, 1);
    }

    #[tokio::test]
    async fn test_metrics_collector_get_by_name() {
        let collector = MetricsCollector::new();

        collector
            .increment_counter("requests".to_string(), 1)
            .await
            .unwrap();
        collector
            .increment_counter("errors".to_string(), 2)
            .await
            .unwrap();
        collector
            .increment_counter("requests".to_string(), 3)
            .await
            .unwrap();

        let requests = collector.get_by_name("requests").await;
        assert_eq!(requests.len(), 2);
    }

    #[tokio::test]
    async fn test_metrics_collector_clear() {
        let collector = MetricsCollector::new();

        collector
            .increment_counter("test".to_string(), 1)
            .await
            .unwrap();
        assert_eq!(collector.count().await, 1);

        collector.clear().await;
        assert_eq!(collector.count().await, 0);
    }

    #[tokio::test]
    async fn test_metrics_collector_export_json() {
        let collector = MetricsCollector::new();

        collector
            .increment_counter("test".to_string(), 42)
            .await
            .unwrap();

        let json = collector.export_json().await.unwrap();
        println!("JSON output: {}", json);
        assert!(json.contains("test"));
        assert!(json.contains("42"));
    }
}
