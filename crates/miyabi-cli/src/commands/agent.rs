//! Agent command - Run agents

use crate::config::ConfigLoader;
use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_agent_codegen::{
    modes::{manual::ManualMode, ModeExecutor},
    ExecutionMode,
};
use miyabi_agents::{
    AIEntrepreneurAgent, AnalyticsAgent, AuditLogHook, BaseAgent, CRMAgent, CodeGenAgent,
    ContentCreationAgent, CoordinatorAgentWithLLM, DeploymentAgent, EnvironmentCheckHook,
    FunnelDesignAgent, HookedAgent, IssueAgent, MarketResearchAgent, MarketingAgent, MetricsHook,
    PRAgent, PersonaAgent, ProductConceptAgent, ProductDesignAgent, ReviewAgent, SNSStrategyAgent,
    SalesAgent, SelfAnalysisAgent, YouTubeAgent,
};
use miyabi_core::git::{find_git_root, get_current_branch};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, AgentType, Task};
use std::collections::HashMap;
use std::path::PathBuf;

pub struct AgentCommand {
    pub agent_type: String,
    pub issue: Option<u64>,
    pub mode: Option<ExecutionMode>,
}

impl AgentCommand {
    pub fn new(agent_type: String, issue: Option<u64>, mode: Option<ExecutionMode>) -> Self {
        Self {
            agent_type,
            issue,
            mode,
        }
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
            // Coding Agents
            AgentType::CoordinatorAgent => {
                self.run_coordinator_agent(config).await?;
            }
            AgentType::CodeGenAgent => {
                self.run_codegen_agent(config).await?;
            }
            AgentType::ReviewAgent => {
                self.run_review_agent(config).await?;
            }
            AgentType::IssueAgent => {
                self.run_issue_agent(config).await?;
            }
            AgentType::PRAgent => {
                self.run_pr_agent(config).await?;
            }
            AgentType::DeploymentAgent => {
                self.run_deployment_agent(config).await?;
            }

            // Business Agents - Strategy & Planning
            AgentType::AIEntrepreneurAgent => {
                self.run_ai_entrepreneur_agent(config).await?;
            }
            AgentType::ProductConceptAgent => {
                self.run_product_concept_agent(config).await?;
            }
            AgentType::ProductDesignAgent => {
                self.run_product_design_agent(config).await?;
            }
            AgentType::FunnelDesignAgent => {
                self.run_funnel_design_agent(config).await?;
            }
            AgentType::PersonaAgent => {
                self.run_persona_agent(config).await?;
            }
            AgentType::SelfAnalysisAgent => {
                self.run_self_analysis_agent(config).await?;
            }

            // Business Agents - Marketing & Content
            AgentType::MarketResearchAgent => {
                self.run_market_research_agent(config).await?;
            }
            AgentType::MarketingAgent => {
                self.run_marketing_agent(config).await?;
            }
            AgentType::ContentCreationAgent => {
                self.run_content_creation_agent(config).await?;
            }
            AgentType::SNSStrategyAgent => {
                self.run_sns_strategy_agent(config).await?;
            }
            AgentType::YouTubeAgent => {
                self.run_youtube_agent(config).await?;
            }

            // Business Agents - Sales & Customer Management
            AgentType::SalesAgent => {
                self.run_sales_agent(config).await?;
            }
            AgentType::CRMAgent => {
                self.run_crm_agent(config).await?;
            }
            AgentType::AnalyticsAgent => {
                self.run_analytics_agent(config).await?;
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

    /// Register standard lifecycle hooks for agents
    ///
    /// Registers three standard hooks:
    /// - MetricsHook: Execution metrics collection
    /// - EnvironmentCheckHook: GITHUB_TOKEN validation
    /// - AuditLogHook: Execution logging to .ai/logs/{date}.md
    ///
    /// # Example
    /// ```ignore
    /// let mut agent = HookedAgent::new(CodeGenAgent::new(config.clone()));
    /// self.register_standard_hooks(&mut agent, &config);
    /// ```
    fn register_standard_hooks<A: BaseAgent>(
        &self,
        agent: &mut HookedAgent<A>,
        config: &AgentConfig,
    ) {
        agent.register_hook(MetricsHook::new());
        agent.register_hook(EnvironmentCheckHook::new(["GITHUB_TOKEN"]));
        agent.register_hook(AuditLogHook::new(config.log_directory.clone()));
    }

    async fn run_coordinator_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: CoordinatorAgent with LLM (Task decomposition & DAG)");
        println!();

        // Create agent with LLM integration and lifecycle hooks
        let mut agent = HookedAgent::new(CoordinatorAgentWithLLM::new(config.clone()));
        self.register_standard_hooks(&mut agent, &config);

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

        // Check execution mode
        let mode = self.mode.unwrap_or(ExecutionMode::Auto);
        println!("  Mode: {}", mode);
        println!();

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

        // Execute based on mode
        match mode {
            ExecutionMode::Manual => {
                // Manual mode: Guide human implementation
                println!("{}", "  📝 Manual Mode Activated".cyan().bold());
                println!();

                // Create manual mode executor
                let current_dir = std::env::current_dir().map_err(|e| {
                    CliError::InvalidInput(format!("Failed to get current directory: {}", e))
                })?;
                let manual_mode = ManualMode::new(current_dir);

                // Execute manual mode
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
                // Auto mode: LLM-driven code generation
                println!("{}", "  🤖 Auto Mode: LLM Code Generation".cyan().bold());
                println!();

                // Create agent with lifecycle hooks and LLM integration
                let mut agent = HookedAgent::new(
                    CodeGenAgent::new_with_all(config.clone())
                        .unwrap_or_else(|_| CodeGenAgent::new(config.clone())),
                );
                self.register_standard_hooks(&mut agent, &config);

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
    }

    async fn run_review_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: ReviewAgent (Code quality review)");
        println!();

        let mut agent = HookedAgent::new(ReviewAgent::new(config.clone()));
        self.register_standard_hooks(&mut agent, &config);

        let task = Task {
            id: format!("review-issue-{}", issue_number),
            title: format!("Review implementation for Issue #{}", issue_number),
            description: format!(
                "Run lint, tests, security checks for Issue #{}",
                issue_number
            ),
            task_type: TaskType::Refactor,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::ReviewAgent),
            dependencies: vec![],
            estimated_duration: Some(15),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                serde_json::json!(issue_number),
            )])),
        };

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

        // Create agent with lifecycle hooks
        let mut agent = HookedAgent::new(IssueAgent::new(config.clone()));
        self.register_standard_hooks(&mut agent, &config);

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

    async fn run_pr_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: PRAgent (Pull Request creation)");
        println!();

        let repo_root = self.git_root()?;
        let branch =
            get_current_branch(&repo_root).map_err(|e| CliError::GitConfig(e.to_string()))?;
        let base_branch =
            std::env::var("MIYABI_BASE_BRANCH").unwrap_or_else(|_| "main".to_string());

        let mut metadata = HashMap::new();
        metadata.insert("issueNumber".to_string(), serde_json::json!(issue_number));
        metadata.insert("branch".to_string(), serde_json::json!(branch.clone()));
        metadata.insert(
            "baseBranch".to_string(),
            serde_json::json!(base_branch.clone()),
        );

        let mut agent = HookedAgent::new(PRAgent::new(config.clone()));
        self.register_standard_hooks(&mut agent, &config);

        let task = Task {
            id: format!("pr-issue-{}", issue_number),
            title: format!("Create PR for Issue #{}", issue_number),
            description: format!("Generate pull request for Issue #{}", issue_number),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::PRAgent),
            dependencies: vec![],
            estimated_duration: Some(5),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        };

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

        let environment =
            std::env::var("MIYABI_DEPLOY_ENV").unwrap_or_else(|_| "staging".to_string());

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
        metadata.insert("issue_number".to_string(), serde_json::json!(issue_number));
        metadata.insert(
            "environment".to_string(),
            serde_json::json!(environment.clone()),
        );
        if let Some(url) = health_url {
            metadata.insert("health_url".to_string(), serde_json::json!(url));
        }

        let mut agent = HookedAgent::new(DeploymentAgent::new(config.clone()));
        self.register_standard_hooks(&mut agent, &config);

        let task = Task {
            id: format!("deployment-issue-{}", issue_number),
            title: format!("Deploy changes for Issue #{}", issue_number),
            description: format!(
                "Build, test, and deploy code associated with Issue #{}",
                issue_number
            ),
            task_type: TaskType::Deployment,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::DeploymentAgent),
            dependencies: vec![],
            estimated_duration: Some(30),
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        };

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
            println!(
                "    Escalation: {:?} ({})",
                escalation.target, escalation.reason
            );
        }

        Ok(())
    }

    // Business Agent execution methods
    async fn run_ai_entrepreneur_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: AIEntrepreneurAgent (8-phase business plan generation)");
        println!();

        let agent = AIEntrepreneurAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "AI Entrepreneur Business Plan",
            "Generate comprehensive 8-phase business plan",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_product_concept_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: ProductConceptAgent (MVP design & product strategy)");
        println!();

        let agent = ProductConceptAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Product Concept Design",
            "Design MVP and product strategy",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_product_design_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: ProductDesignAgent (Comprehensive product design)");
        println!();

        let agent = ProductDesignAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Product Design Specification",
            "Create comprehensive product design and technical specification",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_funnel_design_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: FunnelDesignAgent (AARRR metrics & conversion optimization)");
        println!();

        let agent = FunnelDesignAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Funnel Design Strategy",
            "Design AARRR metrics and conversion optimization",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_persona_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: PersonaAgent (Customer persona & segment analysis)");
        println!();

        let agent = PersonaAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Customer Persona Analysis",
            "Analyze customer personas and segments",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_self_analysis_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: SelfAnalysisAgent (Self-assessment & business strategy)");
        println!();

        let agent = SelfAnalysisAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Self Analysis Strategy",
            "Perform self-assessment and business strategy formulation",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_market_research_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: MarketResearchAgent (Market analysis & competitive landscape)");
        println!();

        let agent = MarketResearchAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Market Research Analysis",
            "Conduct market research and competitive analysis",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_marketing_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: MarketingAgent (Marketing strategy & campaign planning)");
        println!();

        let agent = MarketingAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Marketing Strategy Plan",
            "Develop comprehensive marketing strategy and campaigns",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_content_creation_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: ContentCreationAgent (Content creation & blog article generation)");
        println!();

        let agent = ContentCreationAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Content Creation Strategy",
            "Create content strategy and blog articles",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_sns_strategy_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: SNSStrategyAgent (Social media strategy & community management)");
        println!();

        let agent = SNSStrategyAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "SNS Strategy Plan",
            "Develop social media strategy and community management",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_youtube_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: YouTubeAgent (YouTube strategy & video content planning)");
        println!();

        let agent = YouTubeAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "YouTube Strategy Plan",
            "Develop YouTube strategy and video content planning",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_sales_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: SalesAgent (Sales strategy & process optimization)");
        println!();

        let agent = SalesAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Sales Strategy Plan",
            "Develop sales strategy and process optimization",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_crm_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: CRMAgent (CRM strategy & customer relationship management)");
        println!();

        let agent = CRMAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "CRM Strategy Plan",
            "Develop CRM strategy and customer relationship management",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    async fn run_analytics_agent(&self, config: AgentConfig) -> Result<()> {
        let issue_number = self.issue.ok_or(CliError::MissingIssueNumber)?;

        println!("  Issue: #{}", issue_number);
        println!("  Type: AnalyticsAgent (Data analytics & business intelligence)");
        println!();

        let agent = AnalyticsAgent::new(config);
        let task = self.create_business_task(
            issue_number,
            "Analytics Strategy Plan",
            "Develop analytics strategy and business intelligence",
        );

        println!("{}", "  Executing...".dimmed());
        let result = agent.execute(&task).await?;
        self.display_business_result(result)?;

        Ok(())
    }

    // Helper methods
    fn create_business_task(&self, issue_number: u64, title: &str, description: &str) -> Task {
        Task {
            id: format!("business-issue-{}", issue_number),
            title: title.to_string(),
            description: description.to_string(),
            task_type: miyabi_types::task::TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: Some(60), // 1 hour for business tasks
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(HashMap::from([(
                "issue_number".to_string(),
                serde_json::json!(issue_number),
            )])),
        }
    }

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
                data.get("summary").unwrap_or(&serde_json::Value::String(
                    "No summary available".to_string()
                ))
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
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CoordinatorAgent
        ));

        let cmd = AgentCommand::new("codegen".to_string(), None, None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CodeGenAgent
        ));

        let cmd = AgentCommand::new("code-gen".to_string(), None, None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CodeGenAgent
        ));

        let cmd = AgentCommand::new("invalid".to_string(), None, None);
        assert!(cmd.parse_agent_type().is_err());

        // Test Business Agent types
        let cmd = AgentCommand::new("ai-entrepreneur".to_string(), None, None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::AIEntrepreneurAgent
        ));

        let cmd = AgentCommand::new("entrepreneur".to_string(), None, None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::AIEntrepreneurAgent
        ));

        let cmd = AgentCommand::new("marketing".to_string(), None, None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::MarketingAgent
        ));

        let cmd = AgentCommand::new("analytics".to_string(), None, None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::AnalyticsAgent
        ));
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
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CoordinatorAgent
        ));

        let cmd = AgentCommand::new("CoDeGen".to_string(), None, None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::CodeGenAgent
        ));
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
    fn test_create_business_task() {
        let cmd = AgentCommand::new("marketing".to_string(), Some(42), None);
        let task = cmd.create_business_task(42, "Test Title", "Test Description");

        assert_eq!(task.id, "business-issue-42");
        assert_eq!(task.title, "Test Title");
        assert_eq!(task.description, "Test Description");
        assert_eq!(task.priority, 1);
        assert_eq!(task.estimated_duration, Some(60));
        assert!(task.metadata.is_some());

        let metadata = task.metadata.unwrap();
        assert_eq!(metadata.get("issue_number"), Some(&serde_json::json!(42)));
    }
}
