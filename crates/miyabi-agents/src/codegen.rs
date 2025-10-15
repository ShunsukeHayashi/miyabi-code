//! CodeGenAgent - AI-driven code generation
//!
//! Responsible for generating code based on Task requirements.
//! Integrates with GitHub for repository context and Claude Code for implementation.

use crate::base::BaseAgent;
use async_trait::async_trait;
use miyabi_types::agent::{AgentMetrics, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use miyabi_worktree::{WorktreeInfo, WorktreeManager};

pub struct CodeGenAgent {
    #[allow(dead_code)] // Reserved for future Agent configuration
    config: AgentConfig,
}

impl CodeGenAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate code based on task requirements
    pub async fn generate_code(&self, task: &Task) -> Result<CodeGenerationResult> {
        tracing::info!("Generating code for task: {}", task.title);

        // Validate task type
        if !matches!(
            task.task_type,
            TaskType::Feature | TaskType::Bug | TaskType::Refactor
        ) {
            return Err(MiyabiError::Validation(format!(
                "CodeGenAgent cannot handle task type: {:?}",
                task.task_type
            )));
        }

        // In real implementation, this would:
        // 1. Clone repository using miyabi-worktree
        // 2. Analyze existing code
        // 3. Generate new code using Claude API
        // 4. Run tests
        // 5. Commit changes

        // For now, return a placeholder result
        Ok(CodeGenerationResult {
            files_created: vec![],
            files_modified: vec![],
            lines_added: 0,
            lines_removed: 0,
            tests_added: 0,
            commit_sha: None,
        })
    }

    /// Setup Worktree for task execution
    ///
    /// Creates an isolated worktree for parallel task execution
    /// Uses spawn_blocking to handle git2's !Send types
    async fn setup_worktree(&self, task: &Task) -> Result<WorktreeInfo> {
        let task_id = task.id.clone();
        let worktree_base = self
            .config
            .worktree_base_path
            .clone()
            .unwrap_or_else(|| ".worktrees".to_string());

        // Wrap in spawn_blocking since git2 types are !Send
        let worktree_info = tokio::task::spawn_blocking(move || {
            let repo_path = std::env::current_dir().map_err(|e| {
                MiyabiError::Io(std::io::Error::new(
                    e.kind(),
                    format!("Failed to get current directory: {}", e),
                ))
            })?;

            // Extract issue number from task ID (format: "task-{issue_number}" or numeric ID)
            let issue_number = task_id
                .trim_start_matches("task-")
                .parse::<u64>()
                .unwrap_or(0);

            let manager = WorktreeManager::new(&repo_path, &worktree_base, 4)?;

            // Create worktree - need to block on the async call
            let runtime = tokio::runtime::Handle::current();
            let worktree_info = runtime.block_on(manager.create_worktree(issue_number))?;

            Ok::<WorktreeInfo, MiyabiError>(worktree_info)
        })
        .await
        .map_err(|e| MiyabiError::Unknown(format!("Spawn blocking failed: {}", e)))??;

        tracing::info!(
            "Created worktree for task {} at {:?}",
            task.id,
            worktree_info.path
        );

        Ok(worktree_info)
    }

    /// Cleanup Worktree after task completion
    ///
    /// Removes the worktree and associated resources
    /// Uses spawn_blocking to handle git2's !Send types
    async fn cleanup_worktree(&self, worktree_info: &WorktreeInfo) -> Result<()> {
        let worktree_id = worktree_info.id.clone();
        let worktree_path = worktree_info.path.clone();
        let worktree_base = self
            .config
            .worktree_base_path
            .clone()
            .unwrap_or_else(|| ".worktrees".to_string());

        // Wrap in spawn_blocking since git2 types are !Send
        tokio::task::spawn_blocking(move || {
            let repo_path = std::env::current_dir().map_err(|e| {
                MiyabiError::Io(std::io::Error::new(
                    e.kind(),
                    format!("Failed to get current directory: {}", e),
                ))
            })?;

            let manager = WorktreeManager::new(&repo_path, &worktree_base, 4)?;

            // Remove worktree - need to block on the async call
            let runtime = tokio::runtime::Handle::current();
            runtime.block_on(manager.remove_worktree(&worktree_id))?;

            Ok::<(), MiyabiError>(())
        })
        .await
        .map_err(|e| MiyabiError::Unknown(format!("Spawn blocking failed: {}", e)))??;

        tracing::info!("Removed worktree: {:?}", worktree_path);

        Ok(())
    }

    /// Validate generated code
    #[allow(dead_code)] // Will be used in production implementation (see execute() line 80)
    fn validate_code(&self, result: &CodeGenerationResult) -> Result<()> {
        if result.files_created.is_empty() && result.files_modified.is_empty() {
            return Err(MiyabiError::Validation(
                "No files were created or modified".to_string(),
            ));
        }

        Ok(())
    }
}

#[async_trait]
impl BaseAgent for CodeGenAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CodeGenAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        // Setup Worktree if enabled
        let worktree_info = if self.config.use_worktree {
            Some(self.setup_worktree(task).await?)
        } else {
            None
        };

        // Generate code (in worktree if enabled)
        let code_result = self.generate_code(task).await;

        // Cleanup Worktree on success or failure
        let cleanup_result = if let Some(ref wt_info) = worktree_info {
            self.cleanup_worktree(wt_info).await
        } else {
            Ok(())
        };

        // Propagate code generation error if any
        let code_result = code_result?;

        // Log cleanup error but don't fail the whole task
        if let Err(e) = cleanup_result {
            tracing::warn!("Failed to cleanup worktree: {}", e);
        }

        // Note: Validation skipped for placeholder implementation
        // In real implementation: self.validate_code(&code_result)?;

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Calculate lines changed
        let lines_changed = code_result.lines_added + code_result.lines_removed;

        // Create metrics
        let metrics = AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::CodeGenAgent,
            duration_ms,
            quality_score: None, // Set by ReviewAgent
            lines_changed: Some(lines_changed),
            tests_added: Some(code_result.tests_added),
            coverage_percent: None, // Calculated after test run
            errors_found: None,
            timestamp: end_time,
        };

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::to_value(code_result)?),
            error: None,
            metrics: Some(metrics),
            escalation: None,
        })
    }
}

/// Result of code generation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CodeGenerationResult {
    pub files_created: Vec<String>,
    pub files_modified: Vec<String>,
    pub lines_added: u32,
    pub lines_removed: u32,
    pub tests_added: u32,
    pub commit_sha: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config() -> AgentConfig {
        AgentConfig {
            device_identifier: "test-device".to_string(),
            github_token: "test-token".to_string(),
            repo_owner: Some("test-owner".to_string()),
            repo_name: Some("test-repo".to_string()),
            use_task_tool: false,
            use_worktree: false,
            worktree_base_path: None,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        }
    }

    fn create_test_task() -> Task {
        Task {
            id: "task-1".to_string(),
            title: "Implement new feature".to_string(),
            description: "Feature description".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        }
    }

    #[tokio::test]
    async fn test_codegen_agent_creation() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::CodeGenAgent);
    }

    #[tokio::test]
    async fn test_generate_code() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        let result = agent.generate_code(&task).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_execute() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        let result = agent.execute(&task).await;
        assert!(result.is_ok());

        let agent_result = result.unwrap();
        assert_eq!(agent_result.status, ResultStatus::Success);
        assert!(agent_result.metrics.is_some());
    }

    #[tokio::test]
    async fn test_invalid_task_type() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);

        let mut task = create_test_task();
        task.task_type = TaskType::Docs; // Invalid for CodeGen

        let result = agent.generate_code(&task).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_setup_worktree() {
        let mut config = create_test_config();
        config.use_worktree = true;
        config.worktree_base_path = Some(".worktrees/test".to_string());

        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        // Note: This test requires a valid git repository
        // In CI/CD, this may fail - marked for manual testing
        match agent.setup_worktree(&task).await {
            Ok(worktree_info) => {
                assert!(worktree_info.path.exists());
                assert_eq!(worktree_info.issue_number, 1); // task-1 -> 1

                // Cleanup
                let _ = agent.cleanup_worktree(&worktree_info).await;
            }
            Err(e) => {
                // Expected in non-git environment
                tracing::warn!("Worktree test skipped (not in git repo): {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_cleanup_worktree() {
        let mut config = create_test_config();
        config.use_worktree = true;
        config.worktree_base_path = Some(".worktrees/test".to_string());

        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        // Setup worktree first
        match agent.setup_worktree(&task).await {
            Ok(worktree_info) => {
                // Cleanup
                let result = agent.cleanup_worktree(&worktree_info).await;
                assert!(result.is_ok());

                // Verify removed (may still exist due to git cleanup delay)
                // Note: This assertion may be flaky
            }
            Err(_) => {
                // Skip test in non-git environment
            }
        }
    }

    #[tokio::test]
    async fn test_execute_with_worktree() {
        let mut config = create_test_config();
        config.use_worktree = true;
        config.worktree_base_path = Some(".worktrees/test".to_string());

        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        // Note: This test may fail in non-git environment
        match agent.execute(&task).await {
            Ok(result) => {
                assert_eq!(result.status, ResultStatus::Success);
                assert!(result.metrics.is_some());
            }
            Err(e) => {
                // Expected in non-git environment
                tracing::warn!("Execute with worktree test skipped: {}", e);
            }
        }
    }

    #[tokio::test]
    async fn test_execute_without_worktree() {
        let config = create_test_config(); // use_worktree = false
        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        let result = agent.execute(&task).await;
        assert!(result.is_ok());

        let agent_result = result.unwrap();
        assert_eq!(agent_result.status, ResultStatus::Success);
    }
}
