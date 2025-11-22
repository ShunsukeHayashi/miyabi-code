//! # miyabi-a2a-gateway
//!
//! A2A (Agent-to-Agent) Gateway for unified inter-agent communication.
//!
//! All Miyabi agent communication goes through this gateway to ensure
//! reliable, auditable, and standardized communication.

pub mod agent_bootstrap;
pub mod cards;
pub mod error;
pub mod gateway;
pub mod monitor;
pub mod queue;
pub mod registry;
pub mod router;
pub mod types;

pub use error::Error;
pub use gateway::A2AGateway;
pub use types::*;

/// Result type for A2A operations
pub type Result<T> = std::result::Result<T, Error>;
