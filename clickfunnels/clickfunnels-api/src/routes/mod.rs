//! API Routes
//!
//! This module defines routing configuration for all API endpoints.

pub mod user;
pub mod funnel;

pub use user::create_user_routes;
pub use funnel::create_funnel_routes;
