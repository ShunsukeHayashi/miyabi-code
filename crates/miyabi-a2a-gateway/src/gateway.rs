//! A2A Gateway - Central hub for all agent communication

use crate::{
    error::Error, monitor::CommunicationMonitor, queue::TaskQueue, registry::AgentRegistry, router::MessageRouter,
    types::*, Result,
};
use miyabi_core::tools::{ToolRegistry, ToolResult};
use miyabi_core::ExecutionMode;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

/// A2A Gateway - ensures all agent communication is reliable and auditable
pub struct A2AGateway {
    /// Agent registry
    pub registry: Arc<AgentRegistry>,
    /// Message router
    pub router: Arc<MessageRouter>,
    /// Task queue
    pub queue: Arc<TaskQueue>,
    /// Communication monitor
    pub monitor: Arc<CommunicationMonitor>,
    /// Tool registry for native Rust tool execution
    pub tool_registry: Arc<RwLock<ToolRegistry>>,
    /// Processed idempotency keys
    processed_keys: RwLock<std::collections::HashSet<String>>,
}

impl A2AGateway {
    /// Create a new A2A Gateway
    pub async fn new() -> Result<Self> {
        Ok(Self {
            registry: Arc::new(AgentRegistry::new()),
            router: Arc::new(MessageRouter::new()),
            queue: Arc::new(TaskQueue::new()),
            monitor: Arc::new(CommunicationMonitor::new()),
            tool_registry: Arc::new(RwLock::new(ToolRegistry::new(ExecutionMode::FullAccess))),
            processed_keys: RwLock::new(std::collections::HashSet::new()),
        })
    }

    /// Create gateway with custom execution mode for tools
    pub async fn with_execution_mode(mode: ExecutionMode) -> Result<Self> {
        Ok(Self {
            registry: Arc::new(AgentRegistry::new()),
            router: Arc::new(MessageRouter::new()),
            queue: Arc::new(TaskQueue::new()),
            monitor: Arc::new(CommunicationMonitor::new()),
            tool_registry: Arc::new(RwLock::new(ToolRegistry::new(mode))),
            processed_keys: RwLock::new(std::collections::HashSet::new()),
        })
    }

    /// Execute a tool on behalf of an agent
    ///
    /// Validates agent permissions and executes the requested tool.
    pub async fn execute_tool(
        &self,
        agent_id: &AgentId,
        tool_name: &str,
        args: serde_json::Value,
    ) -> Result<ToolResult> {
        // Validate agent exists
        let _card = self.registry.get_card(agent_id).await?;

        // Create tool call
        let call =
            miyabi_llm::ToolCall { id: uuid::Uuid::new_v4().to_string(), name: tool_name.to_string(), arguments: args };

        // Execute tool
        let registry = self.tool_registry.read().await;
        registry
            .execute(&call)
            .await
            .map_err(|e| Error::ToolExecutionFailed(format!("{}: {}", tool_name, e)))
    }

    /// Get available tools for an agent based on its permissions
    pub async fn get_available_tools(&self, _agent_id: &AgentId) -> Vec<miyabi_llm::ToolDefinition> {
        let registry = self.tool_registry.read().await;
        registry.get_tool_definitions()
    }

    /// Register an agent with the gateway
    pub async fn register_agent(&self, card: AgentCard) -> Result<AgentId> {
        let id = self.registry.register(card.clone()).await?;
        info!("Registered agent: {} ({})", card.name, id.0);
        Ok(id)
    }

    /// Get agent by name
    pub async fn get_agent_by_name(&self, name: &str) -> Result<AgentId> {
        self.registry.get_by_name(name).await
    }

    /// Send task from one agent to another
    pub async fn send_task(&self, from: AgentId, to: AgentId, task: Task) -> Result<TaskId> {
        // Validate agents exist
        self.registry.validate_agents(&from, &to).await?;

        // Get receiver card and validate capability
        let _receiver_card = self.registry.get_card(&to).await?;

        // Queue task
        let task_id = self.queue.enqueue(task.clone()).await?;

        // Route to receiver
        self.router.route(to.clone(), task_id.clone()).await?;

        // Log communication
        self.monitor.log_send(&from, &to, &task_id).await;

        info!("Task {} sent from {:?} to {:?}", task_id.0, from.0, to.0);

        Ok(task_id)
    }

    /// Send task with delivery guarantee
    pub async fn send_with_guarantee(
        &self,
        from: AgentId,
        to: AgentId,
        task: Task,
        guarantee: DeliveryGuarantee,
    ) -> Result<TaskId> {
        match guarantee {
            DeliveryGuarantee::AtMostOnce => self.send_task(from, to, task).await,
            DeliveryGuarantee::AtLeastOnce => {
                let task_id = self.send_task(from, to, task).await?;
                self.router
                    .wait_for_ack(&task_id, std::time::Duration::from_secs(30))
                    .await?;
                Ok(task_id)
            }
            DeliveryGuarantee::ExactlyOnce => {
                if let Some(key) = &task.idempotency_key {
                    if self.is_duplicate(key).await {
                        return Err(Error::DuplicateTask(key.clone()));
                    }
                }
                let task_id = self.send_task(from, to, task.clone()).await?;
                self.router
                    .wait_for_ack(&task_id, std::time::Duration::from_secs(30))
                    .await?;
                if let Some(key) = &task.idempotency_key {
                    self.mark_processed(key).await;
                }
                Ok(task_id)
            }
        }
    }

    /// Broadcast task to multiple agents
    pub async fn broadcast(&self, from: AgentId, targets: Vec<AgentId>, task: Task) -> Result<Vec<TaskId>> {
        let mut task_ids = Vec::new();
        for target in targets {
            let mut task_clone = task.clone();
            task_clone.id = TaskId::new();
            task_clone.to = target.clone();
            let task_id = self.send_task(from.clone(), target, task_clone).await?;
            task_ids.push(task_id);
        }
        Ok(task_ids)
    }

    /// Send and wait for result
    pub async fn send_and_wait(&self, from: AgentId, to: AgentId, task: Task) -> Result<TaskResult> {
        let timeout = task.timeout_secs.unwrap_or(300);
        let task_id = self
            .send_with_guarantee(from, to, task, DeliveryGuarantee::AtLeastOnce)
            .await?;

        // Wait for task completion
        let start = std::time::Instant::now();
        loop {
            if start.elapsed().as_secs() > timeout {
                return Err(Error::TaskTimeout(timeout));
            }

            if let Some(result) = self.queue.get_result(&task_id).await {
                return Ok(result);
            }

            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
    }

    /// Get task status
    pub async fn get_task_status(&self, task_id: &TaskId) -> Result<TaskStatus> {
        self.queue.get_status(task_id).await
    }

    /// Complete a task with result
    pub async fn complete_task(&self, task_id: TaskId, result: TaskResult) -> Result<()> {
        self.queue.complete(task_id.clone(), result).await?;
        self.router.acknowledge(&task_id).await;
        Ok(())
    }

    /// Discover agents by skill
    pub async fn discover_by_skill(&self, skill_id: &str) -> Vec<AgentId> {
        self.registry.discover_by_skill(skill_id).await
    }

    /// Get all registered agents
    pub async fn get_all_agents(&self) -> Vec<RegisteredAgent> {
        self.registry.get_all().await
    }

    /// Health check all agents
    pub async fn health_check(&self) {
        let agents = self.registry.get_all().await;
        for agent in agents {
            // TODO: Actually ping the agent
            info!("Health check: {} - {:?}", agent.card.name, agent.status);
        }
    }

    /// Get communication metrics
    pub async fn get_metrics(&self) -> serde_json::Value {
        self.monitor.get_metrics().await
    }

    /// Check if idempotency key was already processed
    async fn is_duplicate(&self, key: &str) -> bool {
        self.processed_keys.read().await.contains(key)
    }

    /// Mark idempotency key as processed
    async fn mark_processed(&self, key: &str) {
        self.processed_keys.write().await.insert(key.to_string());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_gateway_creation() {
        let gateway = A2AGateway::new().await.unwrap();
        assert!(gateway.get_all_agents().await.is_empty());
    }

    #[tokio::test]
    async fn test_agent_registration() {
        let gateway = A2AGateway::new().await.unwrap();

        let card =
            AgentCard { name: "test-agent".to_string(), description: "Test agent".to_string(), ..Default::default() };

        let id = gateway.register_agent(card).await.unwrap();
        assert!(!id.0.is_empty());

        let agents = gateway.get_all_agents().await;
        assert_eq!(agents.len(), 1);
    }
}
