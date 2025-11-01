//! Page API Routes
//!
//! This module defines the routing configuration for Page endpoints.

use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::page::{
    create_page, delete_page, duplicate_page, get_page, get_page_stats, list_pages, publish_page,
    unpublish_page, update_page, update_page_content,
};

/// Create Page routes
///
/// Returns a Router with all Page API endpoints:
/// - POST /pages - Create page
/// - GET /pages - List pages
/// - GET /pages/:id - Get page by ID
/// - PUT /pages/:id - Update page
/// - DELETE /pages/:id - Delete page
/// - GET /pages/:id/stats - Get page statistics
/// - PUT /pages/:id/content - Update page content (HTML/CSS/JS)
/// - POST /pages/:id/publish - Publish page
/// - POST /pages/:id/unpublish - Unpublish page
/// - POST /pages/:id/duplicate - Duplicate page
pub fn create_page_routes() -> Router {
    Router::new()
        .route("/pages", post(create_page))
        .route("/pages", get(list_pages))
        .route("/pages/:id", get(get_page))
        .route("/pages/:id", put(update_page))
        .route("/pages/:id", delete(delete_page))
        .route("/pages/:id/stats", get(get_page_stats))
        .route("/pages/:id/content", put(update_page_content))
        .route("/pages/:id/publish", post(publish_page))
        .route("/pages/:id/unpublish", post(unpublish_page))
        .route("/pages/:id/duplicate", post(duplicate_page))
}
