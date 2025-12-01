//! Integration tests for Agent TaskMetadata persistence
//!
//! Tests that agents properly create and update TaskMetadata during execution.

use miyabi_core::task_metadata::{TaskMetadata, TaskMetadataManager, TaskStatus};
use tempfile::TempDir;

#[cfg(test)]
mod task_metadata_tests {
    use super::*;

    fn create_temp_project_root() -> TempDir {
        TempDir::new().expect("Failed to create temp directory")
    }

    #[test]
    fn test_task_metadata_manager_helper_methods() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        // Create a test task
        let task_id = "test-task-123";
        let metadata = TaskMetadata::new(
            task_id.to_string(),
            Some(42),
            "Test Task".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );

        // Save initial metadata
        manager.save(&metadata).unwrap();

        // Test mark_started helper
        manager.mark_started(task_id).unwrap();
        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Running);
        assert!(loaded.started_at.is_some());

        // Test mark_completed helper (success)
        manager.mark_completed(task_id, true).unwrap();
        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Success);
        assert!(loaded.completed_at.is_some());
        assert!(loaded.duration_secs.is_some());
        assert_eq!(loaded.success, Some(true));
    }

    #[test]
    fn test_task_metadata_manager_mark_failed() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        let task_id = "test-task-fail";
        let metadata = TaskMetadata::new(
            task_id.to_string(),
            Some(99),
            "Failing Task".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );

        manager.save(&metadata).unwrap();
        manager.mark_started(task_id).unwrap();

        // Test mark_failed helper
        let error_msg = "Test error message".to_string();
        manager.mark_failed(task_id, Some(error_msg.clone())).unwrap();

        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Failed);
        assert_eq!(loaded.success, Some(false));
        assert_eq!(loaded.error_message, Some(error_msg));
        assert!(loaded.completed_at.is_some());
    }

    #[test]
    fn test_task_metadata_with_parent_task_id() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        // Create parent task
        let parent_id = "parent-task-001";
        let parent_metadata = TaskMetadata::new(
            parent_id.to_string(),
            Some(100),
            "Parent Task".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&parent_metadata).unwrap();

        // Create child task with parent_task_id
        let child_id = "child-task-001";
        let mut child_metadata = TaskMetadata::new(
            child_id.to_string(),
            Some(100),
            "Child Task".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        child_metadata.parent_task_id = Some(parent_id.to_string());
        manager.save(&child_metadata).unwrap();

        // Verify parent-child relationship
        let loaded_child = manager.load(child_id).unwrap();
        assert_eq!(loaded_child.parent_task_id, Some(parent_id.to_string()));

        // Verify we can query for children by filtering
        let all_tasks = manager.list_all().unwrap();
        let children: Vec<_> = all_tasks
            .into_iter()
            .filter(|t| t.parent_task_id == Some(parent_id.to_string()))
            .collect();

        assert_eq!(children.len(), 1);
        assert_eq!(children[0].id, child_id);
    }

    #[test]
    fn test_update_status_helper() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        let task_id = "test-task-status";
        let metadata = TaskMetadata::new(
            task_id.to_string(),
            None,
            "Status Test".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&metadata).unwrap();

        // Update to Running
        manager.update_status(task_id, TaskStatus::Running).unwrap();
        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Running);

        // Update to Cancelled
        manager.update_status(task_id, TaskStatus::Cancelled).unwrap();
        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Cancelled);
    }

    #[test]
    fn test_full_task_lifecycle() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        let task_id = "lifecycle-task";

        // 1. Create task (Pending)
        let metadata = TaskMetadata::new(
            task_id.to_string(),
            Some(200),
            "Lifecycle Test Task".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&metadata).unwrap();

        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Pending);
        assert!(loaded.started_at.is_none());
        assert!(loaded.completed_at.is_none());

        // 2. Start task (Running)
        manager.mark_started(task_id).unwrap();

        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Running);
        assert!(loaded.started_at.is_some());
        assert!(loaded.completed_at.is_none());

        // 3. Complete task (Success)
        manager.mark_completed(task_id, true).unwrap();

        let loaded = manager.load(task_id).unwrap();
        assert_eq!(loaded.status, TaskStatus::Success);
        assert!(loaded.started_at.is_some());
        assert!(loaded.completed_at.is_some());
        assert!(loaded.duration_secs.is_some());
        assert_eq!(loaded.success, Some(true));
    }

    #[test]
    fn test_multiple_subtasks() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        let parent_id = "coordinator-task";
        let parent = TaskMetadata::new(
            parent_id.to_string(),
            Some(300),
            "Coordinator Parent".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&parent).unwrap();

        // Create 4 subtasks (like CoordinatorAgent would)
        let subtask_ids = ["task-300-analysis", "task-300-impl", "task-300-test", "task-300-review"];

        for (i, subtask_id) in subtask_ids.iter().enumerate() {
            let mut subtask = TaskMetadata::new(
                subtask_id.to_string(),
                Some(300),
                format!("Subtask {}", i + 1),
                temp_dir.path().to_path_buf(),
                "main".to_string(),
            );
            subtask.parent_task_id = Some(parent_id.to_string());
            manager.save(&subtask).unwrap();
        }

        // Verify all subtasks are persisted
        let all_tasks = manager.list_all().unwrap();
        let subtasks: Vec<_> = all_tasks
            .into_iter()
            .filter(|t| t.parent_task_id == Some(parent_id.to_string()))
            .collect();

        assert_eq!(subtasks.len(), 4);

        // Verify each subtask has correct parent
        for subtask in &subtasks {
            assert_eq!(subtask.parent_task_id, Some(parent_id.to_string()));
            assert_eq!(subtask.issue_number, Some(300));
        }
    }

    #[test]
    fn test_find_by_issue() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        // Create multiple tasks for issue #400
        for i in 1..=3 {
            let task = TaskMetadata::new(
                format!("task-400-{}", i),
                Some(400),
                format!("Task {}", i),
                temp_dir.path().to_path_buf(),
                "main".to_string(),
            );
            manager.save(&task).unwrap();
        }

        // Create task for different issue
        let other_task = TaskMetadata::new(
            "task-401-1".to_string(),
            Some(401),
            "Other Task".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&other_task).unwrap();

        // Query for issue #400
        let tasks_400 = manager.find_by_issue(400).unwrap();
        assert_eq!(tasks_400.len(), 3);

        for task in &tasks_400 {
            assert_eq!(task.issue_number, Some(400));
        }
    }

    #[test]
    fn test_find_by_status() {
        let temp_dir = create_temp_project_root();
        let manager = TaskMetadataManager::new(temp_dir.path()).unwrap();

        // Create tasks with different statuses
        let pending_task = TaskMetadata::new(
            "pending-1".to_string(),
            Some(500),
            "Pending".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&pending_task).unwrap();

        let running_task = TaskMetadata::new(
            "running-1".to_string(),
            Some(501),
            "Running".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&running_task).unwrap();
        manager.mark_started("running-1").unwrap();

        let success_task = TaskMetadata::new(
            "success-1".to_string(),
            Some(502),
            "Success".to_string(),
            temp_dir.path().to_path_buf(),
            "main".to_string(),
        );
        manager.save(&success_task).unwrap();
        manager.mark_started("success-1").unwrap();
        manager.mark_completed("success-1", true).unwrap();

        // Query by status
        let pending = manager.find_by_status(TaskStatus::Pending).unwrap();
        assert_eq!(pending.len(), 1);

        let running = manager.find_by_status(TaskStatus::Running).unwrap();
        assert_eq!(running.len(), 1);

        let success = manager.find_by_status(TaskStatus::Success).unwrap();
        assert_eq!(success.len(), 1);
    }
}
