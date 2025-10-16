//! Business Agents - Autonomous AI agents for business operations
//!
//! This module contains 14 business agents that cover the entire startup lifecycle
//! from ideation to scaling, providing comprehensive business automation capabilities.

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

// Re-export business agents for easy access
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
