//! Tmux session management

use crate::{Agent, AgentConfig, Pane, PaneStatus, Result, TmuxError};
use std::collections::HashMap;
use std::process::Command;
use tracing::{debug, info, warn};
use uuid::Uuid;

/// Tmux session orchestrator
#[derive(Debug)]
pub struct TmuxSession {
    /// Session ID
    pub id: Uuid,
    /// Session name
    pub session_name: String,
    /// Panes managed by this session
    pub panes: HashMap<String, Pane>,
    /// Agent configuration
    pub agent_config: AgentConfig,
}

impl TmuxSession {
    /// Create a new tmux session
    ///
    /// # Arguments
    /// * `session_name` - Name for the tmux session
    /// * `agent_config` - Configuration for agents in each pane
    ///
    /// # Returns
    /// * `Result<Self>` - New session instance
    pub fn new(session_name: String, agent_config: AgentConfig) -> Result<Self> {
        info!("Creating new tmux session: {}", session_name);

        // Check if session already exists
        let check = Command::new("tmux").args(["has-session", "-t", &session_name]).status()?;

        if check.success() {
            warn!("Session {} already exists, killing it", session_name);
            Command::new("tmux").args(["kill-session", "-t", &session_name]).status()?;
        }

        // Create new session (detached)
        let output = Command::new("tmux")
            .args([
                "new-session",
                "-d",
                "-s",
                &session_name,
                "-P",
                "-F",
                "#{pane_id}",
            ])
            .output()?;

        if !output.status.success() {
            return Err(TmuxError::SessionCreationFailed(
                String::from_utf8_lossy(&output.stderr).to_string(),
            ));
        }

        Ok(Self {
            id: Uuid::new_v4(),
            session_name,
            panes: HashMap::new(),
            agent_config,
        })
    }

    /// Create panes for all segments
    ///
    /// # Arguments
    /// * `segment_count` - Total number of segments (default: 120)
    ///
    /// # Returns
    /// * `Result<()>` - Success or error
    pub async fn create_panes(&mut self, segment_count: u32) -> Result<()> {
        info!("Creating {} panes for segments", segment_count);

        for segment_id in 0..segment_count {
            let pane_id = if segment_id == 0 {
                // First pane already exists (the initial session pane)
                self.get_initial_pane_id()?
            } else {
                // Create new pane by splitting
                self.create_pane()?
            };

            let working_dir = self.agent_config.get_working_dir(segment_id);
            let pane = Pane::new(
                pane_id.clone(),
                segment_id,
                working_dir,
                self.agent_config.agent_type.clone(),
            );

            self.panes.insert(pane_id, pane);

            if (segment_id + 1) % 10 == 0 {
                debug!("Created {} panes", segment_id + 1);
            }
        }

        info!("Successfully created {} panes", segment_count);
        Ok(())
    }

    /// Get the initial pane ID (for the first segment)
    fn get_initial_pane_id(&self) -> Result<String> {
        let output = Command::new("tmux")
            .args(["list-panes", "-t", &self.session_name, "-F", "#{pane_id}"])
            .output()?;

        if !output.status.success() {
            return Err(TmuxError::PaneCreationFailed("Failed to get initial pane ID".to_string()));
        }

        let pane_id = String::from_utf8_lossy(&output.stdout)
            .trim()
            .lines()
            .next()
            .ok_or_else(|| TmuxError::PaneNotFound("initial pane".to_string()))?
            .to_string();

        Ok(pane_id)
    }

    /// Create a new pane by splitting
    fn create_pane(&self) -> Result<String> {
        let output = Command::new("tmux")
            .args([
                "split-window",
                "-t",
                &self.session_name,
                "-P",
                "-F",
                "#{pane_id}",
            ])
            .output()?;

        if !output.status.success() {
            return Err(TmuxError::PaneCreationFailed(
                String::from_utf8_lossy(&output.stderr).to_string(),
            ));
        }

        let pane_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(pane_id)
    }

    /// Start agent in a specific pane
    ///
    /// # Arguments
    /// * `pane_id` - Tmux pane ID
    ///
    /// # Returns
    /// * `Result<()>` - Success or error
    pub async fn start_agent(&mut self, pane_id: &str) -> Result<()> {
        // Get segment_id first to avoid borrow issues
        let segment_id = self
            .panes
            .get(pane_id)
            .ok_or_else(|| TmuxError::PaneNotFound(pane_id.to_string()))?
            .segment_id;

        info!("Starting agent in pane {} for segment {}", pane_id, segment_id);

        // Update status to Starting
        if let Some(pane) = self.panes.get_mut(pane_id) {
            pane.update_status(PaneStatus::Starting);
        }

        // Generate command
        let agent = Agent::new(self.agent_config.clone());
        let command = agent.startup_command(segment_id);

        // Send command to pane with proper escaping
        self.send_keys(pane_id, &command).await?;

        // Update status to Ready
        if let Some(pane) = self.panes.get_mut(pane_id) {
            pane.update_status(PaneStatus::Ready);
        }

        debug!("Agent started successfully in pane {}", pane_id);

        Ok(())
    }

    /// Send keys to a specific pane
    ///
    /// # Arguments
    /// * `pane_id` - Tmux pane ID
    /// * `keys` - Keys to send
    ///
    /// # Returns
    /// * `Result<()>` - Success or error
    pub async fn send_keys(&self, pane_id: &str, keys: &str) -> Result<()> {
        debug!("Sending keys to pane {}: {}", pane_id, keys);

        let status = Command::new("tmux").args(["send-keys", "-t", pane_id, keys]).status()?;

        if !status.success() {
            return Err(TmuxError::CommandExecutionFailed(format!(
                "Failed to send keys to pane {}",
                pane_id
            )));
        }

        // Send Enter key
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        let status = Command::new("tmux").args(["send-keys", "-t", pane_id, "Enter"]).status()?;

        if !status.success() {
            return Err(TmuxError::CommandExecutionFailed(format!(
                "Failed to send Enter to pane {}",
                pane_id
            )));
        }

        Ok(())
    }

    /// Get pane status
    pub fn get_pane_status(&self, pane_id: &str) -> Option<PaneStatus> {
        self.panes.get(pane_id).map(|p| p.status)
    }

    /// Count panes by status
    pub fn count_by_status(&self, status: PaneStatus) -> usize {
        self.panes.values().filter(|p| p.status == status).count()
    }

    /// Check if all panes are terminal
    pub fn all_terminal(&self) -> bool {
        self.panes.values().all(|p| p.is_terminal())
    }

    /// Cleanup session
    pub fn cleanup(&self) -> Result<()> {
        info!("Cleaning up tmux session: {}", self.session_name);

        let status =
            Command::new("tmux").args(["kill-session", "-t", &self.session_name]).status()?;

        if !status.success() {
            warn!("Failed to kill session {}", self.session_name);
        }

        Ok(())
    }
}

impl Drop for TmuxSession {
    fn drop(&mut self) {
        if let Err(e) = self.cleanup() {
            warn!("Error during session cleanup: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_creation() {
        // Note: This test requires tmux to be installed
        // Skip if tmux is not available
        if Command::new("tmux").arg("-V").status().is_err() {
            return;
        }

        let config = AgentConfig::default();
        let session = TmuxSession::new("test-session".to_string(), config);

        if let Ok(session) = session {
            // Cleanup
            let _ = session.cleanup();
        }
    }

    #[test]
    fn test_pane_status_count() {
        let config = AgentConfig::default();
        let mut session = TmuxSession {
            id: Uuid::new_v4(),
            session_name: "test".to_string(),
            panes: HashMap::new(),
            agent_config: config.clone(),
        };

        // Add test panes
        let pane1 = Pane::new("%1".to_string(), 0, "/tmp".to_string(), "agent".to_string());
        let mut pane2 = Pane::new("%2".to_string(), 1, "/tmp".to_string(), "agent".to_string());
        pane2.update_status(PaneStatus::Completed);

        session.panes.insert("%1".to_string(), pane1);
        session.panes.insert("%2".to_string(), pane2);

        assert_eq!(session.count_by_status(PaneStatus::Idle), 1);
        assert_eq!(session.count_by_status(PaneStatus::Completed), 1);
        assert!(!session.all_terminal());
    }
}
