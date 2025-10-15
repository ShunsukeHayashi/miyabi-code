//! Agent command - Run agents

use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_agents::base::BaseAgent;
use miyabi_agents::codegen::CodeGenAgent;
use miyabi_agents::coordinator::CoordinatorAgent;
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
        // Get GitHub token from environment
        let github_token =
            std::env::var("GITHUB_TOKEN").map_err(|_| CliError::MissingGitHubToken)?;

        // Get device identifier (optional)
        let device_identifier = std::env::var("DEVICE_IDENTIFIER")
            .unwrap_or_else(|_| hostname::get().unwrap().to_string_lossy().to_string());

        // Load from .miyabi.yml or use defaults
        Ok(AgentConfig {
            device_identifier,
            github_token,
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
            metadata: Some(HashMap::from([
                ("issue_number".to_string(), serde_json::json!(issue_number)),
            ])),
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
            metadata: Some(HashMap::from([
                ("issue_number".to_string(), serde_json::json!(issue_number)),
            ])),
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
