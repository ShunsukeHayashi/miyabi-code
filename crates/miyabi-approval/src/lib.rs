//! Miyabi Approval System - Human-in-the-Loop workflow approval gates
//!
//! This crate provides approval gate functionality for workflows, enabling:
//! - Multi-approver support
//! - Approval state persistence
//! - Timeout and escalation handling
//! - Notification system integration
//!
//! # Example
//!
//! ```rust
//! use miyabi_approval::{ApprovalGate, ApprovalStore};
//!
//! # async fn example() -> Result<(), Box<dyn std::error::Error>> {
//! let gate = ApprovalGate::builder("deploy-production")
//!     .required_approvers(vec!["tech-lead".to_string(), "ciso".to_string()])
//!     .timeout_seconds(86400) // 24 hours
//!     .build()?;
//!
//! // Pause workflow at approval gate
//! let approval_id = gate.create_approval("workflow-123").await?;
//!
//! // Later: approve the workflow
//! gate.approve(&approval_id, "tech-lead", Some("LGTM".to_string())).await?;
//! # Ok(())
//! # }
//! ```

pub mod error;
pub mod gate;
pub mod notifications;
pub mod state;
pub mod store;

pub use error::{ApprovalError, Result};
pub use gate::{ApprovalGate, ApprovalGateBuilder};
pub use notifications::{
    ApprovalRequest, DiscordEmbed, DiscordNotifier, MessageFormatter, Notifier, SlackBlock,
    SlackNotifier, WorkflowStatusUpdate,
};
pub use state::{ApprovalResponse, ApprovalState, ApprovalStatus};
pub use store::ApprovalStore;
