//! Business Agent trait definitions
//!
//! Defines the core trait that all business agents must implement.

use async_trait::async_trait;
use crate::types::{BusinessInput, BusinessPlan, ValidationResult};
use miyabi_types::MiyabiError;

/// Business Agent trait - extends BaseAgent with business-specific methods
///
/// All business agents (Strategy, Marketing, Sales) implement this trait
/// to provide consistent interfaces for business plan generation and validation.
#[async_trait]
pub trait BusinessAgent: Send + Sync {
    /// Get the agent's unique identifier
    fn agent_type(&self) -> &str;

    /// Get a human-readable description of what this agent does
    fn description(&self) -> &str;

    /// Generate a business plan based on input parameters
    ///
    /// # Arguments
    ///
    /// * `input` - Business input parameters (industry, market, budget, etc.)
    ///
    /// # Returns
    ///
    /// A structured business plan with recommendations, strategies, and metrics
    async fn generate_plan(&self, input: &BusinessInput) -> Result<BusinessPlan, MiyabiError>;

    /// Validate the generated business plan
    ///
    /// # Arguments
    ///
    /// * `plan` - The business plan to validate
    ///
    /// # Returns
    ///
    /// Validation result with score, warnings, and improvement suggestions
    async fn validate_output(&self, plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError>;

    /// Get example input for testing and documentation
    fn example_input(&self) -> BusinessInput {
        BusinessInput::default()
    }

    /// Get the estimated execution time in seconds
    fn estimated_duration(&self) -> u64 {
        30 // Default: 30 seconds
    }

    /// Check if this agent requires API access (e.g., Claude API)
    fn requires_api_access(&self) -> bool {
        true // Most business agents use LLM APIs
    }
}

/// Marker trait for strategy agents
pub trait StrategyAgent: BusinessAgent {}

/// Marker trait for marketing agents
pub trait MarketingAgent: BusinessAgent {}

/// Marker trait for sales agents
pub trait SalesAgent: BusinessAgent {}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestAgent;

    #[async_trait]
    impl BusinessAgent for TestAgent {
        fn agent_type(&self) -> &str {
            "test"
        }

        fn description(&self) -> &str {
            "Test agent"
        }

        async fn generate_plan(&self, _input: &BusinessInput) -> Result<BusinessPlan, MiyabiError> {
            Ok(BusinessPlan::default())
        }

        async fn validate_output(&self, _plan: &BusinessPlan) -> Result<ValidationResult, MiyabiError> {
            Ok(ValidationResult::default())
        }
    }

    #[tokio::test]
    async fn test_business_agent_trait() {
        let agent = TestAgent;
        assert_eq!(agent.agent_type(), "test");
        assert_eq!(agent.description(), "Test agent");
        assert_eq!(agent.estimated_duration(), 30);
        assert!(agent.requires_api_access());

        let input = agent.example_input();
        let plan = agent.generate_plan(&input).await.unwrap();
        let validation = agent.validate_output(&plan).await.unwrap();

        assert!(validation.is_valid);
    }
}
