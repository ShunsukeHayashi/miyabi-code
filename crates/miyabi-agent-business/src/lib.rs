//! Miyabi Business Agents
//!
//! 14 specialized agents for business strategy, marketing, and operations.
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
//! # Example
//!
//! ```rust,no_run
//! use miyabi_agent_business::AIEntrepreneurAgent;
//! use miyabi_agent_core::BaseAgent;
//! use miyabi_types::{AgentConfig, Task};
//!
//! # async fn example() -> miyabi_types::error::Result<()> {
//! let config = AgentConfig::default();
//! let entrepreneur = AIEntrepreneurAgent::new(config);
//!
//! let task = Task::default(); // Your task here
//! let result = entrepreneur.execute(&task).await?;
//!
//! println!("Business plan: {}", result.data);
//! # Ok(())
//! # }
//! ```

pub mod ai_entrepreneur;
pub mod analytics;
pub mod content_creation;
pub mod crm;
pub mod funnel_design;
pub mod market_research;
pub mod marketing;
pub mod persona;
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
pub use market_research::MarketResearchAgent;
pub use marketing::MarketingAgent;
pub use persona::PersonaAgent;
pub use product_concept::ProductConceptAgent;
pub use product_design::ProductDesignAgent;
pub use sales::SalesAgent;
pub use self_analysis::SelfAnalysisAgent;
pub use sns_strategy::SNSStrategyAgent;
pub use youtube::YouTubeAgent;
