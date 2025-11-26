//! Event system for broadcasting agent execution and task updates
//!
//! Issue: #970 Phase 2.1 - Extended for Task events

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;
use uuid::Uuid;

/// Maximum number of events to buffer
const EVENT_BUFFER_SIZE: usize = 1000;

/// Generic event types for the system
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Event {
    /// Task created
    TaskCreated {
        task_id: String,
        name: String,
        priority: String,
    },
    /// Task updated
    TaskUpdated { task_id: String, status: String },
    /// Task completed
    TaskCompleted { task_id: String, name: String },
    /// Task failed
    TaskFailed { task_id: String, error: String },
    /// Agent event wrapper
    Agent(AgentEvent),
}

/// Agent execution event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AgentEvent {
    /// Agent execution started
    ExecutionStarted {
        execution_id: Uuid,
        repository_id: Uuid,
        issue_number: i32,
        agent_type: String,
        timestamp: DateTime<Utc>,
    },
    /// Agent execution progress update
    ExecutionProgress {
        execution_id: Uuid,
        progress: u8, // 0-100
        message: String,
        timestamp: DateTime<Utc>,
    },
    /// Agent execution completed successfully
    ExecutionCompleted {
        execution_id: Uuid,
        quality_score: Option<i32>,
        pr_number: Option<i32>,
        timestamp: DateTime<Utc>,
    },
    /// Agent execution failed
    ExecutionFailed {
        execution_id: Uuid,
        error: String,
        timestamp: DateTime<Utc>,
    },
    /// Agent execution log message
    ExecutionLog {
        execution_id: Uuid,
        log_level: String,
        message: String,
        timestamp: DateTime<Utc>,
    },
}

/// Event broadcaster for agent execution and task events
#[derive(Clone)]
pub struct EventBroadcaster {
    agent_sender: Arc<broadcast::Sender<AgentEvent>>,
    event_sender: Arc<broadcast::Sender<Event>>,
    ws_manager: Option<Arc<crate::websocket::WsState>>,
}

impl EventBroadcaster {
    /// Creates a new event broadcaster
    pub fn new() -> Self {
        let (agent_sender, _) = broadcast::channel(EVENT_BUFFER_SIZE);
        let (event_sender, _) = broadcast::channel(EVENT_BUFFER_SIZE);
        Self {
            agent_sender: Arc::new(agent_sender),
            event_sender: Arc::new(event_sender),
            ws_manager: None,
        }
    }

    /// Creates a new event broadcaster with WebSocket integration (Issue #1175)
    pub fn with_websocket(ws_manager: Arc<crate::websocket::WsState>) -> Self {
        let (agent_sender, _) = broadcast::channel(EVENT_BUFFER_SIZE);
        let (event_sender, _) = broadcast::channel(EVENT_BUFFER_SIZE);
        Self {
            agent_sender: Arc::new(agent_sender),
            event_sender: Arc::new(event_sender),
            ws_manager: Some(ws_manager),
        }
    }

    /// Broadcasts a generic event to all subscribers
    ///
    /// # Arguments
    ///
    /// * `event` - Event to broadcast
    ///
    /// # Returns
    ///
    /// Number of receivers that received the event
    pub fn broadcast(&self, event: Event) -> usize {
        match self.event_sender.send(event) {
            Ok(count) => {
                tracing::debug!("Broadcasted event to {} subscribers", count);
                count
            }
            Err(e) => {
                tracing::warn!("Failed to broadcast event: {}", e);
                0
            }
        }
    }

    /// Broadcasts an agent event to all subscribers
    ///
    /// # Arguments
    ///
    /// * `event` - Agent event to broadcast
    ///
    /// # Returns
    ///
    /// Number of receivers that received the event
    pub fn broadcast_agent(&self, event: AgentEvent) -> usize {
        match self.agent_sender.send(event) {
            Ok(count) => {
                tracing::debug!("Broadcasted agent event to {} subscribers", count);
                count
            }
            Err(e) => {
                tracing::warn!("Failed to broadcast agent event: {}", e);
                0
            }
        }
    }

    /// Creates a new subscriber to receive agent events
    ///
    /// # Returns
    ///
    /// Receiver that will receive all future agent events
    pub fn subscribe(&self) -> broadcast::Receiver<AgentEvent> {
        self.agent_sender.subscribe()
    }

    /// Creates a new subscriber to receive generic events
    ///
    /// # Returns
    ///
    /// Receiver that will receive all future generic events
    pub fn subscribe_events(&self) -> broadcast::Receiver<Event> {
        self.event_sender.subscribe()
    }

    /// Gets the current number of active agent subscribers
    pub fn subscriber_count(&self) -> usize {
        self.agent_sender.receiver_count()
    }

    /// Gets the current number of active event subscribers
    pub fn event_subscriber_count(&self) -> usize {
        self.event_sender.receiver_count()
    }

    /// Broadcasts execution started event
    pub fn execution_started(
        &self,
        execution_id: Uuid,
        repository_id: Uuid,
        issue_number: i32,
        agent_type: String,
    ) {
        self.broadcast_agent(AgentEvent::ExecutionStarted {
            execution_id,
            repository_id,
            issue_number,
            agent_type: agent_type.clone(),
            timestamp: Utc::now(),
        });

        // Issue #1175: Also broadcast to WebSocket clients
        if let Some(ref ws) = self.ws_manager {
            ws.broadcast_agent_started(
                agent_type,
                issue_number,
                execution_id.to_string(),
            );
        }
    }

    /// Broadcasts execution progress event
    pub fn execution_progress(&self, execution_id: Uuid, progress: u8, message: String) {
        self.broadcast_agent(AgentEvent::ExecutionProgress {
            execution_id,
            progress: progress.min(100),
            message: message.clone(),
            timestamp: Utc::now(),
        });

        // Issue #1175: Also broadcast to WebSocket clients
        if let Some(ref ws) = self.ws_manager {
            ws.broadcast_agent_progress(
                "agent", // We don't have agent_type in this signature
                progress,
                message,
                execution_id.to_string(),
            );
        }
    }

    /// Broadcasts execution completed event
    pub fn execution_completed(
        &self,
        execution_id: Uuid,
        quality_score: Option<i32>,
        pr_number: Option<i32>,
    ) {
        self.broadcast_agent(AgentEvent::ExecutionCompleted {
            execution_id,
            quality_score,
            pr_number,
            timestamp: Utc::now(),
        });

        // Issue #1175: Also broadcast to WebSocket clients
        if let Some(ref ws) = self.ws_manager {
            use crate::websocket::AgentResult;
            ws.broadcast_agent_completed(
                "agent", // We don't have agent_type in this signature
                execution_id.to_string(),
                AgentResult {
                    success: true,
                    quality_score,
                    pr_number,
                    error: None,
                },
            );
        }
    }

    /// Broadcasts execution failed event
    pub fn execution_failed(&self, execution_id: Uuid, error: String) {
        self.broadcast_agent(AgentEvent::ExecutionFailed {
            execution_id,
            error: error.clone(),
            timestamp: Utc::now(),
        });

        // Issue #1175: Also broadcast to WebSocket clients
        if let Some(ref ws) = self.ws_manager {
            use crate::websocket::AgentResult;
            ws.broadcast_agent_completed(
                "agent", // We don't have agent_type in this signature
                execution_id.to_string(),
                AgentResult {
                    success: false,
                    quality_score: None,
                    pr_number: None,
                    error: Some(error),
                },
            );
        }
    }

    /// Broadcasts execution log event
    pub fn execution_log(&self, execution_id: Uuid, log_level: String, message: String) {
        self.broadcast_agent(AgentEvent::ExecutionLog {
            execution_id,
            log_level,
            message,
            timestamp: Utc::now(),
        });
    }
}

impl Default for EventBroadcaster {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_event_broadcaster_creation() {
        let broadcaster = EventBroadcaster::new();
        assert_eq!(broadcaster.subscriber_count(), 0);
    }

    #[tokio::test]
    async fn test_subscribe_and_broadcast() {
        let broadcaster = EventBroadcaster::new();
        let mut receiver = broadcaster.subscribe();

        assert_eq!(broadcaster.subscriber_count(), 1);

        let execution_id = Uuid::new_v4();
        broadcaster.execution_started(execution_id, Uuid::new_v4(), 123, "coordinator".to_string());

        let event = receiver.recv().await.unwrap();
        match event {
            AgentEvent::ExecutionStarted {
                execution_id: id, ..
            } => {
                assert_eq!(id, execution_id);
            }
            _ => panic!("Expected ExecutionStarted event"),
        }
    }

    #[tokio::test]
    async fn test_multiple_subscribers() {
        let broadcaster = EventBroadcaster::new();
        let mut receiver1 = broadcaster.subscribe();
        let mut receiver2 = broadcaster.subscribe();

        assert_eq!(broadcaster.subscriber_count(), 2);

        broadcaster.execution_progress(Uuid::new_v4(), 50, "Progress".to_string());

        // Both receivers should get the event
        let event1 = receiver1.recv().await.unwrap();
        let event2 = receiver2.recv().await.unwrap();

        match (event1, event2) {
            (
                AgentEvent::ExecutionProgress { progress: p1, .. },
                AgentEvent::ExecutionProgress { progress: p2, .. },
            ) => {
                assert_eq!(p1, 50);
                assert_eq!(p2, 50);
            }
            _ => panic!("Expected ExecutionProgress events"),
        }
    }

    #[test]
    fn test_progress_clamping() {
        let broadcaster = EventBroadcaster::new();
        let mut receiver = broadcaster.subscribe();

        // Progress should be clamped to 100
        broadcaster.execution_progress(Uuid::new_v4(), 150, "Test".to_string());

        let event = tokio_test::block_on(async { receiver.recv().await.unwrap() });
        match event {
            AgentEvent::ExecutionProgress { progress, .. } => {
                assert_eq!(progress, 100);
            }
            _ => panic!("Expected ExecutionProgress event"),
        }
    }
}
