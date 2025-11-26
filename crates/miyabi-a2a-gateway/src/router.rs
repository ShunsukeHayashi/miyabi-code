//! Message Router - handles routing and delivery guarantees

use crate::{error::Error, types::*, Result};
use std::collections::HashMap;
use std::time::Duration;
use tokio::sync::RwLock;
use tracing::{info, warn};

/// Delivery status
#[derive(Debug, Clone)]
pub enum DeliveryStatus {
    Pending,
    Delivered,
    Acknowledged,
    Failed(String),
}

/// Message Router
pub struct MessageRouter {
    /// Delivery status tracking
    delivery_status: RwLock<HashMap<TaskId, DeliveryStatus>>,
}

impl MessageRouter {
    /// Create a new router
    pub fn new() -> Self {
        Self {
            delivery_status: RwLock::new(HashMap::new()),
        }
    }

    /// Route task to target agent
    pub async fn route(&self, target: AgentId, task_id: TaskId) -> Result<()> {
        // Set pending status
        self.delivery_status
            .write()
            .await
            .insert(task_id.clone(), DeliveryStatus::Pending);

        // Attempt delivery with retry
        for attempt in 1..=3 {
            match self.deliver(&target, &task_id).await {
                Ok(_) => {
                    self.delivery_status
                        .write()
                        .await
                        .insert(task_id.clone(), DeliveryStatus::Delivered);
                    info!(
                        "Delivered task {} to {:?} (attempt {})",
                        task_id.0, target.0, attempt
                    );
                    return Ok(());
                }
                Err(e) if attempt < 3 => {
                    warn!(
                        "Delivery attempt {} failed for task {}: {}",
                        attempt, task_id.0, e
                    );
                    tokio::time::sleep(Duration::from_secs(attempt * 2)).await;
                    continue;
                }
                Err(e) => {
                    self.delivery_status
                        .write()
                        .await
                        .insert(task_id.clone(), DeliveryStatus::Failed(e.to_string()));
                    return Err(e);
                }
            }
        }
        Ok(())
    }

    /// Internal delivery mechanism
    async fn deliver(&self, _target: &AgentId, _task_id: &TaskId) -> Result<()> {
        // In a real implementation, this would:
        // 1. Look up the agent's endpoint
        // 2. Send HTTP request to the agent
        // 3. Wait for acknowledgment
        //
        // For now, we simulate successful delivery
        Ok(())
    }

    /// Wait for acknowledgment
    pub async fn wait_for_ack(&self, task_id: &TaskId, timeout: Duration) -> Result<()> {
        let start = std::time::Instant::now();
        loop {
            if start.elapsed() > timeout {
                return Err(Error::AcknowledgmentTimeout);
            }

            if let Some(status) = self.delivery_status.read().await.get(task_id) {
                match status {
                    DeliveryStatus::Acknowledged => return Ok(()),
                    DeliveryStatus::Failed(e) => return Err(Error::DeliveryFailed(e.clone())),
                    _ => {}
                }
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }

    /// Acknowledge task receipt
    pub async fn acknowledge(&self, task_id: &TaskId) {
        self.delivery_status
            .write()
            .await
            .insert(task_id.clone(), DeliveryStatus::Acknowledged);
    }

    /// Get delivery status
    pub async fn get_status(&self, task_id: &TaskId) -> Option<DeliveryStatus> {
        self.delivery_status.read().await.get(task_id).cloned()
    }
}

impl Default for MessageRouter {
    fn default() -> Self {
        Self::new()
    }
}
