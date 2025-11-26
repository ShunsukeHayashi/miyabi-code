//! Miyabi Business Agents
//!
//! 15 specialized agents for business strategy, marketing, operations, and design.
//!
//! # Strategy Agents (6)
//!
//! - **AIEntrepreneurAgent**: 8-phase business plan generation
//! - **ProductConceptAgent**: Product concept design
//! - **ProductDesignAgent**: Service detail design
//! - **FunnelDesignAgent**: Customer funnel optimization
//! - **PersonaAgent**: Target customer persona creation
//! - **SelfAnalysisAgent**: Career and skill analysis
//!
//! # Marketing Agents (5)
//!
//! - **MarketResearchAgent**: Market trend analysis (20+ competitors)
//! - **MarketingAgent**: Marketing strategy formulation
//! - **ContentCreationAgent**: Content production planning
//! - **SNSStrategyAgent**: Social media strategy (Twitter/Instagram/LinkedIn)
//! - **YouTubeAgent**: YouTube channel optimization (13 workflows)
//!
//! # Operations Agents (3)
//!
//! - **SalesAgent**: Sales process optimization
//! - **CRMAgent**: Customer relationship management
//! - **AnalyticsAgent**: Data analysis and PDCA cycle
//!
//! # Design Agents (1)
//!
//! - **JonathanIveDesignAgent**: UI/UX design review with Apple design principles
//!
//! # Example
//!
//! ```rust,ignore
//! use miyabi_agent_business::AIEntrepreneurAgent;
//! use miyabi_agent_core::BaseAgent;
//! use miyabi_types::{AgentConfig, Task};
//!
//! # async fn example() {
//! let config = AgentConfig { /* config fields */ };
//! let entrepreneur = AIEntrepreneurAgent::new(config);
//!
//! let task = Task { /* task fields */ };
//! let result = entrepreneur.execute(&task).await;
//! # }
//! ```

pub mod ai_entrepreneur;
pub mod analytics;
pub mod content_creation;
pub mod crm;
pub mod funnel_design;
pub mod jonathan_ive_design;
pub mod market_research;
pub mod marketing;
pub mod persona;
pub mod persistence;
pub mod product_concept;
pub mod product_design;
pub mod sales;
pub mod self_analysis;
pub mod sns_strategy;
pub mod youtube;

pub use ai_entrepreneur::AIEntrepreneurAgent;
pub use analytics::AnalyticsAgent;
pub use content_creation::ContentCreationAgent;
pub use crm::CRMAgent;
pub use funnel_design::FunnelDesignAgent;
pub use jonathan_ive_design::JonathanIveDesignAgent;
pub use market_research::MarketResearchAgent;
pub use marketing::MarketingAgent;
pub use persona::PersonaAgent;
pub use persistence::{
    AgentExecutionResult, ExecutionResultBuilder, ExecutionStatus, PersistableAgent,
};
pub use product_concept::ProductConceptAgent;
pub use product_design::ProductDesignAgent;
pub use sales::SalesAgent;
pub use self_analysis::SelfAnalysisAgent;
pub use sns_strategy::SNSStrategyAgent;
pub use youtube::YouTubeAgent;

/// Convert LLMError to MiyabiError
///
/// This is a helper function for business agents to convert LLM errors
/// into MiyabiError, wrapping them in an Unknown variant with context.
#[inline]
pub(crate) fn llm_error_to_miyabi(error: miyabi_llm::LLMError) -> miyabi_types::error::MiyabiError {
    miyabi_types::error::MiyabiError::Unknown(format!("LLM error: {}", error))
}
