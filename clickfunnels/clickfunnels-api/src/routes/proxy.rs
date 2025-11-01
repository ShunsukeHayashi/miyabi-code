//! ClickFunnels API Proxy Routes
//!
//! Routes for proxying requests to ClickFunnels API

use axum::{
    routing::get,
    Router,
};
use std::sync::Arc;

use crate::handlers::proxy::{proxy_get, proxy_post, ProxyState};

/// Create proxy routes for ClickFunnels API
///
/// Mounts routes under /proxy/clickfunnels/*endpoint
pub fn create_proxy_routes(access_token: String) -> Router {
    let state = Arc::new(ProxyState::new(access_token));

    Router::new()
        .route("/proxy/clickfunnels/:endpoint", get(proxy_get).post(proxy_post))
        .with_state(state)
}
