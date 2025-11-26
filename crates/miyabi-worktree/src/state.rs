//! Worktree state tracking and management
//!
//! Provides real-time tracking of Git Worktree states, including detection of
//! orphaned, stuck, and idle worktrees, with integration to TaskMetadata.

use chrono::{DateTime, Utc};
use miyabi_core::{find_git_root, TaskMetadataManager};
use miyabi_types::error::{MiyabiError, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::Duration;

/// Comprehensive worktree state information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeState {
    /// Worktree path
    pub path: PathBuf,
    /// Git branch name
    pub branch: String,
    /// Associated issue number (if any)
    pub issue_number: Option<u64>,
    /// Current status
    pub status: WorktreeStatusDetailed,
    /// Last access/modification time
    pub last_accessed: DateTime<Utc>,
    /// Whether the worktree has a lock file
    pub is_locked: bool,
    /// Whether there are uncommitted changes
    pub has_uncommitted_changes: bool,
    /// Disk space usage in bytes
    pub disk_usage: u64,
}

/// Detailed worktree status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorktreeStatusDetailed {
    /// Currently being used by an agent
    Active,
    /// Waiting/idle (recently used)
    Idle,
    /// Stuck (no activity for extended period)
    Stuck,
    /// Orphaned (no corresponding TaskMetadata)
    Orphaned,
    /// Corrupted (git errors, missing files, etc.)
    Corrupted,
}

impl std::fmt::Display for WorktreeStatusDetailed {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorktreeStatusDetailed::Active => write!(f, "Active"),
            WorktreeStatusDetailed::Idle => write!(f, "Idle"),
            WorktreeStatusDetailed::Stuck => write!(f, "Stuck"),
            WorktreeStatusDetailed::Orphaned => write!(f, "Orphaned"),
            WorktreeStatusDetailed::Corrupted => write!(f, "Corrupted"),
        }
    }
}

/// Worktree state manager
pub struct WorktreeStateManager {
    project_root: PathBuf,
    worktree_base: PathBuf,
    task_metadata_manager: TaskMetadataManager,
}

impl WorktreeStateManager {
    /// Create a new WorktreeStateManager
    pub fn new(project_root: PathBuf) -> Result<Self> {
        // Automatically resolve the git repository root. When invoked from a
        // subdirectory, this ensures we look in the canonical project root for
        // both `.worktrees/` and `.miyabi/tasks/`.
        let resolved_root = match find_git_root(Some(&project_root)) {
            Ok(root) => {
                if root != project_root {
                    tracing::debug!(
                        "Resolved git repository root {:?} from {:?}",
                        root,
                        project_root
                    );
                }
                root
            }
            Err(err) => {
                tracing::debug!(
                    "WorktreeStateManager fallback to provided path {:?}: {}",
                    project_root,
                    err
                );
                project_root.clone()
            }
        };

        let worktree_base = resolved_root.join(".worktrees");
        let task_metadata_manager = TaskMetadataManager::new(&resolved_root)
            .map_err(|e| MiyabiError::Io(std::io::Error::other(e.to_string())))?;

        Ok(Self {
            project_root: resolved_root,
            worktree_base,
            task_metadata_manager,
        })
    }

    /// Scan all worktrees and return their states
    pub fn scan_worktrees(&self) -> Result<Vec<WorktreeState>> {
        let mut states = Vec::new();

        // Check if worktree directory exists
        if !self.worktree_base.exists() {
            return Ok(states);
        }

        // Iterate through worktree directories
        let entries = std::fs::read_dir(&self.worktree_base).map_err(MiyabiError::Io)?;

        for entry in entries {
            let entry = entry.map_err(MiyabiError::Io)?;
            let path = entry.path();

            if path.is_dir() {
                if let Ok(state) = self.get_worktree_state(&path) {
                    states.push(state);
                }
            }
        }

        // Sort by last accessed time (most recent first)
        states.sort_by(|a, b| b.last_accessed.cmp(&a.last_accessed));

        Ok(states)
    }

    /// Get the state of a specific worktree
    pub fn get_worktree_state(&self, path: &Path) -> Result<WorktreeState> {
        // Check if path exists
        if !path.exists() {
            return Err(MiyabiError::Io(std::io::Error::new(
                std::io::ErrorKind::NotFound,
                format!("Worktree not found: {}", path.display()),
            )));
        }

        // Get branch name from directory name (e.g., "issue-123" -> "issue-123")
        let dir_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");
        let branch = dir_name.to_string();

        // Extract issue number from directory name
        let issue_number = self.extract_issue_number(dir_name);

        // Determine status
        let status = self.determine_status(path, issue_number)?;

        // Get last accessed time
        let last_accessed = self.get_last_accessed(path)?;

        // Check if locked
        let is_locked = self.is_locked(path);

        // Check for uncommitted changes
        let has_uncommitted_changes = self.has_uncommitted_changes(path)?;

        // Calculate disk usage
        let disk_usage = self.calculate_disk_usage(path)?;

        Ok(WorktreeState {
            path: path.to_path_buf(),
            branch,
            issue_number,
            status,
            last_accessed,
            is_locked,
            has_uncommitted_changes,
            disk_usage,
        })
    }

    /// Find orphaned worktrees (no corresponding TaskMetadata)
    pub fn find_orphaned_worktrees(&self) -> Result<Vec<WorktreeState>> {
        let all_states = self.scan_worktrees()?;

        Ok(all_states
            .into_iter()
            .filter(|s| s.status == WorktreeStatusDetailed::Orphaned)
            .collect())
    }

    /// Find stuck worktrees (no activity for extended period)
    pub fn find_stuck_worktrees(&self, timeout: Duration) -> Result<Vec<WorktreeState>> {
        let all_states = self.scan_worktrees()?;
        let now = Utc::now();

        Ok(all_states
            .into_iter()
            .filter(|s| {
                s.status == WorktreeStatusDetailed::Stuck
                    || (now - s.last_accessed).num_seconds() > timeout.as_secs() as i64
            })
            .collect())
    }

    /// Clean up a specific worktree
    pub fn cleanup_worktree(&self, path: &Path) -> Result<()> {
        if !path.exists() {
            return Ok(());
        }

        // Remove worktree using git
        let _repo = git2::Repository::open(&self.project_root)
            .map_err(|e| MiyabiError::Git(e.to_string()))?;

        // Use git worktree remove command
        let status = std::process::Command::new("git")
            .arg("worktree")
            .arg("remove")
            .arg("--force")
            .arg(path)
            .current_dir(&self.project_root)
            .status()
            .map_err(MiyabiError::Io)?;

        if !status.success() {
            // If git worktree remove fails, try manual deletion
            std::fs::remove_dir_all(path).map_err(MiyabiError::Io)?;
        }

        Ok(())
    }

    /// Clean up all orphaned worktrees
    pub fn cleanup_orphaned(&self) -> Result<usize> {
        let orphaned = self.find_orphaned_worktrees()?;
        let count = orphaned.len();

        for worktree in orphaned {
            self.cleanup_worktree(&worktree.path)?;
        }

        Ok(count)
    }

    /// Clean up all known worktrees regardless of status
    pub fn cleanup_all(&self) -> Result<usize> {
        let worktrees = self.scan_worktrees()?;
        let mut cleaned = 0usize;
        let mut errors = Vec::new();

        for worktree in worktrees {
            match self.cleanup_worktree(&worktree.path) {
                Ok(_) => cleaned += 1,
                Err(e) => {
                    errors.push(format!("{} ({})", worktree.path.display(), e));
                }
            }
        }

        if errors.is_empty() {
            Ok(cleaned)
        } else {
            Err(MiyabiError::Unknown(format!(
                "Failed to clean some worktrees: {}",
                errors.join(", ")
            )))
        }
    }

    /// Synchronize worktree states with TaskMetadata
    pub fn sync_with_metadata(&self) -> Result<()> {
        let worktrees = self.scan_worktrees()?;
        let all_tasks = self
            .task_metadata_manager
            .list_all()
            .map_err(|e| MiyabiError::Io(std::io::Error::other(e.to_string())))?;

        // Create a map of issue numbers to task metadata
        let task_map: std::collections::HashMap<u64, _> = all_tasks
            .into_iter()
            .filter_map(|t| t.issue_number.map(|n| (n, t)))
            .collect();

        // Check each worktree
        for worktree in worktrees {
            if let Some(issue_num) = worktree.issue_number {
                // Check if there's corresponding task metadata
                if !task_map.contains_key(&issue_num) {
                    tracing::warn!(
                        "Orphaned worktree detected: {} (issue #{})",
                        worktree.path.display(),
                        issue_num
                    );
                }
            }
        }

        Ok(())
    }

    // Helper methods

    fn extract_issue_number(&self, dir_name: &str) -> Option<u64> {
        // Try to extract issue number from patterns like:
        // - "issue-123"
        // - "issue-123-feature"
        // - "123-bugfix"

        if let Some(captures) = regex::Regex::new(r"issue[_-]?(\d+)")
            .ok()?
            .captures(dir_name)
        {
            return captures.get(1)?.as_str().parse().ok();
        }

        // Try simple numeric prefix
        if let Some(captures) = regex::Regex::new(r"^(\d+)").ok()?.captures(dir_name) {
            return captures.get(1)?.as_str().parse().ok();
        }

        None
    }

    fn determine_status(
        &self,
        path: &Path,
        issue_number: Option<u64>,
    ) -> Result<WorktreeStatusDetailed> {
        // Check if corrupted (git errors)
        if git2::Repository::open(path).is_err() {
            return Ok(WorktreeStatusDetailed::Corrupted);
        }

        // Check if orphaned (no corresponding task metadata)
        if let Some(issue_num) = issue_number {
            let tasks = self
                .task_metadata_manager
                .find_by_issue(issue_num)
                .map_err(|e| MiyabiError::Io(std::io::Error::other(e.to_string())))?;
            if tasks.is_empty() {
                return Ok(WorktreeStatusDetailed::Orphaned);
            }

            // Check if task is running
            if let Some(task) = tasks.first() {
                use miyabi_core::TaskStatus;
                match task.status {
                    TaskStatus::Running => return Ok(WorktreeStatusDetailed::Active),
                    TaskStatus::Success | TaskStatus::Failed | TaskStatus::Cancelled => {
                        return Ok(WorktreeStatusDetailed::Idle);
                    }
                    _ => {}
                }
            }
        }

        // Check last accessed time to determine if stuck
        let last_accessed = self.get_last_accessed(path)?;
        let elapsed = Utc::now() - last_accessed;

        if elapsed.num_hours() > 24 {
            Ok(WorktreeStatusDetailed::Stuck)
        } else if elapsed.num_hours() > 1 {
            Ok(WorktreeStatusDetailed::Idle)
        } else {
            Ok(WorktreeStatusDetailed::Active)
        }
    }

    fn get_last_accessed(&self, path: &Path) -> Result<DateTime<Utc>> {
        let metadata = std::fs::metadata(path).map_err(MiyabiError::Io)?;

        let modified = metadata.modified().map_err(MiyabiError::Io)?;

        Ok(DateTime::from(modified))
    }

    fn is_locked(&self, path: &Path) -> bool {
        path.join(".git").join("index.lock").exists()
    }

    fn has_uncommitted_changes(&self, path: &Path) -> Result<bool> {
        let repo = git2::Repository::open(path).map_err(|e| MiyabiError::Git(e.to_string()))?;

        let statuses = repo
            .statuses(None)
            .map_err(|e| MiyabiError::Git(e.to_string()))?;

        Ok(!statuses.is_empty())
    }

    fn calculate_disk_usage(&self, path: &Path) -> Result<u64> {
        Self::calculate_disk_usage_recursive(path)
    }

    fn calculate_disk_usage_recursive(path: &Path) -> Result<u64> {
        let mut total = 0;

        if path.is_dir() {
            for entry in std::fs::read_dir(path).map_err(MiyabiError::Io)? {
                let entry = entry.map_err(MiyabiError::Io)?;
                let entry_path = entry.path();

                if entry_path.is_file() {
                    if let Ok(metadata) = std::fs::metadata(&entry_path) {
                        total += metadata.len();
                    }
                } else if entry_path.is_dir() {
                    total += Self::calculate_disk_usage_recursive(&entry_path)?;
                }
            }
        }

        Ok(total)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_extract_issue_number() {
        let temp_dir = TempDir::new().unwrap();
        let manager = WorktreeStateManager::new(temp_dir.path().to_path_buf()).unwrap();

        assert_eq!(manager.extract_issue_number("issue-123"), Some(123));
        assert_eq!(manager.extract_issue_number("issue_456"), Some(456));
        assert_eq!(manager.extract_issue_number("issue-789-feature"), Some(789));
        assert_eq!(manager.extract_issue_number("123-bugfix"), Some(123));
        assert_eq!(manager.extract_issue_number("no-number"), None);
    }

    #[test]
    fn test_worktree_state_manager_creation() {
        let temp_dir = TempDir::new().unwrap();
        let manager = WorktreeStateManager::new(temp_dir.path().to_path_buf());
        assert!(manager.is_ok());
    }

    #[test]
    fn test_scan_worktrees_empty() {
        let temp_dir = TempDir::new().unwrap();
        let manager = WorktreeStateManager::new(temp_dir.path().to_path_buf()).unwrap();

        let states = manager.scan_worktrees().unwrap();
        assert_eq!(states.len(), 0);
    }

    #[test]
    fn test_cleanup_all_with_no_worktrees() {
        let temp_dir = TempDir::new().unwrap();
        let manager = WorktreeStateManager::new(temp_dir.path().to_path_buf()).unwrap();

        let cleaned = manager.cleanup_all().unwrap();
        assert_eq!(cleaned, 0);
    }

    #[test]
    fn test_state_manager_resolves_git_root() {
        let temp_dir = TempDir::new().unwrap();
        let repo_path = temp_dir.path();

        // Initialize git repository
        let init_output = std::process::Command::new("git")
            .args(["init"])
            .current_dir(repo_path)
            .output()
            .expect("git init should be invokable");
        assert!(
            init_output.status.success(),
            "git init did not exit successfully"
        );

        let subdir = repo_path.join("nested");
        std::fs::create_dir(&subdir).unwrap();

        // Create manager from subdirectory path
        let manager = WorktreeStateManager::new(subdir.clone()).unwrap();

        // Task metadata directory should exist at repository root
        assert!(repo_path.join(".miyabi").join("tasks").exists());
        assert!(!subdir.join(".miyabi").exists());

        // Manager still scans (even if no worktrees)
        let states = manager.scan_worktrees().unwrap();
        assert!(states.is_empty());
    }
}
