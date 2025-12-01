//! WebSocket support for real-time dashboard updates

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde_json;
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::time::{interval, Duration};
use tracing::{debug, error, info};

use super::real_data::{fetch_real_agents, fetch_real_system_status};
use super::server::AppState;

/// Dashboard update message
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum DashboardUpdate {
    Agents { agents: Vec<super::routes::Agent> },
    SystemStatus { status: super::routes::SystemStatus },
    Error { error: ErrorInfo },
    TaskRetry { event: TaskRetryEvent },
    TaskCancel { event: TaskCancelEvent },
    Ping,
}

/// Task retry event
#[derive(Debug, Clone, serde::Serialize)]
pub struct TaskRetryEvent {
    /// Task ID being retried
    pub task_id: String,
    /// Current retry attempt number (after increment)
    pub retry_count: u32,
    /// Reason for retry (if provided)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    /// Next retry timestamp (exponential backoff)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_retry_at: Option<chrono::DateTime<chrono::Utc>>,
    /// Timestamp when retry was triggered
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Task cancel event
#[derive(Debug, Clone, serde::Serialize)]
pub struct TaskCancelEvent {
    /// Task ID being cancelled
    pub task_id: String,
    /// Reason for cancellation
    pub reason: String,
    /// Timestamp when cancellation was triggered
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Error information for WebSocket broadcasting
#[derive(Debug, Clone, serde::Serialize)]
pub struct ErrorInfo {
    /// Unique error ID
    pub id: String,
    /// Associated task ID (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    /// Associated agent ID (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_id: Option<String>,
    /// Associated agent name (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    /// Error message
    pub message: String,
    /// Stack trace (if available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stack_trace: Option<String>,
    /// Timestamp when error occurred
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Error severity level
    pub severity: ErrorSeverity,
    /// Whether this error can be retried
    pub is_retryable: bool,
}

/// Error severity levels
#[derive(Debug, Clone, Copy, serde::Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ErrorSeverity {
    /// Critical error - system failure
    Critical,
    /// High severity - major functionality broken
    High,
    /// Medium severity - some functionality impaired
    Medium,
    /// Low severity - minor issue
    Low,
}

/// Shared state for WebSocket broadcasting
#[derive(Clone)]
pub struct WsState {
    /// Tx
    pub tx: broadcast::Sender<DashboardUpdate>,
}

impl Default for WsState {
    fn default() -> Self {
        Self::new()
    }
}

impl WsState {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self { tx }
    }
}

/// WebSocket upgrade handler
pub async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state.ws_state))
}

/// Handle WebSocket connection
async fn handle_socket(socket: WebSocket, state: Arc<WsState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    info!("WebSocket client connected");

    // Send initial data with timeout
    let send_result = tokio::time::timeout(Duration::from_secs(5), send_initial_data(&mut sender)).await;

    match send_result {
        Ok(Ok(())) => {
            debug!("Initial data sent successfully");
        }
        Ok(Err(e)) => {
            error!("Failed to send initial data: {}", e);
            // Don't return - continue with broadcast updates
        }
        Err(_) => {
            error!("Timeout while sending initial data");
            // Don't return - continue with broadcast updates
        }
    }

    // Spawn task to listen for broadcasts
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let json = match serde_json::to_string(&msg) {
                Ok(json) => json,
                Err(e) => {
                    error!("Failed to serialize message: {}", e);
                    continue;
                }
            };

            if sender.send(Message::Text(json.into())).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages (for ping/pong)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    debug!("Received text message: {}", text);
                }
                Message::Close(_) => {
                    info!("WebSocket client disconnected");
                    break;
                }
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => {
            recv_task.abort();
        }
        _ = (&mut recv_task) => {
            send_task.abort();
        }
    }

    info!("WebSocket connection closed");
}

/// Send initial data to newly connected client
async fn send_initial_data<S>(sender: &mut S) -> Result<(), axum::Error>
where
    S: SinkExt<Message> + Unpin,
    S::Error: std::error::Error + Send + Sync + 'static,
{
    // Send agents data with timeout
    let agents_future = tokio::time::timeout(Duration::from_secs(3), fetch_real_agents());

    match agents_future.await {
        Ok(Ok(agents)) => {
            info!("📊 Sending {} agents data", agents.len());
            if !agents.is_empty() {
                info!("📊 First agent: {:?}", agents[0]);
                let task_counts: Vec<_> = agents.iter().map(|a| format!("{}:{}", a.name, a.tasks)).collect();
                info!("📊 Agent task counts: {}", task_counts.join(", "));
            }
            let msg = DashboardUpdate::Agents { agents };
            let json = serde_json::to_string(&msg).unwrap();
            // Safely truncate at character boundary
            let truncated = json.chars().take(200).collect::<String>();
            info!("📤 WebSocket sending JSON (first 200 chars): {}...", truncated);
            if let Err(e) = sender.send(Message::Text(json.into())).await {
                debug!("Failed to send agents data (client may have disconnected): {}", e);
                return Err(axum::Error::new(e));
            }
        }
        Ok(Err(e)) => {
            error!("Failed to fetch agents: {}", e);
            // Continue to send other data
        }
        Err(_) => {
            error!("Timeout fetching agents");
            // Continue to send other data
        }
    }

    // Send system status with timeout
    let status_future = tokio::time::timeout(Duration::from_secs(3), fetch_real_system_status());

    match status_future.await {
        Ok(Ok(status)) => {
            let msg = DashboardUpdate::SystemStatus { status };
            let json = serde_json::to_string(&msg).unwrap();
            if let Err(e) = sender.send(Message::Text(json.into())).await {
                debug!("Failed to send system status (client may have disconnected): {}", e);
                return Err(axum::Error::new(e));
            }
        }
        Ok(Err(e)) => {
            error!("Failed to fetch system status: {}", e);
            // Continue anyway
        }
        Err(_) => {
            error!("Timeout fetching system status");
            // Continue anyway
        }
    }

    Ok(())
}

/// Background task to periodically fetch data and broadcast updates
pub async fn broadcast_updates(state: Arc<WsState>) {
    let mut interval = interval(Duration::from_secs(10));

    loop {
        interval.tick().await;

        // Fetch and broadcast agents
        match fetch_real_agents().await {
            Ok(agents) => {
                let msg = DashboardUpdate::Agents { agents };
                let _ = state.tx.send(msg);
            }
            Err(e) => {
                error!("Failed to fetch agents for broadcast: {}", e);
            }
        }

        // Fetch and broadcast system status
        match fetch_real_system_status().await {
            Ok(status) => {
                let msg = DashboardUpdate::SystemStatus { status };
                let _ = state.tx.send(msg);
            }
            Err(e) => {
                error!("Failed to fetch system status for broadcast: {}", e);
            }
        }
    }
}
