//! Miyabi Web API - Backend REST API Server
//!
//! Autonomous AI Agent Orchestration Platform - Web API
//!
//! ## Architecture
//!
//! - **Framework**: Axum 0.7
//! - **Database**: PostgreSQL 15 with SQLx
//! - **Authentication**: JWT + GitHub OAuth 2.0
//! - **WebSocket**: Real-time updates with tokio-tungstenite
//! - **Documentation**: OpenAPI 3.1 with Swagger UI
//!
//! ## Modules
//!
//! - `auth` - Authentication and authorization
//! - `config` - Configuration management
//! - `database` - Database connection pool and migrations
//! - `error` - Error types and handling
//! - `models` - Database models and DTOs
//! - `routes` - API endpoint handlers
//! - `websocket` - WebSocket connection management

pub mod auth;
pub mod config;
pub mod database;
pub mod error;
pub mod events;
pub mod middleware;
pub mod models;
pub mod routes;
pub mod services;
pub mod websocket;

use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

pub use config::AppConfig;
pub use error::{AppError, Result};

/// OpenAPI documentation
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Miyabi Web API",
        version = "1.0.0",
        description = "Autonomous AI Agent Orchestration Platform API",
        license(name = "MIT")
    ),
    paths(
        routes::health::health_check,
        routes::auth::github_oauth_initiate,
        routes::auth::github_oauth_callback,
        routes::auth::refresh_token,
        routes::auth::logout,
        routes::auth::mock_login,
        routes::repositories::list_repositories,
        routes::repositories::get_repository,
        routes::repositories::create_repository,
        routes::agents::list_agents,
        routes::agents::execute_agent,
        routes::agents::list_executions,
        routes::agents::get_execution,
        routes::workflows::create_workflow,
        routes::workflows::list_workflows,
        routes::workflows::get_workflow,
        routes::dashboard::get_dashboard_summary,
        routes::dashboard::get_recent_executions,
        routes::issues::list_repository_issues,
        routes::issues::get_repository_issue,
    ),
    components(
        schemas(
            models::User,
            models::Repository,
            models::AgentExecution,
            models::Workflow,
            models::AgentType,
            models::ExecutionStatus,
            routes::agents::AgentMetadata,
            routes::agents::AgentCategory,
            routes::dashboard::DashboardSummary,
            routes::dashboard::RecentExecution,
            routes::issues::IssueWithRepository,
        )
    ),
    tags(
        (name = "auth", description = "Authentication endpoints"),
        (name = "repositories", description = "Repository management"),
        (name = "agents", description = "Agent execution"),
        (name = "workflows", description = "Workflow management"),
        (name = "dashboard", description = "Dashboard statistics"),
        (name = "issues", description = "GitHub issues"),
        (name = "health", description = "Health check"),
    )
)]
struct ApiDoc;

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    /// Database connection pool
    pub db: sqlx::PgPool,
    /// Application configuration
    pub config: Arc<AppConfig>,
    /// JWT secret for token signing
    pub jwt_secret: String,
    /// WebSocket manager
    pub ws_manager: Arc<websocket::WebSocketManager>,
    /// Event broadcaster for real-time updates
    pub event_broadcaster: events::EventBroadcaster,
}

/// Creates the Axum application with all routes and middleware
///
/// # Arguments
///
/// * `config` - Application configuration
///
/// # Returns
///
/// Configured Axum Router
///
/// # Errors
///
/// Returns error if:
/// - Database connection fails
/// - Configuration is invalid
pub async fn create_app(config: AppConfig) -> Result<Router> {
    // Create database connection pool
    let db = database::create_pool(&config.database_url).await?;

    // Run migrations
    database::run_migrations(&db).await?;

    // Create WebSocket manager
    let ws_manager = Arc::new(websocket::WebSocketManager::new());

    // Create event broadcaster
    let event_broadcaster = events::EventBroadcaster::new();

    // Create shared state
    let state = AppState {
        db,
        config: Arc::new(config.clone()),
        jwt_secret: config.jwt_secret.clone(),
        ws_manager,
        event_broadcaster,
    };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build API routes
    let api_routes = Router::new()
        // Health check
        .route("/health", get(routes::health::health_check))
        // Authentication routes
        .route("/auth/github", get(routes::auth::github_oauth_initiate))
        .route(
            "/auth/github/callback",
            get(routes::auth::github_oauth_callback),
        )
        .route("/auth/refresh", post(routes::auth::refresh_token))
        .route("/auth/logout", post(routes::auth::logout))
        .route("/auth/mock", post(routes::auth::mock_login))
        // Repository routes
        .route(
            "/repositories",
            get(routes::repositories::list_repositories),
        )
        .route(
            "/repositories/:id",
            get(routes::repositories::get_repository),
        )
        .route(
            "/repositories",
            post(routes::repositories::create_repository),
        )
        // Agent execution routes
        .route("/agents", get(routes::agents::list_agents))
        .route("/agents/execute", post(routes::agents::execute_agent))
        .route("/agents/executions", get(routes::agents::list_executions))
        .route("/agents/executions/:id", get(routes::agents::get_execution))
        .route("/agents/executions/:id/logs", get(routes::agents::get_execution_logs))
        // Workflow routes
        .route("/workflows", post(routes::workflows::create_workflow))
        .route("/workflows", get(routes::workflows::list_workflows))
        .route("/workflows/:id", get(routes::workflows::get_workflow))
        // Dashboard routes
        .route("/dashboard/summary", get(routes::dashboard::get_dashboard_summary))
        .route("/dashboard/recent", get(routes::dashboard::get_recent_executions))
        // Issues routes
        .route(
            "/repositories/:repository_id/issues",
            get(routes::issues::list_repository_issues),
        )
        .route(
            "/repositories/:repository_id/issues/:issue_number",
            get(routes::issues::get_repository_issue),
        )
        // WebSocket endpoint
        .route("/ws", get(routes::websocket::websocket_handler));

    // Build main router
    let app = Router::new()
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .nest("/api/v1", api_routes)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(cors),
        )
        .with_state(state);

    Ok(app)
}

/// Runs the HTTP server
///
/// # Arguments
///
/// * `config` - Application configuration
///
/// # Errors
///
/// Returns error if:
/// - Server fails to bind to address
/// - Application creation fails
pub async fn run_server(config: AppConfig) -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    // Create application
    let app = create_app(config.clone()).await?;

    // Parse server address
    let addr: std::net::SocketAddr = config
        .server_address
        .parse()
        .map_err(|e| AppError::Configuration(format!("Invalid server address: {}", e)))?;

    tracing::info!("Starting Miyabi Web API server on {}", addr);
    tracing::info!("Swagger UI available at http://{}/swagger-ui", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| AppError::Server(format!("Failed to bind to {}: {}", addr, e)))?;

    axum::serve(listener, app)
        .await
        .map_err(|e| AppError::Server(format!("Server error: {}", e)))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_doc_generation() {
        // Test that OpenAPI doc can be generated
        let doc = ApiDoc::openapi();
        assert_eq!(doc.info.title, "Miyabi Web API");
        assert_eq!(doc.info.version, "1.0.0");
    }
}
