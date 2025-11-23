//! Timeline endpoint - Execution timeline from conductor logs

use axum::{extract::Query, http::StatusCode, routing::get, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::env;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use tokio::fs::OpenOptions;
use tokio::io::AsyncWriteExt;

/// Query parameters for timeline endpoint
#[derive(Deserialize)]
pub struct TimelineQuery {
    /// Number of recent events to return (default: 100)
    #[serde(default = "default_window")]
    pub window: usize,
}

fn default_window() -> usize {
    100
}

/// Timeline event from JSONL log
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimelineEvent {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub state: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task: Option<String>,
}

/// Summary statistics for timeline
#[derive(Serialize, Debug)]
pub struct TimelineSummary {
    pub total_events: usize,
    pub run_count: usize,
    pub idle_count: usize,
    pub dead_count: usize,
}

/// Timeline response
#[derive(Serialize)]
pub struct TimelineResponse {
    pub summary: TimelineSummary,
    pub recent_events: Vec<TimelineEvent>,
    pub window_size: usize,
}

/// Agent snapshot included in timeline push payload
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimelineAgentSnapshot {
    pub pane_id: String,
    pub pane_title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_type: Option<String>,
    pub state: String,
    pub current_command: String,
    pub pid: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_activity: Option<String>,
}

/// Timeline event structure accepted from CLI payloads
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimelinePushEvent {
    pub timestamp: String,
    pub event_type: String,
    pub agent_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue_number: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_id: Option<String>,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

/// Completed task structure within timeline payload
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimelineCompletedTask {
    pub issue: i64,
    pub agent: String,
    pub title: String,
}

/// Mission Control conductor status payload
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimelineConductorStatus {
    pub conductor_name: String,
    pub last_cycle: i64,
    pub last_activity: String,
    pub mode: String,
}

/// Timeline push request from Mission Control CLI
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimelinePushRequest {
    pub generated_at: String,
    pub session_name: String,
    pub agent_states: TimelinePushAgentStates,
    pub recent_events: Vec<TimelinePushEvent>,
    pub recent_completions: Vec<TimelineCompletedTask>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conductor_status: Option<TimelineConductorStatus>,
    #[serde(default)]
    pub persisted_locally: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

/// Agent state summary inside push payload
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TimelinePushAgentStates {
    pub total: i64,
    pub run: i64,
    pub idle: i64,
    pub dead: i64,
    pub agents: Vec<TimelineAgentSnapshot>,
}

/// Response returned when ingesting timeline payloads
#[derive(Serialize, Deserialize, Debug)]
pub struct TimelineIngestResponse {
    pub status: &'static str,
    pub stored: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

fn timeline_candidate_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(env_path) = env::var("MISSION_CONTROL_TIMELINE_PATH") {
        if !env_path.is_empty() {
            paths.push(PathBuf::from(env_path));
        }
    }

    paths.push(PathBuf::from(".ai/logs/conductor_timeline.jsonl"));
    paths.push(PathBuf::from(
        "/Users/shunsuke/Dev/miyabi-private/.ai/logs/conductor_timeline.jsonl",
    ));
    paths.push(PathBuf::from("../.ai/logs/conductor_timeline.jsonl"));
    paths.push(PathBuf::from("../../.ai/logs/conductor_timeline.jsonl"));

    paths
}

/// Get execution timeline from conductor logs
pub async fn get_timeline(Query(params): Query<TimelineQuery>) -> Json<TimelineResponse> {
    let window = params.window;

    // Try to find the timeline file in multiple locations
    let mut events = Vec::new();

    // Try each path until we find one that exists
    for path in timeline_candidate_paths() {
        if Path::new(&path).exists() {
            if let Some(path_str) = path.to_str() {
                events = read_timeline_file(path_str);
            }
            break;
        }
    }

    // Calculate summary statistics
    let summary = calculate_summary(&events);

    // Get the most recent N events (window size)
    let recent_events: Vec<TimelineEvent> = events.into_iter().rev().take(window).collect();

    Json(TimelineResponse {
        summary,
        recent_events,
        window_size: window,
    })
}

/// Read and parse JSONL timeline file
fn read_timeline_file(path: &str) -> Vec<TimelineEvent> {
    let file = match File::open(path) {
        Ok(f) => f,
        Err(e) => {
            tracing::warn!("Failed to open timeline file {}: {}", path, e);
            return Vec::new();
        },
    };

    let reader = BufReader::new(file);
    let mut events = Vec::new();

    for line in reader.lines() {
        match line {
            Ok(line_content) => {
                if line_content.trim().is_empty() {
                    continue;
                }
                match serde_json::from_str::<TimelineEvent>(&line_content) {
                    Ok(event) => events.push(event),
                    Err(e) => {
                        tracing::warn!(
                            "Failed to parse timeline event: {} - line: {}",
                            e,
                            line_content
                        );
                    },
                }
            },
            Err(e) => {
                tracing::warn!("Failed to read line from timeline file: {}", e);
            },
        }
    }

    events
}

/// Calculate summary statistics from events
fn calculate_summary(events: &[TimelineEvent]) -> TimelineSummary {
    let total_events = events.len();
    let mut run_count = 0;
    let mut idle_count = 0;
    let mut dead_count = 0;

    for event in events {
        if let Some(state) = &event.state {
            let state_upper = state.to_uppercase();
            match state_upper.as_str() {
                "RUN" | "RUNNING" => run_count += 1,
                "IDLE" => idle_count += 1,
                "DEAD" => dead_count += 1,
                _ => {},
            }
        }
    }

    TimelineSummary {
        total_events,
        run_count,
        idle_count,
        dead_count,
    }
}

async fn append_timeline_payload(payload: &TimelinePushRequest) -> Result<PathBuf, std::io::Error> {
    for path in timeline_candidate_paths() {
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                if let Err(err) = tokio::fs::create_dir_all(parent).await {
                    tracing::warn!("Failed to create directory {}: {}", parent.display(), err);
                    continue;
                }
            }
        }

        let json = serde_json::to_string(payload)
            .map_err(std::io::Error::other)?;

        let mut file = OpenOptions::new().create(true).append(true).open(&path).await?;

        file.write_all(json.as_bytes()).await?;
        file.write_all(b"\n").await?;

        return Ok(path);
    }

    Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "No timeline file path available",
    ))
}

/// Ingest timeline payload from Mission Control CLI
pub async fn post_timeline_event(
    Json(payload): Json<TimelinePushRequest>,
) -> Result<Json<TimelineIngestResponse>, (StatusCode, String)> {
    let should_store = !payload.persisted_locally;

    let mut stored_path = None;

    if should_store {
        match append_timeline_payload(&payload).await {
            Ok(path) => {
                stored_path = path.to_str().map(|value| value.to_string());
            },
            Err(err) => {
                tracing::error!("Failed to persist timeline payload: {}", err);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Failed to persist timeline payload".to_string(),
                ));
            },
        }
    }

    Ok(Json(TimelineIngestResponse {
        status: "accepted",
        stored: should_store,
        path: stored_path,
    }))
}

/// Create router for timeline endpoint
pub fn routes() -> Router {
    Router::new()
        .route("/", get(get_timeline))
        .route("/events", post(post_timeline_event))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use std::env;
    use std::fs;
    use tokio::io::AsyncReadExt;
    use uuid::Uuid;

    #[test]
    fn test_calculate_summary_empty() {
        let events = vec![];
        let summary = calculate_summary(&events);
        assert_eq!(summary.total_events, 0);
        assert_eq!(summary.run_count, 0);
        assert_eq!(summary.idle_count, 0);
        assert_eq!(summary.dead_count, 0);
    }

    #[test]
    fn test_calculate_summary_mixed() {
        let events = vec![
            TimelineEvent {
                timestamp: Some("2025-11-05T00:00:00Z".to_string()),
                agent: Some("Agent1".to_string()),
                state: Some("RUN".to_string()),
                task: Some("Task1".to_string()),
            },
            TimelineEvent {
                timestamp: Some("2025-11-05T00:01:00Z".to_string()),
                agent: Some("Agent2".to_string()),
                state: Some("IDLE".to_string()),
                task: None,
            },
            TimelineEvent {
                timestamp: Some("2025-11-05T00:02:00Z".to_string()),
                agent: Some("Agent3".to_string()),
                state: Some("DEAD".to_string()),
                task: None,
            },
            TimelineEvent {
                timestamp: Some("2025-11-05T00:03:00Z".to_string()),
                agent: Some("Agent4".to_string()),
                state: Some("RUNNING".to_string()),
                task: Some("Task2".to_string()),
            },
        ];

        let summary = calculate_summary(&events);
        assert_eq!(summary.total_events, 4);
        assert_eq!(summary.run_count, 2); // RUN and RUNNING
        assert_eq!(summary.idle_count, 1);
        assert_eq!(summary.dead_count, 1);
    }

    #[test]
    fn test_default_window() {
        assert_eq!(default_window(), 100);
    }

    #[tokio::test]
    async fn test_post_timeline_event_skip_storage_when_persisted() {
        let temp_path =
            env::temp_dir().join(format!("timeline-test-{}-skip.jsonl", Uuid::new_v4()));
        env::set_var("MISSION_CONTROL_TIMELINE_PATH", temp_path.to_str().expect("valid temp path"));

        let payload = TimelinePushRequest {
            generated_at: "2025-11-05T12:00:00Z".into(),
            session_name: "miyabi-refactor".into(),
            agent_states: TimelinePushAgentStates {
                total: 1,
                run: 1,
                idle: 0,
                dead: 0,
                agents: vec![TimelineAgentSnapshot {
                    pane_id: "%1".into(),
                    pane_title: "Coordinator".into(),
                    agent_name: Some("CoordinatorAgent".into()),
                    agent_type: Some("Coding".into()),
                    state: "RUN".into(),
                    current_command: "cargo run".into(),
                    pid: 1234,
                    last_activity: Some("2025-11-05T11:59:00Z".into()),
                }],
            },
            recent_events: vec![],
            recent_completions: vec![],
            conductor_status: None,
            persisted_locally: true,
            version: Some("test".into()),
        };

        let Json(response) =
            post_timeline_event(Json(payload.clone())).await.expect("timeline ingest");
        assert_eq!(response.status, "accepted");
        assert!(!response.stored);
        assert!(response.path.is_none());
        assert!(!temp_path.exists());

        env::remove_var("MISSION_CONTROL_TIMELINE_PATH");
    }

    #[tokio::test]
    async fn test_post_timeline_event_persists_when_required() {
        let temp_path =
            env::temp_dir().join(format!("timeline-test-{}-store.jsonl", Uuid::new_v4()));
        env::set_var("MISSION_CONTROL_TIMELINE_PATH", temp_path.to_str().expect("valid temp path"));

        // ensure file removed if existed
        let _ = fs::remove_file(&temp_path);

        let payload = TimelinePushRequest {
            generated_at: "2025-11-05T12:00:00Z".into(),
            session_name: "miyabi-refactor".into(),
            agent_states: TimelinePushAgentStates {
                total: 1,
                run: 1,
                idle: 0,
                dead: 0,
                agents: vec![TimelineAgentSnapshot {
                    pane_id: "%1".into(),
                    pane_title: "Coordinator".into(),
                    agent_name: Some("CoordinatorAgent".into()),
                    agent_type: Some("Coding".into()),
                    state: "RUN".into(),
                    current_command: "cargo run".into(),
                    pid: 4321,
                    last_activity: Some("2025-11-05T11:59:00Z".into()),
                }],
            },
            recent_events: vec![TimelinePushEvent {
                timestamp: "2025-11-05T11:58:00Z".into(),
                event_type: "task_started".into(),
                agent_id: "coordinator".into(),
                agent_name: Some("CoordinatorAgent".into()),
                issue_number: Some(757),
                task_id: Some("task-757-impl".into()),
                description: "Started implementation".into(),
                metadata: None,
            }],
            recent_completions: vec![TimelineCompletedTask {
                issue: 754,
                agent: "CodeGenAgent".into(),
                title: "Timeline CLI implementation".into(),
            }],
            conductor_status: Some(TimelineConductorStatus {
                conductor_name: "MissionControl".into(),
                last_cycle: 47,
                last_activity: "2025-11-05T11:59:30Z".into(),
                mode: "watch".into(),
            }),
            persisted_locally: false,
            version: None,
        };

        let Json(response) =
            post_timeline_event(Json(payload.clone())).await.expect("timeline ingest");
        assert_eq!(response.status, "accepted");
        assert!(response.stored);

        let stored_path = PathBuf::from(response.path.expect("path should be returned"));

        let mut file = tokio::fs::File::open(&stored_path).await.expect("timeline file");
        let mut contents = String::new();
        file.read_to_string(&mut contents).await.expect("read timeline");
        assert!(contents.contains("miyabi-refactor"));

        let _ = fs::remove_file(&stored_path);
        env::remove_var("MISSION_CONTROL_TIMELINE_PATH");
    }
}
