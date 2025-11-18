//! Agent log streaming WebSocket endpoint
//!
//! Provides real-time log streaming from agent execution via WebSocket.
//! Integrates with existing websocket module and tmux capture-pane.

use axum::{
    extract::State,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::Arc;
use tracing::{error, info};

use crate::services::log_streamer::LogStreamingManager;
use crate::ws::{WebSocketManager, WSMessage, LogLevel};

/// Combined WebSocket state
#[derive(Clone)]
pub struct WsState {
    pub ws_manager: Arc<WebSocketManager>,
    pub log_manager: Arc<LogStreamingManager>,
}

/// Query parameters for log streaming
#[derive(Debug, Deserialize)]
pub struct LogStreamQuery {
    /// Filter by agent name (optional)
    #[serde(default)]
    pub agent: Option<String>,
    /// Filter by log level (optional)
    #[serde(default)]
    pub level: Option<String>,
}

/// Get streaming status
#[derive(Serialize)]
pub struct StreamingStatusResponse {
    pub active_streams: usize,
    pub message: String,
}

pub async fn get_streaming_status(
    State(state): State<Arc<WsState>>,
) -> axum::Json<StreamingStatusResponse> {
    let active_streams = state.log_manager.active_count().await;

    axum::Json(StreamingStatusResponse {
        active_streams,
        message: format!("{} active log streams", active_streams),
    })
}

/// Start log streaming for an execution
#[derive(Deserialize)]
pub struct StartStreamingRequest {
    pub execution_id: String,
    pub agent_name: String,
    pub pane_id: String,
}

#[derive(Serialize)]
pub struct StartStreamingResponse {
    pub success: bool,
    pub message: String,
}

pub async fn start_log_streaming(
    State(state): State<Arc<WsState>>,
    axum::Json(req): axum::Json<StartStreamingRequest>,
) -> axum::Json<StartStreamingResponse> {
    let _log_manager = state.log_manager.clone();

    // Start streaming logs from tmux pane
    tokio::spawn({
        let execution_id = req.execution_id.clone();
        let agent_name = req.agent_name.clone();
        let pane_id = req.pane_id.clone();
        let ws_manager = state.ws_manager.clone();

        async move {
            info!(
                "Starting log stream for {} (pane: {})",
                agent_name, pane_id
            );

            let mut interval = tokio::time::interval(tokio::time::Duration::from_millis(500));
            let mut last_line_count = 0;

            loop {
                interval.tick().await;

                // Capture pane logs
                match capture_pane_logs(&pane_id) {
                    Ok(lines) => {
                        // Get new lines since last capture
                        if last_line_count < lines.len() {
                            let new_lines = &lines[last_line_count..];

                            for line in new_lines {
                                // Parse log level
                                let level = parse_log_level(line);

                                // Broadcast log via WebSocket
                                let message = WSMessage::AgentLog {
                                    executionId: execution_id.clone(),
                                    level,
                                    message: line.clone(),
                                    timestamp: chrono::Utc::now().to_rfc3339(),
                                };

                                if let Err(e) = ws_manager.broadcast_message(&execution_id, &message).await {
                                    error!("Failed to broadcast log: {}", e);
                                }
                            }

                            last_line_count = lines.len();
                        }
                    }
                    Err(e) => {
                        error!("Failed to capture logs for {}: {}", agent_name, e);
                    }
                }
            }
        }
    });

    axum::Json(StartStreamingResponse {
        success: true,
        message: format!(
            "Started log streaming for {} (pane: {})",
            req.agent_name, req.pane_id
        ),
    })
}

/// Capture logs from tmux pane
fn capture_pane_logs(pane_id: &str) -> Result<Vec<String>, String> {
    let output = Command::new("tmux")
        .args(&[
            "capture-pane",
            "-p",      // Print to stdout
            "-t",      // Target pane
            pane_id,
            "-S", "-", // Start from history beginning
        ])
        .output()
        .map_err(|e| format!("Failed to execute tmux capture-pane: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("tmux capture-pane failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<String> = stdout
        .lines()
        .map(|s| s.to_string())
        .filter(|s| !s.trim().is_empty())
        .collect();

    Ok(lines)
}

/// Parse log level from log content
fn parse_log_level(log: &str) -> LogLevel {
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

/// Stop all log streaming
#[derive(Serialize)]
pub struct StopStreamingResponse {
    pub success: bool,
    pub message: String,
}

pub async fn stop_all_streaming(
    State(state): State<Arc<WsState>>,
) -> axum::Json<StopStreamingResponse> {
    state.log_manager.stop_all().await;

    axum::Json(StopStreamingResponse {
        success: true,
        message: "Stopped all log streaming".to_string(),
    })
}

/// Create router for log streaming endpoints
pub fn routes(
    ws_manager: Arc<WebSocketManager>,
    log_manager: Arc<LogStreamingManager>,
) -> Router {
    let state = Arc::new(WsState {
        ws_manager,
        log_manager,
    });

    Router::new()
        .route("/status", get(get_streaming_status))
        .route("/start", post(start_log_streaming))
        .route("/stop", post(stop_all_streaming))
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_log_level_parsing() {
        assert_eq!(parse_log_level("ERROR: Something went wrong"), LogLevel::Error);
        assert_eq!(parse_log_level("WARN: Be careful"), LogLevel::Warn);
        assert_eq!(parse_log_level("DEBUG: Detailed info"), LogLevel::Debug);
        assert_eq!(parse_log_level("INFO: All good"), LogLevel::Info);
        assert_eq!(parse_log_level("Regular message"), LogLevel::Info);
    }
}
