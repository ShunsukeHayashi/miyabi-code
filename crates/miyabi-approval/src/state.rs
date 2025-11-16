//! Approval state management

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Status of an approval request
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ApprovalStatus {
    /// Waiting for approvers to respond
    Pending,
    /// Approved by all required approvers
    Approved,
    /// Rejected by at least one approver
    Rejected,
    /// Timed out without sufficient approvals
    TimedOut,
}

/// Response from an individual approver
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalResponse {
    /// Approver identifier (e.g., GitHub username)
    pub approver: String,

    /// Whether approved (true) or rejected (false)
    pub approved: bool,

    /// Optional comment from approver
    pub comment: Option<String>,

    /// Timestamp when response was received
    pub responded_at: DateTime<Utc>,
}

/// Complete state of an approval request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalState {
    /// Unique approval ID
    pub approval_id: String,

    /// Associated workflow ID
    pub workflow_id: String,

    /// Gate ID that created this approval
    pub gate_id: String,

    /// List of required approvers
    pub required_approvers: Vec<String>,

    /// Responses from approvers
    pub responses: HashMap<String, ApprovalResponse>,

    /// Current approval status
    pub status: ApprovalStatus,

    /// Timeout in seconds
    pub timeout_seconds: u64,

    /// Timestamp when approval was created
    pub created_at: DateTime<Utc>,

    /// Timestamp when approval was completed (if applicable)
    pub completed_at: Option<DateTime<Utc>>,
}

impl ApprovalState {
    /// Create a new approval state
    pub fn new(
        approval_id: impl Into<String>,
        workflow_id: impl Into<String>,
        gate_id: impl Into<String>,
        required_approvers: Vec<String>,
        timeout_seconds: u64,
    ) -> Self {
        Self {
            approval_id: approval_id.into(),
            workflow_id: workflow_id.into(),
            gate_id: gate_id.into(),
            required_approvers,
            responses: HashMap::new(),
            status: ApprovalStatus::Pending,
            timeout_seconds,
            created_at: Utc::now(),
            completed_at: None,
        }
    }

    /// Check if approval is pending
    pub fn is_pending(&self) -> bool {
        matches!(self.status, ApprovalStatus::Pending)
    }

    /// Check if approval is completed (approved, rejected, or timed out)
    pub fn is_completed(&self) -> bool {
        matches!(
            self.status,
            ApprovalStatus::Approved | ApprovalStatus::Rejected | ApprovalStatus::TimedOut
        )
    }

    /// Check if approval has timed out
    pub fn is_timed_out(&self) -> bool {
        if !self.is_pending() {
            return false;
        }

        let elapsed = Utc::now().signed_duration_since(self.created_at).num_seconds() as u64;

        elapsed >= self.timeout_seconds
    }

    /// Get number of approvals received
    pub fn approval_count(&self) -> usize {
        self.responses.values().filter(|r| r.approved).count()
    }

    /// Get number of rejections received
    pub fn rejection_count(&self) -> usize {
        self.responses.values().filter(|r| !r.approved).count()
    }

    /// Check if approver is authorized
    pub fn is_approver_authorized(&self, approver: &str) -> bool {
        self.required_approvers.contains(&approver.to_string())
    }

    /// Check if approver has already responded
    pub fn has_approver_responded(&self, approver: &str) -> bool {
        self.responses.contains_key(approver)
    }

    /// Add approval response
    pub fn add_response(&mut self, response: ApprovalResponse) {
        self.responses.insert(response.approver.clone(), response);
        self.update_status();
    }

    /// Update approval status based on responses
    fn update_status(&mut self) {
        // Check for any rejections
        if self.rejection_count() > 0 {
            self.status = ApprovalStatus::Rejected;
            self.completed_at = Some(Utc::now());
            return;
        }

        // Check if all required approvers have approved
        if self.approval_count() == self.required_approvers.len() {
            self.status = ApprovalStatus::Approved;
            self.completed_at = Some(Utc::now());
            return;
        }

        // Check for timeout
        if self.is_timed_out() {
            self.status = ApprovalStatus::TimedOut;
            self.completed_at = Some(Utc::now());
        }
    }

    /// Get pending approvers (those who haven't responded yet)
    pub fn pending_approvers(&self) -> Vec<&String> {
        self.required_approvers
            .iter()
            .filter(|approver| !self.responses.contains_key(*approver))
            .collect()
    }
}
