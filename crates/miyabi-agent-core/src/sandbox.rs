//! Miyabi Agent Sandbox System
//!
//! Claude Code style sandbox functionality for safe agent execution.
//! Provides filesystem isolation, network controls, and resource limits.
//!
//! ## Features
//!
//! - **Filesystem Isolation**: Restrict agent access to specific directories
//! - **Network Controls**: Allow/deny network access per agent
//! - **Resource Limits**: CPU, memory, and time limits
//! - **Permission System**: Fine-grained permission controls
//! - **Audit Logging**: Track all sandbox operations

use std::path::{Path, PathBuf};
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use std::sync::Arc;

/// Sandbox permission level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PermissionLevel {
    /// No restrictions (danger mode)
    Unrestricted,
    /// Standard restrictions with prompts
    Standard,
    /// Strict mode - minimal permissions
    Strict,
    /// Custom permission set
    Custom,
}

/// Network access policy
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum NetworkPolicy {
    /// Allow all network access
    #[default]
    AllowAll,
    /// Deny all network access
    DenyAll,
    /// Allow specific domains only
    AllowList(Vec<String>),
    /// Deny specific domains
    DenyList(Vec<String>),
}

/// Filesystem access policy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilesystemPolicy {
    /// Allowed read paths
    pub read_paths: Vec<PathBuf>,
    /// Allowed write paths
    pub write_paths: Vec<PathBuf>,
    /// Denied paths (takes precedence)
    pub denied_paths: Vec<PathBuf>,
    /// Allow creating new files
    pub allow_create: bool,
    /// Allow deleting files
    pub allow_delete: bool,
    /// Allow executing files
    pub allow_execute: bool,
}

impl Default for FilesystemPolicy {
    fn default() -> Self {
        Self {
            read_paths: vec![PathBuf::from(".")],
            write_paths: vec![PathBuf::from(".")],
            denied_paths: vec![
                PathBuf::from("/etc"),
                PathBuf::from("/root"),
                PathBuf::from("/var"),
                PathBuf::from("~/.ssh"),
                PathBuf::from("~/.aws"),
            ],
            allow_create: true,
            allow_delete: false,
            allow_execute: false,
        }
    }
}

/// Resource limits for sandbox
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    /// Maximum CPU time (in seconds)
    pub max_cpu_time: Option<u64>,
    /// Maximum memory (in MB)
    pub max_memory_mb: Option<u64>,
    /// Maximum execution time
    pub max_duration: Option<Duration>,
    /// Maximum file size (in MB)
    pub max_file_size_mb: Option<u64>,
    /// Maximum number of open files
    pub max_open_files: Option<u32>,
    /// Maximum number of processes
    pub max_processes: Option<u32>,
}

impl Default for ResourceLimits {
    fn default() -> Self {
        Self {
            max_cpu_time: Some(300),      // 5 minutes
            max_memory_mb: Some(1024),     // 1GB
            max_duration: Some(Duration::from_secs(600)), // 10 minutes
            max_file_size_mb: Some(100),   // 100MB
            max_open_files: Some(256),
            max_processes: Some(10),
        }
    }
}

/// Sandbox configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SandboxConfig {
    /// Unique sandbox ID
    pub id: String,
    /// Agent name running in this sandbox
    pub agent_name: String,
    /// Permission level
    pub permission_level: PermissionLevel,
    /// Network policy
    pub network_policy: NetworkPolicy,
    /// Filesystem policy
    pub filesystem_policy: FilesystemPolicy,
    /// Resource limits
    pub resource_limits: ResourceLimits,
    /// Working directory (isolated)
    pub working_dir: PathBuf,
    /// Environment variables to pass through
    pub env_allowlist: Vec<String>,
    /// Custom environment variables
    pub env_vars: std::collections::HashMap<String, String>,
    /// Enable audit logging
    pub audit_enabled: bool,
}

impl SandboxConfig {
    /// Create a new sandbox config with standard settings
    pub fn standard(agent_name: &str, working_dir: PathBuf) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            agent_name: agent_name.to_string(),
            permission_level: PermissionLevel::Standard,
            network_policy: NetworkPolicy::default(),
            filesystem_policy: FilesystemPolicy::default(),
            resource_limits: ResourceLimits::default(),
            working_dir,
            env_allowlist: vec![
                "PATH".to_string(),
                "HOME".to_string(),
                "USER".to_string(),
                "LANG".to_string(),
                "TERM".to_string(),
            ],
            env_vars: std::collections::HashMap::new(),
            audit_enabled: true,
        }
    }

    /// Create a strict sandbox config
    pub fn strict(agent_name: &str, working_dir: PathBuf) -> Self {
        let mut config = Self::standard(agent_name, working_dir);
        config.permission_level = PermissionLevel::Strict;
        config.network_policy = NetworkPolicy::DenyAll;
        config.filesystem_policy.allow_delete = false;
        config.filesystem_policy.allow_execute = false;
        config.resource_limits.max_duration = Some(Duration::from_secs(120));
        config
    }

    /// Create an unrestricted sandbox (danger mode)
    pub fn danger_full_access(agent_name: &str, working_dir: PathBuf) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            agent_name: agent_name.to_string(),
            permission_level: PermissionLevel::Unrestricted,
            network_policy: NetworkPolicy::AllowAll,
            filesystem_policy: FilesystemPolicy {
                read_paths: vec![PathBuf::from("/")],
                write_paths: vec![PathBuf::from("/")],
                denied_paths: vec![],
                allow_create: true,
                allow_delete: true,
                allow_execute: true,
            },
            resource_limits: ResourceLimits {
                max_cpu_time: None,
                max_memory_mb: None,
                max_duration: None,
                max_file_size_mb: None,
                max_open_files: None,
                max_processes: None,
            },
            working_dir,
            env_allowlist: vec!["*".to_string()],
            env_vars: std::collections::HashMap::new(),
            audit_enabled: true,
        }
    }
}

/// Sandbox operation audit entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub sandbox_id: String,
    pub agent_name: String,
    pub operation: String,
    pub target: String,
    pub allowed: bool,
    pub reason: Option<String>,
}

/// Sandbox manager for agent execution
pub struct SandboxManager {
    /// Active sandboxes
    sandboxes: Arc<RwLock<std::collections::HashMap<String, SandboxConfig>>>,
    /// Audit log
    audit_log: Arc<RwLock<Vec<AuditEntry>>>,
    /// Base directory for sandbox working directories
    base_dir: PathBuf,
}

impl SandboxManager {
    /// Create a new sandbox manager
    pub async fn new<P: AsRef<Path>>(base_dir: P) -> anyhow::Result<Self> {
        let base_dir = base_dir.as_ref().to_path_buf();
        tokio::fs::create_dir_all(&base_dir).await?;

        Ok(Self {
            sandboxes: Arc::new(RwLock::new(std::collections::HashMap::new())),
            audit_log: Arc::new(RwLock::new(Vec::new())),
            base_dir,
        })
    }

    /// Create a new sandbox for an agent
    pub async fn create_sandbox(&self, config: SandboxConfig) -> anyhow::Result<String> {
        let sandbox_id = config.id.clone();
        
        // Create isolated working directory
        let sandbox_dir = self.base_dir.join(&sandbox_id);
        tokio::fs::create_dir_all(&sandbox_dir).await?;

        // Store sandbox config
        let mut sandboxes = self.sandboxes.write().await;
        sandboxes.insert(sandbox_id.clone(), config.clone());

        self.audit(
            &sandbox_id,
            &config.agent_name,
            "sandbox_create",
            &sandbox_dir.to_string_lossy(),
            true,
            None,
        ).await;

        tracing::info!(
            sandbox_id = %sandbox_id,
            agent = %config.agent_name,
            permission_level = ?config.permission_level,
            "Sandbox created"
        );

        Ok(sandbox_id)
    }

    /// Check if a filesystem operation is allowed
    pub async fn check_filesystem_access(
        &self,
        sandbox_id: &str,
        path: &Path,
        operation: &str,
    ) -> anyhow::Result<bool> {
        let sandboxes = self.sandboxes.read().await;
        let config = sandboxes.get(sandbox_id)
            .ok_or_else(|| anyhow::anyhow!("Sandbox not found: {}", sandbox_id))?;

        // Unrestricted mode allows everything
        if config.permission_level == PermissionLevel::Unrestricted {
            return Ok(true);
        }

        let policy = &config.filesystem_policy;
        let path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());

        // Check denied paths first
        for denied in &policy.denied_paths {
            let denied = shellexpand::tilde(denied.to_string_lossy().as_ref()).to_string();
            if path.starts_with(&denied) {
                self.audit(
                    sandbox_id,
                    &config.agent_name,
                    operation,
                    &path.to_string_lossy(),
                    false,
                    Some("Path is in denied list".to_string()),
                ).await;
                return Ok(false);
            }
        }

        // Check operation-specific permissions
        let allowed = match operation {
            "read" => policy.read_paths.iter().any(|p| path.starts_with(p)),
            "write" => policy.write_paths.iter().any(|p| path.starts_with(p)),
            "create" => policy.allow_create && policy.write_paths.iter().any(|p| path.starts_with(p)),
            "delete" => policy.allow_delete && policy.write_paths.iter().any(|p| path.starts_with(p)),
            "execute" => policy.allow_execute,
            _ => false,
        };

        self.audit(
            sandbox_id,
            &config.agent_name,
            operation,
            &path.to_string_lossy(),
            allowed,
            if allowed { None } else { Some("Not in allowed paths".to_string()) },
        ).await;

        Ok(allowed)
    }

    /// Check if network access is allowed
    pub async fn check_network_access(
        &self,
        sandbox_id: &str,
        host: &str,
    ) -> anyhow::Result<bool> {
        let sandboxes = self.sandboxes.read().await;
        let config = sandboxes.get(sandbox_id)
            .ok_or_else(|| anyhow::anyhow!("Sandbox not found: {}", sandbox_id))?;

        let allowed = match &config.network_policy {
            NetworkPolicy::AllowAll => true,
            NetworkPolicy::DenyAll => false,
            NetworkPolicy::AllowList(list) => list.iter().any(|d| host.ends_with(d)),
            NetworkPolicy::DenyList(list) => !list.iter().any(|d| host.ends_with(d)),
        };

        self.audit(
            sandbox_id,
            &config.agent_name,
            "network",
            host,
            allowed,
            if allowed { None } else { Some("Network policy denied".to_string()) },
        ).await;

        Ok(allowed)
    }

    /// Get sandbox configuration
    pub async fn get_config(&self, sandbox_id: &str) -> Option<SandboxConfig> {
        let sandboxes = self.sandboxes.read().await;
        sandboxes.get(sandbox_id).cloned()
    }

    /// Destroy a sandbox
    pub async fn destroy_sandbox(&self, sandbox_id: &str) -> anyhow::Result<()> {
        let mut sandboxes = self.sandboxes.write().await;
        
        if let Some(config) = sandboxes.remove(sandbox_id) {
            // Clean up sandbox directory
            let sandbox_dir = self.base_dir.join(sandbox_id);
            if sandbox_dir.exists() {
                tokio::fs::remove_dir_all(&sandbox_dir).await?;
            }

            self.audit(
                sandbox_id,
                &config.agent_name,
                "sandbox_destroy",
                &sandbox_dir.to_string_lossy(),
                true,
                None,
            ).await;

            tracing::info!(sandbox_id = %sandbox_id, "Sandbox destroyed");
        }

        Ok(())
    }

    /// Get audit log for a sandbox
    pub async fn get_audit_log(&self, sandbox_id: Option<&str>) -> Vec<AuditEntry> {
        let log = self.audit_log.read().await;
        match sandbox_id {
            Some(id) => log.iter().filter(|e| e.sandbox_id == id).cloned().collect(),
            None => log.clone(),
        }
    }

    /// List active sandboxes
    pub async fn list_sandboxes(&self) -> Vec<String> {
        let sandboxes = self.sandboxes.read().await;
        sandboxes.keys().cloned().collect()
    }

    // Private audit helper
    async fn audit(
        &self,
        sandbox_id: &str,
        agent_name: &str,
        operation: &str,
        target: &str,
        allowed: bool,
        reason: Option<String>,
    ) {
        let entry = AuditEntry {
            timestamp: chrono::Utc::now(),
            sandbox_id: sandbox_id.to_string(),
            agent_name: agent_name.to_string(),
            operation: operation.to_string(),
            target: target.to_string(),
            allowed,
            reason,
        };

        let mut log = self.audit_log.write().await;
        log.push(entry);

        // Keep only last 10000 entries
        if log.len() > 10000 {
            log.drain(0..1000);
        }
    }
}

/// Sandbox execution context for agents
pub struct SandboxContext {
    pub sandbox_id: String,
    pub working_dir: PathBuf,
    pub env_vars: std::collections::HashMap<String, String>,
    manager: Arc<SandboxManager>,
}

impl SandboxContext {
    /// Create a new sandbox context
    pub async fn new(manager: Arc<SandboxManager>, config: SandboxConfig) -> anyhow::Result<Self> {
        let sandbox_id = manager.create_sandbox(config.clone()).await?;
        let working_dir = manager.base_dir.join(&sandbox_id);

        Ok(Self {
            sandbox_id,
            working_dir,
            env_vars: config.env_vars,
            manager,
        })
    }

    /// Check if file read is allowed
    pub async fn can_read(&self, path: &Path) -> bool {
        self.manager.check_filesystem_access(&self.sandbox_id, path, "read")
            .await
            .unwrap_or(false)
    }

    /// Check if file write is allowed
    pub async fn can_write(&self, path: &Path) -> bool {
        self.manager.check_filesystem_access(&self.sandbox_id, path, "write")
            .await
            .unwrap_or(false)
    }

    /// Check if network access is allowed
    pub async fn can_access_network(&self, host: &str) -> bool {
        self.manager.check_network_access(&self.sandbox_id, host)
            .await
            .unwrap_or(false)
    }
}

impl Drop for SandboxContext {
    fn drop(&mut self) {
        let manager = self.manager.clone();
        let sandbox_id = self.sandbox_id.clone();
        tokio::spawn(async move {
            let _ = manager.destroy_sandbox(&sandbox_id).await;
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_sandbox_creation() {
        let temp_dir = TempDir::new().unwrap();
        let manager = SandboxManager::new(temp_dir.path()).await.unwrap();

        let config = SandboxConfig::standard("TestAgent", temp_dir.path().to_path_buf());
        let sandbox_id = manager.create_sandbox(config).await.unwrap();

        assert!(!sandbox_id.is_empty());
        assert!(manager.list_sandboxes().await.contains(&sandbox_id));
    }

    #[tokio::test]
    async fn test_filesystem_policy() {
        let temp_dir = TempDir::new().unwrap();
        let manager = SandboxManager::new(temp_dir.path()).await.unwrap();

        let mut config = SandboxConfig::strict("TestAgent", temp_dir.path().to_path_buf());
        config.filesystem_policy.denied_paths.push(PathBuf::from("/secret"));
        
        let sandbox_id = manager.create_sandbox(config).await.unwrap();

        // Should deny access to /secret
        let allowed = manager.check_filesystem_access(
            &sandbox_id,
            Path::new("/secret/file.txt"),
            "read"
        ).await.unwrap();
        assert!(!allowed);
    }

    #[tokio::test]
    async fn test_network_policy() {
        let temp_dir = TempDir::new().unwrap();
        let manager = SandboxManager::new(temp_dir.path()).await.unwrap();

        let mut config = SandboxConfig::standard("TestAgent", temp_dir.path().to_path_buf());
        config.network_policy = NetworkPolicy::AllowList(vec!["github.com".to_string()]);
        
        let sandbox_id = manager.create_sandbox(config).await.unwrap();

        // Should allow github.com
        assert!(manager.check_network_access(&sandbox_id, "api.github.com").await.unwrap());
        
        // Should deny other domains
        assert!(!manager.check_network_access(&sandbox_id, "evil.com").await.unwrap());
    }
}
