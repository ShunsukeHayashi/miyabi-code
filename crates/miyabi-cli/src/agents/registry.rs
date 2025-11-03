use std::collections::HashMap;

use async_trait::async_trait;
use once_cell::sync::Lazy;

use miyabi_agent_business::{
    AIEntrepreneurAgent, AnalyticsAgent, CRMAgent, ContentCreationAgent, FunnelDesignAgent,
    MarketResearchAgent, MarketingAgent, PersonaAgent, ProductConceptAgent, ProductDesignAgent,
    SNSStrategyAgent, SalesAgent, SelfAnalysisAgent, YouTubeAgent,
};
use miyabi_agent_codegen::CodeGenAgent;
use miyabi_agent_coordinator::CoordinatorAgentWithLLM;
use miyabi_agent_core::{AuditLogHook, BaseAgent, EnvironmentCheckHook, HookedAgent, MetricsHook};
use miyabi_agent_review::ReviewAgent;
use miyabi_agent_workflow::{DeploymentAgent, IssueAgent, PRAgent};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, AgentType, Task};

use super::task::{IssueTaskTemplate, TaskFactory};

type AgentBuilder = fn(AgentConfig) -> BoxedAgent;

/// Category classification for agents.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AgentCategory {
    Coding,
    Business,
}

/// Dynamically dispatched agent wrapper so we can use HookedAgent without concrete types.
pub struct BoxedAgent {
    inner: Box<dyn BaseAgent>,
}

impl BoxedAgent {
    fn new(inner: Box<dyn BaseAgent>) -> Self {
        Self { inner }
    }

    fn from_agent<A>(agent: A) -> Self
    where
        A: BaseAgent + 'static,
    {
        Self::new(Box::new(agent) as Box<dyn BaseAgent>)
    }
}

#[async_trait]
impl BaseAgent for BoxedAgent {
    fn agent_type(&self) -> AgentType {
        self.inner.agent_type()
    }

    async fn execute(&self, task: &Task) -> miyabi_types::error::Result<miyabi_types::AgentResult> {
        self.inner.execute(task).await
    }
}

/// Descriptor providing metadata and construction helpers for each agent.
pub struct AgentDescriptor {
    pub agent_type: AgentType,
    #[allow(dead_code)]
    pub display_name: &'static str,
    #[allow(dead_code)]
    pub category: AgentCategory,
    pub required_env: &'static [&'static str],
    pub default_issue_template: Option<IssueTaskTemplate>,
    builder: AgentBuilder,
}

impl AgentDescriptor {
    fn new(
        agent_type: AgentType,
        display_name: &'static str,
        category: AgentCategory,
        required_env: &'static [&'static str],
        default_issue_template: Option<IssueTaskTemplate>,
        builder: AgentBuilder,
    ) -> Self {
        Self {
            agent_type,
            display_name,
            category,
            required_env,
            default_issue_template,
            builder,
        }
    }

    /// Instantiate a hooked agent with standard lifecycle hooks applied.
    pub fn instantiate(&self, config: &AgentConfig) -> HookedAgent<BoxedAgent> {
        let mut agent = HookedAgent::new((self.builder)(config.clone()));
        agent.register_hook(MetricsHook::new());

        if !self.required_env.is_empty() {
            agent.register_hook(EnvironmentCheckHook::new(self.required_env.iter().copied()));
        }

        agent.register_hook(AuditLogHook::new(config.log_directory.clone()));
        agent
    }

    /// Build an issue-scoped task using the registered template.
    pub fn build_issue_task(
        &self,
        issue_number: u64,
        metadata: Option<HashMap<String, serde_json::Value>>,
        include_default_issue_metadata: bool,
    ) -> Option<Task> {
        self.default_issue_template.map(|template| {
            TaskFactory::build_issue_task(
                issue_number,
                self.agent_type,
                &template,
                metadata,
                include_default_issue_metadata,
            )
        })
    }
}

/// Global agent registry providing descriptor lookup.
pub struct AgentRegistry {
    descriptors: HashMap<AgentType, AgentDescriptor>,
}

impl AgentRegistry {
    pub fn global() -> &'static AgentRegistry {
        static REGISTRY: Lazy<AgentRegistry> = Lazy::new(|| AgentRegistry {
            descriptors: build_descriptor_map(),
        });
        &REGISTRY
    }

    pub fn get(&self, agent_type: AgentType) -> Option<&AgentDescriptor> {
        self.descriptors.get(&agent_type)
    }
}

const EMPTY_ENV: &[&str] = &[];
const GITHUB_TOKEN_ENV: &[&str] = &["GITHUB_TOKEN"];

const COORDINATOR_TEMPLATE: IssueTaskTemplate = IssueTaskTemplate::new(
    "coordinator-issue-",
    "Coordinate Issue #{issue}",
    "Decompose Issue #{issue} into executable tasks",
    TaskType::Feature,
    1,
    Some(5),
);

const CODEGEN_TEMPLATE: IssueTaskTemplate = IssueTaskTemplate::new(
    "codegen-issue-",
    "Generate code for Issue #{issue}",
    "Implement solution for Issue #{issue}",
    TaskType::Feature,
    1,
    Some(30),
);

const REVIEW_TEMPLATE: IssueTaskTemplate = IssueTaskTemplate::new(
    "review-issue-",
    "Review implementation for Issue #{issue}",
    "Run lint, tests, and security checks for Issue #{issue}",
    TaskType::Refactor,
    1,
    Some(15),
);

const ISSUE_TEMPLATE: IssueTaskTemplate = IssueTaskTemplate::new(
    "issue-analysis-",
    "Analyze Issue #{issue}",
    "Classify Issue #{issue} and apply labels",
    TaskType::Feature,
    1,
    Some(5),
);

const PR_TEMPLATE: IssueTaskTemplate = IssueTaskTemplate::new(
    "pr-issue-",
    "Create PR for Issue #{issue}",
    "Generate pull request for Issue #{issue}",
    TaskType::Feature,
    1,
    Some(5),
);

const DEPLOY_TEMPLATE: IssueTaskTemplate = IssueTaskTemplate::new(
    "deploy-issue-",
    "Deploy Issue #{issue}",
    "Execute deployment workflow for Issue #{issue}",
    TaskType::Deployment,
    1,
    Some(10),
);

const BUSINESS_TEMPLATE: IssueTaskTemplate = IssueTaskTemplate::new(
    "business-issue-",
    "Business Strategy for Issue #{issue}",
    "Develop comprehensive strategy deliverable for Issue #{issue}",
    TaskType::Feature,
    1,
    Some(60),
);

fn build_descriptor_map() -> HashMap<AgentType, AgentDescriptor> {
    use AgentCategory::{Business, Coding};
    use AgentType::*;

    let mut map = HashMap::new();

    map.insert(
        CoordinatorAgent,
        AgentDescriptor::new(
            CoordinatorAgent,
            "CoordinatorAgent",
            Coding,
            GITHUB_TOKEN_ENV,
            Some(COORDINATOR_TEMPLATE),
            build_coordinator_agent,
        ),
    );

    map.insert(
        CodeGenAgent,
        AgentDescriptor::new(
            CodeGenAgent,
            "CodeGenAgent",
            Coding,
            GITHUB_TOKEN_ENV,
            Some(CODEGEN_TEMPLATE),
            build_codegen_agent,
        ),
    );

    map.insert(
        ReviewAgent,
        AgentDescriptor::new(
            ReviewAgent,
            "ReviewAgent",
            Coding,
            GITHUB_TOKEN_ENV,
            Some(REVIEW_TEMPLATE),
            build_review_agent,
        ),
    );

    map.insert(
        IssueAgent,
        AgentDescriptor::new(
            IssueAgent,
            "IssueAgent",
            Coding,
            GITHUB_TOKEN_ENV,
            Some(ISSUE_TEMPLATE),
            build_issue_agent,
        ),
    );

    map.insert(
        PRAgent,
        AgentDescriptor::new(
            PRAgent,
            "PRAgent",
            Coding,
            GITHUB_TOKEN_ENV,
            Some(PR_TEMPLATE),
            build_pr_agent,
        ),
    );

    map.insert(
        DeploymentAgent,
        AgentDescriptor::new(
            DeploymentAgent,
            "DeploymentAgent",
            Coding,
            GITHUB_TOKEN_ENV,
            Some(DEPLOY_TEMPLATE),
            build_deployment_agent,
        ),
    );

    map.insert(
        AIEntrepreneurAgent,
        AgentDescriptor::new(
            AIEntrepreneurAgent,
            "AIEntrepreneurAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_ai_entrepreneur_agent,
        ),
    );

    map.insert(
        ProductConceptAgent,
        AgentDescriptor::new(
            ProductConceptAgent,
            "ProductConceptAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_product_concept_agent,
        ),
    );

    map.insert(
        ProductDesignAgent,
        AgentDescriptor::new(
            ProductDesignAgent,
            "ProductDesignAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_product_design_agent,
        ),
    );

    map.insert(
        FunnelDesignAgent,
        AgentDescriptor::new(
            FunnelDesignAgent,
            "FunnelDesignAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_funnel_design_agent,
        ),
    );

    map.insert(
        PersonaAgent,
        AgentDescriptor::new(
            PersonaAgent,
            "PersonaAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_persona_agent,
        ),
    );

    map.insert(
        SelfAnalysisAgent,
        AgentDescriptor::new(
            SelfAnalysisAgent,
            "SelfAnalysisAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_self_analysis_agent,
        ),
    );

    map.insert(
        MarketResearchAgent,
        AgentDescriptor::new(
            MarketResearchAgent,
            "MarketResearchAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_market_research_agent,
        ),
    );

    map.insert(
        MarketingAgent,
        AgentDescriptor::new(
            MarketingAgent,
            "MarketingAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_marketing_agent,
        ),
    );

    map.insert(
        ContentCreationAgent,
        AgentDescriptor::new(
            ContentCreationAgent,
            "ContentCreationAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_content_creation_agent,
        ),
    );

    map.insert(
        SNSStrategyAgent,
        AgentDescriptor::new(
            SNSStrategyAgent,
            "SNSStrategyAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_sns_strategy_agent,
        ),
    );

    map.insert(
        YouTubeAgent,
        AgentDescriptor::new(
            YouTubeAgent,
            "YouTubeAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_youtube_agent,
        ),
    );

    map.insert(
        SalesAgent,
        AgentDescriptor::new(
            SalesAgent,
            "SalesAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_sales_agent,
        ),
    );

    map.insert(
        CRMAgent,
        AgentDescriptor::new(
            CRMAgent,
            "CRMAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_crm_agent,
        ),
    );

    map.insert(
        AnalyticsAgent,
        AgentDescriptor::new(
            AnalyticsAgent,
            "AnalyticsAgent",
            Business,
            EMPTY_ENV,
            Some(BUSINESS_TEMPLATE),
            build_analytics_agent,
        ),
    );

    map
}

fn build_coordinator_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(CoordinatorAgentWithLLM::new(config))
}

fn build_codegen_agent(config: AgentConfig) -> BoxedAgent {
    let agent = CodeGenAgent::new_with_all(config.clone())
        .unwrap_or_else(|_| CodeGenAgent::new(config.clone()));
    BoxedAgent::from_agent(agent)
}

fn build_review_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(ReviewAgent::new(config))
}

fn build_issue_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(IssueAgent::new(config))
}

fn build_pr_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(PRAgent::new(config))
}

fn build_deployment_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(DeploymentAgent::new(config))
}

fn build_ai_entrepreneur_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(AIEntrepreneurAgent::new(config))
}

fn build_product_concept_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(ProductConceptAgent::new(config))
}

fn build_product_design_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(ProductDesignAgent::new(config))
}

fn build_funnel_design_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(FunnelDesignAgent::new(config))
}

fn build_persona_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(PersonaAgent::new(config))
}

fn build_self_analysis_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(SelfAnalysisAgent::new(config))
}

fn build_market_research_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(MarketResearchAgent::new(config))
}

fn build_marketing_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(MarketingAgent::new(config))
}

fn build_content_creation_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(ContentCreationAgent::new(config))
}

fn build_sns_strategy_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(SNSStrategyAgent::new(config))
}

fn build_youtube_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(YouTubeAgent::new(config))
}

fn build_sales_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(SalesAgent::new(config))
}

fn build_crm_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(CRMAgent::new(config))
}

fn build_analytics_agent(config: AgentConfig) -> BoxedAgent {
    BoxedAgent::from_agent(AnalyticsAgent::new(config))
}
