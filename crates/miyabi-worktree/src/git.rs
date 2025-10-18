//! Git操作モジュール - Worktree作成・削除・管理
//!
//! Gitの低レベル操作を担当します。

use std::path::{Path, PathBuf};
use std::process::Command;

/// Git操作結果
pub type GitResult<T> = Result<T, GitError>;

/// Gitエラー
#[derive(Debug, thiserror::Error)]
pub enum GitError {
    #[error("Git command failed: {0}")]
    CommandFailed(String),

    #[error("Worktree already exists: {0}")]
    WorktreeExists(PathBuf),

    #[error("Worktree not found: {0}")]
    WorktreeNotFound(PathBuf),

    #[error("Invalid path: {0}")]
    InvalidPath(String),
}

/// Git Worktree操作
pub struct GitWorktreeOps {
    repo_path: PathBuf,
}

impl GitWorktreeOps {
    /// 新しいGit操作ハンドラを作成
    pub fn new(repo_path: impl AsRef<Path>) -> Self {
        Self {
            repo_path: repo_path.as_ref().to_path_buf(),
        }
    }

    /// Worktreeを作成
    pub fn create_worktree(
        &self,
        worktree_path: impl AsRef<Path>,
        branch_name: &str,
    ) -> GitResult<PathBuf> {
        let worktree_path = worktree_path.as_ref();

        if worktree_path.exists() {
            return Err(GitError::WorktreeExists(worktree_path.to_path_buf()));
        }

        let output = Command::new("git")
            .arg("worktree")
            .arg("add")
            .arg(worktree_path)
            .arg("-b")
            .arg(branch_name)
            .current_dir(&self.repo_path)
            .output()
            .map_err(|e| GitError::CommandFailed(e.to_string()))?;

        if !output.status.success() {
            return Err(GitError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string(),
            ));
        }

        Ok(worktree_path.to_path_buf())
    }

    /// Worktreeを削除
    pub fn remove_worktree(&self, worktree_path: impl AsRef<Path>) -> GitResult<()> {
        let worktree_path = worktree_path.as_ref();

        if !worktree_path.exists() {
            return Err(GitError::WorktreeNotFound(worktree_path.to_path_buf()));
        }

        let output = Command::new("git")
            .arg("worktree")
            .arg("remove")
            .arg(worktree_path)
            .arg("--force")
            .current_dir(&self.repo_path)
            .output()
            .map_err(|e| GitError::CommandFailed(e.to_string()))?;

        if !output.status.success() {
            return Err(GitError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string(),
            ));
        }

        Ok(())
    }

    /// 全Worktreeをリスト表示
    pub fn list_worktrees(&self) -> GitResult<Vec<PathBuf>> {
        let output = Command::new("git")
            .arg("worktree")
            .arg("list")
            .arg("--porcelain")
            .current_dir(&self.repo_path)
            .output()
            .map_err(|e| GitError::CommandFailed(e.to_string()))?;

        if !output.status.success() {
            return Err(GitError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string(),
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let paths: Vec<PathBuf> = stdout
            .lines()
            .filter(|line| line.starts_with("worktree "))
            .filter_map(|line| line.strip_prefix("worktree "))
            .map(PathBuf::from)
            .collect();

        Ok(paths)
    }

    /// Worktreeをクリーンアップ（prune）
    pub fn prune_worktrees(&self) -> GitResult<()> {
        let output = Command::new("git")
            .arg("worktree")
            .arg("prune")
            .current_dir(&self.repo_path)
            .output()
            .map_err(|e| GitError::CommandFailed(e.to_string()))?;

        if !output.status.success() {
            return Err(GitError::CommandFailed(
                String::from_utf8_lossy(&output.stderr).to_string(),
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_git_worktree_ops_creation() {
        let temp_dir = TempDir::new().unwrap();
        let ops = GitWorktreeOps::new(temp_dir.path());
        assert_eq!(ops.repo_path, temp_dir.path());
    }

    #[test]
    fn test_invalid_path_error() {
        let ops = GitWorktreeOps::new("/nonexistent/path");
        // Note: This test just verifies the struct can be created
        // Actual Git operations would fail at runtime
        assert!(ops.repo_path.to_str().is_some());
    }
}
