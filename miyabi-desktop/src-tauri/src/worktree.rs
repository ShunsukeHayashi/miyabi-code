// ! Worktree management for Miyabi Desktop
//!
//! Provides Tauri command interfaces for Git worktree operations,
//! integrating miyabi-worktree crate with tmux session management.

use anyhow::{Context, Result};
use miyabi_worktree::{WorktreeInfo, WorktreeManager as CoreWorktreeManager};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Worktree information for frontend (Tauri-compatible)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Worktree {
    pub id: String,
    pub issue_number: u64,
    pub path: String,
    pub branch: String,
    pub status: String,
    pub created_at: String,
    pub git_status: Option<GitStatus>,
    pub tmux_session: Option<String>,
}

/// Git status information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub branch: String,
    pub ahead: usize,
    pub behind: usize,
    pub modified: usize,
    pub untracked: usize,
    pub staged: usize,
}

/// Worktree manager for desktop application
#[derive(Clone)]
pub struct WorktreeManager {
    core: Arc<Mutex<CoreWorktreeManager>>,
    repo_path: PathBuf,
}

impl WorktreeManager {
    /// Create a new WorktreeManager
    pub fn new() -> Result<Self> {
        let core = CoreWorktreeManager::new_with_discovery(Some(".worktrees"), 10)
            .context("Failed to create core WorktreeManager")?;

        let repo_path =
            miyabi_core::find_git_root(None).context("Failed to find Git repository root")?;

        Ok(Self {
            core: Arc::new(Mutex::new(core)),
            repo_path,
        })
    }

    /// List all worktrees
    pub async fn list_worktrees(&self) -> Result<Vec<Worktree>> {
        let core = self.core.lock().await;
        let worktrees = core.list_worktrees().await;

        let mut result = Vec::new();
        for info in worktrees {
            let git_status = self.get_git_status_for_path(&info.path).await.ok();
            let tmux_session = self
                .get_tmux_session_for_worktree(&info)
                .await
                .ok()
                .flatten();

            result.push(Worktree {
                id: info.id.clone(),
                issue_number: info.issue_number,
                path: info.path.to_string_lossy().to_string(),
                branch: info.branch_name.clone(),
                status: format!("{:?}", info.status),
                created_at: info.created_at.to_rfc3339(),
                git_status,
                tmux_session,
            });
        }

        Ok(result)
    }

    /// Create a new worktree with optional tmux session
    pub async fn create_worktree(&self, issue_number: u64, create_tmux: bool) -> Result<Worktree> {
        let core = self.core.lock().await;
        let info = core
            .create_worktree(issue_number)
            .await
            .context("Failed to create worktree")?;

        let tmux_session = if create_tmux {
            self.create_tmux_session_for_worktree(&info).await.ok()
        } else {
            None
        };

        let git_status = self.get_git_status_for_path(&info.path).await.ok();

        Ok(Worktree {
            id: info.id.clone(),
            issue_number: info.issue_number,
            path: info.path.to_string_lossy().to_string(),
            branch: info.branch_name.clone(),
            status: format!("{:?}", info.status),
            created_at: info.created_at.to_rfc3339(),
            git_status,
            tmux_session,
        })
    }

    /// Delete a worktree
    pub async fn delete_worktree(&self, worktree_id: &str) -> Result<()> {
        // Get worktree info before deletion for tmux session cleanup
        let worktree = {
            let core = self.core.lock().await;
            core.get_worktree(worktree_id)
                .await
                .context("Failed to get worktree info")?
        };

        // Stop tmux session if exists
        if let Ok(Some(session_name)) = self.get_tmux_session_for_worktree(&worktree).await {
            let _ = self.stop_tmux_session(&session_name).await;
        }

        // Remove worktree
        let core = self.core.lock().await;
        core.remove_worktree(worktree_id)
            .await
            .context("Failed to remove worktree")?;

        Ok(())
    }

    /// Get git status for a specific worktree
    pub async fn get_git_status(&self, worktree_id: &str) -> Result<GitStatus> {
        let core = self.core.lock().await;
        let info = core
            .get_worktree(worktree_id)
            .await
            .context("Failed to get worktree")?;

        self.get_git_status_for_path(&info.path)
            .await
            .context("Failed to get git status")
    }

    // Private helper methods

    /// Get git status for a worktree path
    async fn get_git_status_for_path(&self, path: &PathBuf) -> Result<GitStatus> {
        use tokio::process::Command;

        // Run git status --porcelain in worktree directory
        let output = Command::new("git")
            .current_dir(path)
            .args(["status", "--porcelain", "--branch"])
            .output()
            .await
            .context("Failed to execute git status")?;

        let status_output = String::from_utf8_lossy(&output.stdout);

        // Parse git status output
        let mut modified = 0;
        let mut untracked = 0;
        let mut staged = 0;
        let mut branch = String::from("unknown");

        for line in status_output.lines() {
            if line.starts_with("##") {
                // Parse branch info
                branch = line
                    .trim_start_matches("## ")
                    .split("...")
                    .next()
                    .unwrap_or("unknown")
                    .to_string();
            } else if line.starts_with("??") {
                untracked += 1;
            } else if line.starts_with(" M") || line.starts_with("M ") {
                modified += 1;
            } else if !line.trim().is_empty() {
                staged += 1;
            }
        }

        // Get ahead/behind info
        let (ahead, behind) = self.get_ahead_behind(path).await.unwrap_or((0, 0));

        Ok(GitStatus {
            branch,
            ahead,
            behind,
            modified,
            untracked,
            staged,
        })
    }

    /// Get ahead/behind commit count
    async fn get_ahead_behind(&self, path: &PathBuf) -> Result<(usize, usize)> {
        use tokio::process::Command;

        let output = Command::new("git")
            .current_dir(path)
            .args(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"])
            .output()
            .await
            .context("Failed to get ahead/behind count")?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = output_str.split_whitespace().collect();

        if parts.len() == 2 {
            let ahead = parts[0].parse().unwrap_or(0);
            let behind = parts[1].parse().unwrap_or(0);
            Ok((ahead, behind))
        } else {
            Ok((0, 0))
        }
    }

    /// Get tmux session name for a worktree
    async fn get_tmux_session_for_worktree(&self, info: &WorktreeInfo) -> Result<Option<String>> {
        // Check if tmux session exists for this worktree
        let session_name = format!("issue-{}", info.issue_number);

        if self.tmux_session_exists(&session_name).await? {
            Ok(Some(session_name))
        } else {
            Ok(None)
        }
    }

    /// Create tmux session for worktree
    async fn create_tmux_session_for_worktree(&self, info: &WorktreeInfo) -> Result<String> {
        use tokio::process::Command;

        let session_name = format!("issue-{}", info.issue_number);
        let worktree_path = info.path.to_string_lossy();

        Command::new("tmux")
            .args([
                "new-session",
                "-d",
                "-s",
                &session_name,
                "-c",
                &worktree_path,
            ])
            .output()
            .await
            .context("Failed to create tmux session")?;

        Ok(session_name)
    }

    /// Check if tmux session exists
    async fn tmux_session_exists(&self, session_name: &str) -> Result<bool> {
        use tokio::process::Command;

        let output = Command::new("tmux")
            .args(["has-session", "-t", session_name])
            .output()
            .await
            .context("Failed to check tmux session")?;

        Ok(output.status.success())
    }

    /// Stop tmux session
    async fn stop_tmux_session(&self, session_name: &str) -> Result<()> {
        use tokio::process::Command;

        Command::new("tmux")
            .args(["kill-session", "-t", session_name])
            .output()
            .await
            .context("Failed to stop tmux session")?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_new_manager() {
        let manager = WorktreeManager::new();
        assert!(manager.is_ok(), "Failed to create WorktreeManager");
    }

    #[tokio::test]
    async fn test_list_worktrees() {
        let manager = WorktreeManager::new().unwrap();
        let result = manager.list_worktrees().await;
        assert!(result.is_ok(), "Failed to list worktrees");
    }

    // Note: More comprehensive tests should be added for:
    // - create_worktree
    // - delete_worktree
    // - get_git_status
    // These require a proper test environment with git repository
}
