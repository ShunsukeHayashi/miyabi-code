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

pub struct CodeGenAgent {
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

    /// Validate generated code
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

        // Generate code
        let code_result = self.generate_code(task).await?;

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
}
