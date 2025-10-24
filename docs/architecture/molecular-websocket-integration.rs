// ============================================================================
// MIYABI MOLECULAR VISUALIZATION - WEBSOCKET REAL-TIME INTEGRATION
// ============================================================================
// Complete Rust backend implementation for streaming molecular events
// from agent execution to frontend visualization
// ============================================================================

use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query, State,
    },
    response::Response,
};
use chrono::{DateTime, Utc};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;

// ============================================================================
// Event Types (matching MIYABI_MOLECULAR_VISUALIZATION_SPEC.md)
// ============================================================================

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MolecularEvent {
    /// New atom added to structure (rare: new crate created)
    AtomAdd {
        timestamp: DateTime<Utc>,
        atom_id: u32,
        name: String,
        chain: String,  // A, B, C, D
        position: (f64, f64, f64),
        bfactor: f64,
        occupancy: f64,
        loc: usize,
    },

    /// Atom modified (common: crate updated, commits added)
    AtomModify {
        timestamp: DateTime<Utc>,
        atom_id: u32,
        bfactor: f64,
        occupancy: f64,
        color: u32,  // RGB hex
    },

    /// Agent execution started/progress/completed
    AgentExecution {
        timestamp: DateTime<Utc>,
        agent_name: String,
        agent_type: String,  // coordinator, codegen, review, etc.
        target_crate: String,
        phase: ExecutionPhase,
        progress: f64,  // 0.0 - 1.0
        execution_id: Uuid,
    },

    /// Trajectory frame (git history playback)
    TrajectoryFrame {
        timestamp: DateTime<Utc>,
        frame_number: u32,
        commit_sha: String,
        commit_message: String,
        files_changed: Vec<FileChange>,
    },

    /// Dependency bond added/removed
    BondModify {
        timestamp: DateTime<Utc>,
        atom_id_1: u32,
        atom_id_2: u32,
        action: BondAction,
    },

    /// Structural analysis result
    AnalysisResult {
        timestamp: DateTime<Utc>,
        analysis_type: AnalysisType,
        result: serde_json::Value,
    },

    /// System-wide metrics update
    MetricsUpdate {
        timestamp: DateTime<Utc>,
        total_loc: usize,
        total_commits: usize,
        active_agents: u32,
        compilation_time_ms: u64,
    },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionPhase {
    Started,
    InProgress,
    Completed,
    Failed,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileChange {
    pub path: String,
    pub additions: usize,
    pub deletions: usize,
    pub change_type: ChangeType,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    Added,
    Modified,
    Deleted,
    Renamed,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BondAction {
    Add,
    Remove,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AnalysisType {
    CircularDependency,
    CriticalPath,
    RefactoringOpportunity,
    Rmsd,
    ContactMap,
}

// ============================================================================
// Molecular Event Broadcaster
// ============================================================================

pub struct MolecularEventBroadcaster {
    tx: broadcast::Sender<MolecularEvent>,
    atom_cache: Arc<RwLock<HashMap<u32, AtomState>>>,
}

#[derive(Clone, Debug)]
struct AtomState {
    name: String,
    chain: String,
    bfactor: f64,
    occupancy: f64,
    last_updated: DateTime<Utc>,
}

impl MolecularEventBroadcaster {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(1000);

        Self {
            tx,
            atom_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Emit event to all subscribed WebSocket clients
    pub async fn emit(&self, event: MolecularEvent) {
        // Update atom cache if needed
        if let MolecularEvent::AtomModify { atom_id, bfactor, occupancy, .. } = &event {
            let mut cache = self.atom_cache.write().await;
            if let Some(atom) = cache.get_mut(atom_id) {
                atom.bfactor = *bfactor;
                atom.occupancy = *occupancy;
                atom.last_updated = Utc::now();
            }
        }

        // Broadcast to all subscribers (errors ignored if no subscribers)
        let _ = self.tx.send(event);
    }

    /// Subscribe to events (returns broadcast receiver)
    pub fn subscribe(&self) -> broadcast::Receiver<MolecularEvent> {
        self.tx.subscribe()
    }

    /// Get current atom state (for initial load)
    pub async fn get_atom_state(&self, atom_id: u32) -> Option<AtomState> {
        self.atom_cache.read().await.get(&atom_id).cloned()
    }
}

// ============================================================================
// Agent Execution Hooks
// ============================================================================
// These functions should be called from agent implementations

/// Hook: Call when agent starts execution
pub async fn on_agent_started(
    broadcaster: &MolecularEventBroadcaster,
    agent_name: &str,
    agent_type: &str,
    target_crate: &str,
    execution_id: Uuid,
) {
    broadcaster
        .emit(MolecularEvent::AgentExecution {
            timestamp: Utc::now(),
            agent_name: agent_name.to_string(),
            agent_type: agent_type.to_string(),
            target_crate: target_crate.to_string(),
            phase: ExecutionPhase::Started,
            progress: 0.0,
            execution_id,
        })
        .await;
}

/// Hook: Call during agent execution with progress updates
pub async fn on_agent_progress(
    broadcaster: &MolecularEventBroadcaster,
    agent_name: &str,
    agent_type: &str,
    target_crate: &str,
    execution_id: Uuid,
    progress: f64,
) {
    broadcaster
        .emit(MolecularEvent::AgentExecution {
            timestamp: Utc::now(),
            agent_name: agent_name.to_string(),
            agent_type: agent_type.to_string(),
            target_crate: target_crate.to_string(),
            phase: ExecutionPhase::InProgress,
            progress,
            execution_id,
        })
        .await;
}

/// Hook: Call when agent completes execution
pub async fn on_agent_completed(
    broadcaster: &MolecularEventBroadcaster,
    agent_name: &str,
    agent_type: &str,
    target_crate: &str,
    execution_id: Uuid,
) {
    broadcaster
        .emit(MolecularEvent::AgentExecution {
            timestamp: Utc::now(),
            agent_name: agent_name.to_string(),
            agent_type: agent_type.to_string(),
            target_crate: target_crate.to_string(),
            phase: ExecutionPhase::Completed,
            progress: 1.0,
            execution_id,
        })
        .await;

    // Update B-factor for target crate (increased activity)
    if let Some(atom_id) = crate_name_to_atom_id(target_crate) {
        // Calculate new B-factor based on recent commits
        let new_bfactor = calculate_bfactor_for_crate(target_crate).await;

        broadcaster
            .emit(MolecularEvent::AtomModify {
                timestamp: Utc::now(),
                atom_id,
                bfactor: new_bfactor,
                occupancy: 0.98,  // Placeholder
                color: bfactor_to_color(new_bfactor),
            })
            .await;
    }
}

/// Hook: Call when files are modified (from git operations)
pub async fn on_files_changed(
    broadcaster: &MolecularEventBroadcaster,
    commit_sha: &str,
    commit_message: &str,
    files: Vec<FileChange>,
) {
    // Emit trajectory frame
    broadcaster
        .emit(MolecularEvent::TrajectoryFrame {
            timestamp: Utc::now(),
            frame_number: 0,  // TODO: Calculate from git history
            commit_sha: commit_sha.to_string(),
            commit_message: commit_message.to_string(),
            files_changed: files.clone(),
        })
        .await;

    // Update B-factors for affected crates
    let affected_crates = extract_affected_crates(&files);
    for crate_name in affected_crates {
        if let Some(atom_id) = crate_name_to_atom_id(&crate_name) {
            let new_bfactor = calculate_bfactor_for_crate(&crate_name).await;

            broadcaster
                .emit(MolecularEvent::AtomModify {
                    timestamp: Utc::now(),
                    atom_id,
                    bfactor: new_bfactor,
                    occupancy: 0.98,
                    color: bfactor_to_color(new_bfactor),
                })
                .await;
        }
    }
}

// ============================================================================
// WebSocket Handler (integrate with existing websocket.rs)
// ============================================================================

pub async fn handle_molecular_events(
    socket: WebSocket,
    broadcaster: Arc<MolecularEventBroadcaster>,
) {
    let (mut sender, mut receiver) = socket.split();

    // Subscribe to events
    let mut event_rx = broadcaster.subscribe();

    // Send initial state (all atoms)
    // TODO: Load from database or MIYB file
    let initial_state = serde_json::json!({
        "type": "initial_state",
        "atoms": [],  // Load from structure
        "timestamp": Utc::now()
    });
    let _ = sender
        .send(Message::Text(initial_state.to_string()))
        .await;

    // Spawn task to forward events to WebSocket
    let forward_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                Ok(event) = event_rx.recv() => {
                    let event_json = match serde_json::to_string(&event) {
                        Ok(json) => json,
                        Err(e) => {
                            tracing::error!("Failed to serialize molecular event: {}", e);
                            continue;
                        }
                    };

                    if sender.send(Message::Text(event_json)).await.is_err() {
                        tracing::info!("Molecular WebSocket connection closed");
                        break;
                    }
                }
            }
        }
    });

    // Handle incoming messages
    let receive_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => {
                    tracing::info!("Molecular WebSocket close received");
                    break;
                }
                Message::Text(text) => {
                    // Handle client commands (e.g., request analysis)
                    if let Ok(command) = serde_json::from_str::<ClientCommand>(&text) {
                        tracing::info!("Received command: {:?}", command);
                        // TODO: Handle commands
                    }
                }
                _ => {}
            }
        }
    });

    // Wait for either task to complete
    tokio::select! {
        _ = forward_task => {}
        _ = receive_task => {}
    }
}

#[derive(Debug, Deserialize)]
#[serde(tag = "command", rename_all = "snake_case")]
enum ClientCommand {
    RequestAnalysis { analysis_type: AnalysisType },
    PlayTrajectory { start_commit: String, end_commit: String },
    HighlightAtom { atom_id: u32 },
    ChangeRepresentation { mode: String },
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Map crate name to atom ID
/// Should be loaded from MIYB structure file in production
fn crate_name_to_atom_id(crate_name: &str) -> Option<u32> {
    // Hardcoded mapping for Miyabi workspace (26 crates)
    let mapping: HashMap<&str, u32> = [
        // Chain A - Core (7 crates)
        ("miyabi-core", 1),
        ("miyabi-types", 2),
        ("miyabi-llm", 3),
        ("miyabi-config", 4),
        ("miyabi-logger", 5),
        ("miyabi-error", 6),
        ("miyabi-utils", 7),
        // Chain B - Agents (8 crates)
        ("miyabi-agents", 11),
        ("miyabi-agent-coordinator", 12),
        ("miyabi-agent-codegen", 13),
        ("miyabi-agent-review", 14),
        ("miyabi-agent-issue", 15),
        ("miyabi-agent-pr", 16),
        ("miyabi-agent-deployment", 17),
        ("miyabi-agent-refresher", 18),
        // Chain C - Infrastructure (6 crates)
        ("miyabi-github", 21),
        ("miyabi-worktree", 22),
        ("miyabi-mcp-server", 23),
        ("miyabi-web-api", 24),
        ("miyabi-knowledge", 25),
        ("miyabi-db", 26),
        // Chain D - Tools (3 crates)
        ("miyabi-cli", 31),
        ("miyabi-benchmark", 32),
        ("miyabi-testing", 33),
    ]
    .iter()
    .cloned()
    .collect();

    mapping.get(crate_name).copied()
}

/// Calculate B-factor (commit frequency) for a crate
/// Based on git log analysis (last 90 days)
async fn calculate_bfactor_for_crate(crate_name: &str) -> f64 {
    use std::process::Command;

    let crate_path = format!("crates/{}", crate_name);

    let output = Command::new("git")
        .args(&[
            "log",
            "--since=90.days.ago",
            "--oneline",
            "--",
            &crate_path,
        ])
        .output();

    match output {
        Ok(output) => {
            let commit_count = String::from_utf8_lossy(&output.stdout)
                .lines()
                .count();

            // Normalize to 0-100 scale
            (commit_count as f64).min(100.0)
        }
        Err(e) => {
            tracing::error!("Failed to calculate B-factor for {}: {}", crate_name, e);
            50.0 // Default
        }
    }
}

/// Convert B-factor to RGB color (heatmap)
fn bfactor_to_color(bfactor: f64) -> u32 {
    let normalized = (bfactor / 100.0).clamp(0.0, 1.0);

    // Blue (low) -> Cyan -> Green -> Yellow -> Red (high)
    let (r, g, b) = if normalized < 0.25 {
        let t = normalized * 4.0;
        (0, (t * 255.0) as u8, 255)
    } else if normalized < 0.5 {
        let t = (normalized - 0.25) * 4.0;
        (0, 255, (255.0 * (1.0 - t)) as u8)
    } else if normalized < 0.75 {
        let t = (normalized - 0.5) * 4.0;
        ((t * 255.0) as u8, 255, 0)
    } else {
        let t = (normalized - 0.75) * 4.0;
        (255, (255.0 * (1.0 - t)) as u8, 0)
    };

    ((r as u32) << 16) | ((g as u32) << 8) | (b as u32)
}

/// Extract affected crates from file changes
fn extract_affected_crates(files: &[FileChange]) -> Vec<String> {
    files
        .iter()
        .filter_map(|file| {
            // Extract crate name from path like "crates/miyabi-agents/src/..."
            if file.path.starts_with("crates/") {
                file.path
                    .split('/')
                    .nth(1)
                    .map(|s| s.to_string())
            } else {
                None
            }
        })
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect()
}

// ============================================================================
// Integration with Existing Agent Implementations
// ============================================================================
// Example: CoordinatorAgent with molecular event emission

/*
// In crates/miyabi-agents/src/coordinator.rs

use miyabi_web_api::molecular_websocket_integration::{
    on_agent_started, on_agent_progress, on_agent_completed
};

impl CoordinatorAgent {
    pub async fn execute(
        &self,
        issue: &Issue,
        broadcaster: &MolecularEventBroadcaster,
    ) -> Result<AgentOutput> {
        let execution_id = Uuid::new_v4();

        // Emit start event
        on_agent_started(
            broadcaster,
            "Coordinator",
            "coordinator",
            "miyabi-agents",
            execution_id,
        )
        .await;

        // Phase 1: Analyze issue (0-30%)
        on_agent_progress(broadcaster, "Coordinator", "coordinator", "miyabi-agents", execution_id, 0.0).await;
        let analysis = self.analyze_issue(issue).await?;
        on_agent_progress(broadcaster, "Coordinator", "coordinator", "miyabi-agents", execution_id, 0.3).await;

        // Phase 2: Create DAG (30-60%)
        let dag = self.create_task_dag(&analysis).await?;
        on_agent_progress(broadcaster, "Coordinator", "coordinator", "miyabi-agents", execution_id, 0.6).await;

        // Phase 3: Execute tasks (60-100%)
        let results = self.execute_tasks(&dag).await?;
        on_agent_progress(broadcaster, "Coordinator", "coordinator", "miyabi-agents", execution_id, 1.0).await;

        // Emit completion event
        on_agent_completed(
            broadcaster,
            "Coordinator",
            "coordinator",
            "miyabi-agents",
            execution_id,
        )
        .await;

        Ok(AgentOutput {
            execution_id,
            results,
        })
    }
}
*/

// ============================================================================
// Performance Monitoring
// ============================================================================

pub struct MolecularMetricsCollector {
    broadcaster: Arc<MolecularEventBroadcaster>,
}

impl MolecularMetricsCollector {
    pub fn new(broadcaster: Arc<MolecularEventBroadcaster>) -> Self {
        Self { broadcaster }
    }

    /// Start periodic metrics collection (every 5 seconds)
    pub fn start(&self) {
        let broadcaster = self.broadcaster.clone();

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));

            loop {
                interval.tick().await;

                // Collect metrics
                let metrics = Self::collect_metrics().await;

                broadcaster
                    .emit(MolecularEvent::MetricsUpdate {
                        timestamp: Utc::now(),
                        total_loc: metrics.total_loc,
                        total_commits: metrics.total_commits,
                        active_agents: metrics.active_agents,
                        compilation_time_ms: metrics.compilation_time_ms,
                    })
                    .await;
            }
        });
    }

    async fn collect_metrics() -> Metrics {
        // TODO: Implement actual metrics collection
        Metrics {
            total_loc: 100_000,
            total_commits: 500,
            active_agents: 2,
            compilation_time_ms: 45_000,
        }
    }
}

struct Metrics {
    total_loc: usize,
    total_commits: usize,
    active_agents: u32,
    compilation_time_ms: u64,
}

// ============================================================================
// Testing Utilities
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_molecular_event_broadcast() {
        let broadcaster = MolecularEventBroadcaster::new();
        let mut rx = broadcaster.subscribe();

        // Emit event
        broadcaster
            .emit(MolecularEvent::AtomModify {
                timestamp: Utc::now(),
                atom_id: 1,
                bfactor: 55.5,
                occupancy: 0.98,
                color: 0xFF8800,
            })
            .await;

        // Receive event
        let event = rx.recv().await.unwrap();
        match event {
            MolecularEvent::AtomModify { atom_id, bfactor, .. } => {
                assert_eq!(atom_id, 1);
                assert!((bfactor - 55.5).abs() < 0.01);
            }
            _ => panic!("Unexpected event type"),
        }
    }

    #[test]
    fn test_bfactor_to_color() {
        // Low B-factor = Blue
        let color = bfactor_to_color(10.0);
        assert_eq!(color, 0x0066FF);

        // High B-factor = Red
        let color = bfactor_to_color(90.0);
        assert_eq!(color, 0xFF3300);
    }

    #[test]
    fn test_crate_name_to_atom_id() {
        assert_eq!(crate_name_to_atom_id("miyabi-agents"), Some(11));
        assert_eq!(crate_name_to_atom_id("miyabi-core"), Some(1));
        assert_eq!(crate_name_to_atom_id("nonexistent"), None);
    }

    #[test]
    fn test_extract_affected_crates() {
        let files = vec![
            FileChange {
                path: "crates/miyabi-agents/src/coordinator.rs".to_string(),
                additions: 10,
                deletions: 5,
                change_type: ChangeType::Modified,
            },
            FileChange {
                path: "crates/miyabi-core/src/lib.rs".to_string(),
                additions: 2,
                deletions: 0,
                change_type: ChangeType::Modified,
            },
        ];

        let crates = extract_affected_crates(&files);
        assert!(crates.contains(&"miyabi-agents".to_string()));
        assert!(crates.contains(&"miyabi-core".to_string()));
        assert_eq!(crates.len(), 2);
    }
}

// ============================================================================
// END OF MOLECULAR WEBSOCKET INTEGRATION
// ============================================================================
