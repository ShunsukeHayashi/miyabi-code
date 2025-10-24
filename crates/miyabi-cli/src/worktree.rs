use std::env;
use std::path::PathBuf;

/// Returns the default worktree base directory for the current platform.
pub fn default_worktree_base_dir() -> PathBuf {
    if cfg!(windows) {
        if let Some(local_app_data) = env::var_os("LOCALAPPDATA") {
            return PathBuf::from(local_app_data).join("Miyabi").join("wt");
        }
    }

    PathBuf::from(".worktrees")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_worktree_base_dir_unix() {
        #[cfg(not(windows))]
        {
            let base_dir = default_worktree_base_dir();
            assert_eq!(base_dir, PathBuf::from(".worktrees"));
        }
    }

    #[test]
    fn test_default_worktree_base_dir_windows() {
        #[cfg(windows)]
        {
            // Set LOCALAPPDATA if not set (for testing)
            let test_path = "C:\\Users\\Test\\AppData\\Local";
            std::env::set_var("LOCALAPPDATA", test_path);

            let base_dir = default_worktree_base_dir();
            assert_eq!(
                base_dir,
                PathBuf::from(test_path).join("Miyabi").join("wt")
            );

            // Clean up
            std::env::remove_var("LOCALAPPDATA");
        }
    }

    #[test]
    fn test_default_worktree_base_dir_is_relative() {
        #[cfg(not(windows))]
        {
            let base_dir = default_worktree_base_dir();
            assert!(base_dir.is_relative());
        }
    }
}
