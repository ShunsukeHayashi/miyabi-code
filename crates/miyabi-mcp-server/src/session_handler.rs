//! Session Management RPC Handlers
//!
//! Implements the RPC handler methods for SessionManager operations.

use std::sync::Arc;
use uuid::Uuid;

use miyabi_session_manager::{SessionManager, SessionStatus};

use crate::error::{Result, ServerError};
use crate::session_rpc::*;

/// Session handler context
pub struct SessionHandler {
    session_manager: Arc<SessionManager>,
}

impl SessionHandler {
    /// Create new session handler
    pub async fn new(sessions_dir: &str) -> Result<Self> {
        let session_manager = SessionManager::new(sessions_dir)
            .await
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        Ok(Self {
            session_manager: Arc::new(session_manager),
        })
    }

    /// Spawn a new agent session
    pub async fn spawn_session(&self, params: SessionSpawnParams) -> Result<SessionSpawnResult> {
        tracing::info!(
            "Spawning session: agent={}, purpose={}",
            params.agent_name,
            params.purpose
        );

        let context = params.context.into();

        let session_id = self
            .session_manager
            .spawn_agent_session(&params.agent_name, &params.purpose, context)
            .await
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        // Get session to extract created_at (sync method)
        let session = self
            .session_manager
            .get_session(session_id)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        Ok(SessionSpawnResult {
            session_id: session_id.to_string(),
            agent_name: params.agent_name,
            created_at: session.created_at.to_rfc3339(),
        })
    }

    /// Handoff session to another agent
    pub async fn handoff_session(
        &self,
        params: SessionHandoffParams,
    ) -> Result<SessionHandoffResult> {
        let from_id = Uuid::parse_str(&params.from_session_id)
            .map_err(|_| ServerError::Internal("Invalid session UUID".to_string()))?;

        tracing::info!(
            "Handing off session {} to agent {}",
            from_id,
            params.to_agent
        );

        let context = params.updated_context.into();

        let new_session_id = self
            .session_manager
            .handoff(from_id, &params.to_agent, context)
            .await
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        // Get new session (sync method)
        let new_session = self
            .session_manager
            .get_session(new_session_id)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        Ok(SessionHandoffResult {
            new_session_id: new_session_id.to_string(),
            parent_session_id: params.from_session_id,
            agent_name: params.to_agent,
            created_at: new_session.created_at.to_rfc3339(),
        })
    }

    /// Monitor session status
    pub async fn monitor_session(
        &self,
        params: SessionMonitorParams,
    ) -> Result<SessionMonitorResult> {
        let session_id = Uuid::parse_str(&params.session_id)
            .map_err(|_| ServerError::Internal("Invalid session UUID".to_string()))?;

        // Get session (sync method)
        let session = self
            .session_manager
            .get_session(session_id)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        let is_running = matches!(session.status, SessionStatus::Active);
        let exit_code = None; // SessionStatus doesn't store exit_code

        Ok(SessionMonitorResult {
            session_id: params.session_id,
            status: format!("{:?}", session.status),
            agent_name: session.agent_name,
            is_running,
            exit_code,
            error_message: session.error_message,
        })
    }

    /// Terminate a running session
    pub async fn terminate_session(
        &self,
        params: SessionTerminateParams,
    ) -> Result<SessionTerminateResult> {
        let session_id = Uuid::parse_str(&params.session_id)
            .map_err(|_| ServerError::Internal("Invalid session UUID".to_string()))?;

        tracing::info!("Terminating session {}", session_id);

        // Check if session exists and is active (sync method)
        let session = self
            .session_manager
            .get_session(session_id)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        let was_active = matches!(session.status, SessionStatus::Active);

        // Mark as failed (SessionManager doesn't have terminate() method)
        if was_active {
            self.session_manager
                .fail_session(session_id, "Terminated by user".to_string())
                .await
                .map_err(|e| ServerError::Internal(e.to_string()))?;
        }

        Ok(SessionTerminateResult {
            session_id: params.session_id,
            terminated: was_active,
        })
    }

    /// List all sessions
    pub async fn list_sessions(&self, params: SessionListParams) -> Result<SessionListResult> {
        let status_filter = params.status.as_ref().and_then(|s| match s.as_str() {
            "active" | "running" => Some(SessionStatus::Active),
            "completed" => Some(SessionStatus::Completed),
            "failed" => Some(SessionStatus::Failed),
            "handed_off" => Some(SessionStatus::HandedOff),
            _ => None,
        });

        // Get active sessions (sync method)
        let all_sessions = self.session_manager.list_active_sessions();

        let filtered_sessions: Vec<_> = if let Some(filter_status) = status_filter {
            all_sessions
                .into_iter()
                .filter(|s| {
                    // Match status discriminant only (ignoring inner values)
                    std::mem::discriminant(&s.status) == std::mem::discriminant(&filter_status)
                })
                .take(params.limit)
                .collect()
        } else {
            all_sessions.into_iter().take(params.limit).collect()
        };

        let sessions: Vec<SessionInfo> = filtered_sessions
            .iter()
            .map(|s| SessionInfo {
                id: s.id.to_string(),
                agent_name: s.agent_name.clone(),
                purpose: s.purpose.clone(),
                status: format!("{:?}", s.status),
                created_at: s.created_at.to_rfc3339(),
                parent_session: s.parent_session.map(|id| id.to_string()),
            })
            .collect();

        let total = sessions.len();

        Ok(SessionListResult { sessions, total })
    }

    /// Get detailed session info
    pub async fn get_session(&self, params: SessionGetParams) -> Result<SessionGetResult> {
        let session_id = Uuid::parse_str(&params.session_id)
            .map_err(|_| ServerError::Internal("Invalid session UUID".to_string()))?;

        // Get session (sync method)
        let session = self
            .session_manager
            .get_session(session_id)
            .map_err(|e| ServerError::Internal(e.to_string()))?;

        Ok(SessionGetResult {
            id: session.id.to_string(),
            agent_name: session.agent_name,
            purpose: session.purpose,
            context: session.context.into(),
            status: format!("{:?}", session.status),
            created_at: session.created_at.to_rfc3339(),
            parent_session: session.parent_session.map(|id| id.to_string()),
            child_sessions: session
                .child_sessions
                .iter()
                .map(|id| id.to_string())
                .collect(),
            handoff_to: session.handoff_to,
            error_message: session.error_message,
        })
    }

    /// Get session statistics
    pub async fn get_stats(&self) -> Result<SessionStatsResult> {
        // Get stats (sync method)
        let stats = self.session_manager.get_stats();

        Ok(SessionStatsResult {
            total_sessions: stats.total,
            running_sessions: stats.active, // Map "active" to "running" for RPC
            completed_sessions: stats.completed,
            failed_sessions: stats.failed,
            handed_off_sessions: stats.handed_off,
        })
    }

    /// Get session lineage (ancestry tree)
    pub async fn get_lineage(&self, params: SessionLineageParams) -> Result<SessionLineageResult> {
        let session_id = Uuid::parse_str(&params.session_id)
            .map_err(|_| ServerError::Internal("Invalid session UUID".to_string()))?;

        // Get lineage (sync method - returns Vec, not Result)
        let lineage = self.session_manager.get_session_lineage(session_id);

        if lineage.is_empty() {
            return Err(ServerError::Internal(format!(
                "Session {} not found",
                session_id
            )));
        }

        // First session is root (parent)
        let root = SessionInfo {
            id: lineage[0].id.to_string(),
            agent_name: lineage[0].agent_name.clone(),
            purpose: lineage[0].purpose.clone(),
            status: format!("{:?}", lineage[0].status),
            created_at: lineage[0].created_at.to_rfc3339(),
            parent_session: lineage[0].parent_session.map(|id| id.to_string()),
        };

        // Rest are descendants
        let descendants: Vec<SessionInfo> = lineage
            .iter()
            .skip(1)
            .map(|s| SessionInfo {
                id: s.id.to_string(),
                agent_name: s.agent_name.clone(),
                purpose: s.purpose.clone(),
                status: format!("{:?}", s.status),
                created_at: s.created_at.to_rfc3339(),
                parent_session: s.parent_session.map(|id| id.to_string()),
            })
            .collect();

        let total = lineage.len();

        Ok(SessionLineageResult {
            root,
            descendants,
            total,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_session_handler_creation() {
        let temp_dir = tempfile::tempdir().unwrap();
        let handler = SessionHandler::new(temp_dir.path().to_str().unwrap()).await;
        assert!(handler.is_ok());
    }
}
