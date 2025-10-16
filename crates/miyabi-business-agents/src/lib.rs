//! Business Automation Agents for Miyabi
//!
//! This crate provides 14 specialized business agents for SaaS operations,
//! including strategy, marketing, sales, and analytics automation.
//!
//! # Agent Categories
//!
//! - **Strategy & Planning** (6 agents): AIEntrepreneur, ProductConcept, ProductDesign, FunnelDesign, Persona, SelfAnalysis
//! - **Marketing** (5 agents): MarketResearch, Marketing, ContentCreation, SNSStrategy, YouTube
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

pub mod traits;
pub mod types;
pub mod client;

// Strategy & Planning Agents (6)
pub mod strategy {
    //! Strategy and planning agents for business foundations

    pub mod ai_entrepreneur;
    // TODO: Implement remaining strategy agents
    // pub mod product_concept;
    // pub mod product_design;
    // pub mod funnel_design;
    // pub mod persona;
    // pub mod self_analysis;

    pub use ai_entrepreneur::AIEntrepreneurAgent;
}

// Marketing Agents (5)
// TODO: Implement marketing agents
// pub mod marketing {
//     pub mod market_research;
//     pub mod marketing_strategy;
//     pub mod content_creation;
//     pub mod sns_strategy;
//     pub mod youtube;
// }

// Sales & Analytics Agents (3)
// TODO: Implement sales agents
// pub mod sales {
//     pub mod sales_strategy;
//     pub mod crm;
//     pub mod analytics;
// }

// Re-exports for convenience
pub use traits::BusinessAgent;
pub use types::*;
pub use client::ClaudeClient;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_crate_compiles() {
        // Basic compilation test
        assert!(true);
    }
}
