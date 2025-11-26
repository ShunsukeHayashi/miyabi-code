//! WebSocket route handler

use crate::{services::AgentExecutor, AppState};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::Response,
};
use chrono::Utc;
use futures::{sink::SinkExt, stream::StreamExt};
use serde::Deserialize;
use std::time::Duration;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct WebSocketQuery {
    /// Optional execution ID to subscribe to logs
    pub execution_id: Option<Uuid>,
    /// Subscribe to agent events (real-time monitoring)
    #[serde(default)]
    pub events: bool,
    /// Optional JWT authentication token
    pub token: Option<String>,
}

/// WebSocket handler
///
/// Upgrades HTTP connection to WebSocket
/// Supports:
/// - Real-time log streaming for agent executions (`execution_id` param)
/// - Real-time agent event broadcasting (`events=true` param)
/// - JWT authentication via `token` query parameter
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WebSocketQuery>,
    State(state): State<AppState>,
) -> Response {
    // Validate JWT token if provided
    let user_id = if let Some(token) = &query.token {
        match state.jwt_manager.validate_token(token) {
            Ok(claims) => {
                // Parse user_id from claims.sub
                match Uuid::parse_str(&claims.sub) {
                    Ok(id) => id,
                    Err(e) => {
                        tracing::warn!("Invalid user_id in JWT claims: {}", e);
                        return axum::response::Response::builder()
                            .status(401)
                            .body("Invalid user_id in token".into())
                            .unwrap();
                    }
                }
            }
            Err(e) => {
                tracing::warn!("WebSocket authentication failed: {}", e);
                return axum::response::Response::builder()
                    .status(401)
                    .body("Authentication failed".into())
                    .unwrap();
            }
        }
    } else {
        // For development/testing, allow connections without auth
        // In production, you might want to make authentication mandatory
        tracing::debug!("WebSocket connection without authentication (dev mode)");
        Uuid::new_v4()
    };

    ws.on_upgrade(move |socket| async move {
        tracing::info!(
            "WebSocket connection established for user {}, execution_id: {:?}, events: {}",
            user_id,
            query.execution_id,
            query.events
        );

        if query.events {
            // Subscribe to agent events (for live dashboard)
            handle_agent_events(socket, state).await;
        } else if let Some(execution_id) = query.execution_id {
            // Subscribe to execution logs
            handle_execution_logs(socket, state, execution_id).await;
        } else {
            // General WebSocket connection
            state
                .ws_manager
                .handle_connection(socket, user_id.to_string())
                .await;
        }
    })
}

/// Handle agent event broadcasting
async fn handle_agent_events(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();

    // Subscribe to event broadcaster
    let mut event_rx = state.event_broadcaster.subscribe();

    // Spawn task to forward events to WebSocket
    let forward_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                // Receive agent events and forward to WebSocket
                Ok(event) = event_rx.recv() => {
                    let event_json = match serde_json::to_string(&event) {
                        Ok(json) => json,
                        Err(e) => {
                            tracing::error!("Failed to serialize event: {}", e);
                            continue;
                        }
                    };

                    if sender.send(Message::Text(event_json.into())).await.is_err() {
                        tracing::info!("WebSocket connection closed");
                        break;
                    }
                }
            }
        }
    });

    // Handle incoming messages (ping/pong, close)
    let receive_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => {
                    tracing::info!("WebSocket close message received");
                    break;
                }
                Message::Ping(ping) => {
                    // Pongs are handled automatically by axum
                    tracing::debug!("Received ping: {:?}", ping);
                }
                Message::Text(text) => {
                    tracing::debug!("Received text message: {}", text);
                    // Could handle client commands here in the future
                }
                _ => {}
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = forward_task => {
            tracing::info!("Event forwarding task completed");
        }
        _ = receive_task => {
            tracing::info!("Message receiving task completed");
        }
    }
}

/// Handle execution log streaming
async fn handle_execution_logs(socket: WebSocket, state: AppState, execution_id: Uuid) {
    let (mut sender, mut receiver) = socket.split();

    // Create channel for sending messages to WebSocket
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<Message>();

    // Send initial logs
    let executor = AgentExecutor::new(state.db.clone());
    let mut last_timestamp = Utc::now() - chrono::Duration::seconds(60);

    if let Ok(logs) = executor.get_logs(execution_id, Some(1000)).await {
        for log in &logs {
            let log_json = serde_json::to_string(&log).unwrap_or_default();
            let _ = tx.send(Message::Text(log_json.into()));

            if log.timestamp > last_timestamp {
                last_timestamp = log.timestamp;
            }
        }
    }

    // Spawn task to poll for new logs
    let db = state.db.clone();
    let tx_clone = tx.clone();
    let poll_task = tokio::spawn(async move {
        let executor = AgentExecutor::new(db);
        let mut interval = tokio::time::interval(Duration::from_millis(500));

        loop {
            interval.tick().await;

            // Get new logs since last timestamp
            match executor.get_logs_since(execution_id, last_timestamp).await {
                Ok(logs) if !logs.is_empty() => {
                    for log in &logs {
                        let log_json = serde_json::to_string(&log).unwrap_or_default();
                        if tx_clone.send(Message::Text(log_json.into())).is_err() {
                            return; // Channel closed
                        }

                        if log.timestamp > last_timestamp {
                            last_timestamp = log.timestamp;
                        }
                    }
                }
                Err(e) => {
                    tracing::error!("Error fetching logs: {}", e);
                }
                _ => {}
            }

            // Check if execution is completed
            match sqlx::query_as::<_, (String,)>(
                "SELECT status FROM agent_executions WHERE id = $1",
            )
            .bind(execution_id)
            .fetch_optional(&executor.db)
            .await
            {
                Ok(Some((status,))) if status == "completed" || status == "failed" => {
                    // Send completion message
                    let completion = serde_json::json!({
                        "type": "execution_complete",
                        "status": status
                    });
                    let _ = tx_clone.send(Message::Text(completion.to_string().into()));
                    break;
                }
                _ => {}
            }
        }
    });

    // Spawn task to forward messages from channel to WebSocket
    let forward_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(msg).await.is_err() {
                break; // Connection closed
            }
        }
    });

    // Handle incoming messages (ping/pong, close)
    let receive_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                Message::Ping(ping) => {
                    let _ = tx.send(Message::Pong(ping));
                }
                _ => {}
            }
        }
    });

    // Wait for any task to complete
    tokio::select! {
        _ = poll_task => {
            tracing::info!("Log streaming completed for execution {}", execution_id);
        }
        _ = forward_task => {
            tracing::info!("WebSocket sender closed for execution {}", execution_id);
        }
        _ = receive_task => {
            tracing::info!("WebSocket receiver closed for execution {}", execution_id);
        }
    }
}
