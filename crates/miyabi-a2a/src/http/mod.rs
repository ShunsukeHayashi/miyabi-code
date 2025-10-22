//! HTTP REST API server for Miyabi Dashboard
//!
//! This module provides REST API endpoints for the dashboard frontend.

mod real_data;
mod routes;
mod server;
mod websocket;

pub use real_data::*;
pub use routes::*;
pub use server::*;
pub use websocket::*;
