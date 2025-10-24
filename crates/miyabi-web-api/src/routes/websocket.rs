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
}

/// WebSocket handler
///
/// Upgrades HTTP connection to WebSocket
/// Supports real-time log streaming for agent executions
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WebSocketQuery>,
    State(state): State<AppState>,
) -> Response {
    // TODO: Implement WebSocket authentication
    // For MVP, we'll accept connections without auth
    let user_id = Uuid::new_v4(); // Placeholder

    ws.on_upgrade(move |socket| async move {
        tracing::info!(
            "WebSocket connection established for user {}, execution_id: {:?}",
            user_id,
            query.execution_id
        );

        if let Some(execution_id) = query.execution_id {
            handle_execution_logs(socket, state, execution_id).await;
        } else {
            // General WebSocket connection
            state.ws_manager.handle_connection(socket, user_id).await;
        }
    })
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
            let _ = tx.send(Message::Text(log_json));

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
                        if tx_clone.send(Message::Text(log_json)).is_err() {
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
                    let _ = tx_clone.send(Message::Text(completion.to_string()));
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
