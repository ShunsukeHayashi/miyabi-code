//! Timeline endpoint - Execution timeline from conductor logs

use axum::{extract::Query, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

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

/// Get execution timeline from conductor logs
pub async fn get_timeline(Query(params): Query<TimelineQuery>) -> Json<TimelineResponse> {
    let window = params.window;

    // Try to find the timeline file in multiple locations
    let possible_paths = vec![
        ".ai/logs/conductor_timeline.jsonl",
        "/Users/shunsuke/Dev/miyabi-private/.ai/logs/conductor_timeline.jsonl",
        "../.ai/logs/conductor_timeline.jsonl",
        "../../.ai/logs/conductor_timeline.jsonl",
    ];

    let mut events = Vec::new();

    // Try each path until we find one that exists
    for path in possible_paths {
        if Path::new(path).exists() {
            events = read_timeline_file(path);
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
        }
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
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Failed to read line from timeline file: {}", e);
            }
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
                _ => {}
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

/// Create router for timeline endpoint
pub fn routes() -> Router {
    Router::new().route("/", get(get_timeline))
}

#[cfg(test)]
mod tests {
    use super::*;

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
}
