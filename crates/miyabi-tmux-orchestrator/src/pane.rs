//! Pane management module

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Pane status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaneStatus {
    /// Pane created but agent not started
    Idle,
    /// Agent starting
    Starting,
    /// Agent running and ready
    Ready,
    /// Agent processing task
    Processing,
    /// Agent finished task successfully
    Completed,
    /// Agent encountered error
    Failed,
}

/// Tmux pane representation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pane {
    /// Internal pane ID
    pub id: Uuid,
    /// Tmux pane ID (e.g., "%1", "%2")
    pub tmux_pane_id: String,
    /// Segment ID this pane is responsible for
    pub segment_id: u32,
    /// Current status
    pub status: PaneStatus,
    /// Working directory
    pub working_dir: String,
    /// Agent type (e.g., "video-generator")
    pub agent_type: String,
    /// Creation timestamp
    pub created_at: chrono::DateTime<chrono::Utc>,
    /// Last update timestamp
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

impl Pane {
    /// Create a new pane
    pub fn new(tmux_pane_id: String, segment_id: u32, working_dir: String, agent_type: String) -> Self {
        let now = chrono::Utc::now();
        Self {
            id: Uuid::new_v4(),
            tmux_pane_id,
            segment_id,
            status: PaneStatus::Idle,
            working_dir,
            agent_type,
            created_at: now,
            updated_at: now,
        }
    }

    /// Update pane status
    pub fn update_status(&mut self, status: PaneStatus) {
        self.status = status;
        self.updated_at = chrono::Utc::now();
    }

    /// Check if pane is terminal (completed or failed)
    pub fn is_terminal(&self) -> bool {
        matches!(self.status, PaneStatus::Completed | PaneStatus::Failed)
    }

    /// Check if pane is ready for work
    pub fn is_ready(&self) -> bool {
        self.status == PaneStatus::Ready
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pane_creation() {
        let pane = Pane::new("%1".to_string(), 0, "/tmp/work".to_string(), "video-generator".to_string());
        assert_eq!(pane.tmux_pane_id, "%1");
        assert_eq!(pane.segment_id, 0);
        assert_eq!(pane.status, PaneStatus::Idle);
        assert_eq!(pane.agent_type, "video-generator");
    }

    #[test]
    fn test_pane_status_update() {
        let mut pane = Pane::new("%1".to_string(), 0, "/tmp".to_string(), "agent".to_string());
        assert_eq!(pane.status, PaneStatus::Idle);

        pane.update_status(PaneStatus::Ready);
        assert_eq!(pane.status, PaneStatus::Ready);
    }

    #[test]
    fn test_pane_is_terminal() {
        let mut pane = Pane::new("%1".to_string(), 0, "/tmp".to_string(), "agent".to_string());
        assert!(!pane.is_terminal());

        pane.update_status(PaneStatus::Completed);
        assert!(pane.is_terminal());

        pane.update_status(PaneStatus::Failed);
        assert!(pane.is_terminal());
    }

    #[test]
    fn test_pane_is_ready() {
        let mut pane = Pane::new("%1".to_string(), 0, "/tmp".to_string(), "agent".to_string());
        assert!(!pane.is_ready());

        pane.update_status(PaneStatus::Ready);
        assert!(pane.is_ready());
    }
}
