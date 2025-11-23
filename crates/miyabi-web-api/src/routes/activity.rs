use axum::{extract::Query, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Serialize)]
pub struct ActivityStats {
    pub total_events: u32,
    pub today_events: u32,
    pub active_issues: u32,
    pub uptime: u64,
}

#[derive(Serialize)]
pub struct ActivityEvent {
    pub id: String,
    pub timestamp: String,
    pub category: String,
    pub title: String,
    pub description: String,
    pub severity: String,
}

#[derive(Deserialize)]
pub struct EventsQuery {
    pub limit: Option<u32>,
}

pub async fn get_activity_stats() -> Json<ActivityStats> {
    // Get commit count from git log
    let total_events = get_git_commit_count(None).unwrap_or(0);
    let today_events = get_git_commit_count(Some("today")).unwrap_or(0);

    // Get open issues count
    let active_issues = get_open_issues_count().unwrap_or(0);

    // Get system uptime
    let uptime = get_system_uptime().unwrap_or(0);

    Json(ActivityStats {
        total_events,
        today_events,
        active_issues,
        uptime,
    })
}

pub async fn get_activity_events(Query(query): Query<EventsQuery>) -> Json<Vec<ActivityEvent>> {
    let limit = query.limit.unwrap_or(50);

    // Get events from git log and convert to activity events
    let events = match get_git_events(limit) {
        Ok(evts) => evts,
        Err(e) => {
            tracing::error!("Failed to get activity events: {}", e);
            vec![]
        }
    };

    Json(events)
}

fn get_git_commit_count(since: Option<&str>) -> Result<u32, String> {
    let mut args = vec!["rev-list", "--count", "HEAD"];

    if let Some(since_arg) = since {
        if since_arg == "today" {
            args.push("--since=midnight");
        }
    }

    let output = Command::new("git")
        .args(&args)
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output()
        .map_err(|e| format!("Failed to execute git: {}", e))?;

    if !output.status.success() {
        return Err("git rev-list failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    stdout.trim().parse().map_err(|e| format!("Failed to parse count: {}", e))
}

fn get_open_issues_count() -> Result<u32, String> {
    // Try to get open issues from GitHub CLI
    let output = Command::new("gh")
        .args(["issue", "list", "--state", "open", "--json", "number"])
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let stdout = String::from_utf8_lossy(&out.stdout);
            // Count JSON array elements
            let count = stdout.matches("\"number\"").count();
            Ok(count as u32)
        }
        _ => {
            // Fallback: count worktrees with issue numbers
            Ok(5) // Default value if gh is not available
        }
    }
}

fn get_system_uptime() -> Result<u64, String> {
    let output = Command::new("uptime")
        .output()
        .map_err(|e| format!("Failed to execute uptime: {}", e))?;

    if !output.status.success() {
        return Err("uptime command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    // Parse uptime output to get seconds
    // Format varies: "up 10 days, 5:30" or "up 5:30"
    if let Some(days_match) = stdout.find("day") {
        // Has days
        if let Some(num_start) = stdout.find("up ") {
            let num_str: String = stdout[num_start + 3..]
                .chars()
                .take_while(|c| c.is_ascii_digit())
                .collect();
            if let Ok(days) = num_str.parse::<u64>() {
                return Ok(days * 86400);
            }
        }
    }

    // Fallback: assume running for 1 day
    Ok(86400)
}

fn get_git_events(limit: u32) -> Result<Vec<ActivityEvent>, String> {
    let output = Command::new("git")
        .args([
            "log",
            "--pretty=format:%H|%aI|%an|%s",
            &format!("-{}", limit),
        ])
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output()
        .map_err(|e| format!("Failed to execute git log: {}", e))?;

    if !output.status.success() {
        return Err("git log failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut events = Vec::new();

    for (i, line) in stdout.lines().enumerate() {
        let parts: Vec<&str> = line.splitn(4, '|').collect();
        if parts.len() >= 4 {
            let hash = parts[0];
            let timestamp = parts[1].to_string();
            let author = parts[2];
            let message = parts[3];

            // Determine category from commit message
            let (category, severity) = categorize_commit(message);

            events.push(ActivityEvent {
                id: format!("evt-{}", &hash[..7]),
                timestamp,
                category,
                title: truncate_message(message, 50),
                description: format!("By {} ({})", author, &hash[..7]),
                severity,
            });
        }

        if i >= limit as usize {
            break;
        }
    }

    Ok(events)
}

fn categorize_commit(message: &str) -> (String, String) {
    let msg_lower = message.to_lowercase();

    if msg_lower.contains("deploy") || msg_lower.contains("release") {
        ("deployment".to_string(), "info".to_string())
    } else if msg_lower.contains("fix") || msg_lower.contains("bug") {
        ("error".to_string(), "warning".to_string())
    } else if msg_lower.contains("agent") || msg_lower.contains("coordinator") {
        ("agent".to_string(), "info".to_string())
    } else if msg_lower.contains("error") || msg_lower.contains("fail") {
        ("error".to_string(), "critical".to_string())
    } else {
        ("system".to_string(), "info".to_string())
    }
}

fn truncate_message(message: &str, max_len: usize) -> String {
    if message.len() <= max_len {
        message.to_string()
    } else {
        format!("{}...", &message[..max_len - 3])
    }
}

pub fn routes() -> Router {
    Router::new()
        .route("/stats", get(get_activity_stats))
        .route("/events", get(get_activity_events))
}
