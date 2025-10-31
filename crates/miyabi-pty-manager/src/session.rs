use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TerminalSession {
    pub id: String,
    pub cols: u16,
    pub rows: u16,
    pub cwd: String,
    pub shell: String,
    pub created_at: u64,
    pub managed_by: Option<String>, // "user" or "orchestrator:{agent_id}"
}

impl TerminalSession {
    pub fn new(
        cols: u16,
        rows: u16,
        cwd: String,
        shell: String,
        managed_by: Option<String>,
    ) -> Self {
        use std::time::{SystemTime, UNIX_EPOCH};

        let created_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        Self {
            id: Uuid::new_v4().to_string(),
            cols,
            rows,
            cwd,
            shell,
            created_at,
            managed_by,
        }
    }

    pub fn is_user_managed(&self) -> bool {
        self.managed_by.is_none()
    }

    pub fn is_orchestrator_managed(&self) -> bool {
        self.managed_by
            .as_ref()
            .map(|m| m.starts_with("orchestrator:"))
            .unwrap_or(false)
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionInfo {
    pub session: TerminalSession,
    pub is_alive: bool,
    pub exit_code: Option<u32>,
    pub uptime_seconds: u64,
}
