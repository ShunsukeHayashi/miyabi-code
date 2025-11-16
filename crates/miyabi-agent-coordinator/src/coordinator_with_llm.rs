//! CoordinatorAgent with LLM integration for intelligent task decomposition
//!
//! This module extends the base CoordinatorAgent with LLM-powered issue analysis
//! and intelligent task decomposition.

use crate::coordinator::CoordinatorAgent;
use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_github::GitHubClient;
use miyabi_llm::{
    GPTOSSProvider, HybridRouter, LLMProvider, LLMRequest, LlmClient, Message, ReasoningEffort,
    Role,
};
use miyabi_types::agent::{AgentMetrics, AgentType, ResultStatus};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::{Task, TaskDecomposition, TaskType};
use miyabi_types::{AgentConfig, AgentResult, Issue};
use serde_json::json;
use std::collections::HashMap;

/// Adapter to make HybridRouter compatible with legacy LLMProvider trait
struct HybridRouterAdapter {
    router: HybridRouter,
}

impl HybridRouterAdapter {
    fn new(router: HybridRouter) -> Self {
        Self { router }
    }
}

#[async_trait]
impl LLMProvider for HybridRouterAdapter {
    async fn generate(
        &self,
        request: &LLMRequest,
    ) -> miyabi_llm::error::Result<miyabi_llm::types::LLMResponse> {
        let msg = Message {
            role: Role::User,
            content: request.prompt.clone(),
        };
        let response = self.router.chat(vec![msg]).await?;

        Ok(miyabi_llm::types::LLMResponse {
            text: response,
            tokens_used: 0,
            finish_reason: "stop".to_string(),
            function_call: None,
            tool_calls: None,
        })
    }

    async fn chat(
        &self,
        messages: &[miyabi_llm::types::ChatMessage],
    ) -> miyabi_llm::error::Result<miyabi_llm::types::ChatMessage> {
        let converted: Vec<Message> = messages
            .iter()
            .map(|m| Message {
                role: if m.role == miyabi_llm::types::ChatRole::User {
                    Role::User
                } else {
                    Role::Assistant
                },
                content: m.content.clone(),
            })
            .collect();

        let response = self.router.chat(converted).await?;

        Ok(miyabi_llm::types::ChatMessage::assistant(response))
    }

    async fn call_function(
        &self,
        _name: &str,
        _args: serde_json::Value,
    ) -> miyabi_llm::error::Result<serde_json::Value> {
        Err(miyabi_llm::error::LLMError::ApiError(
            "Function calling not supported by HybridRouter adapter".to_string(),
        ))
    }

    fn model_name(&self) -> &str {
        "hybrid-router"
    }

    fn max_tokens(&self) -> usize {
        200_000 // Claude Sonnet 4.5 context window
    }
}

/// CoordinatorAgent with LLM integration
pub struct CoordinatorAgentWithLLM {
    config: AgentConfig,
    base_coordinator: CoordinatorAgent,
    llm_provider: Option<Box<dyn LLMProvider>>,
}

impl CoordinatorAgentWithLLM {
    /// Create a new CoordinatorAgentWithLLM
    pub fn new(config: AgentConfig) -> Self {
        let base_coordinator = CoordinatorAgent::new(config.clone());

        // Try to initialize LLM provider (Mac mini Ollama)
        let llm_provider = Self::initialize_llm_provider();

        Self {
            config,
            base_coordinator,
            llm_provider,
        }
    }

    /// Initialize LLM provider (with environment-based fallback chain)
    /// Tries in order: HybridRouter (Anthropic + OpenAI) → GPT-OSS → None
    fn initialize_llm_provider() -> Option<Box<dyn LLMProvider>> {
        if std::env::var("MIYABI_DISABLE_LLM")
            .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
            .unwrap_or(false)
        {
            tracing::warn!(
                "LLM provider explicitly disabled via MIYABI_DISABLE_LLM env var; falling back to rule-based task decomposition"
            );
            return None;
        }

        // Try HybridRouter first (Anthropic + OpenAI)
        match HybridRouter::from_env() {
            Ok(router) => {
                tracing::info!("✅ HybridRouter initialized (Anthropic Claude + OpenAI GPT)");
                tracing::info!("   - Complex tasks → claude-3-5-sonnet-20241022");
                tracing::info!("   - Simple tasks → gpt-4o-mini");
                let adapter = HybridRouterAdapter::new(router);
                return Some(Box::new(adapter) as Box<dyn LLMProvider>);
            },
            Err(err) => {
                tracing::warn!(
                    "HybridRouter initialization failed: {}. Trying GPT-OSS fallback...",
                    err
                );
            },
        }

        // Fallback to GPT-OSS (local LLM)
        match GPTOSSProvider::new_with_fallback() {
            Ok(provider) => {
                let model_name = provider.model_name().to_string();
                tracing::info!("LLM provider initialized successfully: {}", model_name);
                Some(Box::new(provider) as Box<dyn LLMProvider>)
            },
            Err(err) => {
                tracing::warn!(
                    "Failed to initialize LLM provider ({}). Falling back to rule-based task decomposition",
                    err
                );
                None
            },
        }
    }

    /// Decompose an Issue into Tasks using LLM
    pub async fn decompose_issue_with_llm(&self, issue: &Issue) -> Result<TaskDecomposition> {
        tracing::info!("Decomposing issue #{} with LLM: {}", issue.number, issue.title);

        // If LLM is not available, fall back to base coordinator
        let decomposition = match &self.llm_provider {
            Some(llm) => {
                // Create prompt for LLM
                let prompt = self.create_task_decomposition_prompt(issue);

                // Create LLM request with high reasoning effort
                let request = LLMRequest::new(&prompt)
                    .with_temperature(0.2) // Low temperature for structured output
                    .with_max_tokens(4096)
                    .with_reasoning_effort(ReasoningEffort::High);

                // Generate task decomposition
                match llm.generate(&request).await {
                    Ok(response) => {
                        // Parse LLM response into tasks
                        let tasks = self.parse_llm_response(&response.text, issue)?;

                        // Build DAG from task dependencies
                        let dag = self.base_coordinator.build_dag(&tasks)?;

                        // Validate DAG (no cycles)
                        let has_cycles = dag.has_cycles();
                        if has_cycles {
                            return Err(MiyabiError::Validation(
                                "Task DAG contains cycles - cannot execute".to_string(),
                            ));
                        }

                        // Calculate total estimated duration
                        let estimated_total_duration =
                            tasks.iter().filter_map(|t| t.estimated_duration).sum();

                        // Generate recommendations
                        let recommendations = self.generate_recommendations(&tasks, &dag);

                        TaskDecomposition {
                            original_issue: issue.clone(),
                            tasks,
                            dag,
                            estimated_total_duration,
                            has_cycles,
                            recommendations,
                        }
                    },
                    Err(err) => {
                        tracing::warn!(
                            "LLM generation failed: {}. Falling back to rule-based task decomposition",
                            err
                        );
                        self.base_coordinator.decompose_issue(issue).await?
                    },
                }
            },
            None => {
                tracing::info!("No LLM available - using rule-based decomposition");
                self.base_coordinator.decompose_issue(issue).await?
            },
        };

        // Generate Plans.md
        let plans_md = self.base_coordinator.generate_plans_md(&decomposition);
        tracing::info!("Generated Plans.md ({} characters)", plans_md.len());

        // Write Plans.md to .ai/plans/{issue-number}/Plans-{timestamp}.md
        let issue_number = decomposition.original_issue.number;
        if let Err(e) = self.write_plans_with_history(issue_number, &plans_md).await {
            tracing::warn!("Failed to write Plans.md with history: {}", e);
        }

        Ok(decomposition)
    }

    /// Write Plans.md with history management
    /// Format: .ai/plans/{issue-number}/Plans-{timestamp}.md
    async fn write_plans_with_history(&self, issue_number: u64, content: &str) -> Result<()> {
        use chrono::Utc;
        use std::fs;
        use std::path::PathBuf;

        // Create directory structure: .ai/plans/{issue-number}/
        let plans_dir: PathBuf = format!(".ai/plans/{}", issue_number).into();
        fs::create_dir_all(&plans_dir)?;

        // Generate timestamped filename: Plans-{timestamp}.md
        let timestamp = Utc::now().format("%Y%m%d-%H%M%S").to_string();
        let filename = format!("Plans-{}.md", timestamp);
        let file_path = plans_dir.join(&filename);

        // Write content
        fs::write(&file_path, content)?;

        tracing::info!("✅ Plans.md written: {} ({} bytes)", file_path.display(), content.len());

        // Also create a symlink to latest version: Plans-latest.md
        let latest_link = plans_dir.join("Plans-latest.md");

        // Remove old symlink if exists
        if latest_link.exists() {
            let _ = fs::remove_file(&latest_link);
        }

        // Create symlink (Unix only)
        #[cfg(unix)]
        {
            use std::os::unix::fs::symlink;
            if let Err(e) = symlink(&filename, &latest_link) {
                tracing::warn!("Failed to create Plans-latest.md symlink: {}", e);
            } else {
                tracing::info!("✅ Symlink created: {}", latest_link.display());
            }
        }

        // On Windows or if symlink failed, copy the file
        #[cfg(not(unix))]
        {
            if let Err(e) = fs::copy(&file_path, &latest_link) {
                tracing::warn!("Failed to copy Plans-latest.md: {}", e);
            } else {
                tracing::info!("✅ Latest copy created: {}", latest_link.display());
            }
        }

        Ok(())
    }

    /// Create task decomposition prompt for LLM
    fn create_task_decomposition_prompt(&self, issue: &Issue) -> String {
        let issue_number = issue.number;
        let issue_title = &issue.title;
        let issue_body = &issue.body;
        let issue_labels = issue.labels.join(", ");
        let issue_state = issue.state;

        format!(
            r#"You are an expert software project coordinator. Your task is to decompose a GitHub Issue into executable tasks.

ISSUE INFORMATION:
- Number: #{issue_number}
- Title: {issue_title}
- Description: {issue_body}
- Labels: {issue_labels}
- State: {issue_state:?}

TASK DECOMPOSITION REQUIREMENTS:

1. Break down the issue into 3-6 concrete, actionable tasks
2. Each task should have:
   - A clear, specific title (under 80 characters)
   - A detailed description (what needs to be done)
   - Task type (one of: Feature, Bug, Refactor, Docs, Test, Deployment)
   - Priority (0 = highest, 5 = lowest)
   - Assigned agent type (one of: IssueAgent, CodeGenAgent, ReviewAgent, DeploymentAgent, PRAgent)
   - Dependencies (task IDs that must complete first)
   - Estimated duration in minutes

3. Common task patterns:
   - Analysis task (IssueAgent, 5-10 min) - Always first
   - Implementation task (CodeGenAgent, 20-60 min) - Core work
   - Testing task (CodeGenAgent, 10-30 min) - After implementation
   - Review task (ReviewAgent, 5-15 min) - Quality check
   - Documentation task (CodeGenAgent, 5-20 min) - If needed
   - Deployment task (DeploymentAgent, 10-20 min) - If needed

4. Task dependencies must form a Directed Acyclic Graph (DAG) - no cycles!

5. Assign task IDs in the format: "task-<issue_number>-<task_name>"
   Example: "task-{issue_number}-analysis", "task-{issue_number}-impl", "task-{issue_number}-test"

OUTPUT FORMAT (JSON):

{{
  "tasks": [
    {{
      "id": "task-{issue_number}-analysis",
      "title": "Analyze requirements for #{issue_number}",
      "description": "Detailed analysis description",
      "task_type": "Docs",
      "priority": 0,
      "assigned_agent": "IssueAgent",
      "dependencies": [],
      "estimated_duration": 10
    }},
    {{
      "id": "task-{issue_number}-impl",
      "title": "Implement solution for #{issue_number}",
      "description": "Implementation details",
      "task_type": "Feature",
      "priority": 1,
      "assigned_agent": "CodeGenAgent",
      "dependencies": ["task-{issue_number}-analysis"],
      "estimated_duration": 30
    }}
  ]
}}

IMPORTANT: Output ONLY the JSON object, no additional text or markdown code blocks.

Now, decompose this issue into tasks:"#,
            issue_number = issue_number,
            issue_title = issue_title,
            issue_body = issue_body,
            issue_labels = issue_labels,
            issue_state = issue_state
        )
    }

    /// Parse LLM response into tasks
    fn parse_llm_response(&self, response_text: &str, issue: &Issue) -> Result<Vec<Task>> {
        // Remove markdown code blocks if present
        let json_text = response_text
            .trim()
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_end_matches("```")
            .trim();

        // Parse JSON
        let response_json: serde_json::Value = serde_json::from_str(json_text).map_err(|e| {
            MiyabiError::Validation(format!(
                "Failed to parse LLM response as JSON: {}. Response: {}",
                e, json_text
            ))
        })?;

        // Extract tasks array
        let tasks_array =
            response_json.get("tasks").and_then(|t| t.as_array()).ok_or_else(|| {
                MiyabiError::Validation("LLM response missing 'tasks' array".to_string())
            })?;

        // Convert JSON tasks to Task structs
        let mut tasks = Vec::new();
        for (idx, task_json) in tasks_array.iter().enumerate() {
            let task = self.parse_task_json(task_json, issue, idx)?;
            tasks.push(task);
        }

        Ok(tasks)
    }

    /// Parse a single task from JSON
    fn parse_task_json(
        &self,
        task_json: &serde_json::Value,
        issue: &Issue,
        index: usize,
    ) -> Result<Task> {
        let id = task_json
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or(&format!("task-{}-{}", issue.number, index))
            .to_string();

        let title = task_json
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("Unnamed task")
            .to_string();

        let description =
            task_json.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string();

        let task_type_str =
            task_json.get("task_type").and_then(|v| v.as_str()).unwrap_or("Feature");
        let task_type = self.parse_task_type(task_type_str);

        let priority = task_json.get("priority").and_then(|v| v.as_u64()).unwrap_or(1) as u8;

        let assigned_agent_str = task_json
            .get("assigned_agent")
            .and_then(|v| v.as_str())
            .unwrap_or("CodeGenAgent");
        let assigned_agent = Some(self.parse_agent_type(assigned_agent_str));

        let dependencies = task_json
            .get("dependencies")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|v| v.as_str()).map(|s| s.to_string()).collect())
            .unwrap_or_default();

        let estimated_duration =
            task_json.get("estimated_duration").and_then(|v| v.as_u64()).map(|v| v as u32);

        Ok(Task {
            id,
            title,
            description,
            task_type,
            priority,
            severity: None,
            impact: None,
            assigned_agent,
            dependencies,
            estimated_duration,
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([("issue_number".to_string(), json!(issue.number))])),
        })
    }

    /// Parse task type from string
    fn parse_task_type(&self, task_type_str: &str) -> TaskType {
        match task_type_str.to_lowercase().as_str() {
            "feature" => TaskType::Feature,
            "bug" => TaskType::Bug,
            "refactor" => TaskType::Refactor,
            "docs" => TaskType::Docs,
            "test" => TaskType::Test,
            "deployment" => TaskType::Deployment,
            _ => TaskType::Feature,
        }
    }

    /// Parse agent type from string
    fn parse_agent_type(&self, agent_type_str: &str) -> AgentType {
        match agent_type_str.to_lowercase().as_str() {
            "issueagent" | "issue" => AgentType::IssueAgent,
            "codegenagent" | "codegen" => AgentType::CodeGenAgent,
            "reviewagent" | "review" => AgentType::ReviewAgent,
            "deploymentagent" | "deployment" => AgentType::DeploymentAgent,
            "pragent" | "pr" => AgentType::PRAgent,
            _ => AgentType::CodeGenAgent,
        }
    }

    /// Generate recommendations based on task analysis
    fn generate_recommendations(
        &self,
        tasks: &[Task],
        dag: &miyabi_types::workflow::DAG,
    ) -> Vec<String> {
        let mut recommendations = Vec::new();

        // Check for long critical path
        let critical_path = dag.critical_path();
        if critical_path.len() > 5 {
            recommendations.push(format!(
                "Critical path has {} tasks - consider parallelizing more work",
                critical_path.len()
            ));
        }

        // Check for missing tests
        let has_test_task = tasks.iter().any(|t| t.task_type == TaskType::Test);
        if !has_test_task {
            recommendations.push("Consider adding test coverage".to_string());
        }

        // Check for missing docs
        let has_docs_task = tasks.iter().any(|t| t.task_type == TaskType::Docs);
        if !has_docs_task {
            recommendations.push("Consider adding documentation".to_string());
        }

        // Check for tasks without agents
        let unassigned_tasks = tasks.iter().filter(|t| t.assigned_agent.is_none()).count();
        if unassigned_tasks > 0 {
            recommendations.push(format!(
                "{} task(s) are unassigned - assign agents for execution",
                unassigned_tasks
            ));
        }

        recommendations
    }
}

#[async_trait]
impl BaseAgent for CoordinatorAgentWithLLM {
    fn agent_type(&self) -> AgentType {
        AgentType::CoordinatorAgent
    }

    async fn execute(&self, task: &miyabi_types::Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        // Extract issue from task metadata
        let issue_number = task
            .metadata
            .as_ref()
            .and_then(|m| m.get("issue_number"))
            .and_then(|v| v.as_u64())
            .ok_or_else(|| {
                MiyabiError::Validation("Task metadata missing issue_number".to_string())
            })?;

        // Fetch issue from GitHub
        let owner = self
            .config
            .repo_owner
            .as_ref()
            .ok_or_else(|| MiyabiError::Config("repo_owner not configured".to_string()))?;
        let repo = self
            .config
            .repo_name
            .as_ref()
            .ok_or_else(|| MiyabiError::Config("repo_name not configured".to_string()))?;

        let github_client = GitHubClient::new(&self.config.github_token, owner, repo)?;
        let issue = github_client.get_issue(issue_number).await?;

        // Decompose issue into tasks (with LLM if available)
        let decomposition = self.decompose_issue_with_llm(&issue).await?;

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Create metrics
        let metrics = AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::CoordinatorAgent,
            duration_ms,
            quality_score: None,
            lines_changed: None,
            tests_added: None,
            coverage_percent: None,
            errors_found: None,
            timestamp: end_time,
        };

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::to_value(decomposition)?),
            error: None,
            metrics: Some(metrics),
            escalation: None,
        })
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

    fn create_test_issue() -> Issue {
        Issue {
            number: 123,
            title: "Implement new feature".to_string(),
            body: "Feature description".to_string(),
            state: miyabi_types::issue::IssueStateGithub::Open,
            labels: vec!["type:feature".to_string()],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/user/repo/issues/123".to_string(),
        }
    }

    #[tokio::test]
    async fn test_coordinator_agent_with_llm_creation() {
        let config = create_test_config();
        let agent = CoordinatorAgentWithLLM::new(config);
        assert_eq!(agent.agent_type(), AgentType::CoordinatorAgent);
    }

    #[tokio::test]
    async fn test_create_task_decomposition_prompt() {
        let config = create_test_config();
        let agent = CoordinatorAgentWithLLM::new(config);
        let issue = create_test_issue();

        let prompt = agent.create_task_decomposition_prompt(&issue);

        // Check for issue details in the prompt
        assert!(prompt.contains("Number: #123"));
        assert!(prompt.contains("Title: Implement new feature"));
        assert!(prompt.contains("Description: Feature description"));
        assert!(prompt.contains("Labels: type:feature"));
        assert!(prompt.contains("TASK DECOMPOSITION REQUIREMENTS"));
        assert!(prompt.contains("OUTPUT FORMAT (JSON)"));
    }

    #[tokio::test]
    async fn test_parse_task_type() {
        let config = create_test_config();
        let agent = CoordinatorAgentWithLLM::new(config);

        assert_eq!(agent.parse_task_type("Feature"), TaskType::Feature);
        assert_eq!(agent.parse_task_type("Bug"), TaskType::Bug);
        assert_eq!(agent.parse_task_type("Refactor"), TaskType::Refactor);
        assert_eq!(agent.parse_task_type("Docs"), TaskType::Docs);
        assert_eq!(agent.parse_task_type("Test"), TaskType::Test);
        assert_eq!(agent.parse_task_type("Deployment"), TaskType::Deployment);
        assert_eq!(agent.parse_task_type("Unknown"), TaskType::Feature);
    }

    #[tokio::test]
    async fn test_parse_agent_type() {
        let config = create_test_config();
        let agent = CoordinatorAgentWithLLM::new(config);

        assert_eq!(agent.parse_agent_type("IssueAgent"), AgentType::IssueAgent);
        assert_eq!(agent.parse_agent_type("CodeGenAgent"), AgentType::CodeGenAgent);
        assert_eq!(agent.parse_agent_type("ReviewAgent"), AgentType::ReviewAgent);
        assert_eq!(agent.parse_agent_type("DeploymentAgent"), AgentType::DeploymentAgent);
        assert_eq!(agent.parse_agent_type("PRAgent"), AgentType::PRAgent);
        assert_eq!(agent.parse_agent_type("Unknown"), AgentType::CodeGenAgent);
    }

    #[tokio::test]
    async fn test_parse_llm_response() {
        let config = create_test_config();
        let agent = CoordinatorAgentWithLLM::new(config);
        let issue = create_test_issue();

        let llm_response = r#"{
  "tasks": [
    {
      "id": "task-123-analysis",
      "title": "Analyze requirements",
      "description": "Analyze the feature requirements",
      "task_type": "Docs",
      "priority": 0,
      "assigned_agent": "IssueAgent",
      "dependencies": [],
      "estimated_duration": 10
    },
    {
      "id": "task-123-impl",
      "title": "Implement feature",
      "description": "Implement the new feature",
      "task_type": "Feature",
      "priority": 1,
      "assigned_agent": "CodeGenAgent",
      "dependencies": ["task-123-analysis"],
      "estimated_duration": 30
    }
  ]
}"#;

        let tasks = agent.parse_llm_response(llm_response, &issue).unwrap();

        assert_eq!(tasks.len(), 2);
        assert_eq!(tasks[0].id, "task-123-analysis");
        assert_eq!(tasks[0].title, "Analyze requirements");
        assert_eq!(tasks[0].task_type, TaskType::Docs);
        assert_eq!(tasks[0].assigned_agent, Some(AgentType::IssueAgent));
        assert_eq!(tasks[0].dependencies.len(), 0);

        assert_eq!(tasks[1].id, "task-123-impl");
        assert_eq!(tasks[1].title, "Implement feature");
        assert_eq!(tasks[1].task_type, TaskType::Feature);
        assert_eq!(tasks[1].assigned_agent, Some(AgentType::CodeGenAgent));
        assert_eq!(tasks[1].dependencies.len(), 1);
        assert_eq!(tasks[1].dependencies[0], "task-123-analysis");
    }

    #[tokio::test]
    async fn test_write_plans_with_history() {
        use std::fs;
        use std::path::PathBuf;

        let config = create_test_config();
        let agent = CoordinatorAgentWithLLM::new(config);

        let issue_number = 999;
        let content = "# Test Plans\n\nThis is a test.";

        // Clean up test directory
        let test_dir: PathBuf = format!(".ai/plans/{}", issue_number).into();
        let _ = fs::remove_dir_all(&test_dir);

        // Write plans
        agent.write_plans_with_history(issue_number, content).await.unwrap();

        // Verify directory exists
        assert!(test_dir.exists());

        // Verify at least one Plans-*.md file exists
        let entries = fs::read_dir(&test_dir).unwrap();
        let plans_files: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.file_name().to_string_lossy().starts_with("Plans-")
                    && e.file_name().to_string_lossy().ends_with(".md")
            })
            .collect();

        assert!(!plans_files.is_empty(), "No Plans-*.md files found");

        // Verify latest symlink exists (Unix only)
        #[cfg(unix)]
        {
            let latest_link = test_dir.join("Plans-latest.md");
            assert!(latest_link.exists(), "Plans-latest.md not found");
        }

        // Clean up
        let _ = fs::remove_dir_all(&test_dir);
    }

    #[tokio::test]
    async fn test_parse_llm_response_with_markdown() {
        let config = create_test_config();
        let agent = CoordinatorAgentWithLLM::new(config);
        let issue = create_test_issue();

        let llm_response_with_markdown = r#"```json
{
  "tasks": [
    {
      "id": "task-123-analysis",
      "title": "Analyze requirements",
      "description": "Analyze the feature requirements",
      "task_type": "Docs",
      "priority": 0,
      "assigned_agent": "IssueAgent",
      "dependencies": [],
      "estimated_duration": 10
    }
  ]
}
```"#;

        let tasks = agent.parse_llm_response(llm_response_with_markdown, &issue).unwrap();

        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].id, "task-123-analysis");
    }
}
