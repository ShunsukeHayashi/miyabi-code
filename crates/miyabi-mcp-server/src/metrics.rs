//! Tool Metrics Collection and Monitoring
//!
//! This module provides comprehensive metrics collection for MCP tool execution,
//! including execution counts, timing statistics, cache hit rates, and Prometheus-compatible
//! export for monitoring dashboards.
//!
//! ## Features
//!
//! - **Per-tool metrics**: Execution count, error rate, timing percentiles
//! - **Global metrics**: Total executions, cache hits/misses
//! - **Percentile calculation**: p50, p95, p99 for latency analysis
//! - **Prometheus export**: Standard format for integration with monitoring systems
//! - **JSON export**: Dashboard-friendly format
//! - **Thread-safe**: Atomic counters for concurrent access
//!
//! ## Usage
//!
//! ```rust
//! use miyabi_mcp_server::metrics::ToolMetrics;
//! use std::time::Duration;
//!
//! let mut metrics = ToolMetrics::new();
//!
//! // Record successful execution
//! metrics.record_execution("github.issue.get", Duration::from_millis(45), true);
//!
//! // Record cache hit
//! metrics.record_cache_hit("github.issue.get");
//!
//! // Export for Prometheus
//! let prometheus_output = metrics.export_prometheus();
//! println!("{}", prometheus_output);
//!
//! // Export as JSON
//! let json_output = metrics.export_json();
//! println!("{}", serde_json::to_string_pretty(&json_output).unwrap());
//! ```

use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tracing::{debug, info};

/// Maximum number of recent execution times to keep per tool for percentile calculation
const MAX_EXECUTION_HISTORY: usize = 1000;

/// Tool metrics for a single tool
///
/// Contains all execution statistics for a specific tool, including timing
/// percentiles and error rates.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolExecutionMetrics {
    /// Tool name (e.g., "github.issue.get")
    pub tool_name: String,

    /// Total number of executions
    pub execution_count: u64,

    /// Number of failed executions
    pub error_count: u64,

    /// Total execution time across all invocations
    pub total_duration: Duration,

    /// Average execution duration
    pub avg_duration: Duration,

    /// Minimum execution duration
    pub min_duration: Duration,

    /// Maximum execution duration
    pub max_duration: Duration,

    /// Median (50th percentile) execution duration
    pub p50_duration: Duration,

    /// 95th percentile execution duration
    pub p95_duration: Duration,

    /// 99th percentile execution duration
    pub p99_duration: Duration,

    /// Number of cache hits for this tool
    pub cache_hits: u64,

    /// Number of cache misses for this tool
    pub cache_misses: u64,
}

impl ToolExecutionMetrics {
    /// Calculate success rate (0.0 to 1.0)
    pub fn success_rate(&self) -> f64 {
        if self.execution_count == 0 {
            return 0.0;
        }
        let successes = self.execution_count - self.error_count;
        successes as f64 / self.execution_count as f64
    }

    /// Calculate error rate (0.0 to 1.0)
    pub fn error_rate(&self) -> f64 {
        if self.execution_count == 0 {
            return 0.0;
        }
        self.error_count as f64 / self.execution_count as f64
    }

    /// Calculate cache hit rate (0.0 to 1.0)
    pub fn cache_hit_rate(&self) -> f64 {
        let total_requests = self.cache_hits + self.cache_misses;
        if total_requests == 0 {
            return 0.0;
        }
        self.cache_hits as f64 / total_requests as f64
    }
}

/// Tool metrics collection system
///
/// Thread-safe metrics collection for all tool executions, with support
/// for percentile calculation and multiple export formats.
///
/// ## Architecture
///
/// ```text
/// ┌─────────────────────────────────────────┐
/// │          ToolMetrics                    │
/// │                                         │
/// │  ┌──────────────────────────────────┐   │
/// │  │  Global Counters (AtomicU64)    │   │
/// │  │  - total_executions              │   │
/// │  │  - total_errors                  │   │
/// │  │  - total_cache_hits              │   │
/// │  │  - total_cache_misses            │   │
/// │  └──────────────────────────────────┘   │
/// │                                         │
/// │  ┌──────────────────────────────────┐   │
/// │  │  Per-Tool Data (Mutex<HashMap>)  │   │
/// │  │  - execution_times (VecDeque)    │   │
/// │  │  - error_count                   │   │
/// │  │  - cache_hits                    │   │
/// │  └──────────────────────────────────┘   │
/// └─────────────────────────────────────────┘
/// ```
#[derive(Debug)]
pub struct ToolMetrics {
    /// Per-tool execution times (for percentile calculation)
    ///
    /// Stores recent execution times in a sliding window using VecDeque.
    /// Protected by Mutex for thread safety.
    execution_times: Arc<Mutex<HashMap<String, VecDeque<Duration>>>>,

    /// Per-tool error counts
    error_counts: Arc<Mutex<HashMap<String, u64>>>,

    /// Per-tool cache hit counts
    cache_hits: Arc<Mutex<HashMap<String, u64>>>,

    /// Per-tool cache miss counts
    cache_misses: Arc<Mutex<HashMap<String, u64>>>,

    /// Global execution counter
    total_executions: Arc<AtomicU64>,

    /// Global error counter
    total_errors: Arc<AtomicU64>,

    /// Global cache hit counter
    total_cache_hits: Arc<AtomicU64>,

    /// Global cache miss counter
    total_cache_misses: Arc<AtomicU64>,
}

impl ToolMetrics {
    /// Create a new tool metrics collector
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::metrics::ToolMetrics;
    ///
    /// let metrics = ToolMetrics::new();
    /// ```
    pub fn new() -> Self {
        info!("Initializing ToolMetrics collector");
        Self {
            execution_times: Arc::new(Mutex::new(HashMap::new())),
            error_counts: Arc::new(Mutex::new(HashMap::new())),
            cache_hits: Arc::new(Mutex::new(HashMap::new())),
            cache_misses: Arc::new(Mutex::new(HashMap::new())),
            total_executions: Arc::new(AtomicU64::new(0)),
            total_errors: Arc::new(AtomicU64::new(0)),
            total_cache_hits: Arc::new(AtomicU64::new(0)),
            total_cache_misses: Arc::new(AtomicU64::new(0)),
        }
    }

    /// Record a tool execution
    ///
    /// Records execution duration and success/failure status. Updates both
    /// per-tool and global metrics.
    ///
    /// # Arguments
    ///
    /// * `tool_name` - Name of the tool that was executed
    /// * `duration` - Execution duration
    /// * `success` - Whether the execution succeeded
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::metrics::ToolMetrics;
    /// use std::time::Duration;
    ///
    /// let mut metrics = ToolMetrics::new();
    ///
    /// // Record successful execution
    /// metrics.record_execution("github.issue.get", Duration::from_millis(45), true);
    ///
    /// // Record failed execution
    /// metrics.record_execution("github.issue.get", Duration::from_millis(100), false);
    /// ```
    pub fn record_execution(&self, tool_name: &str, duration: Duration, success: bool) {
        debug!(
            tool_name = tool_name,
            duration_ms = duration.as_millis(),
            success = success,
            "Recording tool execution"
        );

        // Update global counters
        self.total_executions.fetch_add(1, Ordering::Relaxed);
        if !success {
            self.total_errors.fetch_add(1, Ordering::Relaxed);
        }

        // Update per-tool metrics
        let mut times = self.execution_times.lock().unwrap();
        let tool_times = times.entry(tool_name.to_string()).or_default();

        // Add new execution time
        tool_times.push_back(duration);

        // Maintain sliding window (keep last N executions)
        if tool_times.len() > MAX_EXECUTION_HISTORY {
            tool_times.pop_front();
        }

        drop(times); // Release lock

        // Update error count if failed
        if !success {
            let mut errors = self.error_counts.lock().unwrap();
            *errors.entry(tool_name.to_string()).or_insert(0) += 1;
        }
    }

    /// Record a cache hit
    ///
    /// # Arguments
    ///
    /// * `tool_name` - Name of the tool for which cache was hit
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::metrics::ToolMetrics;
    ///
    /// let metrics = ToolMetrics::new();
    /// metrics.record_cache_hit("github.issue.get");
    /// ```
    pub fn record_cache_hit(&self, tool_name: &str) {
        debug!(tool_name = tool_name, "Recording cache hit");

        self.total_cache_hits.fetch_add(1, Ordering::Relaxed);

        let mut hits = self.cache_hits.lock().unwrap();
        *hits.entry(tool_name.to_string()).or_insert(0) += 1;
    }

    /// Record a cache miss
    ///
    /// # Arguments
    ///
    /// * `tool_name` - Name of the tool for which cache was missed
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::metrics::ToolMetrics;
    ///
    /// let metrics = ToolMetrics::new();
    /// metrics.record_cache_miss("github.issue.get");
    /// ```
    pub fn record_cache_miss(&self, tool_name: &str) {
        debug!(tool_name = tool_name, "Recording cache miss");

        self.total_cache_misses.fetch_add(1, Ordering::Relaxed);

        let mut misses = self.cache_misses.lock().unwrap();
        *misses.entry(tool_name.to_string()).or_insert(0) += 1;
    }

    /// Get metrics for a specific tool
    ///
    /// Calculates all statistics including percentiles for the specified tool.
    ///
    /// # Arguments
    ///
    /// * `tool_name` - Name of the tool to get metrics for
    ///
    /// # Returns
    ///
    /// Some(ToolExecutionMetrics) if the tool has been executed, None otherwise
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::metrics::ToolMetrics;
    /// use std::time::Duration;
    ///
    /// let metrics = ToolMetrics::new();
    /// metrics.record_execution("github.issue.get", Duration::from_millis(45), true);
    ///
    /// if let Some(tool_metrics) = metrics.get_tool_metrics("github.issue.get") {
    ///     println!("Average duration: {:?}", tool_metrics.avg_duration);
    /// }
    /// ```
    pub fn get_tool_metrics(&self, tool_name: &str) -> Option<ToolExecutionMetrics> {
        let times = self.execution_times.lock().unwrap();
        let tool_times = times.get(tool_name)?;

        if tool_times.is_empty() {
            return None;
        }

        // Calculate statistics
        let execution_count = tool_times.len() as u64;
        let total_duration: Duration = tool_times.iter().copied().sum();
        let avg_duration = total_duration / (execution_count as u32);

        // Sort times for percentile calculation
        let mut sorted_times: Vec<Duration> = tool_times.iter().copied().collect();
        sorted_times.sort();

        let min_duration = *sorted_times.first().unwrap();
        let max_duration = *sorted_times.last().unwrap();

        let p50_duration = Self::percentile(&sorted_times, 0.50);
        let p95_duration = Self::percentile(&sorted_times, 0.95);
        let p99_duration = Self::percentile(&sorted_times, 0.99);

        // Get error count
        let errors = self.error_counts.lock().unwrap();
        let error_count = *errors.get(tool_name).unwrap_or(&0);

        // Get cache stats
        let hits = self.cache_hits.lock().unwrap();
        let misses = self.cache_misses.lock().unwrap();
        let cache_hits = *hits.get(tool_name).unwrap_or(&0);
        let cache_misses = *misses.get(tool_name).unwrap_or(&0);

        Some(ToolExecutionMetrics {
            tool_name: tool_name.to_string(),
            execution_count,
            error_count,
            total_duration,
            avg_duration,
            min_duration,
            max_duration,
            p50_duration,
            p95_duration,
            p99_duration,
            cache_hits,
            cache_misses,
        })
    }

    /// Calculate percentile from sorted durations
    ///
    /// # Arguments
    ///
    /// * `sorted_times` - Sorted vector of durations
    /// * `percentile` - Percentile to calculate (0.0 to 1.0)
    ///
    /// # Returns
    ///
    /// Duration at the specified percentile
    fn percentile(sorted_times: &[Duration], percentile: f64) -> Duration {
        if sorted_times.is_empty() {
            return Duration::ZERO;
        }

        let index = ((sorted_times.len() - 1) as f64 * percentile).round() as usize;
        sorted_times[index]
    }

    /// Get all tool names that have metrics
    ///
    /// # Returns
    ///
    /// Vector of tool names that have recorded executions
    pub fn tool_names(&self) -> Vec<String> {
        let times = self.execution_times.lock().unwrap();
        times.keys().cloned().collect()
    }

    /// Export metrics in Prometheus format
    ///
    /// Generates Prometheus-compatible metrics output that can be scraped
    /// by Prometheus servers or compatible monitoring systems.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::metrics::ToolMetrics;
    /// use std::time::Duration;
    ///
    /// let metrics = ToolMetrics::new();
    /// metrics.record_execution("github.issue.get", Duration::from_millis(45), true);
    ///
    /// let prometheus_output = metrics.export_prometheus();
    /// println!("{}", prometheus_output);
    /// ```
    ///
    /// # Output Format
    ///
    /// ```text
    /// # HELP tool_executions_total Total number of tool executions
    /// # TYPE tool_executions_total counter
    /// tool_executions_total{tool="github.issue.get"} 150
    ///
    /// # HELP tool_execution_duration_seconds Tool execution duration
    /// # TYPE tool_execution_duration_seconds histogram
    /// tool_execution_duration_seconds{tool="github.issue.get",quantile="0.5"} 0.045
    /// tool_execution_duration_seconds{tool="github.issue.get",quantile="0.95"} 0.12
    /// tool_execution_duration_seconds{tool="github.issue.get",quantile="0.99"} 0.25
    /// ```
    pub fn export_prometheus(&self) -> String {
        let mut output = String::new();

        // Global metrics
        output.push_str("# HELP tool_executions_total Total number of tool executions\n");
        output.push_str("# TYPE tool_executions_total counter\n");
        output.push_str(&format!(
            "tool_executions_total {}\n\n",
            self.total_executions.load(Ordering::Relaxed)
        ));

        output.push_str("# HELP tool_errors_total Total number of tool execution errors\n");
        output.push_str("# TYPE tool_errors_total counter\n");
        output.push_str(&format!(
            "tool_errors_total {}\n\n",
            self.total_errors.load(Ordering::Relaxed)
        ));

        output.push_str("# HELP tool_cache_hits_total Total number of cache hits\n");
        output.push_str("# TYPE tool_cache_hits_total counter\n");
        output.push_str(&format!(
            "tool_cache_hits_total {}\n\n",
            self.total_cache_hits.load(Ordering::Relaxed)
        ));

        output.push_str("# HELP tool_cache_misses_total Total number of cache misses\n");
        output.push_str("# TYPE tool_cache_misses_total counter\n");
        output.push_str(&format!(
            "tool_cache_misses_total {}\n\n",
            self.total_cache_misses.load(Ordering::Relaxed)
        ));

        // Per-tool metrics
        output.push_str("# HELP tool_execution_count Number of executions per tool\n");
        output.push_str("# TYPE tool_execution_count gauge\n");

        for tool_name in self.tool_names() {
            if let Some(metrics) = self.get_tool_metrics(&tool_name) {
                output.push_str(&format!(
                    "tool_execution_count{{tool=\"{}\"}} {}\n",
                    tool_name, metrics.execution_count
                ));
            }
        }
        output.push('\n');

        output.push_str("# HELP tool_error_count Number of errors per tool\n");
        output.push_str("# TYPE tool_error_count gauge\n");

        for tool_name in self.tool_names() {
            if let Some(metrics) = self.get_tool_metrics(&tool_name) {
                output.push_str(&format!(
                    "tool_error_count{{tool=\"{}\"}} {}\n",
                    tool_name, metrics.error_count
                ));
            }
        }
        output.push('\n');

        output.push_str("# HELP tool_execution_duration_seconds Tool execution duration\n");
        output.push_str("# TYPE tool_execution_duration_seconds histogram\n");

        for tool_name in self.tool_names() {
            if let Some(metrics) = self.get_tool_metrics(&tool_name) {
                output.push_str(&format!(
                    "tool_execution_duration_seconds{{tool=\"{}\",quantile=\"0.5\"}} {:.6}\n",
                    tool_name,
                    metrics.p50_duration.as_secs_f64()
                ));
                output.push_str(&format!(
                    "tool_execution_duration_seconds{{tool=\"{}\",quantile=\"0.95\"}} {:.6}\n",
                    tool_name,
                    metrics.p95_duration.as_secs_f64()
                ));
                output.push_str(&format!(
                    "tool_execution_duration_seconds{{tool=\"{}\",quantile=\"0.99\"}} {:.6}\n",
                    tool_name,
                    metrics.p99_duration.as_secs_f64()
                ));
            }
        }
        output.push('\n');

        // Cache hit rate
        output.push_str("# HELP cache_hit_rate Cache hit rate (0.0 to 1.0)\n");
        output.push_str("# TYPE cache_hit_rate gauge\n");

        let total_hits = self.total_cache_hits.load(Ordering::Relaxed);
        let total_misses = self.total_cache_misses.load(Ordering::Relaxed);
        let total_requests = total_hits + total_misses;
        let hit_rate = if total_requests > 0 {
            total_hits as f64 / total_requests as f64
        } else {
            0.0
        };

        output.push_str(&format!("cache_hit_rate {:.4}\n\n", hit_rate));

        output
    }

    /// Export metrics as JSON
    ///
    /// Generates a JSON representation of all metrics, suitable for
    /// dashboards and custom visualization tools.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use miyabi_mcp_server::metrics::ToolMetrics;
    /// use std::time::Duration;
    ///
    /// let metrics = ToolMetrics::new();
    /// metrics.record_execution("github.issue.get", Duration::from_millis(45), true);
    ///
    /// let json = metrics.export_json();
    /// println!("{}", serde_json::to_string_pretty(&json).unwrap());
    /// ```
    pub fn export_json(&self) -> serde_json::Value {
        let total_hits = self.total_cache_hits.load(Ordering::Relaxed);
        let total_misses = self.total_cache_misses.load(Ordering::Relaxed);
        let total_requests = total_hits + total_misses;
        let global_hit_rate = if total_requests > 0 {
            total_hits as f64 / total_requests as f64
        } else {
            0.0
        };

        let mut tools = Vec::new();
        for tool_name in self.tool_names() {
            if let Some(metrics) = self.get_tool_metrics(&tool_name) {
                tools.push(serde_json::json!({
                    "tool_name": metrics.tool_name,
                    "execution_count": metrics.execution_count,
                    "error_count": metrics.error_count,
                    "success_rate": metrics.success_rate(),
                    "error_rate": metrics.error_rate(),
                    "total_duration_ms": metrics.total_duration.as_millis(),
                    "avg_duration_ms": metrics.avg_duration.as_millis(),
                    "min_duration_ms": metrics.min_duration.as_millis(),
                    "max_duration_ms": metrics.max_duration.as_millis(),
                    "p50_duration_ms": metrics.p50_duration.as_millis(),
                    "p95_duration_ms": metrics.p95_duration.as_millis(),
                    "p99_duration_ms": metrics.p99_duration.as_millis(),
                    "cache_hits": metrics.cache_hits,
                    "cache_misses": metrics.cache_misses,
                    "cache_hit_rate": metrics.cache_hit_rate(),
                }));
            }
        }

        serde_json::json!({
            "global": {
                "total_executions": self.total_executions.load(Ordering::Relaxed),
                "total_errors": self.total_errors.load(Ordering::Relaxed),
                "total_cache_hits": total_hits,
                "total_cache_misses": total_misses,
                "cache_hit_rate": global_hit_rate,
            },
            "tools": tools,
        })
    }

    /// Get global total execution count
    pub fn total_executions(&self) -> u64 {
        self.total_executions.load(Ordering::Relaxed)
    }

    /// Get global total error count
    pub fn total_errors(&self) -> u64 {
        self.total_errors.load(Ordering::Relaxed)
    }

    /// Get global total cache hits
    pub fn total_cache_hits(&self) -> u64 {
        self.total_cache_hits.load(Ordering::Relaxed)
    }

    /// Get global total cache misses
    pub fn total_cache_misses(&self) -> u64 {
        self.total_cache_misses.load(Ordering::Relaxed)
    }

    /// Get global cache hit rate
    pub fn global_cache_hit_rate(&self) -> f64 {
        let hits = self.total_cache_hits.load(Ordering::Relaxed);
        let misses = self.total_cache_misses.load(Ordering::Relaxed);
        let total = hits + misses;

        if total == 0 {
            return 0.0;
        }

        hits as f64 / total as f64
    }

    /// Reset all metrics (useful for testing)
    #[cfg(test)]
    pub fn reset(&self) {
        self.execution_times.lock().unwrap().clear();
        self.error_counts.lock().unwrap().clear();
        self.cache_hits.lock().unwrap().clear();
        self.cache_misses.lock().unwrap().clear();
        self.total_executions.store(0, Ordering::Relaxed);
        self.total_errors.store(0, Ordering::Relaxed);
        self.total_cache_hits.store(0, Ordering::Relaxed);
        self.total_cache_misses.store(0, Ordering::Relaxed);
    }
}

impl Default for ToolMetrics {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_new() {
        let metrics = ToolMetrics::new();

        assert_eq!(metrics.total_executions(), 0);
        assert_eq!(metrics.total_errors(), 0);
        assert_eq!(metrics.total_cache_hits(), 0);
        assert_eq!(metrics.total_cache_misses(), 0);
        assert_eq!(metrics.tool_names().len(), 0);
    }

    #[test]
    fn test_record_execution_success() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("test.tool", Duration::from_millis(50), true);

        assert_eq!(metrics.total_executions(), 1);
        assert_eq!(metrics.total_errors(), 0);

        let tool_metrics = metrics.get_tool_metrics("test.tool").unwrap();
        assert_eq!(tool_metrics.execution_count, 1);
        assert_eq!(tool_metrics.error_count, 0);
        assert_eq!(tool_metrics.avg_duration, Duration::from_millis(50));
    }

    #[test]
    fn test_record_execution_failure() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("test.tool", Duration::from_millis(100), false);

        assert_eq!(metrics.total_executions(), 1);
        assert_eq!(metrics.total_errors(), 1);

        let tool_metrics = metrics.get_tool_metrics("test.tool").unwrap();
        assert_eq!(tool_metrics.execution_count, 1);
        assert_eq!(tool_metrics.error_count, 1);
        assert_eq!(tool_metrics.error_rate(), 1.0);
    }

    #[test]
    fn test_multiple_executions() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("test.tool", Duration::from_millis(30), true);
        metrics.record_execution("test.tool", Duration::from_millis(50), true);
        metrics.record_execution("test.tool", Duration::from_millis(70), true);

        assert_eq!(metrics.total_executions(), 3);

        let tool_metrics = metrics.get_tool_metrics("test.tool").unwrap();
        assert_eq!(tool_metrics.execution_count, 3);
        assert_eq!(tool_metrics.min_duration, Duration::from_millis(30));
        assert_eq!(tool_metrics.max_duration, Duration::from_millis(70));
        assert_eq!(tool_metrics.avg_duration, Duration::from_millis(50));
    }

    #[test]
    fn test_percentile_calculation() {
        let metrics = ToolMetrics::new();

        // Add 10 executions with varying durations: 10, 20, 30, ..., 100ms
        for i in 1..=10 {
            metrics.record_execution("test.tool", Duration::from_millis(i * 10), true);
        }

        let tool_metrics = metrics.get_tool_metrics("test.tool").unwrap();

        // With 10 values, p50 (50th percentile) is at index round((10-1) * 0.5) = round(4.5) = 5
        // Values: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        // Index 5 (0-based) = 60ms
        assert_eq!(tool_metrics.p50_duration, Duration::from_millis(60));

        // p95 is at index round((10-1) * 0.95) = round(8.55) = 9
        // Index 9 = 100ms
        assert_eq!(tool_metrics.p95_duration, Duration::from_millis(100));

        // p99 is at index round((10-1) * 0.99) = round(8.91) = 9
        // Index 9 = 100ms
        assert_eq!(tool_metrics.p99_duration, Duration::from_millis(100));
    }

    #[test]
    fn test_cache_metrics() {
        let metrics = ToolMetrics::new();

        metrics.record_cache_hit("test.tool");
        metrics.record_cache_hit("test.tool");
        metrics.record_cache_miss("test.tool");

        assert_eq!(metrics.total_cache_hits(), 2);
        assert_eq!(metrics.total_cache_misses(), 1);
        assert!((metrics.global_cache_hit_rate() - 0.6667).abs() < 0.01);
    }

    #[test]
    fn test_per_tool_cache_metrics() {
        let metrics = ToolMetrics::new();

        // Need to record execution first to create tool entry
        metrics.record_execution("tool1", Duration::from_millis(10), true);
        metrics.record_execution("tool2", Duration::from_millis(20), true);

        metrics.record_cache_hit("tool1");
        metrics.record_cache_hit("tool1");
        metrics.record_cache_miss("tool1");

        metrics.record_cache_hit("tool2");
        metrics.record_cache_miss("tool2");
        metrics.record_cache_miss("tool2");

        let tool1_metrics = metrics.get_tool_metrics("tool1").unwrap();
        assert_eq!(tool1_metrics.cache_hits, 2);
        assert_eq!(tool1_metrics.cache_misses, 1);
        assert!((tool1_metrics.cache_hit_rate() - 0.6667).abs() < 0.01);

        let tool2_metrics = metrics.get_tool_metrics("tool2").unwrap();
        assert_eq!(tool2_metrics.cache_hits, 1);
        assert_eq!(tool2_metrics.cache_misses, 2);
        assert!((tool2_metrics.cache_hit_rate() - 0.3333).abs() < 0.01);
    }

    #[test]
    fn test_success_rate_calculation() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("test.tool", Duration::from_millis(10), true);
        metrics.record_execution("test.tool", Duration::from_millis(10), true);
        metrics.record_execution("test.tool", Duration::from_millis(10), true);
        metrics.record_execution("test.tool", Duration::from_millis(10), false);

        let tool_metrics = metrics.get_tool_metrics("test.tool").unwrap();
        assert_eq!(tool_metrics.execution_count, 4);
        assert_eq!(tool_metrics.error_count, 1);
        assert_eq!(tool_metrics.success_rate(), 0.75);
        assert_eq!(tool_metrics.error_rate(), 0.25);
    }

    #[test]
    fn test_prometheus_export() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("github.issue.get", Duration::from_millis(45), true);
        metrics.record_execution("github.issue.get", Duration::from_millis(55), true);
        metrics.record_cache_hit("github.issue.get");

        let prometheus_output = metrics.export_prometheus();

        // Check that output contains expected sections
        assert!(prometheus_output.contains("tool_executions_total"));
        assert!(prometheus_output.contains("tool_execution_duration_seconds"));
        assert!(prometheus_output.contains("cache_hit_rate"));
        assert!(prometheus_output.contains("github.issue.get"));
    }

    #[test]
    fn test_json_export() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("test.tool", Duration::from_millis(50), true);
        metrics.record_cache_hit("test.tool");

        let json = metrics.export_json();

        assert!(json["global"]["total_executions"].as_u64().unwrap() == 1);
        assert!(json["tools"].is_array());
        assert!(json["tools"].as_array().unwrap().len() == 1);

        let tool_json = &json["tools"][0];
        assert_eq!(tool_json["tool_name"], "test.tool");
        assert_eq!(tool_json["execution_count"], 1);
    }

    #[test]
    fn test_sliding_window_limit() {
        let metrics = ToolMetrics::new();

        // Record more than MAX_EXECUTION_HISTORY executions
        for i in 0..(MAX_EXECUTION_HISTORY + 100) {
            metrics.record_execution("test.tool", Duration::from_millis(i as u64), true);
        }

        // Should only keep last MAX_EXECUTION_HISTORY entries
        let times = metrics.execution_times.lock().unwrap();
        let tool_times = times.get("test.tool").unwrap();
        assert_eq!(tool_times.len(), MAX_EXECUTION_HISTORY);

        // Oldest entry should have been removed
        assert_eq!(tool_times[0], Duration::from_millis(100));
    }

    #[test]
    fn test_multiple_tools() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("tool1", Duration::from_millis(10), true);
        metrics.record_execution("tool2", Duration::from_millis(20), true);
        metrics.record_execution("tool3", Duration::from_millis(30), true);

        let tool_names = metrics.tool_names();
        assert_eq!(tool_names.len(), 3);
        assert!(tool_names.contains(&"tool1".to_string()));
        assert!(tool_names.contains(&"tool2".to_string()));
        assert!(tool_names.contains(&"tool3".to_string()));
    }

    #[test]
    fn test_get_tool_metrics_nonexistent() {
        let metrics = ToolMetrics::new();

        let result = metrics.get_tool_metrics("nonexistent.tool");
        assert!(result.is_none());
    }

    #[test]
    fn test_zero_executions_rates() {
        let metrics = ToolMetrics::new();

        assert_eq!(metrics.global_cache_hit_rate(), 0.0);
        assert_eq!(metrics.total_executions(), 0);
    }

    #[test]
    fn test_thread_safety() {
        use std::sync::Arc;
        use std::thread;

        let metrics = Arc::new(ToolMetrics::new());
        let mut handles = vec![];

        // Spawn 10 threads that each record 100 executions
        for _ in 0..10 {
            let metrics_clone = Arc::clone(&metrics);
            let handle = thread::spawn(move || {
                for _ in 0..100 {
                    metrics_clone.record_execution("test.tool", Duration::from_millis(10), true);
                }
            });
            handles.push(handle);
        }

        // Wait for all threads to complete
        for handle in handles {
            handle.join().unwrap();
        }

        // Should have exactly 1000 total executions
        assert_eq!(metrics.total_executions(), 1000);
    }

    #[test]
    fn test_reset() {
        let metrics = ToolMetrics::new();

        metrics.record_execution("test.tool", Duration::from_millis(50), true);
        metrics.record_cache_hit("test.tool");

        assert_eq!(metrics.total_executions(), 1);

        metrics.reset();

        assert_eq!(metrics.total_executions(), 0);
        assert_eq!(metrics.total_cache_hits(), 0);
        assert_eq!(metrics.tool_names().len(), 0);
    }

    #[test]
    fn test_percentile_edge_cases() {
        let metrics = ToolMetrics::new();

        // Single execution
        metrics.record_execution("test.tool", Duration::from_millis(50), true);

        let tool_metrics = metrics.get_tool_metrics("test.tool").unwrap();
        assert_eq!(tool_metrics.p50_duration, Duration::from_millis(50));
        assert_eq!(tool_metrics.p95_duration, Duration::from_millis(50));
        assert_eq!(tool_metrics.p99_duration, Duration::from_millis(50));
    }
}
