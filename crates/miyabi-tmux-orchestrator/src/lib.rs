//! Tmux Orchestrator
//!
//! Multi-agent orchestration using tmux panes for parallel video generation.
//!
//! # Features
//! - Session construction with 120 panes (1 per segment)
//! - Agent startup and lifecycle management
//! - Command distribution across panes
//! - Pane status monitoring

mod agent;
mod error;
mod pane;
mod session;

pub use agent::{Agent, AgentConfig};
pub use error::{Result, TmuxError};
pub use pane::{Pane, PaneStatus};
pub use session::TmuxSession;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_exports() {
        let _ = TmuxError::SessionCreationFailed("test".to_string());
    }
}
