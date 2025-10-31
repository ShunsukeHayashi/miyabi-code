//! # Miyabi PTY Manager
//!
//! PTY (Pseudo-Terminal) management library for Miyabi autonomous agents.
//!
//! This crate provides a cross-platform interface for spawning, managing, and
//! monitoring shell processes through pseudo-terminals. It's designed to be used
//! by Miyabi's autonomous agent system (particularly the CoordinatorAgent) to
//! execute commands and capture output programmatically.
//!
//! ## Features
//!
//! - **Multi-session management**: Spawn and manage multiple independent PTY sessions
//! - **Output buffering**: Automatic capture of session output with ring buffer
//! - **Process monitoring**: Track process lifecycle and exit codes
//! - **Pattern matching**: Wait for specific output patterns with timeout
//! - **Agent ownership**: Track which agent/orchestrator manages each session
//! - **Cross-platform**: Works on macOS, Linux, and Windows
//!
//! ## Usage
//!
//! ### Basic Example
//!
//! ```rust,no_run
//! use miyabi_pty_manager::PtyManager;
//!
//! # #[tokio::main]
//! # async fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let manager = PtyManager::new();
//!
//! // Spawn a terminal session
//! let session = manager.spawn_shell(80, 24)?;
//! println!("Created session: {}", session.id);
//!
//! // Execute a command
//! manager.execute_command(&session.id, "ls -la")?;
//!
//! // Wait for output
//! tokio::time::sleep(std::time::Duration::from_secs(1)).await;
//!
//! // Get recent output
//! let output = manager.get_output(&session.id, 10)?;
//! for line in output {
//!     println!("{}", line);
//! }
//!
//! // Cleanup
//! manager.kill_session(&session.id)?;
//! # Ok(())
//! # }
//! ```
//!
//! ### Orchestrator-Managed Sessions
//!
//! ```rust,no_run
//! use miyabi_pty_manager::PtyManager;
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! let manager = PtyManager::new();
//!
//! // Spawn session managed by specific agent
//! let session = manager.spawn_shell_with_manager(
//!     80,
//!     24,
//!     Some("orchestrator:coordinator-001".to_string())
//! )?;
//!
//! // Execute commands
//! manager.execute_command(&session.id, "cargo build")?;
//! manager.execute_command(&session.id, "cargo test")?;
//!
//! // List all sessions for this agent
//! let agent_sessions = manager.list_sessions_by_manager("orchestrator:coordinator-001");
//! println!("Agent manages {} sessions", agent_sessions.len());
//!
//! // Cleanup all sessions for this agent
//! let killed = manager.kill_sessions_by_manager("orchestrator:coordinator-001")?;
//! println!("Killed {} sessions", killed);
//! # Ok(())
//! # }
//! ```

pub mod errors;
pub mod manager;
pub mod output_buffer;
pub mod process_monitor;
pub mod session;

// Re-export main types
pub use errors::{PtyError, Result};
pub use manager::{OutputCallback, PtyManager};
pub use output_buffer::SessionOutputBuffer;
pub use process_monitor::ProcessMonitor;
pub use session::{SessionInfo, TerminalSession};
