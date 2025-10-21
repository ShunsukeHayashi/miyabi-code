//! RefresherAgent - Issue status monitoring and auto-update agent
//!
//! Responsible for monitoring GitHub Issues, checking implementation status,
//! and automatically updating state labels to match reality.

use async_trait::async_trait;
use miyabi_agent_core::BaseAgent;
use miyabi_github::GitHubClient;
use miyabi_types::agent::{
    AgentMetrics, AgentType, EscalationInfo, EscalationTarget, ResultStatus, Severity,
};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, Issue, Task};
use octocrab::params::State;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;

/// Issue state (from state: labels)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IssueState {
    Pending,
    Analyzing,
    Implementing,
    Reviewing,
    Done,
    Paused,
    Blocked,
    Failed,
}

impl IssueState {
    /// Convert to label string
    pub fn to_label(&self) -> &'static str {
        match self {
            IssueState::Pending => "📥 state:pending",
            IssueState::Analyzing => "🔍 state:analyzing",
            IssueState::Implementing => "🏗️ state:implementing",
            IssueState::Reviewing => "👀 state:reviewing",
            IssueState::Done => "✅ state:done",
            IssueState::Paused => "⏸️ state:paused",
            IssueState::Blocked => "🔴 state:blocked",
            IssueState::Failed => "🛑 state:failed",
        }
    }

    /// Parse from label string
    pub fn from_label(label: &str) -> Option<Self> {
        let lower = label.to_lowercase();
        if lower.contains("state:pending") {
            Some(IssueState::Pending)
        } else if lower.contains("state:analyzing") {
            Some(IssueState::Analyzing)
        } else if lower.contains("state:implementing") {
            Some(IssueState::Implementing)
        } else if lower.contains("state:reviewing") {
            Some(IssueState::Reviewing)
        } else if lower.contains("state:done") {
            Some(IssueState::Done)
        } else if lower.contains("state:paused") {
            Some(IssueState::Paused)
        } else if lower.contains("state:blocked") {
            Some(IssueState::Blocked)
        } else if lower.contains("state:failed") {
            Some(IssueState::Failed)
        } else {
            None
        }
    }
}

/// Implementation status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImplementationStatus {
    pub phase: Option<String>,
    pub build_success: bool,
    pub tests_passing: bool,
    pub tests_passed: u32,
    pub tests_failed: u32,
    pub has_pr: bool,
    pub pr_merged: bool,
}

/// Issue update record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueUpdate {
    pub issue_number: u64,
    pub from_state: IssueState,
    pub to_state: IssueState,
    pub reason: String,
}

/// Status summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StatusSummary {
    pub total_issues: usize,
    pub done: usize,
    pub reviewing: usize,
    pub implementing: usize,
    pub paused: usize,
    pub pending: usize,
    pub blocked: usize,
    pub failed: usize,
}

/// RefresherAgent - Issue status monitoring agent
pub struct RefresherAgent {
    config: AgentConfig,
}

impl RefresherAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Fetch all open issues from GitHub
    async fn fetch_all_issues(&self) -> Result<Vec<Issue>> {
        tracing::info!("Fetching all open issues from GitHub");

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

        let client = GitHubClient::new(repo_owner, repo_name, &github_token)?;

        // Fetch all open issues
        let issues = client.list_issues(Some(State::Open), vec![]).await?;

        tracing::info!("Found {} open issues", issues.len());

        Ok(issues)
    }

    /// Check implementation status for a phase/component
    async fn check_implementation_status(&self, phase: &str) -> Result<ImplementationStatus> {
        tracing::info!("Checking implementation status for {}", phase);

        let project_path = std::env::current_dir()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to get current directory: {}", e)))?;

        let (package_name, build_success, tests_passing, tests_passed, tests_failed) = match phase {
            "Phase 3" | "phase3" => self.check_phase3_status(&project_path).await?,
            "Phase 4" | "phase4" => self.check_phase4_status(&project_path).await?,
            "Phase 5" | "phase5" => self.check_phase5_status(&project_path).await?,
            _ => {
                // Unknown phase, return placeholder
                ("unknown".to_string(), false, false, 0, 0)
            }
        };

        tracing::info!(
            "{}: build={}, tests={}/{} passed",
            package_name,
            build_success,
            tests_passed,
            tests_passed + tests_failed
        );

        Ok(ImplementationStatus {
            phase: Some(phase.to_string()),
            build_success,
            tests_passing,
            tests_passed,
            tests_failed,
            has_pr: false,    // Placeholder: would check GitHub API
            pr_merged: false, // Placeholder: would check GitHub API
        })
    }

    /// Check Phase 3 (miyabi-types) status
    async fn check_phase3_status(
        &self,
        project_path: &Path,
    ) -> Result<(String, bool, bool, u32, u32)> {
        let output = tokio::process::Command::new("cargo")
            .arg("test")
            .arg("--package")
            .arg("miyabi-types")
            .current_dir(project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to run cargo test: {}", e)))?;

        let success = output.status.success();
        let stdout = String::from_utf8_lossy(&output.stdout);

        let (passed, failed) = Self::parse_test_counts(&stdout);

        Ok(("miyabi-types".to_string(), success, success, passed, failed))
    }

    /// Check Phase 4 (miyabi-cli) status
    async fn check_phase4_status(
        &self,
        project_path: &Path,
    ) -> Result<(String, bool, bool, u32, u32)> {
        let output = tokio::process::Command::new("cargo")
            .arg("build")
            .arg("--bin")
            .arg("miyabi")
            .current_dir(project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to run cargo build: {}", e)))?;

        let build_success = output.status.success();

        // Run tests if build succeeded
        let (tests_passed, tests_failed) = if build_success {
            let test_output = tokio::process::Command::new("cargo")
                .arg("test")
                .arg("--package")
                .arg("miyabi-cli")
                .current_dir(project_path)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .await
                .map_err(|e| MiyabiError::Unknown(format!("Failed to run cargo test: {}", e)))?;

            let stdout = String::from_utf8_lossy(&test_output.stdout);
            Self::parse_test_counts(&stdout)
        } else {
            (0, 0)
        };

        let tests_passing = tests_failed == 0 && tests_passed > 0;

        Ok((
            "miyabi-cli".to_string(),
            build_success,
            tests_passing,
            tests_passed,
            tests_failed,
        ))
    }

    /// Check Phase 5 (miyabi-agents) status
    async fn check_phase5_status(
        &self,
        project_path: &Path,
    ) -> Result<(String, bool, bool, u32, u32)> {
        let output = tokio::process::Command::new("cargo")
            .arg("test")
            .arg("--package")
            .arg("miyabi-agents")
            .current_dir(project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to run cargo test: {}", e)))?;

        let success = output.status.success();
        let stdout = String::from_utf8_lossy(&output.stdout);

        let (passed, failed) = Self::parse_test_counts(&stdout);

        Ok((
            "miyabi-agents".to_string(),
            success,
            success,
            passed,
            failed,
        ))
    }

    /// Parse test counts from cargo test output
    fn parse_test_counts(output: &str) -> (u32, u32) {
        let mut passed = 0;
        let mut failed = 0;

        // Parse "test result: ok. X passed; Y failed"
        if let Some(line) = output.lines().find(|l| l.contains("test result:")) {
            if let Some(passed_str) = line
                .split("passed")
                .next()
                .and_then(|s| s.split_whitespace().last())
            {
                passed = passed_str.parse().unwrap_or(0);
            }
            if let Some(failed_str) = line
                .split("failed")
                .next()
                .and_then(|s| s.split_whitespace().last())
            {
                failed = failed_str.parse().unwrap_or(0);
            }
        }

        (passed, failed)
    }

    /// Determine the correct state based on implementation status
    fn determine_correct_state(&self, status: &ImplementationStatus) -> IssueState {
        if status.pr_merged {
            IssueState::Done
        } else if status.has_pr {
            IssueState::Reviewing
        } else if status.build_success && status.tests_passing {
            IssueState::Done
        } else if !status.build_success || status.tests_passed > 0 {
            // Implementing if: build failed OR (build succeeded but tests exist)
            IssueState::Implementing
        } else {
            IssueState::Pending
        }
    }

    /// Extract current state from issue labels
    fn extract_current_state(&self, issue: &Issue) -> Option<IssueState> {
        for label in &issue.labels {
            if let Some(state) = IssueState::from_label(label) {
                return Some(state);
            }
        }
        None
    }

    /// Generate status summary from issues
    fn generate_summary(&self, issues: &[Issue]) -> StatusSummary {
        let mut summary = StatusSummary {
            total_issues: issues.len(),
            done: 0,
            reviewing: 0,
            implementing: 0,
            paused: 0,
            pending: 0,
            blocked: 0,
            failed: 0,
        };

        for issue in issues {
            if let Some(state) = self.extract_current_state(issue) {
                match state {
                    IssueState::Done => summary.done += 1,
                    IssueState::Reviewing => summary.reviewing += 1,
                    IssueState::Implementing => summary.implementing += 1,
                    IssueState::Paused => summary.paused += 1,
                    IssueState::Pending => summary.pending += 1,
                    IssueState::Blocked => summary.blocked += 1,
                    IssueState::Failed => summary.failed += 1,
                    _ => {}
                }
            }
        }

        summary
    }

    /// Update issue label (placeholder - would use GitHub API)
    async fn update_issue_label(
        &self,
        _issue_number: u64,
        _from_state: IssueState,
        _to_state: IssueState,
    ) -> Result<()> {
        // Placeholder: In production, would use GitHubClient to:
        // 1. Remove old state label
        // 2. Add new state label
        // 3. Add comment explaining the update
        tracing::info!(
            "Label update placeholder: Issue #{} - {:?} → {:?}",
            _issue_number,
            _from_state,
            _to_state
        );
        Ok(())
    }
}

#[async_trait]
impl BaseAgent for RefresherAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::RefresherAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        // Phase 1: Fetch all issues
        let issues = self.fetch_all_issues().await?;

        // Phase 2: Check implementation status (for now, just Phase 3-5)
        let phase3_status = self.check_implementation_status("Phase 3").await?;
        let phase4_status = self.check_implementation_status("Phase 4").await?;
        let phase5_status = self.check_implementation_status("Phase 5").await?;

        // Phase 3: Determine correct states and detect inconsistencies
        let mut updates = Vec::new();

        for issue in &issues {
            if let Some(current_state) = self.extract_current_state(issue) {
                // Determine which phase this issue belongs to (placeholder logic)
                let phase = if issue.title.contains("Phase 3") {
                    Some(&phase3_status)
                } else if issue.title.contains("Phase 4") {
                    Some(&phase4_status)
                } else if issue.title.contains("Phase 5") {
                    Some(&phase5_status)
                } else {
                    None
                };

                if let Some(status) = phase {
                    let correct_state = self.determine_correct_state(status);

                    if current_state != correct_state {
                        let update = IssueUpdate {
                            issue_number: issue.number,
                            from_state: current_state,
                            to_state: correct_state,
                            reason: format!(
                                "Implementation status: build={}, tests={}/{}",
                                status.build_success,
                                status.tests_passed,
                                status.tests_passed + status.tests_failed
                            ),
                        };

                        // Update label (placeholder)
                        self.update_issue_label(issue.number, current_state, correct_state)
                            .await?;

                        updates.push(update);
                    }
                }
            }
        }

        // Phase 4: Generate summary
        let summary = self.generate_summary(&issues);

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Check for escalation
        let escalation = if updates.len() > 100 {
            let mut context = HashMap::new();
            context.insert(
                "updates_count".to_string(),
                serde_json::json!(updates.len()),
            );

            Some(EscalationInfo {
                reason: format!("Large number of label updates detected: {}", updates.len()),
                target: EscalationTarget::TechLead,
                severity: Severity::High,
                context,
                timestamp: end_time,
            })
        } else {
            None
        };

        // Construct result data
        let mut data = HashMap::new();
        data.insert("summary".to_string(), serde_json::to_value(&summary)?);
        data.insert("updates".to_string(), serde_json::to_value(&updates)?);
        data.insert(
            "phase3_status".to_string(),
            serde_json::to_value(&phase3_status)?,
        );
        data.insert(
            "phase4_status".to_string(),
            serde_json::to_value(&phase4_status)?,
        );
        data.insert(
            "phase5_status".to_string(),
            serde_json::to_value(&phase5_status)?,
        );

        // Create metrics
        let metrics = AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::RefresherAgent,
            duration_ms,
            quality_score: None,
            lines_changed: None,
            tests_added: None,
            coverage_percent: None,
            errors_found: Some(updates.len() as u32),
            timestamp: end_time,
        };

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::to_value(data)?),
            error: None,
            metrics: Some(metrics),
            escalation,
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

    #[tokio::test]
    async fn test_refresher_agent_creation() {
        let config = create_test_config();
        let agent = RefresherAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::RefresherAgent);
    }

    #[test]
    fn test_issue_state_to_label() {
        assert_eq!(IssueState::Pending.to_label(), "📥 state:pending");
        assert_eq!(IssueState::Analyzing.to_label(), "🔍 state:analyzing");
        assert_eq!(IssueState::Implementing.to_label(), "🏗️ state:implementing");
        assert_eq!(IssueState::Reviewing.to_label(), "👀 state:reviewing");
        assert_eq!(IssueState::Done.to_label(), "✅ state:done");
    }

    #[test]
    fn test_issue_state_from_label() {
        assert_eq!(
            IssueState::from_label("📥 state:pending"),
            Some(IssueState::Pending)
        );
        assert_eq!(
            IssueState::from_label("🔍 state:analyzing"),
            Some(IssueState::Analyzing)
        );
        assert_eq!(
            IssueState::from_label("🏗️ state:implementing"),
            Some(IssueState::Implementing)
        );
        assert_eq!(
            IssueState::from_label("👀 state:reviewing"),
            Some(IssueState::Reviewing)
        );
        assert_eq!(
            IssueState::from_label("✅ state:done"),
            Some(IssueState::Done)
        );
        assert_eq!(IssueState::from_label("unknown"), None);
    }

    #[test]
    fn test_issue_state_serialization() {
        let state = IssueState::Implementing;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"implementing\"");

        let state = IssueState::Done;
        let json = serde_json::to_string(&state).unwrap();
        assert_eq!(json, "\"done\"");
    }

    #[test]
    fn test_parse_test_counts() {
        let output = "test result: ok. 170 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out";
        let (passed, failed) = RefresherAgent::parse_test_counts(output);
        assert_eq!(passed, 170);
        assert_eq!(failed, 0);
    }

    #[test]
    fn test_parse_test_counts_with_failures() {
        let output =
            "test result: FAILED. 150 passed; 20 failed; 0 ignored; 0 measured; 0 filtered out";
        let (passed, failed) = RefresherAgent::parse_test_counts(output);
        assert_eq!(passed, 150);
        assert_eq!(failed, 20);
    }

    #[test]
    fn test_determine_correct_state_done() {
        let config = create_test_config();
        let agent = RefresherAgent::new(config);

        let status = ImplementationStatus {
            phase: Some("Phase 3".to_string()),
            build_success: true,
            tests_passing: true,
            tests_passed: 170,
            tests_failed: 0,
            has_pr: false,
            pr_merged: false,
        };

        let state = agent.determine_correct_state(&status);
        assert_eq!(state, IssueState::Done);
    }

    #[test]
    fn test_determine_correct_state_implementing() {
        let config = create_test_config();
        let agent = RefresherAgent::new(config);

        let status = ImplementationStatus {
            phase: Some("Phase 4".to_string()),
            build_success: true,
            tests_passing: false,
            tests_passed: 10,
            tests_failed: 5,
            has_pr: false,
            pr_merged: false,
        };

        let state = agent.determine_correct_state(&status);
        assert_eq!(state, IssueState::Implementing);
    }

    #[test]
    fn test_status_summary_serialization() {
        let summary = StatusSummary {
            total_issues: 137,
            done: 2,
            reviewing: 3,
            implementing: 3,
            paused: 27,
            pending: 17,
            blocked: 0,
            failed: 0,
        };

        let json = serde_json::to_value(&summary).unwrap();
        assert_eq!(json["total_issues"], 137);
        assert_eq!(json["done"], 2);
        assert_eq!(json["implementing"], 3);

        let deserialized: StatusSummary = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.total_issues, 137);
    }

    #[test]
    fn test_issue_update_serialization() {
        let update = IssueUpdate {
            issue_number: 117,
            from_state: IssueState::Pending,
            to_state: IssueState::Done,
            reason: "Phase 3 tests 100% passed".to_string(),
        };

        let json = serde_json::to_value(&update).unwrap();
        assert_eq!(json["issue_number"], 117);
        assert_eq!(json["from_state"], "pending");
        assert_eq!(json["to_state"], "done");

        let deserialized: IssueUpdate = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.issue_number, 117);
    }
}
