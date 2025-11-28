//! Agent type definitions
//!
//! Rust port of TypeScript types from `packages/coding-agents/types/index.ts`

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

mod serde_path {
    use serde::{Deserialize, Deserializer, Serializer};
    use std::path::{Path, PathBuf};

    pub fn serialize_option<S>(
        value: &Option<PathBuf>,
        serializer: S,
    ) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match value {
            Some(path) => serializer.serialize_some(&path_to_string(path)),
            None => serializer.serialize_none(),
        }
    }

    pub fn deserialize_option<'de, D>(
        deserializer: D,
    ) -> std::result::Result<Option<PathBuf>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let option = Option::<String>::deserialize(deserializer)?;
        Ok(option.map(PathBuf::from))
    }

    fn path_to_string(path: &Path) -> String {
        path.to_string_lossy().into_owned()
    }
}

/// Agent execution status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentStatus {
    /// Agent is idle and ready to accept tasks
    Idle,
    /// Agent is currently executing a task
    Running,
    /// Agent successfully completed its task
    Completed,
    /// Agent failed to complete its task
    Failed,
    /// Agent escalated the task to a human operator
    Escalated,
}

/// Escalation target roles
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum EscalationTarget {
    /// Technical Lead - escalate for architectural decisions
    TechLead,
    /// Product Owner - escalate for product/feature decisions
    PO,
    /// Chief Information Security Officer - escalate for security issues
    CISO,
    /// Chief Technology Officer - escalate for strategic technical decisions
    CTO,
    /// DevOps team - escalate for infrastructure/deployment issues
    DevOps,
}

/// Agent types (9 coding agents + 14 business agents + 1 community agent)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Hash)]
pub enum AgentType {
    // Coding Agents (9)
    /// Coordinates task decomposition and agent orchestration (DAG-based)
    CoordinatorAgent,
    /// Generates code implementations with AI assistance (Claude Sonnet 4)
    CodeGenAgent,
    /// Reviews code quality and provides scoring (0-100 points)
    ReviewAgent,
    /// Analyzes issues and infers appropriate labels (AI reasoning)
    IssueAgent,
    /// Creates pull requests with Conventional Commits format
    PRAgent,
    /// Handles CI/CD deployment automation (Firebase/Vercel/AWS)
    DeploymentAgent,
    /// Automatically fixes common issues (clippy warnings, format, etc.)
    AutoFixAgent,
    /// Monitors and refreshes stale issues/PRs (Toyota Lean methodology)
    WaterSpiderAgent,
    /// Refreshes and updates project status periodically
    RefresherAgent,

    // Business Agents (14)
    /// AI Entrepreneur - comprehensive business plan generation (8 phases)
    AIEntrepreneurAgent,
    /// Product Concept - USP, business model, revenue model design
    ProductConceptAgent,
    /// Product Design - detailed service design (6-month roadmap)
    ProductDesignAgent,
    /// Funnel Design - customer journey optimization (認知→購入→LTV)
    FunnelDesignAgent,
    /// Persona - detailed target customer personas (3-5 personas)
    PersonaAgent,
    /// Self Analysis - career/skill/achievement analysis
    SelfAnalysisAgent,
    /// Market Research - market trend analysis and competitor research (20+ companies)
    MarketResearchAgent,
    /// Marketing - advertising, SEO, SNS strategy execution
    MarketingAgent,
    /// Content Creation - blog, video, tutorial content production
    ContentCreationAgent,
    /// SNS Strategy - Twitter/Instagram/LinkedIn strategy and calendar
    SNSStrategyAgent,
    /// YouTube - channel optimization and content planning (13 workflows)
    YouTubeAgent,
    /// Sales - lead generation and conversion rate optimization
    SalesAgent,
    /// CRM - customer relationship management and LTV maximization
    CRMAgent,
    /// Analytics - data analysis, PDCA cycle, continuous improvement
    AnalyticsAgent,
    /// Jonathan Ive Design - UI/UX design review with Apple design principles
    JonathanIveDesignAgent,

    // Community Agents (1)
    /// Discord Community - community management and moderation
    DiscordCommunity,
}

impl AgentType {
    /// Convert to lowercase string (for file paths, etc.)
    pub fn as_str(&self) -> &'static str {
        match self {
            // Coding Agents
            AgentType::CoordinatorAgent => "coordinator",
            AgentType::CodeGenAgent => "codegen",
            AgentType::ReviewAgent => "review",
            AgentType::IssueAgent => "issue",
            AgentType::PRAgent => "pr",
            AgentType::DeploymentAgent => "deployment",
            AgentType::AutoFixAgent => "autofix",
            AgentType::WaterSpiderAgent => "waterspider",
            AgentType::RefresherAgent => "refresher",

            // Business Agents
            AgentType::AIEntrepreneurAgent => "ai-entrepreneur",
            AgentType::ProductConceptAgent => "product-concept",
            AgentType::ProductDesignAgent => "product-design",
            AgentType::FunnelDesignAgent => "funnel-design",
            AgentType::PersonaAgent => "persona",
            AgentType::SelfAnalysisAgent => "self-analysis",
            AgentType::MarketResearchAgent => "market-research",
            AgentType::MarketingAgent => "marketing",
            AgentType::ContentCreationAgent => "content-creation",
            AgentType::SNSStrategyAgent => "sns-strategy",
            AgentType::YouTubeAgent => "youtube",
            AgentType::SalesAgent => "sales",
            AgentType::CRMAgent => "crm",
            AgentType::AnalyticsAgent => "analytics",
            AgentType::JonathanIveDesignAgent => "jonathan-ive-design",

            // Community Agents
            AgentType::DiscordCommunity => "discord-community",
        }
    }
}

impl std::str::FromStr for AgentType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            // Coding Agents
            "coordinator" | "coordinatoragent" => Ok(AgentType::CoordinatorAgent),
            "codegen" | "codegenagent" => Ok(AgentType::CodeGenAgent),
            "review" | "reviewagent" => Ok(AgentType::ReviewAgent),
            "issue" | "issueagent" => Ok(AgentType::IssueAgent),
            "pr" | "pragent" => Ok(AgentType::PRAgent),
            "deployment" | "deploymentagent" => Ok(AgentType::DeploymentAgent),
            "autofix" | "autofixagent" => Ok(AgentType::AutoFixAgent),
            "waterspider" | "waterspideragent" => Ok(AgentType::WaterSpiderAgent),
            "refresher" | "refresheragent" => Ok(AgentType::RefresherAgent),

            // Business Agents
            "ai-entrepreneur" | "aientrepreneuragent" => Ok(AgentType::AIEntrepreneurAgent),
            "product-concept" | "productconceptagent" => Ok(AgentType::ProductConceptAgent),
            "product-design" | "productdesignagent" => Ok(AgentType::ProductDesignAgent),
            "funnel-design" | "funneldesignagent" => Ok(AgentType::FunnelDesignAgent),
            "persona" | "personaagent" => Ok(AgentType::PersonaAgent),
            "self-analysis" | "selfanalysisagent" => Ok(AgentType::SelfAnalysisAgent),
            "market-research" | "marketresearchagent" => Ok(AgentType::MarketResearchAgent),
            "marketing" | "marketingagent" => Ok(AgentType::MarketingAgent),
            "content-creation" | "contentcreationagent" => Ok(AgentType::ContentCreationAgent),
            "sns-strategy" | "snsstrategyagent" => Ok(AgentType::SNSStrategyAgent),
            "youtube" | "youtubeagent" => Ok(AgentType::YouTubeAgent),
            "sales" | "salesagent" => Ok(AgentType::SalesAgent),
            "crm" | "crmagent" => Ok(AgentType::CRMAgent),
            "analytics" | "analyticsagent" => Ok(AgentType::AnalyticsAgent),
            "jonathan-ive-design" | "jonathanivedesignagent" => {
                Ok(AgentType::JonathanIveDesignAgent)
            }

            // Community Agents
            "discord-community" | "discordcommunity" => Ok(AgentType::DiscordCommunity),

            _ => Err(format!("Unknown agent type: {}", s)),
        }
    }
}

/// Issue severity levels (ordered from lowest to highest severity for Ord)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum Severity {
    /// Trivial severity - cosmetic issues, typos
    #[serde(rename = "Sev.5-Trivial")]
    Trivial,
    /// Low severity - minor issues with easy workarounds
    #[serde(rename = "Sev.4-Low")]
    Low,
    /// Medium severity - moderate impact on functionality
    #[serde(rename = "Sev.3-Medium")]
    Medium,
    /// High severity - significant impact, requires immediate attention
    #[serde(rename = "Sev.2-High")]
    High,
    /// Critical severity - system down, security vulnerabilities
    #[serde(rename = "Sev.1-Critical")]
    Critical,
}

/// Impact level (ordered from lowest to highest impact for Ord)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum ImpactLevel {
    /// Low impact - affects few users or minor functionality
    Low,
    /// Medium impact - affects moderate number of users
    Medium,
    /// High impact - affects many users or critical functionality
    High,
    /// Critical impact - affects all users or system-wide failure
    Critical,
}

/// Agent execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResult {
    /// Result status (Success/Failed/Escalated)
    pub status: ResultStatus,
    /// Optional result data (agent-specific)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
    /// Error message if status is Failed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    /// Execution metrics (duration, quality score, etc.)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metrics: Option<AgentMetrics>,
    /// Escalation information if status is Escalated
    #[serde(skip_serializing_if = "Option::is_none")]
    pub escalation: Option<EscalationInfo>,
}

/// Result status for agent execution
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ResultStatus {
    /// Agent successfully completed the task
    Success,
    /// Agent failed to complete the task
    Failed,
    /// Agent escalated the task to a human operator
    Escalated,
}

/// Agent execution metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMetrics {
    /// Task identifier
    pub task_id: String,
    /// Agent type that executed the task
    pub agent_type: AgentType,
    /// Execution duration in milliseconds
    pub duration_ms: u64,
    /// Quality score (0-100) - ReviewAgent only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quality_score: Option<u8>,
    /// Number of lines changed - CodeGenAgent only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lines_changed: Option<u32>,
    /// Number of tests added - CodeGenAgent only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tests_added: Option<u32>,
    /// Test coverage percentage - ReviewAgent only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coverage_percent: Option<f32>,
    /// Number of errors found - ReviewAgent only
    #[serde(skip_serializing_if = "Option::is_none")]
    pub errors_found: Option<u32>,
    /// Timestamp of execution
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Escalation information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationInfo {
    /// Reason for escalation
    pub reason: String,
    /// Target role for escalation
    pub target: EscalationTarget,
    /// Severity level of the issue
    pub severity: Severity,
    /// Additional context (issue URLs, error messages, etc.)
    pub context: HashMap<String, serde_json::Value>,
    /// Timestamp of escalation
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// Agent configuration
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AgentConfig {
    /// Device identifier (e.g., "MacBook-Pro", "GitHub-Actions")
    pub device_identifier: String,
    /// GitHub personal access token (ghp_xxx or github_pat_xxx)
    pub github_token: String,
    // Repository information
    /// GitHub repository owner (e.g., "ShunsukeHayashi")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo_owner: Option<String>,
    /// GitHub repository name (e.g., "Miyabi")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo_name: Option<String>,
    /// Enable Claude Code Task tool integration
    pub use_task_tool: bool,
    /// Enable Git Worktree-based parallel execution
    pub use_worktree: bool,
    /// Base path for worktrees (e.g., ".worktrees" or "/tmp/wt")
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        serialize_with = "serde_path::serialize_option",
        deserialize_with = "serde_path::deserialize_option"
    )]
    pub worktree_base_path: Option<PathBuf>,
    /// Directory for agent execution logs (e.g., ".ai/logs")
    pub log_directory: String,
    /// Directory for agent reports (e.g., ".ai/reports")
    pub report_directory: String,
    /// GitHub username of Technical Lead (for escalation)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tech_lead_github_username: Option<String>,
    /// GitHub username of CISO (for security escalation)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ciso_github_username: Option<String>,
    /// GitHub username of Product Owner (for product escalation)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub po_github_username: Option<String>,
    // Deployment config
    /// Firebase production project ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub firebase_production_project: Option<String>,
    /// Firebase staging project ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub firebase_staging_project: Option<String>,
    /// Production deployment URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub production_url: Option<String>,
    /// Staging deployment URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub staging_url: Option<String>,
}

impl AgentConfig {
    /// Validate agent configuration fields
    ///
    /// # Returns
    /// * `Ok(())` if all validations pass
    /// * `Err(String)` with detailed error message if validation fails
    pub fn validate(&self) -> Result<(), String> {
        // Validate device_identifier
        if self.device_identifier.is_empty() {
            return Err("Device identifier cannot be empty. \
                Hint: Use a descriptive name like 'MacBook-Pro' or 'GitHub-Actions'"
                .to_string());
        }

        if self.device_identifier.len() > 50 {
            return Err(format!(
                "Device identifier too long ({} characters). Maximum 50 characters allowed. \
                Hint: Use shorter identifier like 'macbook' or 'ci-runner'",
                self.device_identifier.len()
            ));
        }

        // Validate github_token (basic format check)
        if self.github_token.is_empty() {
            return Err("GitHub token cannot be empty. \
                Hint: Set GITHUB_TOKEN environment variable or provide token in config"
                .to_string());
        }

        if self.github_token.len() < 20 {
            return Err(format!(
                "GitHub token too short ({} characters). Valid tokens are at least 20 characters. \
                Hint: Check token format (should start with 'ghp_' or 'github_pat_')",
                self.github_token.len()
            ));
        }

        // Validate repo_owner and repo_name consistency
        match (&self.repo_owner, &self.repo_name) {
            (Some(_), None) => {
                return Err("Repository name is required when owner is specified. \
                    Hint: Set both repo_owner and repo_name, or omit both"
                    .to_string());
            }
            (None, Some(_)) => {
                return Err("Repository owner is required when name is specified. \
                    Hint: Set both repo_owner and repo_name, or omit both"
                    .to_string());
            }
            _ => {}
        }

        // Validate log_directory
        if self.log_directory.is_empty() {
            return Err("Log directory cannot be empty. \
                Hint: Use './logs' or '/var/log/miyabi'"
                .to_string());
        }

        // Validate report_directory
        if self.report_directory.is_empty() {
            return Err("Report directory cannot be empty. \
                Hint: Use './reports' or '/var/reports/miyabi'"
                .to_string());
        }

        // Validate worktree_base_path if use_worktree is enabled
        if self.use_worktree && self.worktree_base_path.is_none() {
            return Err(
                "Worktree base path is required when use_worktree is enabled. \
                Hint: Set worktree_base_path to '.worktrees' or absolute path"
                    .to_string(),
            );
        }

        // Validate URL formats if provided
        if let Some(ref url) = self.production_url {
            if !url.starts_with("http://") && !url.starts_with("https://") {
                return Err(format!(
                    "Invalid production URL format: '{}'. \
                    Hint: URL must start with 'http://' or 'https://'",
                    url
                ));
            }
        }

        if let Some(ref url) = self.staging_url {
            if !url.starts_with("http://") && !url.starts_with("https://") {
                return Err(format!(
                    "Invalid staging URL format: '{}'. \
                    Hint: URL must start with 'http://' or 'https://'",
                    url
                ));
            }
        }

        Ok(())
    }

    /// Check if the config is set up for GitHub repository operations
    pub fn has_repo_config(&self) -> bool {
        self.repo_owner.is_some() && self.repo_name.is_some()
    }

    /// Check if the config has escalation targets configured
    pub fn has_escalation_targets(&self) -> bool {
        self.tech_lead_github_username.is_some()
            || self.ciso_github_username.is_some()
            || self.po_github_username.is_some()
    }

    /// Check if deployment configuration is complete
    pub fn has_deployment_config(&self) -> bool {
        self.firebase_production_project.is_some()
            && self.firebase_staging_project.is_some()
            && self.production_url.is_some()
            && self.staging_url.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================================================
    // AgentType Tests
    // ========================================================================

    #[test]
    fn test_agent_type_as_str() {
        // Coding Agents
        assert_eq!(AgentType::CoordinatorAgent.as_str(), "coordinator");
        assert_eq!(AgentType::CodeGenAgent.as_str(), "codegen");
        assert_eq!(AgentType::ReviewAgent.as_str(), "review");
        assert_eq!(AgentType::IssueAgent.as_str(), "issue");
        assert_eq!(AgentType::PRAgent.as_str(), "pr");
        assert_eq!(AgentType::DeploymentAgent.as_str(), "deployment");
        assert_eq!(AgentType::AutoFixAgent.as_str(), "autofix");
        assert_eq!(AgentType::WaterSpiderAgent.as_str(), "waterspider");
        assert_eq!(AgentType::RefresherAgent.as_str(), "refresher");

        // Business Agents
        assert_eq!(AgentType::AIEntrepreneurAgent.as_str(), "ai-entrepreneur");
        assert_eq!(AgentType::ProductConceptAgent.as_str(), "product-concept");
        assert_eq!(AgentType::ProductDesignAgent.as_str(), "product-design");
        assert_eq!(AgentType::FunnelDesignAgent.as_str(), "funnel-design");
        assert_eq!(AgentType::PersonaAgent.as_str(), "persona");
        assert_eq!(AgentType::SelfAnalysisAgent.as_str(), "self-analysis");
        assert_eq!(AgentType::MarketResearchAgent.as_str(), "market-research");
        assert_eq!(AgentType::MarketingAgent.as_str(), "marketing");
        assert_eq!(AgentType::ContentCreationAgent.as_str(), "content-creation");
        assert_eq!(AgentType::SNSStrategyAgent.as_str(), "sns-strategy");
        assert_eq!(AgentType::YouTubeAgent.as_str(), "youtube");
        assert_eq!(AgentType::SalesAgent.as_str(), "sales");
        assert_eq!(AgentType::CRMAgent.as_str(), "crm");
        assert_eq!(AgentType::AnalyticsAgent.as_str(), "analytics");
    }

    #[test]
    fn test_agent_type_serialization() {
        let agent = AgentType::CoordinatorAgent;
        let json = serde_json::to_string(&agent).unwrap();
        assert_eq!(json, "\"CoordinatorAgent\"");

        let agent = AgentType::CodeGenAgent;
        let json = serde_json::to_string(&agent).unwrap();
        assert_eq!(json, "\"CodeGenAgent\"");
    }

    #[test]
    fn test_agent_type_deserialization() {
        let json = "\"CoordinatorAgent\"";
        let agent: AgentType = serde_json::from_str(json).unwrap();
        assert_eq!(agent, AgentType::CoordinatorAgent);

        let json = "\"ReviewAgent\"";
        let agent: AgentType = serde_json::from_str(json).unwrap();
        assert_eq!(agent, AgentType::ReviewAgent);
    }

    #[test]
    fn test_agent_type_roundtrip() {
        let agents = vec![
            // Coding Agents
            AgentType::CoordinatorAgent,
            AgentType::CodeGenAgent,
            AgentType::ReviewAgent,
            AgentType::IssueAgent,
            AgentType::PRAgent,
            AgentType::DeploymentAgent,
            AgentType::AutoFixAgent,
            AgentType::WaterSpiderAgent,
            AgentType::RefresherAgent,
            // Business Agents
            AgentType::AIEntrepreneurAgent,
            AgentType::ProductConceptAgent,
            AgentType::ProductDesignAgent,
            AgentType::FunnelDesignAgent,
            AgentType::PersonaAgent,
            AgentType::SelfAnalysisAgent,
            AgentType::MarketResearchAgent,
            AgentType::MarketingAgent,
            AgentType::ContentCreationAgent,
            AgentType::SNSStrategyAgent,
            AgentType::YouTubeAgent,
            AgentType::SalesAgent,
            AgentType::CRMAgent,
            AgentType::AnalyticsAgent,
        ];

        for agent in agents {
            let json = serde_json::to_string(&agent).unwrap();
            let deserialized: AgentType = serde_json::from_str(&json).unwrap();
            assert_eq!(agent, deserialized);
        }
    }

    #[test]
    fn test_agent_type_hash() {
        use std::collections::HashMap;
        let mut map = HashMap::new();
        map.insert(AgentType::CoordinatorAgent, "value1");
        map.insert(AgentType::CodeGenAgent, "value2");
        assert_eq!(map.get(&AgentType::CoordinatorAgent), Some(&"value1"));
    }

    // ========================================================================
    // AgentStatus Tests
    // ========================================================================

    #[test]
    fn test_agent_status_serialization() {
        let status = AgentStatus::Completed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"completed\"");

        let status = AgentStatus::Running;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"running\"");

        let status = AgentStatus::Failed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"failed\"");
    }

    #[test]
    fn test_agent_status_deserialization() {
        let json = "\"idle\"";
        let status: AgentStatus = serde_json::from_str(json).unwrap();
        assert_eq!(status, AgentStatus::Idle);

        let json = "\"escalated\"";
        let status: AgentStatus = serde_json::from_str(json).unwrap();
        assert_eq!(status, AgentStatus::Escalated);
    }

    #[test]
    fn test_agent_status_roundtrip() {
        let statuses = vec![
            AgentStatus::Idle,
            AgentStatus::Running,
            AgentStatus::Completed,
            AgentStatus::Failed,
            AgentStatus::Escalated,
        ];

        for status in statuses {
            let json = serde_json::to_string(&status).unwrap();
            let deserialized: AgentStatus = serde_json::from_str(&json).unwrap();
            assert_eq!(status, deserialized);
        }
    }

    #[test]
    fn test_agent_status_equality() {
        assert_eq!(AgentStatus::Idle, AgentStatus::Idle);
        assert_ne!(AgentStatus::Running, AgentStatus::Completed);
    }

    // ========================================================================
    // Severity Tests
    // ========================================================================

    #[test]
    fn test_severity_ordering() {
        assert!(Severity::Critical > Severity::High);
        assert!(Severity::High > Severity::Medium);
        assert!(Severity::Medium > Severity::Low);
        assert!(Severity::Low > Severity::Trivial);
    }

    #[test]
    fn test_severity_serialization() {
        let sev = Severity::Critical;
        let json = serde_json::to_string(&sev).unwrap();
        assert_eq!(json, "\"Sev.1-Critical\"");

        let sev = Severity::High;
        let json = serde_json::to_string(&sev).unwrap();
        assert_eq!(json, "\"Sev.2-High\"");

        let sev = Severity::Trivial;
        let json = serde_json::to_string(&sev).unwrap();
        assert_eq!(json, "\"Sev.5-Trivial\"");
    }

    #[test]
    fn test_severity_deserialization() {
        let json = "\"Sev.1-Critical\"";
        let sev: Severity = serde_json::from_str(json).unwrap();
        assert_eq!(sev, Severity::Critical);

        let json = "\"Sev.3-Medium\"";
        let sev: Severity = serde_json::from_str(json).unwrap();
        assert_eq!(sev, Severity::Medium);
    }

    #[test]
    fn test_severity_roundtrip() {
        let severities = vec![
            Severity::Critical,
            Severity::High,
            Severity::Medium,
            Severity::Low,
            Severity::Trivial,
        ];

        for sev in severities {
            let json = serde_json::to_string(&sev).unwrap();
            let deserialized: Severity = serde_json::from_str(&json).unwrap();
            assert_eq!(sev, deserialized);
        }
    }

    // ========================================================================
    // EscalationTarget Tests
    // ========================================================================

    #[test]
    fn test_escalation_target_serialization() {
        let target = EscalationTarget::TechLead;
        let json = serde_json::to_string(&target).unwrap();
        assert_eq!(json, "\"TechLead\"");

        let target = EscalationTarget::CISO;
        let json = serde_json::to_string(&target).unwrap();
        assert_eq!(json, "\"CISO\"");
    }

    #[test]
    fn test_escalation_target_deserialization() {
        let json = "\"PO\"";
        let target: EscalationTarget = serde_json::from_str(json).unwrap();
        assert_eq!(target, EscalationTarget::PO);

        let json = "\"DevOps\"";
        let target: EscalationTarget = serde_json::from_str(json).unwrap();
        assert_eq!(target, EscalationTarget::DevOps);
    }

    #[test]
    fn test_escalation_target_roundtrip() {
        let targets = vec![
            EscalationTarget::TechLead,
            EscalationTarget::PO,
            EscalationTarget::CISO,
            EscalationTarget::CTO,
            EscalationTarget::DevOps,
        ];

        for target in targets {
            let json = serde_json::to_string(&target).unwrap();
            let deserialized: EscalationTarget = serde_json::from_str(&json).unwrap();
            assert_eq!(target, deserialized);
        }
    }

    // ========================================================================
    // ImpactLevel Tests
    // ========================================================================

    #[test]
    fn test_impact_level_ordering() {
        assert!(ImpactLevel::Critical > ImpactLevel::High);
        assert!(ImpactLevel::High > ImpactLevel::Medium);
        assert!(ImpactLevel::Medium > ImpactLevel::Low);
    }

    #[test]
    fn test_impact_level_serialization() {
        let impact = ImpactLevel::Critical;
        let json = serde_json::to_string(&impact).unwrap();
        assert_eq!(json, "\"Critical\"");
    }

    #[test]
    fn test_impact_level_roundtrip() {
        let impacts = vec![
            ImpactLevel::Critical,
            ImpactLevel::High,
            ImpactLevel::Medium,
            ImpactLevel::Low,
        ];

        for impact in impacts {
            let json = serde_json::to_string(&impact).unwrap();
            let deserialized: ImpactLevel = serde_json::from_str(&json).unwrap();
            assert_eq!(impact, deserialized);
        }
    }

    // ========================================================================
    // ResultStatus Tests
    // ========================================================================

    #[test]
    fn test_result_status_serialization() {
        let status = ResultStatus::Success;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"success\"");

        let status = ResultStatus::Failed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"failed\"");

        let status = ResultStatus::Escalated;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"escalated\"");
    }

    #[test]
    fn test_result_status_roundtrip() {
        let statuses = vec![
            ResultStatus::Success,
            ResultStatus::Failed,
            ResultStatus::Escalated,
        ];

        for status in statuses {
            let json = serde_json::to_string(&status).unwrap();
            let deserialized: ResultStatus = serde_json::from_str(&json).unwrap();
            assert_eq!(status, deserialized);
        }
    }

    // ========================================================================
    // AgentResult Tests
    // ========================================================================

    #[test]
    fn test_agent_result_serialization_minimal() {
        let result = AgentResult {
            status: ResultStatus::Success,
            data: None,
            error: None,
            metrics: None,
            escalation: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["status"], "success");
        assert!(parsed.get("data").is_none());
        assert!(parsed.get("error").is_none());
    }

    #[test]
    fn test_agent_result_serialization_with_data() {
        let result = AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::json!({"key": "value"})),
            error: None,
            metrics: None,
            escalation: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["data"]["key"], "value");
    }

    #[test]
    fn test_agent_result_serialization_with_error() {
        let result = AgentResult {
            status: ResultStatus::Failed,
            data: None,
            error: Some("Test error message".to_string()),
            metrics: None,
            escalation: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["status"], "failed");
        assert_eq!(parsed["error"], "Test error message");
    }

    #[test]
    fn test_agent_result_roundtrip() {
        let result = AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::json!({"test": 123})),
            error: None,
            metrics: None,
            escalation: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        let deserialized: AgentResult = serde_json::from_str(&json).unwrap();
        assert_eq!(result.status, deserialized.status);
    }

    // ========================================================================
    // AgentMetrics Tests
    // ========================================================================

    #[test]
    fn test_agent_metrics_serialization() {
        let metrics = AgentMetrics {
            task_id: "task-123".to_string(),
            agent_type: AgentType::CodeGenAgent,
            duration_ms: 5000,
            quality_score: Some(85),
            lines_changed: Some(150),
            tests_added: Some(10),
            coverage_percent: Some(82.5),
            errors_found: None,
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&metrics).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["task_id"], "task-123");
        assert_eq!(parsed["agent_type"], "CodeGenAgent");
        assert_eq!(parsed["duration_ms"], 5000);
        assert_eq!(parsed["quality_score"], 85);
    }

    #[test]
    fn test_agent_metrics_optional_fields() {
        let metrics = AgentMetrics {
            task_id: "task-456".to_string(),
            agent_type: AgentType::ReviewAgent,
            duration_ms: 1000,
            quality_score: None,
            lines_changed: None,
            tests_added: None,
            coverage_percent: None,
            errors_found: Some(5),
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&metrics).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("quality_score").is_none());
        assert_eq!(parsed["errors_found"], 5);
    }

    #[test]
    fn test_agent_metrics_roundtrip() {
        let metrics = AgentMetrics {
            task_id: "task-789".to_string(),
            agent_type: AgentType::DeploymentAgent,
            duration_ms: 10000,
            quality_score: Some(95),
            lines_changed: Some(50),
            tests_added: Some(5),
            coverage_percent: Some(90.0),
            errors_found: None,
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&metrics).unwrap();
        let deserialized: AgentMetrics = serde_json::from_str(&json).unwrap();
        assert_eq!(metrics.task_id, deserialized.task_id);
        assert_eq!(metrics.agent_type, deserialized.agent_type);
        assert_eq!(metrics.duration_ms, deserialized.duration_ms);
    }

    // ========================================================================
    // EscalationInfo Tests
    // ========================================================================

    #[test]
    fn test_escalation_info_serialization() {
        let mut context = HashMap::new();
        context.insert(
            "issue_url".to_string(),
            serde_json::json!("https://github.com/user/repo/issues/123"),
        );

        let escalation = EscalationInfo {
            reason: "Security vulnerability detected".to_string(),
            target: EscalationTarget::CISO,
            severity: Severity::Critical,
            context,
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&escalation).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["reason"], "Security vulnerability detected");
        assert_eq!(parsed["target"], "CISO");
        assert_eq!(parsed["severity"], "Sev.1-Critical");
    }

    #[test]
    fn test_escalation_info_roundtrip() {
        let mut context = HashMap::new();
        context.insert("pr_number".to_string(), serde_json::json!(456));

        let escalation = EscalationInfo {
            reason: "Build failed multiple times".to_string(),
            target: EscalationTarget::DevOps,
            severity: Severity::High,
            context,
            timestamp: chrono::Utc::now(),
        };

        let json = serde_json::to_string(&escalation).unwrap();
        let deserialized: EscalationInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(escalation.reason, deserialized.reason);
        assert_eq!(escalation.target, deserialized.target);
        assert_eq!(escalation.severity, deserialized.severity);
    }

    // ========================================================================
    // AgentConfig Tests
    // ========================================================================

    #[test]
    fn test_agent_config_serialization() {
        let config = AgentConfig {
            device_identifier: "MacBook-Pro".to_string(),
            github_token: "ghp_test_token".to_string(),
            repo_owner: Some("test-owner".to_string()),
            repo_name: Some("test-repo".to_string()),
            use_task_tool: true,
            use_worktree: true,
            worktree_base_path: Some(PathBuf::from("/tmp/worktrees")),
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: Some("tech-lead".to_string()),
            ciso_github_username: None,
            po_github_username: Some("product-owner".to_string()),
            firebase_production_project: Some("prod-project".to_string()),
            firebase_staging_project: Some("staging-project".to_string()),
            production_url: Some("https://prod.example.com".to_string()),
            staging_url: Some("https://staging.example.com".to_string()),
        };

        let json = serde_json::to_string(&config).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["device_identifier"], "MacBook-Pro");
        assert_eq!(parsed["repo_owner"], "test-owner");
        assert_eq!(parsed["repo_name"], "test-repo");
        assert_eq!(parsed["use_task_tool"], true);
        assert_eq!(parsed["worktree_base_path"], "/tmp/worktrees");
    }

    #[test]
    fn test_agent_config_optional_fields() {
        let config = AgentConfig {
            device_identifier: "GitHub-Actions".to_string(),
            github_token: "ghp_ci_token".to_string(),
            repo_owner: None,
            repo_name: None,
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
        };

        let json = serde_json::to_string(&config).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.get("repo_owner").is_none());
        assert!(parsed.get("repo_name").is_none());
        assert!(parsed.get("worktree_base_path").is_none());
        assert!(parsed.get("tech_lead_github_username").is_none());
    }

    #[test]
    fn test_agent_config_roundtrip() {
        let config = AgentConfig {
            device_identifier: "Test-Device".to_string(),
            github_token: "test_token".to_string(),
            repo_owner: Some("owner".to_string()),
            repo_name: Some("repo".to_string()),
            use_task_tool: true,
            use_worktree: true,
            worktree_base_path: Some(PathBuf::from("/var/worktrees")),
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: Some("lead".to_string()),
            ciso_github_username: Some("ciso".to_string()),
            po_github_username: Some("po".to_string()),
            firebase_production_project: Some("prod".to_string()),
            firebase_staging_project: Some("staging".to_string()),
            production_url: Some("https://prod.com".to_string()),
            staging_url: Some("https://staging.com".to_string()),
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: AgentConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.device_identifier, deserialized.device_identifier);
        assert_eq!(config.repo_owner, deserialized.repo_owner);
        assert_eq!(config.repo_name, deserialized.repo_name);
        assert_eq!(config.use_task_tool, deserialized.use_task_tool);
        assert_eq!(config.worktree_base_path, deserialized.worktree_base_path);
    }

    // ========================================================================
    // AgentConfig Validation Tests
    // ========================================================================

    fn create_valid_agent_config() -> AgentConfig {
        AgentConfig {
            device_identifier: "test-device".to_string(),
            github_token: "ghp_valid_token_12345678".to_string(),
            repo_owner: Some("owner".to_string()),
            repo_name: Some("repo".to_string()),
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

    #[test]
    fn test_agent_config_validate_valid() {
        let config = create_valid_agent_config();
        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_agent_config_validate_empty_device_identifier() {
        let mut config = create_valid_agent_config();
        config.device_identifier = "".to_string();
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Device identifier cannot be empty"));
        assert!(err_msg.contains("Hint:"));
    }

    #[test]
    fn test_agent_config_validate_long_device_identifier() {
        let mut config = create_valid_agent_config();
        config.device_identifier = "a".repeat(51);
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Device identifier too long"));
        assert!(err_msg.contains("51 characters"));
    }

    #[test]
    fn test_agent_config_validate_empty_github_token() {
        let mut config = create_valid_agent_config();
        config.github_token = "".to_string();
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("GitHub token cannot be empty"));
    }

    #[test]
    fn test_agent_config_validate_short_github_token() {
        let mut config = create_valid_agent_config();
        config.github_token = "short".to_string();
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("GitHub token too short"));
        assert!(err_msg.contains("5 characters"));
    }

    #[test]
    fn test_agent_config_validate_repo_owner_without_name() {
        let mut config = create_valid_agent_config();
        config.repo_owner = Some("owner".to_string());
        config.repo_name = None;
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Repository name is required"));
    }

    #[test]
    fn test_agent_config_validate_repo_name_without_owner() {
        let mut config = create_valid_agent_config();
        config.repo_owner = None;
        config.repo_name = Some("repo".to_string());
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Repository owner is required"));
    }

    #[test]
    fn test_agent_config_validate_empty_log_directory() {
        let mut config = create_valid_agent_config();
        config.log_directory = "".to_string();
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Log directory cannot be empty"));
    }

    #[test]
    fn test_agent_config_validate_empty_report_directory() {
        let mut config = create_valid_agent_config();
        config.report_directory = "".to_string();
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Report directory cannot be empty"));
    }

    #[test]
    fn test_agent_config_validate_worktree_without_path() {
        let mut config = create_valid_agent_config();
        config.use_worktree = true;
        config.worktree_base_path = None;
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Worktree base path is required"));
    }

    #[test]
    fn test_agent_config_validate_invalid_production_url() {
        let mut config = create_valid_agent_config();
        config.production_url = Some("invalid-url".to_string());
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Invalid production URL format"));
        assert!(err_msg.contains("invalid-url"));
    }

    #[test]
    fn test_agent_config_validate_invalid_staging_url() {
        let mut config = create_valid_agent_config();
        config.staging_url = Some("ftp://staging.com".to_string());
        let result = config.validate();
        assert!(result.is_err());
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("Invalid staging URL format"));
    }

    #[test]
    fn test_agent_config_validate_valid_urls() {
        let mut config = create_valid_agent_config();
        config.production_url = Some("https://prod.com".to_string());
        config.staging_url = Some("http://staging.com".to_string());
        assert!(config.validate().is_ok());
    }

    // ========================================================================
    // AgentConfig Helper Methods Tests
    // ========================================================================

    #[test]
    fn test_agent_config_has_repo_config() {
        let mut config = create_valid_agent_config();
        config.repo_owner = Some("owner".to_string());
        config.repo_name = Some("repo".to_string());
        assert!(config.has_repo_config());

        config.repo_owner = None;
        assert!(!config.has_repo_config());

        config.repo_owner = Some("owner".to_string());
        config.repo_name = None;
        assert!(!config.has_repo_config());
    }

    #[test]
    fn test_agent_config_has_escalation_targets() {
        let mut config = create_valid_agent_config();
        assert!(!config.has_escalation_targets());

        config.tech_lead_github_username = Some("lead".to_string());
        assert!(config.has_escalation_targets());

        config.tech_lead_github_username = None;
        config.ciso_github_username = Some("ciso".to_string());
        assert!(config.has_escalation_targets());

        config.ciso_github_username = None;
        config.po_github_username = Some("po".to_string());
        assert!(config.has_escalation_targets());
    }

    #[test]
    fn test_agent_config_has_deployment_config() {
        let mut config = create_valid_agent_config();
        assert!(!config.has_deployment_config());

        config.firebase_production_project = Some("prod".to_string());
        assert!(!config.has_deployment_config());

        config.firebase_staging_project = Some("staging".to_string());
        assert!(!config.has_deployment_config());

        config.production_url = Some("https://prod.com".to_string());
        assert!(!config.has_deployment_config());

        config.staging_url = Some("https://staging.com".to_string());
        assert!(config.has_deployment_config());
    }
}
