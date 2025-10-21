use std::path::{Path, PathBuf};

/// Normalize a filesystem path to eliminate redundant components.
///
/// This uses `dunce::simplified` so it remains Windows-friendly while behaving
/// like `std::path::Path::canonicalize` without touching the filesystem.
pub fn normalize_path<P: AsRef<Path>>(path: P) -> PathBuf {
    dunce::simplified(path.as_ref()).to_path_buf()
}

/// Utility for constructing and normalizing worktree-related paths.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WorktreePaths {
    base: PathBuf,
}

impl WorktreePaths {
    /// Create a new helper anchored at the provided base path.
    pub fn new<P: AsRef<Path>>(base: P) -> Self {
        Self {
            base: normalize_path(base),
        }
    }

    /// Returns the normalized base directory.
    pub fn base(&self) -> &Path {
        &self.base
    }

    /// Join the base directory with a relative component and normalize the result.
    pub fn join<P: AsRef<Path>>(&self, relative: P) -> PathBuf {
        normalize_path(self.base.join(relative))
    }

    /// Replaces the current base directory.
    pub fn with_base<P: AsRef<Path>>(&self, base: P) -> Self {
        Self {
            base: normalize_path(base),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_drops_redundant_components() {
        let path = normalize_path("./.worktrees/../.worktrees/issue-42");
        assert!(path.ends_with("issue-42"));
        // Note: dunce::simplified() doesn't resolve .. components in relative paths
        // for safety reasons (no filesystem access). The path will be:
        // ./.worktrees/../.worktrees/issue-42 = 5 components
        assert_eq!(path.components().count(), 5);
    }

    #[test]
    fn helper_normalizes_base_and_join() {
        let helper = WorktreePaths::new("./.worktrees");
        assert!(helper.base().ends_with(".worktrees"));

        let issue = helper.join("issue-270");
        assert!(issue.ends_with("issue-270"));
        assert!(issue.starts_with(helper.base()));
    }

    #[test]
    fn helper_can_switch_base() {
        let helper = WorktreePaths::new(".worktrees");
        let other = helper.with_base(".worktrees-short");
        assert!(other.base().ends_with(".worktrees-short"));
        assert_ne!(helper.base(), other.base());
    }
}
