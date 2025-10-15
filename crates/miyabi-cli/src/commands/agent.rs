//! Agent command - Run agents

use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_agents::base::BaseAgent;
use miyabi_agents::codegen::CodeGenAgent;
use miyabi_agents::coordinator::CoordinatorAgent;
use miyabi_agents::issue::IssueAgent;
use miyabi_types::{AgentConfig, AgentType, Task};
use std::collections::HashMap;

pub struct AgentCommand {
    pub agent_type: String,
    pub issue: Option<u64>,
}

impl AgentCommand {
    pub fn new(agent_type: String, issue: Option<u64>) -> Self {
        Self { agent_type, issue }
    }

    pub async fn execute(&self) -> Result<()> {
        println!(
            "{}",
            format!("🤖 Running {} agent...", self.agent_type)
                .cyan()
                .bold()
        );

        // Parse agent type
        let agent_type = self.parse_agent_type()?;

        // Load configuration
        let config = self.load_config()?;

        // Create and execute agent
        match agent_type {
            AgentType::CoordinatorAgent => {
                self.run_coordinator_agent(config).await?;
            }
            AgentType::CodeGenAgent => {
                self.run_codegen_agent(config).await?;
            }
            AgentType::IssueAgent => {
                self.run_issue_agent(config).await?;
            }
            _ => {
                println!(
                    "{}",
                    format!("Agent type {:?} not yet implemented", agent_type).yellow()
                );
            }
        }

        println!();
        println!("{}", "✅ Agent completed successfully!".green().bold());

        Ok(())
    }

    pub fn parse_agent_type(&self) -> Result<AgentType> {
        match self.agent_type.to_lowercase().as_str() {
            "coordinator" => Ok(AgentType::CoordinatorAgent),
            "codegen" | "code-gen" => Ok(AgentType::CodeGenAgent),
            "review" => Ok(AgentType::ReviewAgent),
            "issue" => Ok(AgentType::IssueAgent),
            "pr" => Ok(AgentType::PRAgent),
            "deployment" | "deploy" => Ok(AgentType::DeploymentAgent),
            _ => Err(CliError::InvalidAgentType(self.agent_type.clone())),
        }
    }

    fn load_config(&self) -> Result<AgentConfig> {
        // Get GitHub token with auto-detection from multiple sources
        let github_token = self.get_github_token()?;

        // Get device identifier (optional)
        let device_identifier = std::env::var("DEVICE_IDENTIFIER")
            .unwrap_or_else(|_| hostname::get().unwrap().to_string_lossy().to_string());

        // Parse repository owner and name from git remote
        let (repo_owner, repo_name) = self.parse_git_remote()?;

        // Load from .miyabi.yml or use defaults
        Ok(AgentConfig {
            device_identifier,
            github_token,
            repo_owner: Some(repo_owner),
            repo_name: Some(repo_name),
            use_task_tool: false,
            use_worktree: true,
            worktree_base_path: Some(".worktrees".to_string()),
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        })
    }

    /// Get GitHub token with auto-detection from multiple sources
    ///
    /// Tries the following sources in order:
    /// 1. GITHUB_TOKEN environment variable
    /// 2. gh CLI (`gh auth token`)
    /// 3. Error with helpful instructions
    ///
    /// # Returns
    /// * `Ok(String)` - GitHub token
    /// * `Err(CliError)` - Token not found with helpful error message
    fn get_github_token(&self) -> Result<String> {
        // 1. Try environment variable first
        if let Ok(token) = std::env::var("GITHUB_TOKEN") {
            if !token.trim().is_empty() {
                return Ok(token.trim().to_string());
            }
        }

        // 2. Try gh CLI
        if let Ok(output) = std::process::Command::new("gh")
            .args(["auth", "token"])
            .output()
        {
            if output.status.success() {
                let token = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !token.is_empty()
                    && (token.starts_with("ghp_")
                        || token.starts_with("gho_")
                        || token.starts_with("ghu_")
                        || token.starts_with("ghs_")
                        || token.starts_with("ghr_"))
                {
                    return Ok(token);
                }
            }
        }

        // 3. Token not found - provide helpful error
        Err(CliError::GitConfig(
            "GitHub token not found. Please set up authentication:\n\n\
             Option 1: Set environment variable\n\
             export GITHUB_TOKEN=ghp_xxx\n\n\
             Option 2: Authenticate with gh CLI\n\
             gh auth login\n\n\
             Option 3: Add to .env file (uncomment the GITHUB_TOKEN line)\n\
             GITHUB_TOKEN=ghp_xxx"
                .to_string(),
        ))
    }

    /// Parse repository owner and name from git remote URL
    ///
    /// Supports formats:
    /// - https://github.com/owner/repo
    /// - https://github.com/owner/repo.git
    /// - git@github.com:owner/repo.git
    fn parse_git_remote(&self) -> Result<(String, String)> {
        // Run git remote get-url origin
        let output = std::process::Command::new("git")
            .args(["remote", "get-url", "origin"])
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to run git command: {}", e)))?;

        if !output.status.success() {
            return Err(CliError::GitConfig(
                "Failed to get git remote URL. Not a git repository?".to_string(),
            ));
        }

        let remote_url = String::from_utf8_lossy(&output.stdout).trim().to_string();

        // Parse HTTPS format: https://github.com/owner/repo(.git)?
        if remote_url.starts_with("http") && remote_url.contains("github.com/") {
            let parts: Vec<&str> = remote_url
                .split("github.com/")
                .nth(1)
                .ok_or_else(|| CliError::GitConfig("Invalid GitHub URL".to_string()))?
                .trim_end_matches(".git")
                .split('/')
                .collect();

            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        // Parse SSH format: git@github.com:owner/repo.git
        if remote_url.starts_with("git@github.com:") {
            let repo_part = remote_url
                .strip_prefix("git@github.com:")
                .ok_or_else(|| CliError::GitConfig("Invalid SSH URL".to_string()))?
                .trim_end_matches(".git");

            let parts: Vec<&str> = repo_part.split('/').collect();
            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        Err(CliError::GitConfig(format!(
            "Could not parse GitHub owner/repo from remote URL: {}",
            remote_url
        )))
    }

    async fn run_coordinator_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: CoordinatorAgent (Task decomposition & DAG)");
        println!();

        // Create agent
        let agent = CoordinatorAgent::new(config);

        // Create task for coordinator
        let task = Task {
            id: format!("coordinator-issue-{}", issue_number),
            title: format!("Coordinate Issue #{}", issue_number),
            description: format!("Decompose Issue #{} into executable tasks", issue_number),
            task_type: miyabi_types::task::TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CoordinatorAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                serde_json::json!(issue_number),
            )])),
        };

        // Execute agent
        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;

        // Display results
        println!();
        println!("  Results:");
        println!("    Status: {:?}", result.status);

        if let Some(metrics) = result.metrics {
            println!("    Duration: {}ms", metrics.duration_ms);
        }

        if let Some(data) = result.data {
            println!("    Data: {}", serde_json::to_string_pretty(&data)?);
        }

        Ok(())
    }

    async fn run_codegen_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: CodeGenAgent (Code generation)");
        println!();

        // Create agent
        let agent = CodeGenAgent::new(config);

        // Create task for codegen
        let task = Task {
            id: format!("codegen-issue-{}", issue_number),
            title: format!("Generate code for Issue #{}", issue_number),
            description: format!("Implement solution for Issue #{}", issue_number),
            task_type: miyabi_types::task::TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                serde_json::json!(issue_number),
            )])),
        };

        // Execute agent
        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;

        // Display results
        println!();
        println!("  Results:");
        println!("    Status: {:?}", result.status);

        if let Some(metrics) = result.metrics {
            println!("    Duration: {}ms", metrics.duration_ms);
            if let Some(lines_changed) = metrics.lines_changed {
                println!("    Lines changed: {}", lines_changed);
            }
            if let Some(tests_added) = metrics.tests_added {
                println!("    Tests added: {}", tests_added);
            }
        }

        Ok(())
    }

    async fn run_issue_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: IssueAgent (Issue analysis & labeling)");
        println!();

        // Create agent
        let agent = IssueAgent::new(config);

        // Create task for issue analysis
        let task = Task {
            id: format!("issue-analysis-{}", issue_number),
            title: format!("Analyze Issue #{}", issue_number),
            description: format!("Classify Issue #{} and apply labels", issue_number),
            task_type: miyabi_types::task::TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::IssueAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                serde_json::json!(issue_number),
            )])),
        };

        // Execute agent
        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;

        // Display results
        println!();
        println!("  Results:");
        println!("    Status: {:?}", result.status);

        if let Some(metrics) = result.metrics {
            println!("    Duration: {}ms", metrics.duration_ms);
        }

        if let Some(data) = result.data {
            // Try to parse as IssueAnalysis
            if let Ok(analysis) = serde_json::from_value::<miyabi_types::IssueAnalysis>(data) {
                println!("  Analysis:");
                println!("    Issue Type: {:?}", analysis.issue_type);
                println!("    Severity: {:?}", analysis.severity);
                println!("    Impact: {:?}", analysis.impact);
                println!("    Assigned Agent: {:?}", analysis.assigned_agent);
                println!(
                    "    Estimated Duration: {} minutes",
                    analysis.estimated_duration
                );
                println!("    Dependencies: {}", analysis.dependencies.join(", "));
                println!("    Applied Labels: {}", analysis.labels.join(", "));
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_agent_type() {
        let cmd = AgentCommand::new("coordinator".to_string(), None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CoordinatorAgent
        ));

        let cmd = AgentCommand::new("codegen".to_string(), None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CodeGenAgent
        ));

        let cmd = AgentCommand::new("code-gen".to_string(), None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CodeGenAgent
        ));

        let cmd = AgentCommand::new("invalid".to_string(), None);
        assert!(cmd.parse_agent_type().is_err());
    }

    #[test]
    fn test_agent_command_creation() {
        let cmd = AgentCommand::new("coordinator".to_string(), Some(123));
        assert_eq!(cmd.agent_type, "coordinator");
        assert_eq!(cmd.issue, Some(123));

        let cmd = AgentCommand::new("codegen".to_string(), None);
        assert_eq!(cmd.agent_type, "codegen");
        assert_eq!(cmd.issue, None);
    }
}
