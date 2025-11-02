//! API Routes
//!
//! This module defines routing configuration for all API endpoints.

pub mod auth;
pub mod agent;
pub mod funnel;
pub mod page;
pub mod proxy;
pub mod user;

pub use auth::create_auth_routes;
pub use agent::create_agent_routes;
pub use funnel::create_funnel_routes;
pub use page::create_page_routes;
pub use proxy::create_proxy_routes;
pub use user::create_user_routes;
