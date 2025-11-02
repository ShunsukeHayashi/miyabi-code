//! Authentication API Routes
//!
//! This module defines the routing configuration for Authentication endpoints.

use axum::{
    middleware,
    routing::{get, post},
    Router,
};

use crate::{
    handlers::auth::{login, logout, me},
    middleware::auth::auth_middleware,
    state::AppState,
};

/// Create Auth routes
///
/// Returns a Router with all Authentication API endpoints:
/// - POST /auth/login - User login
/// - POST /auth/logout - User logout (requires authentication)
/// - GET /auth/me - Get current user info (requires authentication)
pub fn create_auth_routes() -> Router<AppState> {
    // Public routes
    let public_routes = Router::new().route("/auth/login", post(login));

    // Protected routes
    let protected_routes = Router::new()
        .route("/auth/logout", post(logout))
        .route("/auth/me", get(me))
        .route_layer(middleware::from_fn(auth_middleware));

    // Merge all routes
    public_routes.merge(protected_routes)
}
