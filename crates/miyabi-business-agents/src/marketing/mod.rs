//! Marketing-focused Business Agents
//!
//! This module contains agents specialized in marketing activities:
//! - Content Creation
//! - Market Research
//! - Marketing Strategy
//! - SNS Strategy
//! - YouTube Strategy
//! - Online Course Creation (Honoka)

pub mod content_creation;
pub mod honoka;
pub mod market_research;
pub mod marketing_strategy;
pub mod sns_strategy;
pub mod youtube;

// Re-export for convenience
pub use content_creation::ContentCreationAgent;
pub use honoka::HonokaAgent;
pub use market_research::MarketResearchAgent;
pub use marketing_strategy::MarketingStrategyAgent;
pub use sns_strategy::SNSStrategyAgent;
pub use youtube::YouTubeAgent;
