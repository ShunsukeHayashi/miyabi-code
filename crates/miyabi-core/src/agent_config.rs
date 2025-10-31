// Agent Configuration Management System
// Inspired by KAMUI 4D's agent-config-service.js design

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// Agent configuration metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfigMetadata {
    pub name: String,
    pub agent_type: String,
    pub enabled: bool,
    pub model: String,
    pub description: String,
}

/// Skill configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillConfig {
    pub enabled: bool,
}

/// Agent dependencies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentDependencies {
    pub requires: Vec<String>,
    pub provides: Vec<String>,
}

/// Complete agent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub agent: AgentConfigMetadata,
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

impl AgentConfig {
    /// Create a default configuration for a given agent
    pub fn default_for_agent(name: &str, agent_type: &str, description: &str) -> Self {
        Self {
            agent: AgentConfigMetadata {
                name: name.to_string(),
                agent_type: agent_type.to_string(),
                enabled: true,
                model: "claude-sonnet-4".to_string(),
                description: description.to_string(),
            },
            parameters: HashMap::new(),
            skills: HashMap::new(),
            dependencies: AgentDependencies::default(),
        }
    }

    /// Validate configuration
    pub fn validate(&self) -> Result<()> {
        if self.agent.name.is_empty() {
            anyhow::bail!("Agent name cannot be empty");
        }
        if self.agent.agent_type.is_empty() {
            anyhow::bail!("Agent type cannot be empty");
        }
        if self.agent.model.is_empty() {
            anyhow::bail!("Model cannot be empty");
        }
        Ok(())
    }
}

/// Agent information for listing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    pub name: String,
    pub agent_type: String,
    pub description: String,
    pub enabled: bool,
    pub config_file: Option<PathBuf>,
}

/// Agent configuration manager
pub struct AgentConfigManager {
    config_dirs: Vec<PathBuf>,
}

impl AgentConfigManager {
    /// Create new configuration manager with auto-detected paths
    pub fn new() -> Result<Self> {
        let mut config_dirs = Vec::new();

        // 1. Project-local config: .miyabi/agents/
        if let Ok(current_dir) = std::env::current_dir() {
            let project_config = current_dir.join(".miyabi").join("agents");
            if project_config.exists() {
                config_dirs.push(project_config);
            }
        }

        // 2. User config: ~/.config/miyabi/agents/
        if let Some(home) = dirs::home_dir() {
            let user_config = home.join(".config").join("miyabi").join("agents");
            if user_config.exists() {
                config_dirs.push(user_config);
            }
        }

        // 3. Environment variable: MIYABI_AGENT_CONFIG_PATH
        if let Ok(env_path) = std::env::var("MIYABI_AGENT_CONFIG_PATH") {
            let env_config = PathBuf::from(env_path);
            if env_config.exists() {
                config_dirs.push(env_config);
            }
        }

        Ok(Self { config_dirs })
    }

    /// Create configuration manager with specific directories
    pub fn with_dirs(dirs: Vec<PathBuf>) -> Self {
        Self { config_dirs: dirs }
    }

    /// Get all configuration directories
    pub fn config_dirs(&self) -> &[PathBuf] {
        &self.config_dirs
    }

    /// List all available agents (built-in + configured)
    pub fn list_agents(&self) -> Result<Vec<AgentInfo>> {
        let mut agents = Vec::new();

        // Add agents from config files first (higher priority)
        for config_dir in &self.config_dirs {
            if let Ok(entries) = fs::read_dir(config_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().and_then(|s| s.to_str()) == Some("toml") {
                        if let Ok(config) = self.load_config_from_file(&path) {
                            agents.push(AgentInfo {
                                name: config.agent.name.clone(),
                                agent_type: config.agent.agent_type.clone(),
                                description: config.agent.description.clone(),
                                enabled: config.agent.enabled,
                                config_file: Some(path),
                            });
                        }
                    }
                }
            }
        }

        // Add built-in agents
        agents.extend(self.get_builtin_agents());

        // Deduplicate by name (prefer configured over built-in - first occurrence wins)
        let mut seen = HashMap::new();
        let mut result = Vec::new();
        for agent in agents {
            if !seen.contains_key(&agent.name) {
                seen.insert(agent.name.clone(), true);
                result.push(agent);
            }
        }

        Ok(result)
    }

    /// Load agent configuration by name
    pub fn load_config(&self, name: &str) -> Result<AgentConfig> {
        // Try to find config file
        if let Some(path) = self.find_config_file(name)? {
            return self.load_config_from_file(&path);
        }

        // Return default config for built-in agents
        self.get_default_config(name)
            .ok_or_else(|| anyhow::anyhow!("Agent '{}' not found", name))
    }

    /// Find configuration file for an agent
    pub fn find_config_file(&self, name: &str) -> Result<Option<PathBuf>> {
        let filename = format!("{}.toml", name);

        for config_dir in &self.config_dirs {
            let path = config_dir.join(&filename);
            if path.exists() {
                return Ok(Some(path));
            }
        }

        Ok(None)
    }

    /// Load configuration from file
    pub fn load_config_from_file(&self, path: &Path) -> Result<AgentConfig> {
        let content = fs::read_to_string(path)
            .with_context(|| format!("Failed to read config file: {}", path.display()))?;

        let config: AgentConfig = toml::from_str(&content)
            .with_context(|| format!("Failed to parse config file: {}", path.display()))?;

        config.validate()?;

        Ok(config)
    }

    /// Save agent configuration
    pub fn save_config(&self, name: &str, config: &AgentConfig) -> Result<PathBuf> {
        config.validate()?;

        // Save to first writable config directory
        let target_dir = self.get_writable_config_dir()?;
        fs::create_dir_all(&target_dir)?;

        let filename = format!("{}.toml", name);
        let path = target_dir.join(&filename);

        let content = toml::to_string_pretty(config)
            .context("Failed to serialize configuration")?;

        fs::write(&path, content)
            .with_context(|| format!("Failed to write config file: {}", path.display()))?;

        Ok(path)
    }

    /// Delete agent configuration
    pub fn delete_config(&self, name: &str) -> Result<()> {
        if let Some(path) = self.find_config_file(name)? {
            fs::remove_file(&path)
                .with_context(|| format!("Failed to delete config file: {}", path.display()))?;
            Ok(())
        } else {
            anyhow::bail!("Configuration for agent '{}' not found", name);
        }
    }

    /// Get writable configuration directory
    fn get_writable_config_dir(&self) -> Result<PathBuf> {
        // Use first config dir if available (for tests)
        if let Some(first_dir) = self.config_dirs.first() {
            return Ok(first_dir.clone());
        }

        // Prefer project-local config
        if let Ok(current_dir) = std::env::current_dir() {
            let project_config = current_dir.join(".miyabi").join("agents");
            return Ok(project_config);
        }

        // Fallback to user config
        if let Some(home) = dirs::home_dir() {
            let user_config = home.join(".config").join("miyabi").join("agents");
            return Ok(user_config);
        }

        anyhow::bail!("No writable configuration directory found");
    }

    /// Get built-in agent list
    fn get_builtin_agents(&self) -> Vec<AgentInfo> {
        vec![
            // Coding Agents (7)
            AgentInfo {
                name: "CoordinatorAgent".to_string(),
                agent_type: "coordinator".to_string(),
                description: "タスク統括・DAG分解".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "CodeGenAgent".to_string(),
                agent_type: "codegen".to_string(),
                description: "コード生成（Claude Sonnet 4）".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "ReviewAgent".to_string(),
                agent_type: "review".to_string(),
                description: "品質レビュー（100点満点）".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "IssueAgent".to_string(),
                agent_type: "issue".to_string(),
                description: "Issue分析・ラベル付与".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "PRAgent".to_string(),
                agent_type: "pr".to_string(),
                description: "Pull Request作成".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "DeploymentAgent".to_string(),
                agent_type: "deployment".to_string(),
                description: "CI/CDデプロイ".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "RefresherAgent".to_string(),
                agent_type: "refresher".to_string(),
                description: "Issue状態監視".to_string(),
                enabled: false,
                config_file: None,
            },
            // Business Agents (14)
            AgentInfo {
                name: "AIEntrepreneurAgent".to_string(),
                agent_type: "ai-entrepreneur".to_string(),
                description: "AI起業家支援".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "ProductConceptAgent".to_string(),
                agent_type: "product-concept".to_string(),
                description: "プロダクトコンセプト設計".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "ProductDesignAgent".to_string(),
                agent_type: "product-design".to_string(),
                description: "サービス詳細設計".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "FunnelDesignAgent".to_string(),
                agent_type: "funnel-design".to_string(),
                description: "導線設計（AARRR）".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "PersonaAgent".to_string(),
                agent_type: "persona".to_string(),
                description: "ペルソナ設計".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "SelfAnalysisAgent".to_string(),
                agent_type: "self-analysis".to_string(),
                description: "自己分析".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "MarketResearchAgent".to_string(),
                agent_type: "market-research".to_string(),
                description: "市場調査（20社+）".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "MarketingAgent".to_string(),
                agent_type: "marketing".to_string(),
                description: "マーケティング戦略".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "ContentCreationAgent".to_string(),
                agent_type: "content-creation".to_string(),
                description: "コンテンツ制作".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "SNSStrategyAgent".to_string(),
                agent_type: "sns-strategy".to_string(),
                description: "SNS戦略".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "YouTubeAgent".to_string(),
                agent_type: "youtube".to_string(),
                description: "YouTube運用".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "SalesAgent".to_string(),
                agent_type: "sales".to_string(),
                description: "セールス戦略".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "CRMAgent".to_string(),
                agent_type: "crm".to_string(),
                description: "顧客管理".to_string(),
                enabled: true,
                config_file: None,
            },
            AgentInfo {
                name: "AnalyticsAgent".to_string(),
                agent_type: "analytics".to_string(),
                description: "データ分析・PDCA".to_string(),
                enabled: true,
                config_file: None,
            },
        ]
    }

    /// Get default configuration for a built-in agent
    fn get_default_config(&self, name: &str) -> Option<AgentConfig> {
        let agent_info = self
            .get_builtin_agents()
            .into_iter()
            .find(|a| a.name == name)?;

        Some(AgentConfig::default_for_agent(
            &agent_info.name,
            &agent_info.agent_type,
            &agent_info.description,
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_agent_config_validation() {
        let config = AgentConfig::default_for_agent(
            "TestAgent",
            "test",
            "Test agent description",
        );
        assert!(config.validate().is_ok());

        let mut invalid_config = config.clone();
        invalid_config.agent.name = String::new();
        assert!(invalid_config.validate().is_err());
    }

    #[test]
    fn test_agent_config_manager() -> Result<()> {
        let temp_dir = TempDir::new()?;
        let config_dir = temp_dir.path().join("agents");
        fs::create_dir_all(&config_dir)?;

        let manager = AgentConfigManager::with_dirs(vec![config_dir.clone()]);

        // List built-in agents
        let agents = manager.list_agents()?;
        assert_eq!(agents.len(), 21); // 7 coding + 14 business

        // Create and save config
        let config = AgentConfig::default_for_agent(
            "CustomAgent",
            "custom",
            "Custom agent",
        );
        let path = manager.save_config("CustomAgent", &config)?;
        assert!(path.exists());

        // List agents should now include custom agent
        let agents_after = manager.list_agents()?;
        assert_eq!(agents_after.len(), 22); // 21 builtin + 1 custom

        // Load config
        let loaded = manager.load_config("CustomAgent")?;
        assert_eq!(loaded.agent.name, "CustomAgent");

        // Delete config
        manager.delete_config("CustomAgent")?;
        assert!(!path.exists());

        // List should be back to 21
        let agents_final = manager.list_agents()?;
        assert_eq!(agents_final.len(), 21);

        Ok(())
    }

    #[test]
    fn test_builtin_agents_count() {
        let manager = AgentConfigManager::with_dirs(vec![]);
        let agents = manager.get_builtin_agents();

        assert_eq!(agents.len(), 21);

        // Check coding agents
        let coding_agents: Vec<_> = agents
            .iter()
            .filter(|a| ["coordinator", "codegen", "review", "issue", "pr", "deployment", "refresher"]
                .contains(&a.agent_type.as_str()))
            .collect();
        assert_eq!(coding_agents.len(), 7);

        // Check business agents
        let business_agents: Vec<_> = agents
            .iter()
            .filter(|a| !["coordinator", "codegen", "review", "issue", "pr", "deployment", "refresher"]
                .contains(&a.agent_type.as_str()))
            .collect();
        assert_eq!(business_agents.len(), 14);
    }

    #[test]
    fn test_config_file_discovery() -> Result<()> {
        let temp_dir = TempDir::new()?;
        let config_dir = temp_dir.path().join("agents");
        fs::create_dir_all(&config_dir)?;

        let manager = AgentConfigManager::with_dirs(vec![config_dir.clone()]);

        // Should not find non-existent config
        assert!(manager.find_config_file("NonExistent")?.is_none());

        // Create config file
        let config = AgentConfig::default_for_agent("TestAgent", "test", "Test");
        manager.save_config("TestAgent", &config)?;

        // Should find created config
        let found = manager.find_config_file("TestAgent")?;
        assert!(found.is_some());
        assert!(found.unwrap().exists());

        Ok(())
    }
}
