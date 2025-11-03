//! Agent State Management Module
//!
//! Provides real-time Agent state tracking and control via JSON state files
//! Integrates with Claude Code SessionStart/SessionEnd hooks

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Agent execution status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum AgentStatus {
    /// Agent is currently running and working on a task
    Running,
    /// Agent is idle and waiting for task assignment
    Idle,
    /// Agent has started a new session
    Started,
    /// Agent session has ended
    Stopped,
    /// Agent encountered an error
    Error,
    /// Agent was automatically restarted
    AutoRestarted,
}

/// Individual Agent state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentState {
    /// Current status
    pub status: AgentStatus,
    /// Last update timestamp
    pub timestamp: DateTime<Utc>,
    /// tmux pane ID
    pub pane: String,
    /// Window index
    pub window: String,
    /// Pane index within window
    pub pane_index: String,
    /// Total number of sessions started
    pub session_count: u32,
    /// Current Issue number being worked on (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_issue: Option<u64>,
    /// Last completed task description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_task: Option<String>,
}

/// Root state structure (matches agent-states.json)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentStatesRoot {
    pub version: String,
    pub last_updated: String,
    pub agents: HashMap<String, AgentState>,
}

/// Load agent states from JSON file
pub fn load_agent_states(state_file_path: &Path) -> Result<AgentStatesRoot, String> {
    if !state_file_path.exists() {
        return Ok(AgentStatesRoot {
            version: "1.0.0".to_string(),
            last_updated: Utc::now().to_rfc3339(),
            agents: HashMap::new(),
        });
    }

    let contents = fs::read_to_string(state_file_path)
        .map_err(|e| format!("Failed to read state file: {}", e))?;

    serde_json::from_str(&contents).map_err(|e| format!("Failed to parse state file: {}", e))
}

/// Save agent states to JSON file
pub fn save_agent_states(state_file_path: &Path, states: &AgentStatesRoot) -> Result<(), String> {
    let json = serde_json::to_string_pretty(states)
        .map_err(|e| format!("Failed to serialize states: {}", e))?;

    if let Some(parent) = state_file_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create state directory: {}", e))?;
    }

    fs::write(state_file_path, json).map_err(|e| format!("Failed to write state file: {}", e))
}

/// Tauri command: Get all agent states
#[tauri::command]
pub async fn get_agent_states(state_file_path: String) -> Result<AgentStatesRoot, String> {
    load_agent_states(Path::new(&state_file_path))
}

/// Tauri command: Get specific agent state
#[tauri::command]
pub async fn get_agent_state(
    state_file_path: String,
    agent_name: String,
) -> Result<Option<AgentState>, String> {
    let states = load_agent_states(Path::new(&state_file_path))?;
    Ok(states.agents.get(&agent_name).cloned())
}

/// Tauri command: Update agent state (manual override)
#[tauri::command]
pub async fn update_agent_state(
    state_file_path: String,
    agent_name: String,
    status: AgentStatus,
) -> Result<(), String> {
    let state_path = Path::new(&state_file_path);
    let mut states = load_agent_states(state_path)?;

    if let Some(agent_state) = states.agents.get_mut(&agent_name) {
        agent_state.status = status;
        agent_state.timestamp = Utc::now();
    } else {
        return Err(format!("Agent '{}' not found in state", agent_name));
    }

    states.last_updated = Utc::now().to_rfc3339();
    save_agent_states(state_path, &states)
}

/// Tauri command: Trigger agent restart
#[tauri::command]
pub async fn trigger_agent_restart(
    state_file_path: String,
    agent_name: String,
    pane_id: String,
) -> Result<String, String> {
    // This will call tmux send-keys to restart Claude Code in the pane
    let restart_script = format!(
        r#"tmux send-keys -t {} "cd '/Users/shunsuke/Dev/miyabi-private' && claude" && sleep 0.5 && tmux send-keys -t {} Enter"#,
        pane_id, pane_id
    );

    // Execute via shell
    let output = std::process::Command::new("sh")
        .arg("-c")
        .arg(&restart_script)
        .output()
        .map_err(|e| format!("Failed to execute restart command: {}", e))?;

    if output.status.success() {
        // Update state
        update_agent_state(
            state_file_path,
            agent_name.clone(),
            AgentStatus::AutoRestarted,
        )
        .await?;
        Ok(format!("Agent '{}' restarted successfully", agent_name))
    } else {
        Err(format!(
            "Failed to restart agent '{}': {}",
            agent_name,
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

/// Tauri command: Assign task to agent
#[tauri::command]
pub async fn assign_task_to_agent(
    pane_id: String,
    agent_name: String,
    issue_number: u64,
    task_description: String,
) -> Result<String, String> {
    let task_message = format!(
        "あなたは「{}」です。Issue #{}「{}」に取り組んでください。詳細を確認して実装を開始してください。",
        agent_name, issue_number, task_description
    );

    let send_command = format!(
        r#"tmux send-keys -t {} "{}" && sleep 0.5 && tmux send-keys -t {} Enter"#,
        pane_id, task_message, pane_id
    );

    let output = std::process::Command::new("sh")
        .arg("-c")
        .arg(&send_command)
        .output()
        .map_err(|e| format!("Failed to send task to agent: {}", e))?;

    if output.status.success() {
        Ok(format!(
            "Task assigned to '{}': Issue #{}",
            agent_name, issue_number
        ))
    } else {
        Err(format!(
            "Failed to assign task: {}",
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

/// Tauri command: Stop agent (send Ctrl+C)
#[tauri::command]
pub async fn stop_agent(
    state_file_path: String,
    agent_name: String,
    pane_id: String,
) -> Result<String, String> {
    // Send Ctrl+C twice (as per Agent Reset Procedure)
    let stop_command = format!(
        r#"tmux send-keys -t {} C-c && sleep 0.2 && tmux send-keys -t {} C-c"#,
        pane_id, pane_id
    );

    let output = std::process::Command::new("sh")
        .arg("-c")
        .arg(&stop_command)
        .output()
        .map_err(|e| format!("Failed to stop agent: {}", e))?;

    if output.status.success() {
        // Update state
        update_agent_state(state_file_path, agent_name.clone(), AgentStatus::Stopped).await?;
        Ok(format!("Agent '{}' stopped successfully", agent_name))
    } else {
        Err(format!(
            "Failed to stop agent '{}': {}",
            agent_name,
            String::from_utf8_lossy(&output.stderr)
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_load_and_save_agent_states() {
        let temp_dir = TempDir::new().unwrap();
        let state_file = temp_dir.path().join("agent-states.json");

        // Create initial states
        let mut states = AgentStatesRoot {
            version: "1.0.0".to_string(),
            last_updated: Utc::now().to_rfc3339(),
            agents: HashMap::new(),
        };

        states.agents.insert(
            "TestAgent".to_string(),
            AgentState {
                status: AgentStatus::Running,
                timestamp: Utc::now(),
                pane: "%1".to_string(),
                window: "1".to_string(),
                pane_index: "1".to_string(),
                session_count: 1,
                current_issue: Some(100),
                last_task: Some("Test task".to_string()),
            },
        );

        // Save
        save_agent_states(&state_file, &states).unwrap();

        // Load
        let loaded_states = load_agent_states(&state_file).unwrap();
        assert_eq!(loaded_states.agents.len(), 1);
        assert_eq!(
            loaded_states.agents.get("TestAgent").unwrap().status,
            AgentStatus::Running
        );
    }
}
