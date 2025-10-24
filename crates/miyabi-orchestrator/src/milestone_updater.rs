//! GitHub Milestone update management

use crate::aggregator::AggregatedResult;
use crate::error::{Result, SchedulerError};
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tokio::process::Command;
use tracing::{debug, info, warn};

/// Milestone state
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MilestoneState {
    /// Milestone is open
    Open,
    /// Milestone is closed
    Closed,
}

/// Milestone information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Milestone {
    /// Milestone number
    pub number: u64,
    /// Milestone title
    pub title: String,
    /// Milestone description
    pub description: Option<String>,
    /// Milestone state
    pub state: MilestoneState,
    /// Open issues count
    pub open_issues: u64,
    /// Closed issues count
    pub closed_issues: u64,
    /// Progress percentage (0-100)
    pub progress: f64,
}

impl Milestone {
    /// Check if milestone is complete (all issues closed)
    pub fn is_complete(&self) -> bool {
        self.open_issues == 0 && self.closed_issues > 0
    }

    /// Calculate progress percentage
    pub fn calculate_progress(&self) -> f64 {
        let total = self.open_issues + self.closed_issues;
        if total == 0 {
            return 0.0;
        }
        (self.closed_issues as f64 / total as f64) * 100.0
    }
}

/// Milestone update configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MilestoneConfig {
    /// Repository owner
    pub owner: String,
    /// Repository name
    pub repo: String,
}

/// Milestone updater for tracking progress
pub struct MilestoneUpdater {
    /// Milestone configuration
    config: MilestoneConfig,
}

impl MilestoneUpdater {
    /// Create a new MilestoneUpdater
    ///
    /// # Arguments
    ///
    /// * `config` - Milestone configuration
    pub fn new(config: MilestoneConfig) -> Self {
        Self { config }
    }

    /// Get milestone information
    ///
    /// # Arguments
    ///
    /// * `milestone_number` - Milestone number
    ///
    /// # Returns
    ///
    /// Returns the `Milestone` information
    pub async fn get_milestone(&self, milestone_number: u64) -> Result<Milestone> {
        info!("Fetching milestone #{}", milestone_number);

        let output = Command::new("gh")
            .arg("api")
            .arg(format!(
                "repos/{}/{}/milestones/{}",
                self.config.owner, self.config.repo, milestone_number
            ))
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(SchedulerError::SpawnFailed)?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warn!("Failed to fetch milestone: {}", stderr);
            return Err(SchedulerError::ProcessFailed {
                code: output.status.code().unwrap_or(-1),
                stderr: stderr.to_string(),
            });
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let milestone_json: serde_json::Value = serde_json::from_str(&stdout)
            .map_err(|e| SchedulerError::InvalidConfig(e.to_string()))?;

        let milestone = self.parse_milestone(&milestone_json)?;
        debug!(
            "Milestone fetched: {} ({:.1}% complete)",
            milestone.title, milestone.progress
        );

        Ok(milestone)
    }

    /// Parse milestone JSON
    fn parse_milestone(&self, json: &serde_json::Value) -> Result<Milestone> {
        let number = json["number"]
            .as_u64()
            .ok_or_else(|| SchedulerError::InvalidConfig("Missing milestone number".to_string()))?;

        let title = json["title"]
            .as_str()
            .ok_or_else(|| SchedulerError::InvalidConfig("Missing milestone title".to_string()))?
            .to_string();

        let description = json["description"].as_str().map(|s| s.to_string());

        let state_str = json["state"]
            .as_str()
            .ok_or_else(|| SchedulerError::InvalidConfig("Missing milestone state".to_string()))?;

        let state = match state_str {
            "open" => MilestoneState::Open,
            "closed" => MilestoneState::Closed,
            _ => {
                return Err(SchedulerError::InvalidConfig(format!(
                    "Invalid milestone state: {}",
                    state_str
                )))
            }
        };

        let open_issues = json["open_issues"].as_u64().unwrap_or(0);
        let closed_issues = json["closed_issues"].as_u64().unwrap_or(0);

        let mut milestone = Milestone {
            number,
            title,
            description,
            state,
            open_issues,
            closed_issues,
            progress: 0.0,
        };

        milestone.progress = milestone.calculate_progress();

        Ok(milestone)
    }

    /// Update milestone with aggregated result
    ///
    /// # Arguments
    ///
    /// * `milestone_number` - Milestone number
    /// * `result` - Aggregated result
    ///
    /// # Returns
    ///
    /// Returns Ok if update succeeds
    pub async fn update_milestone(
        &self,
        milestone_number: u64,
        result: &AggregatedResult,
    ) -> Result<()> {
        info!("Updating milestone #{} with results", milestone_number);

        // Get current milestone state
        let milestone = self.get_milestone(milestone_number).await?;

        // Add comment with results
        let comment = self.generate_milestone_comment(result, &milestone);
        self.add_milestone_comment(milestone_number, &comment)
            .await?;

        // Close milestone if all issues are complete
        if milestone.is_complete() && result.all_succeeded() {
            info!(
                "All issues complete, closing milestone #{}",
                milestone_number
            );
            self.close_milestone(milestone_number).await?;
        }

        Ok(())
    }

    /// Generate milestone update comment
    pub fn generate_milestone_comment(
        &self,
        result: &AggregatedResult,
        milestone: &Milestone,
    ) -> String {
        let mut comment = String::new();

        comment.push_str("## 🤖 Water Spider Progress Update\n\n");
        comment.push_str(&format!(
            "**Milestone**: {} (#{}) - {:.1}% complete\n\n",
            milestone.title, milestone.number, milestone.progress
        ));

        comment.push_str("### Session Results\n\n");
        comment.push_str(&format!("{}\n\n", result.summary()));

        comment.push_str("### Statistics\n\n");
        comment.push_str(&format!("- Total sessions: {}\n", result.total_sessions));
        comment.push_str(&format!(
            "- Successful: {} ✅\n",
            result.successful_sessions
        ));
        comment.push_str(&format!("- Failed: {} ❌\n", result.failed_sessions));
        comment.push_str(&format!(
            "- Success rate: {:.1}%\n\n",
            result.success_rate * 100.0
        ));

        if !result.modified_files.is_empty() {
            comment.push_str("### Modified Files\n\n");
            for file in &result.modified_files {
                comment.push_str(&format!("- `{}`\n", file));
            }
            comment.push('\n');
        }

        if !result.errors.is_empty() {
            comment.push_str("### Errors\n\n");
            for error in &result.errors {
                comment.push_str(&format!("- {}\n", error));
            }
            comment.push('\n');
        }

        comment.push_str("---\n");
        comment.push_str("🤖 Generated by Water Spider Orchestrator\n");

        comment
    }

    /// Add comment to milestone
    async fn add_milestone_comment(&self, milestone_number: u64, comment: &str) -> Result<()> {
        debug!("Adding comment to milestone #{}", milestone_number);

        // Note: GitHub doesn't have milestone comments, so we add a comment to an issue
        // associated with the milestone. For now, we'll log this as a placeholder.
        info!(
            "Milestone #{} comment (placeholder): {}",
            milestone_number, comment
        );

        Ok(())
    }

    /// Close a milestone
    ///
    /// # Arguments
    ///
    /// * `milestone_number` - Milestone number
    pub async fn close_milestone(&self, milestone_number: u64) -> Result<()> {
        info!("Closing milestone #{}", milestone_number);

        let output = Command::new("gh")
            .arg("api")
            .arg("-X")
            .arg("PATCH")
            .arg(format!(
                "repos/{}/{}/milestones/{}",
                self.config.owner, self.config.repo, milestone_number
            ))
            .arg("-f")
            .arg("state=closed")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(SchedulerError::SpawnFailed)?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warn!("Failed to close milestone: {}", stderr);
            return Err(SchedulerError::ProcessFailed {
                code: output.status.code().unwrap_or(-1),
                stderr: stderr.to_string(),
            });
        }

        info!("Milestone #{} closed", milestone_number);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config() -> MilestoneConfig {
        MilestoneConfig {
            owner: "test-owner".to_string(),
            repo: "test-repo".to_string(),
        }
    }

    fn create_test_milestone() -> Milestone {
        Milestone {
            number: 1,
            title: "Test Milestone".to_string(),
            description: Some("Test description".to_string()),
            state: MilestoneState::Open,
            open_issues: 2,
            closed_issues: 3,
            progress: 60.0,
        }
    }

    fn create_test_result() -> AggregatedResult {
        use crate::parser::AgentResult;
        use std::collections::HashMap;

        let mut session_results = HashMap::new();
        session_results.insert(
            "session-1".to_string(),
            AgentResult {
                status: 0,
                success: true,
                message: "Success".to_string(),
                error: None,
                files: vec!["file1.rs".to_string()],
            },
        );

        AggregatedResult {
            total_sessions: 1,
            successful_sessions: 1,
            failed_sessions: 0,
            success_rate: 1.0,
            session_results,
            errors: vec![],
            modified_files: vec!["file1.rs".to_string()],
        }
    }

    #[test]
    fn test_milestone_updater_creation() {
        let config = create_test_config();
        let updater = MilestoneUpdater::new(config);
        assert_eq!(updater.config.owner, "test-owner");
    }

    #[test]
    fn test_milestone_is_complete() {
        let mut milestone = create_test_milestone();
        assert!(!milestone.is_complete());

        milestone.open_issues = 0;
        assert!(milestone.is_complete());
    }

    #[test]
    fn test_milestone_calculate_progress() {
        let milestone = create_test_milestone();
        let progress = milestone.calculate_progress();
        assert!((progress - 60.0).abs() < 0.1);
    }

    #[test]
    fn test_milestone_calculate_progress_no_issues() {
        let milestone = Milestone {
            number: 1,
            title: "Empty".to_string(),
            description: None,
            state: MilestoneState::Open,
            open_issues: 0,
            closed_issues: 0,
            progress: 0.0,
        };
        let progress = milestone.calculate_progress();
        assert_eq!(progress, 0.0);
    }

    #[test]
    fn test_generate_milestone_comment() {
        let config = create_test_config();
        let updater = MilestoneUpdater::new(config);
        let milestone = create_test_milestone();
        let result = create_test_result();

        let comment = updater.generate_milestone_comment(&result, &milestone);
        assert!(comment.contains("Water Spider Progress Update"));
        assert!(comment.contains("Test Milestone"));
        assert!(comment.contains("Session Results"));
        assert!(comment.contains("Statistics"));
        assert!(comment.contains("Modified Files"));
    }

    #[test]
    fn test_parse_milestone() {
        let config = create_test_config();
        let updater = MilestoneUpdater::new(config);

        let json = serde_json::json!({
            "number": 37,
            "title": "Water Spider v1.0",
            "description": "Complete orchestrator",
            "state": "open",
            "open_issues": 2,
            "closed_issues": 3
        });

        let milestone = updater.parse_milestone(&json).unwrap();
        assert_eq!(milestone.number, 37);
        assert_eq!(milestone.title, "Water Spider v1.0");
        assert_eq!(milestone.state, MilestoneState::Open);
        assert_eq!(milestone.open_issues, 2);
        assert_eq!(milestone.closed_issues, 3);
        assert!((milestone.progress - 60.0).abs() < 0.1);
    }
}
