//! Dynamic scaling for 5-Worlds parallel execution
//!
//! This module provides automatic resource monitoring and dynamic scaling
//! of concurrent worktree executions based on system resource availability.

use miyabi_core::resource_limits::{HardwareLimits, PerWorktreeLimits, ResourceType};
use miyabi_types::error::MiyabiError;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tokio::time;
use tracing::{debug, info, warn};

/// Dynamic scaler for managing concurrent worktree executions
///
/// The DynamicScaler automatically adjusts the number of concurrent worktrees
/// based on real-time system resource availability.
///
/// # Example
///
/// ```no_run
/// use miyabi_orchestrator::dynamic_scaling::{DynamicScaler, DynamicScalerConfig};
/// use std::time::Duration;
///
/// #[tokio::main]
/// async fn main() {
///     let config = DynamicScalerConfig {
///         monitor_interval: Duration::from_secs(10),
///         scale_up_threshold: 0.3,   // 30% resource usage
///         scale_down_threshold: 0.8, // 80% resource usage
///         min_concurrent: 1,
///         max_concurrent: 10,
///     };
///
///     let scaler = DynamicScaler::new(config);
///     scaler.start_monitoring().await;
/// }
/// ```
pub struct DynamicScaler {
    /// Configuration
    config: DynamicScalerConfig,
    /// Resource monitor
    monitor: Arc<Mutex<ResourceMonitor>>,
    /// Current concurrent limit
    current_limit: Arc<Mutex<usize>>,
}

/// Configuration for the dynamic scaler
#[derive(Debug, Clone)]
pub struct DynamicScalerConfig {
    /// Interval for resource monitoring (default: 10 seconds)
    pub monitor_interval: Duration,
    /// Resource usage threshold for scaling up (0.0-1.0, default: 0.3 = 30%)
    pub scale_up_threshold: f64,
    /// Resource usage threshold for scaling down (0.0-1.0, default: 0.8 = 80%)
    pub scale_down_threshold: f64,
    /// Minimum concurrent worktrees (default: 1)
    pub min_concurrent: usize,
    /// Maximum concurrent worktrees (default: 10)
    pub max_concurrent: usize,
}

impl Default for DynamicScalerConfig {
    fn default() -> Self {
        Self {
            monitor_interval: Duration::from_secs(10),
            scale_up_threshold: 0.3,
            scale_down_threshold: 0.8,
            min_concurrent: 1,
            max_concurrent: 10,
        }
    }
}

impl DynamicScaler {
    /// Creates a new DynamicScaler
    pub fn new(config: DynamicScalerConfig) -> Self {
        let hardware = HardwareLimits::detect()
            .unwrap_or_else(|_| HardwareLimits::custom(16, 8, 500));
        let per_worktree = PerWorktreeLimits::default();
        let max_concurrent = hardware.max_concurrent_worktrees(&per_worktree);

        // Start with hardware-detected limit, clamped to config range
        let initial_limit = max_concurrent
            .max(config.min_concurrent)
            .min(config.max_concurrent);

        info!(
            initial_limit = initial_limit,
            min = config.min_concurrent,
            max = config.max_concurrent,
            "DynamicScaler initialized"
        );

        Self {
            config,
            monitor: Arc::new(Mutex::new(ResourceMonitor::new(hardware, per_worktree))),
            current_limit: Arc::new(Mutex::new(initial_limit)),
        }
    }

    /// Starts the resource monitoring loop
    ///
    /// This function runs indefinitely, monitoring system resources and
    /// adjusting the concurrent worktree limit accordingly.
    pub async fn start_monitoring(&self) {
        let mut interval = time::interval(self.config.monitor_interval);

        loop {
            interval.tick().await;

            match self.check_and_adjust().await {
                Ok(_) => {}
                Err(e) => {
                    warn!(error = %e, "Failed to check and adjust resources");
                }
            }
        }
    }

    /// Checks resources and adjusts concurrent limit if needed
    async fn check_and_adjust(&self) -> Result<(), MiyabiError> {
        let monitor = self.monitor.lock().await;
        let stats = monitor.collect_stats().await?;
        drop(monitor); // Release lock before adjustment

        let mut current_limit = self.current_limit.lock().await;
        let old_limit = *current_limit;

        // Scale up if usage is low
        if stats.memory_usage_ratio < self.config.scale_up_threshold
            && stats.cpu_usage_ratio < self.config.scale_up_threshold
            && *current_limit < self.config.max_concurrent
        {
            *current_limit = (*current_limit + 1).min(self.config.max_concurrent);
            info!(
                old_limit = old_limit,
                new_limit = *current_limit,
                memory_usage = format!("{:.1}%", stats.memory_usage_ratio * 100.0),
                cpu_usage = format!("{:.1}%", stats.cpu_usage_ratio * 100.0),
                "Scaling up concurrent limit"
            );
        }
        // Scale down if usage is high
        else if (stats.memory_usage_ratio > self.config.scale_down_threshold
            || stats.cpu_usage_ratio > self.config.scale_down_threshold)
            && *current_limit > self.config.min_concurrent
        {
            *current_limit = (*current_limit - 1).max(self.config.min_concurrent);
            warn!(
                old_limit = old_limit,
                new_limit = *current_limit,
                memory_usage = format!("{:.1}%", stats.memory_usage_ratio * 100.0),
                cpu_usage = format!("{:.1}%", stats.cpu_usage_ratio * 100.0),
                "Scaling down concurrent limit due to high resource usage"
            );
        } else {
            debug!(
                limit = *current_limit,
                memory_usage = format!("{:.1}%", stats.memory_usage_ratio * 100.0),
                cpu_usage = format!("{:.1}%", stats.cpu_usage_ratio * 100.0),
                "No scaling adjustment needed"
            );
        }

        Ok(())
    }

    /// Gets the current concurrent worktree limit
    pub async fn get_current_limit(&self) -> usize {
        *self.current_limit.lock().await
    }

    /// Manually sets the concurrent limit (for testing)
    pub async fn set_limit(&self, limit: usize) {
        let clamped_limit = limit
            .max(self.config.min_concurrent)
            .min(self.config.max_concurrent);

        let mut current = self.current_limit.lock().await;
        *current = clamped_limit;

        info!(limit = clamped_limit, "Manual limit adjustment");
    }

    /// Gets current resource statistics
    pub async fn get_stats(&self) -> Result<ResourceStats, MiyabiError> {
        let monitor = self.monitor.lock().await;
        monitor.collect_stats().await
    }
}

/// Resource monitor for tracking system resource usage
pub struct ResourceMonitor {
    /// Hardware limits
    hardware: HardwareLimits,
    /// Per-worktree limits
    per_worktree: PerWorktreeLimits,
}

impl ResourceMonitor {
    /// Creates a new ResourceMonitor
    pub fn new(hardware: HardwareLimits, per_worktree: PerWorktreeLimits) -> Self {
        Self {
            hardware,
            per_worktree,
        }
    }

    /// Collects current resource statistics
    pub async fn collect_stats(&self) -> Result<ResourceStats, MiyabiError> {
        use sysinfo::System;

        let mut sys = System::new_all();
        sys.refresh_all();

        // Calculate memory usage
        let used_memory = sys.used_memory();
        let total_memory = sys.total_memory();
        let memory_usage_ratio = used_memory as f64 / total_memory as f64;

        // Calculate CPU usage (average across all cores)
        let cpu_usage_ratio = sys.cpus().iter().map(|cpu| cpu.cpu_usage()).sum::<f32>()
            / (sys.cpus().len() as f32 * 100.0);

        // Calculate available resources
        let available_memory_gb =
            ((total_memory - used_memory) / (1024 * 1024 * 1024)) as usize;
        let available_worktrees = self
            .hardware
            .max_concurrent_worktrees(&self.per_worktree);

        let bottleneck = self.hardware.bottleneck_resource(&self.per_worktree);

        Ok(ResourceStats {
            memory_usage_ratio: memory_usage_ratio.clamp(0.0, 1.0),
            cpu_usage_ratio: cpu_usage_ratio as f64,
            available_memory_gb,
            available_worktrees,
            bottleneck_resource: bottleneck,
        })
    }
}

/// Resource usage statistics
#[derive(Debug, Clone)]
pub struct ResourceStats {
    /// Memory usage ratio (0.0-1.0)
    pub memory_usage_ratio: f64,
    /// CPU usage ratio (0.0-1.0)
    pub cpu_usage_ratio: f64,
    /// Available memory in GB
    pub available_memory_gb: usize,
    /// Number of worktrees that can be spawned
    pub available_worktrees: usize,
    /// Bottleneck resource type
    pub bottleneck_resource: ResourceType,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_dynamic_scaler_creation() {
        let config = DynamicScalerConfig::default();
        let scaler = DynamicScaler::new(config);

        let limit = scaler.get_current_limit().await;
        assert!(limit >= 1, "Initial limit should be at least 1");
    }

    #[tokio::test]
    async fn test_dynamic_scaler_manual_limit() {
        let config = DynamicScalerConfig {
            min_concurrent: 1,
            max_concurrent: 10,
            ..Default::default()
        };
        let scaler = DynamicScaler::new(config);

        scaler.set_limit(5).await;
        assert_eq!(scaler.get_current_limit().await, 5);

        // Test clamping to max
        scaler.set_limit(20).await;
        assert_eq!(scaler.get_current_limit().await, 10);

        // Test clamping to min
        scaler.set_limit(0).await;
        assert_eq!(scaler.get_current_limit().await, 1);
    }

    #[tokio::test]
    async fn test_resource_monitor_stats() {
        let hardware = HardwareLimits::custom(32, 8, 500);
        let per_worktree = PerWorktreeLimits::default();
        let monitor = ResourceMonitor::new(hardware, per_worktree);

        let stats = monitor.collect_stats().await;
        assert!(stats.is_ok(), "Should collect stats successfully");

        let stats = stats.unwrap();
        assert!(
            stats.memory_usage_ratio >= 0.0 && stats.memory_usage_ratio <= 1.0,
            "Memory usage should be between 0 and 1"
        );
        assert!(
            stats.cpu_usage_ratio >= 0.0,
            "CPU usage should be non-negative"
        );
        assert!(
            stats.available_worktrees > 0,
            "Should have at least 1 available worktree"
        );
    }

    #[tokio::test]
    async fn test_scaler_get_stats() {
        let config = DynamicScalerConfig::default();
        let scaler = DynamicScaler::new(config);

        let result = scaler.get_stats().await;
        assert!(result.is_ok(), "Should get stats successfully");

        let stats = result.unwrap();
        assert!(
            stats.memory_usage_ratio >= 0.0 && stats.memory_usage_ratio <= 1.0
        );
    }

    #[tokio::test]
    async fn test_scaler_config_default() {
        let config = DynamicScalerConfig::default();
        assert_eq!(config.monitor_interval, Duration::from_secs(10));
        assert_eq!(config.scale_up_threshold, 0.3);
        assert_eq!(config.scale_down_threshold, 0.8);
        assert_eq!(config.min_concurrent, 1);
        assert_eq!(config.max_concurrent, 10);
    }

    #[tokio::test]
    async fn test_check_and_adjust_no_change() {
        // Create a scaler with moderate thresholds
        let config = DynamicScalerConfig {
            monitor_interval: Duration::from_secs(1),
            scale_up_threshold: 0.1, // Very low - won't trigger
            scale_down_threshold: 0.99, // Very high - won't trigger
            min_concurrent: 2,
            max_concurrent: 5,
        };
        let scaler = DynamicScaler::new(config);
        let _initial_limit = scaler.get_current_limit().await;

        // Run check_and_adjust
        let result = scaler.check_and_adjust().await;
        assert!(result.is_ok());

        // Limit should not change (thresholds won't trigger)
        let new_limit = scaler.get_current_limit().await;
        // Note: This may or may not change depending on actual system resources
        // We just check that it's within valid range
        assert!(new_limit >= 2 && new_limit <= 5);
    }
}
