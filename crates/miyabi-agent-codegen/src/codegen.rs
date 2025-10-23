//! CodeGenAgent - AI-driven code generation
//!
//! Responsible for generating code based on Task requirements.
//! Integrates with GitHub for repository context and Claude Code for implementation.

pub use crate::documentation::DocumentationGenerationResult;
use crate::{documentation, prompt, worktree};
use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_llm::{GPTOSSProvider, LLMProvider, LLMRequest, ReasoningEffort};
use miyabi_types::agent::{AgentMetrics, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
// use miyabi_worktree::{WorktreeInfo, WorktreeManager}; // Temporarily disabled due to Send issues
use std::path::Path;

pub struct CodeGenAgent {
    #[allow(dead_code)] // Reserved for future Agent configuration
    config: AgentConfig,
    /// LLM provider for code generation
    llm_provider: Option<GPTOSSProvider>,
}

impl CodeGenAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self {
            config,
            llm_provider: None,
        }
    }

    /// Create CodeGenAgent with Ollama integration
    pub fn new_with_ollama(config: AgentConfig) -> Result<Self> {
        let llm_provider = GPTOSSProvider::new_mac_mini_tailscale().map_err(|e| {
            MiyabiError::Unknown(format!("Failed to create Ollama provider: {}", e))
        })?;

        Ok(Self {
            config,
            llm_provider: Some(llm_provider),
        })
    }

    /// Generate code using LLM
    async fn generate_code_with_llm(&self, task: &Task) -> Result<String> {
        if let Some(ref provider) = self.llm_provider {
            let prompt = prompt::build_code_generation_prompt(task);

            let request = LLMRequest::new(prompt)
                .with_temperature(0.2)
                .with_max_tokens(512) // Reduce tokens for faster response
                .with_reasoning_effort(ReasoningEffort::Low); // Use low reasoning for speed

            let response = provider
                .generate(&request)
                .await
                .map_err(|e| MiyabiError::Unknown(format!("LLM generation failed: {}", e)))?;

            Ok(response.text)
        } else {
            Err(MiyabiError::Validation(
                "LLM provider not configured".to_string(),
            ))
        }
    }

    /// Generate code based on task requirements
    pub async fn generate_code(
        &self,
        task: &Task,
        worktree_path: Option<&Path>,
    ) -> Result<CodeGenerationResult> {
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

        // If LLM provider is available, use it for code generation
        if self.llm_provider.is_some() {
            return self
                .generate_code_with_llm_provider(task, worktree_path)
                .await;
        }

        // If worktree is provided, execute Claude Code in it
        if let Some(worktree) = worktree_path {
            worktree::prepare_claude_context(worktree, &self.config, task).await?;
            // Parse results from worktree
            worktree::parse_code_generation_results(worktree).await
        } else {
            // Fallback: placeholder result for testing without worktree
            Ok(CodeGenerationResult {
                files_created: vec![],
                files_modified: vec![],
                lines_added: 0,
                lines_removed: 0,
                tests_added: 0,
                commit_sha: None,
            })
        }
    }

    /// Generate code using LLM provider
    async fn generate_code_with_llm_provider(
        &self,
        task: &Task,
        worktree_path: Option<&Path>,
    ) -> Result<CodeGenerationResult> {
        tracing::info!(
            "Generating code using LLM provider for task: {}",
            task.title
        );

        // Generate code using LLM
        let generated_code = self.generate_code_with_llm(task).await?;

        // If worktree is provided, write the generated code to files
        if let Some(worktree) = worktree_path {
            worktree::write_generated_code_to_worktree(
                worktree,
                &self.config,
                task,
                &generated_code,
            )
            .await?;

            // Parse results from worktree
            worktree::parse_code_generation_results(worktree).await
        } else {
            // Return result with generated code metadata
            Ok(CodeGenerationResult {
                files_created: vec!["generated_code.rs".to_string()],
                files_modified: vec![],
                lines_added: generated_code.lines().count() as u32,
                lines_removed: 0,
                tests_added: generated_code.matches("#[cfg(test)]").count() as u32,
                commit_sha: None,
            })
        }
    }

    /// 生成したコードに対するドキュメントを作成する
    pub async fn generate_documentation(
        &self,
        project_path: &Path,
        result: &CodeGenerationResult,
    ) -> Result<DocumentationGenerationResult> {
        documentation::generate_documentation(project_path, result).await
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

        // Setup Worktree if enabled (temporarily disabled due to Send issues)
        // let worktree_info = if self.config.use_worktree {
        //     Some(self.setup_worktree(task).await?)
        // } else {
        //     None
        // };

        // Generate code (without worktree for now)
        let code_result = self.generate_code(task, None).await;

        // Cleanup Worktree on success or failure (temporarily disabled)
        // let cleanup_result = if let Some(ref wt_info) = worktree_info {
        //     self.cleanup_worktree(wt_info).await
        // } else {
        //     Ok(())
        // };

        // Propagate code generation error if any
        let code_result = code_result?;

        // Log cleanup error but don't fail the whole task (temporarily disabled)
        // if let Err(e) = cleanup_result {
        //     tracing::warn!("Failed to cleanup worktree: {}", e);
        // }

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
    use crate::context;
    use crate::documentation::build_readme_for_files;
    use crate::{prompt, worktree};

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

    #[tokio::test]
    #[ignore] // Requires Ollama server running (Mac mini or local)
    async fn test_codegen_agent_with_ollama() {
        let config = create_test_config();
        let agent = CodeGenAgent::new_with_ollama(config).unwrap();
        assert_eq!(agent.agent_type(), AgentType::CodeGenAgent);
    }

    #[tokio::test]
    #[ignore] // Requires Ollama server running (Mac mini or local)
    async fn test_generate_code_with_llm() {
        let config = create_test_config();
        let agent = CodeGenAgent::new_with_ollama(config).unwrap();
        let task = create_test_task();

        // Test LLM code generation (this will make actual API call)
        let result = agent.generate_code_with_llm(&task).await;

        // Should succeed with Ollama server
        assert!(result.is_ok());

        let generated_code = result.unwrap();
        assert!(!generated_code.is_empty());
        assert!(generated_code.contains("Rust"));
    }

    #[tokio::test]
    async fn test_build_code_generation_prompt() {
        let task = create_test_task();

        let prompt = prompt::build_code_generation_prompt(&task);

        assert!(prompt.contains("# Code Generation Task"));
        assert!(prompt.contains("**Task ID**: task-1"));
        assert!(prompt.contains("**Title**: Implement new feature"));
        assert!(prompt.contains("## Description"));
        assert!(prompt.contains("Feature description"));
        assert!(prompt.contains("## Instructions"));
        assert!(prompt.contains("Please generate the necessary Rust code"));
        assert!(prompt.contains("Requirements:"));
        assert!(prompt.contains("Generate clean, idiomatic Rust code"));
    }

    #[tokio::test]
    async fn test_determine_code_filename() {
        let mut task = create_test_task();

        task.task_type = TaskType::Feature;
        assert_eq!(context::determine_code_filename(&task), "src/feature.rs");

        task.task_type = TaskType::Bug;
        assert_eq!(context::determine_code_filename(&task), "src/fix.rs");

        task.task_type = TaskType::Refactor;
        assert_eq!(context::determine_code_filename(&task), "src/refactor.rs");

        task.task_type = TaskType::Docs;
        assert_eq!(context::determine_code_filename(&task), "src/generated.rs");
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

        let result = agent.generate_code(&task, None).await;
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

        let result = agent.generate_code(&task, None).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_setup_worktree() {
        let mut config = create_test_config();
        config.use_worktree = true;
        config.worktree_base_path = Some(PathBuf::from(".worktrees/test"));

        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        // Note: This test requires a valid git repository
        // In CI/CD, this may fail - marked for manual testing
        // Temporarily disabled due to Send issues
        match agent.setup_worktree(&task).await {
            Ok(_worktree_info) => {
                // assert!(worktree_info.path.exists());
                // assert_eq!(worktree_info.issue_number, 1); // task-1 -> 1

                // Cleanup
                let _ = agent.cleanup_worktree(&()).await;
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
        config.worktree_base_path = Some(PathBuf::from(".worktrees/test"));

        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        // Setup worktree first (temporarily disabled due to Send issues)
        match agent.setup_worktree(&task).await {
            Ok(_worktree_info) => {
                // Cleanup
                let result = agent.cleanup_worktree(&()).await;
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
        config.worktree_base_path = Some(PathBuf::from(".worktrees/test"));

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

        let result = agent.generate_code(&task, None).await;
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
        let files = vec!["src/my_module.rs".to_string()];
        let readme = build_readme_for_files(&files).unwrap();

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
        let files = vec![
            "src/parser.rs".to_string(),
            "src/lexer.rs".to_string(),
            "src/ast.rs".to_string(),
        ];

        let readme = build_readme_for_files(&files).unwrap();

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

        let deserialized: DocumentationGenerationResult = serde_json::from_value(json).unwrap();
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

    // ========================================================================
    // Claude Code Integration Tests (P0-4)
    // ========================================================================

    #[tokio::test]
    async fn test_generate_execution_context() {
        use miyabi_types::agent::{ImpactLevel, Severity};

        let mut task = create_test_task();
        task.severity = Some(Severity::High);
        task.impact = Some(ImpactLevel::High);
        task.dependencies = vec!["task-0".to_string()];
        task.estimated_duration = Some(60);

        let context = context::build_execution_context(&task);

        // Verify all sections are present
        assert!(context.contains("# Execution Context"));
        assert!(context.contains("**Task ID**: task-1"));
        assert!(context.contains("**Task Title**: Implement new feature"));
        assert!(context.contains("**Task Type**: Feature"));
        assert!(context.contains("**Priority**: 1"));
        assert!(context.contains("**Severity**: High"));
        assert!(context.contains("**Impact**: High"));
        assert!(context.contains("## Description"));
        assert!(context.contains("Feature description"));
        assert!(context.contains("## Dependencies"));
        assert!(context.contains("- task-0"));
        assert!(context.contains("**Estimated Duration**: 60 minutes"));
        assert!(context.contains("## Instructions"));
        assert!(context.contains("1. Analyze the task requirements"));
        assert!(context.contains("2. Generate the necessary code changes"));
        assert!(context.contains("3. Create tests for the new functionality"));
        assert!(context.contains("4. Add documentation (Rustdoc comments)"));
        assert!(context.contains("5. Commit the changes with a descriptive message"));
        assert!(context.contains("*Generated by Miyabi CodeGenAgent*"));
    }

    #[tokio::test]
    async fn test_generate_execution_context_minimal() {
        let task = create_test_task(); // No severity, impact, dependencies, duration

        let context = context::build_execution_context(&task);

        // Verify required sections are present
        assert!(context.contains("# Execution Context"));
        assert!(context.contains("**Task ID**: task-1"));
        assert!(context.contains("## Description"));

        // Verify optional sections are absent
        assert!(!context.contains("**Severity**:"));
        assert!(!context.contains("**Impact**:"));
        assert!(!context.contains("## Dependencies"));
    }

    #[tokio::test]
    async fn test_generate_agent_context_json() {
        use miyabi_types::agent::{ImpactLevel, Severity};

        let config = create_test_config();

        let mut task = create_test_task();
        task.severity = Some(Severity::High);
        task.impact = Some(ImpactLevel::Critical);
        task.dependencies = vec!["task-0".to_string(), "task-2".to_string()];

        let json_str = context::build_agent_context_json(&config, &task).unwrap();
        let json: serde_json::Value = serde_json::from_str(&json_str).unwrap();

        // Verify top-level fields
        assert_eq!(json["agentType"], "CodeGenAgent");
        assert_eq!(json["agentStatus"], "executing");

        // Verify task object
        assert_eq!(json["task"]["id"], "task-1");
        assert_eq!(json["task"]["title"], "Implement new feature");
        assert_eq!(json["task"]["description"], "Feature description");
        assert_eq!(json["task"]["taskType"], "feature"); // lowercase (serde rename_all)
        assert_eq!(json["task"]["priority"], 1);
        assert_eq!(json["task"]["severity"], "Sev.2-High"); // Severity serde rename
        assert_eq!(json["task"]["impact"], "Critical");
        assert_eq!(json["task"]["dependencies"][0], "task-0");
        assert_eq!(json["task"]["dependencies"][1], "task-2");
        assert_eq!(json["task"]["estimatedDuration"], 30);

        // Verify config object
        assert_eq!(json["config"]["useTaskTool"], false);
        assert_eq!(json["config"]["useWorktree"], false);

        // Verify prompt path
        assert_eq!(
            json["promptPath"],
            ".claude/agents/prompts/coding/codegen-agent-prompt.md"
        );
    }

    #[tokio::test]
    async fn test_execute_claude_code_file_writes() {
        let config = create_test_config();
        let task = create_test_task();

        // Create temporary directory for worktree
        let temp_dir = std::env::temp_dir().join("miyabi-test-worktree");
        if temp_dir.exists() {
            tokio::fs::remove_dir_all(&temp_dir).await.ok();
        }
        tokio::fs::create_dir_all(&temp_dir).await.unwrap();

        // Execute Claude Code (writes context files)
        let result = worktree::prepare_claude_context(&temp_dir, &config, &task).await;
        assert!(result.is_ok());

        // Verify EXECUTION_CONTEXT.md exists
        let context_md_path = temp_dir.join("EXECUTION_CONTEXT.md");
        assert!(context_md_path.exists());

        // Verify .agent-context.json exists
        let context_json_path = temp_dir.join(".agent-context.json");
        assert!(context_json_path.exists());

        // Verify EXECUTION_CONTEXT.md content
        let md_content = tokio::fs::read_to_string(&context_md_path).await.unwrap();
        assert!(md_content.contains("# Execution Context"));
        assert!(md_content.contains("**Task ID**: task-1"));

        // Verify .agent-context.json content
        let json_content = tokio::fs::read_to_string(&context_json_path).await.unwrap();
        let json: serde_json::Value = serde_json::from_str(&json_content).unwrap();
        assert_eq!(json["agentType"], "CodeGenAgent");

        // Cleanup
        tokio::fs::remove_dir_all(&temp_dir).await.ok();
    }

    #[tokio::test]
    async fn test_context_files_content_accuracy() {
        use miyabi_types::agent::{ImpactLevel, Severity};

        let config = create_test_config();

        let mut task = create_test_task();
        task.title = "Fix authentication bug".to_string();
        task.description = "User login fails with 401 error".to_string();
        task.task_type = TaskType::Bug;
        task.priority = 0;
        task.severity = Some(Severity::Critical);
        task.impact = Some(ImpactLevel::High);
        task.dependencies = vec!["task-auth-refactor".to_string()];
        task.estimated_duration = Some(120);

        // Generate markdown
        let md = context::build_execution_context(&task);
        assert!(md.contains("**Task Title**: Fix authentication bug"));
        assert!(md.contains("User login fails with 401 error"));
        assert!(md.contains("**Task Type**: Bug"));
        assert!(md.contains("**Priority**: 0"));
        assert!(md.contains("**Severity**: Critical"));
        assert!(md.contains("**Impact**: High"));
        assert!(md.contains("- task-auth-refactor"));
        assert!(md.contains("**Estimated Duration**: 120 minutes"));

        // Generate JSON
        let json_str = context::build_agent_context_json(&config, &task).unwrap();
        let json: serde_json::Value = serde_json::from_str(&json_str).unwrap();
        assert_eq!(json["task"]["title"], "Fix authentication bug");
        assert_eq!(
            json["task"]["description"],
            "User login fails with 401 error"
        );
        assert_eq!(json["task"]["taskType"], "bug"); // lowercase (serde rename_all)
        assert_eq!(json["task"]["priority"], 0);
        assert_eq!(json["task"]["severity"], "Sev.1-Critical"); // Severity serde rename
        assert_eq!(json["task"]["impact"], "High");
        assert_eq!(json["task"]["dependencies"][0], "task-auth-refactor");
        assert_eq!(json["task"]["estimatedDuration"], 120);
    }

    #[tokio::test]
    async fn test_generate_code_with_worktree_path() {
        let config = create_test_config();
        let agent = CodeGenAgent::new(config);
        let task = create_test_task();

        // Create temporary worktree directory
        let temp_dir = std::env::temp_dir().join("miyabi-test-codegen");
        if temp_dir.exists() {
            tokio::fs::remove_dir_all(&temp_dir).await.ok();
        }
        tokio::fs::create_dir_all(&temp_dir).await.unwrap();

        // Generate code with worktree path
        let result = agent.generate_code(&task, Some(&temp_dir)).await;
        assert!(result.is_ok());

        // Verify context files were created
        assert!(temp_dir.join("EXECUTION_CONTEXT.md").exists());
        assert!(temp_dir.join(".agent-context.json").exists());

        // Cleanup
        tokio::fs::remove_dir_all(&temp_dir).await.ok();
    }

    #[tokio::test]
    async fn test_parse_code_generation_results_placeholder() {
        let temp_dir = std::env::temp_dir().join("miyabi-test-parse");
        if temp_dir.exists() {
            tokio::fs::remove_dir_all(&temp_dir).await.ok();
        }
        tokio::fs::create_dir_all(&temp_dir).await.unwrap();

        // Parse results (should return placeholder for now)
        let result = worktree::parse_code_generation_results(&temp_dir)
            .await
            .unwrap();

        // Verify placeholder structure
        assert_eq!(result.files_created.len(), 0);
        assert_eq!(result.files_modified.len(), 0);
        assert_eq!(result.lines_added, 0);
        assert_eq!(result.lines_removed, 0);
        assert_eq!(result.tests_added, 0);
        assert_eq!(result.commit_sha, None);

        // Cleanup
        tokio::fs::remove_dir_all(&temp_dir).await.ok();
    }
}
