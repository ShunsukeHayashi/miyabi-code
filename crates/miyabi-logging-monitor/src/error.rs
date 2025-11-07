//! Error types for logging and monitoring

use thiserror::Error;

/// Result type alias for logging monitor operations
pub type Result<T> = std::result::Result<T, LogMonitorError>;

/// Errors that can occur in logging and monitoring operations
#[derive(Debug, Error)]
pub enum LogMonitorError {
    /// Logger initialization failed
    #[error("Logger initialization failed: {0}")]
    InitializationFailed(String),

    /// Metric recording failed
    #[error("Metric recording failed: {0}")]
    MetricRecordingFailed(String),

    /// SLA violation detected
    #[error("SLA violation detected: {0}")]
    SlaViolation(String),

    /// Log export failed
    #[error("Log export failed: {0}")]
    ExportFailed(String),

    /// Invalid configuration
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// Serialization error
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = LogMonitorError::InitializationFailed("test error".to_string());
        assert!(err.to_string().contains("Logger initialization failed"));
        assert!(err.to_string().contains("test error"));
    }

    #[test]
    fn test_metric_recording_error() {
        let err = LogMonitorError::MetricRecordingFailed("invalid metric".to_string());
        assert!(err.to_string().contains("Metric recording failed"));
    }

    #[test]
    fn test_sla_violation() {
        let err = LogMonitorError::SlaViolation("latency > 5s".to_string());
        assert!(err.to_string().contains("SLA violation"));
    }

    #[test]
    fn test_export_failed() {
        let err = LogMonitorError::ExportFailed("network error".to_string());
        assert!(err.to_string().contains("Log export failed"));
    }

    #[test]
    fn test_invalid_config() {
        let err = LogMonitorError::InvalidConfig("missing field".to_string());
        assert!(err.to_string().contains("Invalid configuration"));
    }
}
