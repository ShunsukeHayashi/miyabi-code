//! Approval state persistence

use crate::error::Result;
use crate::state::{ApprovalState, ApprovalStatus};
use std::path::PathBuf;

/// Storage for approval states
pub struct ApprovalStore {
    db: sled::Db,
}

impl ApprovalStore {
    /// Create a new approval store with default path
    pub fn new() -> Result<Self> {
        let path = Self::default_path();
        std::fs::create_dir_all(&path)?;
        let db = sled::open(path)?;
        Ok(Self { db })
    }

    /// Create approval store with custom path
    pub fn with_path(path: impl Into<PathBuf>) -> Result<Self> {
        let path = path.into();
        std::fs::create_dir_all(&path)?;
        let db = sled::open(path)?;
        Ok(Self { db })
    }

    /// Get default storage path
    fn default_path() -> PathBuf {
        PathBuf::from("./data/approval-state")
    }

    /// Save approval state
    pub fn save(&self, state: &ApprovalState) -> Result<()> {
        let key = format!("approval:{}", state.approval_id);
        let value = serde_json::to_vec(state)?;
        self.db.insert(key.as_bytes(), value)?;
        self.db.flush()?;
        Ok(())
    }

    /// Load approval state
    pub fn load(&self, approval_id: &str) -> Result<Option<ApprovalState>> {
        let key = format!("approval:{}", approval_id);
        if let Some(value) = self.db.get(key.as_bytes())? {
            Ok(Some(serde_json::from_slice(&value)?))
        } else {
            Ok(None)
        }
    }

    /// Delete approval state
    pub fn delete(&self, approval_id: &str) -> Result<()> {
        let key = format!("approval:{}", approval_id);
        self.db.remove(key.as_bytes())?;
        self.db.flush()?;
        Ok(())
    }

    /// List all approval states
    pub fn list_all(&self) -> Result<Vec<ApprovalState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"approval:") {
            let (_, value) = item?;
            let state: ApprovalState = serde_json::from_slice(&value)?;
            states.push(state);
        }

        Ok(states)
    }

    /// List pending approvals
    pub fn list_pending(&self) -> Result<Vec<ApprovalState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"approval:") {
            let (_, value) = item?;
            let state: ApprovalState = serde_json::from_slice(&value)?;

            if state.is_pending() {
                states.push(state);
            }
        }

        Ok(states)
    }

    /// List approvals by status
    pub fn list_by_status(&self, status: ApprovalStatus) -> Result<Vec<ApprovalState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"approval:") {
            let (_, value) = item?;
            let state: ApprovalState = serde_json::from_slice(&value)?;

            if state.status == status {
                states.push(state);
            }
        }

        Ok(states)
    }

    /// List approvals by workflow ID
    pub fn list_by_workflow(&self, workflow_id: &str) -> Result<Vec<ApprovalState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"approval:") {
            let (_, value) = item?;
            let state: ApprovalState = serde_json::from_slice(&value)?;

            if state.workflow_id == workflow_id {
                states.push(state);
            }
        }

        Ok(states)
    }

    /// List timed out approvals
    pub fn list_timed_out(&self) -> Result<Vec<ApprovalState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"approval:") {
            let (_, value) = item?;
            let mut state: ApprovalState = serde_json::from_slice(&value)?;

            if state.is_timed_out() {
                // Update status to TimedOut
                state.status = ApprovalStatus::TimedOut;
                state.completed_at = Some(chrono::Utc::now());
                states.push(state);
            }
        }

        Ok(states)
    }

    /// List approvals pending for a specific approver
    pub fn list_pending_for_approver(&self, approver: &str) -> Result<Vec<ApprovalState>> {
        let mut states = Vec::new();

        for item in self.db.scan_prefix(b"approval:") {
            let (_, value) = item?;
            let state: ApprovalState = serde_json::from_slice(&value)?;

            if state.is_pending()
                && state.is_approver_authorized(approver)
                && !state.has_approver_responded(approver)
            {
                states.push(state);
            }
        }

        Ok(states)
    }
}

impl Default for ApprovalStore {
    fn default() -> Self {
        Self::new().expect("Failed to create default approval store")
    }
}
