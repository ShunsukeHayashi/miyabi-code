use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::Response,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{debug, error, info};

/// WebSocket events that can be broadcasted to all connected clients
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WsEvent {
    /// Agent execution started (Issue #1175)
    #[serde(rename = "agent_started")]
    AgentStarted {
        agent_type: String,
        issue_number: i32,
        execution_id: String,
        timestamp: String,
    },
    /// Agent execution progress update (Issue #1175)
    #[serde(rename = "agent_progress")]
    AgentProgress {
        agent_type: String,
        progress: u8, // 0-100
        message: String,
        execution_id: String,
        timestamp: String,
    },
    /// Agent execution completed (Issue #1175)
    #[serde(rename = "agent_completed")]
    AgentCompleted {
        agent_type: String,
        execution_id: String,
        result: AgentResult,
        timestamp: String,
    },
    /// Task status updated (Issue #1175)
    #[serde(rename = "task_updated")]
    TaskUpdated {
        task_id: String,
        status: String,
        timestamp: String,
    },
    /// Agent status update (legacy)
    AgentStatus {
        agent_type: String,
        status: String,
        issue_number: Option<u32>,
        timestamp: String,
    },
    /// New log entry
    LogEntry {
        id: String,
        timestamp: String,
        level: String,
        agent_type: Option<String>,
        message: String,
        context: Option<String>,
        issue_number: Option<u32>,
        session_id: String,
        file: Option<String>,
        line: Option<u32>,
    },
    /// Issue status update
    IssueUpdate {
        number: u32,
        state: String,
        title: String,
        updated_at: String,
    },
    /// PR status update
    PrUpdate {
        number: u32,
        state: String,
        title: String,
        draft: bool,
        updated_at: String,
    },
    /// Deployment status update
    DeploymentUpdate {
        id: String,
        version: String,
        environment: String,
        status: String,
        health_check_status: String,
        updated_at: String,
    },
    /// Worktree status update
    WorktreeUpdate {
        id: String,
        status: String,
        branch: String,
        agent_type: Option<String>,
        updated_at: String,
    },
    /// System notification
    Notification {
        level: String,
        message: String,
        timestamp: String,
    },
}

/// Agent execution result (Issue #1175)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResult {
    pub success: bool,
    pub quality_score: Option<i32>,
    pub pr_number: Option<i32>,
    pub error: Option<String>,
}

/// WebSocket connection state
pub struct WsState {
    pub tx: broadcast::Sender<WsEvent>,
}

/// Type alias for compatibility
pub type WebSocketManager = WsState;

impl Default for WsState {
    fn default() -> Self {
        Self::new()
    }
}

impl WsState {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self { tx }
    }

    /// Broadcast an event to all connected clients
    pub fn broadcast(&self, event: WsEvent) {
        let _ = self.tx.send(event);
    }

    /// Broadcast agent started event (Issue #1175)
    pub fn broadcast_agent_started(
        &self,
        agent_type: impl Into<String>,
        issue_number: i32,
        execution_id: impl Into<String>,
    ) {
        self.broadcast(WsEvent::AgentStarted {
            agent_type: agent_type.into(),
            issue_number,
            execution_id: execution_id.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }

    /// Broadcast agent progress event (Issue #1175)
    pub fn broadcast_agent_progress(
        &self,
        agent_type: impl Into<String>,
        progress: u8,
        message: impl Into<String>,
        execution_id: impl Into<String>,
    ) {
        self.broadcast(WsEvent::AgentProgress {
            agent_type: agent_type.into(),
            progress: progress.min(100), // Clamp to 100
            message: message.into(),
            execution_id: execution_id.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }

    /// Broadcast agent completed event (Issue #1175)
    pub fn broadcast_agent_completed(
        &self,
        agent_type: impl Into<String>,
        execution_id: impl Into<String>,
        result: AgentResult,
    ) {
        self.broadcast(WsEvent::AgentCompleted {
            agent_type: agent_type.into(),
            execution_id: execution_id.into(),
            result,
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }

    /// Broadcast task updated event (Issue #1175)
    pub fn broadcast_task_updated(
        &self,
        task_id: impl Into<String>,
        status: impl Into<String>,
    ) {
        self.broadcast(WsEvent::TaskUpdated {
            task_id: task_id.into(),
            status: status.into(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        });
    }

    /// Handle a WebSocket connection
    pub async fn handle_connection(self: Arc<Self>, socket: WebSocket, _user_id: String) {
        handle_socket(socket, self).await;
    }
}

/// WebSocket upgrade handler
pub async fn ws_handler(ws: WebSocketUpgrade, state: Arc<WsState>) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

/// Handle individual WebSocket connection
async fn handle_socket(socket: WebSocket, state: Arc<WsState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.tx.subscribe();

    info!("WebSocket client connected");

    // Send initial connection confirmation
    let welcome = WsEvent::Notification {
        level: "info".to_string(),
        message: "Connected to Miyabi WebSocket".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    };

    if let Ok(json) = serde_json::to_string(&welcome) {
        let _ = sender.send(Message::Text(json.into())).await;
    }

    // Spawn a task to send broadcasts to this client
    let mut send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&event) {
                if sender.send(Message::Text(json.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Handle incoming messages from client (e.g., ping/pong)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                Message::Ping(_data) => {
                    // Echo back pong
                    info!("Received ping");
                }
                Message::Pong(_) => {
                    info!("Received pong");
                }
                Message::Text(text) => {
                    info!("Received text message: {}", text);
                }
                _ => {}
            }
        }
    });

    // Wait for either task to finish
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    info!("WebSocket client disconnected");
}

/// Get agent status from tmux panes
/// Returns a list of agents with their current status
fn get_agent_status_from_tmux() -> Vec<(String, String)> {
    // Try to get panes from miyabi-orchestra session
    let output = Command::new("tmux")
        .args([
            "list-panes",
            "-t",
            "miyabi-orchestra",
            "-F",
            "#{pane_id}:#{pane_current_command}:#{pane_title}",
        ])
        .output();

    let output = match output {
        Ok(output) if output.status.success() => output,
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            debug!("tmux list-panes failed: {}", stderr);
            return Vec::new();
        }
        Err(e) => {
            error!("Failed to execute tmux command: {}", e);
            return Vec::new();
        }
    };

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut agents = Vec::new();

    // Known agent pane mapping (based on miyabi-orchestra setup)
    let agent_names = [
        "Coordinator",
        "CodeGen",
        "Review",
        "PR",
        "Deployment",
        "Issue",
        "Refresher",
    ];

    for (idx, line) in output_str.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() < 2 {
            continue;
        }

        let _pane_id = parts[0];
        let command = parts[1];

        // Determine agent name and status
        let agent_name = if idx < agent_names.len() {
            format!("{}Agent", agent_names[idx])
        } else {
            format!("Agent{}", idx)
        };

        // Determine status based on command
        let status = if command.contains("claude") {
            "Running"
        } else if command.contains("bash") || command.contains("zsh") {
            "Idle"
        } else {
            "Unknown"
        };

        agents.push((agent_name, status.to_string()));
    }

    agents
}

/// Helper function to start a background task that broadcasts real agent status
pub fn start_agent_monitor(state: Arc<WsState>) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(1));

        loop {
            interval.tick().await;

            // Get agent status from tmux
            let agents = get_agent_status_from_tmux();

            if agents.is_empty() {
                debug!("No agents found in tmux session");
                continue;
            }

            // Broadcast status for each agent
            for (agent_type, status) in agents {
                state.broadcast(WsEvent::AgentStatus {
                    agent_type,
                    status,
                    issue_number: None,
                    timestamp: chrono::Utc::now().to_rfc3339(),
                });
            }
        }
    });
}

/// Helper function to start a background task that simulates real-time events
/// This is kept for backward compatibility and testing
pub fn start_event_simulator(state: Arc<WsState>) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
        let agent_types = [
            "CoordinatorAgent",
            "CodeGenAgent",
            "ReviewAgent",
            "PRAgent",
            "DeploymentAgent",
        ];
        let log_levels = ["INFO", "DEBUG", "WARN", "ERROR"];
        let mut counter = 0;

        loop {
            interval.tick().await;
            counter += 1;

            // Simulate agent status update every 5 seconds
            if counter % 2 == 0 {
                let agent_type = agent_types[counter % agent_types.len()].to_string();
                let status = if counter % 3 == 0 { "Running" } else { "Idle" };

                state.broadcast(WsEvent::AgentStatus {
                    agent_type: agent_type.clone(),
                    status: status.to_string(),
                    issue_number: Some(270 + (counter % 5) as u32),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                });
            }

            // Simulate log entry every 5 seconds
            {
                let level = log_levels[counter % log_levels.len()];
                let agent_type = agent_types[counter % agent_types.len()];

                state.broadcast(WsEvent::LogEntry {
                    id: format!("log-{}", counter),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    level: level.to_string(),
                    agent_type: Some(agent_type.to_string()),
                    message: format!("[{}] Processing task #{}", agent_type, counter),
                    context: Some(format!("Simulated event {}", counter)),
                    issue_number: Some(270 + (counter % 5) as u32),
                    session_id: "ws-session-001".to_string(),
                    file: Some(format!("agent/{}.rs", agent_type.to_lowercase())),
                    line: Some(42 + counter as u32),
                });
            }

            // Simulate notification every 15 seconds
            if counter % 3 == 0 {
                state.broadcast(WsEvent::Notification {
                    level: "info".to_string(),
                    message: format!("System update: {} agents active", counter % 5),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                });
            }
        }
    });
}
