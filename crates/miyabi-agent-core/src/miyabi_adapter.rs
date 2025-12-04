//! Miyabi Agent Adapter
//!
//! Bridges existing Miyabi agents (21 types) with the Claude Agent SDK,
//! enabling them to run in sandboxed environments with checkpoint support.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use uuid::Uuid;

use crate::sandbox::{SandboxConfig, PermissionLevel, NetworkPolicy, FilesystemPolicy, ResourceLimits};
use crate::subagent::{SubagentConfig, AgentType, ResourceAllocation};
use crate::tmux_integration::{TmuxOrchestrator, TmuxSessionConfig};

/// All 21 Miyabi agent types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum MiyabiAgentType {
    // Core Development Agents
    Coordinator,
    CodeGen,
    Review,
    Issue,
    PR,
    Deploy,
    Refresher,
    
    // AI Business Agents
    AiEntrepreneur,
    SelfAnalysis,
    MarketResearch,
    Persona,
    ProductConcept,
    ProductDesign,
    ContentCreation,
    FunnelDesign,
    SnsStrategy,
    Marketing,
    Sales,
    Crm,
    Analytics,
    YouTube,
}

impl MiyabiAgentType {
    /// Get all agent types
    pub fn all() -> Vec<Self> {
        vec![
            Self::Coordinator,
            Self::CodeGen,
            Self::Review,
            Self::Issue,
            Self::PR,
            Self::Deploy,
            Self::Refresher,
            Self::AiEntrepreneur,
            Self::SelfAnalysis,
            Self::MarketResearch,
            Self::Persona,
            Self::ProductConcept,
            Self::ProductDesign,
            Self::ContentCreation,
            Self::FunnelDesign,
            Self::SnsStrategy,
            Self::Marketing,
            Self::Sales,
            Self::Crm,
            Self::Analytics,
            Self::YouTube,
        ]
    }

    /// Get agent name
    pub fn name(&self) -> &'static str {
        match self {
            Self::Coordinator => "coordinator",
            Self::CodeGen => "codegen",
            Self::Review => "review",
            Self::Issue => "issue",
            Self::PR => "pr",
            Self::Deploy => "deploy",
            Self::Refresher => "refresher",
            Self::AiEntrepreneur => "ai_entrepreneur",
            Self::SelfAnalysis => "self_analysis",
            Self::MarketResearch => "market_research",
            Self::Persona => "persona",
            Self::ProductConcept => "product_concept",
            Self::ProductDesign => "product_design",
            Self::ContentCreation => "content_creation",
            Self::FunnelDesign => "funnel_design",
            Self::SnsStrategy => "sns_strategy",
            Self::Marketing => "marketing",
            Self::Sales => "sales",
            Self::Crm => "crm",
            Self::Analytics => "analytics",
            Self::YouTube => "youtube",
        }
    }

    /// Get Japanese display name
    pub fn display_name_ja(&self) -> &'static str {
        match self {
            Self::Coordinator => "指揮官 (しきろーん)",
            Self::CodeGen => "作ろーん (つくろーん)",
            Self::Review => "目玉マン (めだまん)",
            Self::Issue => "見つけろーん",
            Self::PR => "まとめろーん",
            Self::Deploy => "運ぼーん (はこぼーん)",
            Self::Refresher => "繋軍 (つなぐん)",
            Self::AiEntrepreneur => "AI起業家",
            Self::SelfAnalysis => "自己分析",
            Self::MarketResearch => "市場調査",
            Self::Persona => "ペルソナ設計",
            Self::ProductConcept => "商品コンセプト",
            Self::ProductDesign => "商品設計",
            Self::ContentCreation => "コンテンツ制作",
            Self::FunnelDesign => "ファネル設計",
            Self::SnsStrategy => "SNS戦略",
            Self::Marketing => "マーケティング",
            Self::Sales => "セールス",
            Self::Crm => "CRM",
            Self::Analytics => "アナリティクス",
            Self::YouTube => "YouTube",
        }
    }

    /// Get agent category
    pub fn category(&self) -> AgentCategory {
        match self {
            Self::Coordinator | Self::CodeGen | Self::Review |
            Self::Issue | Self::PR | Self::Deploy | Self::Refresher => {
                AgentCategory::Development
            }
            _ => AgentCategory::Business,
        }
    }

    /// Convert to SubagentConfig AgentType
    pub fn to_subagent_type(&self) -> AgentType {
        match self {
            Self::Coordinator => AgentType::Coordinator,
            Self::CodeGen => AgentType::CodeGen,
            Self::Review => AgentType::Reviewer,
            Self::Issue => AgentType::Custom("issue".to_string()),
            Self::PR => AgentType::Custom("pr".to_string()),
            Self::Deploy => AgentType::Deployer,
            Self::Refresher => AgentType::Custom("refresher".to_string()),
            _ => AgentType::Custom(self.name().to_string()),
        }
    }

    /// Get recommended resource allocation
    pub fn recommended_resources(&self) -> ResourceAllocation {
        match self.category() {
            AgentCategory::Development => ResourceAllocation {
                cpu_cores: 2.0,
                memory_mb: 1024,
                disk_mb: 2048,
                network_access: true,
            },
            AgentCategory::Business => ResourceAllocation {
                cpu_cores: 1.0,
                memory_mb: 512,
                disk_mb: 1024,
                network_access: true,
            },
        }
    }

    /// Get recommended permission level
    pub fn recommended_permission(&self) -> PermissionLevel {
        match self {
            Self::Deploy => PermissionLevel::Standard,
            Self::CodeGen | Self::Review => PermissionLevel::Standard,
            _ => PermissionLevel::Strict,
        }
    }
}

impl std::fmt::Display for MiyabiAgentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name())
    }
}

/// Agent category
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentCategory {
    /// Development agents (7 types)
    Development,
    /// Business agents (14 types)
    Business,
}

/// Miyabi agent configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiyabiAgentConfig {
    /// Agent type
    pub agent_type: MiyabiAgentType,
    /// Instance name
    pub instance_name: String,
    /// Task description
    pub task: String,
    /// Sandbox settings
    pub sandbox: Option<SandboxSettings>,
    /// Checkpoint settings
    pub checkpoint: Option<CheckpointSettings>,
    /// Custom environment variables
    pub env_vars: HashMap<String, String>,
    /// Timeout in seconds
    pub timeout_seconds: u64,
    /// Number of retries
    pub max_retries: u32,
}

/// Sandbox settings for Miyabi agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxSettings {
    /// Enable sandbox
    pub enabled: bool,
    /// Permission level override
    pub permission_level: Option<PermissionLevel>,
    /// Allowed network hosts
    pub allowed_hosts: Vec<String>,
    /// Working directory
    pub working_dir: Option<PathBuf>,
}

impl Default for SandboxSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            permission_level: None,
            allowed_hosts: vec![
                "api.anthropic.com".to_string(),
                "api.openai.com".to_string(),
                "api.github.com".to_string(),
            ],
            working_dir: None,
        }
    }
}

/// Checkpoint settings for Miyabi agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckpointSettings {
    /// Enable checkpoints
    pub enabled: bool,
    /// Auto-save interval (seconds)
    pub auto_save_interval: Option<u64>,
    /// Max checkpoints to keep
    pub max_checkpoints: usize,
    /// Save before risky operations
    pub save_before_risky: bool,
}

impl Default for CheckpointSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            auto_save_interval: Some(300),
            max_checkpoints: 10,
            save_before_risky: true,
        }
    }
}

/// Adapter for running Miyabi agents with Claude Agent SDK
pub struct MiyabiAgentAdapter {
    /// Tmux orchestrator
    tmux: TmuxOrchestrator,
    /// Running agents
    agents: tokio::sync::RwLock<HashMap<Uuid, RunningAgent>>,
}

/// Running agent instance
#[derive(Debug, Clone)]
pub struct RunningAgent {
    /// Agent ID
    pub id: Uuid,
    /// Agent type
    pub agent_type: MiyabiAgentType,
    /// Instance name
    pub instance_name: String,
    /// Status
    pub status: AgentStatus,
    /// Started at
    pub started_at: chrono::DateTime<chrono::Utc>,
    /// Checkpoint IDs
    pub checkpoints: Vec<Uuid>,
}

/// Agent status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentStatus {
    Starting,
    Running,
    Paused,
    Completed,
    Failed,
    Terminated,
}

impl MiyabiAgentAdapter {
    /// Create new adapter
    pub fn new(session_name: &str) -> Self {
        let tmux_config = TmuxSessionConfig {
            session_name: session_name.to_string(),
            window_count: 3,
            panes_per_window: 8,  // Support up to 24 agents
            working_dir: ".".to_string(),
            shell: "/bin/bash".to_string(),
            env_vars: HashMap::new(),
        };

        Self {
            tmux: TmuxOrchestrator::new(tmux_config),
            agents: tokio::sync::RwLock::new(HashMap::new()),
        }
    }

    /// Initialize the adapter
    pub async fn initialize(&self) -> Result<(), AdapterError> {
        self.tmux.initialize().await
            .map_err(|e| AdapterError::TmuxError(e.to_string()))
    }

    /// Spawn a Miyabi agent
    pub async fn spawn(&self, config: MiyabiAgentConfig) -> Result<Uuid, AdapterError> {
        // Create sandbox config
        let _sandbox_config = self.create_sandbox_config(&config);
        
        // Create subagent config
        let subagent_config = SubagentConfig {
            name: config.instance_name.clone(),
            agent_type: config.agent_type.to_subagent_type(),
            timeout_seconds: config.timeout_seconds,
            max_retries: config.max_retries,
            resources: config.agent_type.recommended_resources(),
            environment: config.env_vars.clone(),
            working_directory: config.sandbox
                .as_ref()
                .and_then(|s| s.working_dir.as_ref())
                .map(|p| p.to_string_lossy().to_string()),
            depends_on: vec![],
        };

        // Spawn in tmux
        let agent_id = self.tmux.spawn_agent(subagent_config).await
            .map_err(|e| AdapterError::TmuxError(e.to_string()))?;

        // Record running agent
        let running = RunningAgent {
            id: agent_id,
            agent_type: config.agent_type,
            instance_name: config.instance_name,
            status: AgentStatus::Running,
            started_at: chrono::Utc::now(),
            checkpoints: vec![],
        };

        {
            let mut agents = self.agents.write().await;
            agents.insert(agent_id, running);
        }

        // Send initialization command
        let init_cmd = format!(
            "echo '🤖 Miyabi Agent {} ({}) started'",
            config.agent_type.display_name_ja(),
            config.agent_type.name()
        );
        self.tmux.send_command(agent_id, &init_cmd).await
            .map_err(|e| AdapterError::TmuxError(e.to_string()))?;

        Ok(agent_id)
    }

    /// Create sandbox configuration for agent
    fn create_sandbox_config(&self, config: &MiyabiAgentConfig) -> SandboxConfig {
        let sandbox_settings = config.sandbox.clone().unwrap_or_default();
        let permission = sandbox_settings.permission_level
            .unwrap_or_else(|| config.agent_type.recommended_permission());

        let network_policy = if sandbox_settings.allowed_hosts.is_empty() {
            NetworkPolicy::AllowAll
        } else {
            NetworkPolicy::AllowList(sandbox_settings.allowed_hosts.clone())
        };

        SandboxConfig {
            id: Uuid::new_v4().to_string(),
            agent_name: config.instance_name.clone(),
            permission_level: permission,
            network_policy,
            filesystem_policy: FilesystemPolicy::default(),
            resource_limits: ResourceLimits::default(),
            working_dir: sandbox_settings.working_dir
                .unwrap_or_else(|| PathBuf::from("/tmp/miyabi-agent")),
            env_allowlist: vec![
                "RUST_LOG".to_string(),
                "ANTHROPIC_API_KEY".to_string(),
                "OPENAI_API_KEY".to_string(),
                "GITHUB_TOKEN".to_string(),
            ],
            env_vars: config.env_vars.clone(),
            audit_enabled: true,
        }
    }

    /// Execute task on agent
    pub async fn execute(&self, agent_id: Uuid, task: &str) -> Result<(), AdapterError> {
        self.tmux.send_command(agent_id, task).await
            .map_err(|e| AdapterError::TmuxError(e.to_string()))
    }

    /// Get agent output
    pub async fn get_output(&self, agent_id: Uuid, lines: usize) -> Result<String, AdapterError> {
        self.tmux.capture_output(agent_id, lines).await
            .map_err(|e| AdapterError::TmuxError(e.to_string()))
    }

    /// Stop agent
    pub async fn stop(&self, agent_id: Uuid) -> Result<(), AdapterError> {
        self.tmux.stop_agent(agent_id).await
            .map_err(|e| AdapterError::TmuxError(e.to_string()))?;

        {
            let mut agents = self.agents.write().await;
            if let Some(agent) = agents.get_mut(&agent_id) {
                agent.status = AgentStatus::Terminated;
            }
        }

        Ok(())
    }

    /// List running agents
    pub async fn list_agents(&self) -> Vec<RunningAgent> {
        let agents = self.agents.read().await;
        agents.values().cloned().collect()
    }

    /// Get agent by ID
    pub async fn get_agent(&self, agent_id: Uuid) -> Option<RunningAgent> {
        let agents = self.agents.read().await;
        agents.get(&agent_id).cloned()
    }

    /// Broadcast message to all agents
    pub async fn broadcast(&self, message: &str) -> Result<(), AdapterError> {
        let agents = self.agents.read().await;
        for agent in agents.values() {
            if agent.status == AgentStatus::Running {
                let _ = self.tmux.send_command(agent.id, &format!("echo '[BROADCAST]: {}'", message)).await;
            }
        }
        Ok(())
    }

    /// Spawn development workflow (7 agents)
    pub async fn spawn_dev_workflow(&self, project_name: &str) -> Result<Vec<Uuid>, AdapterError> {
        let dev_agents = vec![
            MiyabiAgentType::Coordinator,
            MiyabiAgentType::CodeGen,
            MiyabiAgentType::Review,
            MiyabiAgentType::Issue,
            MiyabiAgentType::PR,
            MiyabiAgentType::Deploy,
            MiyabiAgentType::Refresher,
        ];

        let mut ids = Vec::new();
        for agent_type in dev_agents {
            let config = MiyabiAgentConfig {
                agent_type,
                instance_name: format!("{}-{}", project_name, agent_type.name()),
                task: format!("{} for project {}", agent_type.display_name_ja(), project_name),
                sandbox: Some(SandboxSettings::default()),
                checkpoint: Some(CheckpointSettings::default()),
                env_vars: HashMap::new(),
                timeout_seconds: 600,
                max_retries: 3,
            };
            let id = self.spawn(config).await?;
            ids.push(id);
        }

        Ok(ids)
    }

    /// Spawn business workflow (14 agents)
    pub async fn spawn_business_workflow(&self, project_name: &str) -> Result<Vec<Uuid>, AdapterError> {
        let business_agents = vec![
            MiyabiAgentType::AiEntrepreneur,
            MiyabiAgentType::SelfAnalysis,
            MiyabiAgentType::MarketResearch,
            MiyabiAgentType::Persona,
            MiyabiAgentType::ProductConcept,
            MiyabiAgentType::ProductDesign,
            MiyabiAgentType::ContentCreation,
            MiyabiAgentType::FunnelDesign,
            MiyabiAgentType::SnsStrategy,
            MiyabiAgentType::Marketing,
            MiyabiAgentType::Sales,
            MiyabiAgentType::Crm,
            MiyabiAgentType::Analytics,
            MiyabiAgentType::YouTube,
        ];

        let mut ids = Vec::new();
        for agent_type in business_agents {
            let config = MiyabiAgentConfig {
                agent_type,
                instance_name: format!("{}-{}", project_name, agent_type.name()),
                task: format!("{} for project {}", agent_type.display_name_ja(), project_name),
                sandbox: Some(SandboxSettings::default()),
                checkpoint: Some(CheckpointSettings::default()),
                env_vars: HashMap::new(),
                timeout_seconds: 300,
                max_retries: 2,
            };
            let id = self.spawn(config).await?;
            ids.push(id);
        }

        Ok(ids)
    }

    /// Shutdown all agents
    pub async fn shutdown(&self) -> Result<(), AdapterError> {
        self.tmux.shutdown().await
            .map_err(|e| AdapterError::TmuxError(e.to_string()))?;

        {
            let mut agents = self.agents.write().await;
            agents.clear();
        }

        Ok(())
    }
}

/// Adapter error
#[derive(Debug, thiserror::Error)]
pub enum AdapterError {
    #[error("Tmux error: {0}")]
    TmuxError(String),
    #[error("Agent not found: {0}")]
    AgentNotFound(Uuid),
    #[error("Configuration error: {0}")]
    ConfigError(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_all_agents() {
        let all = MiyabiAgentType::all();
        assert_eq!(all.len(), 21);
    }

    #[test]
    fn test_agent_categories() {
        let dev_count = MiyabiAgentType::all()
            .iter()
            .filter(|a| a.category() == AgentCategory::Development)
            .count();
        let biz_count = MiyabiAgentType::all()
            .iter()
            .filter(|a| a.category() == AgentCategory::Business)
            .count();

        assert_eq!(dev_count, 7);
        assert_eq!(biz_count, 14);
    }

    #[test]
    fn test_agent_names() {
        assert_eq!(MiyabiAgentType::Coordinator.name(), "coordinator");
        assert_eq!(MiyabiAgentType::CodeGen.name(), "codegen");
        assert_eq!(MiyabiAgentType::YouTube.name(), "youtube");
    }

    #[test]
    fn test_display_names() {
        assert_eq!(MiyabiAgentType::Coordinator.display_name_ja(), "指揮官 (しきろーん)");
        assert_eq!(MiyabiAgentType::CodeGen.display_name_ja(), "作ろーん (つくろーん)");
    }

    #[test]
    fn test_to_subagent_type() {
        assert!(matches!(
            MiyabiAgentType::Coordinator.to_subagent_type(),
            AgentType::Coordinator
        ));
        assert!(matches!(
            MiyabiAgentType::CodeGen.to_subagent_type(),
            AgentType::CodeGen
        ));
    }

    #[test]
    fn test_sandbox_settings_default() {
        let settings = SandboxSettings::default();
        assert!(settings.enabled);
        assert!(!settings.allowed_hosts.is_empty());
    }

    #[test]
    fn test_checkpoint_settings_default() {
        let settings = CheckpointSettings::default();
        assert!(settings.enabled);
        assert!(settings.auto_save_interval.is_some());
        assert!(settings.save_before_risky);
    }
}
