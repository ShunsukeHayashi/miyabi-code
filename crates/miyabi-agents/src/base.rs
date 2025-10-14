//! Base agent trait and implementation

use async_trait::async_trait;
use miyabi_types::error::Result;
use miyabi_types::{AgentResult, AgentType, Task};

#[async_trait]
pub trait BaseAgent: Send + Sync {
    /// Get agent type
    fn agent_type(&self) -> AgentType;

    /// Execute task
    async fn execute(&self, task: &Task) -> Result<AgentResult>;

    /// Run agent with lifecycle management
    async fn run(&self, task: &Task) -> Result<AgentResult> {
        tracing::info!("Agent {:?} starting task: {}", self.agent_type(), task.id);
        let result = self.execute(task).await?;
        tracing::info!("Agent {:?} completed task: {}", self.agent_type(), task.id);
        Ok(result)
    }
}
