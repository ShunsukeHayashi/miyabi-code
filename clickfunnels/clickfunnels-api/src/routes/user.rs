//! User API Routes
//!
//! This module defines the routing configuration for User endpoints.

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::user::{create_user, delete_user, get_user, list_users, update_user};

/// Create User routes
///
/// Returns a Router with all User API endpoints:
/// - POST /users - Create user
/// - GET /users - List users
/// - GET /users/:id - Get user by ID
/// - PUT /users/:id - Update user
/// - DELETE /users/:id - Delete user
pub fn create_user_routes() -> Router {
    Router::new()
        .route("/users", post(create_user))
        .route("/users", get(list_users))
        .route("/users/:id", get(get_user))
        .route("/users/:id", put(update_user))
        .route("/users/:id", delete(delete_user))
}
