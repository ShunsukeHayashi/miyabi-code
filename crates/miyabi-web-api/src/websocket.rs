//! WebSocket connection management

use axum::extract::ws::{Message, WebSocket};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// WebSocket connection manager
pub struct WebSocketManager {
    connections: Arc<RwLock<std::collections::HashMap<Uuid, tokio::sync::mpsc::UnboundedSender<Message>>>>,
}

impl WebSocketManager {
    /// Creates a new WebSocket manager
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Handles a new WebSocket connection
    ///
    /// # Arguments
    ///
    /// * `socket` - WebSocket connection
    /// * `user_id` - User ID
    pub async fn handle_connection(&self, socket: WebSocket, user_id: Uuid) {
        let (mut sender, mut receiver) = socket.split();
        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

        // Store connection
        self.connections.write().await.insert(user_id, tx);

        // Spawn task to forward messages from channel to WebSocket
        let connections = self.connections.clone();
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if sender.send(msg).await.is_err() {
                    break;
                }
            }
            // Remove connection when done
            connections.write().await.remove(&user_id);
        });

        // Handle incoming messages
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Text(text) => {
                    tracing::debug!("Received text message from {}: {}", user_id, text);
                    // Handle text message
                }
                Message::Binary(_) => {
                    tracing::debug!("Received binary message from {}", user_id);
                    // Handle binary message
                }
                Message::Ping(ping) => {
                    tracing::debug!("Received ping from {}", user_id);
                    // Respond with pong
                    if let Some(tx) = self.connections.read().await.get(&user_id) {
                        let _ = tx.send(Message::Pong(ping));
                    }
                }
                Message::Pong(_) => {
                    tracing::debug!("Received pong from {}", user_id);
                }
                Message::Close(_) => {
                    tracing::info!("WebSocket connection closed for user {}", user_id);
                    break;
                }
            }
        }
    }

    /// Sends a message to a specific user
    ///
    /// # Arguments
    ///
    /// * `user_id` - User ID
    /// * `message` - Message to send
    pub async fn send_to_user(&self, user_id: Uuid, message: Message) -> bool {
        if let Some(tx) = self.connections.read().await.get(&user_id) {
            tx.send(message).is_ok()
        } else {
            false
        }
    }

    /// Broadcasts a message to all connected users
    ///
    /// # Arguments
    ///
    /// * `message` - Message to broadcast
    pub async fn broadcast(&self, message: Message) {
        let connections = self.connections.read().await;
        for tx in connections.values() {
            let _ = tx.send(message.clone());
        }
    }

    /// Gets the count of active connections
    pub async fn connection_count(&self) -> usize {
        self.connections.read().await.len()
    }
}

impl Default for WebSocketManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_websocket_manager_creation() {
        let manager = WebSocketManager::new();
        assert_eq!(manager.connection_count().await, 0);
    }

    #[tokio::test]
    async fn test_connection_count() {
        let manager = WebSocketManager::new();
        let (tx, _rx) = tokio::sync::mpsc::unbounded_channel();

        manager.connections.write().await.insert(Uuid::new_v4(), tx);
        assert_eq!(manager.connection_count().await, 1);
    }
}
