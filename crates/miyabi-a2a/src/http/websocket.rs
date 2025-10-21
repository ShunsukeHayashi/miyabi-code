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

/// Dashboard update message
#[derive(Debug, Clone, serde::Serialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum DashboardUpdate {
    Agents { agents: Vec<super::routes::Agent> },
    SystemStatus { status: super::routes::SystemStatus },
    Ping,
}

/// Shared state for WebSocket broadcasting
#[derive(Clone)]
pub struct WsState {
    pub tx: broadcast::Sender<DashboardUpdate>,
}

impl WsState {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self { tx }
    }
}

/// WebSocket upgrade handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<WsState>>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

/// Handle WebSocket connection
async fn handle_socket(socket: WebSocket, state: Arc<WsState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    info!("WebSocket client connected");

    // Send initial data with timeout
    let send_result = tokio::time::timeout(
        Duration::from_secs(5),
        send_initial_data(&mut sender)
    ).await;

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

            if sender.send(Message::Text(json)).await.is_err() {
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
    let agents_future = tokio::time::timeout(
        Duration::from_secs(3),
        fetch_real_agents()
    );

    match agents_future.await {
        Ok(Ok(agents)) => {
            let msg = DashboardUpdate::Agents { agents };
            let json = serde_json::to_string(&msg).unwrap();
            if let Err(e) = sender.send(Message::Text(json)).await {
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
    let status_future = tokio::time::timeout(
        Duration::from_secs(3),
        fetch_real_system_status()
    );

    match status_future.await {
        Ok(Ok(status)) => {
            let msg = DashboardUpdate::SystemStatus { status };
            let json = serde_json::to_string(&msg).unwrap();
            if let Err(e) = sender.send(Message::Text(json)).await {
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
