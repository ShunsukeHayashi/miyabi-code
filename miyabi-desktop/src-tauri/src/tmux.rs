//! Tmux Session Manager
//!
//! Provides functionality to create, list, attach, and kill tmux sessions
//! for external coding agents (Cloud Code, Codex, Gemini CLI).

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Stdio;
use tokio::process::Command;

/// Git status information
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GitStatus {
    /// Current branch name
    pub branch: String,
    /// Number of commits ahead of remote
    pub ahead: usize,
    /// Number of commits behind remote
    pub behind: usize,
    /// Number of modified files
    pub modified: usize,
    /// Number of untracked files
    pub untracked: usize,
    /// Number of staged files
    pub staged: usize,
}

/// Tmux session information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TmuxSession {
    /// Session name (e.g., "cloud-code-session")
    pub session_name: String,
    /// Agent name (e.g., "Cloud Code")
    pub agent_name: String,
    /// Current session status
    pub status: SessionStatus,
    /// Command running in the session
    pub command: String,
    /// Git status (if available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git_status: Option<GitStatus>,
}

/// Tmux window information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TmuxWindow {
    /// Window index within the session (respects base-index option)
    pub index: usize,
    /// Window name as displayed in tmux
    pub name: String,
}

/// Session status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "type")]
pub enum SessionStatus {
    /// Session is currently running
    Running,
    /// Session is stopped/inactive
    Stopped,
    /// Session encountered an error
    #[serde(rename = "Error")]
    Error { message: String },
}

/// Tmux session manager
pub struct TmuxManager;

impl TmuxManager {
    /// Create a new tmux session with the given name and command
    ///
    /// # Arguments
    /// * `session_name` - Unique name for the tmux session
    /// * `command` - Shell command to execute in the session
    ///
    /// # Returns
    /// * `Ok(())` if session was created successfully
    /// * `Err(String)` if creation failed
    pub async fn create_session(session_name: &str, command: &str) -> Result<(), String> {
        // Check if tmux is installed
        if !Self::is_tmux_installed().await {
            return Err("tmux is not installed. Please install tmux first.".to_string());
        }

        // Check if session already exists - if so, kill it first
        if Self::check_session_exists(session_name).await? {
            eprintln!(
                "Session '{}' already exists, killing it first...",
                session_name
            );
            Self::kill_session(session_name).await?;
        }

        // Create new detached tmux session
        let output = Command::new("tmux")
            .args([
                "new-session",
                "-d", // Detached mode
                "-s",
                session_name, // Session name
                command,      // Command to run
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to spawn tmux process: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to create tmux session: {}", stderr));
        }

        Ok(())
    }

    /// List all active tmux sessions
    ///
    /// # Returns
    /// * `Ok(Vec<TmuxSession>)` - List of active sessions
    /// * `Err(String)` - If listing failed
    pub async fn list_sessions() -> Result<Vec<TmuxSession>, String> {
        // Check if tmux is installed
        if !Self::is_tmux_installed().await {
            return Ok(Vec::new()); // Return empty list if tmux not installed
        }

        // List tmux sessions with format: session_name
        let output = Command::new("tmux")
            .args(["list-sessions", "-F", "#{session_name}"])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to list tmux sessions: {}", e))?;

        // If no sessions exist, tmux returns exit code 1
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("no server running") || stderr.contains("no sessions") {
                return Ok(Vec::new());
            }
            return Err(format!("Failed to list sessions: {}", stderr));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let sessions: Vec<TmuxSession> = stdout
            .lines()
            .filter(|line| !line.is_empty())
            .map(|session_name| TmuxSession {
                session_name: session_name.to_string(),
                agent_name: Self::infer_agent_name(session_name),
                status: SessionStatus::Running,
                command: String::new(), // Command info not available from list-sessions
                git_status: None,       // TODO: Fetch Git status if worktree is available
            })
            .collect();

        Ok(sessions)
    }

    /// List windows for a given tmux session
    pub async fn list_windows(session_name: &str) -> Result<Vec<TmuxWindow>, String> {
        let output = Command::new("tmux")
            .args([
                "list-windows",
                "-t",
                session_name,
                "-F",
                "#{window_index}:#{window_name}",
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to list tmux windows: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("unknown session") {
                return Err(format!("Session '{}' does not exist", session_name));
            }
            return Err(format!("Failed to list windows: {}", stderr.trim()));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut windows = Vec::new();

        for line in stdout.lines().filter(|line| !line.is_empty()) {
            let mut parts = line.splitn(2, ':');
            let index_str = parts.next().unwrap_or_default();
            let name_str = parts.next().unwrap_or_default();

            match index_str.parse::<usize>() {
                Ok(index) => windows.push(TmuxWindow {
                    index,
                    name: name_str.to_string(),
                }),
                Err(err) => {
                    return Err(format!(
                        "Failed to parse tmux window index '{}' for session '{}': {}",
                        index_str, session_name, err
                    ));
                }
            }
        }

        Ok(windows)
    }

    /// Lookup a window index by its name (case sensitive)
    pub async fn get_window_index_by_name(
        session_name: &str,
        window_name: &str,
    ) -> Result<Option<usize>, String> {
        let windows = Self::list_windows(session_name).await?;
        Ok(windows
            .into_iter()
            .find(|w| w.name == window_name)
            .map(|w| w.index))
    }

    /// Attach to an existing tmux session
    ///
    /// # Arguments
    /// * `session_name` - Name of the session to attach to
    ///
    /// # Returns
    /// * `Ok(())` if attach command was executed
    /// * `Err(String)` if attach failed
    pub async fn attach_session(session_name: &str) -> Result<(), String> {
        // Check if session exists
        if !Self::check_session_exists(session_name).await? {
            return Err(format!("Session '{}' does not exist", session_name));
        }

        // Note: Attaching to tmux requires a terminal (TTY)
        // This method prepares the attach command but doesn't execute it
        // The frontend should open a terminal and run: tmux attach-session -t <name>

        // For Tauri app, we return OK and let the frontend handle terminal spawning
        Ok(())
    }

    /// Kill (terminate) a tmux session
    ///
    /// # Arguments
    /// * `session_name` - Name of the session to kill
    ///
    /// # Returns
    /// * `Ok(())` if session was killed successfully
    /// * `Err(String)` if kill failed
    pub async fn kill_session(session_name: &str) -> Result<(), String> {
        // Check if session exists - if not, return OK (already killed)
        if !Self::check_session_exists(session_name).await? {
            eprintln!("Session '{}' does not exist (already killed)", session_name);
            return Ok(());
        }

        let output = Command::new("tmux")
            .args(["kill-session", "-t", session_name])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to kill tmux session: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // If session doesn't exist, treat as success
            if stderr.contains("no session") || stderr.contains("can't find session") {
                return Ok(());
            }
            return Err(format!("Failed to kill session: {}", stderr));
        }

        Ok(())
    }

    /// Check if a tmux session exists
    ///
    /// # Arguments
    /// * `session_name` - Session name to check
    ///
    /// # Returns
    /// * `Ok(true)` if session exists
    /// * `Ok(false)` if session does not exist
    /// * `Err(String)` if check failed
    pub async fn check_session_exists(session_name: &str) -> Result<bool, String> {
        let output = Command::new("tmux")
            .args(["has-session", "-t", session_name])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to check tmux session: {}", e))?;

        // tmux has-session returns 0 if session exists, 1 if not
        Ok(output.status.success())
    }

    /// Check if tmux is installed on the system
    ///
    /// # Returns
    /// * `true` if tmux is available
    /// * `false` if tmux is not found
    async fn is_tmux_installed() -> bool {
        Command::new("tmux")
            .arg("-V")
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .await
            .map(|status| status.success())
            .unwrap_or(false)
    }

    /// Infer agent name from session name
    ///
    /// # Arguments
    /// * `session_name` - Session name (e.g., "cloud-code-session")
    ///
    /// # Returns
    /// * Inferred agent name (e.g., "Cloud Code")
    fn infer_agent_name(session_name: &str) -> String {
        match session_name {
            name if name.contains("cloud-code") => "Cloud Code".to_string(),
            name if name.contains("codex") => "Codex (via OpenAI API)".to_string(),
            name if name.contains("gemini") => "Gemini CLI (via gcloud)".to_string(),
            name if name.contains("tone") => "Tone".to_string(),
            _ => session_name.to_string(),
        }
    }

    /// Get session output (last N lines)
    ///
    /// # Arguments
    /// * `session_name` - Session name
    /// * `lines` - Number of lines to capture (default: 50)
    ///
    /// # Returns
    /// * `Ok(String)` - Session output
    /// * `Err(String)` - If capture failed
    pub async fn get_session_output(session_name: &str, lines: usize) -> Result<String, String> {
        if !Self::check_session_exists(session_name).await? {
            return Err(format!("Session '{}' does not exist", session_name));
        }

        let output = Command::new("tmux")
            .args([
                "capture-pane",
                "-t",
                session_name,
                "-p", // Print to stdout
                "-S",
                &format!("-{}", lines), // Start N lines back
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| format!("Failed to capture pane: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to get session output: {}", stderr));
        }

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    /// Get Git status for a worktree path
    ///
    /// # Arguments
    /// * `worktree_path` - Path to the Git worktree
    ///
    /// # Returns
    /// * `Ok(GitStatus)` - Git status information
    /// * `Err(String)` - If Git status could not be retrieved
    pub async fn get_git_status(worktree_path: &Path) -> Result<GitStatus, String> {
        // Get current branch
        let branch_output = Command::new("git")
            .args([
                "-C",
                worktree_path.to_str().unwrap(),
                "rev-parse",
                "--abbrev-ref",
                "HEAD",
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to get branch: {}", e))?;

        let branch = if branch_output.status.success() {
            String::from_utf8_lossy(&branch_output.stdout)
                .trim()
                .to_string()
        } else {
            "unknown".to_string()
        };

        // Get porcelain status
        let status_output = Command::new("git")
            .args([
                "-C",
                worktree_path.to_str().unwrap(),
                "status",
                "--porcelain",
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to get status: {}", e))?;

        let mut modified = 0;
        let mut untracked = 0;
        let mut staged = 0;

        if status_output.status.success() {
            let stdout = String::from_utf8_lossy(&status_output.stdout);
            for line in stdout.lines() {
                if line.len() < 3 {
                    continue;
                }
                let status_code = &line[..2];
                match status_code {
                    "??" => untracked += 1,
                    s if !s.starts_with(' ') => staged += 1,
                    s if s.chars().nth(1) != Some(' ') => modified += 1,
                    _ => {}
                }
            }
        }

        // Get ahead/behind info
        let mut ahead = 0;
        let mut behind = 0;

        let upstream_output = Command::new("git")
            .args([
                "-C",
                worktree_path.to_str().unwrap(),
                "rev-list",
                "--left-right",
                "--count",
                "HEAD...@{upstream}",
            ])
            .output()
            .await;

        if let Ok(output) = upstream_output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if let Some((a, b)) = stdout.trim().split_once('\t') {
                    ahead = a.parse().unwrap_or(0);
                    behind = b.parse().unwrap_or(0);
                }
            }
        }

        Ok(GitStatus {
            branch,
            ahead,
            behind,
            modified,
            untracked,
            staged,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_infer_agent_name() {
        assert_eq!(
            TmuxManager::infer_agent_name("cloud-code-session"),
            "Cloud Code"
        );
        assert_eq!(
            TmuxManager::infer_agent_name("codex-session"),
            "Codex (via OpenAI API)"
        );
        assert_eq!(
            TmuxManager::infer_agent_name("gemini-cli-session"),
            "Gemini CLI (via gcloud)"
        );
        assert_eq!(TmuxManager::infer_agent_name("tone-session"), "Tone");
        assert_eq!(
            TmuxManager::infer_agent_name("custom-session"),
            "custom-session"
        );
    }

    #[tokio::test]
    async fn test_is_tmux_installed() {
        // This test will pass if tmux is installed, skip otherwise
        let installed = TmuxManager::is_tmux_installed().await;
        if installed {
            println!("✓ tmux is installed");
        } else {
            println!("⚠ tmux is not installed (test skipped)");
        }
    }

    #[tokio::test]
    async fn test_list_sessions_when_none_exist() {
        // This should not error even if no sessions exist
        let result = TmuxManager::list_sessions().await;
        assert!(result.is_ok());
    }
}
