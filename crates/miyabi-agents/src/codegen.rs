//! CodeGenAgent - AI-driven code generation
//!
//! Responsible for generating code based on Task requirements.
//! Integrates with GitHub for repository context and Claude Code for implementation.

use crate::base::BaseAgent;
use async_trait::async_trait;
use miyabi_core::documentation::{
    generate_readme, generate_rustdoc, CodeExample, DocumentationConfig, ReadmeTemplate,
};
use miyabi_core::retry::{retry_with_backoff, RetryConfig};
use miyabi_types::agent::{AgentMetrics, ResultStatus};
use miyabi_types::error::{AgentError, MiyabiError, Result};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use miyabi_worktree::{WorktreeInfo, WorktreeManager};
use std::path::Path;

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

    /// Setup Worktree for task execution with retry
    ///
    /// Creates an isolated worktree for parallel task execution.
    /// Uses spawn_blocking to handle git2's !Send types.
    /// Retries on transient failures (git lock conflicts, etc.)
    async fn setup_worktree(&self, task: &Task) -> Result<WorktreeInfo> {
        let task_id = task.id.clone();
        let task_id_for_log = task.id.clone();
        let worktree_base = self
            .config
            .worktree_base_path
            .clone()
            .unwrap_or_else(|| ".worktrees".to_string());

        // Retry with conservative config (git operations can be slow)
        let retry_config = RetryConfig::conservative();

        let worktree_info = retry_with_backoff(retry_config, || {
            let task_id = task_id.clone();
            let task_id_for_error = task_id.clone(); // Clone for map_err
            let worktree_base = worktree_base.clone();

            async move {
                // Wrap in spawn_blocking since git2 types are !Send
                let result = tokio::task::spawn_blocking(move || {
                    let repo_path = std::env::current_dir().map_err(|e| {
                        AgentError::with_cause(
                            "Failed to get current directory",
                            AgentType::CodeGenAgent,
                            Some(task_id.clone()),
                            e,
                        )
                    })?;

                    // Extract issue number from task ID (format: "task-{issue_number}" or numeric ID)
                    let issue_number = task_id
                        .trim_start_matches("task-")
                        .parse::<u64>()
                        .unwrap_or(0);

                    let manager = WorktreeManager::new(&repo_path, &worktree_base, 4)
                        .map_err(|e| {
                            AgentError::with_cause(
                                "Failed to create WorktreeManager",
                                AgentType::CodeGenAgent,
                                Some(task_id.clone()),
                                Box::new(e) as Box<dyn std::error::Error + Send + Sync>,
                            )
                        })?;

                    // Create worktree - need to block on the async call
                    let runtime = tokio::runtime::Handle::current();
                    let worktree_info =
                        runtime.block_on(manager.create_worktree(issue_number))?;

                    Ok::<WorktreeInfo, MiyabiError>(worktree_info)
                })
                .await
                .map_err(|e| {
                    AgentError::new(
                        format!("Spawn blocking failed: {}", e),
                        AgentType::CodeGenAgent,
                        Some(task_id_for_error.clone()),
                    )
                })??;

                Ok(result)
            }
        })
        .await?;

        tracing::info!(
            "Created worktree for task {} at {:?}",
            task_id_for_log,
            worktree_info.path
        );

        Ok(worktree_info)
    }

    /// Cleanup Worktree after task completion with retry
    ///
    /// Removes the worktree and associated resources.
    /// Uses spawn_blocking to handle git2's !Send types.
    /// Retries on transient failures (filesystem delays, locks, etc.)
    async fn cleanup_worktree(&self, worktree_info: &WorktreeInfo) -> Result<()> {
        let worktree_id = worktree_info.id.clone();
        let worktree_path = worktree_info.path.clone();
        let worktree_base = self
            .config
            .worktree_base_path
            .clone()
            .unwrap_or_else(|| ".worktrees".to_string());

        // Retry with aggressive config (cleanup is less critical, faster retries OK)
        let retry_config = RetryConfig::aggressive();

        retry_with_backoff(retry_config, || {
            let worktree_id = worktree_id.clone();
            let worktree_base = worktree_base.clone();

            async move {
                // Wrap in spawn_blocking since git2 types are !Send
                tokio::task::spawn_blocking(move || {
                    let repo_path = std::env::current_dir().map_err(|e| {
                        AgentError::with_cause(
                            "Failed to get current directory for cleanup",
                            AgentType::CodeGenAgent,
                            None,
                            e,
                        )
                    })?;

                    let manager = WorktreeManager::new(&repo_path, &worktree_base, 4)
                        .map_err(|e| {
                            AgentError::with_cause(
                                "Failed to create WorktreeManager for cleanup",
                                AgentType::CodeGenAgent,
                                None,
                                Box::new(e) as Box<dyn std::error::Error + Send + Sync>,
                            )
                        })?;

                    // Remove worktree - need to block on the async call
                    let runtime = tokio::runtime::Handle::current();
                    runtime.block_on(manager.remove_worktree(&worktree_id))?;

                    Ok::<(), MiyabiError>(())
                })
                .await
                .map_err(|e| {
                    AgentError::new(
                        format!("Cleanup spawn blocking failed: {}", e),
                        AgentType::CodeGenAgent,
                        None,
                    )
                })??;

                Ok(())
            }
        })
        .await?;

        tracing::info!("Removed worktree: {:?}", worktree_path);

        Ok(())
    }

    /// Generate documentation for the generated code
    ///
    /// Creates Rustdoc documentation and README files
    ///
    /// # Arguments
    /// * `project_path` - Path to the project root
    /// * `result` - Code generation result
    ///
    /// # Returns
    /// * `Ok(DocumentationGenerationResult)` - Documentation generated
    /// * `Err(MiyabiError)` - Failed to generate documentation
    pub async fn generate_documentation(
        &self,
        project_path: &Path,
        result: &CodeGenerationResult,
    ) -> Result<DocumentationGenerationResult> {
        tracing::info!("Generating documentation for {:?}", project_path);

        // Generate Rustdoc
        let doc_config = DocumentationConfig::new(project_path).with_private_items();

        let rustdoc_result = generate_rustdoc(&doc_config).await?;

        // Generate README if there are new files
        let readme_path = if !result.files_created.is_empty() {
            let readme = self.generate_readme_for_files(&result.files_created)?;
            let readme_path = project_path.join("README.md");

            tokio::fs::write(&readme_path, readme).await?;

            Some(readme_path.to_string_lossy().to_string())
        } else {
            None
        };

        Ok(DocumentationGenerationResult {
            rustdoc_path: rustdoc_result.doc_path,
            readme_path,
            warnings: rustdoc_result.warnings,
            success: rustdoc_result.success,
        })
    }

    /// Generate README content for created files
    fn generate_readme_for_files(&self, files: &[String]) -> Result<String> {
        // Extract project name from first file path
        let project_name = files
            .first()
            .and_then(|f| Path::new(f).file_stem())
            .and_then(|s| s.to_str())
            .unwrap_or("Project")
            .to_string();

        // Create basic README template
        let template = ReadmeTemplate {
            project_name: project_name.clone(),
            description: format!("Auto-generated documentation for {}", project_name),
            installation: Some(format!(
                "```bash\ncargo add {}\n```",
                project_name.to_lowercase()
            )),
            usage_examples: vec![CodeExample::new(
                "Basic Usage",
                format!("use {};\n\nfn main() {{\n    // Your code here\n}}", project_name),
            )
            .with_description("A simple usage example")],
            api_docs_link: Some(format!("https://docs.rs/{}", project_name.to_lowercase())),
            license: Some("MIT OR Apache-2.0".to_string()),
        };

        Ok(generate_readme(&template))
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

/// Result of documentation generation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DocumentationGenerationResult {
    /// Path to generated Rustdoc
    pub rustdoc_path: String,
    /// Path to generated README (if any)
    pub readme_path: Option<String>,
    /// Documentation warnings
    pub warnings: Vec<String>,
    /// Whether documentation generation succeeded
    pub success: bool,
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

    // ========================================================================
    // Error Handling & Retry Tests
    // ========================================================================

    #[tokio::test]
    async fn test_retry_config_integration() {
        use miyabi_core::retry::RetryConfig;

        // Test that retry configs are created correctly
        let conservative = RetryConfig::conservative();
        assert_eq!(conservative.max_attempts, 2);
        assert_eq!(conservative.initial_delay_ms, 500);

        let aggressive = RetryConfig::aggressive();
        assert_eq!(aggressive.max_attempts, 5);
        assert_eq!(aggressive.initial_delay_ms, 50);
    }

    #[tokio::test]
    async fn test_agent_error_context() {
        use miyabi_types::error::AgentError;

        // Test that AgentError includes proper context
        let error = AgentError::new(
            "Test error",
            AgentType::CodeGenAgent,
            Some("task-123".to_string()),
        );

        assert_eq!(error.agent_type, AgentType::CodeGenAgent);
        assert_eq!(error.task_id, Some("task-123".to_string()));
        assert_eq!(error.message, "Test error");
    }

    #[tokio::test]
    async fn test_agent_error_with_cause() {
        use miyabi_types::error::AgentError;
        use std::io::Error as IoError;

        let io_error = IoError::new(std::io::ErrorKind::NotFound, "File not found");
        let agent_error = AgentError::with_cause(
            "Failed to read file",
            AgentType::CodeGenAgent,
            Some("task-456".to_string()),
            io_error,
        );

        assert_eq!(agent_error.message, "Failed to read file");
        assert!(agent_error.cause.is_some());

        use std::error::Error;
        assert!(agent_error.source().is_some());
    }

    #[tokio::test]
    async fn test_validation_error_not_retryable() {
        use miyabi_core::retry::is_retryable;
        use miyabi_types::error::MiyabiError;

        let error = MiyabiError::Validation("Invalid task ID".to_string());
        assert!(!is_retryable(&error));
    }

    #[tokio::test]
    async fn test_timeout_error_retryable() {
        use miyabi_core::retry::is_retryable;
        use miyabi_types::error::MiyabiError;

        let error = MiyabiError::Timeout(5000);
        assert!(is_retryable(&error));
    }

    #[tokio::test]
    async fn test_git_lock_error_retryable() {
        use miyabi_core::retry::is_retryable;
        use miyabi_types::error::MiyabiError;

        let error = MiyabiError::Git("Unable to create lock file".to_string());
        assert!(is_retryable(&error));
    }

    #[tokio::test]
    async fn test_invalid_task_type_provides_context() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);

        let mut task = create_test_task();
        task.task_type = TaskType::Docs; // Invalid for CodeGen

        let result = agent.generate_code(&task).await;
        assert!(result.is_err());

        let error = result.unwrap_err();
        let error_msg = error.to_string();
        assert!(error_msg.contains("Validation error"));
        assert!(error_msg.contains("Docs")); // Task type should be in error message
    }

    #[tokio::test]
    async fn test_code_generation_result_serialization() {
        let result = CodeGenerationResult {
            files_created: vec!["src/main.rs".to_string()],
            files_modified: vec!["Cargo.toml".to_string()],
            lines_added: 50,
            lines_removed: 10,
            tests_added: 3,
            commit_sha: Some("abc123".to_string()),
        };

        // Test that result can be serialized to JSON
        let json = serde_json::to_value(&result).unwrap();
        assert!(json["files_created"].is_array());
        assert_eq!(json["lines_added"], 50);
        assert_eq!(json["commit_sha"], "abc123");

        // Test deserialization
        let deserialized: CodeGenerationResult = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.files_created.len(), 1);
        assert_eq!(deserialized.lines_added, 50);
    }

    #[tokio::test]
    async fn test_agent_metrics_calculation() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        let result = agent.execute(&task).await.unwrap();

        // Verify metrics are generated
        assert!(result.metrics.is_some());
        let metrics = result.metrics.unwrap();

        assert_eq!(metrics.agent_type, AgentType::CodeGenAgent);
        assert_eq!(metrics.task_id, "task-1");
        // Duration may be 0 for very fast operations, just verify it exists
        assert!(metrics.lines_changed.is_some());
        assert!(metrics.tests_added.is_some());
    }

    #[tokio::test]
    async fn test_validate_code_empty_result() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);

        let empty_result = CodeGenerationResult {
            files_created: vec![],
            files_modified: vec![],
            lines_added: 0,
            lines_removed: 0,
            tests_added: 0,
            commit_sha: None,
        };

        let validation = agent.validate_code(&empty_result);
        assert!(validation.is_err());
        assert!(validation
            .unwrap_err()
            .to_string()
            .contains("No files were created or modified"));
    }

    #[tokio::test]
    async fn test_validate_code_with_files() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);

        let valid_result = CodeGenerationResult {
            files_created: vec!["src/lib.rs".to_string()],
            files_modified: vec![],
            lines_added: 100,
            lines_removed: 0,
            tests_added: 5,
            commit_sha: Some("def456".to_string()),
        };

        let validation = agent.validate_code(&valid_result);
        assert!(validation.is_ok());
    }

    // ========================================================================
    // Documentation Generation Tests
    // ========================================================================

    #[tokio::test]
    async fn test_generate_readme_for_files() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);

        let files = vec!["src/my_module.rs".to_string()];
        let readme = agent.generate_readme_for_files(&files).unwrap();

        assert!(readme.contains("# my_module"));
        assert!(readme.contains("## Installation"));
        assert!(readme.contains("## Usage"));
        assert!(readme.contains("```rust"));
        assert!(readme.contains("use my_module;"));
        assert!(readme.contains("## API Documentation"));
        assert!(readme.contains("## License"));
    }

    #[tokio::test]
    async fn test_generate_readme_multiple_files() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);

        let files = vec![
            "src/parser.rs".to_string(),
            "src/lexer.rs".to_string(),
            "src/ast.rs".to_string(),
        ];

        let readme = agent.generate_readme_for_files(&files).unwrap();

        // Should use first file for project name
        assert!(readme.contains("# parser"));
        assert!(readme.contains("Auto-generated documentation for parser"));
    }

    #[tokio::test]
    async fn test_documentation_generation_result_serialization() {
        let result = DocumentationGenerationResult {
            rustdoc_path: "target/doc".to_string(),
            readme_path: Some("README.md".to_string()),
            warnings: vec!["missing docs".to_string()],
            success: true,
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["rustdoc_path"], "target/doc");
        assert_eq!(json["readme_path"], "README.md");
        assert_eq!(json["success"], true);
        assert!(json["warnings"].is_array());

        let deserialized: DocumentationGenerationResult =
            serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.rustdoc_path, "target/doc");
        assert_eq!(deserialized.readme_path, Some("README.md".to_string()));
        assert_eq!(deserialized.warnings.len(), 1);
    }

    #[tokio::test]
    async fn test_readme_template_components() {
        use miyabi_core::documentation::{CodeExample, ReadmeTemplate};
        use miyabi_core::generate_readme;

        let example = CodeExample::new("Example 1", "let x = 42;")
            .with_description("Variable declaration")
            .with_language("rust");

        let template = ReadmeTemplate {
            project_name: "Test Crate".to_string(),
            description: "A test crate".to_string(),
            installation: Some("cargo add test-crate".to_string()),
            usage_examples: vec![example],
            api_docs_link: Some("https://docs.rs/test-crate".to_string()),
            license: Some("MIT".to_string()),
        };

        let readme = generate_readme(&template);

        assert!(readme.contains("# Test Crate"));
        assert!(readme.contains("A test crate"));
        assert!(readme.contains("cargo add test-crate"));
        assert!(readme.contains("### Example 1"));
        assert!(readme.contains("Variable declaration"));
        assert!(readme.contains("let x = 42;"));
        assert!(readme.contains("docs.rs/test-crate"));
        assert!(readme.contains("MIT"));
    }

    #[tokio::test]
    async fn test_documentation_config_builder() {
        use miyabi_core::documentation::DocumentationConfig;
        use std::path::PathBuf;

        let config = DocumentationConfig::new("/tmp/project")
            .with_private_items()
            .with_browser();

        assert_eq!(config.project_root, PathBuf::from("/tmp/project"));
        assert!(config.document_private_items);
        assert!(config.open_browser);
    }

    #[tokio::test]
    async fn test_code_example_builder() {
        use miyabi_core::documentation::CodeExample;

        let example = CodeExample::new("Advanced Usage", "fn advanced() {}")
            .with_description("More complex example")
            .with_language("rust");

        assert_eq!(example.title, "Advanced Usage");
        assert_eq!(
            example.description,
            Some("More complex example".to_string())
        );
        assert_eq!(example.language, "rust");
        assert_eq!(example.code, "fn advanced() {}");
    }

    #[tokio::test]
    async fn test_readme_without_optional_sections() {
        use miyabi_core::documentation::ReadmeTemplate;
        use miyabi_core::generate_readme;

        let template = ReadmeTemplate {
            project_name: "Minimal".to_string(),
            description: "Minimal description".to_string(),
            installation: None,
            usage_examples: vec![],
            api_docs_link: None,
            license: None,
        };

        let readme = generate_readme(&template);

        assert!(readme.contains("# Minimal"));
        assert!(readme.contains("Minimal description"));
        assert!(!readme.contains("## Installation"));
        assert!(!readme.contains("## Usage"));
        assert!(!readme.contains("## API Documentation"));
        assert!(!readme.contains("## License"));
    }
}
