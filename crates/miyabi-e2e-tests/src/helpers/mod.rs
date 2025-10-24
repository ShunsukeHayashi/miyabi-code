//! Helper utilities for E2E tests

use crate::E2EResult;
use std::path::Path;
use std::time::Duration;
use tokio::time::sleep;

/// Create a test file with content
pub async fn create_test_file(
    path: &Path,
    filename: &str,
    content: &str,
) -> E2EResult<std::path::PathBuf> {
    let file_path = path.join(filename);

    // Create parent directories if they don't exist
    if let Some(parent) = file_path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    tokio::fs::write(&file_path, content).await?;
    Ok(file_path)
}

/// Create a test commit
pub async fn create_test_commit(path: &Path, message: &str) -> E2EResult<()> {
    // Stage all changes
    let output = tokio::process::Command::new("git")
        .arg("add")
        .arg(".")
        .current_dir(path)
        .output()
        .await?;

    if !output.status.success() {
        return Err(format!(
            "git add failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )
        .into());
    }

    // Commit
    let output = tokio::process::Command::new("git")
        .arg("commit")
        .arg("-m")
        .arg(message)
        .current_dir(path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // Ignore "nothing to commit" errors
        if !stderr.contains("nothing to commit") {
            return Err(format!("git commit failed: {}", stderr).into());
        }
    }

    Ok(())
}

/// Assert that a file exists
pub fn assert_file_exists<P: AsRef<Path>>(path: P) {
    assert!(
        path.as_ref().exists(),
        "File does not exist: {:?}",
        path.as_ref()
    );
}

/// Assert that a file contains specific content
pub async fn assert_file_contains<P: AsRef<Path>>(path: P, content: &str) -> E2EResult<()> {
    let file_content = tokio::fs::read_to_string(path.as_ref()).await?;
    assert!(
        file_content.contains(content),
        "File {:?} does not contain expected content: {}",
        path.as_ref(),
        content
    );
    Ok(())
}

/// Wait for a condition to be true with timeout
pub async fn wait_for_condition<F>(
    mut condition: F,
    timeout: Duration,
    check_interval: Duration,
) -> E2EResult<()>
where
    F: FnMut() -> bool,
{
    let start = std::time::Instant::now();

    while start.elapsed() < timeout {
        if condition() {
            return Ok(());
        }
        sleep(check_interval).await;
    }

    Err("Condition timeout reached".into())
}

/// Read a file and return its content
pub async fn read_file<P: AsRef<Path>>(path: P) -> E2EResult<String> {
    Ok(tokio::fs::read_to_string(path).await?)
}

/// Write content to a file
pub async fn write_file<P: AsRef<Path>>(path: P, content: &str) -> E2EResult<()> {
    if let Some(parent) = path.as_ref().parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    tokio::fs::write(path, content).await?;
    Ok(())
}

/// Create a directory
pub async fn create_dir<P: AsRef<Path>>(path: P) -> E2EResult<()> {
    tokio::fs::create_dir_all(path).await?;
    Ok(())
}

/// Remove a file or directory
pub async fn remove_path<P: AsRef<Path>>(path: P) -> E2EResult<()> {
    let path_ref = path.as_ref();
    if path_ref.is_dir() {
        tokio::fs::remove_dir_all(path_ref).await?;
    } else if path_ref.is_file() {
        tokio::fs::remove_file(path_ref).await?;
    }
    Ok(())
}

/// Run a git command
pub async fn run_git_command(path: &Path, args: &[&str]) -> E2EResult<String> {
    let output = tokio::process::Command::new("git")
        .args(args)
        .current_dir(path)
        .output()
        .await?;

    if !output.status.success() {
        return Err(format!(
            "git command failed: {}",
            String::from_utf8_lossy(&output.stderr)
        )
        .into());
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

/// Get current git branch
pub async fn get_current_branch(path: &Path) -> E2EResult<String> {
    let output = run_git_command(path, &["rev-parse", "--abbrev-ref", "HEAD"]).await?;
    Ok(output.trim().to_string())
}

/// Create a git branch
pub async fn create_branch(path: &Path, branch_name: &str) -> E2EResult<()> {
    run_git_command(path, &["checkout", "-b", branch_name]).await?;
    Ok(())
}

/// Checkout a git branch
pub async fn checkout_branch(path: &Path, branch_name: &str) -> E2EResult<()> {
    run_git_command(path, &["checkout", branch_name]).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_create_test_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = create_test_file(temp_dir.path(), "test.txt", "Hello, World!")
            .await
            .unwrap();

        assert!(file_path.exists());
        let content = tokio::fs::read_to_string(file_path).await.unwrap();
        assert_eq!(content, "Hello, World!");
    }

    #[tokio::test]
    async fn test_assert_file_exists() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        tokio::fs::write(&file_path, "test").await.unwrap();

        assert_file_exists(&file_path);
    }

    #[tokio::test]
    async fn test_assert_file_contains() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        tokio::fs::write(&file_path, "Hello, World!")
            .await
            .unwrap();

        assert_file_contains(&file_path, "World").await.unwrap();
    }

    #[tokio::test]
    async fn test_wait_for_condition() {
        let mut counter = 0;
        let condition = || {
            counter += 1;
            counter >= 3
        };

        wait_for_condition(
            condition,
            Duration::from_secs(5),
            Duration::from_millis(100),
        )
        .await
        .unwrap();
    }
}
