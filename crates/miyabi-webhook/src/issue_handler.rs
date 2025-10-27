//! GitHub Issue Webhook Handler
//!
//! Handles GitHub `issues.opened` webhook events and triggers Phase 1 of the
//! autonomous workflow (Issue Analysis).

use anyhow::Result;
use miyabi_orchestrator::{ExecutionResult, HeadlessOrchestrator, HeadlessOrchestratorConfig};
use miyabi_types::Issue;
use serde::{Deserialize, Serialize};
use tracing::{error, info, warn};

/// GitHub Webhook Event for Issues
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueWebhookEvent {
    /// Action performed on the issue
    pub action: String,

    /// The issue that triggered the event
    pub issue: GitHubIssue,

    /// Repository information
    pub repository: Repository,

    /// Sender information
    pub sender: User,
}

/// GitHub Issue (simplified from GitHub API)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubIssue {
    pub number: u64,
    pub title: String,
    pub body: Option<String>,
    pub state: String,
    pub labels: Vec<Label>,
    pub assignee: Option<User>,
    pub created_at: String,
    pub updated_at: String,
    pub html_url: String,
}

/// GitHub Label
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Label {
    pub name: String,
}

/// GitHub User
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub login: String,
}

/// GitHub Repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Repository {
    pub full_name: String,
    pub html_url: String,
}

impl IssueWebhookEvent {
    /// Convert GitHub Issue to Miyabi Issue type
    pub fn to_miyabi_issue(&self) -> Result<Issue> {
        use chrono::DateTime;
        use miyabi_types::issue::IssueStateGithub;

        let state = match self.issue.state.as_str() {
            "open" => IssueStateGithub::Open,
            "closed" => IssueStateGithub::Closed,
            _ => IssueStateGithub::Open,
        };

        let labels = self
            .issue
            .labels
            .iter()
            .map(|l| l.name.clone())
            .collect();

        let assignee = self.issue.assignee.as_ref().map(|u| u.login.clone());

        let created_at = DateTime::parse_from_rfc3339(&self.issue.created_at)?
            .with_timezone(&chrono::Utc);

        let updated_at = DateTime::parse_from_rfc3339(&self.issue.updated_at)?
            .with_timezone(&chrono::Utc);

        Ok(Issue {
            number: self.issue.number,
            title: self.issue.title.clone(),
            body: self.issue.body.clone().unwrap_or_default(),
            state,
            labels,
            assignee,
            created_at,
            updated_at,
            url: self.issue.html_url.clone(),
        })
    }
}

/// Handle GitHub `issues.opened` webhook event
///
/// This is the entry point for the autonomous workflow Phase 1.
/// Called when a new Issue is created on GitHub.
///
/// # Arguments
///
/// * `event` - GitHub webhook event payload
/// * `config` - HeadlessOrchestrator configuration
///
/// # Returns
///
/// * `ExecutionResult` - Phase 1 execution result
pub async fn handle_issue_opened(
    event: IssueWebhookEvent,
    config: HeadlessOrchestratorConfig,
) -> Result<ExecutionResult> {
    info!(
        "📥 Received Issue webhook: action={}, issue=#{}",
        event.action, event.issue.number
    );

    // Filter: Only handle "opened" action
    if event.action != "opened" {
        warn!("Ignoring non-opened action: {}", event.action);
        return Err(anyhow::anyhow!("Action '{}' is not 'opened'", event.action));
    }

    // Convert to Miyabi Issue type
    let issue = event.to_miyabi_issue()?;

    info!(
        "🚀 Starting Phase 1 for Issue #{}: {}",
        issue.number, issue.title
    );

    // Create Headless Orchestrator
    let mut orchestrator = HeadlessOrchestrator::new(config);

    // Execute Phase 1: Issue Analysis
    let result = orchestrator.handle_issue_created(&issue).await?;

    if result.success {
        info!(
            "✅ Phase 1 completed successfully for Issue #{} (execution_id: {})",
            result.issue_number, result.execution_id
        );
    } else {
        error!(
            "❌ Phase 1 failed for Issue #{}: {:?}",
            result.issue_number, result.error
        );
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_webhook_event() -> IssueWebhookEvent {
        IssueWebhookEvent {
            action: "opened".to_string(),
            issue: GitHubIssue {
                number: 123,
                title: "Test Issue".to_string(),
                body: Some("Test body".to_string()),
                state: "open".to_string(),
                labels: vec![],
                assignee: None,
                created_at: "2025-10-27T10:00:00Z".to_string(),
                updated_at: "2025-10-27T10:00:00Z".to_string(),
                html_url: "https://github.com/test/repo/issues/123".to_string(),
            },
            repository: Repository {
                full_name: "test/repo".to_string(),
                html_url: "https://github.com/test/repo".to_string(),
            },
            sender: User {
                login: "testuser".to_string(),
            },
        }
    }

    #[test]
    fn test_to_miyabi_issue() {
        let event = create_test_webhook_event();
        let issue = event.to_miyabi_issue().unwrap();

        assert_eq!(issue.number, 123);
        assert_eq!(issue.title, "Test Issue");
        assert_eq!(issue.body, "Test body");
    }

    #[tokio::test]
    async fn test_handle_issue_opened_dry_run() {
        let event = create_test_webhook_event();

        let config = HeadlessOrchestratorConfig {
            autonomous_mode: true,
            auto_approve_complexity: 5.0,
            auto_merge_quality: 80.0,
            dry_run: true, // Dry-run mode
        };

        let result = handle_issue_opened(event, config).await;

        // In dry-run mode, it should complete successfully
        assert!(result.is_ok());
    }

    #[test]
    fn test_filter_non_opened_action() {
        let mut event = create_test_webhook_event();
        event.action = "closed".to_string();

        let config = HeadlessOrchestratorConfig::default();

        let runtime = tokio::runtime::Runtime::new().unwrap();
        let result = runtime.block_on(handle_issue_opened(event, config));

        // Should return error for non-opened actions
        assert!(result.is_err());
    }
}
