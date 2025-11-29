//! Sandbox and Git Worktree management
//! 
//! プロジェクト単位でサンドボックス環境を作成し、
//! ファイル競合を防止する

use std::path::{Path, PathBuf};
use std::process::Command;
use tokio::fs;
use uuid::Uuid;

use crate::error::AuthError;

/// Sandbox environment for a project
#[derive(Debug, Clone)]
pub struct Sandbox {
    pub id: Uuid,
    pub user_id: String,
    pub project_id: String,
    pub sandbox_path: PathBuf,
    pub worktree_path: Option<PathBuf>,
}

impl Sandbox {
    /// Get the working directory for this sandbox
    pub fn working_dir(&self) -> &Path {
        self.worktree_path.as_ref().unwrap_or(&self.sandbox_path)
    }
}

/// Create a new sandbox for a project
pub async fn create_sandbox(user_id: &str, project_id: &str) -> Result<Sandbox, AuthError> {
    let sandbox_id = Uuid::new_v4();
    let base_path = PathBuf::from("/home/ubuntu/sandboxes");
    let sandbox_path = base_path.join(user_id).join(project_id).join(sandbox_id.to_string());
    
    // Create sandbox directory
    fs::create_dir_all(&sandbox_path).await
        .map_err(|e| AuthError::Sandbox(format!("Failed to create sandbox dir: {}", e)))?;
    
    // Set permissions (isolate from other sandboxes)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o700);
        std::fs::set_permissions(&sandbox_path, perms)
            .map_err(|e| AuthError::Sandbox(format!("Failed to set permissions: {}", e)))?;
    }
    
    Ok(Sandbox {
        id: sandbox_id,
        user_id: user_id.to_string(),
        project_id: project_id.to_string(),
        sandbox_path,
        worktree_path: None,
    })
}

/// Create a Git worktree for isolated development
pub async fn create_worktree(
    repo_path: &Path,
    branch_name: &str,
    sandbox: &mut Sandbox,
) -> Result<PathBuf, AuthError> {
    let worktree_base = PathBuf::from("/home/ubuntu/worktrees");
    let worktree_path = worktree_base
        .join(&sandbox.user_id)
        .join(&sandbox.project_id)
        .join(branch_name);
    
    // Create worktree directory
    fs::create_dir_all(worktree_path.parent().unwrap()).await
        .map_err(|e| AuthError::Sandbox(format!("Failed to create worktree dir: {}", e)))?;
    
    // Create git worktree
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(["worktree", "add", "-b", branch_name, worktree_path.to_str().unwrap()])
        .output()
        .map_err(|e| AuthError::Sandbox(format!("Failed to create worktree: {}", e)))?;
    
    if !output.status.success() {
        // Try without -b if branch already exists
        let output = Command::new("git")
            .current_dir(repo_path)
            .args(["worktree", "add", worktree_path.to_str().unwrap(), branch_name])
            .output()
            .map_err(|e| AuthError::Sandbox(format!("Failed to create worktree: {}", e)))?;
        
        if !output.status.success() {
            return Err(AuthError::Sandbox(format!(
                "Git worktree failed: {}",
                String::from_utf8_lossy(&output.stderr)
            )));
        }
    }
    
    sandbox.worktree_path = Some(worktree_path.clone());
    Ok(worktree_path)
}

/// Remove a worktree when done
pub async fn remove_worktree(repo_path: &Path, worktree_path: &Path) -> Result<(), AuthError> {
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(["worktree", "remove", "--force", worktree_path.to_str().unwrap()])
        .output()
        .map_err(|e| AuthError::Sandbox(format!("Failed to remove worktree: {}", e)))?;
    
    if !output.status.success() {
        tracing::warn!(
            "Failed to remove worktree {}: {}",
            worktree_path.display(),
            String::from_utf8_lossy(&output.stderr)
        );
    }
    
    Ok(())
}

/// List all worktrees for a repository
pub fn list_worktrees(repo_path: &Path) -> Result<Vec<String>, AuthError> {
    let output = Command::new("git")
        .current_dir(repo_path)
        .args(["worktree", "list", "--porcelain"])
        .output()
        .map_err(|e| AuthError::Sandbox(format!("Failed to list worktrees: {}", e)))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout);
    let worktrees: Vec<String> = stdout
        .lines()
        .filter(|line| line.starts_with("worktree "))
        .map(|line| line.trim_start_matches("worktree ").to_string())
        .collect();
    
    Ok(worktrees)
}

/// Cleanup old sandboxes (older than 24 hours)
pub async fn cleanup_old_sandboxes(base_path: &Path, max_age_hours: u64) -> Result<usize, AuthError> {
    use std::time::{Duration, SystemTime};
    
    let max_age = Duration::from_secs(max_age_hours * 3600);
    let now = SystemTime::now();
    let mut cleaned = 0;
    
    let mut entries = fs::read_dir(base_path).await
        .map_err(|e| AuthError::Sandbox(format!("Failed to read sandbox dir: {}", e)))?;
    
    while let Some(entry) = entries.next_entry().await
        .map_err(|e| AuthError::Sandbox(format!("Failed to read entry: {}", e)))? 
    {
        if let Ok(metadata) = entry.metadata().await {
            if let Ok(modified) = metadata.modified() {
                if let Ok(age) = now.duration_since(modified) {
                    if age > max_age {
                        let path = entry.path();
                        if let Err(e) = fs::remove_dir_all(&path).await {
                            tracing::warn!("Failed to remove old sandbox {:?}: {}", path, e);
                        } else {
                            cleaned += 1;
                        }
                    }
                }
            }
        }
    }
    
    Ok(cleaned)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_create_sandbox() {
        let sandbox = create_sandbox("test-user", "test-project").await.unwrap();
        assert!(sandbox.sandbox_path.exists());
        
        // Cleanup
        fs::remove_dir_all(&sandbox.sandbox_path).await.unwrap();
    }
}
