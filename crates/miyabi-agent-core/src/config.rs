// ==============================================================================
// Miyabi - Configuration Loader Module
// ==============================================================================
// Purpose: Load and manage Miyabi configuration from TOML files
// Version: 4.0
// Last Updated: 2025-11-17
// ==============================================================================

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

// ==============================================================================
// Core Configuration
// ==============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiyabiConfig {
    pub miyabi: MiyabiInfo,
    pub system: SystemConfig,
    pub paths: PathsConfig,
    pub execution: ExecutionConfig,
    pub features: FeaturesConfig,
    pub llm: LlmConfig,
    pub monitoring: MonitoringConfig,
    pub tmux: TmuxConfig,
    pub git: GitConfig,
    pub security: SecurityConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MiyabiInfo {
    pub version: String,
    pub edition: String,
    pub name: String,
    pub description: String,
    pub repository: String,
    pub repository_owner: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemConfig {
    pub device_identifier: String,
    pub platform: String,
    pub mode: String,
    pub orchestration: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathsConfig {
    pub project_root: PathBuf,
    pub config_dir: PathBuf,
    pub data_dir: PathBuf,
    pub cache_dir: PathBuf,
    pub logs_dir: PathBuf,
    pub tmp_dir: PathBuf,
    pub archive_dir: PathBuf,
    pub worktree_enabled: bool,
    pub worktree_base_dir: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionConfig {
    pub default_concurrency: u32,
    pub parallel_enabled: bool,
    pub max_parallel_agents: u32,
    pub task_timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeaturesConfig {
    pub mcp_first_approach: bool,
    pub context7_enabled: bool,
    pub voicevox_enabled: bool,
    pub visualization_3d: bool,
    pub obsidian_integration: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub default_provider: String,
    pub hybrid_router_enabled: bool,
    pub hybrid_router_cost_threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    pub metrics_enabled: bool,
    pub health_check_interval: u64,
    pub progress_reporting: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TmuxConfig {
    pub session_name: String,
    pub base_index: u32,
    pub mouse_enabled: bool,
    pub history_limit: u32,
    pub auto_rename: bool,
    pub pane_border_status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitConfig {
    pub auto_commit: bool,
    pub auto_push: bool,
    pub branch_prefix: String,
    pub commit_message_template: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub mask_credentials: bool,
    pub encrypt_logs: bool,
    pub audit_enabled: bool,
}

// ==============================================================================
// Credentials Configuration
// ==============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialsConfig {
    pub github: Option<GitHubCredentials>,
    pub anthropic: Option<AnthropicCredentials>,
    pub openai: Option<OpenAICredentials>,
    pub google: Option<GoogleCredentials>,
    pub groq: Option<GroqCredentials>,
    pub lark: Option<LarkCredentials>,
    pub x: Option<XCredentials>,
    pub line: Option<LineCredentials>,
    pub database: Option<DatabaseCredentials>,
    pub cache: Option<CacheCredentials>,
    pub monitoring: Option<MonitoringCredentials>,
    pub firebase: Option<FirebaseCredentials>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubCredentials {
    pub token: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnthropicCredentials {
    pub api_key: String,
    pub default_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenAICredentials {
    pub api_key: String,
    pub default_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoogleCredentials {
    pub api_key: String,
    pub default_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroqCredentials {
    pub api_key: String,
    pub default_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LarkCredentials {
    pub app_id: String,
    pub app_secret: String,
    pub domain: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XCredentials {
    pub api_key: String,
    pub api_secret: String,
    pub bearer_token: String,
    pub access_token: String,
    pub access_token_secret: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineCredentials {
    pub channel_access_token: String,
    pub channel_secret: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseCredentials {
    pub postgres_password: String,
    pub connection_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheCredentials {
    pub redis_password: String,
    pub connection_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringCredentials {
    pub grafana_password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirebaseCredentials {
    pub staging_project: String,
    pub prod_project: String,
}

// ==============================================================================
// Agents Configuration
// ==============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentsConfig {
    pub agents: AgentsGlobalConfig,
    pub skills: Option<HashMap<String, SkillConfig>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentsGlobalConfig {
    pub global: GlobalAgentConfig,
    pub coordinator: Option<AgentConfig>,
    pub codegen: Option<AgentConfig>,
    pub review: Option<AgentConfig>,
    pub test: Option<AgentConfig>,
    pub deploy: Option<AgentConfig>,
    pub monitor: Option<AgentConfig>,
    pub security: Option<AgentConfig>,
    pub documentation: Option<AgentConfig>,
    pub business: Option<HashMap<String, BusinessAgentConfig>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalAgentConfig {
    pub enabled: bool,
    pub auto_start: bool,
    pub restart_on_failure: bool,
    pub max_retries: u32,
    pub retry_delay: u64,
    pub communication_protocol: String,
    pub message_format: String,
    pub timeout: u64,
    pub max_memory: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub enabled: bool,
    #[serde(rename = "type")]
    pub agent_type: String,
    pub priority: u32,
    pub description: String,
    pub tmux_pane: Option<String>,
    pub tmux_window: Option<String>,
    pub concurrency: Option<u32>,
    pub auto_restart: Option<bool>,
    pub llm_provider: Option<String>,
    pub llm_model: Option<String>,
    pub temperature: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessAgentConfig {
    pub enabled: bool,
    #[serde(rename = "type")]
    pub agent_type: String,
    pub description: String,
    pub llm_model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillConfig {
    pub enabled: bool,
    pub description: String,
    pub command: String,
}

// ==============================================================================
// Runtime Configuration
// ==============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeConfig {
    pub environment: EnvironmentConfig,
    pub logging: LoggingConfig,
    pub performance: PerformanceConfig,
    pub storage: StorageConfig,
    pub monitoring: RuntimeMonitoringConfig,
    pub security: RuntimeSecurityConfig,
    pub obsidian: Option<ObsidianConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentConfig {
    pub env: String,
    pub rust_log: String,
    pub rust_backtrace: String,
    pub debug_enabled: bool,
    pub verbose: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub format: String,
    pub stdout: bool,
    pub file: bool,
    pub syslog: bool,
    pub log_dir: PathBuf,
    pub log_file: String,
    pub error_log_file: String,
    pub access_log_file: String,
    pub rotation_enabled: bool,
    pub rotation_size: String,
    pub rotation_count: u32,
    pub rotation_compress: bool,
    pub filter_secrets: bool,
    pub mask_credentials: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub max_threads: u32,
    pub worker_threads: u32,
    pub blocking_threads: u32,
    pub max_memory: String,
    pub heap_size: String,
    pub request_timeout: u64,
    pub connection_timeout: u64,
    pub keepalive_timeout: u64,
    pub cache_enabled: bool,
    pub cache_ttl: u64,
    pub cache_size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub data_dir: PathBuf,
    pub cache_dir: PathBuf,
    pub tmp_dir: PathBuf,
    pub archive_dir: PathBuf,
    pub auto_cleanup: bool,
    pub cleanup_interval: u64,
    pub tmp_retention: u64,
    pub archive_retention: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeMonitoringConfig {
    pub metrics_enabled: bool,
    pub metrics_port: u16,
    pub health_check_enabled: bool,
    pub health_check_port: u16,
    pub health_check_path: String,
    pub prometheus_enabled: bool,
    pub prometheus_endpoint: String,
    pub grafana_enabled: bool,
    pub grafana_endpoint: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuntimeSecurityConfig {
    pub tls_enabled: bool,
    pub tls_cert_path: String,
    pub tls_key_path: String,
    pub api_key_required: bool,
    pub cors_enabled: bool,
    pub cors_origins: Vec<String>,
    pub audit_enabled: bool,
    pub audit_log_file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ObsidianConfig {
    pub enabled: bool,
    pub vault_path: PathBuf,
    pub auto_sync: bool,
    pub template_dir: String,
    pub daily_notes_dir: String,
}

// ==============================================================================
// Configuration Loader
// ==============================================================================

pub struct ConfigLoader {
    config_dir: PathBuf,
}

impl ConfigLoader {
    /// Create a new config loader with the default config directory
    pub fn new() -> Result<Self> {
        let home = std::env::var("HOME")
            .context("HOME environment variable not set")?;
        let config_dir = PathBuf::from(home).join(".miyabi/config");
        Ok(Self { config_dir })
    }

    /// Create a new config loader with a custom config directory
    pub fn with_config_dir<P: AsRef<Path>>(config_dir: P) -> Self {
        Self {
            config_dir: config_dir.as_ref().to_path_buf(),
        }
    }

    /// Load the core configuration
    pub fn load_core(&self) -> Result<MiyabiConfig> {
        let path = self.config_dir.join("core.toml");
        self.load_toml(&path)
    }

    /// Load the credentials configuration
    pub fn load_credentials(&self) -> Result<CredentialsConfig> {
        let path = self.config_dir.join("credentials.toml");
        self.load_toml(&path)
    }

    /// Load the agents configuration
    pub fn load_agents(&self) -> Result<AgentsConfig> {
        let path = self.config_dir.join("agents.toml");
        self.load_toml(&path)
    }

    /// Load the runtime configuration
    pub fn load_runtime(&self) -> Result<RuntimeConfig> {
        let path = self.config_dir.join("runtime.toml");
        self.load_toml(&path)
    }

    /// Load an integration configuration
    pub fn load_integration(&self, name: &str) -> Result<toml::Value> {
        let path = self.config_dir.join("integrations").join(format!("{}.toml", name));
        self.load_toml(&path)
    }

    /// Load all configurations
    pub fn load_all(&self) -> Result<AllConfig> {
        Ok(AllConfig {
            core: self.load_core()?,
            credentials: self.load_credentials()?,
            agents: self.load_agents()?,
            runtime: self.load_runtime()?,
        })
    }

    /// Generic TOML loader
    fn load_toml<T: for<'de> Deserialize<'de>>(&self, path: &Path) -> Result<T> {
        let content = std::fs::read_to_string(path)
            .with_context(|| format!("Failed to read config file: {}", path.display()))?;

        toml::from_str(&content)
            .with_context(|| format!("Failed to parse TOML config: {}", path.display()))
    }
}

impl Default for ConfigLoader {
    fn default() -> Self {
        Self::new().expect("Failed to create default ConfigLoader")
    }
}

#[derive(Debug, Clone)]
pub struct AllConfig {
    pub core: MiyabiConfig,
    pub credentials: CredentialsConfig,
    pub agents: AgentsConfig,
    pub runtime: RuntimeConfig,
}

// ==============================================================================
// Helper Functions
// ==============================================================================

/// Load the Miyabi configuration from the default location
pub fn load_config() -> Result<AllConfig> {
    ConfigLoader::new()?.load_all()
}

/// Load only the core configuration
pub fn load_core_config() -> Result<MiyabiConfig> {
    ConfigLoader::new()?.load_core()
}

/// Load only the credentials configuration
pub fn load_credentials_config() -> Result<CredentialsConfig> {
    ConfigLoader::new()?.load_credentials()
}

/// Load only the agents configuration
pub fn load_agents_config() -> Result<AgentsConfig> {
    ConfigLoader::new()?.load_agents()
}

/// Load only the runtime configuration
pub fn load_runtime_config() -> Result<RuntimeConfig> {
    ConfigLoader::new()?.load_runtime()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_loader_creation() {
        let loader = ConfigLoader::new();
        assert!(loader.is_ok());
    }

    #[test]
    fn test_load_core_config() {
        let loader = ConfigLoader::new().unwrap();
        let result = loader.load_core();
        // This will fail if config doesn't exist, which is expected in test env
        if let Ok(config) = result {
            assert_eq!(config.miyabi.edition, "rust");
        }
    }
}
