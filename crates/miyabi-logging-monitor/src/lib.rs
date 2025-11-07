//! Logging and monitoring system for Miyabi video generation pipeline
//!
//! This crate provides comprehensive logging and monitoring capabilities including:
//! - Structured logging with tracing
//! - Metrics collection (counters, gauges, timers)
//! - SLA monitoring and violation tracking
//! - Export functionality for metrics and violations

pub mod error;
pub mod logger;
pub mod metrics;
pub mod sla;

pub use error::{LogMonitorError, Result};
pub use logger::{init_logger, LoggerConfig};
pub use metrics::{Metric, MetricType, MetricValue, MetricsCollector};
pub use sla::{SlaMonitor, SlaThreshold, SlaViolation};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_exports() {
        // Verify that all public types are accessible
        let _config = LoggerConfig::default();
        let _collector = MetricsCollector::new();
        let _monitor = SlaMonitor::new();
    }
}
