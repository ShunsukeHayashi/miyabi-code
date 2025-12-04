//! Tmux Integration for Claude Agent SDK
//!
//! Bridges the Miyabi tmux orchestration system with the Claude Agent SDK,
//! enabling parallel agent execution across tmux panes.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::process::Command;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::subagent::{SubagentConfig, SubagentId, SubagentStatus, AgentType};

/// Tmux session configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TmuxSessionConfig {
    /// Session name
    pub session_name: String,
    /// Number of windows
    pub window_count: usize,
    /// Panes per window
    pub panes_per_window: usize,
    /// Working directory
    pub working_dir: String,
    /// Shell command
    pub shell: String,
    /// Environment variables
    pub env_vars: HashMap<String, String>,
}

impl Default for TmuxSessionConfig {
    fn default() -> Self {
        Self {
            session_name: "miyabi-agents".to_string(),
            window_count: 1,
            panes_per_window: 4,
            working_dir: ".".to_string(),
            shell: "/bin/bash".to_string(),
            env_vars: HashMap::new(),
        }
    }
}

/// Tmux pane identifier
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct TmuxPane {
    /// Session name
    pub session: String,
    /// Window index
    pub window: usize,
    /// Pane index
    pub pane: usize,
}

impl TmuxPane {
    /// Create new pane identifier
    pub fn new(session: &str, window: usize, pane: usize) -> Self {
        Self {
            session: session.to_string(),
            window,
            pane,
        }
    }

    /// Get tmux target string
    pub fn target(&self) -> String {
        format!("{}:{}.{}", self.session, self.window, self.pane)
    }
}

/// Agent-to-pane mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentPaneMapping {
    /// Agent ID
    pub agent_id: SubagentId,
    /// Agent name
    pub agent_name: String,
    /// Agent type
    pub agent_type: AgentType,
    /// Assigned tmux pane
    pub pane: TmuxPane,
    /// Current status
    pub status: SubagentStatus,
    /// Last output capture
    pub last_output: Option<String>,
}

/// Tmux orchestrator for managing agents across panes
pub struct TmuxOrchestrator {
    /// Session configuration
    config: TmuxSessionConfig,
    /// Agent-to-pane mappings
    agents: RwLock<HashMap<SubagentId, AgentPaneMapping>>,
    /// Available panes pool
    available_panes: RwLock<Vec<TmuxPane>>,
    /// Message broadcast for inter-agent communication
    message_tx: tokio::sync::broadcast::Sender<AgentMessage>,
}

/// Inter-agent message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    /// Message ID
    pub id: Uuid,
    /// Source agent
    pub from: SubagentId,
    /// Target agent (None for broadcast)
    pub to: Option<SubagentId>,
    /// Message content
    pub content: String,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Tmux orchestrator error
#[derive(Debug, thiserror::Error)]
pub enum TmuxError {
    #[error("Tmux command failed: {0}")]
    CommandFailed(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("No available panes")]
    NoPanesAvailable,
    #[error("Agent not found: {0}")]
    AgentNotFound(SubagentId),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

impl TmuxOrchestrator {
    /// Create new orchestrator with configuration
    pub fn new(config: TmuxSessionConfig) -> Self {
        let (tx, _) = tokio::sync::broadcast::channel(1024);
        Self {
            config,
            agents: RwLock::new(HashMap::new()),
            available_panes: RwLock::new(Vec::new()),
            message_tx: tx,
        }
    }

    /// Initialize tmux session and panes
    pub async fn initialize(&self) -> Result<(), TmuxError> {
        // Check if session exists
        let session_exists = self.session_exists(&self.config.session_name).await?;
        
        if !session_exists {
            // Create new session
            self.create_session().await?;
        }

        // Initialize pane pool
        self.init_pane_pool().await?;

        Ok(())
    }

    /// Check if tmux session exists
    async fn session_exists(&self, name: &str) -> Result<bool, TmuxError> {
        let output = Command::new("tmux")
            .args(["has-session", "-t", name])
            .output()
            .await?;

        Ok(output.status.success())
    }

    /// Create tmux session
    async fn create_session(&self) -> Result<(), TmuxError> {
        let output = Command::new("tmux")
            .args([
                "new-session",
                "-d",
                "-s", &self.config.session_name,
                "-c", &self.config.working_dir,
            ])
            .output()
            .await?;

        if !output.status.success() {
            return Err(TmuxError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        // Create additional windows and panes
        for w in 0..self.config.window_count {
            if w > 0 {
                self.create_window(w).await?;
            }
            for p in 1..self.config.panes_per_window {
                self.create_pane(w, p).await?;
            }
        }

        Ok(())
    }

    /// Create new window
    async fn create_window(&self, index: usize) -> Result<(), TmuxError> {
        let output = Command::new("tmux")
            .args([
                "new-window",
                "-t", &format!("{}:{}", self.config.session_name, index),
                "-c", &self.config.working_dir,
            ])
            .output()
            .await?;

        if !output.status.success() {
            return Err(TmuxError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        Ok(())
    }

    /// Create new pane
    async fn create_pane(&self, window: usize, _pane: usize) -> Result<(), TmuxError> {
        let output = Command::new("tmux")
            .args([
                "split-window",
                "-t", &format!("{}:{}", self.config.session_name, window),
                "-c", &self.config.working_dir,
            ])
            .output()
            .await?;

        if !output.status.success() {
            return Err(TmuxError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        // Rebalance panes
        let _ = Command::new("tmux")
            .args([
                "select-layout",
                "-t", &format!("{}:{}", self.config.session_name, window),
                "tiled",
            ])
            .output()
            .await;

        Ok(())
    }

    /// Initialize pane pool
    async fn init_pane_pool(&self) -> Result<(), TmuxError> {
        let mut panes = self.available_panes.write().await;
        panes.clear();

        for w in 0..self.config.window_count {
            for p in 0..self.config.panes_per_window {
                panes.push(TmuxPane::new(&self.config.session_name, w, p));
            }
        }

        Ok(())
    }

    /// Spawn agent in a tmux pane
    pub async fn spawn_agent(&self, config: SubagentConfig) -> Result<SubagentId, TmuxError> {
        // Get available pane
        let pane = {
            let mut panes = self.available_panes.write().await;
            panes.pop().ok_or(TmuxError::NoPanesAvailable)?
        };

        let agent_id = Uuid::new_v4();
        
        // Create mapping
        let mapping = AgentPaneMapping {
            agent_id,
            agent_name: config.name.clone(),
            agent_type: config.agent_type.clone(),
            pane: pane.clone(),
            status: SubagentStatus::Initializing,
            last_output: None,
        };

        // Store mapping
        {
            let mut agents = self.agents.write().await;
            agents.insert(agent_id, mapping);
        }

        // Send initialization command to pane
        let init_cmd = format!(
            "echo '🤖 Agent {} ({}) initialized in pane {}'",
            config.name,
            config.agent_type,
            pane.target()
        );
        self.send_keys(&pane, &init_cmd).await?;

        // Update status
        self.update_agent_status(agent_id, SubagentStatus::Idle).await?;

        Ok(agent_id)
    }

    /// Send command to agent's pane
    pub async fn send_command(&self, agent_id: SubagentId, command: &str) -> Result<(), TmuxError> {
        let agents = self.agents.read().await;
        let mapping = agents.get(&agent_id)
            .ok_or(TmuxError::AgentNotFound(agent_id))?;

        self.send_keys(&mapping.pane, command).await?;

        // Update status
        drop(agents);
        self.update_agent_status(agent_id, SubagentStatus::Running).await?;

        Ok(())
    }

    /// Send keys to tmux pane
    async fn send_keys(&self, pane: &TmuxPane, keys: &str) -> Result<(), TmuxError> {
        let output = Command::new("tmux")
            .args([
                "send-keys",
                "-t", &pane.target(),
                keys,
                "Enter",
            ])
            .output()
            .await?;

        if !output.status.success() {
            return Err(TmuxError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        Ok(())
    }

    /// Capture pane output
    pub async fn capture_output(&self, agent_id: SubagentId, lines: usize) -> Result<String, TmuxError> {
        let agents = self.agents.read().await;
        let mapping = agents.get(&agent_id)
            .ok_or(TmuxError::AgentNotFound(agent_id))?;

        let output = Command::new("tmux")
            .args([
                "capture-pane",
                "-t", &mapping.pane.target(),
                "-p",
                "-S", &format!("-{}", lines),
            ])
            .output()
            .await?;

        if !output.status.success() {
            return Err(TmuxError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        let captured = String::from_utf8_lossy(&output.stdout).to_string();

        // Update last output
        drop(agents);
        {
            let mut agents = self.agents.write().await;
            if let Some(mapping) = agents.get_mut(&agent_id) {
                mapping.last_output = Some(captured.clone());
            }
        }

        Ok(captured)
    }

    /// Update agent status
    async fn update_agent_status(&self, agent_id: SubagentId, status: SubagentStatus) -> Result<(), TmuxError> {
        let mut agents = self.agents.write().await;
        if let Some(mapping) = agents.get_mut(&agent_id) {
            mapping.status = status;
        }
        Ok(())
    }

    /// Get agent status
    pub async fn get_agent_status(&self, agent_id: SubagentId) -> Result<SubagentStatus, TmuxError> {
        let agents = self.agents.read().await;
        let mapping = agents.get(&agent_id)
            .ok_or(TmuxError::AgentNotFound(agent_id))?;
        Ok(mapping.status)
    }

    /// List all agents
    pub async fn list_agents(&self) -> Vec<AgentPaneMapping> {
        let agents = self.agents.read().await;
        agents.values().cloned().collect()
    }

    /// Stop agent and release pane
    pub async fn stop_agent(&self, agent_id: SubagentId) -> Result<(), TmuxError> {
        let mut agents = self.agents.write().await;
        
        if let Some(mapping) = agents.remove(&agent_id) {
            // Send interrupt signal
            let _ = Command::new("tmux")
                .args([
                    "send-keys",
                    "-t", &mapping.pane.target(),
                    "C-c",
                ])
                .output()
                .await;

            // Return pane to pool
            let mut panes = self.available_panes.write().await;
            panes.push(mapping.pane);
        }

        Ok(())
    }

    /// Broadcast message to all agents
    pub async fn broadcast(&self, from: SubagentId, content: &str) -> Result<(), TmuxError> {
        let message = AgentMessage {
            id: Uuid::new_v4(),
            from,
            to: None,
            content: content.to_string(),
            timestamp: chrono::Utc::now(),
        };

        let _ = self.message_tx.send(message);

        // Send to all panes
        let agents = self.agents.read().await;
        for mapping in agents.values() {
            let cmd = format!("echo '[BROADCAST from {}]: {}'", from, content);
            let _ = self.send_keys(&mapping.pane, &cmd).await;
        }

        Ok(())
    }

    /// Send message to specific agent
    pub async fn send_message(&self, from: SubagentId, to: SubagentId, content: &str) -> Result<(), TmuxError> {
        let message = AgentMessage {
            id: Uuid::new_v4(),
            from,
            to: Some(to),
            content: content.to_string(),
            timestamp: chrono::Utc::now(),
        };

        let _ = self.message_tx.send(message);

        // Send to target pane
        let agents = self.agents.read().await;
        if let Some(mapping) = agents.get(&to) {
            let cmd = format!("echo '[MESSAGE from {}]: {}'", from, content);
            self.send_keys(&mapping.pane, &cmd).await?;
        }

        Ok(())
    }

    /// Subscribe to messages
    pub fn subscribe(&self) -> tokio::sync::broadcast::Receiver<AgentMessage> {
        self.message_tx.subscribe()
    }

    /// Kill entire session
    pub async fn shutdown(&self) -> Result<(), TmuxError> {
        let output = Command::new("tmux")
            .args(["kill-session", "-t", &self.config.session_name])
            .output()
            .await?;

        if !output.status.success() {
            return Err(TmuxError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string()
            ));
        }

        // Clear internal state
        {
            let mut agents = self.agents.write().await;
            agents.clear();
        }
        {
            let mut panes = self.available_panes.write().await;
            panes.clear();
        }

        Ok(())
    }
}

/// Builder for creating tmux orchestrator
pub struct TmuxOrchestratorBuilder {
    config: TmuxSessionConfig,
}

impl TmuxOrchestratorBuilder {
    pub fn new() -> Self {
        Self {
            config: TmuxSessionConfig::default(),
        }
    }

    pub fn session_name(mut self, name: &str) -> Self {
        self.config.session_name = name.to_string();
        self
    }

    pub fn window_count(mut self, count: usize) -> Self {
        self.config.window_count = count;
        self
    }

    pub fn panes_per_window(mut self, count: usize) -> Self {
        self.config.panes_per_window = count;
        self
    }

    pub fn working_dir(mut self, dir: &str) -> Self {
        self.config.working_dir = dir.to_string();
        self
    }

    pub fn env_var(mut self, key: &str, value: &str) -> Self {
        self.config.env_vars.insert(key.to_string(), value.to_string());
        self
    }

    pub fn build(self) -> TmuxOrchestrator {
        TmuxOrchestrator::new(self.config)
    }
}

impl Default for TmuxOrchestratorBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tmux_pane_target() {
        let pane = TmuxPane::new("test-session", 0, 1);
        assert_eq!(pane.target(), "test-session:0.1");
    }

    #[test]
    fn test_session_config_default() {
        let config = TmuxSessionConfig::default();
        assert_eq!(config.session_name, "miyabi-agents");
        assert_eq!(config.window_count, 1);
        assert_eq!(config.panes_per_window, 4);
    }

    #[test]
    fn test_builder() {
        let orchestrator = TmuxOrchestratorBuilder::new()
            .session_name("test")
            .window_count(2)
            .panes_per_window(3)
            .working_dir("/tmp")
            .env_var("RUST_LOG", "debug")
            .build();

        assert_eq!(orchestrator.config.session_name, "test");
        assert_eq!(orchestrator.config.window_count, 2);
        assert_eq!(orchestrator.config.panes_per_window, 3);
    }
}
