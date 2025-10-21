//! gRPC transport implementation for A2A Protocol.
//!
//! This module provides gRPC server and client implementations based on
//! Protocol Buffers generated from `proto/a2a.proto`.
//!
//! # Features
//!
//! This module is only available when the `grpc` feature is enabled.
//!
//! ```toml
//! miyabi-a2a = { version = "2.0.0", features = ["grpc"] }
//! ```

// Re-export generated types and services
#[allow(clippy::all)]
#[allow(missing_docs)]
pub mod proto {
    include!("generated/miyabi.a2a.v1.rs");
}

pub mod conversions;
pub mod server;

pub use conversions::*;
pub use proto::*;
pub use server::{start_server, A2AServiceImpl};
