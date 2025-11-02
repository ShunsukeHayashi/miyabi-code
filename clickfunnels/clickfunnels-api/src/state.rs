//! Application State
//!
//! Shared state for the Axum application, including database connections
//! and other shared resources.

use clickfunnels_db::Database;
use std::sync::Arc;

/// Shared HTTP client for proxy requests
#[derive(Clone)]
pub struct ProxyState {
    pub client: reqwest::Client,
    pub base_url: String,
    pub access_token: String,
}

impl ProxyState {
    pub fn new(access_token: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            // Use accounts.myclickfunnels.com for team/workspace discovery
            base_url: "https://accounts.myclickfunnels.com/api/v2".to_string(),
            access_token,
        }
    }
}

/// Application state shared across all handlers
#[derive(Clone)]
pub struct AppState {
    /// Database connection pool
    pub db: Database,
    /// Optional proxy state for ClickFunnels API proxy
    pub proxy: Option<Arc<ProxyState>>,
}

impl AppState {
    /// Create a new AppState with database connection
    pub fn new(db: Database) -> Self {
        Self { db, proxy: None }
    }

    /// Create a new AppState with database and proxy
    pub fn with_proxy(db: Database, proxy_state: ProxyState) -> Self {
        Self {
            db,
            proxy: Some(Arc::new(proxy_state)),
        }
    }
}
