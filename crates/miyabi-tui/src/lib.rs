//! Miyabi TUI - Terminal User Interface
//!
//! This crate provides a comprehensive terminal-based user interface for Miyabi,
//! featuring multiple views for different functionalities.
//!
//! # Features
//!
//! - **Agent Dashboard**: Monitor all 21 Miyabi agents
//! - **A2A Bridge**: Interactive tool execution interface
//! - **LLM Chat**: Conversational interface with Claude
//! - **System Monitor**: CPU, memory, and process monitoring
//!
//! # Usage
//!
//! ```no_run
//! // Run from command line
//! cargo run -p miyabi-tui
//! ```

pub mod app;
pub mod event;
pub mod ui;
pub mod views;

// Premium UI modules
pub mod shimmer;
pub mod markdown_render;
pub mod history_cell;
pub mod wrapping;

pub use app::{App, Tab};
pub use event::{Event, EventHandler};
pub use views::{AgentDashboard, A2ABridgeView, ChatView, MonitorView};
pub use shimmer::{shimmer_style, shimmer_text, spinner_frame, dots_frame, ShimmerConfig};
pub use markdown_render::{MarkdownRenderer, MarkdownStyles};
pub use history_cell::{HistoryCell, UserMessageCell, AssistantMessageCell, ToolResultCell, SystemMessageCell};
pub use wrapping::{word_wrap_line, word_wrap_lines, wrap_text, display_width, truncate_with_ellipsis, WrapOptions};
