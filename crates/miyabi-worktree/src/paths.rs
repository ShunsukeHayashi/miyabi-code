use std::path::{Path, PathBuf};

/// Normalize a filesystem path to eliminate redundant components.
///
/// This manually resolves `.` and `..` components without touching the filesystem,
/// making it Windows-friendly via `dunce::simplified`.
pub fn normalize_path<P: AsRef<Path>>(path: P) -> PathBuf {
    use std::path::Component;

    let path = dunce::simplified(path.as_ref());
    let mut components = Vec::new();

    for component in path.components() {
        match component {
            Component::CurDir => {
                // Skip current directory references
            },
            Component::ParentDir => {
                // Pop the last component if possible (resolve ..)
                if !components.is_empty() {
                    components.pop();
                }
            },
            comp => {
                // Keep normal components, prefix, and root dir
                components.push(comp);
            },
        }
    }

    components.iter().collect()
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
        // After normalization: "./.worktrees/../.worktrees/issue-42" -> ".worktrees/issue-42"
        assert_eq!(path.components().count(), 2);
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
