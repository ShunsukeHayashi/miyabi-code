//! Git utilities for repository discovery and validation
//!
//! Provides utilities for working with Git repositories:
//! - Repository root discovery from any subdirectory
//! - Repository validation
//! - Branch detection

use miyabi_types::error::{MiyabiError, Result};
use std::path::{Path, PathBuf};

/// Find the Git repository root from the current directory or any subdirectory
///
/// This function uses Git's discovery mechanism to walk up the directory tree
/// until it finds a `.git` directory. This allows miyabi to work correctly
/// even when run from a subdirectory within a Git repository.
///
/// # Examples
///
/// ```no_run
/// use miyabi_core::git::find_git_root;
///
/// // Works from any subdirectory
/// let root = find_git_root(None)?;
/// println!("Git root: {:?}", root);
/// # Ok::<(), miyabi_types::error::MiyabiError>(())
/// ```
///
/// # Errors
///
/// Returns an error if:
/// - Not in a Git repository
/// - Repository is bare (has no working directory)
/// - Insufficient permissions to access the repository
pub fn find_git_root(start_path: Option<&Path>) -> Result<PathBuf> {
    let search_path = match start_path {
        Some(p) => p.to_path_buf(),
        None => std::env::current_dir().map_err(|e| {
            MiyabiError::Io(std::io::Error::new(
                e.kind(),
                format!("Failed to get current directory: {}", e),
            ))
        })?,
    };

    // Use git2::Repository::discover to find the .git directory
    // This walks up the directory tree until it finds a repository
    match git2::Repository::discover(&search_path) {
        Ok(repo) => {
            // Get the working directory (not the .git directory)
            repo.workdir()
                .map(|p| p.to_path_buf())
                .ok_or_else(|| {
                    MiyabiError::Git(
                        "Repository is bare (no working directory). Miyabi requires a non-bare repository.".to_string()
                    )
                })
        }
        Err(e) => {
            // Provide helpful error message
            Err(MiyabiError::Git(format!(
                "Not in a Git repository. Please run miyabi from within a Git repository.\n\
                 Searched from: {:?}\n\
                 Git error: {}\n\n\
                 To initialize a new repository, run: git init",
                search_path, e
            )))
        }
    }
}

/// Validate that a path is a valid Git repository
///
/// # Arguments
/// * `path` - Path to validate
///
/// # Returns
/// `true` if the path is a valid Git repository with a working directory
pub fn is_valid_repository(path: impl AsRef<Path>) -> bool {
    match git2::Repository::open(path.as_ref()) {
        Ok(repo) => repo.workdir().is_some(),
        Err(_) => false,
    }
}

/// Get the current branch name of a repository
///
/// # Arguments
/// * `repo_path` - Path to the repository
///
/// # Returns
/// The name of the currently checked out branch
///
/// # Errors
/// Returns an error if the repository is in a detached HEAD state or cannot be opened
pub fn get_current_branch(repo_path: impl AsRef<Path>) -> Result<String> {
    let repo = git2::Repository::open(repo_path.as_ref())
        .map_err(|e| MiyabiError::Git(format!("Failed to open repository: {}", e)))?;

    let head = repo
        .head()
        .map_err(|e| MiyabiError::Git(format!("Failed to get HEAD: {}", e)))?;

    if !head.is_branch() {
        return Err(MiyabiError::Git(
            "Repository is in detached HEAD state. Please checkout a branch.".to_string(),
        ));
    }

    head.shorthand()
        .map(|s| s.to_string())
        .ok_or_else(|| MiyabiError::Git("Failed to get branch name".to_string()))
}

/// Get the main branch name (tries 'main' then 'master')
///
/// # Arguments
/// * `repo_path` - Path to the repository
///
/// # Returns
/// The name of the main branch ('main' or 'master')
///
/// # Errors
/// Returns an error if neither 'main' nor 'master' branch exists
pub fn get_main_branch(repo_path: impl AsRef<Path>) -> Result<String> {
    let repo = git2::Repository::open(repo_path.as_ref())
        .map_err(|e| MiyabiError::Git(format!("Failed to open repository: {}", e)))?;

    if repo.find_branch("main", git2::BranchType::Local).is_ok() {
        Ok("main".to_string())
    } else if repo.find_branch("master", git2::BranchType::Local).is_ok() {
        Ok("master".to_string())
    } else {
        Err(MiyabiError::Git(
            "Neither 'main' nor 'master' branch found. Please create a main branch.".to_string(),
        ))
    }
}

/// Check if the repository has uncommitted changes
///
/// # Arguments
/// * `repo_path` - Path to the repository
///
/// # Returns
/// `true` if there are uncommitted changes in the working directory or index
pub fn has_uncommitted_changes(repo_path: impl AsRef<Path>) -> Result<bool> {
    let repo = git2::Repository::open(repo_path.as_ref())
        .map_err(|e| MiyabiError::Git(format!("Failed to open repository: {}", e)))?;

    let statuses = repo
        .statuses(None)
        .map_err(|e| MiyabiError::Git(format!("Failed to get repository status: {}", e)))?;

    Ok(!statuses.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn setup_test_repo() -> (TempDir, PathBuf) {
        let temp_dir = TempDir::new().unwrap();
        let repo_path = temp_dir.path().to_path_buf();

        // Initialize git repository
        git2::Repository::init(&repo_path).unwrap();

        (temp_dir, repo_path)
    }

    #[test]
    fn test_find_git_root_from_root() {
        let (_temp, repo_path) = setup_test_repo();

        let found_root = find_git_root(Some(&repo_path)).unwrap();
        assert_eq!(found_root, repo_path);
    }

    #[test]
    fn test_find_git_root_from_subdirectory() {
        let (_temp, repo_path) = setup_test_repo();

        // Create a subdirectory
        let sub_dir = repo_path.join("src").join("nested");
        fs::create_dir_all(&sub_dir).unwrap();

        // Find root from subdirectory
        let found_root = find_git_root(Some(&sub_dir)).unwrap();
        assert_eq!(found_root, repo_path);
    }

    #[test]
    fn test_find_git_root_not_in_repo() {
        let temp_dir = TempDir::new().unwrap();
        let non_repo_path = temp_dir.path().to_path_buf();

        // Should fail - not in a git repository
        let result = find_git_root(Some(&non_repo_path));
        assert!(result.is_err());
        assert!(result
            .unwrap_err()
            .to_string()
            .contains("Not in a Git repository"));
    }

    #[test]
    fn test_is_valid_repository() {
        let (_temp, repo_path) = setup_test_repo();

        assert!(is_valid_repository(&repo_path));

        let temp_dir = TempDir::new().unwrap();
        assert!(!is_valid_repository(temp_dir.path()));
    }

    #[test]
    fn test_get_main_branch() {
        let (_temp, repo_path) = setup_test_repo();

        // Create an initial commit to establish a branch
        let repo = git2::Repository::open(&repo_path).unwrap();
        let sig = git2::Signature::now("Test", "test@example.com").unwrap();
        let tree_id = {
            let mut index = repo.index().unwrap();
            index.write_tree().unwrap()
        };
        let tree = repo.find_tree(tree_id).unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "Initial commit", &tree, &[])
            .unwrap();

        // Should find 'main' or 'master' depending on git config
        let main_branch = get_main_branch(&repo_path);
        assert!(main_branch.is_ok());
        let branch_name = main_branch.unwrap();
        assert!(branch_name == "main" || branch_name == "master");
    }

    #[test]
    fn test_has_uncommitted_changes() {
        let (_temp, repo_path) = setup_test_repo();

        // Initially should have no changes (empty repo)
        let has_changes = has_uncommitted_changes(&repo_path).unwrap();
        assert!(!has_changes);

        // Create a file
        let test_file = repo_path.join("test.txt");
        fs::write(&test_file, "test content").unwrap();

        // Now should have uncommitted changes
        let has_changes = has_uncommitted_changes(&repo_path).unwrap();
        assert!(has_changes);
    }
}
