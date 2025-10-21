//! Async RPC handlers for gRPC integration.
//!
//! This module provides async traits and handlers that bridge the sync
//! A2ARpcServer to async gRPC endpoints.

use crate::error::{A2AError, A2AResult};
use crate::types::{AgentCard, Part, Role, Task, TaskStatus};
use async_trait::async_trait;

// ============================================================================
// Async Storage Trait
// ============================================================================

/// Async trait for task storage operations (used by gRPC layer)
#[async_trait]
pub trait TaskStorage: Send + Sync {
    /// Create a new task
    async fn create_task(&self, task: Task) -> A2AResult<()>;

    /// Get a task by ID
    async fn get_task(&self, task_id: &str) -> A2AResult<Option<Task>>;

    /// Update an existing task
    async fn update_task(&self, task: Task) -> A2AResult<()>;

    /// List tasks with optional filters
    async fn list_tasks(
        &self,
        context_id: Option<&str>,
        status: Option<TaskStatus>,
        limit: usize,
    ) -> A2AResult<Vec<Task>>;

    /// Cancel a task
    async fn cancel_task(&self, task_id: &str) -> A2AResult<()>;
}

// ============================================================================
// Request/Response Parameter Structs
// ============================================================================

/// Parameters for message/send RPC method
#[derive(Debug, Clone)]
pub struct MessageSendParams {
    /// Message role (user, assistant, system)
    pub role: Role,

    /// Message parts (text, artifacts, etc.)
    pub parts: Vec<Part>,

    /// Optional context ID
    pub context_id: Option<String>,
}

/// Response from message/send RPC method
#[derive(Debug, Clone)]
pub struct MessageSendResponse {
    /// Created task ID
    pub task_id: String,

    /// Initial task status
    pub status: TaskStatus,
}

/// Parameters for tasks/get RPC method
#[derive(Debug, Clone)]
pub struct TasksGetParams {
    /// Task ID to retrieve
    pub task_id: String,
}

/// Response from tasks/get RPC method
#[derive(Debug, Clone)]
pub struct TasksGetResponse {
    /// Retrieved task
    pub task: Task,
}

/// Parameters for tasks/cancel RPC method
#[derive(Debug, Clone)]
pub struct TasksCancelParams {
    /// Task ID to cancel
    pub task_id: String,
}

/// Response from tasks/cancel RPC method
#[derive(Debug, Clone)]
pub struct TasksCancelResponse {
    /// Cancelled task ID
    pub task_id: String,

    /// New status (should be Cancelled)
    pub status: TaskStatus,
}

/// Parameters for tasks/list RPC method
#[derive(Debug, Clone)]
pub struct TasksListParams {
    /// Optional context ID filter
    pub context_id: Option<String>,

    /// Optional status filter
    pub status: Option<TaskStatus>,

    /// Maximum number of tasks to return
    pub limit: usize,
}

/// Response from tasks/list RPC method
#[derive(Debug, Clone)]
pub struct TasksListResponse {
    /// List of tasks
    pub tasks: Vec<Task>,

    /// Total count (before limit applied)
    pub total_count: usize,
}

/// Parameters for getAuthenticatedExtendedCard RPC method
#[derive(Debug, Clone)]
pub struct GetAuthenticatedExtendedCardParams {
    /// JWT token for authentication
    pub token: String,
}

/// Response from getAuthenticatedExtendedCard RPC method
#[derive(Debug, Clone)]
pub struct GetAuthenticatedExtendedCardResponse {
    /// Agent card
    pub card: AgentCard,
}

// ============================================================================
// A2A RPC Handler
// ============================================================================

/// Async RPC handler for A2A Protocol methods
///
/// This handler wraps a TaskStorage implementation and provides async methods
/// for all A2A RPC operations.
pub struct A2ARpcHandler<S: TaskStorage> {
    storage: S,
}

impl<S: TaskStorage> A2ARpcHandler<S> {
    /// Create a new RPC handler
    pub fn new(storage: S) -> Self {
        Self { storage }
    }

    /// Handle message/send RPC method
    pub async fn message_send(&self, params: MessageSendParams) -> A2AResult<MessageSendResponse> {
        // Create a prompt from the message parts
        let prompt = params
            .parts
            .iter()
            .filter_map(|part| match part {
                Part::Text { content } => Some(content.clone()),
                _ => None,
            })
            .collect::<Vec<_>>()
            .join("\n");

        // Create a new task
        let mut task = Task::new(prompt);

        if let Some(context_id) = params.context_id {
            task.context_id = Some(context_id);
        }

        let task_id = task.id.clone();
        let status = task.status;

        // Store the task
        self.storage.create_task(task).await?;

        Ok(MessageSendResponse { task_id, status })
    }

    /// Handle tasks/get RPC method
    pub async fn tasks_get(&self, params: TasksGetParams) -> A2AResult<TasksGetResponse> {
        let task = self
            .storage
            .get_task(&params.task_id)
            .await?
            .ok_or_else(|| A2AError::TaskNotFound(params.task_id.clone()))?;

        Ok(TasksGetResponse { task })
    }

    /// Handle tasks/cancel RPC method
    pub async fn tasks_cancel(&self, params: TasksCancelParams) -> A2AResult<TasksCancelResponse> {
        self.storage.cancel_task(&params.task_id).await?;

        Ok(TasksCancelResponse {
            task_id: params.task_id,
            status: TaskStatus::Cancelled,
        })
    }

    /// Handle tasks/list RPC method
    pub async fn tasks_list(&self, params: TasksListParams) -> A2AResult<TasksListResponse> {
        let tasks = self
            .storage
            .list_tasks(
                params.context_id.as_deref(),
                params.status,
                params.limit,
            )
            .await?;

        let total_count = tasks.len();

        Ok(TasksListResponse { tasks, total_count })
    }
}

// ============================================================================
// Agent Card RPC Handler
// ============================================================================

/// Async RPC handler for Agent Card operations
pub struct AgentCardRpcHandler {
    /// Agent card to serve
    card: AgentCard,
}

impl AgentCardRpcHandler {
    /// Create a new agent card handler
    pub fn new(card: AgentCard) -> Self {
        Self { card }
    }

    /// Handle getAuthenticatedExtendedCard RPC method
    pub async fn get_authenticated_extended_card(
        &self,
        _params: GetAuthenticatedExtendedCardParams,
    ) -> A2AResult<GetAuthenticatedExtendedCardResponse> {
        // TODO: Validate JWT token in params.token
        // For now, just return the card
        Ok(GetAuthenticatedExtendedCardResponse {
            card: self.card.clone(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Arc;
    use tokio::sync::RwLock;

    #[derive(Clone)]
    struct MemoryTaskStorage {
        tasks: Arc<RwLock<HashMap<String, Task>>>,
    }

    impl MemoryTaskStorage {
        fn new() -> Self {
            Self {
                tasks: Arc::new(RwLock::new(HashMap::new())),
            }
        }
    }

    #[async_trait]
    impl TaskStorage for MemoryTaskStorage {
        async fn create_task(&self, task: Task) -> A2AResult<()> {
            let mut tasks = self.tasks.write().await;
            tasks.insert(task.id.clone(), task);
            Ok(())
        }

        async fn get_task(&self, task_id: &str) -> A2AResult<Option<Task>> {
            let tasks = self.tasks.read().await;
            Ok(tasks.get(task_id).cloned())
        }

        async fn update_task(&self, task: Task) -> A2AResult<()> {
            let mut tasks = self.tasks.write().await;
            if !tasks.contains_key(&task.id) {
                return Err(A2AError::TaskNotFound(task.id.clone()));
            }
            tasks.insert(task.id.clone(), task);
            Ok(())
        }

        async fn list_tasks(
            &self,
            context_id: Option<&str>,
            status: Option<TaskStatus>,
            limit: usize,
        ) -> A2AResult<Vec<Task>> {
            let tasks = self.tasks.read().await;
            let mut filtered: Vec<Task> = tasks
                .values()
                .filter(|task| {
                    if let Some(ctx) = context_id {
                        if task.context_id.as_deref() != Some(ctx) {
                            return false;
                        }
                    }
                    if let Some(s) = status {
                        if task.status != s {
                            return false;
                        }
                    }
                    true
                })
                .cloned()
                .collect();

            filtered.truncate(limit);
            Ok(filtered)
        }

        async fn cancel_task(&self, task_id: &str) -> A2AResult<()> {
            let mut tasks = self.tasks.write().await;
            let task = tasks
                .get_mut(task_id)
                .ok_or_else(|| A2AError::TaskNotFound(task_id.to_string()))?;

            if task.is_terminal() {
                return Err(A2AError::InvalidRequest(format!(
                    "Task {} is already terminal",
                    task_id
                )));
            }

            task.set_status(TaskStatus::Cancelled);
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_message_send() {
        let storage = MemoryTaskStorage::new();
        let handler = A2ARpcHandler::new(storage);

        let params = MessageSendParams {
            role: Role::User,
            parts: vec![Part::text("Test message")],
            context_id: Some("test-ctx".to_string()),
        };

        let response = handler.message_send(params).await.unwrap();
        assert_eq!(response.status, TaskStatus::Submitted);
        assert!(!response.task_id.is_empty());
    }

    #[tokio::test]
    async fn test_tasks_get() {
        let storage = MemoryTaskStorage::new();
        let handler = A2ARpcHandler::new(storage.clone());

        // Create a task
        let send_params = MessageSendParams {
            role: Role::User,
            parts: vec![Part::text("Test")],
            context_id: None,
        };
        let send_response = handler.message_send(send_params).await.unwrap();

        // Get the task
        let get_params = TasksGetParams {
            task_id: send_response.task_id.clone(),
        };
        let get_response = handler.tasks_get(get_params).await.unwrap();

        assert_eq!(get_response.task.id, send_response.task_id);
    }

    #[tokio::test]
    async fn test_tasks_cancel() {
        let storage = MemoryTaskStorage::new();
        let handler = A2ARpcHandler::new(storage.clone());

        // Create a task
        let send_params = MessageSendParams {
            role: Role::User,
            parts: vec![Part::text("Test")],
            context_id: None,
        };
        let send_response = handler.message_send(send_params).await.unwrap();

        // Cancel the task
        let cancel_params = TasksCancelParams {
            task_id: send_response.task_id.clone(),
        };
        let cancel_response = handler.tasks_cancel(cancel_params).await.unwrap();

        assert_eq!(cancel_response.status, TaskStatus::Cancelled);
    }

    #[tokio::test]
    async fn test_tasks_list() {
        let storage = MemoryTaskStorage::new();
        let handler = A2ARpcHandler::new(storage.clone());

        // Create multiple tasks
        for i in 0..5 {
            let params = MessageSendParams {
                role: Role::User,
                parts: vec![Part::text(format!("Test {}", i))],
                context_id: Some("test-ctx".to_string()),
            };
            handler.message_send(params).await.unwrap();
        }

        // List tasks
        let list_params = TasksListParams {
            context_id: Some("test-ctx".to_string()),
            status: None,
            limit: 100,
        };
        let list_response = handler.tasks_list(list_params).await.unwrap();

        assert_eq!(list_response.total_count, 5);
        assert_eq!(list_response.tasks.len(), 5);
    }
}
