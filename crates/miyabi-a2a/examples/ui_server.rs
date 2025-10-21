//! Example: REST API server with live UI
//!
//! This example demonstrates how to run the A2A REST API server
//! with the live testing UI interface.
//!
//! # Usage
//!
//! ```bash
//! cargo run --example ui_server
//! ```
//!
//! Then open your browser to http://localhost:8080/
//!
//! # Features
//!
//! - REST API endpoints for A2A protocol
//! - Static file serving for web UI
//! - Agent Card discovery
//! - In-memory task storage (for demo purposes)

use miyabi_a2a::rest::{RestServer, RestServerConfig};
use miyabi_a2a::rpc::{A2ARpcHandler, TaskStorage, A2AError};
use miyabi_a2a::types::{Task, TaskStatus};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

/// In-memory task storage for demo purposes
#[derive(Clone)]
struct MemoryTaskStorage {
    tasks: Arc<RwLock<HashMap<String, Task>>>,
}

impl MemoryTaskStorage {
    fn new() -> Self {
        Self {
            tasks: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

#[async_trait::async_trait]
impl TaskStorage for MemoryTaskStorage {
    async fn create_task(&self, task: Task) -> Result<(), A2AError> {
        self.tasks.write().await.insert(task.id.clone(), task);
        Ok(())
    }

    async fn get_task(&self, task_id: &str) -> Result<Task, A2AError> {
        self.tasks
            .read()
            .await
            .get(task_id)
            .cloned()
            .ok_or_else(|| A2AError::TaskNotFound(task_id.to_string()))
    }

    async fn update_task(&self, task: Task) -> Result<(), A2AError> {
        self.tasks.write().await.insert(task.id.clone(), task);
        Ok(())
    }

    async fn list_tasks(
        &self,
        status: Option<TaskStatus>,
        context_id: Option<&str>,
        _last_updated_after: Option<chrono::DateTime<chrono::Utc>>,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<Task>, A2AError> {
        let tasks = self.tasks.read().await;
        let filtered: Vec<Task> = tasks
            .values()
            .filter(|task| {
                let status_match = status.as_ref().map_or(true, |s| &task.status == s);
                let context_match = context_id.map_or(true, |c| {
                    task.context_id.as_ref().map_or(false, |tc| tc == c)
                });
                status_match && context_match
            })
            .cloned()
            .skip(offset)
            .take(limit)
            .collect();
        Ok(filtered)
    }

    async fn count_tasks(
        &self,
        status: Option<TaskStatus>,
        context_id: Option<&str>,
        _last_updated_after: Option<chrono::DateTime<chrono::Utc>>,
    ) -> Result<usize, A2AError> {
        let tasks = self.tasks.read().await;
        let count = tasks
            .values()
            .filter(|task| {
                let status_match = status.as_ref().map_or(true, |s| &task.status == s);
                let context_match = context_id.map_or(true, |c| {
                    task.context_id.as_ref().map_or(false, |tc| tc == c)
                });
                status_match && context_match
            })
            .count();
        Ok(count)
    }
}

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    println!("🚀 Miyabi A2A REST Server with UI");
    println!("==================================");

    // Create in-memory task storage
    let storage = MemoryTaskStorage::new();

    // Create RPC handler
    let handler = A2ARpcHandler::new(storage);

    // Configure server
    let mut config = RestServerConfig::default();
    config.bind_addr = "127.0.0.1:8080".parse().unwrap();
    config.enable_cors = true;

    // Set static files directory (relative to crate root)
    config.static_dir = Some(PathBuf::from("static"));

    // Set agent cards directory
    config.agent_cards_dir = Some(PathBuf::from("agent-cards"));

    // Create and start server
    let server = RestServer::new(config, handler);

    println!("\n📱 Open your browser to: http://127.0.0.1:8080/");
    println!("\nPress Ctrl+C to stop the server\n");

    server.serve().await;
}
