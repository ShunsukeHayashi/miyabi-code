//! Miyabi Scheduler - Session management for headless Claude Code execution
//!
//! This crate provides:
//! - **SessionManager**: Manage multiple headless Claude Code sessions
//! - **Launcher**: Spawn Claude Code processes with proper I/O redirection
//! - **Parser**: Parse execution results and error logs
//!
//! # Example
//!
//! ```no_run
//! use miyabi_scheduler::session::{SessionManager, SessionConfig};
//! use std::path::PathBuf;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Create session manager
//!     let mut manager = SessionManager::new(SessionConfig::default());
//!
//!     // Spawn headless session
//!     let session_id = manager.spawn_headless(
//!         "/agent-run --issue 270".to_string(),
//!         PathBuf::from(".worktrees/issue-270"),
//!     ).await?;
//!
//!     // Wait for completion
//!     manager.wait_for_completion(&session_id).await?;
//!
//!     // Collect result
//!     let result = manager.collect_result(&session_id).await?;
//!     println!("Result: success={}, message={}", result.success, result.message);
//!
//!     Ok(())
//! }
//! ```

pub mod error;
pub mod launcher;
pub mod parser;
pub mod session;

// Re-export key types
pub use error::{Result, SchedulerError};
pub use parser::AgentResult;
pub use session::{SessionConfig, SessionId, SessionManager, SessionStatus};
