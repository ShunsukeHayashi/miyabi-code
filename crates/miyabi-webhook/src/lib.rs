//! Miyabi Webhook - HMAC-based signature verification
//!
//! This crate provides webhook signature generation and verification
//! for secure Agent-to-Agent (A2A) communication.
//!
//! # Overview
//!
//! Webhooks are secured using HMAC-SHA256 signatures with the following headers:
//! - `X-Miyabi-Signature`: `sha256=<hex_signature>`
//! - `X-Miyabi-Timestamp`: Unix timestamp (seconds)
//!
//! # Security Features
//!
//! - **HMAC-SHA256**: Industry-standard message authentication
//! - **Replay Protection**: 5-minute timestamp window
//! - **Constant-time Comparison**: Timing attack resistance
//!
//! # Examples
//!
//! ```
//! use miyabi_webhook::WebhookSigner;
//! use chrono::Utc;
//!
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! // Server: Generate signature
//! let signer = WebhookSigner::new("my-secret-key");
//! let payload = b"{\"event\":\"task.created\"}";
//! let timestamp = Utc::now().timestamp();
//! let signature = signer.sign(payload, timestamp);
//!
//! println!("X-Miyabi-Signature: {}", signature);
//! println!("X-Miyabi-Timestamp: {}", timestamp);
//!
//! // Client: Verify signature
//! let is_valid = signer.verify(payload, timestamp, &signature)?;
//! assert!(is_valid);
//! # Ok(())
//! # }
//! ```

pub mod error;
pub mod issue_handler;
pub mod signer;

pub use error::{Result, WebhookError};
pub use issue_handler::{handle_issue_opened, IssueWebhookEvent};
pub use signer::WebhookSigner;

/// Default replay protection window (5 minutes)
pub const DEFAULT_TIMESTAMP_TOLERANCE_SECS: i64 = 300;
