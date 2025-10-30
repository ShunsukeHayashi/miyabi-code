//! Miyabi TUI - Terminal User Interface
//!
//! This crate provides a terminal-based user interface for Miyabi,
//! inspired by OpenAI's Codex CLI TUI and implementing Codex architecture.
//!
//! # Features
//!
//! - Event-driven architecture with async/await
//! - Message history with role-based coloring
//! - Real-time input handling
//! - State management (Idle, Processing, Streaming, etc.)
//! - Ctrl+C to quit, Enter to send
//!
//! # Usage
//!
//! ```no_run
//! # #[tokio::main]
//! # async fn main() -> anyhow::Result<()> {
//! miyabi_tui::run_tui().await
//! # }
//! ```

mod app;
mod history;
mod markdown;
pub mod worktree_monitor;

pub use app::{App, AppEvent, AppState, Message, MessageRole};
pub use history::{default_history_path, ChatHistory, ChatSession};
pub use markdown::render_markdown;
pub use worktree_monitor::{run_worktree_monitor, WorktreeMonitorApp};

/// Run the Miyabi TUI application
///
/// This is the main entry point for the TUI. It initializes the terminal,
/// runs the main event loop with async event handling, and cleans up on exit.
///
/// # Returns
///
/// Returns `Ok(())` on successful execution, or an error if the TUI fails to initialize
/// or run.
///
/// # Errors
///
/// This function will return an error if:
/// - Terminal initialization fails (raw mode, alternate screen)
/// - The event loop encounters a fatal error
/// - Terminal cleanup fails
///
/// # Example
///
/// ```no_run
/// #[tokio::main]
/// async fn main() -> anyhow::Result<()> {
///     miyabi_tui::run_tui().await
/// }
/// ```
pub async fn run_tui() -> anyhow::Result<()> {
    let mut app = App::new();
    app.run().await
}
