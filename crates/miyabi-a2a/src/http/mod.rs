//! HTTP REST API server for Miyabi Dashboard
//!
//! This module provides REST API endpoints for the dashboard frontend.

mod routes;
mod server;
mod real_data;
mod websocket;

pub use routes::*;
pub use server::*;
pub use real_data::*;
pub use websocket::*;
