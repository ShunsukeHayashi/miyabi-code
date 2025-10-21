//! IssueAgent - Issue analysis and label management
//!
//! Responsible for analyzing GitHub Issues, determining issue types, severity,
//! impact, and automatically applying labels from the 57-label system.

use miyabi_agent_core::BaseAgent;
use async_trait::async_trait;
use miyabi_types::agent::{
    AgentMetrics, AgentType, EscalationInfo, EscalationTarget, ResultStatus, Severity,
};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, AgentResult, Issue, Task};
use miyabi_types::{ImpactLevel, IssueAnalysis};
use std::collections::HashMap;

pub struct IssueAgent {
    #[allow(dead_code)] // Reserved for future configuration
    config: AgentConfig,
}

impl IssueAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Analyze an issue and determine its classification
    pub fn analyze_issue(&self, issue: &Issue) -> Result<IssueAnalysis> {
        tracing::info!("Analyzing issue #{}: {}", issue.number, issue.title);

        // Combine title and body for keyword analysis
        let combined_text = format!(
            "{} {}",
            issue.title.to_lowercase(),
            issue.body.to_lowercase()
        );

        // 1. Determine issue type
        let issue_type = self.infer_issue_type(&combined_text, &issue.labels);

        // 2. Assess severity
        let severity = self.assess_severity(&combined_text);

        // 3. Evaluate impact
        let impact = self.evaluate_impact(&combined_text);

        // 4. Determine assigned agent
        let agent = self.determine_agent(&issue_type);

        // 5. Estimate duration
        let estimated_duration = self.estimate_duration(&issue_type, &combined_text);

        // 6. Extract dependencies
        let dependencies = self.extract_dependencies(&issue.body);

        // 7. Generate labels
        let labels = self.generate_labels(&issue_type, &severity, &impact);

        Ok(IssueAnalysis {
            issue_number: issue.number,
            issue_type,
            severity,
            impact,
            assigned_agent: agent,
            estimated_duration,
            dependencies,
            labels,
        })
    }

    /// Infer issue type from content and existing labels
    fn infer_issue_type(&self, text: &str, existing_labels: &[String]) -> TaskType {
        // Check existing labels first
        for label in existing_labels {
            let label_lower = label.to_lowercase();
            if label_lower.contains("bug") || label_lower.contains("type:bug") {
                return TaskType::Bug;
            }
            if label_lower.contains("feature") || label_lower.contains("type:feature") {
                return TaskType::Feature;
            }
            if label_lower.contains("refactor") || label_lower.contains("type:refactor") {
                return TaskType::Refactor;
            }
            if label_lower.contains("docs")
                || label_lower.contains("documentation")
                || label_lower.contains("type:docs")
            {
                return TaskType::Docs;
            }
            if label_lower.contains("test") || label_lower.contains("type:test") {
                return TaskType::Test;
            }
            if label_lower.contains("deployment")
                || label_lower.contains("deploy")
                || label_lower.contains("type:deployment")
            {
                return TaskType::Deployment;
            }
        }

        // Keyword-based detection
        // Bug keywords have highest priority
        if text.contains("bug")
            || text.contains("fix")
            || text.contains("error")
            || text.contains("issue")
            || text.contains("problem")
            || text.contains("broken")
        {
            return TaskType::Bug;
        }

        // Feature keywords
        if text.contains("feature")
            || text.contains("add")
            || text.contains("new")
            || text.contains("implement")
            || text.contains("create")
        {
            return TaskType::Feature;
        }

        // Refactor keywords
        if text.contains("refactor")
            || text.contains("cleanup")
            || text.contains("improve")
            || text.contains("optimize")
        {
            return TaskType::Refactor;
        }

        // Docs keywords
        if text.contains("doc")
            || text.contains("documentation")
            || text.contains("readme")
            || text.contains("guide")
        {
            return TaskType::Docs;
        }

        // Test keywords
        if text.contains("test") || text.contains("spec") || text.contains("coverage") {
            return TaskType::Test;
        }

        // Deployment keywords
        if text.contains("deploy")
            || text.contains("release")
            || text.contains("ci")
            || text.contains("cd")
        {
            return TaskType::Deployment;
        }

        // Default to Feature
        TaskType::Feature
    }

    /// Assess severity based on keywords
    fn assess_severity(&self, text: &str) -> Severity {
        // Sev.1-Critical: immediate response required
        if text.contains("critical")
            || text.contains("urgent")
            || text.contains("emergency")
            || text.contains("blocking")
            || text.contains("blocker")
            || text.contains("production")
            || text.contains("data loss")
            || text.contains("security breach")
        {
            return Severity::Critical;
        }

        // Sev.2-High: high priority
        if text.contains("high priority")
            || text.contains("asap")
            || text.contains("important")
            || text.contains("major")
            || text.contains("broken")
        {
            return Severity::High;
        }

        // Sev.4-Low: minor issues
        if text.contains("minor")
            || text.contains("small")
            || text.contains("trivial")
            || text.contains("typo")
            || text.contains("cosmetic")
        {
            return Severity::Low;
        }

        // Sev.5-Trivial: lowest priority
        if text.contains("nice to have")
            || text.contains("enhancement")
            || text.contains("suggestion")
        {
            return Severity::Low; // Using Low as proxy for Trivial
        }

        // Default: Sev.3-Medium
        Severity::Medium
    }

    /// Evaluate impact based on scope
    fn evaluate_impact(&self, text: &str) -> ImpactLevel {
        // Critical: affects all users
        if text.contains("all users")
            || text.contains("entire system")
            || text.contains("complete failure")
            || text.contains("data loss")
        {
            return ImpactLevel::Critical;
        }

        // High: affects major functionality
        if text.contains("many users")
            || text.contains("major feature")
            || text.contains("main functionality")
        {
            return ImpactLevel::High;
        }

        // Low: minimal impact
        if text.contains("few users") || text.contains("cosmetic") || text.contains("documentation")
        {
            return ImpactLevel::Low;
        }

        // Default: Medium
        ImpactLevel::Medium
    }

    /// Determine which agent should handle this issue
    fn determine_agent(&self, issue_type: &TaskType) -> AgentType {
        match issue_type {
            TaskType::Deployment => AgentType::DeploymentAgent,
            _ => AgentType::CodeGenAgent, // Default for feature/bug/refactor/docs/test
        }
    }

    /// Estimate duration in minutes based on issue type and complexity
    fn estimate_duration(&self, issue_type: &TaskType, text: &str) -> u32 {
        let base_duration = match issue_type {
            TaskType::Feature => 120,
            TaskType::Bug => 60,
            TaskType::Refactor => 90,
            TaskType::Docs => 30,
            TaskType::Test => 45,
            TaskType::Deployment => 30,
        };

        // Adjust based on complexity keywords
        let multiplier =
            if text.contains("large") || text.contains("major") || text.contains("complex") {
                2.0
            } else if text.contains("quick")
                || text.contains("small")
                || text.contains("minor")
                || text.contains("simple")
            {
                0.5
            } else {
                1.0
            };

        (base_duration as f32 * multiplier) as u32
    }

    /// Extract issue dependencies (#123 format)
    fn extract_dependencies(&self, body: &str) -> Vec<String> {
        let mut dependencies = Vec::new();

        // Match #123 format (GitHub issue references)
        let re = regex::Regex::new(r"#(\d+)").unwrap();
        for cap in re.captures_iter(body) {
            if let Some(number) = cap.get(1) {
                dependencies.push(format!("issue-{}", number.as_str()));
            }
        }

        dependencies.sort();
        dependencies.dedup();
        dependencies
    }

    /// Generate labels based on issue analysis
    fn generate_labels(
        &self,
        issue_type: &TaskType,
        severity: &Severity,
        impact: &ImpactLevel,
    ) -> Vec<String> {
        let mut labels = Vec::new();

        // Issue type label
        let type_label = match issue_type {
            TaskType::Feature => "✨ type:feature",
            TaskType::Bug => "🐛 type:bug",
            TaskType::Refactor => "🔧 type:refactor",
            TaskType::Docs => "📚 type:docs",
            TaskType::Test => "🧪 type:test",
            TaskType::Deployment => "🚀 type:deployment",
        };
        labels.push(type_label.to_string());

        // Severity label
        let severity_label = match severity {
            Severity::Critical => "🔥 severity:Sev.1-Critical",
            Severity::High => "⭐ severity:Sev.2-High",
            Severity::Medium => "➡️ severity:Sev.3-Medium",
            Severity::Low => "🟢 severity:Sev.4-Low",
            Severity::Trivial => "⬇️ severity:Sev.5-Trivial",
        };
        labels.push(severity_label.to_string());

        // Impact label
        let impact_label = match impact {
            ImpactLevel::Critical => "📊 impact:Critical",
            ImpactLevel::High => "📊 impact:High",
            ImpactLevel::Medium => "📊 impact:Medium",
            ImpactLevel::Low => "📊 impact:Low",
        };
        labels.push(impact_label.to_string());

        // Agent label
        let agent_label = if *issue_type == TaskType::Deployment {
            "🚀 agent:DeploymentAgent"
        } else {
            "🤖 agent:CodeGenAgent"
        };
        labels.push(agent_label.to_string());

        // State label (default to pending)
        labels.push("📥 state:pending".to_string());

        labels
    }
}

#[async_trait]
impl BaseAgent for IssueAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::IssueAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
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

        // For now, create a mock issue from task data
        // In production, this would fetch from GitHub API
        let issue = Issue {
            number: issue_number,
            title: task.title.clone(),
            body: task.description.clone(),
            state: miyabi_types::issue::IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: format!("https://github.com/test/repo/issues/{}", issue_number),
        };

        // Analyze issue
        let analysis = self.analyze_issue(&issue)?;

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Check if escalation is needed (Sev.1-Critical or Sev.2-High)
        let escalation = if matches!(analysis.severity, Severity::Critical | Severity::High) {
            let mut context = HashMap::new();
            context.insert("analysis".to_string(), serde_json::to_value(&analysis)?);

            let target = if analysis.issue_type == TaskType::Deployment {
                EscalationTarget::DevOps
            } else {
                EscalationTarget::TechLead
            };

            Some(EscalationInfo {
                reason: format!("High severity issue detected: {:?}", analysis.severity),
                target,
                severity: analysis.severity,
                context,
                timestamp: end_time,
            })
        } else {
            None
        };

        let status = if escalation.is_some() {
            ResultStatus::Escalated
        } else {
            ResultStatus::Success
        };

        // Create metrics
        let metrics = AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::IssueAgent,
            duration_ms,
            quality_score: None,
            lines_changed: None,
            tests_added: None,
            coverage_percent: None,
            errors_found: None,
            timestamp: end_time,
        };

        Ok(AgentResult {
            status,
            data: Some(serde_json::to_value(analysis)?),
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

    fn create_test_issue(title: &str, body: &str) -> Issue {
        Issue {
            number: 123,
            title: title.to_string(),
            body: body.to_string(),
            state: miyabi_types::issue::IssueStateGithub::Open,
            labels: vec![],
            assignee: None,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            url: "https://github.com/user/repo/issues/123".to_string(),
        }
    }

    #[tokio::test]
    async fn test_issue_agent_creation() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::IssueAgent);
    }

    #[tokio::test]
    async fn test_infer_issue_type_bug() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let text = "fix critical bug in authentication";
        let issue_type = agent.infer_issue_type(text, &[]);
        assert_eq!(issue_type, TaskType::Bug);
    }

    #[tokio::test]
    async fn test_infer_issue_type_feature() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let text = "implement new feature for user dashboard";
        let issue_type = agent.infer_issue_type(text, &[]);
        assert_eq!(issue_type, TaskType::Feature);
    }

    #[tokio::test]
    async fn test_assess_severity_critical() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let text = "critical security breach affecting production";
        let severity = agent.assess_severity(text);
        assert_eq!(severity, Severity::Critical);
    }

    #[tokio::test]
    async fn test_assess_severity_high() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let text = "high priority bug affecting major feature";
        let severity = agent.assess_severity(text);
        assert_eq!(severity, Severity::High);
    }

    #[tokio::test]
    async fn test_evaluate_impact_critical() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let text = "affects all users and entire system";
        let impact = agent.evaluate_impact(text);
        assert_eq!(impact, ImpactLevel::Critical);
    }

    #[tokio::test]
    async fn test_determine_agent_deployment() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let agent_type = agent.determine_agent(&TaskType::Deployment);
        assert_eq!(agent_type, AgentType::DeploymentAgent);
    }

    #[tokio::test]
    async fn test_determine_agent_codegen() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let agent_type = agent.determine_agent(&TaskType::Feature);
        assert_eq!(agent_type, AgentType::CodeGenAgent);
    }

    #[tokio::test]
    async fn test_estimate_duration() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        // Feature with large complexity
        let duration = agent.estimate_duration(&TaskType::Feature, "large feature implementation");
        assert_eq!(duration, 240); // 120 * 2.0

        // Bug with small complexity
        let duration = agent.estimate_duration(&TaskType::Bug, "quick bug fix");
        assert_eq!(duration, 30); // 60 * 0.5

        // Docs with normal complexity
        let duration = agent.estimate_duration(&TaskType::Docs, "update documentation");
        assert_eq!(duration, 30); // 30 * 1.0
    }

    #[tokio::test]
    async fn test_extract_dependencies() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let body = "This depends on #270 and #240. Also blocked by #276.";
        let dependencies = agent.extract_dependencies(body);
        assert_eq!(dependencies, vec!["issue-240", "issue-270", "issue-276"]);
    }

    #[tokio::test]
    async fn test_generate_labels() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let labels = agent.generate_labels(&TaskType::Bug, &Severity::High, &ImpactLevel::High);

        assert_eq!(labels.len(), 5);
        assert!(labels.contains(&"🐛 type:bug".to_string()));
        assert!(labels.contains(&"⭐ severity:Sev.2-High".to_string()));
        assert!(labels.contains(&"📊 impact:High".to_string()));
        assert!(labels.contains(&"🤖 agent:CodeGenAgent".to_string()));
        assert!(labels.contains(&"📥 state:pending".to_string()));
    }

    #[tokio::test]
    async fn test_analyze_issue_comprehensive() {
        let config = create_test_config();
        let agent = IssueAgent::new(config);

        let issue = create_test_issue(
            "Fix critical bug in authentication",
            "This is a high priority issue affecting all users. Depends on #270.",
        );

        let analysis = agent.analyze_issue(&issue).unwrap();

        assert_eq!(analysis.issue_number, 123);
        assert_eq!(analysis.issue_type, TaskType::Bug);
        assert_eq!(analysis.severity, Severity::Critical);
        assert_eq!(analysis.impact, ImpactLevel::Critical);
        assert_eq!(analysis.assigned_agent, AgentType::CodeGenAgent);
        assert!(analysis.estimated_duration > 0);
        assert_eq!(analysis.dependencies, vec!["issue-270"]);
        assert_eq!(analysis.labels.len(), 5);
    }
}
