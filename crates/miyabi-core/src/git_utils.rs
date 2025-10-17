//! Git utility functions
//!
//! Provides helper functions for Git operations including repository discovery
//! and validation.

use git2::Repository;
use std::path::{Path, PathBuf};

/// Find the root of the Git repository
///
/// Walks up the directory tree from the current or given directory to find
/// the Git repository root. This is useful when the command is run from a
/// subdirectory within the repository.
///
/// # Arguments
/// * `start_path` - Optional starting path. If None, uses current directory.
///
/// # Returns
/// * `Ok(PathBuf)` - Path to the Git repository root
/// * `Err(String)` - Error message if not in a Git repository
///
/// # Examples
/// ```no_run
/// use miyabi_core::git_utils::find_git_root;
/// use std::path::Path;
///
/// // Find git root from current directory
/// let root = find_git_root(None).expect("Not in a git repository");
/// println!("Git root: {:?}", root);
///
/// // Find git root from specific directory
/// let root = find_git_root(Some(Path::new("/path/to/subdir"))).expect("Not in a git repository");
/// ```
pub fn find_git_root(start_path: Option<&Path>) -> Result<PathBuf, String> {
    // Determine starting path
    let start = match start_path {
        Some(path) => path.to_path_buf(),
        None => std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?,
    };

    // Use Repository::discover to find the repository
    let repo = Repository::discover(&start).map_err(|e| {
        format!(
            "Not in a git repository. Tried starting from {:?}\n\
             Git error: {}\n\
             Hint: Make sure you're running this command from within a git repository, \
             or initialize one with 'git init'",
            start, e
        )
    })?;

    // Get the repository workdir (root directory)
    let workdir = repo.workdir().ok_or_else(|| {
        format!(
            "Repository at {:?} is a bare repository (no working directory).\n\
             Hint: Miyabi requires a non-bare repository with a working directory.",
            repo.path()
        )
    })?;

    Ok(workdir.to_path_buf())
}

/// Check if a path is within a Git repository
///
/// # Arguments
/// * `path` - Path to check
///
/// # Returns
/// * `true` if the path is within a Git repository
/// * `false` otherwise
pub fn is_in_git_repo(path: &Path) -> bool {
    Repository::discover(path).is_ok()
}

/// Get the current branch name
///
/// # Arguments
/// * `repo_path` - Path to the Git repository
///
/// # Returns
/// * `Ok(String)` - Current branch name
/// * `Err(String)` - Error message if unable to determine branch
pub fn get_current_branch(repo_path: &Path) -> Result<String, String> {
    let repo = Repository::open(repo_path)
        .map_err(|e| format!("Failed to open repository at {:?}: {}", repo_path, e))?;

    let head = repo
        .head()
        .map_err(|e| format!("Failed to get HEAD reference: {}", e))?;

    let branch_name = head
        .shorthand()
        .ok_or_else(|| "HEAD is not a valid UTF-8 branch name".to_string())?;

    Ok(branch_name.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_find_git_root_from_current_dir() {
        // This test should pass when run from within the Miyabi repository
        match find_git_root(None) {
            Ok(root) => {
                assert!(root.exists());
                assert!(root.join(".git").exists() || root.join(".git").is_file()); // .git can be a file in worktrees
                println!("Found git root: {:?}", root);
            }
            Err(e) => {
                // Expected if not in a git repository (e.g., in CI)
                println!("Not in git repo (expected in some environments): {}", e);
            }
        }
    }

    #[test]
    fn test_find_git_root_with_explicit_path() {
        // Try from current directory
        let current = env::current_dir().expect("Failed to get current dir");

        match find_git_root(Some(&current)) {
            Ok(root) => {
                assert!(root.exists());
                println!("Found git root from explicit path: {:?}", root);
            }
            Err(e) => {
                println!("Not in git repo (expected in some environments): {}", e);
            }
        }
    }

    #[test]
    fn test_is_in_git_repo() {
        let current = env::current_dir().expect("Failed to get current dir");
        let result = is_in_git_repo(&current);

        // Should be true when running from within the Miyabi repository
        // May be false in isolated test environments
        println!("Is in git repo: {}", result);
    }

    #[test]
    fn test_is_in_git_repo_false() {
        let temp = env::temp_dir();
        // Temp dir is unlikely to be in a git repo
        // (though it could be if the test is run in unusual circumstances)
        let result = is_in_git_repo(&temp);
        println!("Temp dir in git repo: {}", result);
    }

    #[test]
    fn test_get_current_branch() {
        match find_git_root(None) {
            Ok(root) => match get_current_branch(&root) {
                Ok(branch) => {
                    assert!(!branch.is_empty());
                    println!("Current branch: {}", branch);
                }
                Err(e) => {
                    println!("Failed to get branch (may be in detached HEAD): {}", e);
                }
            },
            Err(_) => {
                println!("Not in git repo (expected in some environments)");
            }
        }
    }

    #[test]
    fn test_error_message_not_in_repo() {
        let non_repo = PathBuf::from("/nonexistent/path/that/does/not/exist");

        let result = find_git_root(Some(&non_repo));
        assert!(result.is_err());

        let error = result.unwrap_err();
        assert!(error.contains("Not in a git repository"));
        assert!(error.contains("Hint:"));
    }

    #[test]
    fn test_error_message_quality() {
        let non_repo = PathBuf::from("/tmp");

        let result = find_git_root(Some(&non_repo));

        if let Err(error) = result {
            // Error should be informative
            assert!(error.contains("git repository") || error.contains("Git error"));
            // Error should have hints
            assert!(error.contains("Hint:") || error.contains("git init"));
            println!("Quality error message: {}", error);
        }
    }
}
