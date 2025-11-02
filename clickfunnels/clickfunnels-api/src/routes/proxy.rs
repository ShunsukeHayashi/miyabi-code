//! ClickFunnels API Proxy Routes
//!
//! Routes for proxying requests to ClickFunnels API

use axum::{routing::get, Router};

use crate::{handlers::proxy::{proxy_get, proxy_post}, state::AppState};

/// Create proxy routes for ClickFunnels API
///
/// Mounts routes under /proxy/clickfunnels/*endpoint
///
/// Note: The proxy state must be initialized in AppState before using these routes
pub fn create_proxy_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/proxy/clickfunnels/*endpoint",
            get(proxy_get).post(proxy_post),
        )
}
