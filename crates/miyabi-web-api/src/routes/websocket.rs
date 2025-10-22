//! WebSocket route handler

use crate::AppState;
use axum::{
    extract::{ws::WebSocketUpgrade, State},
    response::Response,
};
use uuid::Uuid;

/// WebSocket handler
///
/// Upgrades HTTP connection to WebSocket
pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(_state): State<AppState>,
) -> Response {
    // TODO: Implement WebSocket authentication
    // 1. Extract and validate JWT token from query params or headers
    // 2. Get user ID from token

    let user_id = Uuid::new_v4(); // Placeholder

    ws.on_upgrade(move |_socket| async move {
        // TODO: Use WebSocketManager from state to handle connection
        tracing::info!("WebSocket connection established for user {}", user_id);

        // Handle WebSocket connection
        // This is where we'd call state.ws_manager.handle_connection(socket, user_id).await
    })
}
