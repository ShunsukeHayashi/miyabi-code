//! Agent command - Run agents

use crate::agents::{AgentDescriptor, AgentRegistry, BoxedAgent};
use crate::config::ConfigLoader;
use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_agent_codegen::{
    modes::{manual::ManualMode, ModeExecutor},
    ExecutionMode,
};
use miyabi_agent_core::HookedAgent;
use miyabi_core::git::{find_git_root, get_current_branch};
use miyabi_types::{AgentConfig, AgentType, Task};
use serde_json::json;
use std::collections::HashMap;
use std::path::PathBuf;

/// Macro to generate business agent runner methods
///
/// Reduces code duplication by generating identical methods for business agents
macro_rules! impl_business_agent_runner {
    ($($method_name:ident => $agent_type:expr, $description:expr);* $(;)?) => {
        $(
            async fn $method_name(&self, config: AgentConfig) -> Result<()> {
                self.execute_business_agent(config, $agent_type, $description).await
            }
        )*
    };
}

pub struct AgentCommand {
    pub agent_type: String,
    pub issue: Option<u64>,
    pub mode: Option<ExecutionMode>,
}

impl AgentCommand {
    pub fn new(agent_type: String, issue: Option<u64>, mode: Option<ExecutionMode>) -> Self {
        Self { agent_type, issue, mode }
    }

    pub async fn execute(&self) -> Result<()> {
        println!("{}", format!("🤖 Running {} agent...", self.agent_type).cyan().bold());

        // Parse agent type
        let agent_type = self.parse_agent_type()?;

        // Load configuration
        let config = self.load_config()?;

        // Create and execute agent
        match agent_type {
            // Coding Agents
            AgentType::CoordinatorAgent => self.run_coordinator_agent(config).await?,
            AgentType::CodeGenAgent => self.run_codegen_agent(config).await?,
            AgentType::ReviewAgent => self.run_review_agent(config).await?,
            AgentType::IssueAgent => self.run_issue_agent(config).await?,
            AgentType::PRAgent => self.run_pr_agent(config).await?,
            AgentType::DeploymentAgent => self.run_deployment_agent(config).await?,

            // Business Agents
            AgentType::AIEntrepreneurAgent => self.run_ai_entrepreneur_agent(config).await?,
            AgentType::ProductConceptAgent => self.run_product_concept_agent(config).await?,
            AgentType::ProductDesignAgent => self.run_product_design_agent(config).await?,
            AgentType::FunnelDesignAgent => self.run_funnel_design_agent(config).await?,
            AgentType::PersonaAgent => self.run_persona_agent(config).await?,
            AgentType::SelfAnalysisAgent => self.run_self_analysis_agent(config).await?,
            AgentType::MarketResearchAgent => self.run_market_research_agent(config).await?,
            AgentType::MarketingAgent => self.run_marketing_agent(config).await?,
            AgentType::ContentCreationAgent => self.run_content_creation_agent(config).await?,
            AgentType::SNSStrategyAgent => self.run_sns_strategy_agent(config).await?,
            AgentType::YouTubeAgent => self.run_youtube_agent(config).await?,
            AgentType::SalesAgent => self.run_sales_agent(config).await?,
            AgentType::CRMAgent => self.run_crm_agent(config).await?,
            AgentType::AnalyticsAgent => self.run_analytics_agent(config).await?,

            _ => {
                println!("{}", format!("Agent type {:?} not yet implemented", agent_type).yellow());
            }
        }

        println!();
        println!("{}", "✅ Agent completed successfully!".green().bold());

        Ok(())
    }

    pub fn parse_agent_type(&self) -> Result<AgentType> {
        match self.agent_type.to_lowercase().as_str() {
            // Coding Agents
            "coordinator" => Ok(AgentType::CoordinatorAgent),
            "codegen" | "code-gen" => Ok(AgentType::CodeGenAgent),
            "review" => Ok(AgentType::ReviewAgent),
            "issue" => Ok(AgentType::IssueAgent),
            "pr" => Ok(AgentType::PRAgent),
            "deployment" | "deploy" => Ok(AgentType::DeploymentAgent),

            // Business Agents - Strategy & Planning
            "ai-entrepreneur" | "entrepreneur" => Ok(AgentType::AIEntrepreneurAgent),
            "product-concept" | "concept" => Ok(AgentType::ProductConceptAgent),
            "product-design" | "design" => Ok(AgentType::ProductDesignAgent),
            "funnel-design" | "funnel" => Ok(AgentType::FunnelDesignAgent),
            "persona" => Ok(AgentType::PersonaAgent),
            "self-analysis" | "analysis" => Ok(AgentType::SelfAnalysisAgent),

            // Business Agents - Marketing & Content
            "market-research" | "research" => Ok(AgentType::MarketResearchAgent),
            "marketing" => Ok(AgentType::MarketingAgent),
            "content-creation" | "content" => Ok(AgentType::ContentCreationAgent),
            "sns-strategy" | "sns" => Ok(AgentType::SNSStrategyAgent),
            "youtube" => Ok(AgentType::YouTubeAgent),

            // Business Agents - Sales & Customer Management
            "sales" => Ok(AgentType::SalesAgent),
            "crm" => Ok(AgentType::CRMAgent),
            "analytics" => Ok(AgentType::AnalyticsAgent),

            _ => Err(CliError::InvalidAgentType(self.agent_type.clone())),
        }
    }

    fn load_config(&self) -> Result<AgentConfig> {
        ConfigLoader::global().load()
    }

    fn git_root(&self) -> Result<PathBuf> {
        find_git_root(None).map_err(|e| CliError::GitConfig(e.to_string()))
    }

    fn get_descriptor(&self, agent_type: AgentType) -> Result<&'static AgentDescriptor> {
        AgentRegistry::global()
            .get(agent_type)
            .ok_or_else(|| CliError::AgentNotRegistered(format!("{:?}", agent_type)))
    }

    fn instantiate_agent(&self, agent_type: AgentType, config: &AgentConfig) -> Result<HookedAgent<BoxedAgent>> {
        let descriptor = self.get_descriptor(agent_type)?;
        Ok(descriptor.instantiate(config))
    }

    fn build_issue_task_for(
        &self,
        agent_type: AgentType,
        issue_number: u64,
        metadata: Option<HashMap<String, serde_json::Value>>,
        include_default_issue_metadata: bool,
    ) -> Result<Task> {
        let descriptor = self.get_descriptor(agent_type)?;
        descriptor
            .build_issue_task(issue_number, metadata, include_default_issue_metadata)
            .ok_or_else(|| CliError::AgentTaskTemplateMissing(format!("{:?}", agent_type)))
    }

    async fn execute_business_agent(&self, config: AgentConfig, agent_type: AgentType, type_label: &str) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: {}", type_label);
        println!();

        let agent = self.instantiate_agent(agent_type, &config)?;
        let task = self.build_issue_task_for(agent_type, issue_number, None, true)?;

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_coordinator_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: CoordinatorAgent with LLM (Task decomposition & DAG)");
        println!();

        let agent = self.instantiate_agent(AgentType::CoordinatorAgent, &config)?;
        let task = self.build_issue_task_for(AgentType::CoordinatorAgent, issue_number, None, true)?;

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

        // Check execution mode
        let mode = self.mode.unwrap_or(ExecutionMode::Auto);
        println!("  Mode: {}", mode);
        println!();

        let task = self.build_issue_task_for(AgentType::CodeGenAgent, issue_number, None, true)?;

        match mode {
            ExecutionMode::Manual => {
                println!("{}", "  📝 Manual Mode Activated".cyan().bold());
                println!();

                let current_dir = std::env::current_dir()
                    .map_err(|e| CliError::InvalidInput(format!("Failed to get current directory: {}", e)))?;
                let manual_mode = ManualMode::new(current_dir);

                let result = manual_mode
                    .execute(&task)
                    .await
                    .map_err(|e| CliError::ExecutionError(e.to_string()))?;

                println!();
                println!("{}", result);
                println!();
                println!("{}", "✅ Manual mode setup complete".green().bold());

                Ok(())
            }
            ExecutionMode::Auto => {
                println!("{}", "  🤖 Auto Mode: LLM Code Generation".cyan().bold());
                println!();

                let agent = self.instantiate_agent(AgentType::CodeGenAgent, &config)?;

                println!("{}", "  Executing...".dimmed());
                let result = agent.execute(&task).await?;

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
    }

    async fn run_review_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: ReviewAgent (Code quality review)");
        println!();

        let agent = self.instantiate_agent(AgentType::ReviewAgent, &config)?;
        let task = self.build_issue_task_for(AgentType::ReviewAgent, issue_number, None, true)?;

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;

        println!();
        println!("  Results:");
        println!("    Status: {:?}", result.status);

        if let Some(ref metrics) = result.metrics {
            println!("    Duration: {}ms", metrics.duration_ms);
            if let Some(score) = metrics.quality_score {
                println!("    Quality Score: {}", score);
            }
        }

        if let Some(ref data) = result.data {
            println!("    Data: {}", serde_json::to_string_pretty(data)?);
        }

        Ok(())
    }

    async fn run_issue_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: IssueAgent (Issue analysis & labeling)");
        println!();

        let agent = self.instantiate_agent(AgentType::IssueAgent, &config)?;
        let task = self.build_issue_task_for(AgentType::IssueAgent, issue_number, None, true)?;

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
                println!("    Estimated Duration: {} minutes", analysis.estimated_duration);
                println!("    Dependencies: {}", analysis.dependencies.join(", "));
                println!("    Applied Labels: {}", analysis.labels.join(", "));
            }
        }

        Ok(())
    }

    async fn run_pr_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: PRAgent (Pull Request creation)");
        println!();

        let repo_root = self.git_root()?;
        let branch = get_current_branch(&repo_root).map_err(|e| CliError::GitConfig(e.to_string()))?;
        let base_branch = std::env::var("MIYABI_BASE_BRANCH").unwrap_or_else(|_| "main".to_string());

        let mut metadata = HashMap::new();
        metadata.insert("issueNumber".to_string(), json!(issue_number));
        metadata.insert("branch".to_string(), json!(branch.clone()));
        metadata.insert("baseBranch".to_string(), json!(base_branch.clone()));

        let agent = self.instantiate_agent(AgentType::PRAgent, &config)?;
        let task = self.build_issue_task_for(AgentType::PRAgent, issue_number, Some(metadata), false)?;

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;

        println!();
        println!("  Results:");
        println!("    Status: {:?}", result.status);

        if let Some(ref data) = result.data {
            println!("    Data: {}", serde_json::to_string_pretty(data)?);
        }

        println!("    Branch: {}", branch);
        println!("    Base Branch: {}", base_branch);

        Ok(())
    }

    async fn run_deployment_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: DeploymentAgent (Build/Test/Deploy)");
        println!();

        let environment = std::env::var("MIYABI_DEPLOY_ENV").unwrap_or_else(|_| "staging".to_string());

        let health_url = match environment.as_str() {
            "production" => config
                .production_url
                .clone()
                .or_else(|| std::env::var("MIYABI_PRODUCTION_HEALTH_URL").ok()),
            _ => config
                .staging_url
                .clone()
                .or_else(|| std::env::var("MIYABI_STAGING_HEALTH_URL").ok()),
        };

        let mut metadata = HashMap::new();
        metadata.insert("issue_number".to_string(), json!(issue_number));
        metadata.insert("environment".to_string(), json!(environment.clone()));
        if let Some(url) = health_url {
            metadata.insert("health_url".to_string(), json!(url));
        }

        let agent = self.instantiate_agent(AgentType::DeploymentAgent, &config)?;
        let task = self.build_issue_task_for(AgentType::DeploymentAgent, issue_number, Some(metadata), false)?;

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;

        println!();
        println!("  Results:");
        println!("    Status: {:?}", result.status);

        if let Some(ref metrics) = result.metrics {
            println!("    Duration: {}ms", metrics.duration_ms);
        }

        if let Some(ref data) = result.data {
            println!("    Data: {}", serde_json::to_string_pretty(data)?);
        }

        if let Some(ref escalation) = result.escalation {
            println!("    Escalation: {:?} ({})", escalation.target, escalation.reason);
        }

        Ok(())
    }

    // Business Agent execution methods
    // Generated by impl_business_agent_runner! macro
    impl_business_agent_runner! {
        run_ai_entrepreneur_agent => AgentType::AIEntrepreneurAgent, "AIEntrepreneurAgent (8-phase business plan generation)";
        run_product_concept_agent => AgentType::ProductConceptAgent, "ProductConceptAgent (MVP design & product strategy)";
        run_product_design_agent => AgentType::ProductDesignAgent, "ProductDesignAgent (Comprehensive product design)";
        run_funnel_design_agent => AgentType::FunnelDesignAgent, "FunnelDesignAgent (AARRR metrics & conversion optimization)";
        run_persona_agent => AgentType::PersonaAgent, "PersonaAgent (Customer persona & segment analysis)";
        run_self_analysis_agent => AgentType::SelfAnalysisAgent, "SelfAnalysisAgent (Self-assessment & business strategy)";
        run_market_research_agent => AgentType::MarketResearchAgent, "MarketResearchAgent (Market analysis & competitive landscape)";
        run_marketing_agent => AgentType::MarketingAgent, "MarketingAgent (Marketing strategy & campaign planning)";
        run_content_creation_agent => AgentType::ContentCreationAgent, "ContentCreationAgent (Content creation & blog article generation)";
        run_sns_strategy_agent => AgentType::SNSStrategyAgent, "SNSStrategyAgent (Social media strategy & community management)";
        run_youtube_agent => AgentType::YouTubeAgent, "YouTubeAgent (YouTube strategy & video content planning)";
        run_sales_agent => AgentType::SalesAgent, "SalesAgent (Sales strategy & process optimization)";
        run_crm_agent => AgentType::CRMAgent, "CRMAgent (CRM strategy & customer relationship management)";
        run_analytics_agent => AgentType::AnalyticsAgent, "AnalyticsAgent (Data analytics & business intelligence)";
    }

    // Helper methods
    fn display_business_result(&self, result: miyabi_types::AgentResult) -> Result<()> {
        println!();
        println!("  Results:");
        println!("    Status: {:?}", result.status);

        if let Some(metrics) = result.metrics {
            println!("    Duration: {}ms", metrics.duration_ms);
            if let Some(quality_score) = metrics.quality_score {
                println!("    Quality Score: {}/100", quality_score);
            }
        }

        if let Some(data) = result.data {
            println!(
                "    Summary: {}",
                data.get("summary")
                    .unwrap_or(&serde_json::Value::String("No summary available".to_string()))
            );
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_agent_type() {
        let cmd = AgentCommand::new("coordinator".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::CoordinatorAgent));

        let cmd = AgentCommand::new("codegen".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::CodeGenAgent));

        let cmd = AgentCommand::new("code-gen".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::CodeGenAgent));

        let cmd = AgentCommand::new("invalid".to_string(), None, None);
        assert!(cmd.parse_agent_type().is_err());

        // Test Business Agent types
        let cmd = AgentCommand::new("ai-entrepreneur".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::AIEntrepreneurAgent));

        let cmd = AgentCommand::new("entrepreneur".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::AIEntrepreneurAgent));

        let cmd = AgentCommand::new("marketing".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::MarketingAgent));

        let cmd = AgentCommand::new("analytics".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::AnalyticsAgent));
    }

    #[test]
    fn test_agent_command_creation() {
        let cmd = AgentCommand::new("coordinator".to_string(), Some(123), None);
        assert_eq!(cmd.agent_type, "coordinator");
        assert_eq!(cmd.issue, Some(123));

        let cmd = AgentCommand::new("codegen".to_string(), None, None);
        assert_eq!(cmd.agent_type, "codegen");
        assert_eq!(cmd.issue, None);
    }

    #[test]
    fn test_parse_agent_type_case_insensitive() {
        let cmd = AgentCommand::new("COORDINATOR".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::CoordinatorAgent));

        let cmd = AgentCommand::new("CoDeGen".to_string(), None, None);
        assert!(matches!(cmd.parse_agent_type().unwrap(), AgentType::CodeGenAgent));
    }

    #[test]
    fn test_parse_agent_type_all_coding_agents() {
        let test_cases = vec![
            ("coordinator", AgentType::CoordinatorAgent),
            ("codegen", AgentType::CodeGenAgent),
            ("code-gen", AgentType::CodeGenAgent),
            ("review", AgentType::ReviewAgent),
            ("issue", AgentType::IssueAgent),
            ("pr", AgentType::PRAgent),
            ("deployment", AgentType::DeploymentAgent),
            ("deploy", AgentType::DeploymentAgent),
        ];

        for (input, expected) in test_cases {
            let cmd = AgentCommand::new(input.to_string(), None, None);
            let result = cmd.parse_agent_type().unwrap();
            assert_eq!(
                std::mem::discriminant(&result),
                std::mem::discriminant(&expected),
                "Failed for input: {}",
                input
            );
        }
    }

    #[test]
    fn test_parse_agent_type_all_business_agents() {
        let test_cases = vec![
            ("ai-entrepreneur", AgentType::AIEntrepreneurAgent),
            ("entrepreneur", AgentType::AIEntrepreneurAgent),
            ("product-concept", AgentType::ProductConceptAgent),
            ("concept", AgentType::ProductConceptAgent),
            ("product-design", AgentType::ProductDesignAgent),
            ("design", AgentType::ProductDesignAgent),
            ("funnel-design", AgentType::FunnelDesignAgent),
            ("funnel", AgentType::FunnelDesignAgent),
            ("persona", AgentType::PersonaAgent),
            ("self-analysis", AgentType::SelfAnalysisAgent),
            ("analysis", AgentType::SelfAnalysisAgent),
            ("market-research", AgentType::MarketResearchAgent),
            ("research", AgentType::MarketResearchAgent),
            ("marketing", AgentType::MarketingAgent),
            ("content-creation", AgentType::ContentCreationAgent),
            ("content", AgentType::ContentCreationAgent),
            ("sns-strategy", AgentType::SNSStrategyAgent),
            ("sns", AgentType::SNSStrategyAgent),
            ("youtube", AgentType::YouTubeAgent),
            ("sales", AgentType::SalesAgent),
            ("crm", AgentType::CRMAgent),
            ("analytics", AgentType::AnalyticsAgent),
        ];

        for (input, expected) in test_cases {
            let cmd = AgentCommand::new(input.to_string(), None, None);
            let result = cmd.parse_agent_type().unwrap();
            assert_eq!(
                std::mem::discriminant(&result),
                std::mem::discriminant(&expected),
                "Failed for input: {}",
                input
            );
        }
    }

    #[test]
    fn test_parse_agent_type_invalid_types() {
        let invalid_types = vec![
            "invalid",
            "unknown-agent",
            "test",
            "",
            "coordinator-invalid",
            "123",
            "agent",
        ];

        for input in invalid_types {
            let cmd = AgentCommand::new(input.to_string(), None, None);
            let result = cmd.parse_agent_type();
            assert!(result.is_err(), "Should fail for input: {}", input);
            assert!(matches!(result.unwrap_err(), CliError::InvalidAgentType(_)));
        }
    }

    #[test]
    fn test_build_issue_task_for_business_agent() {
        let cmd = AgentCommand::new("marketing".to_string(), Some(42), None);
        let task = cmd
            .build_issue_task_for(AgentType::MarketingAgent, 42, None, true)
            .expect("task template must exist");

        assert_eq!(task.id, "business-issue-42");
        assert_eq!(task.assigned_agent, Some(AgentType::MarketingAgent));
        assert_eq!(task.estimated_duration, Some(60));

        let metadata = task.metadata.expect("metadata should be present");
        assert_eq!(metadata.get("issue_number"), Some(&serde_json::json!(42)));
    }
}
