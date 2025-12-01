//! Agent hook infrastructure for extending lifecycle events.
//!
//! Provides reusable hook traits and a wrapper that executes hooks around
//! agent lifecycle operations (pre-execute, post-execute, error handling).

use crate::base::BaseAgent;
use async_trait::async_trait;
use chrono::Utc;
use miyabi_types::agent::AgentType;
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::{AgentResult, Task};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs::{self, OpenOptions};
use tokio::io::AsyncWriteExt;

/// Lifecycle hook trait for agents.
///
/// Hooks can observe and mutate state before or after an agent executes.
/// All hook methods default to no-ops, allowing implementers to override only
/// the phases they care about.
#[async_trait]
pub trait AgentHook: Send + Sync {
    /// Called before the agent begins executing the task.
    async fn on_pre_execute(&self, _agent: AgentType, _task: &Task) -> Result<()> {
        Ok(())
    }

    /// Called after the agent successfully executes the task.
    async fn on_post_execute(&self, _agent: AgentType, _task: &Task, _result: &AgentResult) -> Result<()> {
        Ok(())
    }

    /// Called when the agent returns an error.
    async fn on_error(&self, _agent: AgentType, _task: &Task, _error: &MiyabiError) -> Result<()> {
        Ok(())
    }
}

/// Wrapper that executes hooks around a concrete agent implementation.
pub struct HookedAgent<A: BaseAgent> {
    /// The wrapped agent instance
    agent: A,
    /// Registered lifecycle hooks
    hooks: Vec<Arc<dyn AgentHook>>,
}

impl<A: BaseAgent> HookedAgent<A> {
    /// Create a new hooked agent.
    pub fn new(agent: A) -> Self {
        Self { agent, hooks: Vec::new() }
    }

    /// Register a lifecycle hook.
    pub fn register_hook<H>(&mut self, hook: H)
    where
        H: AgentHook + 'static,
    {
        self.hooks.push(Arc::new(hook));
    }

    /// Register multiple hooks at once.
    pub fn register_hooks<I>(&mut self, hooks: I)
    where
        I: IntoIterator,
        I::Item: AgentHook + 'static,
    {
        for hook in hooks {
            self.register_hook(hook);
        }
    }

    /// Execute the wrapped agent with hook lifecycle management.
    pub async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let agent_type = self.agent.agent_type();

        // Pre hooks
        for hook in &self.hooks {
            hook.on_pre_execute(agent_type, task).await?;
        }

        // Execute agent and capture result
        match self.agent.execute(task).await {
            Ok(result) => {
                // Post hooks
                for hook in &self.hooks {
                    hook.on_post_execute(agent_type, task, &result).await?;
                }
                Ok(result)
            }
            Err(error) => {
                // Error hooks
                for hook in &self.hooks {
                    hook.on_error(agent_type, task, &error).await?;
                }
                Err(error)
            }
        }
    }

    /// Access the inner agent (e.g., for configuration or inspection).
    pub fn inner(&self) -> &A {
        &self.agent
    }

    /// Consume the wrapper and return the inner agent.
    pub fn into_inner(self) -> A {
        self.agent
    }
}

/// Hook that validates required environment variables exist before execution.
pub struct EnvironmentCheckHook {
    /// List of environment variable names that must be present
    required_vars: Vec<String>,
}

impl EnvironmentCheckHook {
    pub fn new(vars: impl IntoIterator<Item = impl Into<String>>) -> Self {
        Self { required_vars: vars.into_iter().map(Into::into).collect() }
    }
}

#[async_trait]
impl AgentHook for EnvironmentCheckHook {
    async fn on_pre_execute(&self, agent: AgentType, _task: &Task) -> Result<()> {
        for var in &self.required_vars {
            if std::env::var(var).is_err() {
                let message = format!("Required environment variable {} missing for agent {:?}", var, agent);
                return Err(MiyabiError::Config(message));
            }
        }
        Ok(())
    }
}

/// Hook that records execution metrics using tracing.
#[derive(Default)]
pub struct MetricsHook;

impl MetricsHook {
    pub fn new() -> Self {
        Self
    }
}
#[async_trait]
impl AgentHook for MetricsHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        tracing::info!("Agent {:?} starting task {} with priority {:?}", agent, task.id, task.priority);
        Ok(())
    }

    async fn on_post_execute(&self, agent: AgentType, task: &Task, result: &AgentResult) -> Result<()> {
        tracing::info!("Agent {:?} completed task {} with status {:?}", agent, task.id, result.status);
        Ok(())
    }

    async fn on_error(&self, agent: AgentType, task: &Task, error: &MiyabiError) -> Result<()> {
        tracing::error!("Agent {:?} failed task {}: {}", agent, task.id, error);
        Ok(())
    }
}

/// Hook that appends execution details to log files under `.ai/logs`.
pub struct AuditLogHook {
    /// Directory where log files are stored (e.g., ".ai/logs")
    log_dir: PathBuf,
}

impl AuditLogHook {
    pub fn new<P: Into<PathBuf>>(log_dir: P) -> Self {
        Self { log_dir: log_dir.into() }
    }

    /// Append log entry to audit log file.
    ///
    /// If `worktree_id` is provided, creates a worktree-specific log file
    /// to prevent concurrent write conflicts in parallel execution scenarios.
    ///
    /// File naming:
    /// - Without worktree_id: `.ai/logs/{date}.md`
    /// - With worktree_id: `.ai/logs/{date}-worktree-{id}.md`
    async fn append(&self, entry: &str, worktree_id: Option<&str>) -> Result<()> {
        let date = Utc::now().format("%Y-%m-%d").to_string();

        let filename = if let Some(wt_id) = worktree_id {
            format!("{}-worktree-{}.md", date, wt_id)
        } else {
            format!("{}.md", date)
        };

        let path = self.log_dir.join(filename);

        if let Some(dir) = path.parent() {
            fs::create_dir_all(dir).await.map_err(MiyabiError::Io)?;
        }

        let mut file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
            .await
            .map_err(MiyabiError::Io)?;

        file.write_all(entry.as_bytes()).await.map_err(MiyabiError::Io)?;
        Ok(())
    }

    /// Extract worktree_id from task metadata
    fn extract_worktree_id(task: &Task) -> Option<String> {
        task.metadata
            .as_ref()
            .and_then(|m| m.get("worktree_id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
    }
}

#[async_trait]
impl AgentHook for AuditLogHook {
    async fn on_pre_execute(&self, agent: AgentType, task: &Task) -> Result<()> {
        let worktree_id = AuditLogHook::extract_worktree_id(task);
        let entry = format!("\n### [{}] 🔄 Agent {:?} starting task {}\n", Utc::now().to_rfc3339(), agent, task.id);
        self.append(&entry, worktree_id.as_deref()).await
    }

    async fn on_post_execute(&self, agent: AgentType, task: &Task, result: &AgentResult) -> Result<()> {
        let worktree_id = AuditLogHook::extract_worktree_id(task);
        let entry = format!(
            "\n### [{}] ✅ Agent {:?} completed task {}\nStatus: {:?}\n",
            Utc::now().to_rfc3339(),
            agent,
            task.id,
            result.status
        );
        self.append(&entry, worktree_id.as_deref()).await
    }

    async fn on_error(&self, agent: AgentType, task: &Task, error: &MiyabiError) -> Result<()> {
        let worktree_id = AuditLogHook::extract_worktree_id(task);
        let entry = format!(
            "\n### [{}] ❌ Agent {:?} failed task {}\nError: {}\n",
            Utc::now().to_rfc3339(),
            agent,
            task.id,
            error
        );
        self.append(&entry, worktree_id.as_deref()).await
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use miyabi_types::agent::{AgentMetrics, AgentType, ResultStatus};
    use miyabi_types::task::TaskType;
    use miyabi_types::{AgentResult, Task};
    use std::sync::{Arc, Mutex};

    struct TestAgent;

    #[async_trait]
    impl BaseAgent for TestAgent {
        fn agent_type(&self) -> AgentType {
            AgentType::CodeGenAgent
        }

        async fn execute(&self, _task: &Task) -> Result<AgentResult> {
            Ok(AgentResult {
                status: ResultStatus::Success,
                data: None,
                error: None,
                metrics: Some(AgentMetrics {
                    task_id: "test-task".into(),
                    agent_type: AgentType::CodeGenAgent,
                    duration_ms: 10,
                    quality_score: None,
                    lines_changed: None,
                    tests_added: None,
                    coverage_percent: None,
                    errors_found: None,
                    timestamp: chrono::Utc::now(),
                }),
                escalation: None,
            })
        }
    }

    struct RecordingHook {
        events: Arc<Mutex<Vec<&'static str>>>,
    }

    impl RecordingHook {
        fn new(events: Arc<Mutex<Vec<&'static str>>>) -> Self {
            Self { events }
        }
    }

    #[async_trait]
    impl AgentHook for RecordingHook {
        async fn on_pre_execute(&self, _agent: AgentType, _task: &Task) -> Result<()> {
            self.events.lock().unwrap().push("pre");
            Ok(())
        }

        async fn on_post_execute(&self, _agent: AgentType, _task: &Task, _result: &AgentResult) -> Result<()> {
            self.events.lock().unwrap().push("post");
            Ok(())
        }
    }

    #[tokio::test]
    async fn hooked_agent_executes_hooks() {
        let events = Arc::new(Mutex::new(Vec::new()));
        let hook = RecordingHook::new(events.clone());

        let mut agent = HookedAgent::new(TestAgent);
        agent.register_hook(hook);

        let task = Task {
            id: "test".into(),
            title: "Test".into(),
            description: "Run test".into(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(1),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = agent.execute(&task).await.unwrap();
        assert_eq!(result.status, ResultStatus::Success);

        let recorded = events.lock().unwrap();
        assert_eq!(recorded.as_slice(), &["pre", "post"]);
    }

    #[test]
    fn test_extract_worktree_id_none() {
        let task = Task {
            id: "test".into(),
            title: "Test".into(),
            description: "Test".into(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        assert_eq!(AuditLogHook::extract_worktree_id(&task), None);
    }

    #[test]
    fn test_extract_worktree_id_with_metadata() {
        use std::collections::HashMap;

        let mut metadata = HashMap::new();
        metadata.insert("worktree_id".to_string(), serde_json::json!("abc123-worktree-1"));

        let task = Task {
            id: "test".into(),
            title: "Test".into(),
            description: "Test".into(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        };

        assert_eq!(AuditLogHook::extract_worktree_id(&task), Some("abc123-worktree-1".to_string()));
    }

    #[test]
    fn test_extract_worktree_id_missing_key() {
        use std::collections::HashMap;

        let mut metadata = HashMap::new();
        metadata.insert("other_key".to_string(), serde_json::json!("value"));

        let task = Task {
            id: "test".into(),
            title: "Test".into(),
            description: "Test".into(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        };

        assert_eq!(AuditLogHook::extract_worktree_id(&task), None);
    }

    #[tokio::test]
    async fn test_audit_log_hook_with_worktree_id() {
        use std::collections::HashMap;
        use tempfile::TempDir;
        use tokio::fs;

        let temp_dir = TempDir::new().unwrap();
        let log_dir = temp_dir.path().to_path_buf();

        let hook = AuditLogHook::new(log_dir.clone());

        let mut metadata = HashMap::new();
        metadata.insert("worktree_id".to_string(), serde_json::json!("test-wt-123"));

        let task = Task {
            id: "test-task".into(),
            title: "Test Task".into(),
            description: "Test".into(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        };

        // Execute pre-execute hook
        hook.on_pre_execute(AgentType::CodeGenAgent, &task).await.unwrap();

        // Verify worktree-specific log file was created
        let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let expected_file = log_dir.join(format!("{}-worktree-test-wt-123.md", date));

        assert!(expected_file.exists());

        // Verify log content
        let content = fs::read_to_string(&expected_file).await.unwrap();
        assert!(content.contains("🔄 Agent CodeGenAgent starting task test-task"));
    }

    #[tokio::test]
    async fn test_audit_log_hook_without_worktree_id() {
        use tempfile::TempDir;
        use tokio::fs;

        let temp_dir = TempDir::new().unwrap();
        let log_dir = temp_dir.path().to_path_buf();

        let hook = AuditLogHook::new(log_dir.clone());

        let task = Task {
            id: "test-task".into(),
            title: "Test Task".into(),
            description: "Test".into(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        // Execute pre-execute hook
        hook.on_pre_execute(AgentType::CodeGenAgent, &task).await.unwrap();

        // Verify default log file was created (without worktree_id)
        let date = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let expected_file = log_dir.join(format!("{}.md", date));

        assert!(expected_file.exists());

        // Verify log content
        let content = fs::read_to_string(&expected_file).await.unwrap();
        assert!(content.contains("🔄 Agent CodeGenAgent starting task test-task"));
    }
}
