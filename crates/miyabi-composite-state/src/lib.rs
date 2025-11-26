//! Miyabi Composite State
//!
//! Unified state management across all Miyabi systems.
//!
//! # Features
//! - Agent State (from GitHub/A2A)
//! - Business State (from PostgreSQL)
//! - User State (in-memory)
//! - AWS State (from AWS API)
//! - Real-time synchronization

pub mod error;
pub mod manager;

pub use error::{CompositeStateError, Result};
pub use manager::CompositeStateManager;

// Re-export composite state types from miyabi-types
pub use miyabi_types::{AgentState, AwsState, BusinessState, CompositeServiceState, UserState};

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
