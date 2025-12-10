//! Plugin sandboxing for secure execution

use crate::error::{PluginError, Result};
use crate::plugin::{NetworkPolicy, PluginExecutionContext};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Sandbox configuration
#[derive(Debug, Clone)]
pub struct SandboxConfig {
    /// Maximum memory in MB
    pub memory_limit_mb: u64,
    /// Execution timeout in milliseconds
    pub execution_timeout_ms: u64,
    /// Allowed API endpoints
    pub allowed_apis: Vec<String>,
    /// Network access policy
    pub network_policy: NetworkPolicy,
    /// Working directory for the sandbox
    pub working_dir: PathBuf,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            memory_limit_mb: 50,
            execution_timeout_ms: 30000,
            allowed_apis: vec![],
            network_policy: NetworkPolicy::DenyAll,
            working_dir: PathBuf::from("/tmp/miyabi-sandbox"),
        }
    }
}

/// Sandbox resource usage
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ResourceUsage {
    pub memory_used_bytes: u64,
    pub cpu_time_ms: u64,
    pub api_calls: u32,
    pub network_requests: u32,
}

/// Sandbox execution state
#[derive(Debug, Clone)]
pub struct ExecutionState {
    pub variables: HashMap<String, serde_json::Value>,
    pub call_stack: Vec<String>,
    pub resource_usage: ResourceUsage,
}

impl Default for ExecutionState {
    fn default() -> Self {
        Self {
            variables: HashMap::new(),
            call_stack: Vec::new(),
            resource_usage: ResourceUsage::default(),
        }
    }
}

/// Plugin sandbox for secure execution
pub struct PluginSandbox {
    config: SandboxConfig,
    state: Arc<RwLock<ExecutionState>>,
    code: Arc<RwLock<Option<String>>>,
    actions: Arc<RwLock<HashMap<String, ActionHandler>>>,
}

/// Type alias for action handlers
type ActionHandler = Box<dyn Fn(serde_json::Value, &PluginExecutionContext) -> serde_json::Value + Send + Sync>;

impl PluginSandbox {
    /// Create a new sandbox with the given configuration
    pub async fn new(config: SandboxConfig) -> Result<Self> {
        // Ensure working directory exists
        tokio::fs::create_dir_all(&config.working_dir).await?;

        Ok(Self {
            config,
            state: Arc::new(RwLock::new(ExecutionState::default())),
            code: Arc::new(RwLock::new(None)),
            actions: Arc::new(RwLock::new(HashMap::new())),
        })
    }

    /// Load plugin code into the sandbox
    pub async fn load_code(&self, code: &str) -> Result<()> {
        // In a real implementation, this would parse and validate the code
        // For WASM support, this would compile the code to WASM module
        let mut code_lock = self.code.write().await;
        *code_lock = Some(code.to_string());

        // Register built-in actions for the plugin
        self.register_builtin_actions().await;

        tracing::debug!("Plugin code loaded ({} bytes)", code.len());
        Ok(())
    }

    /// Register built-in actions
    async fn register_builtin_actions(&self) {
        let mut actions = self.actions.write().await;

        // Echo action for testing
        actions.insert(
            "echo".to_string(),
            Box::new(|params, _ctx| params) as ActionHandler,
        );

        // Get config action
        actions.insert(
            "get_config".to_string(),
            Box::new(|_params, ctx| {
                serde_json::json!({
                    "user_id": ctx.user_id,
                    "project_id": ctx.project_id,
                })
            }) as ActionHandler,
        );

        // Transform action
        actions.insert(
            "transform".to_string(),
            Box::new(|params, _ctx| {
                // Simple pass-through transform
                params
            }) as ActionHandler,
        );
    }

    /// Execute an action in the sandbox
    pub async fn execute(
        &self,
        action: &str,
        params: serde_json::Value,
        context: &PluginExecutionContext,
    ) -> Result<serde_json::Value> {
        // Check resource limits before execution
        self.check_resource_limits().await?;

        let start_time = std::time::Instant::now();

        // Execute with timeout
        let result = tokio::time::timeout(
            std::time::Duration::from_millis(self.config.execution_timeout_ms),
            self.execute_action(action, params, context),
        )
        .await
        .map_err(|_| PluginError::Timeout(action.to_string()))?;

        // Update resource usage
        let elapsed = start_time.elapsed();
        let mut state = self.state.write().await;
        state.resource_usage.cpu_time_ms += elapsed.as_millis() as u64;

        result
    }

    /// Execute an action
    async fn execute_action(
        &self,
        action: &str,
        params: serde_json::Value,
        context: &PluginExecutionContext,
    ) -> Result<serde_json::Value> {
        let actions = self.actions.read().await;

        if let Some(handler) = actions.get(action) {
            Ok(handler(params, context))
        } else {
            // For custom actions, execute the loaded plugin code
            // In a real implementation, this would run WASM or interpret JS
            let code = self.code.read().await;
            if code.is_some() {
                // Simulate plugin execution
                Ok(serde_json::json!({
                    "action": action,
                    "params": params,
                    "executed": true,
                }))
            } else {
                Err(PluginError::ExecutionFailed(format!(
                    "Action not found: {}",
                    action
                ))
                .into())
            }
        }
    }

    /// Check if resource limits are exceeded
    async fn check_resource_limits(&self) -> Result<()> {
        let state = self.state.read().await;
        let usage = &state.resource_usage;

        if usage.memory_used_bytes > self.config.memory_limit_mb * 1024 * 1024 {
            return Err(PluginError::SandboxViolation(
                "Memory limit exceeded".to_string(),
            )
            .into());
        }

        Ok(())
    }

    /// Check if network access is allowed for the given host
    pub fn check_network_access(&self, host: &str) -> bool {
        match &self.config.network_policy {
            NetworkPolicy::AllowAll => true,
            NetworkPolicy::DenyAll => false,
            NetworkPolicy::AllowList(list) => list.iter().any(|h| host.ends_with(h)),
        }
    }

    /// Check if API access is allowed
    pub fn check_api_access(&self, api: &str) -> bool {
        self.config.allowed_apis.iter().any(|a| api.starts_with(a))
    }

    /// Get current resource usage
    pub async fn get_resource_usage(&self) -> ResourceUsage {
        let state = self.state.read().await;
        state.resource_usage.clone()
    }

    /// Get sandbox configuration
    pub fn config(&self) -> &SandboxConfig {
        &self.config
    }

    /// Clean up sandbox resources
    pub async fn cleanup(&self) -> Result<()> {
        // Clear state
        let mut state = self.state.write().await;
        *state = ExecutionState::default();

        // Clear code
        let mut code = self.code.write().await;
        *code = None;

        // Clean up working directory
        if self.config.working_dir.exists() {
            tokio::fs::remove_dir_all(&self.config.working_dir).await?;
        }

        tracing::debug!("Sandbox cleaned up");
        Ok(())
    }

    /// Reset execution state without unloading code
    pub async fn reset_state(&self) {
        let mut state = self.state.write().await;
        state.variables.clear();
        state.call_stack.clear();
        state.resource_usage = ResourceUsage::default();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[tokio::test]
    async fn test_sandbox_creation() {
        let config = SandboxConfig::default();
        let sandbox = PluginSandbox::new(config).await;
        assert!(sandbox.is_ok());
    }

    #[tokio::test]
    async fn test_sandbox_execution() {
        let config = SandboxConfig::default();
        let sandbox = PluginSandbox::new(config).await.unwrap();

        sandbox.load_code("// test code").await.unwrap();

        let context = PluginExecutionContext {
            user_id: "test-user".to_string(),
            project_id: "test-project".to_string(),
            collaborators: vec![],
            ai_providers: vec![],
            permissions: vec![],
            env: HashMap::new(),
        };

        let result = sandbox
            .execute("echo", serde_json::json!({"message": "hello"}), &context)
            .await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap()["message"], "hello");
    }

    #[test]
    fn test_network_policy() {
        let config = SandboxConfig {
            network_policy: NetworkPolicy::AllowList(vec!["github.com".to_string()]),
            ..Default::default()
        };

        // Synchronously create sandbox for test
        let sandbox = PluginSandbox {
            config,
            state: Arc::new(RwLock::new(ExecutionState::default())),
            code: Arc::new(RwLock::new(None)),
            actions: Arc::new(RwLock::new(HashMap::new())),
        };

        assert!(sandbox.check_network_access("api.github.com"));
        assert!(!sandbox.check_network_access("evil.com"));
    }
}
