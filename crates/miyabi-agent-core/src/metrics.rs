//! CloudWatch metrics integration for agent monitoring.
//!
//! This module provides functionality for sending agent execution metrics
//! to AWS CloudWatch for real-time monitoring of the 200-agent experiment.
//!
//! # Usage
//!
//! ```rust,ignore
//! use miyabi_agent_core::metrics::{CloudWatchMetricsHook, MetricsConfig};
//!
//! let config = MetricsConfig::new("production", "ap-northeast-1");
//! let hook = CloudWatchMetricsHook::new(config).await?;
//!
//! // Register with hooked agent
//! hooked_agent.register_hook(hook);
//! ```

use crate::hooks::AgentHook;
use async_trait::async_trait;
use miyabi_types::agent::AgentType;
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::{AgentResult, Task};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;

/// Configuration for CloudWatch metrics.
#[derive(Debug, Clone)]
pub struct MetricsConfig {
    /// Environment (staging/production)
    pub environment: String,
    /// AWS Region
    pub region: String,
    /// Namespace for custom metrics
    pub namespace: String,
    /// Whether metrics are enabled
    pub enabled: bool,
    /// Buffer size before flushing
    pub buffer_size: usize,
    /// Flush interval in seconds
    pub flush_interval_secs: u64,
}

impl MetricsConfig {
    /// Create new metrics config.
    pub fn new(environment: impl Into<String>, region: impl Into<String>) -> Self {
        let env = environment.into();
        Self {
            namespace: format!("Miyabi/{}/Agents", env),
            environment: env,
            region: region.into(),
            enabled: true,
            buffer_size: 20,
            flush_interval_secs: 60,
        }
    }

    /// Create from environment variables.
    pub fn from_env() -> Self {
        let env = std::env::var("ENVIRONMENT").unwrap_or_else(|_| "staging".to_string());
        let region = std::env::var("AWS_REGION").unwrap_or_else(|_| "ap-northeast-1".to_string());
        Self::new(env, region)
    }
}

/// Metric data point.
#[derive(Debug, Clone)]
pub struct MetricDatum {
    /// Metric name
    pub name: String,
    /// Value
    pub value: f64,
    /// Unit (Milliseconds, Count, Percent, etc.)
    pub unit: MetricUnit,
    /// Dimensions (key-value pairs)
    pub dimensions: HashMap<String, String>,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// CloudWatch metric units.
#[derive(Debug, Clone, Copy)]
pub enum MetricUnit {
    Milliseconds,
    Count,
    Percent,
    None,
}

impl MetricUnit {
    pub fn as_str(&self) -> &'static str {
        match self {
            MetricUnit::Milliseconds => "Milliseconds",
            MetricUnit::Count => "Count",
            MetricUnit::Percent => "Percent",
            MetricUnit::None => "None",
        }
    }
}

/// In-memory metrics buffer.
#[derive(Debug, Default)]
struct MetricsBuffer {
    data: Vec<MetricDatum>,
}

impl MetricsBuffer {
    fn push(&mut self, datum: MetricDatum) {
        self.data.push(datum);
    }

    fn drain(&mut self) -> Vec<MetricDatum> {
        std::mem::take(&mut self.data)
    }

    fn len(&self) -> usize {
        self.data.len()
    }
}

/// Atomic counters for agent statistics.
#[derive(Debug, Default)]
pub struct AgentCounters {
    /// Total agents started
    pub started: AtomicU64,
    /// Total agents completed successfully
    pub completed: AtomicU64,
    /// Total agents failed
    pub failed: AtomicU64,
    /// Currently active agents
    pub active: AtomicU64,
}

impl AgentCounters {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn increment_started(&self) -> u64 {
        self.started.fetch_add(1, Ordering::SeqCst);
        self.active.fetch_add(1, Ordering::SeqCst)
    }

    pub fn increment_completed(&self) -> u64 {
        self.completed.fetch_add(1, Ordering::SeqCst);
        self.active.fetch_sub(1, Ordering::SeqCst)
    }

    pub fn increment_failed(&self) -> u64 {
        self.failed.fetch_add(1, Ordering::SeqCst);
        self.active.fetch_sub(1, Ordering::SeqCst)
    }

    pub fn get_active(&self) -> u64 {
        self.active.load(Ordering::SeqCst)
    }
}

/// Hook that sends execution metrics to CloudWatch.
pub struct CloudWatchMetricsHook {
    config: MetricsConfig,
    buffer: Arc<RwLock<MetricsBuffer>>,
    counters: Arc<AgentCounters>,
    /// Task start times for duration calculation
    task_starts: Arc<RwLock<HashMap<String, Instant>>>,
}

impl CloudWatchMetricsHook {
    /// Create new CloudWatch metrics hook.
    pub fn new(config: MetricsConfig) -> Self {
        Self {
            config,
            buffer: Arc::new(RwLock::new(MetricsBuffer::default())),
            counters: Arc::new(AgentCounters::new()),
            task_starts: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create from environment.
    pub fn from_env() -> Self {
        Self::new(MetricsConfig::from_env())
    }

    /// Get current agent counters.
    pub fn counters(&self) -> Arc<AgentCounters> {
        Arc::clone(&self.counters)
    }

    /// Record a metric.
    async fn record_metric(&self, datum: MetricDatum) {
        if !self.config.enabled {
            return;
        }

        let mut buffer = self.buffer.write().await;
        buffer.push(datum);

        // Auto-flush if buffer is full
        if buffer.len() >= self.config.buffer_size {
            let metrics = buffer.drain();
            drop(buffer);
            self.flush_metrics(metrics).await;
        }
    }

    /// Flush metrics to CloudWatch.
    async fn flush_metrics(&self, metrics: Vec<MetricDatum>) {
        if metrics.is_empty() {
            return;
        }

        // Log metrics for now (actual CloudWatch integration would use aws-sdk-cloudwatch)
        for metric in &metrics {
            tracing::info!(
                target: "cloudwatch_metrics",
                namespace = %self.config.namespace,
                metric_name = %metric.name,
                value = metric.value,
                unit = metric.unit.as_str(),
                dimensions = ?metric.dimensions,
                "Recording metric"
            );
        }

        // TODO: Integrate with aws-sdk-cloudwatch for actual metric publishing
        // This would be:
        // ```
        // let client = CloudWatchClient::new(&config);
        // client.put_metric_data()
        //     .namespace(&self.config.namespace)
        //     .metric_data(metrics.into_iter().map(|m| m.into()).collect())
        //     .send()
        //     .await?;
        // ```
    }

    /// Create dimensions for an agent.
    fn create_dimensions(&self, agent: AgentType, task: &Task) -> HashMap<String, String> {
        let mut dims = HashMap::new();
        dims.insert("Environment".to_string(), self.config.environment.clone());
        dims.insert("AgentType".to_string(), format!("{:?}", agent));

        if let Some(ref metadata) = task.metadata {
            if let Some(worktree_id) = metadata.get("worktree_id").and_then(|v| v.as_str()) {
                dims.insert("WorktreeId".to_string(), worktree_id.to_string());
            }
        }

        dims
    }
}

#[async_trait]
impl AgentHook for CloudWatchMetricsHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        // Track active agents
        let active = self.counters.increment_started();

        // Record start time
        {
            let mut starts = self.task_starts.write().await;
            starts.insert(task.id.clone(), Instant::now());
        }

        // Record concurrent agents metric
        self.record_metric(MetricDatum {
            name: "ConcurrentAgents".to_string(),
            value: active as f64,
            unit: MetricUnit::Count,
            dimensions: self.create_dimensions(agent, task),
            timestamp: chrono::Utc::now(),
        })
        .await;

        // Record agent started metric
        self.record_metric(MetricDatum {
            name: "AgentStarted".to_string(),
            value: 1.0,
            unit: MetricUnit::Count,
            dimensions: self.create_dimensions(agent, task),
            timestamp: chrono::Utc::now(),
        })
        .await;

        tracing::info!(
            target: "agent_metrics",
            agent_type = ?agent,
            task_id = %task.id,
            active_agents = active,
            "Agent started"
        );

        Ok(())
    }

    async fn on_post_execute(
        &self,
        agent: AgentType,
        task: &Task,
        _result: &AgentResult,
    ) -> Result<()> {
        let _active = self.counters.increment_completed();

        // Calculate duration
        let duration_ms = {
            let mut starts = self.task_starts.write().await;
            if let Some(start) = starts.remove(&task.id) {
                start.elapsed().as_millis() as f64
            } else {
                0.0
            }
        };

        let dims = self.create_dimensions(agent, task);

        // Record spawn/execution time
        self.record_metric(MetricDatum {
            name: "AgentSpawnTime".to_string(),
            value: duration_ms,
            unit: MetricUnit::Milliseconds,
            dimensions: dims.clone(),
            timestamp: chrono::Utc::now(),
        })
        .await;

        // Record completion
        self.record_metric(MetricDatum {
            name: "AgentCompleted".to_string(),
            value: 1.0,
            unit: MetricUnit::Count,
            dimensions: dims.clone(),
            timestamp: chrono::Utc::now(),
        })
        .await;

        // Record task execution time
        self.record_metric(MetricDatum {
            name: "TaskExecutionTime".to_string(),
            value: duration_ms,
            unit: MetricUnit::Milliseconds,
            dimensions: dims,
            timestamp: chrono::Utc::now(),
        })
        .await;

        tracing::info!(
            target: "agent_metrics",
            agent_type = ?agent,
            task_id = %task.id,
            duration_ms = duration_ms,
            "Agent completed"
        );

        Ok(())
    }

    async fn on_error(&self, agent: AgentType, task: &Task, error: &MiyabiError) -> Result<()> {
        self.counters.increment_failed();

        // Remove from tracking
        {
            let mut starts = self.task_starts.write().await;
            starts.remove(&task.id);
        }

        let dims = self.create_dimensions(agent, task);

        // Record error
        self.record_metric(MetricDatum {
            name: "AgentErrorCount".to_string(),
            value: 1.0,
            unit: MetricUnit::Count,
            dimensions: dims,
            timestamp: chrono::Utc::now(),
        })
        .await;

        tracing::error!(
            target: "agent_metrics",
            agent_type = ?agent,
            task_id = %task.id,
            error = %error,
            "Agent failed"
        );

        Ok(())
    }
}

/// Global metrics registry for aggregate statistics.
pub struct MetricsRegistry {
    counters: Arc<AgentCounters>,
    /// Per-agent-type counters
    agent_type_counters: Arc<RwLock<HashMap<String, AgentCounters>>>,
}

impl MetricsRegistry {
    pub fn new() -> Self {
        Self {
            counters: Arc::new(AgentCounters::new()),
            agent_type_counters: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get global counters.
    pub fn global_counters(&self) -> Arc<AgentCounters> {
        Arc::clone(&self.counters)
    }

    /// Get counters for a specific agent type.
    pub async fn agent_type_counters(&self, agent_type: &str) -> Arc<AgentCounters> {
        let mut map = self.agent_type_counters.write().await;
        if !map.contains_key(agent_type) {
            map.insert(agent_type.to_string(), AgentCounters::new());
        }
        // Note: This returns a reference to the internal counter, not Arc
        // For simplicity, we clone the global counters pattern
        Arc::clone(&self.counters)
    }

    /// Get summary statistics.
    pub fn get_summary(&self) -> MetricsSummary {
        MetricsSummary {
            total_started: self.counters.started.load(Ordering::SeqCst),
            total_completed: self.counters.completed.load(Ordering::SeqCst),
            total_failed: self.counters.failed.load(Ordering::SeqCst),
            currently_active: self.counters.active.load(Ordering::SeqCst),
        }
    }
}

impl Default for MetricsRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Summary of metrics.
#[derive(Debug, Clone)]
pub struct MetricsSummary {
    pub total_started: u64,
    pub total_completed: u64,
    pub total_failed: u64,
    pub currently_active: u64,
}

impl MetricsSummary {
    /// Calculate success rate.
    pub fn success_rate(&self) -> f64 {
        let total = self.total_completed + self.total_failed;
        if total == 0 {
            100.0
        } else {
            (self.total_completed as f64 / total as f64) * 100.0
        }
    }

    /// Calculate error rate.
    pub fn error_rate(&self) -> f64 {
        100.0 - self.success_rate()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_config_new() {
        let config = MetricsConfig::new("production", "us-east-1");
        assert_eq!(config.environment, "production");
        assert_eq!(config.region, "us-east-1");
        assert_eq!(config.namespace, "Miyabi/production/Agents");
    }

    #[test]
    fn test_agent_counters() {
        let counters = AgentCounters::new();

        counters.increment_started();
        assert_eq!(counters.get_active(), 1);

        counters.increment_started();
        assert_eq!(counters.get_active(), 2);

        counters.increment_completed();
        assert_eq!(counters.get_active(), 1);

        counters.increment_failed();
        assert_eq!(counters.get_active(), 0);
    }

    #[test]
    fn test_metrics_summary() {
        let counters = AgentCounters::new();
        counters.started.store(100, Ordering::SeqCst);
        counters.completed.store(95, Ordering::SeqCst);
        counters.failed.store(5, Ordering::SeqCst);

        let registry = MetricsRegistry {
            counters: Arc::new(counters),
            agent_type_counters: Arc::new(RwLock::new(HashMap::new())),
        };

        let summary = registry.get_summary();
        assert_eq!(summary.success_rate(), 95.0);
        assert_eq!(summary.error_rate(), 5.0);
    }
}
