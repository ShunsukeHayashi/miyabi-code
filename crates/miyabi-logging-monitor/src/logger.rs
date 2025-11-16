//! Structured logging configuration

use crate::{LogMonitorError, Result};
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

/// Logger configuration
#[derive(Debug, Clone)]
pub struct LoggerConfig {
    /// Log level (default: "info")
    pub level: String,
    /// Enable JSON format
    pub json_format: bool,
    /// Log file path (optional)
    pub file_path: Option<String>,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        Self {
            level: "info".to_string(),
            json_format: false,
            file_path: None,
        }
    }
}

impl LoggerConfig {
    /// Create a new logger configuration
    pub fn new() -> Self {
        Self::default()
    }

    /// Set log level
    pub fn with_level(mut self, level: String) -> Self {
        self.level = level;
        self
    }

    /// Enable JSON format
    pub fn with_json_format(mut self) -> Self {
        self.json_format = true;
        self
    }

    /// Set log file path
    pub fn with_file(mut self, path: String) -> Self {
        self.file_path = Some(path);
        self
    }
}

/// Initialize the global tracing subscriber
pub fn init_logger(config: LoggerConfig) -> Result<()> {
    let env_filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(&config.level));

    if config.json_format {
        tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt::layer().json())
            .try_init()
            .map_err(|e| LogMonitorError::InitializationFailed(e.to_string()))?;
    } else {
        tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt::layer())
            .try_init()
            .map_err(|e| LogMonitorError::InitializationFailed(e.to_string()))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logger_config_default() {
        let config = LoggerConfig::default();
        assert_eq!(config.level, "info");
        assert!(!config.json_format);
        assert!(config.file_path.is_none());
    }

    #[test]
    fn test_logger_config_with_level() {
        let config = LoggerConfig::new().with_level("debug".to_string());
        assert_eq!(config.level, "debug");
    }

    #[test]
    fn test_logger_config_with_json_format() {
        let config = LoggerConfig::new().with_json_format();
        assert!(config.json_format);
    }

    #[test]
    fn test_logger_config_with_file() {
        let config = LoggerConfig::new().with_file("/tmp/test.log".to_string());
        assert_eq!(config.file_path, Some("/tmp/test.log".to_string()));
    }

    #[test]
    fn test_logger_config_builder_chain() {
        let config = LoggerConfig::new()
            .with_level("trace".to_string())
            .with_json_format()
            .with_file("/tmp/test.log".to_string());

        assert_eq!(config.level, "trace");
        assert!(config.json_format);
        assert_eq!(config.file_path, Some("/tmp/test.log".to_string()));
    }
}
