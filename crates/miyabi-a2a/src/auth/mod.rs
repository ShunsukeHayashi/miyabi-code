//! Authentication and authorization for A2A Protocol.
//!
//! This module provides JWT-based authentication for gRPC endpoints.

pub mod jwt;

pub use jwt::JwtValidator;
