//! Five Worlds Manager for 5-Worlds Quality Assurance Strategy
//!
//! This module implements the FiveWorldsManager, which manages 5 parallel
//! Git worktrees for the 5-Worlds execution strategy. Each world runs
//! independently in its own worktree with different LLM parameters.

use crate::git::GitError;
use crate::manager::WorktreeInfo;
use miyabi_types::error::MiyabiError;
use miyabi_types::world::WorldId;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::process::Command;
use tokio::sync::Mutex;
use tracing::{debug, error, info, warn};

/// Handle to a World's worktree
#[derive(Debug, Clone)]
pub struct WorldWorktreeHandle {
    /// The WorldId this handle is for
    pub world_id: WorldId,
    /// Path to the worktree
    pub path: PathBuf,
    /// Branch name
    pub branch: String,
    /// Worktree info from WorktreeManager
    pub info: WorktreeInfo,
}

/// Manager for 5 parallel world worktrees
pub struct FiveWorldsManager {
    /// Base path for all worktrees (e.g., "worktrees/")
    base_path: PathBuf,
    /// Path to the main Git repository
    repo_path: PathBuf,
    /// Currently active world worktrees
    active_worlds: Arc<Mutex<HashMap<WorldId, WorldWorktreeHandle>>>,
}

impl FiveWorldsManager {
    /// Creates a new FiveWorldsManager
    ///
    /// # Arguments
    /// * `base_path` - Base directory for all worktrees
    /// * `repo_path` - Path to the main Git repository
    pub fn new(base_path: PathBuf, repo_path: PathBuf) -> Self {
        Self {
            base_path,
            repo_path,
            active_worlds: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Spawns all 5 worlds for a given issue and task
    ///
    /// Creates 5 independent Git worktrees, one for each WorldId.
    /// Each worktree is isolated and can be worked on in parallel.
    ///
    /// # Arguments
    /// * `issue_number` - GitHub issue number
    /// * `task_name` - Name of the task being executed
    ///
    /// # Returns
    /// HashMap of WorldId -> WorldWorktreeHandle
    ///
    /// # Example
    /// ```no_run
    /// use miyabi_worktree::five_worlds::FiveWorldsManager;
    /// use std::path::PathBuf;
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     let manager = FiveWorldsManager::new(
    ///         PathBuf::from("worktrees"),
    ///         PathBuf::from(".")
    ///     );
    ///
    ///     let handles = manager.spawn_all_worlds(270, "implement_feature").await?;
    ///     println!("Spawned {} worlds", handles.len());
    ///
    ///     Ok(())
    /// }
    /// ```
    pub async fn spawn_all_worlds(
        &self,
        issue_number: u64,
        task_name: &str,
    ) -> Result<HashMap<WorldId, WorldWorktreeHandle>, GitError> {
        info!(issue_number = issue_number, task_name = task_name, "Spawning all 5 worlds");

        let mut handles = HashMap::new();

        // Spawn each world sequentially to avoid Git conflicts
        for world_id in WorldId::all() {
            match self.spawn_world(issue_number, task_name, world_id).await {
                Ok(handle) => {
                    debug!(
                        world_id = ?world_id,
                        path = ?handle.path,
                        "World spawned successfully"
                    );
                    handles.insert(world_id, handle);
                },
                Err(e) => {
                    error!(
                        world_id = ?world_id,
                        error = %e,
                        "Failed to spawn world"
                    );
                    // Clean up already created worktrees
                    self.cleanup_worlds(&handles).await;
                    return Err(e);
                },
            }
        }

        info!("All 5 worlds spawned successfully");
        Ok(handles)
    }

    /// Spawns a single world worktree
    ///
    /// # Arguments
    /// * `issue_number` - GitHub issue number
    /// * `task_name` - Name of the task
    /// * `world_id` - The WorldId to spawn
    pub async fn spawn_world(
        &self,
        issue_number: u64,
        task_name: &str,
        world_id: WorldId,
    ) -> Result<WorldWorktreeHandle, GitError> {
        // Generate branch name: world-alpha-issue-270-implement_feature
        let branch_name = format!(
            "world-{}-issue-{}-{}",
            world_id.to_string().to_lowercase(),
            issue_number,
            task_name
        );

        // Generate worktree path: worktrees/world-alpha/issue-270/implement_feature
        let worktree_path = self
            .base_path
            .join(format!("world-{}", world_id.to_string().to_lowercase()))
            .join(format!("issue-{}", issue_number))
            .join(task_name);

        debug!(
            world_id = ?world_id,
            branch = %branch_name,
            path = ?worktree_path,
            "Creating world worktree"
        );

        // Create the worktree using direct Git command
        self.create_worktree_direct(&worktree_path, &branch_name)
            .await
            .map_err(|e| GitError::CommandFailed(e.to_string()))?;

        // Create WorktreeInfo manually
        let info = WorktreeInfo {
            id: uuid::Uuid::new_v4().to_string(),
            issue_number,
            path: worktree_path.clone(),
            branch_name: branch_name.clone(),
            created_at: chrono::Utc::now(),
            status: crate::manager::WorktreeStatus::Active,
        };

        let handle = WorldWorktreeHandle {
            world_id,
            path: worktree_path.clone(),
            branch: branch_name,
            info,
        };

        // Register in active worlds
        self.active_worlds.lock().await.insert(world_id, handle.clone());

        Ok(handle)
    }

    /// Creates a worktree directly using Git command
    async fn create_worktree_direct(
        &self,
        worktree_path: &Path,
        branch_name: &str,
    ) -> Result<(), MiyabiError> {
        // Create parent directories if they don't exist
        if let Some(parent) = worktree_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| MiyabiError::Git(format!("Failed to create parent dirs: {}", e)))?;
        }

        // Execute git worktree add
        let output = Command::new("git")
            .arg("worktree")
            .arg("add")
            .arg("-b")
            .arg(branch_name)
            .arg(worktree_path)
            .arg("HEAD")
            .current_dir(&self.repo_path)
            .output()
            .await
            .map_err(|e| MiyabiError::Git(format!("Failed to execute git worktree add: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(MiyabiError::Git(format!("Failed to create worktree: {}", stderr)));
        }

        Ok(())
    }

    /// Cleans up a specific world's worktree
    ///
    /// # Arguments
    /// * `world_id` - The WorldId to cleanup
    pub async fn cleanup_world(&self, world_id: WorldId) -> Result<(), GitError> {
        let handle = {
            let mut active = self.active_worlds.lock().await;
            active.remove(&world_id)
        };

        if let Some(handle) = handle {
            debug!(
                world_id = ?world_id,
                path = ?handle.path,
                "Cleaning up world worktree"
            );

            self.remove_worktree_direct(&handle.path)
                .await
                .map_err(|e| GitError::CommandFailed(e.to_string()))?;

            info!(world_id = ?world_id, "World worktree cleaned up");
        } else {
            warn!(world_id = ?world_id, "World not found in active worlds");
        }

        Ok(())
    }

    /// Removes a worktree directly using Git command
    async fn remove_worktree_direct(&self, worktree_path: &Path) -> Result<(), MiyabiError> {
        let output = Command::new("git")
            .arg("worktree")
            .arg("remove")
            .arg("--force")
            .arg(worktree_path)
            .current_dir(&self.repo_path)
            .output()
            .await
            .map_err(|e| {
                MiyabiError::Git(format!("Failed to execute git worktree remove: {}", e))
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(MiyabiError::Git(format!("Failed to remove worktree: {}", stderr)));
        }

        Ok(())
    }

    /// Cleans up multiple worlds at once (parallel)
    ///
    /// # Arguments
    /// * `handles` - HashMap of world handles to cleanup
    async fn cleanup_worlds(&self, handles: &HashMap<WorldId, WorldWorktreeHandle>) {
        use futures::stream::{FuturesUnordered, StreamExt};

        // Parallelize cleanup operations for better performance
        let mut cleanup_futures = FuturesUnordered::new();

        for (world_id, handle) in handles {
            let world_id = *world_id;
            let path = handle.path.clone();
            let repo_path = self.repo_path.clone();

            cleanup_futures.push(async move {
                // Execute git worktree remove directly
                let result = Command::new("git")
                    .arg("worktree")
                    .arg("remove")
                    .arg("--force")
                    .arg(&path)
                    .current_dir(&repo_path)
                    .output()
                    .await;

                match result {
                    Ok(output) if output.status.success() => {
                        debug!(world_id = ?world_id, path = ?path, "World worktree cleaned up");
                    },
                    Ok(output) => {
                        let stderr = String::from_utf8_lossy(&output.stderr);
                        error!(
                            world_id = ?world_id,
                            path = ?path,
                            error = %stderr,
                            "Failed to cleanup world worktree"
                        );
                    },
                    Err(e) => {
                        error!(
                            world_id = ?world_id,
                            path = ?path,
                            error = %e,
                            "Failed to execute git worktree remove"
                        );
                    },
                }
            });
        }

        // Execute all cleanup operations in parallel
        while cleanup_futures.next().await.is_some() {}
    }

    /// Cleans up all active worlds for a specific issue (parallel)
    ///
    /// # Arguments
    /// * `issue_number` - GitHub issue number
    pub async fn cleanup_all_worlds_for_issue(&self, issue_number: u64) -> Result<(), GitError> {
        use futures::stream::{FuturesUnordered, StreamExt};

        info!(issue_number = issue_number, "Cleaning up all worlds for issue");

        let worlds_to_cleanup: Vec<(WorldId, Option<WorldWorktreeHandle>)> = {
            let mut active = self.active_worlds.lock().await;
            WorldId::all()
                .into_iter()
                .map(|world_id| {
                    let handle = active.remove(&world_id);
                    (world_id, handle)
                })
                .collect()
        };

        // Parallelize cleanup operations
        let mut cleanup_futures = FuturesUnordered::new();

        for (world_id, handle_opt) in worlds_to_cleanup {
            if let Some(handle) = handle_opt {
                let path = handle.path.clone();
                let repo_path = self.repo_path.clone();

                cleanup_futures.push(async move {
                    let result = Command::new("git")
                        .arg("worktree")
                        .arg("remove")
                        .arg("--force")
                        .arg(&path)
                        .current_dir(&repo_path)
                        .output()
                        .await;

                    match result {
                        Ok(output) if output.status.success() => {
                            debug!(world_id = ?world_id, "World cleaned up");
                        },
                        Ok(output) => {
                            let stderr = String::from_utf8_lossy(&output.stderr);
                            warn!(
                                world_id = ?world_id,
                                error = %stderr,
                                "Failed to cleanup world"
                            );
                        },
                        Err(e) => {
                            warn!(
                                world_id = ?world_id,
                                error = %e,
                                "Failed to execute git worktree remove"
                            );
                        },
                    }
                });
            }
        }

        // Execute all cleanup operations in parallel
        while cleanup_futures.next().await.is_some() {}

        info!(issue_number = issue_number, "All worlds cleaned up");
        Ok(())
    }

    /// Gets the handle for a specific world
    ///
    /// # Arguments
    /// * `world_id` - The WorldId to get
    ///
    /// # Returns
    /// `Option<WorldWorktreeHandle>` - The handle if the world is active
    pub async fn get_world_handle(&self, world_id: WorldId) -> Option<WorldWorktreeHandle> {
        self.active_worlds.lock().await.get(&world_id).cloned()
    }

    /// Gets handles for all active worlds
    ///
    /// # Returns
    /// HashMap of all active world handles
    pub async fn get_all_world_handles(&self) -> HashMap<WorldId, WorldWorktreeHandle> {
        self.active_worlds.lock().await.clone()
    }

    /// Checks if a world is active
    ///
    /// # Arguments
    /// * `world_id` - The WorldId to check
    pub async fn is_world_active(&self, world_id: WorldId) -> bool {
        self.active_worlds.lock().await.contains_key(&world_id)
    }

    /// Gets the count of active worlds
    pub async fn active_world_count(&self) -> usize {
        self.active_worlds.lock().await.len()
    }

    /// Merges the winning world's changes back to the main branch
    ///
    /// # Arguments
    /// * `world_id` - The winning WorldId
    /// * `target_branch` - Target branch to merge into (usually "main")
    pub async fn merge_winning_world(
        &self,
        world_id: WorldId,
        target_branch: &str,
    ) -> Result<(), GitError> {
        let handle = self
            .get_world_handle(world_id)
            .await
            .ok_or_else(|| GitError::InvalidPath(format!("World {:?} not found", world_id)))?;

        info!(
            world_id = ?world_id,
            branch = %handle.branch,
            target = target_branch,
            "Merging winning world"
        );

        // The actual merge will be done by the orchestrator
        // This just validates the world exists
        // TODO: Implement actual merge logic when needed

        Ok(())
    }

    /// Gets the base path for worktrees
    pub fn base_path(&self) -> &Path {
        &self.base_path
    }

    /// Gets statistics about active worlds
    pub async fn get_statistics(&self) -> WorldStatistics {
        let active = self.active_worlds.lock().await;

        WorldStatistics {
            total_active: active.len(),
            worlds: active.iter().map(|(id, handle)| (*id, handle.path.clone())).collect(),
        }
    }
}

/// Statistics about active worlds
#[derive(Debug, Clone)]
pub struct WorldStatistics {
    /// Total number of active worlds
    pub total_active: usize,
    /// Map of WorldId -> worktree path
    pub worlds: HashMap<WorldId, PathBuf>,
}

impl WorldStatistics {
    /// Checks if all 5 worlds are active
    pub fn all_active(&self) -> bool {
        self.total_active == 5
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    async fn setup_test_manager() -> (FiveWorldsManager, TempDir, TempDir) {
        let repo_dir = TempDir::new().unwrap();
        let worktree_dir = TempDir::new().unwrap();

        // Initialize Git repo
        let repo = git2::Repository::init(repo_dir.path()).unwrap();
        let sig = git2::Signature::now("Test", "test@example.com").unwrap();
        let tree_id = {
            let mut index = repo.index().unwrap();
            index.write_tree().unwrap()
        };
        let tree = repo.find_tree(tree_id).unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[]).unwrap();

        let manager = FiveWorldsManager::new(
            worktree_dir.path().to_path_buf(),
            repo_dir.path().to_path_buf(),
        );

        (manager, repo_dir, worktree_dir)
    }

    #[tokio::test]
    async fn test_spawn_single_world() {
        let (manager, _repo_dir, _worktree_dir) = setup_test_manager().await;

        let handle = manager
            .spawn_world(270, "test_task", WorldId::Alpha)
            .await
            .expect("Failed to spawn world");

        assert_eq!(handle.world_id, WorldId::Alpha);
        assert!(handle.path.to_string_lossy().contains("world-alpha"));
        assert!(handle.branch.contains("world-alpha-issue-270"));

        // Verify it's registered as active
        assert!(manager.is_world_active(WorldId::Alpha).await);
        assert_eq!(manager.active_world_count().await, 1);

        // Cleanup
        manager.cleanup_world(WorldId::Alpha).await.unwrap();
        assert!(!manager.is_world_active(WorldId::Alpha).await);
    }

    #[tokio::test]
    async fn test_spawn_all_worlds() {
        let (manager, _repo_dir, _worktree_dir) = setup_test_manager().await;

        let handles = manager
            .spawn_all_worlds(270, "test_task")
            .await
            .expect("Failed to spawn all worlds");

        assert_eq!(handles.len(), 5);
        assert!(handles.contains_key(&WorldId::Alpha));
        assert!(handles.contains_key(&WorldId::Beta));
        assert!(handles.contains_key(&WorldId::Gamma));
        assert!(handles.contains_key(&WorldId::Delta));
        assert!(handles.contains_key(&WorldId::Epsilon));

        // Verify all are active
        for world_id in WorldId::all() {
            assert!(manager.is_world_active(world_id).await);
        }

        let stats = manager.get_statistics().await;
        assert!(stats.all_active());

        // Cleanup
        manager.cleanup_all_worlds_for_issue(270).await.unwrap();
        assert_eq!(manager.active_world_count().await, 0);
    }

    #[tokio::test]
    async fn test_world_handle_retrieval() {
        let (manager, _repo_dir, _worktree_dir) = setup_test_manager().await;

        manager.spawn_world(270, "test_task", WorldId::Alpha).await.unwrap();

        // Get specific world handle
        let handle = manager.get_world_handle(WorldId::Alpha).await;
        assert!(handle.is_some());
        assert_eq!(handle.unwrap().world_id, WorldId::Alpha);

        // Get non-existent world
        let no_handle = manager.get_world_handle(WorldId::Beta).await;
        assert!(no_handle.is_none());

        // Get all handles
        let all_handles = manager.get_all_world_handles().await;
        assert_eq!(all_handles.len(), 1);
        assert!(all_handles.contains_key(&WorldId::Alpha));

        // Cleanup
        manager.cleanup_world(WorldId::Alpha).await.unwrap();
    }

    #[tokio::test]
    async fn test_statistics() {
        let (manager, _repo_dir, _worktree_dir) = setup_test_manager().await;

        // Initially empty
        let stats = manager.get_statistics().await;
        assert_eq!(stats.total_active, 0);
        assert!(!stats.all_active());

        // Spawn all worlds
        manager.spawn_all_worlds(270, "test_task").await.unwrap();

        let stats = manager.get_statistics().await;
        assert_eq!(stats.total_active, 5);
        assert!(stats.all_active());
        assert_eq!(stats.worlds.len(), 5);

        // Cleanup
        manager.cleanup_all_worlds_for_issue(270).await.unwrap();
    }

    #[tokio::test]
    async fn test_partial_cleanup() {
        let (manager, _repo_dir, _worktree_dir) = setup_test_manager().await;

        manager.spawn_all_worlds(270, "test_task").await.unwrap();
        assert_eq!(manager.active_world_count().await, 5);

        // Cleanup Alpha and Beta only
        manager.cleanup_world(WorldId::Alpha).await.unwrap();
        manager.cleanup_world(WorldId::Beta).await.unwrap();

        assert_eq!(manager.active_world_count().await, 3);
        assert!(!manager.is_world_active(WorldId::Alpha).await);
        assert!(!manager.is_world_active(WorldId::Beta).await);
        assert!(manager.is_world_active(WorldId::Gamma).await);

        // Cleanup remaining
        manager.cleanup_all_worlds_for_issue(270).await.unwrap();
    }
}
