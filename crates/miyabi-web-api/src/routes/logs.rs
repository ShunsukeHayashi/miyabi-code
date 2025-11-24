use axum::{routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Serialize)]
pub struct LDDLog {
    pub id: String,
    pub timestamp: String,
    pub level: String,
    pub agent_type: Option<String>,
    pub message: String,
    pub context: Option<String>,
    pub issue_number: Option<u32>,
    pub session_id: String,
    pub file: Option<String>,
    pub line: Option<u32>,
}

#[derive(Serialize)]
pub struct LogsListResponse {
    pub logs: Vec<LDDLog>,
    pub total: usize,
}

pub async fn list_logs() -> Json<LogsListResponse> {
    let mut logs = Vec::new();

    // Get git commits as activity logs
    if let Ok(git_logs) = get_git_commit_logs() {
        logs.extend(git_logs);
    }

    // Get infinity sprint results
    if let Ok(sprint_logs) = get_infinity_sprint_logs() {
        logs.extend(sprint_logs);
    }

    // Sort by timestamp (newest first)
    logs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    // Limit to 50 most recent
    logs.truncate(50);

    Json(LogsListResponse {
        total: logs.len(),
        logs,
    })
}

/// Get recent git commits as log entries
fn get_git_commit_logs() -> Result<Vec<LDDLog>, String> {
    let output = Command::new("git")
        .args([
            "log",
            "--pretty=format:%H|%aI|%an|%s",
            "-30",
        ])
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output()
        .map_err(|e| format!("Failed to execute git log: {}", e))?;

    if !output.status.success() {
        return Err("git log failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut logs = Vec::new();

    for (i, line) in stdout.lines().enumerate() {
        let parts: Vec<&str> = line.splitn(4, '|').collect();
        if parts.len() >= 4 {
            let hash = parts[0];
            let timestamp = parts[1].to_string();
            let author = parts[2];
            let message = parts[3];

            // Determine agent type from commit message
            let agent_type = if message.contains("[Claude Code]") || message.contains("Claude") {
                Some("ClaudeAgent".to_string())
            } else if message.contains("DeploymentAgent") || message.contains("deploy") {
                Some("DeploymentAgent".to_string())
            } else if message.contains("CodeGen") || message.contains("fix:") || message.contains("feat:") {
                Some("CodeGenAgent".to_string())
            } else if message.contains("refactor:") || message.contains("chore:") {
                Some("RefresherAgent".to_string())
            } else {
                None
            };

            // Extract issue number from commit message
            let issue_number = extract_issue_from_message(message);

            logs.push(LDDLog {
                id: format!("git-{}", &hash[..7]),
                timestamp,
                level: "INFO".to_string(),
                agent_type,
                message: message.to_string(),
                context: Some(format!("Author: {}, Commit: {}", author, &hash[..7])),
                issue_number,
                session_id: format!("git-session-{}", i / 10),
                file: None,
                line: None,
            });
        }
    }

    Ok(logs)
}

/// Extract issue number from commit message
fn extract_issue_from_message(message: &str) -> Option<u32> {
    // Try #123 pattern
    if let Some(pos) = message.find('#') {
        let after = &message[pos + 1..];
        let num_str: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        if !num_str.is_empty() {
            if let Ok(num) = num_str.parse() {
                return Some(num);
            }
        }
    }

    // Try issue-123 pattern
    if let Some(pos) = message.find("issue-") {
        let after = &message[pos + 6..];
        let num_str: String = after.chars().take_while(|c| c.is_ascii_digit()).collect();
        if !num_str.is_empty() {
            if let Ok(num) = num_str.parse() {
                return Some(num);
            }
        }
    }

    None
}

/// Get infinity sprint execution results as log entries
fn get_infinity_sprint_logs() -> Result<Vec<LDDLog>, String> {
    let sprint_file = "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.ai/logs/infinity-sprint-2025-11-22-045653.json";

    let content = std::fs::read_to_string(sprint_file)
        .map_err(|e| format!("Failed to read sprint file: {}", e))?;

    let sprint_data: SprintData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse sprint JSON: {}", e))?;

    let mut logs = Vec::new();

    // Create log entries for each sprint result
    for sprint in &sprint_data.sprints {
        for result in &sprint.results {
            let level = if result.success { "INFO" } else { "ERROR" };
            let message = if result.success {
                if let Some(pr) = result.pr_number {
                    format!("Issue #{} completed successfully (PR #{})", result.issue_number, pr)
                } else {
                    format!("Issue #{} completed successfully", result.issue_number)
                }
            } else {
                format!("Issue #{} failed: {}", result.issue_number, result.error.as_deref().unwrap_or("Unknown error"))
            };

            logs.push(LDDLog {
                id: format!("sprint-{}-{}", sprint.id, result.issue_number),
                timestamp: sprint.end_time.clone(),
                level: level.to_string(),
                agent_type: Some("CoordinatorAgent".to_string()),
                message,
                context: Some(format!("Sprint #{}, Duration: {}s", sprint.id, result.duration_secs)),
                issue_number: Some(result.issue_number),
                session_id: format!("infinity-sprint-{}", sprint.id),
                file: Some(".ai/logs/infinity-sprint.json".to_string()),
                line: None,
            });
        }
    }

    // Add summary log
    if sprint_data.total_sprints > 0 {
        logs.push(LDDLog {
            id: "sprint-summary".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            level: "INFO".to_string(),
            agent_type: Some("InfinityMode".to_string()),
            message: format!(
                "Infinity Mode: {} issues processed, {}% success rate",
                sprint_data.total_issues,
                (sprint_data.success_rate * 100.0) as u32
            ),
            context: Some(format!(
                "Successful: {}, Failed: {}, Duration: {}s",
                sprint_data.successful_issues,
                sprint_data.failed_issues,
                sprint_data.total_duration_secs
            )),
            issue_number: None,
            session_id: "infinity-summary".to_string(),
            file: None,
            line: None,
        });
    }

    Ok(logs)
}

// Serde structs for infinity sprint JSON
#[derive(Deserialize)]
struct SprintData {
    total_duration_secs: u64,
    total_sprints: u32,
    total_issues: u32,
    successful_issues: u32,
    failed_issues: u32,
    success_rate: f64,
    sprints: Vec<Sprint>,
}

#[derive(Deserialize)]
struct Sprint {
    id: u32,
    #[allow(dead_code)]
    issues: Vec<u32>,
    #[allow(dead_code)]
    start_time: String,
    end_time: String,
    results: Vec<SprintResult>,
}

#[derive(Deserialize)]
struct SprintResult {
    issue_number: u32,
    success: bool,
    duration_secs: u64,
    error: Option<String>,
    pr_number: Option<u32>,
    #[allow(dead_code)]
    quality_score: Option<f64>,
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_logs))
}
