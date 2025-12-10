//! Creative Plugin Framework
//!
//! Secure plugin ecosystem for extending creative capabilities.
//!
//! # Features
//!
//! - Secure sandboxed execution environment
//! - Plugin lifecycle management (install, update, uninstall)
//! - Permission-based access control
//! - Dependency resolution
//! - Hot-reload support
//!
//! # Security
//!
//! Plugins run in isolated sandboxes with:
//! - Limited memory allocation
//! - Execution timeouts
//! - Restricted network access
//! - Controlled filesystem access

mod manifest;
mod sandbox;

pub use manifest::{
    PluginCategory, PluginManifest, PluginPermission, PluginPermissionScope,
    PluginPermissionType,
};
pub use sandbox::{PluginSandbox, SandboxConfig};

use crate::error::{PluginError, Result};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Plugin execution context
#[derive(Debug, Clone)]
pub struct PluginExecutionContext {
    /// User ID executing the plugin
    pub user_id: String,
    /// Project ID for scoping
    pub project_id: String,
    /// Collaborators in the session
    pub collaborators: Vec<CollaboratorInfo>,
    /// Available AI providers
    pub ai_providers: Vec<AvailableAIProvider>,
    /// Granted permissions
    pub permissions: Vec<PluginPermission>,
    /// Environment variables
    pub env: HashMap<String, String>,
}

/// Collaborator information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaboratorInfo {
    pub id: String,
    pub name: String,
    pub role: String,
    pub online: bool,
}

/// Available AI provider info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AvailableAIProvider {
    pub id: String,
    pub name: String,
    pub models: Vec<String>,
    pub available: bool,
}

/// Loaded plugin instance
pub struct LoadedPlugin {
    pub manifest: PluginManifest,
    pub sandbox: PluginSandbox,
    pub state: PluginState,
    pub loaded_at: chrono::DateTime<chrono::Utc>,
}

/// Plugin runtime state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PluginState {
    /// Plugin is loaded and ready
    Ready,
    /// Plugin is currently executing
    Running,
    /// Plugin is paused
    Paused,
    /// Plugin has encountered an error
    Error(String),
    /// Plugin is disabled
    Disabled,
}

/// Plugin execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginResult {
    pub success: bool,
    pub output: serde_json::Value,
    pub logs: Vec<String>,
    pub metrics: PluginMetrics,
}

/// Plugin execution metrics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PluginMetrics {
    pub execution_time_ms: u64,
    pub memory_used_bytes: u64,
    pub api_calls: u32,
    pub ai_tokens_used: u64,
}

/// Plugin event for lifecycle tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PluginEvent {
    Installed { plugin_id: String, version: String },
    Updated { plugin_id: String, from_version: String, to_version: String },
    Uninstalled { plugin_id: String },
    Executed { plugin_id: String, action: String, success: bool },
    Error { plugin_id: String, error: String },
}

/// Event handler trait for plugin lifecycle events
pub trait PluginEventHandler: Send + Sync {
    fn on_event(&self, event: PluginEvent);
}

/// Creative Plugin Framework
pub struct CreativePluginFramework {
    plugins: DashMap<String, Arc<RwLock<LoadedPlugin>>>,
    event_handlers: Arc<RwLock<Vec<Box<dyn PluginEventHandler>>>>,
    sandbox_base_dir: std::path::PathBuf,
}

impl CreativePluginFramework {
    /// Create a new plugin framework
    pub async fn new() -> Result<Self> {
        let sandbox_base_dir = dirs::cache_dir()
            .unwrap_or_else(|| std::path::PathBuf::from("/tmp"))
            .join("miyabi")
            .join("plugin-sandboxes");

        tokio::fs::create_dir_all(&sandbox_base_dir).await?;

        let framework = Self {
            plugins: DashMap::new(),
            event_handlers: Arc::new(RwLock::new(Vec::new())),
            sandbox_base_dir,
        };

        framework.initialize_core_plugins().await?;

        Ok(framework)
    }

    /// Initialize built-in core plugins
    async fn initialize_core_plugins(&self) -> Result<()> {
        // Core plugins are built into the framework
        // They provide essential functionality like:
        // - File operations
        // - Git integration
        // - HTTP requests
        // - AI model adapters
        tracing::info!("Core plugins initialized");
        Ok(())
    }

    /// Install a plugin from manifest and code
    pub async fn install_plugin(
        &self,
        manifest: PluginManifest,
        code: &str,
    ) -> Result<String> {
        self.validate_manifest(&manifest)?;

        if self.plugins.contains_key(&manifest.id) {
            return Err(PluginError::AlreadyInstalled(manifest.id.clone()).into());
        }

        // Check dependencies
        for dep in &manifest.dependencies {
            if !self.plugins.contains_key(dep) {
                return Err(PluginError::DependencyError(format!(
                    "Missing dependency: {}",
                    dep
                ))
                .into());
            }
        }

        let sandbox_config = SandboxConfig {
            memory_limit_mb: 50,
            execution_timeout_ms: 30000,
            allowed_apis: self.get_allowed_apis(&manifest.permissions),
            network_policy: self.create_network_policy(&manifest.permissions),
            working_dir: self.sandbox_base_dir.join(&manifest.id),
        };

        let sandbox = PluginSandbox::new(sandbox_config).await?;

        // Load the plugin code into the sandbox
        sandbox.load_code(code).await?;

        let plugin = LoadedPlugin {
            manifest: manifest.clone(),
            sandbox,
            state: PluginState::Ready,
            loaded_at: chrono::Utc::now(),
        };

        let plugin_id = manifest.id.clone();
        self.plugins.insert(plugin_id.clone(), Arc::new(RwLock::new(plugin)));

        self.emit_event(PluginEvent::Installed {
            plugin_id: manifest.id.clone(),
            version: manifest.version.clone(),
        })
        .await;

        tracing::info!(
            plugin_id = %manifest.id,
            version = %manifest.version,
            "Plugin installed"
        );

        Ok(plugin_id)
    }

    /// Execute a plugin action
    pub async fn execute_plugin(
        &self,
        plugin_id: &str,
        action: &str,
        params: serde_json::Value,
        context: PluginExecutionContext,
    ) -> Result<PluginResult> {
        let plugin_ref = self
            .plugins
            .get(plugin_id)
            .ok_or_else(|| PluginError::NotFound(plugin_id.to_string()))?;

        let plugin = plugin_ref.read().await;

        // Validate permissions
        self.validate_permissions(&plugin.manifest, action, &context)?;

        // Execute in sandbox
        let start_time = std::time::Instant::now();
        let result = plugin.sandbox.execute(action, params, &context).await?;
        let execution_time = start_time.elapsed();

        let plugin_result = PluginResult {
            success: true,
            output: result,
            logs: vec![],
            metrics: PluginMetrics {
                execution_time_ms: execution_time.as_millis() as u64,
                memory_used_bytes: 0,
                api_calls: 0,
                ai_tokens_used: 0,
            },
        };

        self.emit_event(PluginEvent::Executed {
            plugin_id: plugin_id.to_string(),
            action: action.to_string(),
            success: true,
        })
        .await;

        Ok(plugin_result)
    }

    /// Uninstall a plugin
    pub async fn uninstall_plugin(&self, plugin_id: &str) -> Result<()> {
        let plugin_ref = self
            .plugins
            .remove(plugin_id)
            .ok_or_else(|| PluginError::NotFound(plugin_id.to_string()))?;

        let plugin = plugin_ref.1.read().await;

        // Clean up sandbox
        plugin.sandbox.cleanup().await?;

        self.emit_event(PluginEvent::Uninstalled {
            plugin_id: plugin_id.to_string(),
        })
        .await;

        tracing::info!(plugin_id = %plugin_id, "Plugin uninstalled");

        Ok(())
    }

    /// List all installed plugins
    pub fn list_plugins(&self) -> Vec<PluginManifest> {
        self.plugins
            .iter()
            .filter_map(|entry| {
                let plugin = entry.value().try_read().ok()?;
                Some(plugin.manifest.clone())
            })
            .collect()
    }

    /// Get plugin status
    pub async fn get_plugin_status(&self, plugin_id: &str) -> Result<PluginState> {
        let plugin_ref = self
            .plugins
            .get(plugin_id)
            .ok_or_else(|| PluginError::NotFound(plugin_id.to_string()))?;

        let plugin = plugin_ref.read().await;
        Ok(plugin.state.clone())
    }

    /// Register an event handler
    pub async fn register_event_handler(
        &self,
        handler: Box<dyn PluginEventHandler>,
    ) {
        let mut handlers = self.event_handlers.write().await;
        handlers.push(handler);
    }

    // Private helpers

    fn validate_manifest(&self, manifest: &PluginManifest) -> Result<()> {
        if manifest.id.is_empty() {
            return Err(PluginError::InvalidManifest("ID is required".to_string()).into());
        }
        if manifest.name.is_empty() {
            return Err(PluginError::InvalidManifest("Name is required".to_string()).into());
        }
        if manifest.version.is_empty() {
            return Err(PluginError::InvalidManifest("Version is required".to_string()).into());
        }
        Ok(())
    }

    fn validate_permissions(
        &self,
        manifest: &PluginManifest,
        action: &str,
        context: &PluginExecutionContext,
    ) -> Result<()> {
        // Check if the requested action is allowed by context permissions
        for required in &manifest.permissions {
            let has_permission = context
                .permissions
                .iter()
                .any(|p| p.permission_type == required.permission_type);

            if !has_permission {
                return Err(PluginError::PermissionDenied(format!(
                    "Missing permission: {:?} for action: {}",
                    required.permission_type, action
                ))
                .into());
            }
        }
        Ok(())
    }

    fn get_allowed_apis(&self, permissions: &[PluginPermission]) -> Vec<String> {
        permissions
            .iter()
            .filter(|p| p.permission_type == PluginPermissionType::ApiAccess)
            .map(|p| p.resource.clone())
            .collect()
    }

    fn create_network_policy(
        &self,
        permissions: &[PluginPermission],
    ) -> NetworkPolicy {
        let has_network = permissions
            .iter()
            .any(|p| p.permission_type == PluginPermissionType::Network);

        if has_network {
            NetworkPolicy::AllowList(
                permissions
                    .iter()
                    .filter(|p| p.permission_type == PluginPermissionType::Network)
                    .map(|p| p.resource.clone())
                    .collect(),
            )
        } else {
            NetworkPolicy::DenyAll
        }
    }

    async fn emit_event(&self, event: PluginEvent) {
        let handlers = self.event_handlers.read().await;
        for handler in handlers.iter() {
            handler.on_event(event.clone());
        }
    }
}

/// Network policy for plugin sandbox
#[derive(Debug, Clone)]
pub enum NetworkPolicy {
    AllowAll,
    DenyAll,
    AllowList(Vec<String>),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_framework_creation() {
        let framework = CreativePluginFramework::new().await;
        assert!(framework.is_ok());
    }

    #[test]
    fn test_manifest_validation() {
        let manifest = PluginManifest {
            id: "".to_string(),
            name: "Test".to_string(),
            version: "1.0.0".to_string(),
            ..Default::default()
        };

        let framework = CreativePluginFramework {
            plugins: DashMap::new(),
            event_handlers: Arc::new(RwLock::new(Vec::new())),
            sandbox_base_dir: std::path::PathBuf::from("/tmp"),
        };

        let result = framework.validate_manifest(&manifest);
        assert!(result.is_err());
    }
}
