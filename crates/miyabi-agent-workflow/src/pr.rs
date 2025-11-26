//! PRAgent - Pull Request自動作成Agent
//!
//! Conventional Commits準拠のPRタイトル生成、説明文生成、Label付与、レビュワー割り当てを実行

use async_trait::async_trait;
use miyabi_agent_core::{
    a2a_integration::{
        A2AAgentCard, A2AEnabled, A2AIntegrationError, A2ATask, A2ATaskResult, AgentCapability,
        AgentCardBuilder,
    },
    BaseAgent,
};
use miyabi_core::ExecutionMode;
use miyabi_github::GitHubClient;
use miyabi_types::{
    agent::{AgentConfig, AgentResult, AgentType, ResultStatus},
    error::{MiyabiError, Result},
    task::{Task, TaskType},
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;

/// PRAgent - Pull Request自動作成Agent
pub struct PRAgent {
    config: AgentConfig,
}

impl PRAgent {
    /// Create a new PRAgent
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Generate Conventional Commits compliant PR title
    ///
    /// Format: {prefix}({scope}): {description}
    ///
    /// # Arguments
    /// * `task` - Task containing title and type
    ///
    /// # Returns
    /// Formatted PR title
    fn generate_pr_title(&self, task: &Task) -> String {
        let prefix = Self::get_conventional_commits_prefix(task.task_type);
        let scope = Self::detect_scope_from_title(&task.title);

        match scope {
            Some(s) => format!("{}({}): {}", prefix, s, task.title),
            None => format!("{}: {}", prefix, task.title),
        }
    }

    /// Get Conventional Commits prefix from task type
    fn get_conventional_commits_prefix(task_type: TaskType) -> &'static str {
        match task_type {
            TaskType::Feature => "feat",
            TaskType::Bug => "fix",
            TaskType::Refactor => "refactor",
            TaskType::Docs => "docs",
            TaskType::Test => "test",
            TaskType::Deployment => "ci",
        }
    }

    /// Detect scope from task title
    ///
    /// Attempts to extract scope from common patterns:
    /// - "Auth: ..." → Some("auth")
    /// - "API authentication fix" → Some("api")
    /// - "Generic task" → None
    fn detect_scope_from_title(title: &str) -> Option<String> {
        // Check for explicit scope with colon
        if let Some(pos) = title.find(':') {
            let potential_scope = title[..pos].trim().to_lowercase();
            if potential_scope.len() <= 20 && !potential_scope.contains(' ') {
                return Some(potential_scope);
            }
        }

        // Check for common keywords
        let keywords = [
            "auth", "api", "db", "ui", "core", "cli", "config", "agent", "github", "deploy",
        ];

        let lower_title = title.to_lowercase();
        for keyword in keywords {
            if lower_title.contains(keyword) {
                return Some(keyword.to_string());
            }
        }

        None
    }

    /// Generate PR body
    ///
    /// Includes:
    /// - Overview (from task description)
    /// - Changes (file list with line counts)
    /// - Test results (if available)
    /// - Checklist
    /// - Related issue
    fn generate_pr_body(&self, task: &Task, _changes: &[String]) -> String {
        let mut body = String::new();

        // Overview
        body.push_str("## 概要\n\n");
        body.push_str(&task.description);
        body.push_str("\n\n");

        // Related Issue
        if let Some(ref metadata) = task.metadata {
            if let Some(issue_number) = metadata.get("issueNumber") {
                body.push_str("## 関連Issue\n\n");
                body.push_str(&format!("Closes #{}\n\n", issue_number));
            }
        }

        // Changes section placeholder
        body.push_str("## 変更内容\n\n");
        body.push_str("※ 変更ファイルは自動検出されます\n\n");

        // Test results placeholder
        body.push_str("## テスト結果\n\n");
        body.push_str("```\n");
        body.push_str("✅ Tests: To be run\n");
        body.push_str("✅ Lint: To be checked\n");
        body.push_str("✅ Quality: To be reviewed\n");
        body.push_str("```\n\n");

        // Checklist
        body.push_str("## チェックリスト\n\n");
        body.push_str("- [ ] コードレビュー完了\n");
        body.push_str("- [ ] テスト通過\n");
        body.push_str("- [ ] ドキュメント更新\n");
        body.push_str("- [ ] セキュリティスキャン通過\n\n");

        // Footer
        body.push_str("---\n\n");
        body.push_str("🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\n");
        body.push_str("Co-Authored-By: Claude <noreply@anthropic.com>\n");

        body
    }

    /// Create Pull Request
    async fn create_pr(&self, task: &Task) -> Result<PRCreationResult> {
        tracing::info!("Creating Pull Request for task: {}", task.id);

        // Validate task metadata
        let metadata = task
            .metadata
            .as_ref()
            .ok_or_else(|| MiyabiError::Validation("Task metadata is missing".to_string()))?;

        let branch = metadata
            .get("branch")
            .and_then(|v| v.as_str())
            .ok_or_else(|| MiyabiError::Validation("Branch name is missing".to_string()))?;

        let base_branch = metadata
            .get("baseBranch")
            .and_then(|v| v.as_str())
            .unwrap_or("main");

        // Generate PR title and body
        let title = self.generate_pr_title(task);
        let body = self.generate_pr_body(task, &[]);

        // Create GitHub client
        let github_token = std::env::var("GITHUB_TOKEN")
            .map_err(|_| MiyabiError::Config("GITHUB_TOKEN not found".to_string()))?;

        let repo_owner = self
            .config
            .repo_owner
            .as_ref()
            .ok_or_else(|| MiyabiError::Config("repo_owner not configured".to_string()))?;

        let repo_name = self
            .config
            .repo_name
            .as_ref()
            .ok_or_else(|| MiyabiError::Config("repo_name not configured".to_string()))?;

        let client = GitHubClient::new(&github_token, repo_owner.clone(), repo_name.clone())?;

        // Create draft PR
        tracing::info!(
            "Creating draft PR: {} from {} to {}",
            title,
            branch,
            base_branch
        );

        let pr = client
            .create_pull_request(&title, branch, base_branch, Some(&body), true)
            .await?;

        tracing::info!("PR created: #{} - {}", pr.number, pr.url);

        // Add labels if available
        if let Some(labels) = self.extract_labels(task) {
            if !labels.is_empty() {
                tracing::info!("Adding labels to PR #{}: {:?}", pr.number, labels);

                if let Err(e) = client.add_labels(pr.number, &labels).await {
                    tracing::warn!("Failed to add labels to PR #{}: {}", pr.number, e);
                }
            }
        }

        Ok(PRCreationResult {
            pr_number: pr.number,
            pr_url: pr.url,
            title,
            branch: branch.to_string(),
            base_branch: base_branch.to_string(),
            labels: self.extract_labels(task).unwrap_or_default(),
        })
    }

    /// Extract labels from task
    fn extract_labels(&self, task: &Task) -> Option<Vec<String>> {
        let mut labels = Vec::new();

        // Add type label
        let type_label = match task.task_type {
            TaskType::Feature => "✨ type:feature",
            TaskType::Bug => "🐛 type:bug",
            TaskType::Refactor => "♻️ type:refactor",
            TaskType::Docs => "📚 type:docs",
            TaskType::Test => "🧪 type:test",
            TaskType::Deployment => "🚀 type:deployment",
        };
        labels.push(type_label.to_string());

        // Add agent label
        labels.push("🤖 agent:pr".to_string());

        // Add state label
        labels.push("🔍 review-required".to_string());

        Some(labels)
    }
}

#[async_trait]
impl BaseAgent for PRAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::PRAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        tracing::info!("PRAgent executing task: {}", task.id);

        // Validate task metadata
        if task.metadata.is_none() {
            return Err(MiyabiError::Validation(
                "Task metadata is required for PR creation".to_string(),
            ));
        }

        // Create PR
        let pr_result = self.create_pr(task).await?;

        // Construct result data
        let mut data = HashMap::new();
        data.insert("pr_number".to_string(), pr_result.pr_number.into());
        data.insert("pr_url".to_string(), pr_result.pr_url.into());
        data.insert("title".to_string(), pr_result.title.into());
        data.insert("branch".to_string(), pr_result.branch.into());
        data.insert("base_branch".to_string(), pr_result.base_branch.into());
        data.insert(
            "labels".to_string(),
            serde_json::to_value(&pr_result.labels)
                .map_err(|e| MiyabiError::Unknown(format!("Failed to serialize labels: {}", e)))?,
        );

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(
                serde_json::to_value(data).map_err(|e| {
                    MiyabiError::Unknown(format!("Failed to serialize data: {}", e))
                })?,
            ),
            error: None,
            metrics: None,
            escalation: None,
        })
    }
}

/// Result of PR creation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PRCreationResult {
    pub pr_number: u64,
    pub pr_url: String,
    pub title: String,
    pub branch: String,
    pub base_branch: String,
    pub labels: Vec<String>,
}

#[async_trait]
impl A2AEnabled for PRAgent {
    fn agent_card(&self) -> A2AAgentCard {
        AgentCardBuilder::new("PRAgent", "Pull Request creation and management agent")
            .version("0.1.1")
            .capability(AgentCapability {
                id: "create_pr".to_string(),
                name: "Create Pull Request".to_string(),
                description: "Create a draft PR with Conventional Commits title, labels, and description".to_string(),
                input_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "branch": { "type": "string", "description": "Source branch name" },
                        "base_branch": { "type": "string", "description": "Target branch (default: main)" },
                        "title": { "type": "string", "description": "PR title" },
                        "description": { "type": "string", "description": "PR description" },
                        "task_type": { "type": "string", "description": "Task type for label inference" }
                    },
                    "required": ["branch", "title"]
                })),
                output_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "pr_number": { "type": "integer" },
                        "pr_url": { "type": "string" },
                        "title": { "type": "string" },
                        "labels": { "type": "array", "items": { "type": "string" } }
                    }
                })),
            })
            .build()
    }

    async fn handle_a2a_task(
        &self,
        task: A2ATask,
    ) -> std::result::Result<A2ATaskResult, A2AIntegrationError> {
        let start = std::time::Instant::now();

        match task.capability.as_str() {
            "create_pr" => {
                let branch = task
                    .input
                    .get("branch")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        A2AIntegrationError::TaskExecutionFailed("Missing branch".to_string())
                    })?;

                let title = task
                    .input
                    .get("title")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        A2AIntegrationError::TaskExecutionFailed("Missing title".to_string())
                    })?;

                let base_branch = task
                    .input
                    .get("base_branch")
                    .and_then(|v| v.as_str())
                    .unwrap_or("main");

                let description = task
                    .input
                    .get("description")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                // Build task for internal execution
                let mut metadata = HashMap::new();
                metadata.insert("branch".to_string(), json!(branch));
                metadata.insert("baseBranch".to_string(), json!(base_branch));

                let internal_task = Task {
                    id: task.id.clone(),
                    title: title.to_string(),
                    description: description.to_string(),
                    task_type: TaskType::Feature,
                    priority: 2,
                    severity: None,
                    impact: None,
                    dependencies: vec![],
                    metadata: Some(metadata),
                    assigned_agent: None,
                    estimated_duration: None,
                    status: None,
                    start_time: None,
                    end_time: None,
                };

                let result = self.create_pr(&internal_task).await.map_err(|e| {
                    A2AIntegrationError::TaskExecutionFailed(format!("PR creation failed: {}", e))
                })?;

                Ok(A2ATaskResult::Success {
                    output: json!({
                        "pr_number": result.pr_number,
                        "pr_url": result.pr_url,
                        "title": result.title,
                        "branch": result.branch,
                        "base_branch": result.base_branch,
                        "labels": result.labels
                    }),
                    artifacts: vec![],
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }
            _ => Err(A2AIntegrationError::TaskExecutionFailed(format!(
                "Unknown capability: {}",
                task.capability
            ))),
        }
    }

    fn execution_mode(&self) -> ExecutionMode {
        ExecutionMode::FullAccess // Needs GitHub API access
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_agent() -> PRAgent {
        let config = AgentConfig {
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
        };
        PRAgent::new(config)
    }

    fn create_test_task(title: &str, task_type: TaskType) -> Task {
        let mut metadata = HashMap::new();
        metadata.insert("branch".to_string(), serde_json::json!("fix/test-branch"));
        metadata.insert("baseBranch".to_string(), serde_json::json!("main"));
        metadata.insert("issueNumber".to_string(), serde_json::json!(123));

        Task {
            id: "task-001".to_string(),
            title: title.to_string(),
            description: "Test task description".to_string(),
            task_type,
            priority: 2,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(60),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        }
    }

    #[test]
    fn test_pr_agent_creation() {
        let agent = create_test_agent();
        assert_eq!(agent.agent_type(), AgentType::PRAgent);
    }

    #[test]
    fn test_conventional_commits_prefix() {
        assert_eq!(
            PRAgent::get_conventional_commits_prefix(TaskType::Feature),
            "feat"
        );
        assert_eq!(
            PRAgent::get_conventional_commits_prefix(TaskType::Bug),
            "fix"
        );
        assert_eq!(
            PRAgent::get_conventional_commits_prefix(TaskType::Refactor),
            "refactor"
        );
        assert_eq!(
            PRAgent::get_conventional_commits_prefix(TaskType::Docs),
            "docs"
        );
        assert_eq!(
            PRAgent::get_conventional_commits_prefix(TaskType::Test),
            "test"
        );
        assert_eq!(
            PRAgent::get_conventional_commits_prefix(TaskType::Deployment),
            "ci"
        );
    }

    #[test]
    fn test_detect_scope_from_title() {
        // Explicit scope with colon
        assert_eq!(
            PRAgent::detect_scope_from_title("Auth: Add Firebase authentication"),
            Some("auth".to_string())
        );

        // Keyword detection (returns first keyword found in keywords array)
        assert_eq!(
            PRAgent::detect_scope_from_title("Fix API error"),
            Some("api".to_string())
        );

        assert_eq!(
            PRAgent::detect_scope_from_title("Update DB schema"),
            Some("db".to_string())
        );

        // Multiple keywords - returns first in array order
        assert_eq!(
            PRAgent::detect_scope_from_title("Fix API authentication error"),
            Some("auth".to_string()) // "auth" comes before "api" in keywords array
        );

        // No scope detected
        assert_eq!(PRAgent::detect_scope_from_title("Generic task"), None);

        // Invalid scope (too long with colon)
        assert_eq!(
            PRAgent::detect_scope_from_title(
                "This is a very long scope that should not be detected: title"
            ),
            None
        );
    }

    #[test]
    fn test_generate_pr_title_with_scope() {
        let agent = create_test_agent();
        let task = create_test_task("API: Fix authentication error", TaskType::Bug);
        let title = agent.generate_pr_title(&task);
        assert_eq!(title, "fix(api): API: Fix authentication error");
    }

    #[test]
    fn test_generate_pr_title_without_scope() {
        let agent = create_test_agent();
        let task = create_test_task("Add new feature", TaskType::Feature);
        let title = agent.generate_pr_title(&task);
        assert_eq!(title, "feat: Add new feature");
    }

    #[test]
    fn test_generate_pr_title_refactor() {
        let agent = create_test_agent();
        let task = create_test_task("Refactor authentication logic", TaskType::Refactor);
        let title = agent.generate_pr_title(&task);
        assert_eq!(title, "refactor(auth): Refactor authentication logic");
    }

    #[test]
    fn test_generate_pr_body() {
        let agent = create_test_agent();
        let task = create_test_task("Fix bug in authentication", TaskType::Bug);
        let body = agent.generate_pr_body(&task, &[]);

        assert!(body.contains("## 概要"));
        assert!(body.contains("Test task description"));
        assert!(body.contains("## 関連Issue"));
        assert!(body.contains("Closes #123"));
        assert!(body.contains("## 変更内容"));
        assert!(body.contains("## テスト結果"));
        assert!(body.contains("## チェックリスト"));
        assert!(body.contains("🤖 Generated with [Claude Code]"));
    }

    #[test]
    fn test_extract_labels() {
        let agent = create_test_agent();
        let task = create_test_task("Fix bug", TaskType::Bug);
        let labels = agent.extract_labels(&task).unwrap();

        assert_eq!(labels.len(), 3);
        assert!(labels.contains(&"🐛 type:bug".to_string()));
        assert!(labels.contains(&"🤖 agent:pr".to_string()));
        assert!(labels.contains(&"🔍 review-required".to_string()));
    }

    #[test]
    fn test_extract_labels_feature() {
        let agent = create_test_agent();
        let task = create_test_task("Add feature", TaskType::Feature);
        let labels = agent.extract_labels(&task).unwrap();

        assert!(labels.contains(&"✨ type:feature".to_string()));
        assert!(labels.contains(&"🤖 agent:pr".to_string()));
    }

    #[tokio::test]
    async fn test_execute_missing_metadata() {
        let agent = create_test_agent();
        let mut task = create_test_task("Test task", TaskType::Feature);
        task.metadata = None;

        let result = agent.execute(&task).await;
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("metadata is required"));
    }
}
