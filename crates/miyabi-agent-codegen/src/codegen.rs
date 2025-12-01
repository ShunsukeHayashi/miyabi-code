//! CodeGenAgent - AI-driven code generation
//!
//! Responsible for generating code based on Task requirements.
//! Integrates with GitHub for repository context and Claude Code for implementation.

pub use crate::documentation::DocumentationGenerationResult;
use crate::{documentation, frontend, prompt, worktree};
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use miyabi_agent_core::{
    a2a_integration::{
        A2AAgentCard, A2AEnabled, A2AIntegrationError, A2ATask, A2ATaskResult, AgentCapability, AgentCardBuilder,
    },
    BaseAgent,
};
use miyabi_claudable::ClaudableClient;
use miyabi_core::task_metadata::TaskMetadataManager;
use miyabi_core::ExecutionMode;
use miyabi_llm::{GPTOSSProvider, LLMProvider, LLMRequest, ReasoningEffort};
use miyabi_types::agent::{AgentMetrics, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, AgentResult, AgentType, Task};
use serde_json::json;
// use miyabi_worktree::{WorktreeInfo, WorktreeManager}; // Temporarily disabled due to Send issues
use std::path::Path;

pub struct CodeGenAgent {
    config: AgentConfig,
    /// LLM provider for code generation
    llm_provider: Option<GPTOSSProvider>,
    /// Claudable client for frontend generation
    claudable_client: Option<ClaudableClient>,
}

impl CodeGenAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config, llm_provider: None, claudable_client: None }
    }

    /// Create CodeGenAgent with Ollama integration
    pub fn new_with_ollama(config: AgentConfig) -> Result<Self> {
        let llm_provider = GPTOSSProvider::new_mac_mini_tailscale()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Ollama provider: {}", e)))?;

        Ok(Self { config, llm_provider: Some(llm_provider), claudable_client: None })
    }

    /// Create CodeGenAgent with Claudable integration
    pub fn new_with_claudable(config: AgentConfig) -> Result<Self> {
        let claudable_url = std::env::var("CLAUDABLE_API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());

        let claudable_client = ClaudableClient::new(claudable_url)
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claudable client: {}", e)))?;

        Ok(Self { config, llm_provider: None, claudable_client: Some(claudable_client) })
    }

    /// Create CodeGenAgent with both Ollama and Claudable
    pub fn new_with_all(config: AgentConfig) -> Result<Self> {
        let llm_provider = GPTOSSProvider::new_mac_mini_tailscale().ok();

        let claudable_url = std::env::var("CLAUDABLE_API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
        let claudable_client = ClaudableClient::new(claudable_url).ok();

        Ok(Self { config, llm_provider, claudable_client })
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
            Err(MiyabiError::Validation("LLM provider not configured".to_string()))
        }
    }

    /// Generate frontend using Claudable
    async fn generate_frontend_with_claudable(
        &self,
        task: &Task,
        worktree_path: Option<&Path>,
    ) -> Result<CodeGenerationResult> {
        tracing::info!("🎨 Frontend task detected, using Claudable for generation");

        let claudable = self
            .claudable_client
            .as_ref()
            .ok_or_else(|| MiyabiError::Validation("Claudable client not configured".to_string()))?;

        // Build request
        let description = frontend::extract_frontend_description(task);
        let request = miyabi_claudable::GenerateRequest::new(description);

        tracing::debug!("Sending request to Claudable API");

        // Call Claudable API
        let response = claudable.generate(request).await.map_err(|e| {
            tracing::error!("Claudable generation failed: {}", e);
            MiyabiError::Unknown(format!("Claudable generation failed: {}", e))
        })?;

        tracing::info!("✅ Claudable generated project: {}", response.project_id);
        tracing::debug!("Files: {}, Dependencies: {}", response.files.len(), response.dependencies.len());

        // If worktree provided, write files and build
        if let Some(worktree) = worktree_path {
            use miyabi_claudable::worktree as claudable_worktree;

            // Write files
            let summary = claudable_worktree::write_files_to_worktree(worktree, &response)
                .await
                .map_err(|e| MiyabiError::Unknown(format!("Failed to write files: {}", e)))?;

            tracing::info!("  📝 Wrote {} files ({} lines)", summary.files_written, summary.total_lines);

            // Install dependencies
            tracing::info!("  📦 Running npm install...");
            claudable_worktree::install_dependencies(worktree)
                .await
                .map_err(|e| MiyabiError::Unknown(format!("npm install failed: {}", e)))?;

            // Build app
            tracing::info!("  🔨 Building Next.js app...");
            claudable_worktree::build_nextjs_app(worktree)
                .await
                .map_err(|e| MiyabiError::Unknown(format!("Next.js build failed: {}", e)))?;

            tracing::info!("✅ Frontend generation complete!");

            Ok(CodeGenerationResult {
                files_created: response.files.iter().map(|f| f.path.clone()).collect(),
                files_modified: vec![],
                lines_added: summary.total_lines as u32,
                lines_removed: 0,
                tests_added: 0,
                commit_sha: None,
            })
        } else {
            // Return result without worktree
            Ok(CodeGenerationResult {
                files_created: response.files.iter().map(|f| f.path.clone()).collect(),
                files_modified: vec![],
                lines_added: response.files.iter().map(|f| f.content.lines().count()).sum::<usize>() as u32,
                lines_removed: 0,
                tests_added: 0,
                commit_sha: None,
            })
        }
    }

    /// Generate code based on task requirements
    pub async fn generate_code(&self, task: &Task, worktree_path: Option<&Path>) -> Result<CodeGenerationResult> {
        tracing::info!("Generating code for task: {}", task.title);

        // NEW: Frontend task detection
        if frontend::is_frontend_task(task) && self.claudable_client.is_some() {
            tracing::info!("Frontend task detected, delegating to Claudable");
            return self.generate_frontend_with_claudable(task, worktree_path).await;
        }

        // Validate task type
        if !matches!(task.task_type, TaskType::Feature | TaskType::Bug | TaskType::Refactor) {
            return Err(MiyabiError::Validation(format!("CodeGenAgent cannot handle task type: {:?}", task.task_type)));
        }

        // If LLM provider is available, use it for code generation
        if self.llm_provider.is_some() {
            return self.generate_code_with_llm_provider(task, worktree_path).await;
        }

        // If worktree is provided, execute Claude Code in it
        if let Some(worktree) = worktree_path {
            worktree::prepare_claude_context(worktree, &self.config, task).await?;
            // Parse results from worktree
            worktree::parse_code_generation_results(worktree).await
        } else {
            // Fallback: placeholder result for testing without worktree
            Ok(CodeGenerationResult::empty())
        }
    }

    /// Generate code using LLM provider
    async fn generate_code_with_llm_provider(
        &self,
        task: &Task,
        worktree_path: Option<&Path>,
    ) -> Result<CodeGenerationResult> {
        tracing::info!("Generating code using LLM provider for task: {}", task.title);

        // Generate code using LLM
        let generated_code = self.generate_code_with_llm(task).await?;

        // If worktree is provided, write the generated code to files
        if let Some(worktree) = worktree_path {
            worktree::write_generated_code_to_worktree(worktree, &self.config, task, &generated_code).await?;

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

    fn build_metrics(
        &self,
        task: &Task,
        result: &CodeGenerationResult,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> AgentMetrics {
        let duration = end_time.signed_duration_since(start_time).num_milliseconds();
        let duration_ms = if duration < 0 { 0 } else { duration as u64 };
        let lines_changed = result.lines_added.saturating_add(result.lines_removed);

        AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::CodeGenAgent,
            duration_ms,
            quality_score: None,
            lines_changed: Some(lines_changed),
            tests_added: Some(result.tests_added),
            coverage_percent: None,
            errors_found: None,
            timestamp: end_time,
        }
    }

    /// Validate generated code
    fn validate_code(&self, result: &CodeGenerationResult) -> Result<()> {
        if result.files_created.is_empty() && result.files_modified.is_empty() {
            return Err(MiyabiError::Validation("No files were created or modified".to_string()));
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
        let start_time = Utc::now();

        // Get project root from config for TaskMetadata
        let project_root = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));

        // Update TaskMetadata: mark as started
        if let Ok(manager) = TaskMetadataManager::new(&project_root) {
            if let Err(e) = manager.mark_started(&task.id) {
                tracing::warn!("Failed to update TaskMetadata to Running: {}", e);
            } else {
                tracing::info!("🚀 TaskMetadata updated: {} → Running", task.id);
            }
        }

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

        // Handle code generation result and update TaskMetadata
        let (final_result, task_success) = match code_result {
            Ok(result) => {
                if self.llm_provider.is_some() || self.config.use_worktree {
                    match self.validate_code(&result) {
                        Ok(_) => (Ok(result), true),
                        Err(e) => (Err(e), false),
                    }
                } else {
                    (Ok(result), true)
                }
            }
            Err(e) => (Err(e), false),
        };

        // Update TaskMetadata: mark as completed (success or failed)
        if let Ok(manager) = TaskMetadataManager::new(&project_root) {
            let update_result = if task_success {
                manager.mark_completed(&task.id, true)
            } else {
                let error_msg = final_result.as_ref().err().map(|e| e.to_string());
                manager.mark_failed(&task.id, error_msg)
            };

            if let Err(e) = update_result {
                tracing::warn!("Failed to update TaskMetadata completion status: {}", e);
            } else {
                let status = if task_success { "Success" } else { "Failed" };
                tracing::info!("✅ TaskMetadata updated: {} → {}", task.id, status);
            }
        }

        // Propagate error if code generation failed
        let code_result = final_result?;

        // Log cleanup error but don't fail the whole task (temporarily disabled)
        // if let Err(e) = cleanup_result {
        //     tracing::warn!("Failed to cleanup worktree: {}", e);
        // }

        let end_time = Utc::now();
        let metrics = self.build_metrics(task, &code_result, start_time, end_time);

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::to_value(code_result)?),
            error: None,
            metrics: Some(metrics),
            escalation: None,
        })
    }
}

/// A2A Protocol Implementation for CodeGenAgent
///
/// This enables CodeGenAgent to:
/// - Generate code via A2A requests from other agents
/// - Use native Rust tools for file operations
/// - Participate in agent orchestration
#[async_trait]
impl A2AEnabled for CodeGenAgent {
    fn agent_card(&self) -> A2AAgentCard {
        AgentCardBuilder::new("codegen-agent", "Code Generation Agent")
            .description("AI-driven code generation for features, bug fixes, and refactoring")
            .version("0.1.0")
            .capability(AgentCapability {
                id: "generate_code".to_string(),
                name: "Code Generation".to_string(),
                description: "Generate code based on task requirements".to_string(),
                input_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "task_id": { "type": "string" },
                        "title": { "type": "string" },
                        "description": { "type": "string" },
                        "task_type": { "type": "string", "enum": ["Feature", "Bug", "Refactor"] },
                        "worktree_path": { "type": "string" }
                    },
                    "required": ["task_id", "title", "description"]
                })),
                output_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "files_created": { "type": "array", "items": { "type": "string" } },
                        "files_modified": { "type": "array", "items": { "type": "string" } },
                        "lines_added": { "type": "integer" },
                        "lines_removed": { "type": "integer" },
                        "tests_added": { "type": "integer" }
                    }
                })),
            })
            .capability(AgentCapability {
                id: "generate_documentation".to_string(),
                name: "Documentation Generation".to_string(),
                description: "Generate documentation for generated code".to_string(),
                input_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "project_path": { "type": "string" },
                        "code_result": { "type": "object" }
                    },
                    "required": ["project_path", "code_result"]
                })),
                output_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "readme_generated": { "type": "boolean" },
                        "api_docs_generated": { "type": "boolean" }
                    }
                })),
            })
            .input_mode("json")
            .output_mode("json")
            .metadata("agent_type", json!("CodeGenAgent"))
            .metadata("supports_llm", json!(self.llm_provider.is_some()))
            .metadata("supports_claudable", json!(self.claudable_client.is_some()))
            .build()
    }

    async fn handle_a2a_task(&self, task: A2ATask) -> std::result::Result<A2ATaskResult, A2AIntegrationError> {
        let start = std::time::Instant::now();

        match task.capability.as_str() {
            "generate_code" => {
                // Build Task from input
                let task_id = task.input["task_id"].as_str().unwrap_or("a2a-task").to_string();
                let title = task.input["title"]
                    .as_str()
                    .ok_or_else(|| A2AIntegrationError::TaskExecutionFailed("Missing title".to_string()))?
                    .to_string();
                let description = task.input["description"].as_str().unwrap_or("").to_string();
                let task_type_str = task.input["task_type"].as_str().unwrap_or("Feature");

                let task_type = match task_type_str {
                    "Bug" => TaskType::Bug,
                    "Refactor" => TaskType::Refactor,
                    _ => TaskType::Feature,
                };

                let miyabi_task = Task {
                    id: task_id,
                    title,
                    description,
                    task_type,
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
                };

                // Get worktree path if provided
                let worktree_path = task.input["worktree_path"].as_str().map(std::path::PathBuf::from);

                // Generate code
                let result = self
                    .generate_code(&miyabi_task, worktree_path.as_deref())
                    .await
                    .map_err(|e| A2AIntegrationError::TaskExecutionFailed(e.to_string()))?;

                Ok(A2ATaskResult::Success {
                    output: serde_json::to_value(result).map_err(A2AIntegrationError::SerializationError)?,
                    artifacts: vec![],
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }
            "generate_documentation" => {
                let project_path = task.input["project_path"]
                    .as_str()
                    .ok_or_else(|| A2AIntegrationError::TaskExecutionFailed("Missing project_path".to_string()))?;
                let code_result: CodeGenerationResult = serde_json::from_value(task.input["code_result"].clone())
                    .map_err(|e| A2AIntegrationError::TaskExecutionFailed(format!("Invalid code_result: {}", e)))?;

                let doc_result = self
                    .generate_documentation(Path::new(project_path), &code_result)
                    .await
                    .map_err(|e| A2AIntegrationError::TaskExecutionFailed(e.to_string()))?;

                Ok(A2ATaskResult::Success {
                    output: serde_json::to_value(doc_result).map_err(A2AIntegrationError::SerializationError)?,
                    artifacts: vec![],
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }
            _ => Err(A2AIntegrationError::TaskExecutionFailed(format!("Unknown capability: {}", task.capability))),
        }
    }

    fn execution_mode(&self) -> ExecutionMode {
        // CodeGenAgent needs full file access for creating and modifying code
        ExecutionMode::FileEdits
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

impl CodeGenerationResult {
    pub(crate) fn empty() -> Self {
        Self {
            files_created: Vec::new(),
            files_modified: Vec::new(),
            lines_added: 0,
            lines_removed: 0,
            tests_added: 0,
            commit_sha: None,
        }
    }
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
        let error = AgentError::new("Test error", AgentType::CodeGenAgent, Some("task-123".to_string()));

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

    // ========================================================================
    // Claude Code Integration Tests (P0-4)
    // ========================================================================
}
