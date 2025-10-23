//! Agent command - Run agents

use crate::error::{CliError, Result};
use crate::worktree::default_worktree_base_dir;
use colored::Colorize;
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
            worktree_base_path: Some(default_worktree_base_dir()),
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

    fn git_root(&self) -> Result<PathBuf> {
        find_git_root(None).map_err(|e| CliError::GitConfig(e.to_string()))
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
    /// - <https://github.com/owner/repo>
    /// - <https://github.com/owner/repo.git>
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
        println!();

        // Create agent with lifecycle hooks
        let mut agent = HookedAgent::new(CodeGenAgent::new(config.clone()));
        self.register_standard_hooks(&mut agent, &config);

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

        // Test Business Agent types
        let cmd = AgentCommand::new("ai-entrepreneur".to_string(), None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::AIEntrepreneurAgent
        ));

        let cmd = AgentCommand::new("entrepreneur".to_string(), None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::AIEntrepreneurAgent
        ));

        let cmd = AgentCommand::new("marketing".to_string(), None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::MarketingAgent
        ));

        let cmd = AgentCommand::new("analytics".to_string(), None);
        assert!(matches!(
            cmd.parse_agent_type().unwrap(),
            AgentType::AnalyticsAgent
        ));
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
