//! Approval gate implementation

use crate::error::{ApprovalError, Result};
use crate::state::{ApprovalResponse, ApprovalState};
use crate::store::ApprovalStore;
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Approval gate for workflows
#[derive(Clone)]
pub struct ApprovalGate {
    /// Gate identifier
    gate_id: String,

    /// Required approvers
    required_approvers: Vec<String>,

    /// Timeout in seconds (default: 24 hours)
    timeout_seconds: u64,

    /// Approval store
    store: Arc<RwLock<ApprovalStore>>,
}

impl ApprovalGate {
    /// Create a new approval gate with default settings
    pub fn new(gate_id: impl Into<String>) -> Result<Self> {
        Self::builder(gate_id).build()
    }

    /// Create a new approval gate builder
    pub fn builder(gate_id: impl Into<String>) -> ApprovalGateBuilder {
        ApprovalGateBuilder {
            gate_id: gate_id.into(),
            required_approvers: Vec::new(),
            timeout_seconds: 86400, // 24 hours default
            store_path: None,
        }
    }

    /// Create an approval request for a workflow
    pub async fn create_approval(&self, workflow_id: impl Into<String>) -> Result<String> {
        let approval_id = uuid::Uuid::new_v4().to_string();
        let workflow_id = workflow_id.into();

        let state = ApprovalState::new(
            approval_id.clone(),
            workflow_id,
            self.gate_id.clone(),
            self.required_approvers.clone(),
            self.timeout_seconds,
        );

        let store = self.store.write().await;
        store.save(&state)?;

        tracing::info!(
            "Created approval {} for workflow (gate: {})",
            approval_id,
            self.gate_id
        );

        Ok(approval_id)
    }

    /// Approve an approval request
    pub async fn approve(
        &self,
        approval_id: &str,
        approver: impl Into<String>,
        comment: Option<String>,
    ) -> Result<ApprovalState> {
        let approver = approver.into();

        let store = self.store.write().await;

        // Load current state
        let mut state = store
            .load(approval_id)?
            .ok_or_else(|| ApprovalError::NotFound(approval_id.to_string()))?;

        // Validate state
        if state.is_completed() {
            return Err(ApprovalError::AlreadyCompleted(format!(
                "{:?}",
                state.status
            )));
        }

        if !state.is_approver_authorized(&approver) {
            return Err(ApprovalError::NotAuthorized(approver));
        }

        if state.has_approver_responded(&approver) {
            return Err(ApprovalError::AlreadyResponded(approver));
        }

        // Add approval response
        let response = ApprovalResponse {
            approver: approver.clone(),
            approved: true,
            comment,
            responded_at: Utc::now(),
        };

        state.add_response(response);

        // Save updated state
        store.save(&state)?;

        tracing::info!(
            "Approval {} approved by {} (status: {:?})",
            approval_id,
            approver,
            state.status
        );

        Ok(state)
    }

    /// Reject an approval request
    pub async fn reject(
        &self,
        approval_id: &str,
        approver: impl Into<String>,
        reason: Option<String>,
    ) -> Result<ApprovalState> {
        let approver = approver.into();

        let store = self.store.write().await;

        // Load current state
        let mut state = store
            .load(approval_id)?
            .ok_or_else(|| ApprovalError::NotFound(approval_id.to_string()))?;

        // Validate state
        if state.is_completed() {
            return Err(ApprovalError::AlreadyCompleted(format!(
                "{:?}",
                state.status
            )));
        }

        if !state.is_approver_authorized(&approver) {
            return Err(ApprovalError::NotAuthorized(approver));
        }

        if state.has_approver_responded(&approver) {
            return Err(ApprovalError::AlreadyResponded(approver));
        }

        // Add rejection response
        let response = ApprovalResponse {
            approver: approver.clone(),
            approved: false,
            comment: reason,
            responded_at: Utc::now(),
        };

        state.add_response(response);

        // Save updated state
        store.save(&state)?;

        tracing::info!(
            "Approval {} rejected by {} (status: {:?})",
            approval_id,
            approver,
            state.status
        );

        Ok(state)
    }

    /// Get approval state
    pub async fn get_state(&self, approval_id: &str) -> Result<Option<ApprovalState>> {
        let store = self.store.read().await;
        store.load(approval_id)
    }

    /// List all pending approvals for this gate
    pub async fn list_pending(&self) -> Result<Vec<ApprovalState>> {
        let store = self.store.read().await;
        let all_pending = store.list_pending()?;

        Ok(all_pending
            .into_iter()
            .filter(|s| s.gate_id == self.gate_id)
            .collect())
    }

    /// List pending approvals for a specific approver
    pub async fn list_pending_for_approver(&self, approver: &str) -> Result<Vec<ApprovalState>> {
        let store = self.store.read().await;
        let all_pending = store.list_pending_for_approver(approver)?;

        Ok(all_pending
            .into_iter()
            .filter(|s| s.gate_id == self.gate_id)
            .collect())
    }

    /// Check and update timed out approvals
    pub async fn check_timeouts(&self) -> Result<Vec<ApprovalState>> {
        let store = self.store.write().await;
        let timed_out = store.list_timed_out()?;

        // Update statuses
        for state in &timed_out {
            store.save(state)?;
        }

        Ok(timed_out
            .into_iter()
            .filter(|s| s.gate_id == self.gate_id)
            .collect())
    }
}

/// Builder for ApprovalGate
pub struct ApprovalGateBuilder {
    gate_id: String,
    required_approvers: Vec<String>,
    timeout_seconds: u64,
    store_path: Option<String>,
}

impl ApprovalGateBuilder {
    /// Set required approvers
    pub fn required_approvers(mut self, approvers: Vec<String>) -> Self {
        self.required_approvers = approvers;
        self
    }

    /// Add a required approver
    pub fn add_approver(mut self, approver: impl Into<String>) -> Self {
        self.required_approvers.push(approver.into());
        self
    }

    /// Set timeout in seconds
    pub fn timeout_seconds(mut self, timeout: u64) -> Self {
        self.timeout_seconds = timeout;
        self
    }

    /// Set custom store path
    pub fn store_path(mut self, path: impl Into<String>) -> Self {
        self.store_path = Some(path.into());
        self
    }

    /// Build the approval gate
    pub fn build(self) -> Result<ApprovalGate> {
        let store = if let Some(path) = self.store_path {
            ApprovalStore::with_path(path)?
        } else {
            ApprovalStore::new()?
        };

        Ok(ApprovalGate {
            gate_id: self.gate_id,
            required_approvers: self.required_approvers,
            timeout_seconds: self.timeout_seconds,
            store: Arc::new(RwLock::new(store)),
        })
    }
}
