//! Integration tests for miyabi-a2a
//!
//! These tests verify the complete functionality of the A2A task storage system.

use miyabi_a2a::{A2ATask, GitHubTaskStorage, TaskFilter, TaskStatus, TaskStorage, TaskType, TaskUpdate};

/// Test task creation and retrieval
///
/// This test requires a valid GitHub token and will create real Issues.
/// To run: `GITHUB_TOKEN=xxx cargo test --package miyabi-a2a --test integration_test`
#[tokio::test]
#[ignore] // Requires GITHUB_TOKEN and creates real Issues
async fn test_task_lifecycle() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let storage = GitHubTaskStorage::new(token, "customer-cloud".to_string(), "miyabi-private".to_string())
        .expect("Failed to create storage");

    // Create a test task
    let task = A2ATask {
        id: 0, // Will be assigned by GitHub
        title: "[TEST] A2A Integration Test Task".to_string(),
        description: "This is a test task created by integration tests. Safe to delete.".to_string(),
        status: TaskStatus::Submitted,
        task_type: TaskType::Testing,
        agent: Some("TestAgent".to_string()),
        context_id: Some("test-context-123".to_string()),
        priority: 3,
        retry_count: 0,
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
    assert_eq!(retrieved.status, TaskStatus::Submitted);
    assert_eq!(retrieved.task_type, TaskType::Testing);

    // Update task status
    let update = TaskUpdate {
        status: Some(TaskStatus::Working),
        description: None,
        agent: None,
        priority: None,
        retry_count: None,
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

    assert_eq!(updated.status, TaskStatus::Working);

    // Clean up - close the task
    storage.delete_task(task_id).await.expect("Failed to delete task");

    println!("Test completed successfully. Task #{} closed.", task_id);
}

/// Test task filtering
#[tokio::test]
#[ignore] // Requires GITHUB_TOKEN
async fn test_task_filtering() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let storage = GitHubTaskStorage::new(token, "customer-cloud".to_string(), "miyabi-private".to_string())
        .expect("Failed to create storage");

    // List all submitted tasks
    let filter = TaskFilter { status: Some(TaskStatus::Submitted), ..Default::default() };

    let tasks = storage.list_tasks(filter).await.expect("Failed to list tasks");

    println!("Found {} submitted tasks", tasks.len());

    for task in &tasks {
        println!("  - #{}: {} ({})", task.id, task.title, task.status);
    }
}

/// Test error handling for non-existent task
#[tokio::test]
#[ignore] // Requires GITHUB_TOKEN
async fn test_nonexistent_task() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let storage = GitHubTaskStorage::new(token, "customer-cloud".to_string(), "miyabi-private".to_string())
        .expect("Failed to create storage");

    // Try to get a task that doesn't exist (very high number unlikely to exist)
    let result = storage.get_task(999999999).await;

    match result {
        Ok(None) => println!("Correctly returned None for non-existent task"),
        Ok(Some(_)) => panic!("Unexpectedly found task #999999999"),
        Err(e) => println!("Got error (acceptable): {}", e),
    }
}

/// Test cursor-based pagination
///
/// This test verifies forward/backward pagination with cursors.
/// Requires GITHUB_TOKEN and creates multiple test Issues.
#[tokio::test]
#[ignore] // Requires GITHUB_TOKEN and creates real Issues
async fn test_cursor_pagination() {
    let token = std::env::var("GITHUB_TOKEN").expect("GITHUB_TOKEN not set");
    let storage = GitHubTaskStorage::new(token, "customer-cloud".to_string(), "miyabi-private".to_string())
        .expect("Failed to create storage");

    // Create 5 test tasks
    println!("Creating 5 test tasks...");
    let mut task_ids = Vec::new();
    for i in 0..5 {
        let task = A2ATask {
            id: 0,
            title: format!("[TEST] Pagination Test Task {}", i),
            description: format!("Test task #{} for pagination testing", i),
            status: TaskStatus::Submitted,
            task_type: TaskType::Testing,
            agent: None,
            context_id: Some("pagination-test".to_string()),
            priority: 3,
            retry_count: 0,
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
            issue_url: String::new(),
        };

        let task_id = storage.save_task(task).await.expect("Failed to save task");
        task_ids.push(task_id);
        println!("  Created task #{}", task_id);

        // Small delay to ensure different timestamps
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }

    // Test forward pagination (page size 2)
    println!("\nTesting forward pagination...");
    let filter = TaskFilter { context_id: Some("pagination-test".to_string()), limit: Some(2), ..Default::default() };

    let page1 = storage
        .list_tasks_paginated(filter.clone())
        .await
        .expect("Failed to get page 1");

    println!("Page 1: {} items, has_more: {}", page1.items.len(), page1.has_more);
    assert!(page1.items.len() <= 2);

    // Navigate to page 2 if there are more items
    if let Some(cursor) = page1.next_cursor {
        let filter = TaskFilter {
            context_id: Some("pagination-test".to_string()),
            cursor: Some(cursor),
            limit: Some(2),
            ..Default::default()
        };

        let page2 = storage
            .list_tasks_paginated(filter)
            .await
            .expect("Failed to get page 2");

        println!("Page 2: {} items, has_more: {}", page2.items.len(), page2.has_more);
        assert!(page2.items.len() <= 2);

        // Test backward pagination
        if let Some(cursor) = page2.previous_cursor {
            let filter = TaskFilter {
                context_id: Some("pagination-test".to_string()),
                cursor: Some(cursor),
                limit: Some(2),
                ..Default::default()
            };

            let page1_again = storage
                .list_tasks_paginated(filter)
                .await
                .expect("Failed to navigate back");

            println!("Back to page 1: {} items", page1_again.items.len());
            assert!(page1_again.items.len() <= 2);
        }
    }

    // Clean up - close all test tasks
    println!("\nCleaning up test tasks...");
    for task_id in task_ids {
        storage.delete_task(task_id).await.expect("Failed to delete task");
        println!("  Closed task #{}", task_id);
    }

    println!("Pagination test completed successfully!");
}
