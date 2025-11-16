//! Session Management for Miyabi Code Agent
//!
//! Inspired by OpenAI Codex CLI's session management.
//! Supports resumable execution, turn-by-turn conversation tracking.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

/// Session represents a single autonomous execution session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    /// Unique session ID (e.g., ses_abc123)
    pub id: String,

    /// Task description (e.g., "refactor auth module")
    pub task: String,

    /// Session status
    pub status: SessionStatus,

    /// Creation timestamp
    pub created_at: DateTime<Utc>,

    /// Last update timestamp
    pub updated_at: DateTime<Utc>,

    /// Completed timestamp (if completed)
    pub completed_at: Option<DateTime<Utc>>,

    /// All turns in this session
    pub turns: Vec<Turn>,

    /// Session context (cwd, environment, etc.)
    pub context: SessionContext,

    /// Execution mode
    pub mode: ExecutionMode,
}

/// Session status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SessionStatus {
    /// Session is running
    Running,

    /// Session completed successfully
    Completed,

    /// Session failed with error
    Failed {
        error: String,
        resumable: bool,
        last_successful_turn: Option<usize>,
    },

    /// Session paused (waiting for approval)
    Paused { reason: String },
}

/// Execution mode (like Codex's --full-auto, --sandbox)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ExecutionMode {
    /// Read-only mode (default)
    ReadOnly,

    /// File edits allowed
    FileEdits,

    /// Full access (file edits + network + commands)
    FullAccess,

    /// Interactive mode (approval required for each action)
    Interactive,
}

/// Single turn in a conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Turn {
    /// Turn ID (e.g., turn_1)
    pub id: String,

    /// User prompt (or system-generated task)
    pub prompt: String,

    /// LLM response
    pub response: Option<String>,

    /// Actions taken in this turn
    pub actions: Vec<Action>,

    /// Turn status
    pub status: TurnStatus,

    /// Start timestamp
    pub started_at: DateTime<Utc>,

    /// Completion timestamp
    pub completed_at: Option<DateTime<Utc>>,

    /// Reasoning steps (like Codex's reasoning events)
    pub reasoning: Vec<ReasoningStep>,
}

/// Turn status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TurnStatus {
    Pending,
    Running,
    Completed,
    Failed { error: String },
}

/// Reasoning step (internal thought process)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningStep {
    pub content: String,
    pub timestamp: DateTime<Utc>,
}

/// Action taken by the agent
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Action {
    /// Read file
    ReadFile {
        path: String,
        success: bool,
        error: Option<String>,
    },

    /// Write/edit file
    WriteFile {
        path: String,
        content: String,
        approved: bool,
        success: bool,
        error: Option<String>,
    },

    /// Execute command
    RunCommand {
        command: String,
        args: Vec<String>,
        stdout: String,
        stderr: String,
        exit_code: i32,
        approved: bool,
    },

    /// Create GitHub Issue
    CreateIssue {
        title: String,
        number: u64,
        success: bool,
    },

    /// Create Pull Request
    CreatePR {
        title: String,
        number: u64,
        success: bool,
    },

    /// Reasoning (internal thought)
    Reasoning { content: String },
}

/// Session context (environment information)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionContext {
    /// Current working directory when session started
    pub cwd: PathBuf,

    /// Git repository root (if in a git repo)
    pub git_root: Option<PathBuf>,

    /// Current git branch
    pub git_branch: Option<String>,

    /// GitHub repository (owner/repo)
    pub github_repo: Option<String>,

    /// Environment variables (filtered for safety)
    pub env_vars: std::collections::HashMap<String, String>,
}

impl Session {
    /// Create a new session
    pub fn new(task: String, mode: ExecutionMode) -> Self {
        let id = format!("ses_{}", &Uuid::new_v4().to_string()[..8]);
        let now = Utc::now();

        Self {
            id,
            task,
            status: SessionStatus::Running,
            created_at: now,
            updated_at: now,
            completed_at: None,
            turns: Vec::new(),
            context: SessionContext::capture(),
            mode,
        }
    }

    /// Add a new turn to the session
    pub fn add_turn(&mut self, prompt: String) -> &mut Turn {
        let turn_id = format!("turn_{}", self.turns.len() + 1);
        let turn = Turn {
            id: turn_id,
            prompt,
            response: None,
            actions: Vec::new(),
            status: TurnStatus::Pending,
            started_at: Utc::now(),
            completed_at: None,
            reasoning: Vec::new(),
        };

        self.turns.push(turn);
        self.updated_at = Utc::now();
        self.turns.last_mut().unwrap()
    }

    /// Mark session as completed
    pub fn complete(&mut self) {
        self.status = SessionStatus::Completed;
        self.completed_at = Some(Utc::now());
        self.updated_at = Utc::now();
    }

    /// Mark session as failed
    pub fn fail(&mut self, error: String, resumable: bool) {
        let last_successful_turn =
            self.turns.iter().rposition(|t| t.status == TurnStatus::Completed);

        self.status = SessionStatus::Failed {
            error,
            resumable,
            last_successful_turn,
        };
        self.updated_at = Utc::now();
    }

    /// Save session to disk
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let session_dir = Self::get_sessions_dir()?;
        std::fs::create_dir_all(&session_dir)?;

        let session_path = session_dir.join(format!("{}.json", self.id));
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(session_path, json)?;

        // Also update "last" symlink
        let last_link = session_dir.join("last.json");
        if last_link.exists() {
            std::fs::remove_file(&last_link)?;
        }
        #[cfg(unix)]
        std::os::unix::fs::symlink(format!("{}.json", self.id), last_link)?;

        Ok(())
    }

    /// Load session from disk
    pub fn load(id: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let session_dir = Self::get_sessions_dir()?;
        let session_path = session_dir.join(format!("{}.json", id));

        if !session_path.exists() {
            return Err(format!("Session not found: {}", id).into());
        }

        let json = std::fs::read_to_string(session_path)?;
        let session: Session = serde_json::from_str(&json)?;
        Ok(session)
    }

    /// Load the last session
    pub fn load_last() -> Result<Self, Box<dyn std::error::Error>> {
        let session_dir = Self::get_sessions_dir()?;
        let last_link = session_dir.join("last.json");

        if !last_link.exists() {
            return Err("No previous session found".into());
        }

        let json = std::fs::read_to_string(last_link)?;
        let session: Session = serde_json::from_str(&json)?;
        Ok(session)
    }

    /// List all sessions
    pub fn list_all() -> Result<Vec<SessionSummary>, Box<dyn std::error::Error>> {
        let session_dir = Self::get_sessions_dir()?;

        if !session_dir.exists() {
            return Ok(Vec::new());
        }

        let mut summaries = Vec::new();

        for entry in std::fs::read_dir(session_dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().and_then(|s| s.to_str()) != Some("json") {
                continue;
            }

            // Skip symlinks
            if path.file_name().and_then(|s| s.to_str()) == Some("last.json") {
                continue;
            }

            let json = std::fs::read_to_string(&path)?;
            let session: Session = serde_json::from_str(&json)?;

            summaries.push(SessionSummary {
                id: session.id,
                task: session.task,
                status: session.status,
                created_at: session.created_at,
                completed_at: session.completed_at,
                turn_count: session.turns.len(),
            });
        }

        // Sort by creation time (newest first)
        summaries.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok(summaries)
    }

    /// Get sessions directory (~/.miyabi/sessions/)
    fn get_sessions_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let home = dirs::home_dir().ok_or("Could not find home directory")?;
        Ok(home.join(".miyabi").join("sessions"))
    }
}

/// Session summary (for listing)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub task: String,
    pub status: SessionStatus,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub turn_count: usize,
}

impl SessionContext {
    /// Capture current execution context
    pub fn capture() -> Self {
        let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

        // Try to get git info
        let git_root = Self::get_git_root();
        let git_branch = Self::get_git_branch();
        let github_repo = Self::get_github_repo();

        // Capture safe environment variables
        let mut env_vars = std::collections::HashMap::new();
        if let Ok(device) = std::env::var("DEVICE_IDENTIFIER") {
            env_vars.insert("DEVICE_IDENTIFIER".to_string(), device);
        }
        if let Ok(user) = std::env::var("USER") {
            env_vars.insert("USER".to_string(), user);
        }

        Self {
            cwd,
            git_root,
            git_branch,
            github_repo,
            env_vars,
        }
    }

    fn get_git_root() -> Option<PathBuf> {
        let output = std::process::Command::new("git")
            .args(["rev-parse", "--show-toplevel"])
            .output()
            .ok()?;

        if output.status.success() {
            let path = String::from_utf8(output.stdout).ok()?;
            Some(PathBuf::from(path.trim()))
        } else {
            None
        }
    }

    fn get_git_branch() -> Option<String> {
        let output = std::process::Command::new("git")
            .args(["rev-parse", "--abbrev-ref", "HEAD"])
            .output()
            .ok()?;

        if output.status.success() {
            Some(String::from_utf8(output.stdout).ok()?.trim().to_string())
        } else {
            None
        }
    }

    fn get_github_repo() -> Option<String> {
        let output = std::process::Command::new("gh")
            .args([
                "repo",
                "view",
                "--json",
                "nameWithOwner",
                "-q",
                ".nameWithOwner",
            ])
            .output()
            .ok()?;

        if output.status.success() {
            Some(String::from_utf8(output.stdout).ok()?.trim().to_string())
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_creation() {
        let session = Session::new("test task".to_string(), ExecutionMode::ReadOnly);

        assert!(session.id.starts_with("ses_"));
        assert_eq!(session.task, "test task");
        assert_eq!(session.status, SessionStatus::Running);
        assert_eq!(session.turns.len(), 0);
    }

    #[test]
    fn test_add_turn() {
        let mut session = Session::new("test task".to_string(), ExecutionMode::ReadOnly);
        session.add_turn("first prompt".to_string());

        assert_eq!(session.turns.len(), 1);
        assert_eq!(session.turns[0].id, "turn_1");
        assert_eq!(session.turns[0].prompt, "first prompt");
    }

    #[test]
    fn test_session_completion() {
        let mut session = Session::new("test task".to_string(), ExecutionMode::ReadOnly);
        session.complete();

        assert_eq!(session.status, SessionStatus::Completed);
        assert!(session.completed_at.is_some());
    }

    #[test]
    fn test_session_failure() {
        let mut session = Session::new("test task".to_string(), ExecutionMode::ReadOnly);
        session.add_turn("turn 1".to_string());
        session.turns[0].status = TurnStatus::Completed;

        session.fail("test error".to_string(), true);

        match session.status {
            SessionStatus::Failed {
                error,
                resumable,
                last_successful_turn,
            } => {
                assert_eq!(error, "test error");
                assert!(resumable);
                assert_eq!(last_successful_turn, Some(0));
            },
            _ => panic!("Expected Failed status"),
        }
    }
}
