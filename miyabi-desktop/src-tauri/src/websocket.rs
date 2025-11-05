//! WebSocket server for real-time event broadcasting to external clients
//!
//! Provides a WebSocket server that broadcasts Miyabi events to web clients
//! (e.g., Miyabi Dashboard running on Next.js).

use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{accept_async, tungstenite::Message};

type ClientId = usize;
type Tx = mpsc::UnboundedSender<Message>;

/// WebSocket client connection
struct WebSocketClient {
    id: ClientId,
    tx: Tx,
}

/// WebSocket server for broadcasting events
pub struct WebSocketServer {
    clients: Arc<Mutex<HashMap<ClientId, Tx>>>,
    next_client_id: Arc<Mutex<ClientId>>,
}

impl WebSocketServer {
    /// Create a new WebSocket server
    pub fn new() -> Self {
        Self {
            clients: Arc::new(Mutex::new(HashMap::new())),
            next_client_id: Arc::new(Mutex::new(0)),
        }
    }

    /// Start the WebSocket server on the specified port
    pub async fn start(self: Arc<Self>, port: u16) -> Result<(), String> {
        let addr = format!("127.0.0.1:{}", port);
        let listener = TcpListener::bind(&addr)
            .await
            .map_err(|e| format!("Failed to bind WebSocket server to {}: {}", addr, e))?;

        println!("🌐 WebSocket server listening on ws://{}", addr);

        tokio::spawn(async move {
            while let Ok((stream, addr)) = listener.accept().await {
                println!("📥 New WebSocket connection from: {}", addr);
                let server = self.clone();
                tokio::spawn(async move {
                    if let Err(e) = server.handle_connection(stream).await {
                        eprintln!("❌ WebSocket connection error: {}", e);
                    }
                });
            }
        });

        Ok(())
    }

    /// Handle a new WebSocket connection
    async fn handle_connection(&self, stream: TcpStream) -> Result<(), String> {
        let ws_stream = accept_async(stream)
            .await
            .map_err(|e| format!("Failed to accept WebSocket connection: {}", e))?;

        let (mut ws_sender, mut ws_receiver) = ws_stream.split();

        // Create channel for sending messages to this client
        let (tx, mut rx) = mpsc::unbounded_channel::<Message>();

        // Get unique client ID
        let client_id = {
            let mut next_id = self.next_client_id.lock().await;
            let id = *next_id;
            *next_id += 1;
            id
        };

        // Register client
        {
            let mut clients = self.clients.lock().await;
            clients.insert(client_id, tx);
            println!(
                "✅ Client {} registered. Total clients: {}",
                client_id,
                clients.len()
            );
        }

        // Send welcome message
        let welcome = serde_json::json!({
            "type": "welcome",
            "data": {
                "client_id": client_id,
                "message": "Connected to Miyabi WebSocket Server"
            }
        });
        if let Ok(msg) = serde_json::to_string(&welcome) {
            let _ = ws_sender.send(Message::Text(msg)).await;
        }

        // Spawn task to send messages from channel to WebSocket
        let send_task = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                if ws_sender.send(msg).await.is_err() {
                    break;
                }
            }
        });

        // Handle incoming messages (ping/pong, close)
        while let Some(msg) = ws_receiver.next().await {
            match msg {
                Ok(Message::Ping(data)) => {
                    // Respond to ping with pong
                    // (handled automatically by tokio-tungstenite)
                    println!("📡 Ping from client {}", client_id);
                }
                Ok(Message::Close(_)) => {
                    println!("👋 Client {} disconnected", client_id);
                    break;
                }
                Err(e) => {
                    eprintln!("❌ WebSocket error from client {}: {}", client_id, e);
                    break;
                }
                _ => {}
            }
        }

        // Cleanup: remove client
        {
            let mut clients = self.clients.lock().await;
            clients.remove(&client_id);
            println!(
                "🗑️  Client {} removed. Remaining clients: {}",
                client_id,
                clients.len()
            );
        }

        send_task.abort();
        Ok(())
    }

    /// Broadcast a message to all connected clients
    pub async fn broadcast<T: Serialize>(&self, event_type: &str, data: T) -> Result<(), String> {
        let payload = serde_json::json!({
            "type": event_type,
            "data": data,
            "timestamp": chrono::Utc::now().to_rfc3339()
        });

        let message = serde_json::to_string(&payload)
            .map_err(|e| format!("Failed to serialize broadcast message: {}", e))?;

        let clients = self.clients.lock().await;
        let client_count = clients.len();

        if client_count > 0 {
            println!(
                "📤 Broadcasting '{}' to {} clients",
                event_type, client_count
            );

            for (client_id, tx) in clients.iter() {
                if let Err(e) = tx.send(Message::Text(message.clone())) {
                    eprintln!("⚠️  Failed to send to client {}: {}", client_id, e);
                }
            }
        }

        Ok(())
    }

    /// Get the number of connected clients
    pub async fn client_count(&self) -> usize {
        let clients = self.clients.lock().await;
        clients.len()
    }
}

impl Default for WebSocketServer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_websocket_server_creation() {
        let server = WebSocketServer::new();
        assert_eq!(server.client_count().await, 0);
    }

    #[tokio::test]
    async fn test_broadcast_with_no_clients() {
        let server = WebSocketServer::new();
        let result = server
            .broadcast("test:event", serde_json::json!({"foo": "bar"}))
            .await;
        assert!(result.is_ok());
    }
}
