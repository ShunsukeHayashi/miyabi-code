//! ClickFunnels API - REST API Layer
//!
//! This crate provides the REST API endpoints for the ClickFunnels system
//! using Axum web framework.

pub mod dto;
pub mod error;
pub mod handlers;
pub mod routes;

use axum::{
    http::{header, Method},
    Router,
};
use tower_http::cors::{Any, CorsLayer};

/// Create the main API router
///
/// Returns a Router with all API endpoints mounted under /api/v1
pub fn create_api_router() -> Router {
    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    // Create API v1 router
    let api_v1 = Router::new()
        .merge(routes::create_user_routes())
        .merge(routes::create_funnel_routes());

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
