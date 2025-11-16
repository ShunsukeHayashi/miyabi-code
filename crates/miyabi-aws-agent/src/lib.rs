//! Miyabi AWS Agent
//!
//! Agent for managing AWS resources with Service-as-Agent model.
//!
//! # Features
//! - Multi-account AWS resource management
//! - EC2, S3, Lambda, RDS operations
//! - Historical Agent assignment
//! - Cost optimization
//! - Health monitoring

pub mod agent;
pub mod error;
pub mod resources;

pub use agent::AwsAgent;
pub use error::{AwsAgentError, Result};

// Re-export AWS types from miyabi-types
pub use miyabi_types::{
    AwsAccount, AwsResource, AwsResourceType, AwsTask, HistoricalAgent, ServiceAgent,
};

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
