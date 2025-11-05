//! Notification system for approval requests and workflow status updates
//!
//! Supports Discord and Slack webhook integrations with rich message formatting.

mod discord;
mod message;
mod slack;

pub use discord::{DiscordEmbed, DiscordNotifier};
pub use message::{ApprovalRequest, MessageFormatter, PlainTextFormatter, WorkflowStatusUpdate};
pub use slack::{SlackBlock, SlackNotifier};

use crate::error::Result;

/// Trait for notification providers
#[async_trait::async_trait]
pub trait Notifier: Send + Sync {
    /// Send an approval request notification
    async fn send_approval_request(&self, req: &ApprovalRequest) -> Result<()>;

    /// Send a workflow status update notification
    async fn send_status_update(&self, status: &WorkflowStatusUpdate) -> Result<()>;

    /// Send an error notification
    async fn send_error(&self, error: &str) -> Result<()>;
}
