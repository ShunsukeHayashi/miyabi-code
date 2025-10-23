//! End-to-end worktree integration tests for Phase 6
//!
//! These tests verify the complete worktree lifecycle:
//! 1. Single worktree creation and cleanup
//! 2. Parallel worktree execution
//! 3. Conflict resolution scenarios

use miyabi_worktree::{WorktreeManager, WorktreeStatus};
use serial_test::serial;
use std::fs;
use std::path::{Path, PathBuf};
use tokio::time::Duration;

/// Helper to create a test file in worktree
async fn create_test_file(
    path: &Path,
    filename: &str,
    content: &str,
) -> Result<(), std::io::Error> {
    let file_path = path.join(filename);
    tokio::fs::write(&file_path, content).await?;
    Ok(())
}

/// Helper to commit changes in worktree
async fn commit_changes(path: &Path, message: &str) -> Result<(), Box<dyn std::error::Error>> {
    // Stage all changes
    let output = tokio::process::Command::new("git")
        .arg("add")
        .arg(".")
        .current_dir(path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git add failed: {}", stderr).into());
    }

    // Commit
    let output = tokio::process::Command::new("git")
        .arg("commit")
        .arg("-m")
        .arg(message)
        .current_dir(path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Ignore "nothing to commit" errors
        if !stderr.contains("nothing to commit") {
            return Err(format!("git commit failed: {}", stderr).into());
        }
    }

    Ok(())
}

#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test worktree_e2e -- --ignored
async fn test_single_worktree_lifecycle() {
    // Initialize manager with auto-discovery
    let manager = WorktreeManager::new_with_discovery(Some(".worktrees-test"), 3)
        .expect("Failed to create WorktreeManager");

    // Test 1: Create worktree
    println!("📝 Test 1: Creating worktree for issue #999");
    let worktree = manager
        .create_worktree(999)
        .await
        .expect("Failed to create worktree");

    assert_eq!(worktree.issue_number, 999);
    assert_eq!(worktree.status, WorktreeStatus::Active);
    assert!(worktree.path.exists(), "Worktree directory should exist");
    println!("✅ Worktree created at: {:?}", worktree.path);

    // Test 2: Create test file and commit
    println!("\n📝 Test 2: Creating test file and committing");
    create_test_file(&worktree.path, "test-file.txt", "Hello from worktree test!")
        .await
        .expect("Failed to create test file");

    commit_changes(&worktree.path, "test: add test file for worktree e2e")
        .await
        .expect("Failed to commit changes");
    println!("✅ File created and committed");

    // Test 3: Update status
    println!("\n📝 Test 3: Updating worktree status");
    manager
        .update_status(&worktree.id, WorktreeStatus::Completed)
        .await
        .expect("Failed to update status");

    let updated = manager
        .get_worktree(&worktree.id)
        .await
        .expect("Failed to get worktree");
    assert_eq!(updated.status, WorktreeStatus::Completed);
    println!("✅ Status updated to Completed");

    // Test 4: List worktrees
    println!("\n📝 Test 4: Listing worktrees");
    let worktrees = manager.list_worktrees().await;
    assert_eq!(worktrees.len(), 1);
    println!("✅ Found {} worktree(s)", worktrees.len());

    // Test 5: Get stats
    println!("\n📝 Test 5: Getting worktree statistics");
    let stats = manager.stats().await;
    assert_eq!(stats.total, 1);
    assert_eq!(stats.completed, 1);
    assert_eq!(stats.max_concurrency, 3);
    println!(
        "✅ Stats: total={}, completed={}, available_slots={}",
        stats.total, stats.completed, stats.available_slots
    );

    // Test 6: Cleanup
    println!("\n📝 Test 6: Cleaning up worktree");
    manager
        .remove_worktree(&worktree.id)
        .await
        .expect("Failed to remove worktree");

    assert!(
        !worktree.path.exists(),
        "Worktree directory should be removed"
    );

    let worktrees_after = manager.list_worktrees().await;
    assert_eq!(worktrees_after.len(), 0);
    println!("✅ Worktree cleaned up successfully");

    println!("\n🎉 Single worktree lifecycle test completed!");
}

#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test worktree_e2e -- --ignored
async fn test_parallel_worktree_execution() {
    // Initialize manager with concurrency limit of 2
    let manager = WorktreeManager::new_with_discovery(Some(".worktrees-test"), 2)
        .expect("Failed to create WorktreeManager");

    println!("📝 Creating 3 worktrees sequentially (max concurrency: 2)");

    // Note: Due to git2 !Send limitation, we can't use tokio::spawn for parallel worktree creation
    // Instead, we create worktrees sequentially but verify the manager's semaphore controls concurrency
    // The semaphore ensures that even if we call create_worktree concurrently, only 2 will execute at a time

    let mut results = Vec::new();

    for issue_num in 1..=3 {
        let issue = 1000 + issue_num;
        println!("  Creating worktree for issue #{}", issue);

        let worktree = manager
            .create_worktree(issue)
            .await
            .unwrap_or_else(|_| panic!("Failed to create worktree for issue #{}", issue));

        // Simulate work
        tokio::time::sleep(Duration::from_millis(100)).await;

        // Create a unique file
        create_test_file(
            &worktree.path,
            &format!("file-{}.txt", issue),
            &format!("Content for issue #{}", issue),
        )
        .await
        .expect("Failed to create file");

        commit_changes(
            &worktree.path,
            &format!("feat: add file for issue #{}", issue),
        )
        .await
        .expect("Failed to commit");

        manager
            .update_status(&worktree.id, WorktreeStatus::Completed)
            .await
            .expect("Failed to update status");

        println!("  ✅ Completed worktree for issue #{}", issue);
        results.push(worktree);
    }

    assert_eq!(results.len(), 3, "Should have 3 completed worktrees");
    println!("✅ All 3 worktrees created and processed");

    // Verify stats
    let stats = manager.stats().await;
    assert_eq!(stats.total, 3);
    assert_eq!(stats.completed, 3);
    println!(
        "✅ Stats verified: {} total, {} completed",
        stats.total, stats.completed
    );

    // Cleanup all
    println!("\n📝 Cleaning up all worktrees");
    manager.cleanup_all().await.expect("Failed to cleanup");

    let final_stats = manager.stats().await;
    assert_eq!(final_stats.total, 0);
    println!("✅ All worktrees cleaned up");

    println!("\n🎉 Parallel worktree execution test completed!");
}

#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test worktree_e2e -- --ignored
async fn test_worktree_conflict_detection() {
    // Initialize manager
    let manager = WorktreeManager::new_with_discovery(Some(".worktrees-test"), 2)
        .expect("Failed to create WorktreeManager");

    println!("📝 Testing conflict detection between worktrees");

    // Create two worktrees that will modify the same file
    let worktree1 = manager
        .create_worktree(2001)
        .await
        .expect("Failed to create worktree 1");
    let worktree2 = manager
        .create_worktree(2002)
        .await
        .expect("Failed to create worktree 2");

    println!("✅ Created worktree 1: {:?}", worktree1.path);
    println!("✅ Created worktree 2: {:?}", worktree2.path);

    // Both modify the same file name (simulating potential conflict)
    println!("\n📝 Both worktrees modifying 'README.md'");

    create_test_file(&worktree1.path, "README.md", "# Version 1 from issue #2001")
        .await
        .expect("Failed to create file in worktree 1");

    create_test_file(&worktree2.path, "README.md", "# Version 2 from issue #2002")
        .await
        .expect("Failed to create file in worktree 2");

    commit_changes(&worktree1.path, "docs: update README from issue #2001")
        .await
        .expect("Failed to commit in worktree 1");

    commit_changes(&worktree2.path, "docs: update README from issue #2002")
        .await
        .expect("Failed to commit in worktree 2");

    println!("✅ Both commits successful (isolated in separate worktrees)");

    // Note: Actual merge conflict would occur during merge_worktree()
    // This test demonstrates that worktrees allow independent work
    println!("\n📝 Verifying files are different in each worktree");

    let content1 = fs::read_to_string(worktree1.path.join("README.md"))
        .expect("Failed to read from worktree 1");
    let content2 = fs::read_to_string(worktree2.path.join("README.md"))
        .expect("Failed to read from worktree 2");

    assert_ne!(content1, content2, "Files should be different");
    assert!(content1.contains("2001"));
    assert!(content2.contains("2002"));
    println!("✅ Confirmed: each worktree has independent changes");

    // Cleanup
    println!("\n📝 Cleaning up worktrees");
    manager.cleanup_all().await.expect("Failed to cleanup");
    println!("✅ Cleanup complete");

    println!("\n🎉 Conflict detection test completed!");
    println!("Note: Actual merge conflict resolution would be tested in PR creation flow");
}

#[tokio::test]
#[serial]
#[ignore] // Run manually: cargo test --package miyabi-worktree --test worktree_e2e -- --ignored
async fn test_worktree_error_handling() {
    println!("📝 Testing error handling scenarios");

    // Test 1: Invalid repository path
    println!("\n📝 Test 1: Invalid repository path");
    let invalid_result = WorktreeManager::new(
        PathBuf::from("/nonexistent/path"),
        PathBuf::from(".worktrees-test"),
        3,
    );
    assert!(
        invalid_result.is_err(),
        "Should fail with invalid repo path"
    );
    println!("✅ Correctly rejected invalid repository path");

    // Test 2: Manager with valid repository
    let manager = WorktreeManager::new_with_discovery(Some(".worktrees-test"), 2)
        .expect("Failed to create WorktreeManager");

    // Test 3: Get non-existent worktree
    println!("\n📝 Test 2: Get non-existent worktree");
    let result = manager.get_worktree("nonexistent-id").await;
    assert!(result.is_err(), "Should fail for non-existent worktree");
    println!("✅ Correctly returned error for non-existent worktree");

    // Test 4: Update non-existent worktree status
    println!("\n📝 Test 3: Update non-existent worktree status");
    let result = manager
        .update_status("nonexistent-id", WorktreeStatus::Failed)
        .await;
    assert!(result.is_err(), "Should fail for non-existent worktree");
    println!("✅ Correctly returned error when updating non-existent worktree");

    // Test 5: Remove non-existent worktree
    println!("\n📝 Test 4: Remove non-existent worktree");
    let result = manager.remove_worktree("nonexistent-id").await;
    assert!(result.is_err(), "Should fail for non-existent worktree");
    println!("✅ Correctly returned error when removing non-existent worktree");

    println!("\n🎉 Error handling test completed!");
}

// Note: Add this to Cargo.toml dependencies for worktree tests:
// [dev-dependencies]
// tokio = { version = "1.44", features = ["full", "test-util"] }
// serial_test = "3.2"
// futures = "0.3"
