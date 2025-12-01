//! Worktree integration for Claudable-generated files

use crate::error::{ClaudableError, Result};
use crate::types::GenerateResponse;
use std::path::Path;
use tokio::fs;
use tokio::process::Command;
use tracing::{info, warn};

/// Write Claudable-generated files to worktree
///
/// # Arguments
///
/// * `worktree_path` - Path to the Git worktree
/// * `response` - Generate response from Claudable API
///
/// # Returns
///
/// Summary of files written
pub async fn write_files_to_worktree(worktree_path: &Path, response: &GenerateResponse) -> Result<WriteSummary> {
    info!("Writing {} files from Claudable to worktree: {}", response.files.len(), worktree_path.display());

    let mut files_written = 0;
    let mut total_lines = 0;

    for file in &response.files {
        let file_path = worktree_path.join(&file.path);

        // Create parent directories
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        // Write file content
        fs::write(&file_path, &file.content).await?;

        files_written += 1;
        total_lines += file.content.lines().count();

        info!("  ✅ {}", file.path);
    }

    info!("Successfully wrote {} files ({} lines total)", files_written, total_lines);

    Ok(WriteSummary { files_written, total_lines })
}

/// Install npm dependencies in worktree
///
/// # Arguments
///
/// * `worktree_path` - Path to the worktree containing package.json
pub async fn install_dependencies(worktree_path: &Path) -> Result<()> {
    info!("Installing npm dependencies in worktree...");

    let output = Command::new("npm")
        .arg("install")
        .current_dir(worktree_path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        warn!("npm install failed: {}", stderr);
        return Err(ClaudableError::NpmInstallError(stderr.to_string()));
    }

    info!("  ✅ npm install completed");
    Ok(())
}

/// Build Next.js application in worktree
///
/// # Arguments
///
/// * `worktree_path` - Path to the worktree containing Next.js app
pub async fn build_nextjs_app(worktree_path: &Path) -> Result<()> {
    info!("Building Next.js app in worktree...");

    let output = Command::new("npm")
        .arg("run")
        .arg("build")
        .current_dir(worktree_path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        warn!("npm run build failed: {}", stderr);
        return Err(ClaudableError::BuildError(stderr.to_string()));
    }

    info!("  ✅ Next.js build completed");
    Ok(())
}

/// Verify worktree has required files
///
/// # Arguments
///
/// * `worktree_path` - Path to the worktree
///
/// # Returns
///
/// True if worktree has package.json and basic Next.js structure
pub async fn verify_nextjs_structure(worktree_path: &Path) -> Result<bool> {
    let package_json = worktree_path.join("package.json");
    let app_dir = worktree_path.join("app");

    let has_package_json = package_json.exists();
    let has_app_dir = app_dir.exists();

    Ok(has_package_json && has_app_dir)
}

/// Summary of files written to worktree
#[derive(Debug)]
pub struct WriteSummary {
    /// Number of files written
    pub files_written: usize,

    /// Total lines of code written
    pub total_lines: usize,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{GenerateResponse, GeneratedFile, ProjectStructure};
    use tempfile::TempDir;

    fn create_test_response() -> GenerateResponse {
        GenerateResponse {
            project_id: "test_123".to_string(),
            files: vec![
                GeneratedFile {
                    path: "app/page.tsx".to_string(),
                    content: "export default function Page() {\n  return <div>Hello</div>\n}".to_string(),
                    file_type: "typescript".to_string(),
                },
                GeneratedFile {
                    path: "app/layout.tsx".to_string(),
                    content: "export default function Layout({ children }) {\n  return <html><body>{children}</body></html>\n}".to_string(),
                    file_type: "typescript".to_string(),
                },
            ],
            dependencies: vec!["next@14.0.0".to_string()],
            structure: ProjectStructure {
                app: vec!["page.tsx".to_string(), "layout.tsx".to_string()],
                components: vec![],
                lib: vec![],
                public: vec![],
            },
        }
    }

    #[tokio::test]
    async fn test_write_files_to_worktree() {
        let temp_dir = TempDir::new().unwrap();
        let worktree_path = temp_dir.path();
        let response = create_test_response();

        let result = write_files_to_worktree(worktree_path, &response).await;
        assert!(result.is_ok());

        let summary = result.unwrap();
        assert_eq!(summary.files_written, 2);
        assert!(summary.total_lines > 0);

        // Verify files were created
        assert!(worktree_path.join("app/page.tsx").exists());
        assert!(worktree_path.join("app/layout.tsx").exists());
    }

    #[tokio::test]
    async fn test_verify_nextjs_structure() {
        let temp_dir = TempDir::new().unwrap();
        let worktree_path = temp_dir.path();

        // Initially should fail
        let result = verify_nextjs_structure(worktree_path).await.unwrap();
        assert!(!result);

        // Create required structure
        tokio::fs::create_dir_all(worktree_path.join("app")).await.unwrap();
        tokio::fs::write(worktree_path.join("package.json"), "{}".as_bytes())
            .await
            .unwrap();

        // Now should succeed
        let result = verify_nextjs_structure(worktree_path).await.unwrap();
        assert!(result);
    }

    #[tokio::test]
    #[ignore] // Requires npm installed
    async fn test_install_dependencies() {
        let temp_dir = TempDir::new().unwrap();
        let worktree_path = temp_dir.path();

        // Create minimal package.json
        let package_json = r#"{"dependencies": {"react": "^18.0.0"}}"#;
        tokio::fs::write(worktree_path.join("package.json"), package_json)
            .await
            .unwrap();

        let result = install_dependencies(worktree_path).await;
        assert!(result.is_ok());
    }
}
