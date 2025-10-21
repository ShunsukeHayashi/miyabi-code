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
