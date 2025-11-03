//! Full Automation Module
//!
//! Provides orchestration for Claude Code + Codex + Miyabi Agents
//! in a fully automated development workflow.

use crate::github::load_env_value;
use crate::tmux::TmuxManager;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;

/// Automation mode configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationConfig {
    /// Session base name (e.g., "miyabi-auto-dev")
    pub session_name: String,
    /// Repository root path
    pub repo_root: PathBuf,
    /// Task description file (optional)
    pub task_file: Option<PathBuf>,
    /// Enable Claude Code
    pub enable_claude_code: bool,
    /// Enable Codex
    pub enable_codex: bool,
    /// Enable monitoring dashboard
    pub enable_monitoring: bool,
    /// Orchestrator mode (manages all agents)
    pub orchestrator_mode: bool,
}

/// Automation session info
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationSession {
    /// Main session name
    pub session_name: String,
    /// Claude Code window index (if enabled)
    pub claude_code_window: Option<usize>,
    /// Codex window index (if enabled)
    pub codex_window: Option<usize>,
    /// Monitoring window index (if enabled)
    pub monitoring_window: Option<usize>,
    /// Orchestrator window index (if enabled)
    pub orchestrator_window: Option<usize>,
    /// Status
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomationReadiness {
    pub runtime_ready: bool,
    pub config_loaded: bool,
    pub repo_root: Option<String>,
    pub session_name: Option<String>,
    pub session_exists: bool,
    pub github_token: bool,
    pub github_repository: Option<String>,
    pub task_file: Option<String>,
    pub notes: Vec<String>,
    pub errors: Vec<String>,
}

/// Automation Manager
pub struct AutomationManager;

impl AutomationManager {
    pub async fn get_readiness() -> AutomationReadiness {
        let mut readiness = AutomationReadiness {
            runtime_ready: true,
            config_loaded: false,
            repo_root: None,
            session_name: None,
            session_exists: false,
            github_token: false,
            github_repository: None,
            task_file: None,
            notes: Vec::new(),
            errors: Vec::new(),
        };

        match Self::load_config_from_env() {
            Ok(config) => {
                readiness.config_loaded = true;
                readiness.repo_root = Some(config.repo_root.to_string_lossy().to_string());
                readiness.session_name = Some(config.session_name.clone());
                readiness.task_file = config
                    .task_file
                    .as_ref()
                    .and_then(|path| path.to_str().map(|s| s.to_string()));

                match TmuxManager::check_session_exists(&config.session_name).await {
                    Ok(exists) => {
                        readiness.session_exists = exists;
                        if exists {
                            readiness
                                .notes
                                .push(format!(
                                    "Existing tmux session '{}' detected. Miyabi will clean it up before launching.",
                                    config.session_name
                                ));
                        }
                    }
                    Err(err) => readiness.errors.push(err),
                }

                let feature_summary = format!(
                    "Features → Claude Code: {}, Codex: {}, Orchestrator: {}, Monitor: {}",
                    if config.enable_claude_code {
                        "on"
                    } else {
                        "off"
                    },
                    if config.enable_codex { "on" } else { "off" },
                    if config.orchestrator_mode {
                        "on"
                    } else {
                        "off"
                    },
                    if config.enable_monitoring {
                        "on"
                    } else {
                        "off"
                    }
                );
                readiness.notes.push(feature_summary);
            }
            Err(err) => {
                readiness.errors.push(err);
            }
        }

        match load_env_value("GITHUB_TOKEN") {
            Ok(_) => {
                readiness.github_token = true;
            }
            Err(err) => {
                readiness.errors.push(err);
            }
        }

        if let Ok(repo) = load_env_value("GITHUB_REPOSITORY") {
            readiness.github_repository = Some(repo);
        }

        readiness
    }

    /// Load automation config from .env file and task files
    ///
    /// This automatically detects:
    /// - Repository root from .env
    /// - Task files from tasks/ directory
    /// - GitHub repository from .env
    ///
    /// # Returns
    /// * `Ok(AutomationConfig)` - Auto-loaded configuration
    /// * `Err(String)` - If loading failed
    pub fn load_config_from_env() -> Result<AutomationConfig, String> {
        // Find repository root (directory containing .env)
        let repo_root = Self::find_repo_root()?;

        // Read .env file
        let env_path = repo_root.join(".env");
        if !env_path.exists() {
            return Err(format!(".env file not found at: {}", env_path.display()));
        }

        // Parse .env file
        let env_content =
            fs::read_to_string(&env_path).map_err(|e| format!("Failed to read .env: {}", e))?;

        let mut github_repo = None;
        for line in env_content.lines() {
            let line = line.trim();
            if line.starts_with("GITHUB_REPOSITORY=") {
                github_repo = Some(line.trim_start_matches("GITHUB_REPOSITORY=").to_string());
            }
        }

        // Auto-detect task files
        let tasks_dir = repo_root.join("tasks");
        let task_file = if tasks_dir.exists() {
            // Find first .md file in tasks directory
            fs::read_dir(&tasks_dir).ok().and_then(|entries| {
                entries
                    .filter_map(|e| e.ok())
                    .find(|e| e.path().extension().map(|ext| ext == "md").unwrap_or(false))
                    .map(|e| e.path())
            })
        } else {
            None
        };

        Ok(AutomationConfig {
            session_name: format!(
                "miyabi-auto-{}",
                github_repo
                    .as_ref()
                    .and_then(|r| r.split('/').next_back())
                    .unwrap_or("dev")
            ),
            repo_root: repo_root.clone(),
            task_file,
            enable_claude_code: true,
            enable_codex: true,
            enable_monitoring: true,
            orchestrator_mode: true,
        })
    }

    /// Find repository root by looking for .env file
    fn find_repo_root() -> Result<PathBuf, String> {
        let current_dir =
            env::current_dir().map_err(|e| format!("Failed to get current directory: {}", e))?;

        let mut dir = current_dir.as_path();
        loop {
            if dir.join(".env").exists() {
                return Ok(dir.to_path_buf());
            }

            match dir.parent() {
                Some(parent) => dir = parent,
                None => {
                    return Err(
                        "Could not find .env file in current directory or any parent directory"
                            .to_string(),
                    )
                }
            }
        }
    }

    /// Start full automation session
    ///
    /// This creates a tmux session with multiple windows:
    /// - Window 0: Claude Code (if enabled)
    /// - Window 1: Codex (if enabled)
    /// - Window 2: Orchestrator (if enabled)
    /// - Window 3: Monitoring Dashboard (if enabled)
    ///
    /// # Arguments
    /// * `config` - Automation configuration
    ///
    /// # Returns
    /// * `Ok(AutomationSession)` - Session information
    /// * `Err(String)` - If startup failed
    pub async fn start_automation(config: AutomationConfig) -> Result<AutomationSession, String> {
        let session_name = &config.session_name;

        // Check if session already exists
        if TmuxManager::check_session_exists(session_name).await? {
            return Err(format!(
                "Automation session '{}' already exists. Please kill it first.",
                session_name
            ));
        }

        let repo_root_str = config
            .repo_root
            .to_str()
            .ok_or("Invalid repository root path")?;

        let mut session_created = false;
        let mut claude_code_window = None;
        let mut codex_window = None;
        let mut orchestrator_window = None;
        let mut monitoring_window = None;

        // Claude Code automation window
        if config.enable_claude_code {
            let window_name = "Claude-Code";
            let command = Self::build_claude_code_command(&config)?;

            let window_idx = if !session_created {
                session_created = true;
                Self::create_initial_window(session_name, command.as_str(), window_name).await?
            } else {
                Self::create_window(session_name, window_name, command.as_str(), repo_root_str)
                    .await?
            };

            claude_code_window = Some(window_idx);
        }

        // Codex task runner window
        if config.enable_codex {
            let window_name = "Codex";
            let command = Self::build_codex_command(&config)?;

            let window_idx = if !session_created {
                session_created = true;
                Self::create_initial_window(session_name, command.as_str(), window_name).await?
            } else {
                Self::create_window(session_name, window_name, command.as_str(), repo_root_str)
                    .await?
            };

            codex_window = Some(window_idx);
        }

        // Orchestrator (full automation controller)
        if config.orchestrator_mode {
            let window_name = "Orchestrator";
            let command = Self::build_orchestrator_command(&config)?;

            let window_idx = if !session_created {
                session_created = true;
                Self::create_initial_window(session_name, command.as_str(), window_name).await?
            } else {
                Self::create_window(session_name, window_name, command.as_str(), repo_root_str)
                    .await?
            };

            orchestrator_window = Some(window_idx);
        }

        // Monitoring dashboard window (multi-pane status view)
        if config.enable_monitoring {
            let window_name = "Monitor";
            let window_idx = if !session_created {
                session_created = true;
                Self::create_initial_window(session_name, "bash", window_name).await?
            } else {
                Self::create_window(session_name, window_name, "bash", repo_root_str).await?
            };

            Self::setup_monitoring_dashboard(session_name, window_idx, repo_root_str).await?;

            monitoring_window = Some(window_idx);
        }

        // If no feature windows were created (all disabled), create a default shell window
        if !session_created {
            Self::create_initial_window(session_name, "bash", "Shell").await?;
        }

        Ok(AutomationSession {
            session_name: session_name.to_string(),
            claude_code_window,
            codex_window,
            orchestrator_window,
            monitoring_window,
            status: "Running".to_string(),
        })
    }

    /// Stop automation session
    pub async fn stop_automation(session_name: &str) -> Result<(), String> {
        TmuxManager::kill_session(session_name).await
    }

    /// Build Claude Code execution command
    fn build_claude_code_command(config: &AutomationConfig) -> Result<String, String> {
        let repo_root_str = config
            .repo_root
            .to_str()
            .ok_or("Invalid repository root path")?;

        let _task_file = if let Some(task_path) = &config.task_file {
            task_path
                .to_str()
                .ok_or("Invalid task file path")?
                .to_string()
        } else {
            format!("{}/tasks/claude-auto-task.md", repo_root_str)
        };

        // Build Claude Code command with --dangerously-skip-permissions and logging
        let log_dir = format!("{}/.ai/logs/claude-code", repo_root_str);
        let log_file = format!("{}/claude-code-$(date +%Y%m%d-%H%M%S).log", log_dir);

        Ok(format!(
            "cd {} && mkdir -p {} && echo '🤖 Claude Code - Auto Implementation' | tee {} && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' | tee -a {} && echo 'Starting Claude Code...' | tee -a {} && claude --dangerously-skip-permissions 2>&1 | tee -a {} || echo 'Error: Claude Code failed. Check if Claude CLI is installed.' | tee -a {}",
            repo_root_str, log_dir, log_file, log_file, log_file, log_file, log_file
        ))
    }

    /// Build Codex execution command
    fn build_codex_command(config: &AutomationConfig) -> Result<String, String> {
        let repo_root_str = config
            .repo_root
            .to_str()
            .ok_or("Invalid repository root path")?;

        // Create logs directory if it doesn't exist
        let log_dir = format!("{}/.ai/logs/codex", repo_root_str);
        let log_file = format!("{}/codex-$(date +%Y%m%d-%H%M%S).log", log_dir);

        Ok(format!(
            "cd {} && mkdir -p {} && echo '⚙️  GitHub Codex - Task Runner' | tee {} && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' | tee -a {} && echo 'Starting Codex in Claude Code environment...' | tee -a {} && claude --dangerously-skip-permissions 2>&1 | tee -a {} || echo 'Error: Claude Code failed. Check if Claude CLI is installed.' | tee -a {}",
            repo_root_str, log_dir, log_file, log_file, log_file, log_file, log_file
        ))
    }

    /// Build Orchestrator command
    fn build_orchestrator_command(config: &AutomationConfig) -> Result<String, String> {
        let repo_root_str = config
            .repo_root
            .to_str()
            .ok_or("Invalid repository root path")?;

        Ok(format!(
            "cd {} && echo '🎯 Miyabi Orchestrator - Full Automation Mode' && echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' && cargo run --release --bin miyabi -- agent coordinator --mode auto --watch || echo 'Error: Miyabi CLI not built. Run: cargo build --release'",
            repo_root_str
        ))
    }

    /// Create the first tmux window by bootstrapping a detached session
    async fn create_initial_window(
        session_name: &str,
        command: &str,
        window_name: &str,
    ) -> Result<usize, String> {
        TmuxManager::create_session(session_name, command).await?;

        let windows = TmuxManager::list_windows(session_name).await?;
        let first_window = windows
            .into_iter()
            .next()
            .ok_or_else(|| format!("Session '{}' has no windows after creation", session_name))?;

        if first_window.name != window_name {
            Self::rename_window(session_name, first_window.index, window_name).await?;
        }

        let resolved_index = TmuxManager::get_window_index_by_name(session_name, window_name)
            .await?
            .unwrap_or(first_window.index);

        Ok(resolved_index)
    }

    /// Create a new tmux window
    async fn create_window(
        session_name: &str,
        window_name: &str,
        command: &str,
        working_dir: &str,
    ) -> Result<usize, String> {
        use tokio::process::Command;

        let output = Command::new("tmux")
            .args([
                "new-window",
                "-P",
                "-F",
                "#{window_index}",
                "-t",
                session_name,
                "-n",
                window_name,
                "-c",
                working_dir,
                command,
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to create window '{}': {}", window_name, e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!(
                "Failed to create window '{}': {}",
                window_name,
                stderr.trim()
            ));
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let trimmed = stdout.trim();

        if let Ok(index) = trimmed.parse::<usize>() {
            return Ok(index);
        }

        // Fallback: ask tmux for the window index by name
        if let Some(index) =
            TmuxManager::get_window_index_by_name(session_name, window_name).await?
        {
            return Ok(index);
        }

        Err(format!(
            "Window '{}' created but index could not be determined (tmux output: '{}')",
            window_name, trimmed
        ))
    }

    /// Rename a tmux window
    async fn rename_window(
        session_name: &str,
        window_index: usize,
        new_name: &str,
    ) -> Result<(), String> {
        use tokio::process::Command;

        let target = format!("{}:{}", session_name, window_index);
        let output = Command::new("tmux")
            .args(["rename-window", "-t", &target, new_name])
            .output()
            .await
            .map_err(|e| format!("Failed to rename window: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to rename window: {}", stderr));
        }

        Ok(())
    }

    /// Setup monitoring dashboard with 4 panes
    async fn setup_monitoring_dashboard(
        session_name: &str,
        window_index: usize,
        repo_root: &str,
    ) -> Result<(), String> {
        use tokio::process::Command;

        let target = format!("{}:{}", session_name, window_index);

        // Split horizontal (top/bottom)
        Command::new("tmux")
            .args(["split-window", "-h", "-t", &target, "-c", repo_root])
            .output()
            .await
            .map_err(|e| format!("Failed to split window horizontally: {}", e))?;

        // Split left pane vertically
        let pane_0 = format!("{}.0", target);
        Command::new("tmux")
            .args(["split-window", "-v", "-t", &pane_0, "-c", repo_root])
            .output()
            .await
            .map_err(|e| format!("Failed to split pane 0: {}", e))?;

        // Split right pane vertically
        let pane_1 = format!("{}.1", target);
        Command::new("tmux")
            .args(["split-window", "-v", "-t", &pane_1, "-c", repo_root])
            .output()
            .await
            .map_err(|e| format!("Failed to split pane 1: {}", e))?;

        // Send commands to each pane
        // Pane 0 (top-left): Agent status
        Self::send_keys(session_name, window_index, 0,
            &format!("cd {} && while true; do clear; ps aux | grep miyabi | grep -v grep | tail -20; sleep 5; done", repo_root)
        ).await?;

        // Pane 2 (bottom-left): Git status
        Self::send_keys(
            session_name,
            window_index,
            2,
            &format!(
                "cd {} && while true; do clear; git status --short; sleep 10; done",
                repo_root
            ),
        )
        .await?;

        // Pane 1 (top-right): Codex tasks
        Self::send_keys(session_name, window_index, 1,
            &format!("cd {} && while true; do clear; ls -lht .ai/logs 2>/dev/null | head -20; sleep 5; done", repo_root)
        ).await?;

        // Pane 3 (bottom-right): Logs
        Self::send_keys(
            session_name,
            window_index,
            3,
            &format!(
                "cd {} && tail -f .ai/logs/$(date +%Y-%m-%d).log 2>/dev/null || echo 'No logs yet'",
                repo_root
            ),
        )
        .await?;

        Ok(())
    }

    /// Send keys to a specific pane
    async fn send_keys(
        session_name: &str,
        window_index: usize,
        pane_index: usize,
        command: &str,
    ) -> Result<(), String> {
        use tokio::process::Command;

        let target = format!("{}:{}.{}", session_name, window_index, pane_index);

        let output = Command::new("tmux")
            .args(["send-keys", "-t", &target, command, "C-m"])
            .output()
            .await
            .map_err(|e| format!("Failed to send keys: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to send keys to pane: {}", stderr));
        }

        Ok(())
    }

    /// Get automation session status
    pub async fn get_session_status(session_name: &str) -> Result<AutomationSession, String> {
        if !TmuxManager::check_session_exists(session_name).await? {
            return Err(format!(
                "Automation session '{}' does not exist",
                session_name
            ));
        }

        let windows = TmuxManager::list_windows(session_name).await?;

        let mut session = AutomationSession {
            session_name: session_name.to_string(),
            claude_code_window: None,
            codex_window: None,
            orchestrator_window: None,
            monitoring_window: None,
            status: "Running".to_string(),
        };

        for window in windows {
            let name = window.name.to_lowercase();

            if name.contains("claude") {
                session.claude_code_window = Some(window.index);
            } else if name.contains("codex") {
                session.codex_window = Some(window.index);
            } else if name.contains("orchestrator") {
                session.orchestrator_window = Some(window.index);
            } else if name.contains("monitor") {
                session.monitoring_window = Some(window.index);
            }
        }

        Ok(session)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_claude_code_command() {
        let config = AutomationConfig {
            session_name: "test-session".to_string(),
            repo_root: PathBuf::from("/tmp/test-repo"),
            task_file: Some(PathBuf::from("/tmp/test-task.md")),
            enable_claude_code: true,
            enable_codex: false,
            enable_monitoring: false,
            orchestrator_mode: false,
        };

        let command = AutomationManager::build_claude_code_command(&config).unwrap();
        assert!(command.contains("claude --dangerously-skip-permissions"));
        assert!(command.contains(".ai/logs/claude-code"));
    }

    #[test]
    fn test_build_orchestrator_command() {
        let config = AutomationConfig {
            session_name: "test-session".to_string(),
            repo_root: PathBuf::from("/tmp/test-repo"),
            task_file: None,
            enable_claude_code: false,
            enable_codex: false,
            enable_monitoring: false,
            orchestrator_mode: true,
        };

        let command = AutomationManager::build_orchestrator_command(&config).unwrap();
        assert!(command.contains("miyabi"));
        assert!(command.contains("coordinator"));
        assert!(command.contains("--mode auto"));
    }
}
