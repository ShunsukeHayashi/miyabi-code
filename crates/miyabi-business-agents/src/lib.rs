//! Business Automation Agents for Miyabi
//!
//! This crate provides 15 specialized business agents for SaaS operations,
//! including strategy, marketing, sales, and analytics automation.
//!
//! # Agent Categories
//!
//! - **Strategy & Planning** (6 agents): AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
//! - **Marketing** (6 agents): MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube, Honoka
//! - **Sales & Analytics** (3 agents): Sales, CRM, Analytics
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_business_agents::strategy::AIEntrepreneurAgent;
//! use miyabi_types::BusinessInput;
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     let agent = AIEntrepreneurAgent::new();
//!     let input = BusinessInput {
//!         industry: "SaaS".to_string(),
//!         target_market: "SMB developers".to_string(),
//!         budget: 50_000,
//!     };
//!
//!     let plan = agent.generate_business_plan(&input).await?;
//!     println!("Generated plan: {:?}", plan);
//!     Ok(())
//! }
//! ```

pub mod client;
pub mod traits;
pub mod types;

// Strategy & Planning Agents (6)
pub mod strategy {
    //! Strategy and planning agents for business foundations

    pub mod ai_entrepreneur;
    pub mod funnel_design;
    pub mod persona;
    pub mod product_concept;
    pub mod product_design;
    pub mod self_analysis;

    pub use ai_entrepreneur::AIEntrepreneurAgent;
    pub use funnel_design::FunnelDesignAgent;
    pub use persona::PersonaAgent;
    pub use product_concept::ProductConceptAgent;
    pub use product_design::ProductDesignAgent;
    pub use self_analysis::SelfAnalysisAgent;
}

// Marketing Agents (6)
pub mod marketing {
    //! Marketing and promotional agents for customer acquisition

    pub mod content_creation;
    pub mod honoka;
    pub mod market_research;
    pub mod marketing_strategy;
    pub mod sns_strategy;
    pub mod youtube;

    pub use content_creation::ContentCreationAgent;
    pub use honoka::HonokaAgent;
    pub use market_research::MarketResearchAgent;
    pub use marketing_strategy::MarketingStrategyAgent;
    pub use sns_strategy::SNSStrategyAgent;
    pub use youtube::YouTubeAgent;
}

// Sales & Analytics Agents (3)
pub mod sales {
    //! Sales and analytics agents for revenue operations

    pub mod analytics;
    pub mod crm;
    pub mod sales_strategy;

    pub use analytics::AnalyticsAgent;
    pub use crm::CRMAgent;
    pub use sales_strategy::SalesStrategyAgent;
}

// Re-exports for convenience
pub use client::ClaudeClient;
pub use traits::BusinessAgent;
pub use types::*;

#[cfg(test)]
mod tests {
    #[test]
    fn test_crate_compiles() {
        // Basic compilation test
        assert!(true);
    }
}
