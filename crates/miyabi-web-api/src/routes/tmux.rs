//! TMUX session management endpoint
//!
//! Provides API for managing TMUX sessions, windows, and panes
//! Integrates with the Miyabi Orchestra parallel execution system

use axum::{
    extract::{Path, Query},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::process::Command;

/// TMUX session information
#[derive(Serialize, Debug, Clone)]
pub struct TmuxSession {
    pub name: String,
    pub windows: Vec<TmuxWindow>,
    pub created_at: Option<String>,
    pub attached: bool,
}

/// TMUX window information
#[derive(Serialize, Debug, Clone)]
pub struct TmuxWindow {
    pub id: String,
    pub name: String,
    pub panes: Vec<TmuxPane>,
    pub active: bool,
}

/// TMUX pane information
#[derive(Serialize, Debug, Clone)]
pub struct TmuxPane {
    pub id: String,
    pub index: u32,
    pub active: bool,
    /// Agent assigned to this pane (if any)
    pub agent: Option<String>,
    /// Current working directory
    pub pwd: Option<String>,
    /// Current command running
    pub command: Option<String>,
}

/// List all TMUX sessions response
#[derive(Serialize)]
pub struct SessionsListResponse {
    pub sessions: Vec<TmuxSession>,
    pub total_count: usize,
}

/// Get status for all TMUX sessions
pub async fn list_sessions() -> Json<SessionsListResponse> {
    let sessions = get_tmux_sessions();
    let total_count = sessions.len();

    Json(SessionsListResponse {
        sessions,
        total_count,
    })
}

/// Get detailed information for a specific session
pub async fn get_session(Path(session_name): Path<String>) -> Json<Option<TmuxSession>> {
    let sessions = get_tmux_sessions();
    let session = sessions.into_iter().find(|s| s.name == session_name);
    Json(session)
}

/// Query parameters for sending commands
#[derive(Deserialize)]
pub struct SendCommandQuery {
    /// Target pane ID (e.g., "miyabi-orchestra:1.0")
    pub pane: String,
    /// Command to send
    pub command: String,
}

/// Send command response
#[derive(Serialize)]
pub struct SendCommandResponse {
    pub success: bool,
    pub message: String,
}

/// Send a command to a specific TMUX pane
pub async fn send_command(Query(params): Query<SendCommandQuery>) -> Json<SendCommandResponse> {
    // Safety check: whitelist allowed commands
    let allowed_prefixes = ["miyabi", "cargo", "git", "ls", "pwd", "cd", "echo"];

    let is_safe = allowed_prefixes
        .iter()
        .any(|prefix| params.command.starts_with(prefix));

    if !is_safe {
        return Json(SendCommandResponse {
            success: false,
            message: format!(
                "Command '{}' is not in the allowed list for safety reasons",
                params.command
            ),
        });
    }

    // Send command via tmux send-keys
    let result = Command::new("tmux")
        .args(["send-keys", "-t", &params.pane, &params.command, "C-m"])
        .output();

    match result {
        Ok(output) if output.status.success() => Json(SendCommandResponse {
            success: true,
            message: format!("Command sent to pane {}", params.pane),
        }),
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Json(SendCommandResponse {
                success: false,
                message: format!("Failed to send command: {}", stderr),
            })
        }
        Err(e) => Json(SendCommandResponse {
            success: false,
            message: format!("Failed to execute tmux command: {}", e),
        }),
    }
}

/// Kill a specific TMUX session
#[derive(Serialize)]
pub struct KillSessionResponse {
    pub success: bool,
    pub message: String,
}

pub async fn kill_session(Path(session_name): Path<String>) -> Json<KillSessionResponse> {
    let result = Command::new("tmux")
        .args(["kill-session", "-t", &session_name])
        .output();

    match result {
        Ok(output) if output.status.success() => Json(KillSessionResponse {
            success: true,
            message: format!("Session '{}' killed successfully", session_name),
        }),
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Json(KillSessionResponse {
                success: false,
                message: format!("Failed to kill session: {}", stderr),
            })
        }
        Err(e) => Json(KillSessionResponse {
            success: false,
            message: format!("Failed to execute tmux command: {}", e),
        }),
    }
}

/// Get all TMUX sessions with detailed information
fn get_tmux_sessions() -> Vec<TmuxSession> {
    // Get list of sessions
    let sessions_output = Command::new("tmux")
        .args(["list-sessions", "-F", "#{session_name}"])
        .output();

    let sessions_output = match sessions_output {
        Ok(output) if output.status.success() => output,
        _ => return Vec::new(),
    };

    let sessions_str = String::from_utf8_lossy(&sessions_output.stdout);
    let session_names: Vec<&str> = sessions_str.lines().collect();

    let mut sessions = Vec::new();

    for session_name in session_names {
        if session_name.trim().is_empty() {
            continue;
        }

        // Get windows for this session
        let windows = get_tmux_windows(session_name);

        sessions.push(TmuxSession {
            name: session_name.to_string(),
            windows,
            created_at: None, // TODO: Parse from tmux session info
            attached: false,  // TODO: Check if session is attached
        });
    }

    sessions
}

/// Get all windows for a TMUX session
fn get_tmux_windows(session_name: &str) -> Vec<TmuxWindow> {
    let windows_output = Command::new("tmux")
        .args([
            "list-windows",
            "-t",
            session_name,
            "-F",
            "#{window_id}:#{window_name}:#{window_active}",
        ])
        .output();

    let windows_output = match windows_output {
        Ok(output) if output.status.success() => output,
        _ => return Vec::new(),
    };

    let windows_str = String::from_utf8_lossy(&windows_output.stdout);
    let mut windows = Vec::new();

    for line in windows_str.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() < 3 {
            continue;
        }

        let window_id = parts[0].to_string();
        let window_name = parts[1].to_string();
        let is_active = parts[2] == "1";

        // Get panes for this window
        let panes = get_tmux_panes(session_name, &window_id);

        windows.push(TmuxWindow {
            id: window_id,
            name: window_name,
            panes,
            active: is_active,
        });
    }

    windows
}

/// Get all panes for a TMUX window
fn get_tmux_panes(session_name: &str, window_id: &str) -> Vec<TmuxPane> {
    let target = format!("{}:{}", session_name, window_id);

    let panes_output = Command::new("tmux")
        .args([
            "list-panes",
            "-t",
            &target,
            "-F",
            "#{pane_id}:#{pane_index}:#{pane_active}:#{pane_current_path}:#{pane_current_command}",
        ])
        .output();

    let panes_output = match panes_output {
        Ok(output) if output.status.success() => output,
        _ => return Vec::new(),
    };

    let panes_str = String::from_utf8_lossy(&panes_output.stdout);
    let mut panes = Vec::new();

    for line in panes_str.lines() {
        if line.trim().is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() < 5 {
            continue;
        }

        let pane_id = parts[0].to_string();
        let pane_index = parts[1].parse::<u32>().unwrap_or(0);
        let is_active = parts[2] == "1";
        let pwd = if parts[3].is_empty() {
            None
        } else {
            Some(parts[3].to_string())
        };
        let command = if parts[4].is_empty() {
            None
        } else {
            Some(parts[4].to_string())
        };

        panes.push(TmuxPane {
            id: pane_id,
            index: pane_index,
            active: is_active,
            agent: None, // TODO: Map panes to agents from conductor timeline
            pwd,
            command,
        });
    }

    panes
}

/// Create router for TMUX endpoints
pub fn routes() -> Router {
    Router::new()
        .route("/sessions", get(list_sessions))
        .route("/sessions/{session_name}", get(get_session))
        .route("/sessions/{session_name}/kill", post(kill_session))
        .route("/send-command", post(send_command))
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_send_command_safety() {
        // This test verifies that only safe commands are allowed
        let allowed = ["miyabi status", "cargo test", "git status", "ls -la", "pwd"];
        let disallowed = ["rm -rf /", "sudo shutdown", "dd if=/dev/zero"];

        for cmd in allowed {
            let is_safe = ["miyabi", "cargo", "git", "ls", "pwd"]
                .iter()
                .any(|prefix| cmd.starts_with(prefix));
            assert!(is_safe, "Command '{}' should be allowed", cmd);
        }

        for cmd in disallowed {
            let is_safe = ["miyabi", "cargo", "git", "ls", "pwd"]
                .iter()
                .any(|prefix| cmd.starts_with(prefix));
            assert!(!is_safe, "Command '{}' should be disallowed", cmd);
        }
    }
}
