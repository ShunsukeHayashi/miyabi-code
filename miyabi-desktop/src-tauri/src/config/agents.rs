//! Agent Configuration Parser
//!
//! Parses YAML configuration files for external coding agents.

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Single agent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// Agent name (e.g., "Cloud Code")
    pub agent: String,
    /// Tmux session name (e.g., "cloud-code-session")
    pub session_name: String,
    /// Agent description
    pub description: String,
    /// Shell command to execute in tmux session
    pub command: String,
}

/// Root configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentsConfig {
    /// List of coding agents
    pub coding_agents: Vec<AgentConfig>,
}

impl AgentsConfig {
    /// Load configuration from YAML file
    ///
    /// # Arguments
    /// * `path` - Path to the YAML configuration file
    ///
    /// # Returns
    /// * `Ok(AgentsConfig)` - Parsed configuration
    /// * `Err(String)` - If loading or parsing failed
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self, String> {
        let path_ref = path.as_ref();

        // Read file contents
        let contents = fs::read_to_string(path_ref)
            .map_err(|e| format!("Failed to read config file {:?}: {}", path_ref, e))?;

        // Parse YAML
        let config: AgentsConfig =
            serde_yaml::from_str(&contents).map_err(|e| format!("Failed to parse YAML: {}", e))?;

        // Validate configuration
        config.validate()?;

        Ok(config)
    }

    /// Validate the configuration
    ///
    /// # Returns
    /// * `Ok(())` if configuration is valid
    /// * `Err(String)` if validation failed
    pub fn validate(&self) -> Result<(), String> {
        if self.coding_agents.is_empty() {
            return Err("No agents defined in configuration".to_string());
        }

        for agent in &self.coding_agents {
            // Validate agent name
            if agent.agent.trim().is_empty() {
                return Err("Agent name cannot be empty".to_string());
            }

            // Validate session name
            if agent.session_name.trim().is_empty() {
                return Err(format!(
                    "Session name for agent '{}' cannot be empty",
                    agent.agent
                ));
            }

            // Check for invalid characters in session name
            if agent.session_name.contains(' ') || agent.session_name.contains(':') {
                return Err(format!(
                    "Session name '{}' contains invalid characters (spaces or colons not allowed)",
                    agent.session_name
                ));
            }

            // Validate command
            if agent.command.trim().is_empty() {
                return Err(format!(
                    "Command for agent '{}' cannot be empty",
                    agent.agent
                ));
            }

            // Security check: Warn about dangerous commands
            Self::check_command_safety(&agent.command, &agent.agent)?;
        }

        // Check for duplicate session names
        let mut seen_names = std::collections::HashSet::new();
        for agent in &self.coding_agents {
            if !seen_names.insert(&agent.session_name) {
                return Err(format!("Duplicate session name: '{}'", agent.session_name));
            }
        }

        Ok(())
    }

    /// Check command for potentially dangerous operations
    ///
    /// # Arguments
    /// * `command` - Command to check
    /// * `agent_name` - Name of the agent (for error messages)
    ///
    /// # Returns
    /// * `Ok(())` if command appears safe
    /// * `Err(String)` if command contains dangerous patterns
    fn check_command_safety(command: &str, agent_name: &str) -> Result<(), String> {
        // List of dangerous command patterns
        let dangerous_patterns = [
            "rm -rf /",
            "dd if=/dev/zero",
            ":(){ :|:& };:", // Fork bomb
            "mkfs",
            "format",
        ];

        for pattern in &dangerous_patterns {
            if command.contains(pattern) {
                return Err(format!(
                    "Command for agent '{}' contains dangerous pattern: '{}'",
                    agent_name, pattern
                ));
            }
        }

        Ok(())
    }

    /// Get agent configuration by name
    ///
    /// # Arguments
    /// * `agent_name` - Name of the agent to find
    ///
    /// # Returns
    /// * `Some(AgentConfig)` if found
    /// * `None` if not found
    pub fn get_agent(&self, agent_name: &str) -> Option<&AgentConfig> {
        self.coding_agents
            .iter()
            .find(|agent| agent.agent == agent_name)
    }

    /// Get agent configuration by session name
    ///
    /// # Arguments
    /// * `session_name` - Session name to find
    ///
    /// # Returns
    /// * `Some(AgentConfig)` if found
    /// * `None` if not found
    pub fn get_agent_by_session(&self, session_name: &str) -> Option<&AgentConfig> {
        self.coding_agents
            .iter()
            .find(|agent| agent.session_name == session_name)
    }

    /// List all agent names
    ///
    /// # Returns
    /// * Vector of agent names
    pub fn list_agent_names(&self) -> Vec<String> {
        self.coding_agents
            .iter()
            .map(|agent| agent.agent.clone())
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_load_valid_config() {
        let yaml_content = r#"
coding_agents:
  - agent: "Test Agent"
    session_name: "test-session"
    description: "Test description"
    command: "echo hello"
"#;

        let mut temp_file = NamedTempFile::new().unwrap();
        temp_file.write_all(yaml_content.as_bytes()).unwrap();

        let config = AgentsConfig::load_from_file(temp_file.path()).unwrap();

        assert_eq!(config.coding_agents.len(), 1);
        assert_eq!(config.coding_agents[0].agent, "Test Agent");
        assert_eq!(config.coding_agents[0].session_name, "test-session");
    }

    #[test]
    fn test_validate_empty_agents() {
        let config = AgentsConfig {
            coding_agents: vec![],
        };

        assert!(config.validate().is_err());
    }

    #[test]
    fn test_validate_duplicate_session_names() {
        let config = AgentsConfig {
            coding_agents: vec![
                AgentConfig {
                    agent: "Agent 1".to_string(),
                    session_name: "duplicate".to_string(),
                    description: "Test".to_string(),
                    command: "echo 1".to_string(),
                },
                AgentConfig {
                    agent: "Agent 2".to_string(),
                    session_name: "duplicate".to_string(),
                    description: "Test".to_string(),
                    command: "echo 2".to_string(),
                },
            ],
        };

        assert!(config.validate().is_err());
    }

    #[test]
    fn test_check_command_safety() {
        assert!(AgentsConfig::check_command_safety("echo hello", "Test").is_ok());
        assert!(AgentsConfig::check_command_safety("rm -rf /", "Test").is_err());
        assert!(AgentsConfig::check_command_safety("dd if=/dev/zero of=/dev/sda", "Test").is_err());
    }

    #[test]
    fn test_get_agent() {
        let config = AgentsConfig {
            coding_agents: vec![
                AgentConfig {
                    agent: "Agent 1".to_string(),
                    session_name: "session-1".to_string(),
                    description: "Test 1".to_string(),
                    command: "echo 1".to_string(),
                },
                AgentConfig {
                    agent: "Agent 2".to_string(),
                    session_name: "session-2".to_string(),
                    description: "Test 2".to_string(),
                    command: "echo 2".to_string(),
                },
            ],
        };

        assert!(config.get_agent("Agent 1").is_some());
        assert!(config.get_agent("Agent 3").is_none());
    }

    #[test]
    fn test_get_agent_by_session() {
        let config = AgentsConfig {
            coding_agents: vec![AgentConfig {
                agent: "Agent 1".to_string(),
                session_name: "session-1".to_string(),
                description: "Test 1".to_string(),
                command: "echo 1".to_string(),
            }],
        };

        assert!(config.get_agent_by_session("session-1").is_some());
        assert!(config.get_agent_by_session("session-2").is_none());
    }

    #[test]
    fn test_list_agent_names() {
        let config = AgentsConfig {
            coding_agents: vec![
                AgentConfig {
                    agent: "Agent 1".to_string(),
                    session_name: "session-1".to_string(),
                    description: "Test 1".to_string(),
                    command: "echo 1".to_string(),
                },
                AgentConfig {
                    agent: "Agent 2".to_string(),
                    session_name: "session-2".to_string(),
                    description: "Test 2".to_string(),
                    command: "echo 2".to_string(),
                },
            ],
        };

        let names = config.list_agent_names();
        assert_eq!(names.len(), 2);
        assert!(names.contains(&"Agent 1".to_string()));
        assert!(names.contains(&"Agent 2".to_string()));
    }
}
