//! Integration tests for error recovery endpoints (retry_task, cancel_task)

use miyabi_a2a::{
    http::{cancel_task, retry_task, AppState, WsState},
    storage::{PaginatedResult, StorageError, TaskFilter, TaskStorage, TaskUpdate},
    task::{A2ATask, TaskStatus, TaskType},
};
use serde_json::json;
use std::sync::Arc;

/// Mock task storage for testing
#[derive(Clone)]
struct MockTaskStorage {
    tasks: Arc<tokio::sync::RwLock<std::collections::HashMap<u64, A2ATask>>>,
}

impl MockTaskStorage {
    fn new() -> Self {
        Self {
            tasks: Arc::new(tokio::sync::RwLock::new(std::collections::HashMap::new())),
        }
    }

    async fn insert_task(&self, task: A2ATask) {
        let mut tasks = self.tasks.write().await;
        tasks.insert(task.id, task);
    }
}

#[async_trait::async_trait]
impl TaskStorage for MockTaskStorage {
    async fn save_task(&self, task: A2ATask) -> Result<u64, StorageError> {
        let id = task.id;
        self.insert_task(task).await;
        Ok(id)
    }

    async fn get_task(&self, id: u64) -> Result<Option<A2ATask>, StorageError> {
        let tasks = self.tasks.read().await;
        Ok(tasks.get(&id).cloned())
    }

    async fn list_tasks(&self, _filter: TaskFilter) -> Result<Vec<A2ATask>, StorageError> {
        let tasks = self.tasks.read().await;
        Ok(tasks.values().cloned().collect())
    }

    async fn list_tasks_paginated(
        &self,
        _filter: TaskFilter,
    ) -> Result<PaginatedResult<A2ATask>, StorageError> {
        let tasks = self.list_tasks(_filter).await?;
        Ok(PaginatedResult {
            items: tasks,
            next_cursor: None,
            previous_cursor: None,
            has_more: false,
        })
    }

    async fn update_task(&self, id: u64, update: TaskUpdate) -> Result<(), StorageError> {
        let mut tasks = self.tasks.write().await;
        if let Some(task) = tasks.get_mut(&id) {
            if let Some(status) = update.status {
                task.status = status;
            }
            if let Some(desc) = update.description {
                task.description = desc;
            }
            if let Some(agent) = update.agent {
                task.agent = Some(agent);
            }
            if let Some(priority) = update.priority {
                task.priority = priority;
            }
            if let Some(retry_count) = update.retry_count {
                task.retry_count = retry_count;
            }
            task.updated_at = chrono::Utc::now();
            Ok(())
        } else {
            Err(StorageError::NotFound(id))
        }
    }

    async fn delete_task(&self, id: u64) -> Result<(), StorageError> {
        let mut tasks = self.tasks.write().await;
        tasks.remove(&id);
        Ok(())
    }
}

/// Helper to create a test app state
fn create_test_state() -> AppState {
    let ws_state = Arc::new(WsState::new());
    let storage = Arc::new(MockTaskStorage::new());
    AppState { ws_state, storage }
}

/// Helper to create a failed task
async fn create_failed_task(storage: &MockTaskStorage, id: u64, retry_count: u32) -> A2ATask {
    let task = A2ATask {
        id,
        title: format!("Test Task {}", id),
        description: "Test failed task".to_string(),
        status: TaskStatus::Failed,
        task_type: TaskType::CodeGeneration,
        agent: Some("test-agent".to_string()),
        context_id: None,
        priority: 5,
        retry_count,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        issue_url: format!("https://github.com/test/repo/issues/{}", id),
    };
    storage.insert_task(task.clone()).await;
    task
}

/// Helper to create a submitted task
async fn create_submitted_task(storage: &MockTaskStorage, id: u64) -> A2ATask {
    let task = A2ATask {
        id,
        title: format!("Test Task {}", id),
        description: "Test submitted task".to_string(),
        status: TaskStatus::Submitted,
        task_type: TaskType::CodeGeneration,
        agent: Some("test-agent".to_string()),
        context_id: None,
        priority: 5,
        retry_count: 0,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        issue_url: format!("https://github.com/test/repo/issues/{}", id),
    };
    storage.insert_task(task.clone()).await;
    task
}

// ===== retry_task Tests =====

#[tokio::test]
async fn test_retry_task_success() {
    let state = create_test_state();
    let storage = MockTaskStorage::new();

    // Create a failed task with 0 retries
    create_failed_task(&storage, 1, 0).await;

    let state = AppState {
        ws_state: state.ws_state,
        storage: Arc::new(storage),
    };

    let payload = json!({
        "reason": "Retrying after fixing dependencies"
    });

    let response = retry_task(
        axum::extract::State(state.clone()),
        axum::extract::Path("1".to_string()),
        axum::Json(serde_json::from_value(payload).unwrap()),
    )
    .await;

    assert!(response.is_ok());
    let response = response.unwrap();
    assert_eq!(response.0.retry_count, 1);
    assert_eq!(response.0.status, "submitted");

    // Verify task was updated
    let task = state.storage.get_task(1).await.unwrap().unwrap();
    assert_eq!(task.status, TaskStatus::Submitted);
    assert_eq!(task.retry_count, 1);
}

#[tokio::test]
async fn test_retry_task_not_found() {
    let state = create_test_state();

    let payload = json!({
        "reason": "Test"
    });

    let response = retry_task(
        axum::extract::State(state),
        axum::extract::Path("999".to_string()),
        axum::Json(serde_json::from_value(payload).unwrap()),
    )
    .await;

    assert!(response.is_err());
    let error = response.unwrap_err();
    assert_eq!(error.status, 404);
    assert_eq!(error.error_code, "TASK_NOT_FOUND");
}

#[tokio::test]
async fn test_retry_task_invalid_state() {
    let state = create_test_state();
    let storage = MockTaskStorage::new();

    // Create a task in Submitted state (not Failed)
    create_submitted_task(&storage, 1).await;

    let state = AppState {
        ws_state: state.ws_state,
        storage: Arc::new(storage),
    };

    let payload = json!({
        "reason": "Test"
    });

    let response = retry_task(
        axum::extract::State(state),
        axum::extract::Path("1".to_string()),
        axum::Json(serde_json::from_value(payload).unwrap()),
    )
    .await;

    assert!(response.is_err());
    let error = response.unwrap_err();
    assert_eq!(error.status, 409);
    assert_eq!(error.error_code, "INVALID_TASK_STATE");
}

#[tokio::test]
async fn test_retry_task_max_retries_exceeded() {
    let state = create_test_state();
    let storage = MockTaskStorage::new();

    // Create a failed task that already has 3 retries (max)
    create_failed_task(&storage, 1, 3).await;

    let state = AppState {
        ws_state: state.ws_state,
        storage: Arc::new(storage),
    };

    let payload = json!({
        "reason": "Test"
    });

    let response = retry_task(
        axum::extract::State(state),
        axum::extract::Path("1".to_string()),
        axum::Json(serde_json::from_value(payload).unwrap()),
    )
    .await;

    assert!(response.is_err());
    let error = response.unwrap_err();
    assert_eq!(error.status, 429);
    assert_eq!(error.error_code, "MAX_RETRIES_EXCEEDED");
}

#[tokio::test]
async fn test_retry_task_invalid_task_id() {
    let state = create_test_state();

    let payload = json!({
        "reason": "Test"
    });

    let response = retry_task(
        axum::extract::State(state),
        axum::extract::Path("invalid".to_string()),
        axum::Json(serde_json::from_value(payload).unwrap()),
    )
    .await;

    assert!(response.is_err());
    let error = response.unwrap_err();
    assert_eq!(error.status, 400);
    assert_eq!(error.error_code, "INVALID_TASK_ID");
}

// ===== cancel_task Tests =====

#[tokio::test]
async fn test_cancel_task_success() {
    let state = create_test_state();
    let storage = MockTaskStorage::new();

    // Create a submitted task
    create_submitted_task(&storage, 1).await;

    let state = AppState {
        ws_state: state.ws_state,
        storage: Arc::new(storage),
    };

    let response =
        cancel_task(axum::extract::State(state.clone()), axum::extract::Path("1".to_string()))
            .await;

    assert!(response.is_ok());
    let response = response.unwrap();
    assert_eq!(response.0.status, "cancelled");

    // Verify task was updated
    let task = state.storage.get_task(1).await.unwrap().unwrap();
    assert_eq!(task.status, TaskStatus::Cancelled);
}

#[tokio::test]
async fn test_cancel_task_not_found() {
    let state = create_test_state();

    let response =
        cancel_task(axum::extract::State(state), axum::extract::Path("999".to_string())).await;

    assert!(response.is_err());
    let error = response.unwrap_err();
    assert_eq!(error.status, 404);
    assert_eq!(error.error_code, "TASK_NOT_FOUND");
}

#[tokio::test]
async fn test_cancel_task_invalid_state() {
    let state = create_test_state();
    let storage = MockTaskStorage::new();

    // Create a failed task (not Submitted or Working)
    create_failed_task(&storage, 1, 0).await;

    let state = AppState {
        ws_state: state.ws_state,
        storage: Arc::new(storage),
    };

    let response =
        cancel_task(axum::extract::State(state), axum::extract::Path("1".to_string())).await;

    assert!(response.is_err());
    let error = response.unwrap_err();
    assert_eq!(error.status, 409);
    assert_eq!(error.error_code, "INVALID_TASK_STATE");
}

#[tokio::test]
async fn test_cancel_task_invalid_task_id() {
    let state = create_test_state();

    let response =
        cancel_task(axum::extract::State(state), axum::extract::Path("invalid".to_string())).await;

    assert!(response.is_err());
    let error = response.unwrap_err();
    assert_eq!(error.status, 400);
    assert_eq!(error.error_code, "INVALID_TASK_ID");
}
