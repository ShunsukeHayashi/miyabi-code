//! ClickFunnels API - REST API Layer
//!
//! This crate provides the REST API endpoints for the ClickFunnels system
//! using Axum web framework.

pub mod dto;
pub mod error;
pub mod handlers;
pub mod middleware;
pub mod routes;
pub mod state;
pub mod utils;

pub use state::{AppState, ProxyState};

use axum::{
    http::{header, Method},
    Router,
};
use tower_http::cors::{Any, CorsLayer};

/// Create the main API router
///
/// Returns a Router with all API endpoints mounted under /api/v1
pub fn create_api_router() -> Router<AppState> {
    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Create API v1 router
    let api_v1 = Router::new()
        .merge(routes::create_auth_routes())
        .merge(routes::create_user_routes())
        .merge(routes::create_funnel_routes())
        .merge(routes::create_page_routes())
        .merge(routes::create_agent_routes());

    // Mount under /api/v1
    Router::new().nest("/api/v1", api_v1).layer(cors)
}

/// Create the main API router with ClickFunnels proxy
///
/// Returns a Router with all API endpoints mounted under /api/v1, including
/// the ClickFunnels API proxy for bypassing CORS restrictions.
///
/// Note: The AppState must be initialized with ProxyState using
/// `AppState::with_proxy()` for the proxy routes to work.
pub fn create_api_router_with_proxy() -> Router<AppState> {
    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Create API v1 router with proxy
    let api_v1 = Router::new()
        .merge(routes::create_auth_routes())
        .merge(routes::create_user_routes())
        .merge(routes::create_funnel_routes())
        .merge(routes::create_page_routes())
        .merge(routes::create_agent_routes())
        .merge(routes::create_proxy_routes());

    // Mount under /api/v1
    Router::new().nest("/api/v1", api_v1).layer(cors)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_api_router() {
        let router = create_api_router();
        // Router should be created successfully
        drop(router);
    }
}
