//! Agent Log Streaming Service
//!
//! Captures tmux pane output and streams it via WebSocket to frontend clients.
//! Supports real-time log streaming with buffering and filtering.

use crate::error::ApiError;
use crate::ws::message::{WSMessage, LogLevel};
use std::process::Command;
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::time::{interval, Duration};
use tracing::{debug, error, info, warn};

/// Log entry from tmux pane
#[derive(Debug, Clone)]
pub struct LogEntry {
    /// Agent name (e.g., "CoordinatorAgent")
    pub agent: String,
    /// Log content
    pub log: String,
    /// Log level (parsed from log content)
    pub level: LogLevel,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl LogEntry {
    /// Parse log level from log content
    fn parse_level(log: &str) -> LogLevel {
        let log_upper = log.to_uppercase();
        if log_upper.contains("ERROR") || log_upper.contains("FATAL") {
            LogLevel::Error
        } else if log_upper.contains("WARN") {
            LogLevel::Warn
        } else if log_upper.contains("DEBUG") {
            LogLevel::Debug
        } else {
            LogLevel::Info
        }
    }

    /// Create new log entry
    pub fn new(agent: String, log: String) -> Self {
        let level = Self::parse_level(&log);
        Self {
            agent,
            log,
            level,
            timestamp: chrono::Utc::now(),
        }
    }
}

/// Agent log streaming service
pub struct LogStreamer {
    /// Execution ID
    execution_id: String,
    /// Agent name
    agent_name: String,
    /// Tmux pane ID
    pane_id: String,
    /// Broadcast channel for log messages
    tx: broadcast::Sender<WSMessage>,
    /// Last captured line count (for incremental capture)
    last_line_count: Arc<tokio::sync::Mutex<usize>>,
}

impl LogStreamer {
    /// Create new log streamer
    pub fn new(
        execution_id: String,
        agent_name: String,
        pane_id: String,
        tx: broadcast::Sender<WSMessage>,
    ) -> Self {
        Self {
            execution_id,
            agent_name,
            pane_id,
            tx,
            last_line_count: Arc::new(tokio::sync::Mutex::new(0)),
        }
    }

    /// Capture logs from tmux pane
    fn capture_pane_logs(&self) -> Result<Vec<String>, ApiError> {
        // Use tmux capture-pane to get pane content
        let output = Command::new("tmux")
            .args([
                "capture-pane",
                "-p",           // Print to stdout
                "-t",           // Target pane
                &self.pane_id,
                "-S", "-",      // Start from history beginning
            ])
            .output()
            .map_err(|e| {
                ApiError::Server(format!("Failed to execute tmux capture-pane: {}", e))
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ApiError::Server(format!(
                "tmux capture-pane failed: {}",
                stderr
            )));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<String> = stdout
            .lines()
            .map(|s| s.to_string())
            .filter(|s| !s.trim().is_empty()) // Filter empty lines
            .collect();

        Ok(lines)
    }

    /// Get new log lines since last capture
    async fn get_new_logs(&self) -> Result<Vec<LogEntry>, ApiError> {
        let all_lines = self.capture_pane_logs()?;
        let mut last_count = self.last_line_count.lock().await;

        // Get only new lines
        let new_lines = if *last_count < all_lines.len() {
            all_lines[*last_count..].to_vec()
        } else {
            Vec::new()
        };

        // Update last line count
        *last_count = all_lines.len();

        // Convert to LogEntry
        let entries: Vec<LogEntry> = new_lines
            .into_iter()
            .map(|log| LogEntry::new(self.agent_name.clone(), log))
            .collect();

        Ok(entries)
    }

    /// Start streaming logs
    pub async fn start_streaming(self: Arc<Self>) {
        info!(
            "Starting log streaming for {} (pane: {})",
            self.agent_name, self.pane_id
        );

        let mut tick = interval(Duration::from_millis(500)); // Poll every 500ms

        loop {
            tick.tick().await;

            match self.get_new_logs().await {
                Ok(entries) => {
                    for entry in entries {
                        let log_preview = entry.log.chars().take(50).collect::<String>();

                        let message = WSMessage::AgentLog {
                            executionId: self.execution_id.clone(),
                            level: entry.level,
                            message: entry.log,
                            timestamp: entry.timestamp.to_rfc3339(),
                        };

                        // Broadcast log message
                        if let Err(_e) = self.tx.send(message) {
                            warn!(
                                "Failed to broadcast log for {}: no receivers",
                                self.agent_name
                            );
                            // No receivers, stop streaming
                            break;
                        }

                        debug!(
                            "Streamed log from {}: {}",
                            self.agent_name,
                            log_preview
                        );
                    }
                }
                Err(e) => {
                    error!(
                        "Failed to capture logs for {} (pane: {}): {}",
                        self.agent_name, self.pane_id, e
                    );
                    // Continue trying on error
                }
            }
        }
    }
}

/// Log streaming manager
/// Manages multiple log streamers for different agents
pub struct LogStreamingManager {
    /// Active streamers
    streamers: Arc<tokio::sync::Mutex<Vec<Arc<LogStreamer>>>>,
}

impl LogStreamingManager {
    /// Create new manager
    pub fn new() -> Self {
        Self {
            streamers: Arc::new(tokio::sync::Mutex::new(Vec::new())),
        }
    }

    /// Start streaming for an agent
    pub async fn start_agent_stream(
        &self,
        execution_id: String,
        agent_name: String,
        pane_id: String,
        tx: broadcast::Sender<WSMessage>,
    ) {
        let streamer = Arc::new(LogStreamer::new(
            execution_id,
            agent_name.clone(),
            pane_id.clone(),
            tx,
        ));

        // Add to active streamers
        {
            let mut streamers = self.streamers.lock().await;
            streamers.push(streamer.clone());
        }

        // Start streaming in background
        tokio::spawn(async move {
            streamer.start_streaming().await;
        });

        info!(
            "Started log streaming for {} (pane: {})",
            agent_name, pane_id
        );
    }

    /// Stop all streamers
    pub async fn stop_all(&self) {
        let mut streamers = self.streamers.lock().await;
        streamers.clear();
        info!("Stopped all log streamers");
    }

    /// Get active streamer count
    pub async fn active_count(&self) -> usize {
        let streamers = self.streamers.lock().await;
        streamers.len()
    }
}

impl Default for LogStreamingManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_level_parsing() {
        assert!(matches!(
            LogEntry::parse_level("ERROR: Something went wrong"),
            LogLevel::Error
        ));
        assert!(matches!(
            LogEntry::parse_level("WARN: Be careful"),
            LogLevel::Warn
        ));
        assert!(matches!(
            LogEntry::parse_level("DEBUG: Detailed info"),
            LogLevel::Debug
        ));
        assert!(matches!(
            LogEntry::parse_level("INFO: All good"),
            LogLevel::Info
        ));
    }

    #[test]
    fn test_log_entry_creation() {
        let entry = LogEntry::new(
            "TestAgent".to_string(),
            "ERROR: Test error".to_string(),
        );
        assert_eq!(entry.agent, "TestAgent");
        assert!(matches!(entry.level, LogLevel::Error));
    }

    #[tokio::test]
    async fn test_log_streaming_manager() {
        let manager = LogStreamingManager::new();
        assert_eq!(manager.active_count().await, 0);

        // Note: Full integration test requires tmux environment
    }
}
