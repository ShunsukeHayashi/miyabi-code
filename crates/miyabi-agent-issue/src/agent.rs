//! Issue Agent implementation

use crate::analysis::IssueAnalysis;
use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_types::agent::ResultStatus;
use miyabi_types::error::{AgentError, Result};
use miyabi_types::{AgentResult, AgentType, Issue, MiyabiError, Task};
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
}

impl IssueAgent {
    /// Create a new IssueAgent with default configuration
    pub fn new() -> Self {
        Self {
            config: IssueAgentConfig::default(),
        }
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

        let issue_data = task.metadata.as_ref()
            .and_then(|m| m.get("issue"))
            .ok_or_else(|| {
                MiyabiError::Agent(AgentError::new(
                    "No issue data found in task metadata",
                    AgentType::IssueAgent,
                    Some(task.id.clone()),
                ))
            })?;

        let issue: Issue = serde_json::from_value(issue_data.clone())
            .map_err(|e| {
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
        use std::collections::HashMap;
        use miyabi_types::task::TaskType;

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
