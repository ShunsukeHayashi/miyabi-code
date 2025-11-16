//! Agent configuration and management

use serde::{Deserialize, Serialize};

/// Agent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// Agent type (e.g., "video-generator")
    pub agent_type: String,
    /// Startup command (e.g., "claude")
    pub startup_command: String,
    /// Working directory pattern (can use {segment_id} placeholder)
    pub working_dir_pattern: String,
    /// Startup timeout in seconds
    pub startup_timeout: u64,
    /// Additional environment variables
    pub env_vars: std::collections::HashMap<String, String>,
}

impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            agent_type: "video-generator".to_string(),
            startup_command: "claude".to_string(),
            working_dir_pattern:
                "/Users/shunsuke/Dev/miyabi-private/.worktrees/segment-{segment_id}".to_string(),
            startup_timeout: 30,
            env_vars: std::collections::HashMap::new(),
        }
    }
}

impl AgentConfig {
    /// Create a new agent configuration
    pub fn new(agent_type: String) -> Self {
        Self {
            agent_type,
            ..Self::default()
        }
    }

    /// Get working directory for a specific segment
    pub fn get_working_dir(&self, segment_id: u32) -> String {
        self.working_dir_pattern.replace("{segment_id}", &segment_id.to_string())
    }

    /// Build startup command for tmux
    pub fn build_startup_command(&self, segment_id: u32) -> String {
        let working_dir = self.get_working_dir(segment_id);
        format!("cd '{}' && {}", working_dir, self.startup_command)
    }
}

/// Agent definition
#[derive(Debug, Clone)]
pub struct Agent {
    /// Agent configuration
    pub config: AgentConfig,
}

impl Agent {
    /// Create a new agent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate startup command for a segment
    pub fn startup_command(&self, segment_id: u32) -> String {
        self.config.build_startup_command(segment_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_config_default() {
        let config = AgentConfig::default();
        assert_eq!(config.agent_type, "video-generator");
        assert_eq!(config.startup_command, "claude");
        assert_eq!(config.startup_timeout, 30);
    }

    #[test]
    fn test_agent_config_working_dir() {
        let config = AgentConfig::default();
        let working_dir = config.get_working_dir(5);
        assert!(working_dir.contains("segment-5"));
    }

    #[test]
    fn test_agent_config_startup_command() {
        let config = AgentConfig::default();
        let command = config.build_startup_command(10);
        assert!(command.starts_with("cd"));
        assert!(command.contains("segment-10"));
        assert!(command.ends_with("&& claude"));
    }

    #[test]
    fn test_agent_startup_command() {
        let config = AgentConfig::new("custom-agent".to_string());
        let agent = Agent::new(config);
        let command = agent.startup_command(0);
        assert!(command.contains("segment-0"));
        assert!(command.contains("claude"));
    }
}
