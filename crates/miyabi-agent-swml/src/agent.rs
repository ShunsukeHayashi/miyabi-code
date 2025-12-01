//! SWML Agent - High-level API
//!
//! Provides a convenient interface for using the SWML framework.

use anyhow::Result;
use miyabi_types::swml::{Intent, SWMLResult, World};

use crate::omega::OmegaFunction;

/// SWML Agent - High-level interface to the SWML framework
pub struct SWMLAgent {
    omega: OmegaFunction,
}

impl SWMLAgent {
    /// Create a new SWML agent
    pub async fn new() -> Result<Self> {
        Ok(Self { omega: OmegaFunction::new().await? })
    }

    /// Execute an intent
    pub async fn execute(&self, intent: Intent, world: World) -> Result<SWMLResult> {
        self.omega.execute(intent, world).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_agent_creation() {
        let agent = SWMLAgent::new().await;
        assert!(agent.is_ok());
    }
}
