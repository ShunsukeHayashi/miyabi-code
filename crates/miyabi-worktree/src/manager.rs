//! Worktree manager for parallel agent execution
//!
//! Manages Git worktrees for isolated parallel task execution

use git2::{BranchType, Repository, RepositoryState};
use miyabi_types::error::{MiyabiError, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::{Mutex, Semaphore};
use uuid::Uuid;

/// Worktree information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    pub id: String,
    pub issue_number: u64,
    pub path: PathBuf,
    pub branch_name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub status: WorktreeStatus,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorktreeStatus {
    Active,
    Idle,
    Completed,
    Failed,
}

/// Worktree manager for parallel execution
pub struct WorktreeManager {
    repo_path: PathBuf,
    worktree_base: PathBuf,
    max_concurrency: usize,
    semaphore: Arc<Semaphore>,
    worktrees: Arc<Mutex<HashMap<String, WorktreeInfo>>>,
}

impl WorktreeManager {
    /// Create a new WorktreeManager
    ///
    /// # Arguments
    /// * `repo_path` - Path to the main repository
    /// * `worktree_base` - Base directory for worktrees
    /// * `max_concurrency` - Maximum number of concurrent worktrees
    pub fn new(
        repo_path: impl AsRef<Path>,
        worktree_base: impl AsRef<Path>,
        max_concurrency: usize,
    ) -> Result<Self> {
        let repo_path = repo_path.as_ref().to_path_buf();
        let worktree_base = worktree_base.as_ref().to_path_buf();

        // Validate repository exists
        Repository::open(&repo_path).map_err(|e| {
            MiyabiError::Git(format!(
                "Failed to open repository at {:?}: {}",
                repo_path, e
            ))
        })?;

        // Create worktree base directory if it doesn't exist
        std::fs::create_dir_all(&worktree_base).map_err(|e| {
            MiyabiError::Io(std::io::Error::new(
                e.kind(),
                format!("Failed to create worktree base directory: {}", e),
            ))
        })?;

        Ok(Self {
            repo_path,
            worktree_base,
            max_concurrency,
            semaphore: Arc::new(Semaphore::new(max_concurrency)),
            worktrees: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    /// Create a new worktree for an issue
    ///
    /// Returns the path to the created worktree
    pub async fn create_worktree(&self, issue_number: u64) -> Result<WorktreeInfo> {
        // Acquire semaphore permit for concurrency control
        let _permit = self
            .semaphore
            .acquire()
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to acquire semaphore: {}", e)))?;

        let worktree_id = Uuid::new_v4().to_string();
        let worktree_path =
            self.worktree_base
                .join(format!("issue-{}-{}", issue_number, &worktree_id[..8]));
        let branch_name = format!("feature/issue-{}", issue_number);

        tracing::info!(
            "Creating worktree for issue #{} at {:?}",
            issue_number,
            worktree_path
        );

        // Open repository
        let repo = Repository::open(&self.repo_path)
            .map_err(|e| MiyabiError::Git(format!("Failed to open repository: {}", e)))?;

        // Check repository state
        if repo.state() != RepositoryState::Clean {
            return Err(MiyabiError::Git(format!(
                "Repository is not in a clean state: {:?}",
                repo.state()
            )));
        }

        // Get main branch (try 'main' first, then 'master')
        let main_branch = self.get_main_branch(&repo)?;

        // Create new branch from main
        let head_commit = repo
            .find_branch(&main_branch, BranchType::Local)
            .map_err(|e| MiyabiError::Git(format!("Failed to find main branch: {}", e)))?
            .get()
            .peel_to_commit()
            .map_err(|e| MiyabiError::Git(format!("Failed to get main commit: {}", e)))?;

        // Check if branch already exists
        if let Ok(_existing) = repo.find_branch(&branch_name, BranchType::Local) {
            tracing::warn!(
                "Branch {} already exists, using existing branch",
                branch_name
            );
        } else {
            repo.branch(&branch_name, &head_commit, false)
                .map_err(|e| MiyabiError::Git(format!("Failed to create branch: {}", e)))?;
        }

        // Create worktree using git command (git2 doesn't support worktree creation directly)
        let output = tokio::process::Command::new("git")
            .arg("worktree")
            .arg("add")
            .arg(&worktree_path)
            .arg(&branch_name)
            .current_dir(&self.repo_path)
            .output()
            .await
            .map_err(|e| MiyabiError::Git(format!("Failed to execute git worktree add: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(MiyabiError::Git(format!(
                "Failed to create worktree: {}",
                stderr
            )));
        }

        let worktree_info = WorktreeInfo {
            id: worktree_id.clone(),
            issue_number,
            path: worktree_path.clone(),
            branch_name: branch_name.clone(),
            created_at: chrono::Utc::now(),
            status: WorktreeStatus::Active,
        };

        // Store worktree info
        {
            let mut worktrees = self.worktrees.lock().await;
            worktrees.insert(worktree_id.clone(), worktree_info.clone());
        }

        tracing::info!("Worktree created successfully at {:?}", worktree_path);

        Ok(worktree_info)
    }

    /// Remove worktree after task completion
    pub async fn remove_worktree(&self, worktree_id: &str) -> Result<()> {
        let worktree_info = {
            let worktrees = self.worktrees.lock().await;
            worktrees.get(worktree_id).cloned().ok_or_else(|| {
                MiyabiError::Unknown(format!("Worktree {} not found", worktree_id))
            })?
        };

        tracing::info!("Removing worktree {:?}", worktree_info.path);

        // Remove worktree using git command
        let output = tokio::process::Command::new("git")
            .arg("worktree")
            .arg("remove")
            .arg(&worktree_info.path)
            .arg("--force")
            .current_dir(&self.repo_path)
            .output()
            .await
            .map_err(|e| {
                MiyabiError::Git(format!("Failed to execute git worktree remove: {}", e))
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            tracing::warn!("Failed to remove worktree: {}", stderr);
        }

        // Remove branch
        let repo = Repository::open(&self.repo_path)
            .map_err(|e| MiyabiError::Git(format!("Failed to open repository: {}", e)))?;

        if let Ok(mut branch) = repo.find_branch(&worktree_info.branch_name, BranchType::Local) {
            branch
                .delete()
                .map_err(|e| MiyabiError::Git(format!("Failed to delete branch: {}", e)))?;
        }

        // Remove from tracked worktrees
        {
            let mut worktrees = self.worktrees.lock().await;
            worktrees.remove(worktree_id);
        }

        tracing::info!("Worktree removed successfully");

        Ok(())
    }

    /// Push worktree changes to remote
    pub async fn push_worktree(&self, worktree_id: &str) -> Result<()> {
        let worktree_info = {
            let worktrees = self.worktrees.lock().await;
            worktrees.get(worktree_id).cloned().ok_or_else(|| {
                MiyabiError::Unknown(format!("Worktree {} not found", worktree_id))
            })?
        };

        tracing::info!("Pushing worktree branch {}", worktree_info.branch_name);

        let output = tokio::process::Command::new("git")
            .arg("push")
            .arg("origin")
            .arg(&worktree_info.branch_name)
            .arg("--set-upstream")
            .current_dir(&worktree_info.path)
            .output()
            .await
            .map_err(|e| MiyabiError::Git(format!("Failed to execute git push: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(MiyabiError::Git(format!("Failed to push: {}", stderr)));
        }

        tracing::info!("Worktree pushed successfully");

        Ok(())
    }

    /// Merge worktree branch into main
    pub async fn merge_worktree(&self, worktree_id: &str) -> Result<()> {
        let worktree_info = {
            let worktrees = self.worktrees.lock().await;
            worktrees.get(worktree_id).cloned().ok_or_else(|| {
                MiyabiError::Unknown(format!("Worktree {} not found", worktree_id))
            })?
        };

        let main_branch = {
            let repo = Repository::open(&self.repo_path)
                .map_err(|e| MiyabiError::Git(format!("Failed to open repository: {}", e)))?;
            self.get_main_branch(&repo)?
        };

        tracing::info!(
            "Merging branch {} into {}",
            worktree_info.branch_name,
            main_branch
        );

        // Checkout main branch
        let output = tokio::process::Command::new("git")
            .arg("checkout")
            .arg(&main_branch)
            .current_dir(&self.repo_path)
            .output()
            .await
            .map_err(|e| MiyabiError::Git(format!("Failed to checkout main: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(MiyabiError::Git(format!(
                "Failed to checkout main: {}",
                stderr
            )));
        }

        // Merge feature branch
        let output = tokio::process::Command::new("git")
            .arg("merge")
            .arg(&worktree_info.branch_name)
            .arg("--no-ff")
            .current_dir(&self.repo_path)
            .output()
            .await
            .map_err(|e| MiyabiError::Git(format!("Failed to merge: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(MiyabiError::Git(format!("Merge failed: {}", stderr)));
        }

        tracing::info!("Branch merged successfully");

        Ok(())
    }

    /// Update worktree status
    pub async fn update_status(&self, worktree_id: &str, status: WorktreeStatus) -> Result<()> {
        let mut worktrees = self.worktrees.lock().await;
        if let Some(info) = worktrees.get_mut(worktree_id) {
            info.status = status;
            Ok(())
        } else {
            Err(MiyabiError::Unknown(format!(
                "Worktree {} not found",
                worktree_id
            )))
        }
    }

    /// Get worktree information
    pub async fn get_worktree(&self, worktree_id: &str) -> Result<WorktreeInfo> {
        let worktrees = self.worktrees.lock().await;
        worktrees
            .get(worktree_id)
            .cloned()
            .ok_or_else(|| MiyabiError::Unknown(format!("Worktree {} not found", worktree_id)))
    }

    /// List all worktrees
    pub async fn list_worktrees(&self) -> Vec<WorktreeInfo> {
        let worktrees = self.worktrees.lock().await;
        worktrees.values().cloned().collect()
    }

    /// Get worktree statistics
    pub async fn stats(&self) -> WorktreeStats {
        let worktrees = self.worktrees.lock().await;
        let total = worktrees.len();
        let active = worktrees
            .values()
            .filter(|w| w.status == WorktreeStatus::Active)
            .count();
        let idle = worktrees
            .values()
            .filter(|w| w.status == WorktreeStatus::Idle)
            .count();
        let completed = worktrees
            .values()
            .filter(|w| w.status == WorktreeStatus::Completed)
            .count();
        let failed = worktrees
            .values()
            .filter(|w| w.status == WorktreeStatus::Failed)
            .count();

        WorktreeStats {
            total,
            active,
            idle,
            completed,
            failed,
            max_concurrency: self.max_concurrency,
            available_slots: self.semaphore.available_permits(),
        }
    }

    /// Cleanup all worktrees
    pub async fn cleanup_all(&self) -> Result<()> {
        tracing::info!("Cleaning up all worktrees");

        let worktree_ids: Vec<String> = {
            let worktrees = self.worktrees.lock().await;
            worktrees.keys().cloned().collect()
        };

        for id in worktree_ids {
            if let Err(e) = self.remove_worktree(&id).await {
                tracing::warn!("Failed to remove worktree {}: {}", id, e);
            }
        }

        // Run git worktree prune
        let _ = tokio::process::Command::new("git")
            .arg("worktree")
            .arg("prune")
            .current_dir(&self.repo_path)
            .output()
            .await;

        tracing::info!("Cleanup completed");

        Ok(())
    }

    /// Get main branch name (tries 'main' then 'master')
    fn get_main_branch(&self, repo: &Repository) -> Result<String> {
        if repo.find_branch("main", BranchType::Local).is_ok() {
            Ok("main".to_string())
        } else if repo.find_branch("master", BranchType::Local).is_ok() {
            Ok("master".to_string())
        } else {
            Err(MiyabiError::Git(
                "Neither 'main' nor 'master' branch found".to_string(),
            ))
        }
    }
}

/// Worktree statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeStats {
    pub total: usize,
    pub active: usize,
    pub idle: usize,
    pub completed: usize,
    pub failed: usize,
    pub max_concurrency: usize,
    pub available_slots: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serial_test::serial;

    // Note: These tests require a valid git repository and are marked as serial
    // to avoid conflicts when running in parallel

    #[tokio::test]
    #[serial]
    async fn test_worktree_info_serialization() {
        let info = WorktreeInfo {
            id: "test-id".to_string(),
            issue_number: 123,
            path: PathBuf::from("/tmp/worktree"),
            branch_name: "feature/issue-123".to_string(),
            created_at: chrono::Utc::now(),
            status: WorktreeStatus::Active,
        };

        let json = serde_json::to_string(&info).unwrap();
        let deserialized: WorktreeInfo = serde_json::from_str(&json).unwrap();

        assert_eq!(info.id, deserialized.id);
        assert_eq!(info.issue_number, deserialized.issue_number);
        assert_eq!(info.status, deserialized.status);
    }

    #[test]
    fn test_worktree_status_equality() {
        assert_eq!(WorktreeStatus::Active, WorktreeStatus::Active);
        assert_ne!(WorktreeStatus::Active, WorktreeStatus::Idle);
    }

    #[test]
    fn test_worktree_stats_creation() {
        let stats = WorktreeStats {
            total: 10,
            active: 3,
            idle: 2,
            completed: 4,
            failed: 1,
            max_concurrency: 5,
            available_slots: 2,
        };

        assert_eq!(stats.total, 10);
        assert_eq!(stats.active, 3);
        assert_eq!(stats.available_slots, 2);
    }

    // Integration tests would require a real git repository
    // These are skipped in CI/CD but can be run manually
}
