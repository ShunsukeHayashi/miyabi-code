//! Integration tests for miyabi-a2a
//!
//! These tests verify the complete functionality of the A2A task storage system.

use miyabi_a2a::{
    A2ATask, GitHubTaskStorage, TaskFilter, TaskStatus, TaskStorage, TaskType, TaskUpdate,
};

/// Test task creation and retrieval
///
/// This test requires a valid GitHub token and will create real Issues.
/// To run: `GITHUB_TOKEN=xxx cargo test --package miyabi-a2a --test integration_test`
#[tokio::test]
#[ignore] // Requires GITHUB_TOKEN and creates real Issues
async fn test_task_lifecycle() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let storage = GitHubTaskStorage::new(
        token,
        "ShunsukeHayashi".to_string(),
        "miyabi-private".to_string(),
    )
    .expect("Failed to create storage");

    // Create a test task
    let task = A2ATask {
        id: 0, // Will be assigned by GitHub
        title: "[TEST] A2A Integration Test Task".to_string(),
        description: "This is a test task created by integration tests. Safe to delete."
            .to_string(),
        status: TaskStatus::Pending,
        task_type: TaskType::Testing,
        agent: Some("TestAgent".to_string()),
        context_id: Some("test-context-123".to_string()),
        priority: 3,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        issue_url: String::new(), // Will be set by GitHub
    };

    // Save task
    let task_id = storage.save_task(task).await.expect("Failed to save task");
    println!("Created task with ID: {}", task_id);

    // Retrieve task
    let retrieved = storage
        .get_task(task_id)
        .await
        .expect("Failed to get task")
        .expect("Task not found");

    assert_eq!(retrieved.title, "[TEST] A2A Integration Test Task");
    assert_eq!(retrieved.status, TaskStatus::Pending);
    assert_eq!(retrieved.task_type, TaskType::Testing);

    // Update task status
    let update = TaskUpdate {
        status: Some(TaskStatus::InProgress),
        description: None,
        agent: None,
        priority: None,
    };

    storage
        .update_task(task_id, update)
        .await
        .expect("Failed to update task");

    // Verify update
    let updated = storage
        .get_task(task_id)
        .await
        .expect("Failed to get updated task")
        .expect("Task not found");

    assert_eq!(updated.status, TaskStatus::InProgress);

    // Clean up - close the task
    storage
        .delete_task(task_id)
        .await
        .expect("Failed to delete task");

    println!("Test completed successfully. Task #{} closed.", task_id);
}

/// Test task filtering
#[tokio::test]
#[ignore] // Requires GITHUB_TOKEN
async fn test_task_filtering() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let storage = GitHubTaskStorage::new(
        token,
        "ShunsukeHayashi".to_string(),
        "miyabi-private".to_string(),
    )
    .expect("Failed to create storage");

    // List all pending tasks
    let filter = TaskFilter {
        status: Some(TaskStatus::Pending),
        ..Default::default()
    };

    let tasks = storage
        .list_tasks(filter)
        .await
        .expect("Failed to list tasks");

    println!("Found {} pending tasks", tasks.len());

    for task in &tasks {
        println!("  - #{}: {} ({})", task.id, task.title, task.status);
    }
}

/// Test error handling for non-existent task
#[tokio::test]
#[ignore] // Requires GITHUB_TOKEN
async fn test_nonexistent_task() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let storage = GitHubTaskStorage::new(
        token,
        "ShunsukeHayashi".to_string(),
        "miyabi-private".to_string(),
    )
    .expect("Failed to create storage");

    // Try to get a task that doesn't exist (very high number unlikely to exist)
    let result = storage.get_task(999999999).await;

    match result {
        Ok(None) => println!("Correctly returned None for non-existent task"),
        Ok(Some(_)) => panic!("Unexpectedly found task #999999999"),
        Err(e) => println!("Got error (acceptable): {}", e),
    }
}
