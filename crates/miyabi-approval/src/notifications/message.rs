//! Message types and formatting for notifications

use serde::{Deserialize, Serialize};

/// Approval request message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRequest {
    /// Workflow ID
    pub workflow_id: String,
    /// Approval ID
    pub approval_id: String,
    /// Request title
    pub title: String,
    /// Requester (agent or user)
    pub requester: String,
    /// Request details
    pub details: String,
    /// Approval URL
    pub approve_url: Option<String>,
    /// Rejection URL
    pub reject_url: Option<String>,
    /// Required approvers
    pub required_approvers: Vec<String>,
    /// Timeout in seconds
    pub timeout_seconds: u64,
}

/// Workflow status update message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowStatusUpdate {
    /// Workflow ID
    pub workflow_id: String,
    /// Approval ID
    pub approval_id: String,
    /// Status (Running, Paused, Completed, Failed)
    pub status: String,
    /// Duration in seconds
    pub duration_seconds: Option<u64>,
    /// Results summary
    pub results: Option<String>,
    /// Error message if failed
    pub error: Option<String>,
}

impl WorkflowStatusUpdate {
    /// Format duration as human-readable string
    pub fn format_duration(&self) -> String {
        match self.duration_seconds {
            Some(secs) => {
                let minutes = secs / 60;
                let seconds = secs % 60;
                if minutes > 0 {
                    format!("{}m {}s", minutes, seconds)
                } else {
                    format!("{}s", seconds)
                }
            }
            None => "N/A".to_string(),
        }
    }

    /// Get status emoji
    pub fn status_emoji(&self) -> &str {
        match self.status.as_str() {
            "Running" => "🔄",
            "Paused" => "⏸️",
            "Completed" => "✅",
            "Failed" => "❌",
            "Approved" => "✅",
            "Rejected" => "❌",
            "TimedOut" => "⏰",
            _ => "ℹ️",
        }
    }

    /// Get status color (for Discord embeds)
    pub fn status_color(&self) -> u32 {
        match self.status.as_str() {
            "Running" => 0x3498db,   // Blue
            "Paused" => 0xf39c12,    // Orange
            "Completed" => 0x2ecc71, // Green
            "Failed" => 0xe74c3c,    // Red
            "Approved" => 0x2ecc71,  // Green
            "Rejected" => 0xe74c3c,  // Red
            "TimedOut" => 0xe67e22,  // Dark orange
            _ => 0x95a5a6,           // Gray
        }
    }
}

/// Message formatter trait
pub trait MessageFormatter {
    /// Format approval request as plain text
    fn format_approval_request(&self, req: &ApprovalRequest) -> String;

    /// Format status update as plain text
    fn format_status_update(&self, status: &WorkflowStatusUpdate) -> String;

    /// Format error as plain text
    fn format_error(&self, error: &str) -> String;
}

/// Default plain text formatter
pub struct PlainTextFormatter;

impl MessageFormatter for PlainTextFormatter {
    fn format_approval_request(&self, req: &ApprovalRequest) -> String {
        format!(
            "🔔 **Approval Request**\n\n\
            **Workflow**: {}\n\
            **Title**: {}\n\
            **Requester**: {}\n\
            **Details**: {}\n\
            **Required Approvers**: {}\n\
            **Timeout**: {} seconds\n\
            {}",
            req.workflow_id,
            req.title,
            req.requester,
            req.details,
            req.required_approvers.join(", "),
            req.timeout_seconds,
            if let Some(url) = &req.approve_url {
                format!("**Approve**: {}", url)
            } else {
                String::new()
            }
        )
    }

    fn format_status_update(&self, status: &WorkflowStatusUpdate) -> String {
        format!(
            "{} **Workflow Status Update**\n\n\
            **Workflow**: {}\n\
            **Status**: {}\n\
            **Duration**: {}\n\
            {}{}",
            status.status_emoji(),
            status.workflow_id,
            status.status,
            status.format_duration(),
            if let Some(results) = &status.results {
                format!("**Results**: {}\n", results)
            } else {
                String::new()
            },
            if let Some(error) = &status.error {
                format!("**Error**: {}\n", error)
            } else {
                String::new()
            }
        )
    }

    fn format_error(&self, error: &str) -> String {
        format!("❌ **Error**\n\n{}", error)
    }
}
