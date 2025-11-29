//! miyabi-api-gateway - External Task Submission API
//!
//! Allows external clients (ChatGPT, Claude Web, etc.) to:
//! - Submit tasks to Miyabi agents
//! - Check task status
//! - Receive completion notifications

pub mod handlers;
pub mod models;
pub mod queue;
pub mod routes;

use axum::{Router, routing::{get, post}};
use std::sync::Arc;
use tokio::sync::RwLock;

pub use models::*;
pub use queue::TaskQueue;

/// Application state shared across handlers
pub struct AppState {
    pub queue: TaskQueue,
    pub config: GatewayConfig,
}

#[derive(Clone)]
pub struct GatewayConfig {
    pub api_key: String,
    pub webhook_url: Option<String>,
    pub max_concurrent_tasks: usize,
}

impl Default for GatewayConfig {
    fn default() -> Self {
        Self {
            api_key: std::env::var("MIYABI_API_KEY").unwrap_or_else(|_| "dev-key".to_string()),
            webhook_url: std::env::var("MIYABI_WEBHOOK_URL").ok(),
            max_concurrent_tasks: 10,
        }
    }
}

/// Create the API router
pub fn create_router(state: Arc<RwLock<AppState>>) -> Router {
    Router::new()
        // Task endpoints
        .route("/api/v1/tasks", post(handlers::submit_task))
        .route("/api/v1/tasks/:task_id", get(handlers::get_task_status))
        .route("/api/v1/tasks/:task_id/cancel", post(handlers::cancel_task))
        
        // Health & status
        .route("/health", get(handlers::health_check))
        .route("/api/v1/status", get(handlers::system_status))
        
        // Agent management
        .route("/api/v1/agents", get(handlers::list_agents))
        .route("/api/v1/agents/:agent_id/assign", post(handlers::assign_to_agent))
        
        .with_state(state)
}

/// Start the API gateway server
pub async fn run_server(config: GatewayConfig, port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let state = Arc::new(RwLock::new(AppState {
        queue: TaskQueue::new(config.max_concurrent_tasks),
        config: config.clone(),
    }));
    
    let app = create_router(state)
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .layer(tower_http::cors::CorsLayer::permissive());
    
    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("Starting Miyabi API Gateway on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
