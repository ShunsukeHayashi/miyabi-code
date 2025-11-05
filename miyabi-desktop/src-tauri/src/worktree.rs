//! Git Worktree Manager for miyabi-desktop
//!
//! Provides Tauri commands for managing git worktrees with tmux session integration
//! and AI-powered naming. Wraps the miyabi-worktree crate functionality.

use anyhow::{Context, Result};
use miyabi_worktree::WorktreeManager;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::State;

/// Worktree information for frontend display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    /// Worktree path
    pub path: PathBuf,
    /// Branch name
    pub branch: String,
    /// Associated Issue number (if any)
    pub issue_number: Option<u64>,
    /// Git status information
    pub git_status: GitStatusInfo,
    /// Associated tmux session name (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tmux_session: Option<String>,
    /// Creation timestamp
    pub created_at: String,
}

/// Git status information
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GitStatusInfo {
    /// Number of modified files
    pub modified: usize,
    /// Number of untracked files
    pub untracked: usize,
    /// Number of staged files
    pub staged: usize,
    /// Current commit hash (short)
    pub commit: String,
}

/// Worktree creation options
#[derive(Debug, Clone, Deserialize)]
pub struct CreateWorktreeOptions {
    /// Issue number
    pub issue_number: u64,
    /// Optional custom branch name
    pub branch_name: Option<String>,
    /// Whether to create associated tmux session
    pub create_tmux_session: bool,
}

/// Worktree manager state
pub struct WorktreeManagerState {
    manager: std::sync::Mutex<WorktreeManager>,
}

impl WorktreeManagerState {
    /// Create new worktree manager state
    pub fn new(repo_path: impl AsRef<Path>) -> Result<Self> {
        let repo_path = repo_path.as_ref();
        let worktree_base = repo_path.join(".worktrees");
        let max_concurrency = num_cpus::get();

        let manager = WorktreeManager::new(repo_path, worktree_base, max_concurrency)
            .context("Failed to initialize WorktreeManager")?;

        Ok(Self {
            manager: std::sync::Mutex::new(manager),
        })
    }
}

/// List all worktrees
#[tauri::command]
pub fn list_worktrees(state: State<'_, WorktreeManagerState>) -> Result<Vec<WorktreeInfo>, String> {
    let manager = state
        .manager
        .lock()
        .map_err(|e| format!("Failed to lock manager: {}", e))?;

    // Get worktree list from miyabi-worktree (run in tokio runtime)
    let runtime =
        tokio::runtime::Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;

    let worktrees = runtime.block_on(async { manager.list_worktrees().await });

    // Convert miyabi_worktree::WorktreeInfo to our WorktreeInfo
    let worktree_infos = worktrees
        .into_iter()
        .map(|wt| {
            WorktreeInfo {
                path: wt.path.clone(),
                branch: wt.branch_name.clone(),
                issue_number: Some(wt.issue_number),
                git_status: GitStatusInfo {
                    modified: 0, // TODO: Get from git status
                    untracked: 0,
                    staged: 0,
                    commit: String::new(), // TODO: Get from git
                },
                tmux_session: None, // TODO: Link with tmux sessions
                created_at: wt.created_at.to_rfc3339(),
            }
        })
        .collect();

    Ok(worktree_infos)
}

/// Create a new worktree for an issue
#[tauri::command]
pub fn create_worktree(
    options: CreateWorktreeOptions,
    state: State<'_, WorktreeManagerState>,
) -> Result<WorktreeInfo, String> {
    let manager = state
        .manager
        .lock()
        .map_err(|e| format!("Failed to lock manager: {}", e))?;

    // Create tokio runtime for async operation
    let runtime =
        tokio::runtime::Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;

    let worktree = runtime
        .block_on(async { manager.create_worktree(options.issue_number).await })
        .map_err(|e| format!("Failed to create worktree: {}", e))?;

    let worktree_info = WorktreeInfo {
        path: worktree.path.clone(),
        branch: worktree.branch_name.clone(),
        issue_number: Some(worktree.issue_number),
        git_status: GitStatusInfo {
            modified: 0, // TODO: Get from git status
            untracked: 0,
            staged: 0,
            commit: String::new(), // TODO: Get from git
        },
        tmux_session: None, // TODO: Create tmux session if requested
        created_at: worktree.created_at.to_rfc3339(),
    };

    Ok(worktree_info)
}

/// Remove a worktree
#[tauri::command]
pub fn remove_worktree(
    worktree_id: String,
    state: State<'_, WorktreeManagerState>,
) -> Result<(), String> {
    let manager = state
        .manager
        .lock()
        .map_err(|e| format!("Failed to lock manager: {}", e))?;

    let runtime =
        tokio::runtime::Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;

    runtime
        .block_on(async { manager.remove_worktree(&worktree_id).await })
        .map_err(|e| format!("Failed to remove worktree: {}", e))?;

    Ok(())
}

/// Get detailed status of a worktree
#[tauri::command]
pub fn get_worktree_status(
    worktree_id: String,
    state: State<'_, WorktreeManagerState>,
) -> Result<WorktreeInfo, String> {
    let manager = state
        .manager
        .lock()
        .map_err(|e| format!("Failed to lock manager: {}", e))?;

    let runtime =
        tokio::runtime::Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;

    let worktree = runtime
        .block_on(async { manager.get_worktree(&worktree_id).await })
        .map_err(|e| format!("Failed to get worktree: {}", e))?;

    let worktree_info = WorktreeInfo {
        path: worktree.path.clone(),
        branch: worktree.branch_name.clone(),
        issue_number: Some(worktree.issue_number),
        git_status: GitStatusInfo {
            modified: 0, // TODO: Get from git status
            untracked: 0,
            staged: 0,
            commit: String::new(), // TODO: Get from git
        },
        tmux_session: None, // TODO: Check for associated tmux session
        created_at: worktree.created_at.to_rfc3339(),
    };

    Ok(worktree_info)
}

/// Cleanup stale worktrees
#[tauri::command]
pub fn cleanup_worktrees(state: State<'_, WorktreeManagerState>) -> Result<usize, String> {
    let manager = state
        .manager
        .lock()
        .map_err(|e| format!("Failed to lock manager: {}", e))?;

    let runtime =
        tokio::runtime::Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;

    runtime
        .block_on(async { manager.cleanup_all().await })
        .map_err(|e| format!("Failed to cleanup worktrees: {}", e))?;

    // Return number of worktrees after cleanup (as a proxy for removed count)
    // This is not ideal, but the API doesn't return removed count
    Ok(0) // TODO: Improve API to return removed count
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_issue_number_from_branch() {
        let branch = "issue-673";
        let issue_number = branch
            .strip_prefix("issue-")
            .and_then(|s| s.split('-').next())
            .and_then(|s| s.parse::<u64>().ok());

        assert_eq!(issue_number, Some(673));
    }

    #[test]
    fn test_parse_issue_number_from_branch_with_suffix() {
        let branch = "issue-673-gwr-integration";
        let issue_number = branch
            .strip_prefix("issue-")
            .and_then(|s| s.split('-').next())
            .and_then(|s| s.parse::<u64>().ok());

        assert_eq!(issue_number, Some(673));
    }
}
