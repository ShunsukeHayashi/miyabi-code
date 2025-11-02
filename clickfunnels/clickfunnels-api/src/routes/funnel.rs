//! Funnel API Routes
//!
//! This module defines the routing configuration for Funnel endpoints.

use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

use crate::{
    handlers::funnel::{
        create_funnel, delete_funnel, get_funnel, get_funnel_stats, list_funnels, publish_funnel,
        unpublish_funnel, update_funnel,
    },
    middleware::auth::auth_middleware,
    state::AppState,
};

/// Create Funnel routes
///
/// Returns a Router with all Funnel API endpoints:
/// - POST /funnels - Create funnel
/// - GET /funnels - List funnels
/// - GET /funnels/:id - Get funnel by ID
/// - PUT /funnels/:id - Update funnel
/// - DELETE /funnels/:id - Delete funnel
/// - GET /funnels/:id/stats - Get funnel statistics
/// - POST /funnels/:id/publish - Publish funnel
/// - POST /funnels/:id/unpublish - Unpublish funnel
pub fn create_funnel_routes() -> Router<AppState> {
    Router::new()
        .route("/funnels", post(create_funnel))
        .route("/funnels", get(list_funnels))
        .route("/funnels/:id", get(get_funnel))
        .route("/funnels/:id", put(update_funnel))
        .route("/funnels/:id", delete(delete_funnel))
        .route("/funnels/:id/stats", get(get_funnel_stats))
        .route("/funnels/:id/publish", post(publish_funnel))
        .route("/funnels/:id/unpublish", post(unpublish_funnel))
        .route_layer(middleware::from_fn(auth_middleware))
}
