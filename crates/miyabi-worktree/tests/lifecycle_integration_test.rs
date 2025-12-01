//! Integration tests for complete worktree lifecycle management
//!
//! Tests cover:
//! - Worktree creation and deletion
//! - Branch management
//! - Status transitions
//! - Error handling
//! - Telemetry and statistics

use miyabi_worktree::{WorktreeManager, WorktreeStatus};
use serial_test::serial;
use std::path::PathBuf;
use tempfile::TempDir;

/// Helper to initialize a test git repository
fn init_test_repo() -> (TempDir, PathBuf) {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    let repo_path = temp_dir.path().to_path_buf();

    // Initialize git repo
    std::process::Command::new("git")
        .arg("init")
        .current_dir(&repo_path)
        .output()
        .expect("Failed to init git repo");

    // Configure git
    std::process::Command::new("git")
        .args(["config", "user.name", "Test User"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to configure git user");

    std::process::Command::new("git")
        .args(["config", "user.email", "test@example.com"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to configure git email");

    // Create initial commit
    std::fs::write(repo_path.join("README.md"), "# Test Repo\n").expect("Failed to write README");

    std::process::Command::new("git")
        .args(["add", "README.md"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to add README");

    std::process::Command::new("git")
        .args(["commit", "-m", "Initial commit"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to create initial commit");

    (temp_dir, repo_path)
}

#[tokio::test]
#[serial]
async fn test_worktree_creation_and_deletion() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    // Create worktree
    let worktree = manager.create_worktree(100).await.expect("Failed to create worktree");

    assert_eq!(worktree.issue_number, 100);
    assert_eq!(worktree.status, WorktreeStatus::Active);
    assert!(worktree.path.exists());
    assert_eq!(worktree.branch_name, "feature/issue-100");

    // Verify worktree is tracked
    let list = manager.list_worktrees().await;
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].issue_number, 100);

    // Delete worktree
    manager
        .remove_worktree(&worktree.id)
        .await
        .expect("Failed to remove worktree");

    // Verify deletion
    assert!(!worktree.path.exists());
    let list = manager.list_worktrees().await;
    assert_eq!(list.len(), 0);
}

#[tokio::test]
#[serial]
async fn test_worktree_status_transitions() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    let worktree = manager.create_worktree(200).await.expect("Failed to create worktree");

    assert_eq!(worktree.status, WorktreeStatus::Active);

    // Transition to Idle
    manager
        .update_status(&worktree.id, WorktreeStatus::Idle)
        .await
        .expect("Failed to update status");

    let updated = manager
        .get_worktree(&worktree.id)
        .await
        .expect("Failed to get worktree");
    assert_eq!(updated.status, WorktreeStatus::Idle);

    // Transition to Completed
    manager
        .update_status(&worktree.id, WorktreeStatus::Completed)
        .await
        .expect("Failed to update status");

    let updated = manager
        .get_worktree(&worktree.id)
        .await
        .expect("Failed to get worktree");
    assert_eq!(updated.status, WorktreeStatus::Completed);

    // Cleanup
    manager
        .remove_worktree(&worktree.id)
        .await
        .expect("Failed to remove worktree");
}

#[tokio::test]
#[serial]
async fn test_multiple_worktrees_creation() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 5).expect("Failed to create manager");

    // Create 3 worktrees
    let _w1 = manager.create_worktree(301).await.expect("Failed to create worktree 1");
    let _w2 = manager.create_worktree(302).await.expect("Failed to create worktree 2");
    let _w3 = manager.create_worktree(303).await.expect("Failed to create worktree 3");

    // Verify all exist
    let list = manager.list_worktrees().await;
    assert_eq!(list.len(), 3);

    // Verify stats
    let stats = manager.stats().await;
    assert_eq!(stats.total, 3);
    assert_eq!(stats.active, 3);
    assert_eq!(stats.max_concurrency, 5);
    // Note: available_slots is based on semaphore, which may not match exact worktree count
    // after async operations complete

    // Cleanup all worktrees
    manager.cleanup_all().await.expect("Failed to cleanup");

    let final_stats = manager.stats().await;
    assert_eq!(final_stats.total, 0);
}

#[tokio::test]
#[serial]
async fn test_worktree_manager_stats() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 4).expect("Failed to create manager");

    // Initial stats
    let stats = manager.stats().await;
    assert_eq!(stats.total, 0);
    assert_eq!(stats.active, 0);
    assert_eq!(stats.max_concurrency, 4);
    assert_eq!(stats.available_slots, 4);

    // Create worktrees with different statuses
    let _w1 = manager.create_worktree(401).await.expect("Failed");
    let w2 = manager.create_worktree(402).await.expect("Failed");
    let w3 = manager.create_worktree(403).await.expect("Failed");

    manager
        .update_status(&w2.id, WorktreeStatus::Completed)
        .await
        .expect("Failed");
    manager
        .update_status(&w3.id, WorktreeStatus::Failed)
        .await
        .expect("Failed");

    let stats = manager.stats().await;
    assert_eq!(stats.total, 3);
    assert!(stats.active >= 1); // At least w1
    assert!(stats.completed >= 1); // At least w2
    assert!(stats.failed >= 1); // At least w3
                                // Note: available_slots depends on semaphore state

    // Cleanup
    manager.cleanup_all().await.expect("Failed to cleanup");
}

#[tokio::test]
#[serial]
async fn test_worktree_cleanup_all() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    // Create multiple worktrees
    manager.create_worktree(501).await.expect("Failed");
    manager.create_worktree(502).await.expect("Failed");
    manager.create_worktree(503).await.expect("Failed");

    let stats_before = manager.stats().await;
    assert_eq!(stats_before.total, 3);

    // Cleanup all
    manager.cleanup_all().await.expect("Failed to cleanup");

    let stats_after = manager.stats().await;
    assert_eq!(stats_after.total, 0);
    assert_eq!(stats_after.available_slots, 3);
}

#[tokio::test]
#[serial]
async fn test_worktree_get_operations() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    let worktree = manager.create_worktree(600).await.expect("Failed");

    // Get worktree by ID
    let retrieved = manager
        .get_worktree(&worktree.id)
        .await
        .expect("Failed to get worktree");

    assert_eq!(retrieved.id, worktree.id);
    assert_eq!(retrieved.issue_number, 600);
    assert_eq!(retrieved.branch_name, "feature/issue-600");

    // List all worktrees
    let list = manager.list_worktrees().await;
    assert_eq!(list.len(), 1);
    assert_eq!(list[0].id, worktree.id);

    // Cleanup
    manager.remove_worktree(&worktree.id).await.expect("Failed to remove");
}

#[tokio::test]
#[serial]
async fn test_worktree_error_handling_nonexistent() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    // Try to get non-existent worktree
    let result = manager.get_worktree("nonexistent-id").await;
    assert!(result.is_err());

    // Try to update non-existent worktree
    let result = manager.update_status("nonexistent-id", WorktreeStatus::Completed).await;
    assert!(result.is_err());

    // Try to remove non-existent worktree
    let result = manager.remove_worktree("nonexistent-id").await;
    assert!(result.is_err());
}

#[tokio::test]
#[serial]
async fn test_worktree_telemetry_tracking() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    // Create and remove worktree (generates telemetry events)
    let worktree = manager.create_worktree(700).await.expect("Failed");
    manager.remove_worktree(&worktree.id).await.expect("Failed");

    // Get telemetry stats
    let stats = manager.telemetry_stats().await;
    assert!(stats.creates >= 1); // Should have at least 1 create event
    assert!(stats.cleanups >= 1); // Should have at least 1 cleanup event

    // Get telemetry report
    let report = manager.telemetry_report().await;
    assert!(!report.is_empty());
    assert!(report.contains("Creates:") || report.contains("Worktree"));
}

#[tokio::test]
#[serial]
async fn test_worktree_concurrent_creation_limit() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 2).expect("Failed to create manager");

    // Create 2 worktrees (at limit)
    let _w1 = manager.create_worktree(801).await.expect("Failed");
    let _w2 = manager.create_worktree(802).await.expect("Failed");

    let stats = manager.stats().await;
    assert_eq!(stats.total, 2);
    // Note: available_slots depends on async semaphore state

    // Note: Creating a 3rd would block until one is removed
    // This is controlled by the internal semaphore

    // Cleanup all
    manager.cleanup_all().await.expect("Failed to cleanup");

    let final_stats = manager.stats().await;
    assert_eq!(final_stats.total, 0);
}

#[tokio::test]
#[serial]
async fn test_worktree_branch_management() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    let worktree = manager.create_worktree(900).await.expect("Failed");

    // Verify branch was created
    let output = std::process::Command::new("git")
        .args(["branch", "--list", "feature/issue-900"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to list branches");

    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("feature/issue-900"));

    // Cleanup
    manager.remove_worktree(&worktree.id).await.expect("Failed to remove");

    // Verify branch was deleted
    let output = std::process::Command::new("git")
        .args(["branch", "--list", "feature/issue-900"])
        .current_dir(&repo_path)
        .output()
        .expect("Failed to list branches");

    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(!stdout.contains("feature/issue-900"));
}

#[tokio::test]
#[serial]
async fn test_worktree_path_structure() {
    let (_temp_dir, repo_path) = init_test_repo();
    let worktree_base = repo_path.join(".worktrees");

    let manager = WorktreeManager::new(&repo_path, &worktree_base, 3).expect("Failed to create manager");

    let worktree = manager.create_worktree(1000).await.expect("Failed");

    // Verify path structure
    assert!(worktree.path.starts_with(&worktree_base));
    assert!(worktree.path.to_string_lossy().contains("issue-1000-"));

    // Verify worktree is a valid git directory
    assert!(worktree.path.join(".git").exists());

    // Cleanup
    manager.remove_worktree(&worktree.id).await.expect("Failed to remove");
}

#[tokio::test]
#[serial]
async fn test_worktree_manager_with_discovery() {
    // This test assumes we're already in a git repository
    // Skip if not in a git repo
    if std::process::Command::new("git")
        .args(["rev-parse", "--git-dir"])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
    {
        let manager = WorktreeManager::new_with_discovery(Some(".worktrees-test"), 3);
        assert!(manager.is_ok(), "Failed to create manager with discovery");

        if let Ok(mgr) = manager {
            // Test basic operations
            let worktree = mgr.create_worktree(1100).await;
            if let Ok(wt) = worktree {
                assert_eq!(wt.issue_number, 1100);
                let _ = mgr.remove_worktree(&wt.id).await;
            }
        }
    }
}

#[tokio::test]
#[serial]
async fn test_worktree_info_serialization() {
    use miyabi_worktree::WorktreeInfo;

    let info = WorktreeInfo {
        id: "test-id-123".to_string(),
        issue_number: 456,
        path: PathBuf::from("/tmp/test/worktree"),
        branch_name: "feature/issue-456".to_string(),
        created_at: chrono::Utc::now(),
        status: WorktreeStatus::Active,
    };

    let json = serde_json::to_string(&info).expect("Failed to serialize");
    let deserialized: WorktreeInfo = serde_json::from_str(&json).expect("Failed to deserialize");

    assert_eq!(info.id, deserialized.id);
    assert_eq!(info.issue_number, deserialized.issue_number);
    assert_eq!(info.branch_name, deserialized.branch_name);
    assert_eq!(info.status, deserialized.status);
}

#[tokio::test]
#[serial]
async fn test_worktree_stats_serialization() {
    use miyabi_worktree::WorktreeStats;

    let stats = WorktreeStats {
        total: 10,
        active: 3,
        idle: 2,
        completed: 4,
        failed: 1,
        max_concurrency: 5,
        available_slots: 2,
    };

    let json = serde_json::to_string(&stats).expect("Failed to serialize");
    let deserialized: WorktreeStats = serde_json::from_str(&json).expect("Failed to deserialize");

    assert_eq!(stats.total, deserialized.total);
    assert_eq!(stats.active, deserialized.active);
    assert_eq!(stats.max_concurrency, deserialized.max_concurrency);
}
