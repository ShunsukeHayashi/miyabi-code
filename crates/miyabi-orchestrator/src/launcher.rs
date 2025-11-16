//! Claude Code headless mode launcher

use crate::error::{Result, SchedulerError};
use std::path::PathBuf;
use std::process::Stdio;
use tokio::process::{Child, Command};
use tracing::{debug, info};

/// Launch Claude Code in headless mode
///
/// # Arguments
///
/// * `command` - The command to execute in headless mode (e.g., "/agent-run --issue 270")
/// * `cwd` - Working directory (Worktree path)
/// * `output_file` - File to redirect stdout/stderr
///
/// # Returns
///
/// Returns a `Child` process handle
///
/// # Example
///
/// ```no_run
/// use miyabi_scheduler::launcher::launch_claude_headless;
/// use std::path::PathBuf;
///
/// # #[tokio::main]
/// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
/// let child = launch_claude_headless(
///     "/agent-run --issue 270".to_string(),
///     PathBuf::from(".worktrees/issue-270"),
///     PathBuf::from("/tmp/output.log"),
/// ).await?;
/// # Ok(())
/// # }
/// ```
pub async fn launch_claude_headless(
    command: String,
    cwd: PathBuf,
    output_file: PathBuf,
) -> Result<Child> {
    info!("Launching Claude Code headless: command={}, cwd={}", command, cwd.display());

    // Ensure output directory exists
    if let Some(parent) = output_file.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    // Open output file for writing
    let output = tokio::fs::File::create(&output_file).await.map_err(SchedulerError::Io)?;
    let output_std = output.into_std().await;

    debug!(
        "Spawning: claude code --headless --execute-command '{}' --cwd {} --no-human-in-loop",
        command,
        cwd.display()
    );

    // Spawn Claude Code process
    let child = Command::new("claude")
        .arg("code")
        .arg("--headless")
        .arg("--execute-command")
        .arg(&command)
        .arg("--cwd")
        .arg(&cwd)
        .arg("--no-human-in-loop")
        .current_dir(&cwd)
        .stdout(Stdio::from(output_std.try_clone().map_err(SchedulerError::Io)?))
        .stderr(Stdio::from(output_std))
        .kill_on_drop(true)
        .spawn()
        .map_err(SchedulerError::SpawnFailed)?;

    info!("Claude Code spawned with PID: {:?}", child.id());

    Ok(child)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[tokio::test]
    #[ignore] // Requires Claude Code CLI
    async fn test_launch_claude_headless() {
        let temp_dir = tempdir().unwrap();
        let worktree_path = temp_dir.path().join("worktree");
        let output_file = temp_dir.path().join("output.log");

        tokio::fs::create_dir(&worktree_path).await.unwrap();

        let result =
            launch_claude_headless("echo 'test'".to_string(), worktree_path, output_file.clone())
                .await;

        // Should spawn successfully (or fail with SpawnFailed if claude not installed)
        match result {
            Ok(mut child) => {
                // Kill the process
                let _ = child.kill().await;
            },
            Err(SchedulerError::SpawnFailed(_)) => {
                // Expected if Claude Code CLI not installed
            },
            Err(e) => panic!("Unexpected error: {}", e),
        }
    }
}
