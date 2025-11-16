//! Logging utilities for Miyabi
//!
//! Provides structured logging with multiple output formats and destinations

use once_cell::sync::OnceCell;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, prelude::*, EnvFilter};

/// Global logger guard to prevent memory leaks
///
/// The WorkerGuard must live for the entire program lifetime to ensure
/// all log messages are flushed to disk. Using OnceCell ensures proper
/// lifetime management without requiring `mem::forget`.
static LOGGER_GUARD: OnceCell<WorkerGuard> = OnceCell::new();

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogFormat {
    /// Human-readable colored output
    Pretty,
    /// Compact format for CI/CD
    Compact,
    /// JSON format for structured parsing
    Json,
}

/// Logger configuration
#[derive(Debug, Clone)]
pub struct LoggerConfig {
    /// Log level
    pub level: LogLevel,
    /// Log format
    pub format: LogFormat,
    /// Optional file output directory
    pub file_directory: Option<String>,
    /// File rotation (daily by default)
    pub rotation: Rotation,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        Self {
            level: LogLevel::Info,
            format: LogFormat::Pretty,
            file_directory: None,
            rotation: Rotation::DAILY,
        }
    }
}

impl From<&str> for LogLevel {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "trace" => LogLevel::Trace,
            "debug" => LogLevel::Debug,
            "info" => LogLevel::Info,
            "warn" => LogLevel::Warn,
            "error" => LogLevel::Error,
            _ => LogLevel::Info,
        }
    }
}

impl From<LogLevel> for &'static str {
    fn from(level: LogLevel) -> Self {
        match level {
            LogLevel::Trace => "trace",
            LogLevel::Debug => "debug",
            LogLevel::Info => "info",
            LogLevel::Warn => "warn",
            LogLevel::Error => "error",
        }
    }
}

impl From<&str> for LogFormat {
    fn from(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "json" => LogFormat::Json,
            "compact" => LogFormat::Compact,
            _ => LogFormat::Pretty,
        }
    }
}

/// Initialize logging with default configuration
pub fn init_logger(level: LogLevel) {
    let config = LoggerConfig {
        level,
        ..Default::default()
    };
    init_logger_with_config(config);
}

/// Initialize logging with custom configuration
pub fn init_logger_with_config(config: LoggerConfig) {
    let level_str: &'static str = config.level.into();
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(level_str));

    let subscriber = tracing_subscriber::registry().with(filter);

    match (&config.format, &config.file_directory) {
        // Console only - Pretty format
        (LogFormat::Pretty, None) => {
            let fmt_layer = fmt::layer()
                .pretty()
                .with_target(true)
                .with_thread_ids(false)
                .with_line_number(true);
            subscriber.with(fmt_layer).init();
        },
        // Console only - Compact format
        (LogFormat::Compact, None) => {
            let fmt_layer = fmt::layer().compact().with_target(false).with_thread_ids(false);
            subscriber.with(fmt_layer).init();
        },
        // Console only - JSON format
        (LogFormat::Json, None) => {
            let fmt_layer = fmt::layer().json().with_current_span(true).with_span_list(true);
            subscriber.with(fmt_layer).init();
        },
        // Console + File - Pretty format
        (LogFormat::Pretty, Some(dir)) => {
            let file_appender = RollingFileAppender::new(config.rotation, dir, "miyabi.log");
            let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

            let console_layer = fmt::layer().pretty().with_target(true).with_line_number(true);

            let file_layer = fmt::layer().json().with_writer(non_blocking).with_ansi(false);

            subscriber.with(console_layer).with(file_layer).init();

            // Store guard globally to keep worker thread alive
            let _ = LOGGER_GUARD.set(guard);
        },
        // Console + File - Compact format
        (LogFormat::Compact, Some(dir)) => {
            let file_appender = RollingFileAppender::new(config.rotation, dir, "miyabi.log");
            let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

            let console_layer = fmt::layer().compact().with_target(false);

            let file_layer = fmt::layer().json().with_writer(non_blocking).with_ansi(false);

            subscriber.with(console_layer).with(file_layer).init();

            // Store guard globally to keep worker thread alive
            let _ = LOGGER_GUARD.set(guard);
        },
        // Console + File - JSON format
        (LogFormat::Json, Some(dir)) => {
            let file_appender = RollingFileAppender::new(config.rotation, dir, "miyabi.log");
            let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

            let console_layer = fmt::layer().json().with_current_span(true);

            let file_layer = fmt::layer().json().with_writer(non_blocking).with_ansi(false);

            subscriber.with(console_layer).with(file_layer).init();

            // Store guard globally to keep worker thread alive
            let _ = LOGGER_GUARD.set(guard);
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // LogLevel Tests
    // ========================================================================

    #[test]
    fn test_log_level_from_str() {
        assert_eq!(LogLevel::from("trace"), LogLevel::Trace);
        assert_eq!(LogLevel::from("debug"), LogLevel::Debug);
        assert_eq!(LogLevel::from("info"), LogLevel::Info);
        assert_eq!(LogLevel::from("warn"), LogLevel::Warn);
        assert_eq!(LogLevel::from("error"), LogLevel::Error);
        assert_eq!(LogLevel::from("invalid"), LogLevel::Info);
    }

    #[test]
    fn test_log_level_from_str_case_insensitive() {
        assert_eq!(LogLevel::from("TRACE"), LogLevel::Trace);
        assert_eq!(LogLevel::from("Debug"), LogLevel::Debug);
        assert_eq!(LogLevel::from("INFO"), LogLevel::Info);
    }

    #[test]
    fn test_log_level_to_str() {
        let level_str: &'static str = LogLevel::Trace.into();
        assert_eq!(level_str, "trace");

        let level_str: &'static str = LogLevel::Debug.into();
        assert_eq!(level_str, "debug");

        let level_str: &'static str = LogLevel::Info.into();
        assert_eq!(level_str, "info");

        let level_str: &'static str = LogLevel::Warn.into();
        assert_eq!(level_str, "warn");

        let level_str: &'static str = LogLevel::Error.into();
        assert_eq!(level_str, "error");
    }

    #[test]
    fn test_log_level_equality() {
        assert_eq!(LogLevel::Info, LogLevel::Info);
        assert_ne!(LogLevel::Info, LogLevel::Debug);
    }

    // ========================================================================
    // LogFormat Tests
    // ========================================================================

    #[test]
    fn test_log_format_from_str() {
        assert_eq!(LogFormat::from("json"), LogFormat::Json);
        assert_eq!(LogFormat::from("compact"), LogFormat::Compact);
        assert_eq!(LogFormat::from("pretty"), LogFormat::Pretty);
        assert_eq!(LogFormat::from("invalid"), LogFormat::Pretty);
    }

    #[test]
    fn test_log_format_from_str_case_insensitive() {
        assert_eq!(LogFormat::from("JSON"), LogFormat::Json);
        assert_eq!(LogFormat::from("Compact"), LogFormat::Compact);
        assert_eq!(LogFormat::from("PRETTY"), LogFormat::Pretty);
    }

    #[test]
    fn test_log_format_equality() {
        assert_eq!(LogFormat::Json, LogFormat::Json);
        assert_ne!(LogFormat::Json, LogFormat::Pretty);
    }

    // ========================================================================
    // LoggerConfig Tests
    // ========================================================================

    #[test]
    fn test_logger_config_default() {
        let config = LoggerConfig::default();
        assert_eq!(config.level, LogLevel::Info);
        assert_eq!(config.format, LogFormat::Pretty);
        assert!(config.file_directory.is_none());
    }

    #[test]
    fn test_logger_config_custom() {
        let config = LoggerConfig {
            level: LogLevel::Debug,
            format: LogFormat::Json,
            file_directory: Some("./test-logs".to_string()),
            rotation: Rotation::HOURLY,
        };

        assert_eq!(config.level, LogLevel::Debug);
        assert_eq!(config.format, LogFormat::Json);
        assert_eq!(config.file_directory, Some("./test-logs".to_string()));
    }

    // ========================================================================
    // Logger Initialization Tests
    // ========================================================================

    // Note: We can't easily test actual logger initialization in unit tests
    // because tracing::subscriber::set_global_default() can only be called once
    // per process. These would need integration tests or separate test binaries.

    #[test]
    fn test_log_level_roundtrip() {
        let levels = vec![
            LogLevel::Trace,
            LogLevel::Debug,
            LogLevel::Info,
            LogLevel::Warn,
            LogLevel::Error,
        ];

        for level in levels {
            let str_level: &'static str = level.into();
            let parsed_level = LogLevel::from(str_level);
            assert_eq!(level, parsed_level);
        }
    }
}
