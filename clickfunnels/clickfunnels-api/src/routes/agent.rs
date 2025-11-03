//! Agent API Routes
//!
//! Routes for executing AI-powered funnel agents.

use axum::{middleware, routing::post, Router};

use crate::{
    handlers::agent::execute_funnel_agents, middleware::auth::auth_middleware, state::AppState,
};

/// Create routes for agent execution endpoints.
pub fn create_agent_routes() -> Router<AppState> {
    Router::new()
        .route("/agents/execute-funnel", post(execute_funnel_agents))
        .route_layer(middleware::from_fn(auth_middleware))
}
