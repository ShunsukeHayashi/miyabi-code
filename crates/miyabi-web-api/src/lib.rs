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
pub mod ws;

use axum::{
    middleware::{from_fn, from_fn_with_state},
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
// Temporarily disabled until all routes have #[utoipa::path] attributes
// use utoipa::OpenApi;
// use utoipa_swagger_ui::SwaggerUi;

pub use config::{AppConfig, DatabasePoolConfig};
pub use error::{AppError, Result};

// OpenAPI documentation (temporarily disabled)
// #[derive(OpenApi)]
// #[openapi(
//     info(
//         title = "Miyabi Web API",
//         version = "1.0.0",
//         description = "Autonomous AI Agent Orchestration Platform API",
//         license(name = "MIT")
//     ),
//     paths(
//         routes::health::health_check,
//         routes::auth::github_oauth_initiate,
//         routes::auth::github_oauth_callback,
//         routes::auth::refresh_token,
//         routes::auth::logout,
//         routes::repositories::list_repositories,
//         routes::repositories::get_repository,
//         routes::repositories::create_repository,
//         routes::agents::list_agents,
//         routes::agents::execute_agent,
//         routes::agents::list_executions,
//         routes::agents::get_execution,
//         routes::workflows::create_workflow,
//         routes::workflows::list_workflows,
//         routes::workflows::get_workflow,
//         routes::dashboard::get_dashboard_summary,
//         routes::dashboard::get_recent_executions,
//         routes::issues::list_repository_issues,
//         routes::issues::get_repository_issue,
//     ),
//     components(
//         schemas(
//             models::User,
//             models::Repository,
//             models::AgentExecution,
//             models::Workflow,
//             models::AgentType,
//             models::ExecutionStatus,
//             routes::agents::AgentMetadata,
//             routes::agents::AgentCategory,
//             routes::dashboard::DashboardSummary,
//             routes::dashboard::RecentExecution,
//             routes::issues::IssueWithRepository,
//         )
//     ),
//     tags(
//         (name = "auth", description = "Authentication endpoints"),
//         (name = "repositories", description = "Repository management"),
//         (name = "agents", description = "Agent execution"),
//         (name = "workflows", description = "Workflow management"),
//         (name = "dashboard", description = "Dashboard statistics"),
//         (name = "issues", description = "GitHub issues"),
//         (name = "health", description = "Health check"),
//     )
// )]
// struct ApiDoc;

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    /// Database connection pool
    pub db: sqlx::PgPool,
    /// Application configuration
    pub config: Arc<AppConfig>,
    /// JWT secret for token signing (deprecated, use jwt_manager instead)
    pub jwt_secret: String,
    /// JWT manager for token creation and validation
    pub jwt_manager: Arc<auth::JwtManager>,
    /// Token blacklist for secure logout (Issue #1313)
    pub token_blacklist: Arc<dyn auth::TokenBlacklist>,
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
    // Phase 1.1: PostgreSQL Connection Enablement
    // Configure connection pool for Lambda + RDS with proper tuning
    tracing::info!("Initializing PostgreSQL connection pool");
    tracing::info!(
        "Environment: {}",
        config.environment
    );
    tracing::info!(
        "Database URL: {}",
        config.database_url.rsplit('@').next().unwrap_or("unknown")
    );

    // Get environment-specific pool configuration
    let pool_config = config.database_pool();

    tracing::info!(
        "Connection pool settings: max={}, min={}, acquire_timeout={:?}s",
        pool_config.max_connections,
        pool_config.min_connections,
        pool_config.acquire_timeout.as_secs()
    );

    // Build connection pool with optimized settings
    let mut pool_options = sqlx::postgres::PgPoolOptions::new()
        .max_connections(pool_config.max_connections)
        .min_connections(pool_config.min_connections)
        .acquire_timeout(pool_config.acquire_timeout)
        .test_before_acquire(pool_config.test_before_acquire);

    // Apply optional timeouts
    if let Some(idle_timeout) = pool_config.idle_timeout {
        pool_options = pool_options.idle_timeout(idle_timeout);
    }

    if let Some(max_lifetime) = pool_config.max_lifetime {
        pool_options = pool_options.max_lifetime(max_lifetime);
    }

    // Connect to database
    let db = pool_options
        .connect(&config.database_url)
        .await
        .map_err(|e| {
            tracing::error!("Failed to connect to PostgreSQL: {}", e);
            tracing::error!(
                "Connection URL host: {}",
                config.database_url.rsplit('@').next().unwrap_or("unknown")
            );
            tracing::error!("Ensure PostgreSQL is running and DATABASE_URL is correct");
            AppError::Database(e)
        })?;

    // Verify database connection with a simple query
    sqlx::query("SELECT 1")
        .fetch_one(&db)
        .await
        .map_err(AppError::Database)?;

    tracing::info!("PostgreSQL connection established successfully");

    // Create WebSocket manager
    let ws_manager = Arc::new(websocket::WebSocketManager::new());

    // Start agent status monitor (polls tmux every 1 second)
    websocket::start_agent_monitor(ws_manager.clone());

    // Create event broadcaster
    let event_broadcaster = events::EventBroadcaster::new();

    // Create JWT manager
    let jwt_manager = Arc::new(auth::JwtManager::new(
        &config.jwt_secret,
        3600 * 24 * 7, // 7 days
    ));

    // Create token blacklist (Issue #1313: secure logout)
    let token_blacklist: Arc<dyn auth::TokenBlacklist> =
        Arc::new(auth::MemoryTokenBlacklist::new());

    // Create shared state
    let state = AppState {
        db,
        config: Arc::new(config.clone()),
        jwt_secret: config.jwt_secret.clone(),
        jwt_manager,
        token_blacklist,
        ws_manager,
        event_broadcaster,
    };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build API routes - TEMPORARY: Only Telegram and Health for scratch implementation
    // TODO: Re-enable database routes after implementing Firebase/Firestore from scratch
    let api_routes = Router::new()
        // Health check
        .route("/health", get(routes::health::health_check))
        // Telegram Bot Webhook - Does NOT require database
        .route("/telegram/webhook", post(routes::telegram::handle_webhook))
        // WebSocket endpoint for real-time updates
        .route("/ws", get(routes::websocket::websocket_handler))
        // Infrastructure monitoring routes - Does NOT require database
        .route(
            "/infrastructure/status",
            get(routes::infrastructure::status::get_infrastructure_status),
        )
        .route(
            "/infrastructure/database",
            get(routes::infrastructure::status::get_database_status),
        )
        .route(
            "/infrastructure/deployment",
            get(routes::infrastructure::status::get_deployment_status),
        )
        .route(
            "/infrastructure/topology",
            get(routes::infrastructure::status::get_infrastructure_topology),
        )
        // Logs and Worktrees routes - Does NOT require database (mock data)
        .route("/logs", get(routes::logs::list_logs))
        .route("/worktrees", get(routes::worktrees::list_worktrees))
        // Agents route - Does NOT require database (hardcoded metadata)
        .route("/agents", get(routes::agents::list_agents))
        // Deployments routes - Does NOT require database (git tags)
        .route("/deployments", get(routes::deployments::list_deployments))
        .route(
            "/deployments/status",
            get(routes::deployments::get_deployment_status),
        )
        // Activity routes - Does NOT require database (git history)
        .route("/activity/stats", get(routes::activity::get_activity_stats))
        .route(
            "/activity/events",
            get(routes::activity::get_activity_events),
        )
        // System metrics - Does NOT require database (shell commands)
        .route("/system/metrics", get(routes::system::get_system_metrics))
        // Database info - Does NOT require database (reads migrations)
        .route(
            "/database/schema",
            get(routes::database::get_database_schema),
        )
        .route(
            "/database/status/detailed",
            get(routes::database::get_database_status_detailed),
        )
        // Timeline routes - Does NOT require database (reads from JSONL logs)
        .route("/timeline", get(routes::timeline::get_timeline))
        .route("/timeline", post(routes::timeline::post_timeline_event))
        // Tmux routes - Does NOT require database (shell commands)
        .route("/tmux/sessions", get(routes::tmux::list_sessions))
        .route("/tmux/sessions/{name}", get(routes::tmux::get_session))
        .route(
            "/tmux/sessions/{name}/command",
            post(routes::tmux::send_command),
        )
        .route(
            "/tmux/sessions/{name}/kill",
            post(routes::tmux::kill_session),
        )
        // CodeGen routes - Does NOT require database (in-memory + stub data)
        .nest("/codegen", routes::codegen::routes().with_state(()))
        // MCP routes - Does NOT require database (hardcoded tools + shell commands)
        .nest("/mcp", routes::mcp::routes())
        // Authentication routes - Phase 2.4: Re-enabled with database (PUBLIC)
        .route("/auth/github", get(routes::auth::github_oauth_initiate))
        .route(
            "/auth/github/callback",
            get(routes::auth::github_oauth_callback),
        )
        .route("/auth/refresh", post(routes::auth::refresh_token))
        .route("/auth/logout", post(routes::auth::logout))
        .route(
            "/auth/switch-organization",
            post(routes::auth::switch_organization),
        )
        .route("/auth/mock", post(routes::auth::mock_login))
        // Worker & Coordinator Status routes - Phase 2.3 (#985) (PUBLIC - status only)
        .nest("/workers", routes::workers::routes())
        .nest("/coordinators", routes::coordinators::routes());

    // Protected routes requiring authentication + RBAC
    // Issue #1176: RBAC Middleware Integration for all protected routes
    //
    // Permission mapping:
    // - repositories.read: List/view repositories
    // - repositories.create: Create new repositories
    // - workflows.read: List/view workflows
    // - workflows.create: Create new workflows
    // - dashboard.read: View dashboard statistics
    // - agents.execute: Execute agents

    // Repository routes with RBAC
    let repository_read_routes = Router::new()
        .route(
            "/repositories",
            get(routes::repositories::list_repositories),
        )
        .route(
            "/repositories/{id}",
            get(routes::repositories::get_repository),
        )
        .route_layer(from_fn(middleware::require_permission("repositories.read")));

    let repository_create_routes = Router::new()
        .route(
            "/repositories",
            post(routes::repositories::create_repository),
        )
        .route_layer(from_fn(middleware::require_permission(
            "repositories.create",
        )));

    // Agent execution routes with RBAC
    let agent_routes = Router::new()
        .route("/agents/execute", post(routes::agents::execute_agent))
        .route_layer(from_fn(middleware::require_permission("agents.execute")));

    // Workflow routes with RBAC
    let workflow_read_routes = Router::new()
        .route("/workflows", get(routes::workflows::list_workflows))
        .route("/workflows/{id}", get(routes::workflows::get_workflow))
        .route_layer(from_fn(middleware::require_permission("workflows.read")));

    let workflow_create_routes = Router::new()
        .route("/workflows", post(routes::workflows::create_workflow))
        .route_layer(from_fn(middleware::require_permission("workflows.create")));

    // Dashboard routes with RBAC
    let dashboard_routes = Router::new()
        .route(
            "/dashboard/summary",
            get(routes::dashboard::get_dashboard_summary),
        )
        .route(
            "/dashboard/recent",
            get(routes::dashboard::get_recent_executions),
        )
        .route_layer(from_fn(middleware::require_permission("dashboard.read")));

    // Create auth middleware state with blacklist (Issue #1313)
    let auth_state = middleware::AuthMiddlewareState {
        jwt_secret: state.jwt_secret.clone(),
        token_blacklist: state.token_blacklist.clone(),
    };

    // Merge all protected routes
    let protected_routes = Router::new()
        .merge(repository_read_routes)
        .merge(repository_create_routes)
        .merge(agent_routes)
        .merge(workflow_read_routes)
        .merge(workflow_create_routes)
        .merge(dashboard_routes)
        // Organization routes - Phase 1.4: RBAC already integrated (#970)
        .nest("/organizations", routes::organizations::routes())
        // Task Management routes - Phase 2.1: RBAC already integrated (#970)
        .nest("/tasks", routes::tasks::routes())
        // Apply auth middleware with blacklist to all protected routes (Issue #1313)
        .route_layer(from_fn_with_state(
            auth_state,
            middleware::auth_middleware_with_blacklist,
        ))
        .with_state(state.clone());

    // Merge public and protected routes
    let api_routes = api_routes.merge(protected_routes);

    // Build main router
    let app = Router::new()
        // .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi())) // Temporarily disabled
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

// Temporarily disabled until all routes have #[utoipa::path] attributes
// #[cfg(test)]
// mod tests {
//     use super::*;
//
//     #[test]
//     fn test_api_doc_generation() {
//         // Test that OpenAPI doc can be generated
//         let doc = ApiDoc::openapi();
//         assert_eq!(doc.info.title, "Miyabi Web API");
//         assert_eq!(doc.info.version, "1.0.0");
//     }
// }
