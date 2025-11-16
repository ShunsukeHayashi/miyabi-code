//! Session manager for headless Claude Code execution

use crate::error::{Result, SchedulerError};
use crate::launcher::launch_claude_headless;
use crate::parser::{parse_agent_result, parse_error_logs, AgentResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::process::Child;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};
use uuid::Uuid;

/// Session ID (UUID v4)
pub type SessionId = String;

/// Session status
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum SessionStatus {
    /// Session is pending (not yet started)
    Pending,
    /// Session is running
    Running,
    /// Session completed successfully
    Completed,
    /// Session failed
    Failed,
    /// Session timed out
    TimedOut,
}

/// Session information
#[derive(Debug)]
#[allow(dead_code)]
struct Session {
    /// Session ID
    id: SessionId,
    /// Process handle
    child: Child,
    /// Status
    status: SessionStatus,
    /// Command executed
    command: String,
    /// Working directory (Worktree path)
    cwd: PathBuf,
    /// Output file path
    output_file: PathBuf,
    /// Result file path
    result_file: PathBuf,
}

/// Session configuration
#[derive(Debug, Clone)]
pub struct SessionConfig {
    /// Timeout duration (seconds)
    pub timeout_secs: u64,
    /// Base directory for logs
    pub log_dir: PathBuf,
}

impl Default for SessionConfig {
    fn default() -> Self {
        Self {
            timeout_secs: 1800, // 30 minutes
            log_dir: PathBuf::from(".ai/logs/sessions"),
        }
    }
}

/// Session Manager
///
/// Manages multiple Claude Code headless sessions with monitoring and result collection.
pub struct SessionManager {
    sessions: Arc<RwLock<HashMap<SessionId, Session>>>,
    config: SessionConfig,
}

impl SessionManager {
    /// Create a new SessionManager
    pub fn new(config: SessionConfig) -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
            config,
        }
    }

    /// Spawn a new headless Claude Code session
    ///
    /// # Arguments
    ///
    /// * `command` - The command to execute (e.g., "/agent-run --issue 270")
    /// * `worktree_path` - Working directory (Worktree path)
    ///
    /// # Returns
    ///
    /// Returns a `SessionId` for monitoring and result collection
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_scheduler::session::{SessionManager, SessionConfig};
    /// use std::path::PathBuf;
    ///
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let mut manager = SessionManager::new(SessionConfig::default());
    /// let session_id = manager.spawn_headless(
    ///     "/agent-run --issue 270".to_string(),
    ///     PathBuf::from(".worktrees/issue-270"),
    /// ).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn spawn_headless(
        &mut self,
        command: String,
        worktree_path: PathBuf,
    ) -> Result<SessionId> {
        let session_id = Uuid::new_v4().to_string();
        info!("Spawning headless session: id={}, command={}", session_id, command);

        // Create session log directory
        let session_log_dir = self.config.log_dir.join(&session_id);
        tokio::fs::create_dir_all(&session_log_dir).await?;

        let output_file = session_log_dir.join("output.log");
        let result_file = session_log_dir.join("result.json");

        // Launch process
        let child =
            launch_claude_headless(command.clone(), worktree_path.clone(), output_file.clone())
                .await?;

        // Store session
        let session = Session {
            id: session_id.clone(),
            child,
            status: SessionStatus::Running,
            command,
            cwd: worktree_path,
            output_file,
            result_file,
        };

        let mut sessions = self.sessions.write().await;
        sessions.insert(session_id.clone(), session);

        info!("Session spawned successfully: id={}", session_id);

        Ok(session_id)
    }

    /// Monitor session status
    ///
    /// # Arguments
    ///
    /// * `session_id` - Session ID to monitor
    ///
    /// # Returns
    ///
    /// Returns the current `SessionStatus`
    ///
    /// # Errors
    ///
    /// Returns `SchedulerError::SessionNotFound` if session doesn't exist
    pub async fn monitor_session(&self, session_id: &str) -> Result<SessionStatus> {
        debug!("Monitoring session: id={}", session_id);

        let mut sessions = self.sessions.write().await;
        let session = sessions
            .get_mut(session_id)
            .ok_or_else(|| SchedulerError::SessionNotFound(session_id.to_string()))?;

        // Check if process is still running
        match session.child.try_wait() {
            Ok(Some(status)) => {
                // Process has exited
                let new_status = if status.success() {
                    SessionStatus::Completed
                } else {
                    SessionStatus::Failed
                };
                debug!("Session {} exited with status: {:?}", session_id, new_status);
                session.status = new_status.clone();
                Ok(new_status)
            },
            Ok(None) => {
                // Still running
                debug!("Session {} is still running", session_id);
                Ok(SessionStatus::Running)
            },
            Err(e) => {
                warn!("Failed to check session status: {}", e);
                Err(SchedulerError::Io(e))
            },
        }
    }

    /// Wait for session to complete with timeout
    ///
    /// # Arguments
    ///
    /// * `session_id` - Session ID to wait for
    ///
    /// # Returns
    ///
    /// Returns `SessionStatus` when session completes or times out
    pub async fn wait_for_completion(&self, session_id: &str) -> Result<SessionStatus> {
        let timeout = Duration::from_secs(self.config.timeout_secs);
        let start = std::time::Instant::now();

        loop {
            let status = self.monitor_session(session_id).await?;

            match status {
                SessionStatus::Completed | SessionStatus::Failed | SessionStatus::TimedOut => {
                    return Ok(status);
                },
                SessionStatus::Running => {
                    if start.elapsed() > timeout {
                        warn!(
                            "Session {} timed out after {} seconds",
                            session_id, self.config.timeout_secs
                        );

                        // Kill the process
                        let mut sessions = self.sessions.write().await;
                        if let Some(session) = sessions.get_mut(session_id) {
                            let _ = session.child.kill().await;
                            session.status = SessionStatus::TimedOut;
                        }

                        return Err(SchedulerError::Timeout(self.config.timeout_secs));
                    }

                    // Wait before next check
                    tokio::time::sleep(Duration::from_secs(1)).await;
                },
                SessionStatus::Pending => {
                    warn!("Session {} is in Pending state during wait", session_id);
                    tokio::time::sleep(Duration::from_secs(1)).await;
                },
            }
        }
    }

    /// Collect session result
    ///
    /// # Arguments
    ///
    /// * `session_id` - Session ID
    ///
    /// # Returns
    ///
    /// Returns the `AgentResult` from the session
    ///
    /// # Errors
    ///
    /// Returns error if:
    /// - Session not found
    /// - Session still running
    /// - Result file not found or invalid
    pub async fn collect_result(&self, session_id: &str) -> Result<AgentResult> {
        info!("Collecting result for session: id={}", session_id);

        let sessions = self.sessions.read().await;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| SchedulerError::SessionNotFound(session_id.to_string()))?;

        // Check status
        if session.status == SessionStatus::Running || session.status == SessionStatus::Pending {
            return Err(SchedulerError::InvalidConfig(format!(
                "Session {} is still running, cannot collect result yet",
                session_id
            )));
        }

        // Parse result file
        let result = parse_agent_result(session.result_file.clone()).await?;

        // If failed, also parse error logs
        if !result.success {
            match parse_error_logs(session.output_file.clone()).await {
                Ok(errors) => {
                    debug!("Error logs:\n{}", errors);
                },
                Err(e) => {
                    warn!("Failed to parse error logs: {}", e);
                },
            }
        }

        info!("Result collected: session={}, success={}", session_id, result.success);

        Ok(result)
    }

    /// Get session statistics
    pub async fn get_stats(&self) -> HashMap<SessionStatus, usize> {
        let sessions = self.sessions.read().await;
        let mut stats = HashMap::new();

        for session in sessions.values() {
            *stats.entry(session.status.clone()).or_insert(0) += 1;
        }

        stats
    }

    /// Remove completed/failed sessions from memory
    pub async fn cleanup(&mut self) -> usize {
        let mut sessions = self.sessions.write().await;
        let initial_count = sessions.len();

        sessions.retain(|_, session| {
            matches!(session.status, SessionStatus::Running | SessionStatus::Pending)
        });

        let removed = initial_count - sessions.len();
        info!("Cleaned up {} sessions", removed);
        removed
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    async fn test_session_manager_creation() {
        let config = SessionConfig::default();
        let manager = SessionManager::new(config);
        let stats = manager.get_stats().await;
        assert_eq!(stats.len(), 0);
    }

    #[tokio::test]
    async fn test_session_id_generation() {
        let id1 = Uuid::new_v4().to_string();
        let id2 = Uuid::new_v4().to_string();
        assert_ne!(id1, id2);
        assert_eq!(id1.len(), 36); // UUID v4 length
    }

    #[tokio::test]
    async fn test_cleanup() {
        let temp_dir = tempdir().unwrap();
        let config = SessionConfig {
            timeout_secs: 30,
            log_dir: temp_dir.path().to_path_buf(),
        };
        let mut manager = SessionManager::new(config);

        // Initially no sessions
        let removed = manager.cleanup().await;
        assert_eq!(removed, 0);
    }
}
