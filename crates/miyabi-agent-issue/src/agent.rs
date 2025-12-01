//! Issue Agent implementation

use crate::analysis::IssueAnalysis;
use async_trait::async_trait;
use miyabi_agent_core::{
    a2a_integration::{
        A2AAgentCard, A2AEnabled, A2AIntegrationError, A2ATask, A2ATaskResult, AgentCapability, AgentCardBuilder,
    },
    BaseAgent,
};
use miyabi_core::task_metadata::{TaskMetadata, TaskMetadataManager};
use miyabi_core::ExecutionMode;
use miyabi_types::agent::ResultStatus;
use miyabi_types::error::{AgentError, Result};
use miyabi_types::{AgentResult, AgentType, Issue, MiyabiError, Task};
use serde_json::json;
use std::path::PathBuf;
use tracing::{info, warn};

/// Issue Analysis Agent
///
/// Analyzes GitHub Issues to:
/// - Estimate complexity (0-10)
/// - Suggest appropriate labels
/// - Provide implementation guidance
pub struct IssueAgent {
    /// Agent configuration
    config: IssueAgentConfig,
}

/// Issue Agent configuration
#[derive(Debug, Clone, Default)]
pub struct IssueAgentConfig {
    /// Enable detailed logging
    pub verbose: bool,
    /// Project root directory for TaskMetadata persistence
    pub project_root: Option<PathBuf>,
}

impl IssueAgent {
    /// Create a new IssueAgent with default configuration
    pub fn new() -> Self {
        Self { config: IssueAgentConfig::default() }
    }

    /// Create a new IssueAgent with custom configuration
    pub fn with_config(config: IssueAgentConfig) -> Self {
        Self { config }
    }

    /// Analyze an Issue and return complexity/labels
    pub async fn analyze_issue(&self, issue: &Issue) -> Result<IssueAnalysis> {
        info!("🔍 Analyzing Issue #{}: {}", issue.number, issue.title);

        // Perform analysis
        let analysis = IssueAnalysis::analyze(issue);

        if self.config.verbose {
            info!("   Complexity: {:.1}/10.0", analysis.complexity);
            info!("   Level: {:?}", analysis.complexity_level);
            info!("   Estimated duration: {} hours", analysis.estimated_duration_hours);
            info!("   Suggested labels: {:?}", analysis.labels);
            info!("   Reasoning: {}", analysis.reasoning);
        }

        Ok(analysis)
    }

    /// Create TaskMetadata for an Issue
    ///
    /// This should be called when an Issue is assigned to a worktree for processing
    pub fn create_task_metadata(
        &self,
        task_id: &str,
        issue: &Issue,
        worktree_path: Option<PathBuf>,
        branch_name: Option<String>,
    ) -> Result<TaskMetadata> {
        let project_root = self.config.project_root.clone().ok_or_else(|| {
            MiyabiError::Agent(AgentError::new(
                "project_root not configured in IssueAgentConfig",
                AgentType::IssueAgent,
                Some(task_id.to_string()),
            ))
        })?;

        let mut metadata = TaskMetadata::new(
            task_id.to_string(),
            Some(issue.number),
            issue.title.clone(),
            project_root.clone(),
            "main".to_string(), // Default base branch
        );

        metadata.worktree_path = worktree_path;
        metadata.branch_name = branch_name;
        metadata.agent = Some("IssueAgent".to_string());

        // Save metadata to disk
        let manager = TaskMetadataManager::new(&project_root)
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create TaskMetadataManager: {}", e)))?;
        manager
            .save(&metadata)
            .map_err(|e| MiyabiError::Unknown(format!("Failed to save TaskMetadata: {}", e)))?;

        info!("📝 Created TaskMetadata for Issue #{}: {}", issue.number, task_id);

        Ok(metadata)
    }
}

impl Default for IssueAgent {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl BaseAgent for IssueAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::IssueAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        info!("IssueAgent executing task: {}", task.id);

        // Task should contain Issue in description or metadata
        // For Phase 1, we'll expect the Issue to be passed via metadata
        // This is a simplified version - in production, you'd fetch from GitHub API

        let issue_data = task.metadata.as_ref().and_then(|m| m.get("issue")).ok_or_else(|| {
            MiyabiError::Agent(AgentError::new(
                "No issue data found in task metadata",
                AgentType::IssueAgent,
                Some(task.id.clone()),
            ))
        })?;

        let issue: Issue = serde_json::from_value(issue_data.clone()).map_err(|e| {
            warn!("Failed to parse Issue from task metadata: {}", e);
            MiyabiError::Agent(AgentError::new(
                format!("Invalid Issue data in task metadata: {}", e),
                AgentType::IssueAgent,
                Some(task.id.clone()),
            ))
        })?;

        // Analyze the issue
        let analysis = self.analyze_issue(&issue).await?;

        // Create result with analysis data
        let result = AgentResult {
            status: ResultStatus::Success,
            data: serde_json::to_value(&analysis).ok(),
            error: None,
            metrics: None,
            escalation: None,
        };

        Ok(result)
    }
}

#[async_trait]
impl A2AEnabled for IssueAgent {
    fn agent_card(&self) -> A2AAgentCard {
        AgentCardBuilder::new("IssueAgent", "Issue analysis and task metadata creation agent")
            .version("0.1.1")
            .capability(AgentCapability {
                id: "analyze_issue".to_string(),
                name: "Analyze Issue".to_string(),
                description: "Analyze GitHub Issue for complexity, labels, and implementation guidance".to_string(),
                input_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "issue": {
                            "type": "object",
                            "description": "GitHub Issue object to analyze"
                        }
                    },
                    "required": ["issue"]
                })),
                output_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "issue_number": { "type": "integer" },
                        "complexity": { "type": "number" },
                        "complexity_level": { "type": "string" },
                        "estimated_duration_hours": { "type": "integer" },
                        "labels": { "type": "array", "items": { "type": "string" } },
                        "reasoning": { "type": "string" }
                    }
                })),
            })
            .capability(AgentCapability {
                id: "create_task_metadata".to_string(),
                name: "Create Task Metadata".to_string(),
                description: "Create TaskMetadata for Issue assignment to worktree".to_string(),
                input_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "task_id": { "type": "string" },
                        "issue": { "type": "object" },
                        "worktree_path": { "type": "string" },
                        "branch_name": { "type": "string" }
                    },
                    "required": ["task_id", "issue"]
                })),
                output_schema: Some(json!({
                    "type": "object",
                    "properties": {
                        "task_id": { "type": "string" },
                        "issue_number": { "type": "integer" },
                        "worktree_path": { "type": "string" },
                        "branch_name": { "type": "string" }
                    }
                })),
            })
            .build()
    }

    async fn handle_a2a_task(&self, task: A2ATask) -> std::result::Result<A2ATaskResult, A2AIntegrationError> {
        let start = std::time::Instant::now();

        match task.capability.as_str() {
            "analyze_issue" => {
                let issue: Issue = serde_json::from_value(task.input.get("issue").cloned().unwrap_or_default())
                    .map_err(|e| A2AIntegrationError::TaskExecutionFailed(format!("Invalid issue: {}", e)))?;

                let analysis = self
                    .analyze_issue(&issue)
                    .await
                    .map_err(|e| A2AIntegrationError::TaskExecutionFailed(format!("Analysis failed: {}", e)))?;

                Ok(A2ATaskResult::Success {
                    output: serde_json::to_value(&analysis).unwrap_or_default(),
                    artifacts: vec![],
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }
            "create_task_metadata" => {
                let task_id_str = task
                    .input
                    .get("task_id")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| A2AIntegrationError::TaskExecutionFailed("Missing task_id".to_string()))?;

                let issue: Issue = serde_json::from_value(task.input.get("issue").cloned().unwrap_or_default())
                    .map_err(|e| A2AIntegrationError::TaskExecutionFailed(format!("Invalid issue: {}", e)))?;

                let worktree_path = task
                    .input
                    .get("worktree_path")
                    .and_then(|v| v.as_str())
                    .map(PathBuf::from);

                let branch_name = task.input.get("branch_name").and_then(|v| v.as_str()).map(String::from);

                let metadata = self
                    .create_task_metadata(task_id_str, &issue, worktree_path, branch_name)
                    .map_err(|e| {
                        A2AIntegrationError::TaskExecutionFailed(format!("Metadata creation failed: {}", e))
                    })?;

                Ok(A2ATaskResult::Success {
                    output: json!({
                        "task_id": metadata.id,
                        "issue_number": metadata.issue_number,
                        "worktree_path": metadata.worktree_path,
                        "branch_name": metadata.branch_name
                    }),
                    artifacts: vec![],
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }
            _ => Err(A2AIntegrationError::TaskExecutionFailed(format!("Unknown capability: {}", task.capability))),
        }
    }

    fn execution_mode(&self) -> ExecutionMode {
        ExecutionMode::FileEdits // Needs file access for TaskMetadata persistence
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::issue::IssueStateGithub;

    fn create_test_issue(number: u64, title: &str, body: &str) -> Issue {
        Issue {
            number,
            title: title.to_string(),
            body: body.to_string(),
            state: IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: format!("https://github.com/test/repo/issues/{}", number),
        }
    }

    fn create_test_task(issue: &Issue) -> Task {
        use miyabi_types::task::TaskType;
        use std::collections::HashMap;

        let mut metadata = HashMap::new();
        metadata.insert("issue".to_string(), serde_json::to_value(issue).unwrap());

        Task {
            id: uuid::Uuid::new_v4().to_string(),
            title: format!("Analyze Issue #{}", issue.number),
            description: issue.title.clone(),
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
        }
    }

    #[tokio::test]
    async fn test_analyze_simple_issue() {
        let agent = IssueAgent::new();
        let issue = create_test_issue(123, "Add button", "Simple UI change");

        let analysis = agent.analyze_issue(&issue).await.unwrap();

        assert_eq!(analysis.issue_number, 123);
        assert!(analysis.complexity < 5.0);
        assert!(!analysis.labels.is_empty());
    }

    #[tokio::test]
    async fn test_analyze_complex_issue() {
        let agent = IssueAgent::new();
        let issue = create_test_issue(
            123,
            "Database migration",
            "Add new database table with migration scripts. This requires careful planning.",
        );

        let analysis = agent.analyze_issue(&issue).await.unwrap();

        assert!(analysis.complexity >= 5.0);
    }

    #[tokio::test]
    async fn test_execute_task() {
        let agent = IssueAgent::new();
        let issue = create_test_issue(123, "Test issue", "Test body");
        let task = create_test_task(&issue);

        let result = agent.execute(&task).await.unwrap();

        assert_eq!(result.status, ResultStatus::Success);
        assert!(result.data.is_some());
    }

    #[tokio::test]
    async fn test_agent_type() {
        let agent = IssueAgent::new();
        assert_eq!(agent.agent_type(), AgentType::IssueAgent);
    }
}
