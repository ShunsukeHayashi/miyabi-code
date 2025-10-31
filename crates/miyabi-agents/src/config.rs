//! Agent configuration management
//!
//! Provides centralized management for all 21 Miyabi agents (7 Coding + 14 Business).
//! Configuration files are stored in TOML format and can be located in multiple directories.

use anyhow::{anyhow, Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

/// Agent type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentType {
    /// Task coordination and DAG decomposition
    Coordinator,
    /// Code generation with Claude Sonnet 4
    Codegen,
    /// Code quality review (100-point scoring)
    Review,
    /// Issue analysis and label assignment
    Issue,
    /// Pull Request creation
    PR,
    /// CI/CD deployment
    Deployment,
    /// Issue state monitoring
    Refresher,
    /// AI entrepreneur support
    AIEntrepreneur,
    /// Product concept design
    ProductConcept,
    /// Service detailed design
    ProductDesign,
    /// Funnel design
    FunnelDesign,
    /// Persona definition
    Persona,
    /// Self-analysis
    SelfAnalysis,
    /// Market research
    MarketResearch,
    /// Marketing strategy
    Marketing,
    /// Content creation
    ContentCreation,
    /// SNS strategy
    SNSStrategy,
    /// YouTube strategy
    YouTube,
    /// Sales
    Sales,
    /// CRM
    CRM,
    /// Analytics
    Analytics,
    /// Custom agent type
    Custom,
}

impl AgentType {
    /// Get all standard agent types (excludes Custom)
    pub fn all_standard() -> Vec<AgentType> {
        vec![
            AgentType::Coordinator,
            AgentType::Codegen,
            AgentType::Review,
            AgentType::Issue,
            AgentType::PR,
            AgentType::Deployment,
            AgentType::Refresher,
            AgentType::AIEntrepreneur,
            AgentType::ProductConcept,
            AgentType::ProductDesign,
            AgentType::FunnelDesign,
            AgentType::Persona,
            AgentType::SelfAnalysis,
            AgentType::MarketResearch,
            AgentType::Marketing,
            AgentType::ContentCreation,
            AgentType::SNSStrategy,
            AgentType::YouTube,
            AgentType::Sales,
            AgentType::CRM,
            AgentType::Analytics,
        ]
    }

    /// Check if this is a coding agent
    pub fn is_coding_agent(&self) -> bool {
        matches!(
            self,
            AgentType::Coordinator
                | AgentType::Codegen
                | AgentType::Review
                | AgentType::Issue
                | AgentType::PR
                | AgentType::Deployment
                | AgentType::Refresher
        )
    }

    /// Check if this is a business agent
    pub fn is_business_agent(&self) -> bool {
        !self.is_coding_agent() && *self != AgentType::Custom
    }
}

impl std::fmt::Display for AgentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AgentType::Coordinator => write!(f, "coordinator"),
            AgentType::Codegen => write!(f, "codegen"),
            AgentType::Review => write!(f, "review"),
            AgentType::Issue => write!(f, "issue"),
            AgentType::PR => write!(f, "pr"),
            AgentType::Deployment => write!(f, "deployment"),
            AgentType::Refresher => write!(f, "refresher"),
            AgentType::AIEntrepreneur => write!(f, "ai-entrepreneur"),
            AgentType::ProductConcept => write!(f, "product-concept"),
            AgentType::ProductDesign => write!(f, "product-design"),
            AgentType::FunnelDesign => write!(f, "funnel-design"),
            AgentType::Persona => write!(f, "persona"),
            AgentType::SelfAnalysis => write!(f, "self-analysis"),
            AgentType::MarketResearch => write!(f, "market-research"),
            AgentType::Marketing => write!(f, "marketing"),
            AgentType::ContentCreation => write!(f, "content-creation"),
            AgentType::SNSStrategy => write!(f, "sns-strategy"),
            AgentType::YouTube => write!(f, "youtube"),
            AgentType::Sales => write!(f, "sales"),
            AgentType::CRM => write!(f, "crm"),
            AgentType::Analytics => write!(f, "analytics"),
            AgentType::Custom => write!(f, "custom"),
        }
    }
}

/// Skill configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillConfig {
    pub enabled: bool,
}

/// Agent dependencies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDependencies {
    #[serde(default)]
    pub requires: Vec<String>,
    #[serde(default)]
    pub provides: Vec<String>,
}

/// Agent metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetadata {
    pub name: String,
    #[serde(rename = "type")]
    pub agent_type: AgentType,
    pub enabled: bool,
    pub model: String,
    pub description: String,
}

/// Agent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub agent: AgentMetadata,
    #[serde(default)]
    pub parameters: HashMap<String, serde_json::Value>,
    #[serde(default)]
    pub skills: HashMap<String, SkillConfig>,
    #[serde(default)]
    pub dependencies: AgentDependencies,
}

impl Default for AgentDependencies {
    fn default() -> Self {
        Self {
            requires: Vec::new(),
            provides: Vec::new(),
        }
    }
}

/// Agent information (lightweight summary)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub name: String,
    pub agent_type: AgentType,
    pub enabled: bool,
    pub description: String,
    pub config_file: PathBuf,
}

/// Agent configuration manager
pub struct AgentConfigManager {
    config_dirs: Vec<PathBuf>,
}

impl AgentConfigManager {
    /// Create a new agent configuration manager
    ///
    /// Searches for agent configurations in:
    /// 1. `.miyabi/agents/` (project-local)
    /// 2. `~/.config/miyabi/agents/` (user-global)
    /// 3. `MIYABI_AGENT_CONFIG_PATH` environment variable (custom)
    pub fn new() -> Result<Self> {
        let mut config_dirs = Vec::new();

        // 1. Project-local: .miyabi/agents/
        if let Ok(current_dir) = std::env::current_dir() {
            let project_config = current_dir.join(".miyabi").join("agents");
            if project_config.exists() {
                config_dirs.push(project_config);
            }
        }

        // 2. User-global: ~/.config/miyabi/agents/
        if let Some(home) = dirs::home_dir() {
            let user_config = home.join(".config").join("miyabi").join("agents");
            if user_config.exists() {
                config_dirs.push(user_config);
            }
        }

        // 3. Custom path from environment variable
        if let Ok(custom_path) = std::env::var("MIYABI_AGENT_CONFIG_PATH") {
            let custom = PathBuf::from(custom_path);
            if custom.exists() {
                config_dirs.push(custom);
            }
        }

        Ok(Self { config_dirs })
    }

    /// List all available agents
    pub fn list_agents(&self) -> Result<Vec<AgentInfo>> {
        let mut agents = Vec::new();
        let mut seen_names = std::collections::HashSet::new();

        for config_dir in &self.config_dirs {
            if let Ok(entries) = fs::read_dir(config_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("toml") {
                        if let Ok(config) = self.load_config_from_file(&path) {
                            // Avoid duplicates (first found takes precedence)
                            if !seen_names.contains(&config.agent.name) {
                                seen_names.insert(config.agent.name.clone());
                                agents.push(AgentInfo {
                                    name: config.agent.name,
                                    agent_type: config.agent.agent_type,
                                    enabled: config.agent.enabled,
                                    description: config.agent.description,
                                    config_file: path,
                                });
                            }
                        }
                    }
                }
            }
        }

        // Sort by agent type (coding first, then business), then by name
        agents.sort_by(|a, b| {
            match (
                a.agent_type.is_coding_agent(),
                b.agent_type.is_coding_agent(),
            ) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.cmp(&b.name),
            }
        });

        Ok(agents)
    }

    /// Load configuration for a specific agent
    pub fn load_config(&self, name: &str) -> Result<AgentConfig> {
        let config_file = self
            .find_config_file(name)?
            .ok_or_else(|| anyhow!("Agent configuration not found: {}", name))?;

        self.load_config_from_file(&config_file)
    }

    /// Load configuration from a specific file
    fn load_config_from_file(&self, path: &PathBuf) -> Result<AgentConfig> {
        let content = fs::read_to_string(path)
            .with_context(|| format!("Failed to read config file: {}", path.display()))?;

        toml::from_str(&content)
            .with_context(|| format!("Failed to parse TOML config: {}", path.display()))
    }

    /// Save configuration for a specific agent
    pub fn save_config(&self, name: &str, config: &AgentConfig) -> Result<()> {
        let config_file = self.find_config_file(name)?.unwrap_or_else(|| {
            // Prefer project-local .miyabi/agents/, fallback to user-global
            if let Ok(current_dir) = std::env::current_dir() {
                current_dir
                    .join(".miyabi")
                    .join("agents")
                    .join(format!("{}.toml", name))
            } else if let Some(home) = dirs::home_dir() {
                home.join(".config")
                    .join("miyabi")
                    .join("agents")
                    .join(format!("{}.toml", name))
            } else {
                PathBuf::from(format!("{}.toml", name))
            }
        });

        let content =
            toml::to_string_pretty(config).context("Failed to serialize config to TOML")?;

        // Ensure directory exists
        if let Some(parent) = config_file.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("Failed to create directory: {}", parent.display()))?;
        }

        fs::write(&config_file, content)
            .with_context(|| format!("Failed to write config file: {}", config_file.display()))?;

        Ok(())
    }

    /// Find configuration file for a specific agent
    pub fn find_config_file(&self, name: &str) -> Result<Option<PathBuf>> {
        for config_dir in &self.config_dirs {
            let config_file = config_dir.join(format!("{}.toml", name));
            if config_file.exists() {
                return Ok(Some(config_file));
            }
        }
        Ok(None)
    }

    /// Get configuration directories
    pub fn config_dirs(&self) -> &[PathBuf] {
        &self.config_dirs
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_agent_type_display() {
        assert_eq!(AgentType::Coordinator.to_string(), "coordinator");
        assert_eq!(AgentType::AIEntrepreneur.to_string(), "ai-entrepreneur");
    }

    #[test]
    fn test_agent_type_categorization() {
        assert!(AgentType::Coordinator.is_coding_agent());
        assert!(!AgentType::Coordinator.is_business_agent());

        assert!(!AgentType::Marketing.is_coding_agent());
        assert!(AgentType::Marketing.is_business_agent());

        assert!(!AgentType::Custom.is_coding_agent());
        assert!(!AgentType::Custom.is_business_agent());
    }

    #[test]
    fn test_all_standard_agents() {
        let agents = AgentType::all_standard();
        assert_eq!(agents.len(), 21); // 7 coding + 14 business
        assert!(!agents.contains(&AgentType::Custom));
    }

    #[test]
    fn test_agent_config_serialization() {
        let config = AgentConfig {
            agent: AgentMetadata {
                name: "TestAgent".to_string(),
                agent_type: AgentType::Coordinator,
                enabled: true,
                model: "claude-sonnet-4".to_string(),
                description: "Test agent".to_string(),
            },
            parameters: HashMap::new(),
            skills: HashMap::new(),
            dependencies: AgentDependencies::default(),
        };

        let toml_str = toml::to_string_pretty(&config).unwrap();
        let parsed: AgentConfig = toml::from_str(&toml_str).unwrap();

        assert_eq!(parsed.agent.name, "TestAgent");
        assert_eq!(parsed.agent.agent_type, AgentType::Coordinator);
    }

    #[test]
    fn test_config_manager_creation() {
        let manager = AgentConfigManager::new();
        assert!(manager.is_ok());
    }

    #[test]
    fn test_config_manager_save_and_load() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("agents");
        fs::create_dir_all(&config_path).unwrap();

        std::env::set_var("MIYABI_AGENT_CONFIG_PATH", config_path.to_str().unwrap());

        let manager = AgentConfigManager::new().unwrap();

        let config = AgentConfig {
            agent: AgentMetadata {
                name: "TestAgent".to_string(),
                agent_type: AgentType::Coordinator,
                enabled: true,
                model: "claude-sonnet-4".to_string(),
                description: "Test agent".to_string(),
            },
            parameters: HashMap::new(),
            skills: HashMap::new(),
            dependencies: AgentDependencies::default(),
        };

        manager.save_config("TestAgent", &config).unwrap();
        let loaded = manager.load_config("TestAgent").unwrap();

        assert_eq!(loaded.agent.name, "TestAgent");
        assert_eq!(loaded.agent.agent_type, AgentType::Coordinator);

        std::env::remove_var("MIYABI_AGENT_CONFIG_PATH");
    }

    #[test]
    fn test_list_agents() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("agents");
        fs::create_dir_all(&config_path).unwrap();

        std::env::set_var("MIYABI_AGENT_CONFIG_PATH", config_path.to_str().unwrap());

        let manager = AgentConfigManager::new().unwrap();

        // Create multiple test agents
        for (i, agent_type) in [
            AgentType::Coordinator,
            AgentType::Review,
            AgentType::Marketing,
        ]
        .iter()
        .enumerate()
        {
            let config = AgentConfig {
                agent: AgentMetadata {
                    name: format!("TestAgent{}", i),
                    agent_type: *agent_type,
                    enabled: true,
                    model: "claude-sonnet-4".to_string(),
                    description: format!("Test agent {}", i),
                },
                parameters: HashMap::new(),
                skills: HashMap::new(),
                dependencies: AgentDependencies::default(),
            };
            manager
                .save_config(&format!("TestAgent{}", i), &config)
                .unwrap();
        }

        let agents = manager.list_agents().unwrap();

        // Check that our 3 test agents were created (TestAgent0, TestAgent1, TestAgent2)
        // Note: There might be other TestAgent* from other tests, so we check for exactly these 3
        let test_agent0 = agents.iter().find(|a| a.name == "TestAgent0");
        let test_agent1 = agents.iter().find(|a| a.name == "TestAgent1");
        let test_agent2 = agents.iter().find(|a| a.name == "TestAgent2");

        assert!(test_agent0.is_some(), "TestAgent0 should exist");
        assert!(test_agent1.is_some(), "TestAgent1 should exist");
        assert!(test_agent2.is_some(), "TestAgent2 should exist");

        let test_agent0 = test_agent0.unwrap();
        let test_agent1 = test_agent1.unwrap();
        let test_agent2 = test_agent2.unwrap();

        assert!(test_agent0.agent_type.is_coding_agent());
        assert!(test_agent1.agent_type.is_coding_agent());
        assert!(test_agent2.agent_type.is_business_agent());

        std::env::remove_var("MIYABI_AGENT_CONFIG_PATH");
    }
}
