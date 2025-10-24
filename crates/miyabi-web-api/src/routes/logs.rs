use axum::{routing::get, Router, Json};
use serde::Serialize;

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

async fn list_logs() -> Json<LogsListResponse> {
    // Mock data - In production, this comes from miyabi-core logger
    let logs = vec![
        LDDLog {
            id: "log-001".to_string(),
            timestamp: "2025-01-20T16:05:23.456Z".to_string(),
            level: "INFO".to_string(),
            agent_type: Some("CoordinatorAgent".to_string()),
            message: "Starting task decomposition for Issue #490".to_string(),
            context: Some("DAG construction initialized with 5 parallel tasks".to_string()),
            issue_number: Some(490),
            session_id: "session-2025-01-20-001".to_string(),
            file: Some("miyabi-orchestrator/src/coordinator.rs".to_string()),
            line: Some(142),
        },
        LDDLog {
            id: "log-002".to_string(),
            timestamp: "2025-01-20T16:05:24.123Z".to_string(),
            level: "DEBUG".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            message: "Analyzing codebase structure for deployment module".to_string(),
            context: Some("Found 3 existing deployment files, planning incremental changes".to_string()),
            issue_number: Some(490),
            session_id: "session-2025-01-20-001".to_string(),
            file: Some("miyabi-agents/src/codegen.rs".to_string()),
            line: Some(87),
        },
        LDDLog {
            id: "log-003".to_string(),
            timestamp: "2025-01-20T16:05:25.789Z".to_string(),
            level: "WARN".to_string(),
            agent_type: Some("ReviewAgent".to_string()),
            message: "Detected potential memory leak in worktree cleanup".to_string(),
            context: Some("WorkerGuard lifetime not properly managed, suggesting OnceCell pattern".to_string()),
            issue_number: Some(355),
            session_id: "session-2025-01-20-002".to_string(),
            file: Some("miyabi-worktree/src/manager.rs".to_string()),
            line: Some(234),
        },
        LDDLog {
            id: "log-004".to_string(),
            timestamp: "2025-01-20T16:05:26.012Z".to_string(),
            level: "ERROR".to_string(),
            agent_type: Some("DeploymentAgent".to_string()),
            message: "Firebase deployment failed: authentication token expired".to_string(),
            context: Some("Attempting automatic token refresh and retry (1/3)".to_string()),
            issue_number: Some(145),
            session_id: "session-2025-01-20-003".to_string(),
            file: Some("miyabi-agents/src/deployment.rs".to_string()),
            line: Some(456),
        },
        LDDLog {
            id: "log-005".to_string(),
            timestamp: "2025-01-20T16:05:27.345Z".to_string(),
            level: "INFO".to_string(),
            agent_type: Some("PRAgent".to_string()),
            message: "Pull Request #145 created successfully".to_string(),
            context: Some("12 commits, +1247/-89 lines, targeting main branch".to_string()),
            issue_number: Some(490),
            session_id: "session-2025-01-20-001".to_string(),
            file: Some("miyabi-agents/src/pr.rs".to_string()),
            line: Some(312),
        },
        LDDLog {
            id: "log-006".to_string(),
            timestamp: "2025-01-20T16:05:28.678Z".to_string(),
            level: "DEBUG".to_string(),
            agent_type: Some("IssueAgent".to_string()),
            message: "Label inference completed: 5 labels assigned".to_string(),
            context: Some("Labels: type:feature, priority:high, agent:coordinator, phase:implementation, size:large".to_string()),
            issue_number: Some(490),
            session_id: "session-2025-01-20-001".to_string(),
            file: Some("miyabi-agents/src/issue.rs".to_string()),
            line: Some(198),
        },
        LDDLog {
            id: "log-007".to_string(),
            timestamp: "2025-01-20T16:05:29.234Z".to_string(),
            level: "INFO".to_string(),
            agent_type: Some("RefresherAgent".to_string()),
            message: "Issue status synchronized with GitHub".to_string(),
            context: Some("Updated 3 issues: #490 (in_progress), #431 (completed), #355 (review)".to_string()),
            issue_number: None,
            session_id: "session-2025-01-20-004".to_string(),
            file: Some("miyabi-agents/src/refresher.rs".to_string()),
            line: Some(76),
        },
        LDDLog {
            id: "log-008".to_string(),
            timestamp: "2025-01-20T16:05:30.567Z".to_string(),
            level: "WARN".to_string(),
            agent_type: None,
            message: "High memory usage detected: 85% of available RAM".to_string(),
            context: Some("Consider releasing unused worktrees to free memory".to_string()),
            issue_number: None,
            session_id: "session-2025-01-20-system".to_string(),
            file: Some("miyabi-core/src/monitor.rs".to_string()),
            line: Some(45),
        },
        LDDLog {
            id: "log-009".to_string(),
            timestamp: "2025-01-20T16:05:31.890Z".to_string(),
            level: "ERROR".to_string(),
            agent_type: Some("CodeGenAgent".to_string()),
            message: "Compilation failed: type mismatch in logger.rs".to_string(),
            context: Some("Expected `OnceCell<WorkerGuard>`, found `mem::forget` pattern".to_string()),
            issue_number: Some(355),
            session_id: "session-2025-01-20-002".to_string(),
            file: Some("miyabi-core/src/logger.rs".to_string()),
            line: Some(89),
        },
        LDDLog {
            id: "log-010".to_string(),
            timestamp: "2025-01-20T16:05:32.123Z".to_string(),
            level: "INFO".to_string(),
            agent_type: Some("CoordinatorAgent".to_string()),
            message: "All tasks completed successfully for Issue #490".to_string(),
            context: Some("5/5 tasks completed, 0 errors, total duration: 6m 32s".to_string()),
            issue_number: Some(490),
            session_id: "session-2025-01-20-001".to_string(),
            file: Some("miyabi-orchestrator/src/coordinator.rs".to_string()),
            line: Some(567),
        },
    ];

    Json(LogsListResponse {
        total: logs.len(),
        logs,
    })
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_logs))
}
