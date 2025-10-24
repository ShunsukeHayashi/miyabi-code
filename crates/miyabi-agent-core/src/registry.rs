//! Hook Registry - Global hook management with singleton pattern
//!
//! Provides centralized hook registration and execution to eliminate redundant
//! hook invocations across multiple agent instances.

use crate::hooks::AgentHook;
use miyabi_types::{AgentType, Task};
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Global hook registry singleton
///
/// Manages both global hooks (executed once across all agents) and
/// instance-specific hooks (executed per agent instance).
///
/// # Thread Safety
///
/// Uses `Arc<Mutex<>>` for interior mutability and thread-safe access.
///
/// # Example
///
/// ```rust
/// use miyabi_agent_core::HookRegistry;
/// use miyabi_agent_core::EnvironmentCheckHook;
/// use std::sync::Arc;
///
/// // Register global hook at startup
/// let registry = HookRegistry::global();
/// let mut reg = registry.lock().unwrap();
/// reg.register_global(
///     "env_check",
///     Arc::new(EnvironmentCheckHook::new(vec!["GITHUB_TOKEN".to_string()]))
/// );
///
/// // Execute all global hooks (happens automatically in HookedAgent)
/// // registry.lock().unwrap().execute_global_hooks(&task).await?;
/// ```
#[derive(Clone)]
pub struct HookRegistry {
    /// Global hooks shared across all agents (executed once)
    global_hooks: Arc<Mutex<HashMap<String, Arc<dyn AgentHook>>>>,

    /// Instance-specific hooks (executed per agent)
    instance_hooks: Arc<Mutex<HashMap<String, Arc<dyn AgentHook>>>>,

    /// Cache for global hook execution results
    global_execution_cache: Arc<Mutex<HashMap<String, bool>>>,
}

/// Global singleton instance
static REGISTRY: Lazy<Arc<Mutex<HookRegistry>>> = Lazy::new(|| {
    Arc::new(Mutex::new(HookRegistry {
        global_hooks: Arc::new(Mutex::new(HashMap::new())),
        instance_hooks: Arc::new(Mutex::new(HashMap::new())),
        global_execution_cache: Arc::new(Mutex::new(HashMap::new())),
    }))
});

impl HookRegistry {
    /// Get the global registry instance
    ///
    /// # Example
    ///
    /// ```rust
    /// use miyabi_agent_core::HookRegistry;
    ///
    /// let registry = HookRegistry::global();
    /// ```
    pub fn global() -> Arc<Mutex<Self>> {
        REGISTRY.clone()
    }

    /// Register a global hook (executed once across all agents)
    ///
    /// # Arguments
    ///
    /// * `name` - Unique identifier for the hook
    /// * `hook` - Hook implementation
    ///
    /// # Example
    ///
    /// ```rust
    /// use miyabi_agent_core::{HookRegistry, EnvironmentCheckHook};
    /// use std::sync::Arc;
    ///
    /// let registry = HookRegistry::global();
    /// let mut reg = registry.lock().unwrap();
    /// reg.register_global(
    ///     "env_check",
    ///     Arc::new(EnvironmentCheckHook::new(vec!["GITHUB_TOKEN".to_string()]))
    /// );
    /// ```
    pub fn register_global(&mut self, name: impl Into<String>, hook: Arc<dyn AgentHook>) {
        let name = name.into();
        tracing::debug!("Registering global hook: {}", name);

        let mut hooks = self.global_hooks.lock().unwrap();
        hooks.insert(name, hook);
    }

    /// Register an instance-specific hook (executed per agent)
    ///
    /// # Arguments
    ///
    /// * `name` - Unique identifier for the hook
    /// * `hook` - Hook implementation
    pub fn register_instance(&mut self, name: impl Into<String>, hook: Arc<dyn AgentHook>) {
        let name = name.into();
        tracing::debug!("Registering instance hook: {}", name);

        let mut hooks = self.instance_hooks.lock().unwrap();
        hooks.insert(name, hook);
    }

    /// Execute all global hooks (with caching to prevent redundant execution)
    ///
    /// Global hooks are only executed once. Subsequent calls return cached results.
    ///
    /// # Arguments
    ///
    /// * `task` - Task context for hook execution
    ///
    /// # Returns
    ///
    /// `Ok(())` if all hooks succeeded or were cached
    /// `Err` if any hook failed
    ///
    /// # Example
    ///
    /// ```rust,no_run
    /// # use miyabi_agent_core::HookRegistry;
    /// # use miyabi_types::Task;
    /// # async fn example(task: &Task) -> anyhow::Result<()> {
    /// let registry = HookRegistry::global();
    /// let reg = registry.lock().unwrap();
    /// reg.execute_global_hooks(task).await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn execute_global_hooks(&self, task: &Task) -> anyhow::Result<()> {
        // Get hooks that need execution (clone Arc references, release lock)
        let hooks_to_execute: Vec<(String, Arc<dyn AgentHook>)> = {
            let hooks = self.global_hooks.lock().unwrap();
            let cache = self.global_execution_cache.lock().unwrap();

            hooks
                .iter()
                .filter(|(name, _)| !cache.contains_key(*name))
                .map(|(name, hook)| (name.clone(), Arc::clone(hook)))
                .collect()
        };

        // Execute each hook (lock is released)
        for (name, hook) in hooks_to_execute {
            tracing::debug!("Executing global hook: {}", name);

            let agent_type = task.assigned_agent.unwrap_or(AgentType::CoordinatorAgent);
            hook.on_pre_execute(agent_type, task).await?;

            // Cache result
            let mut cache = self.global_execution_cache.lock().unwrap();
            cache.insert(name, true);
        }

        Ok(())
    }

    /// Execute all instance-specific hooks
    ///
    /// Instance hooks are executed every time (no caching).
    ///
    /// # Arguments
    ///
    /// * `task` - Task context for hook execution
    pub async fn execute_instance_hooks(&self, task: &Task) -> anyhow::Result<()> {
        // Get all hooks (clone Arc references, release lock)
        let hooks_to_execute: Vec<(String, Arc<dyn AgentHook>)> = {
            let hooks = self.instance_hooks.lock().unwrap();
            hooks
                .iter()
                .map(|(name, hook)| (name.clone(), Arc::clone(hook)))
                .collect()
        };

        // Execute each hook (lock is released)
        for (name, hook) in hooks_to_execute {
            tracing::debug!("Executing instance hook: {}", name);
            let agent_type = task.assigned_agent.unwrap_or(AgentType::CoordinatorAgent);
            hook.on_pre_execute(agent_type, task).await?;
        }

        Ok(())
    }

    /// Get count of registered global hooks
    pub fn global_hook_count(&self) -> usize {
        self.global_hooks.lock().unwrap().len()
    }

    /// Get count of registered instance hooks
    pub fn instance_hook_count(&self) -> usize {
        self.instance_hooks.lock().unwrap().len()
    }

    /// Clear all hooks and cache (primarily for testing)
    #[cfg(test)]
    pub fn clear_all(&mut self) {
        self.global_hooks.lock().unwrap().clear();
        self.instance_hooks.lock().unwrap().clear();
        self.global_execution_cache.lock().unwrap().clear();
    }

    /// Check if a global hook has been executed
    #[cfg(test)]
    pub fn is_global_hook_cached(&self, name: &str) -> bool {
        self.global_execution_cache.lock().unwrap().contains_key(name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hooks::EnvironmentCheckHook;
    use miyabi_types::{task::TaskType, AgentType};
    use std::collections::HashMap;

    fn create_test_task() -> Task {
        Task {
            id: "test-task".to_string(),
            title: "Test Task".to_string(),
            description: "Test Description".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::new()),
        }
    }

    #[test]
    fn test_hook_registry_singleton() {
        let registry1 = HookRegistry::global();
        let registry2 = HookRegistry::global();

        // Both references should point to the same instance
        assert!(Arc::ptr_eq(&registry1, &registry2));
    }

    #[test]
    fn test_register_global_hook() {
        let registry = HookRegistry::global();
        let mut reg = registry.lock().unwrap();
        reg.clear_all();

        reg.register_global(
            "test_hook",
            Arc::new(EnvironmentCheckHook::new(vec!["TEST_VAR".to_string()])),
        );

        assert_eq!(reg.global_hook_count(), 1);
    }

    #[test]
    fn test_register_instance_hook() {
        let registry = HookRegistry::global();
        let mut reg = registry.lock().unwrap();
        reg.clear_all();

        reg.register_instance(
            "test_instance",
            Arc::new(EnvironmentCheckHook::new(vec!["TEST_VAR".to_string()])),
        );

        assert_eq!(reg.instance_hook_count(), 1);
    }

    #[tokio::test]
    async fn test_global_hook_execution_cache() {
        let registry = HookRegistry::global();
        {
            let mut reg = registry.lock().unwrap();
            reg.clear_all();

            reg.register_global(
                "env_check",
                Arc::new(EnvironmentCheckHook::new(Vec::<String>::new())), // Empty list to avoid errors
            );
        }

        let task = create_test_task();

        // First execution
        {
            let reg = registry.lock().unwrap();
            reg.execute_global_hooks(&task).await.unwrap();
            assert!(reg.is_global_hook_cached("env_check"));
        }

        // Second execution should use cache
        {
            let reg = registry.lock().unwrap();
            reg.execute_global_hooks(&task).await.unwrap();
            assert!(reg.is_global_hook_cached("env_check"));
        }
    }

    #[tokio::test]
    async fn test_instance_hook_no_cache() {
        let registry = HookRegistry::global();
        {
            let mut reg = registry.lock().unwrap();
            reg.clear_all();

            reg.register_instance(
                "metrics",
                Arc::new(crate::hooks::MetricsHook),
            );
        }

        let task = create_test_task();

        // Execute multiple times - should not cache
        {
            let reg = registry.lock().unwrap();
            reg.execute_instance_hooks(&task).await.unwrap();
            reg.execute_instance_hooks(&task).await.unwrap();

            // Instance hooks are never cached
            assert!(!reg.is_global_hook_cached("metrics"));
        }
    }

    #[test]
    fn test_clear_all() {
        let registry = HookRegistry::global();
        let mut reg = registry.lock().unwrap();

        reg.register_global(
            "hook1",
            Arc::new(EnvironmentCheckHook::new(Vec::<String>::new())),
        );
        reg.register_instance(
            "hook2",
            Arc::new(crate::hooks::MetricsHook),
        );

        assert_eq!(reg.global_hook_count(), 1);
        assert_eq!(reg.instance_hook_count(), 1);

        reg.clear_all();

        assert_eq!(reg.global_hook_count(), 0);
        assert_eq!(reg.instance_hook_count(), 0);
    }
}
