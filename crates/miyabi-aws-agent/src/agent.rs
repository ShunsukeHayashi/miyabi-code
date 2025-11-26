//! AWS Agent implementation

use crate::error::Result;
use miyabi_types::{AwsResource, AwsTask, HistoricalAgent};

/// AWS Agent
///
/// Manages AWS resources across multiple accounts with Service-as-Agent model.
#[derive(Debug, Clone)]
pub struct AwsAgent {
    /// Agent ID (301)
    pub id: u32,
}

impl AwsAgent {
    /// Create new AWS Agent
    pub fn new() -> Self {
        Self { id: 301 }
    }

    /// Execute AWS task
    pub async fn execute_task(&self, _task: AwsTask) -> Result<AwsResource> {
        todo!("Phase 2 implementation")
    }

    /// Assign historical agent to resource type
    pub fn assign_historical_agent(
        &self,
        resource_type: &miyabi_types::AwsResourceType,
    ) -> HistoricalAgent {
        HistoricalAgent::for_resource_type(resource_type)
    }
}

impl Default for AwsAgent {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::AwsResourceType;

    #[test]
    fn test_new_agent() {
        let agent = AwsAgent::new();
        assert_eq!(agent.id, 301);
    }

    #[test]
    fn test_assign_historical_agent() {
        let agent = AwsAgent::new();
        let assigned = agent.assign_historical_agent(&AwsResourceType::Ec2Instance);
        assert_eq!(assigned, HistoricalAgent::BillGates);
    }
}
