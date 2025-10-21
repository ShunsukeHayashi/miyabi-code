//! Serde integration tests for all miyabi-types
//!
//! This file tests JSON serialization/deserialization roundtrips for all types

use miyabi_types::agent::{
    AgentConfig, AgentMetrics, AgentResult, AgentStatus, AgentType,
    ImpactLevel as AgentImpactLevel, ResultStatus, Severity,
};
use miyabi_types::issue::{DeploymentStatus, Issue, IssueState, IssueStateGithub, PRState};
use miyabi_types::quality::{QualityBreakdown, QualityIssueType, QualityReport, QualitySeverity};
use miyabi_types::task::{GroupingConfig, Task, TaskType};
use miyabi_types::workflow::{
    Edge, ExecutionOptions, ExecutionReport, ExecutionSummary, ProgressStatus, DAG,
};
use std::path::PathBuf;

// ============================================================================
// Agent Types Roundtrip Tests
// ============================================================================

#[test]
fn test_agent_type_roundtrip() {
    let agent_types = vec![
        AgentType::CoordinatorAgent,
        AgentType::CodeGenAgent,
        AgentType::ReviewAgent,
        AgentType::IssueAgent,
        AgentType::PRAgent,
        AgentType::DeploymentAgent,
        AgentType::AutoFixAgent,
        AgentType::WaterSpiderAgent,
    ];

    for agent_type in agent_types {
        let json = serde_json::to_string(&agent_type).unwrap();
        let deserialized: AgentType = serde_json::from_str(&json).unwrap();
        assert_eq!(agent_type, deserialized);
    }
}

#[test]
fn test_agent_status_roundtrip() {
    let statuses = vec![
        AgentStatus::Idle,
        AgentStatus::Running,
        AgentStatus::Completed,
        AgentStatus::Failed,
        AgentStatus::Escalated,
    ];

    for status in statuses {
        let json = serde_json::to_string(&status).unwrap();
        let deserialized: AgentStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(status, deserialized);
    }
}

#[test]
fn test_agent_config_roundtrip() {
    let config = AgentConfig {
        device_identifier: "test-device".to_string(),
        github_token: "ghp_test".to_string(),
        repo_owner: Some("test-owner".to_string()),
        repo_name: Some("test-repo".to_string()),
        use_task_tool: true,
        use_worktree: true,
        worktree_base_path: Some(PathBuf::from("/tmp/worktrees")),
        log_directory: "./logs".to_string(),
        report_directory: "./reports".to_string(),
        tech_lead_github_username: Some("tech-lead".to_string()),
        ciso_github_username: None,
        po_github_username: Some("po".to_string()),
        firebase_production_project: Some("prod-project".to_string()),
        firebase_staging_project: Some("staging-project".to_string()),
        production_url: Some("https://prod.example.com".to_string()),
        staging_url: Some("https://staging.example.com".to_string()),
    };

    let json = serde_json::to_string(&config).unwrap();
    let deserialized: AgentConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(config.device_identifier, deserialized.device_identifier);
    assert_eq!(config.repo_owner, deserialized.repo_owner);
    assert_eq!(config.repo_name, deserialized.repo_name);
    assert_eq!(config.use_task_tool, deserialized.use_task_tool);
    assert_eq!(config.worktree_base_path, deserialized.worktree_base_path);
}

#[test]
fn test_agent_metrics_roundtrip() {
    let metrics = AgentMetrics {
        task_id: "task-123".to_string(),
        agent_type: AgentType::CodeGenAgent,
        duration_ms: 5000,
        quality_score: Some(85),
        lines_changed: Some(150),
        tests_added: Some(10),
        coverage_percent: Some(82.5),
        errors_found: None,
        timestamp: chrono::Utc::now(),
    };

    let json = serde_json::to_string(&metrics).unwrap();
    let deserialized: AgentMetrics = serde_json::from_str(&json).unwrap();
    assert_eq!(metrics.task_id, deserialized.task_id);
    assert_eq!(metrics.agent_type, deserialized.agent_type);
}

// ============================================================================
// Task Types Roundtrip Tests
// ============================================================================

#[test]
fn test_task_type_roundtrip() {
    let task_types = vec![
        TaskType::Feature,
        TaskType::Bug,
        TaskType::Refactor,
        TaskType::Docs,
        TaskType::Test,
        TaskType::Deployment,
    ];

    for task_type in task_types {
        let json = serde_json::to_string(&task_type).unwrap();
        let deserialized: TaskType = serde_json::from_str(&json).unwrap();
        assert_eq!(task_type, deserialized);
    }
}

#[test]
fn test_task_roundtrip() {
    let task = Task {
        id: "task-001".to_string(),
        title: "Test task".to_string(),
        description: "Description".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: Some(Severity::High),
        impact: Some(AgentImpactLevel::High),
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec!["task-000".to_string()],
        estimated_duration: Some(60),
        status: Some(AgentStatus::Running),
        start_time: Some(1234567890),
        end_time: None,
        metadata: None,
    };

    let json = serde_json::to_string(&task).unwrap();
    let deserialized: Task = serde_json::from_str(&json).unwrap();
    assert_eq!(task.id, deserialized.id);
    assert_eq!(task.task_type, deserialized.task_type);
}

#[test]
fn test_grouping_config_roundtrip() {
    let config = GroupingConfig {
        min_group_size: 5,
        max_group_size: 15,
        max_concurrent_groups: 8,
        priority_weight: 0.5,
        duration_weight: 0.3,
        agent_weight: 0.2,
    };

    let json = serde_json::to_string(&config).unwrap();
    let deserialized: GroupingConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(config.min_group_size, deserialized.min_group_size);
}

// ============================================================================
// Issue Types Roundtrip Tests
// ============================================================================

#[test]
fn test_issue_state_roundtrip() {
    let states = vec![
        IssueState::Pending,
        IssueState::Analyzing,
        IssueState::Implementing,
        IssueState::Reviewing,
        IssueState::Deploying,
        IssueState::Done,
        IssueState::Blocked,
        IssueState::Failed,
    ];

    for state in states {
        let json = serde_json::to_string(&state).unwrap();
        let deserialized: IssueState = serde_json::from_str(&json).unwrap();
        assert_eq!(state, deserialized);
    }
}

#[test]
fn test_issue_roundtrip() {
    let issue = Issue {
        number: 123,
        title: "Test issue".to_string(),
        body: "Issue body".to_string(),
        state: IssueStateGithub::Open,
        labels: vec!["bug".to_string()],
        assignee: Some("user123".to_string()),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        url: "https://github.com/user/repo/issues/123".to_string(),
    };

    let json = serde_json::to_string(&issue).unwrap();
    let deserialized: Issue = serde_json::from_str(&json).unwrap();
    assert_eq!(issue.number, deserialized.number);
    assert_eq!(issue.title, deserialized.title);
}

#[test]
fn test_pr_state_roundtrip() {
    let states = vec![
        PRState::Draft,
        PRState::Open,
        PRState::Merged,
        PRState::Closed,
    ];

    for state in states {
        let json = serde_json::to_string(&state).unwrap();
        let deserialized: PRState = serde_json::from_str(&json).unwrap();
        assert_eq!(state, deserialized);
    }
}

#[test]
fn test_deployment_status_roundtrip() {
    let statuses = vec![
        DeploymentStatus::Success,
        DeploymentStatus::Failed,
        DeploymentStatus::RolledBack,
    ];

    for status in statuses {
        let json = serde_json::to_string(&status).unwrap();
        let deserialized: DeploymentStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(status, deserialized);
    }
}

// ============================================================================
// Quality Types Roundtrip Tests
// ============================================================================

#[test]
fn test_quality_severity_roundtrip() {
    let severities = vec![
        QualitySeverity::Low,
        QualitySeverity::Medium,
        QualitySeverity::High,
        QualitySeverity::Critical,
    ];

    for severity in severities {
        let json = serde_json::to_string(&severity).unwrap();
        let deserialized: QualitySeverity = serde_json::from_str(&json).unwrap();
        assert_eq!(severity, deserialized);
    }
}

#[test]
fn test_quality_issue_type_roundtrip() {
    let types = vec![
        QualityIssueType::Eslint,
        QualityIssueType::Typescript,
        QualityIssueType::Security,
        QualityIssueType::Coverage,
    ];

    for issue_type in types {
        let json = serde_json::to_string(&issue_type).unwrap();
        let deserialized: QualityIssueType = serde_json::from_str(&json).unwrap();
        assert_eq!(issue_type, deserialized);
    }
}

#[test]
fn test_quality_report_roundtrip() {
    let report = QualityReport {
        score: 85,
        passed: true,
        issues: vec![],
        recommendations: vec!["Fix types".to_string()],
        breakdown: QualityBreakdown {
            clippy_score: 90,
            rustc_score: 85,
            security_score: 80,
            test_coverage_score: 85,
        },
    };

    let json = serde_json::to_string(&report).unwrap();
    let deserialized: QualityReport = serde_json::from_str(&json).unwrap();
    assert_eq!(report.score, deserialized.score);
    assert_eq!(report.passed, deserialized.passed);
}

// ============================================================================
// Workflow Types Roundtrip Tests
// ============================================================================

#[test]
fn test_edge_roundtrip() {
    let edge = Edge {
        from: "task-1".to_string(),
        to: "task-2".to_string(),
    };

    let json = serde_json::to_string(&edge).unwrap();
    let deserialized: Edge = serde_json::from_str(&json).unwrap();
    assert_eq!(edge.from, deserialized.from);
    assert_eq!(edge.to, deserialized.to);
}

#[test]
fn test_progress_status_roundtrip() {
    let progress = ProgressStatus {
        total: 20,
        completed: 15,
        running: 3,
        waiting: 2,
        failed: 0,
        percentage: 75.0,
    };

    let json = serde_json::to_string(&progress).unwrap();
    let deserialized: ProgressStatus = serde_json::from_str(&json).unwrap();
    assert_eq!(progress.total, deserialized.total);
    assert_eq!(progress.completed, deserialized.completed);
}

#[test]
fn test_execution_options_roundtrip() {
    let options = ExecutionOptions {
        issues: Some(vec![1, 2, 3]),
        todos: Some(vec!["task-1".to_string()]),
        concurrency: 5,
        dry_run: true,
        ignore_dependencies: false,
        timeout: Some(60),
    };

    let json = serde_json::to_string(&options).unwrap();
    let deserialized: ExecutionOptions = serde_json::from_str(&json).unwrap();
    assert_eq!(options.concurrency, deserialized.concurrency);
    assert_eq!(options.dry_run, deserialized.dry_run);
}

// ============================================================================
// Edge Cases Tests
// ============================================================================

#[test]
fn test_empty_vectors_roundtrip() {
    let task = Task {
        id: "task-001".to_string(),
        title: "Empty deps".to_string(),
        description: "".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: None,
        dependencies: vec![], // Empty vector
        estimated_duration: None,
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    let json = serde_json::to_string(&task).unwrap();
    let deserialized: Task = serde_json::from_str(&json).unwrap();
    assert_eq!(task.dependencies.len(), 0);
    assert_eq!(deserialized.dependencies.len(), 0);
}

#[test]
fn test_none_fields_serialization() {
    let task = Task {
        id: "task-002".to_string(),
        title: "None fields".to_string(),
        description: "".to_string(),
        task_type: TaskType::Bug,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: None,
        dependencies: vec![],
        estimated_duration: None,
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    let json = serde_json::to_string(&task).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();

    // None fields should not be present in JSON
    assert!(parsed.get("severity").is_none());
    assert!(parsed.get("impact").is_none());
    assert!(parsed.get("assigned_agent").is_none());
}

#[test]
fn test_complex_nested_structure() {
    let task = Task {
        id: "task-1".to_string(),
        title: "Complex task".to_string(),
        description: "".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: Some(Severity::High),
        impact: Some(AgentImpactLevel::High),
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec!["task-0".to_string()],
        estimated_duration: Some(30),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    let dag = DAG {
        nodes: vec![task.clone()],
        edges: vec![],
        levels: vec![vec!["task-1".to_string()]],
    };

    let json = serde_json::to_string(&dag).unwrap();
    let deserialized: DAG = serde_json::from_str(&json).unwrap();
    assert_eq!(dag.nodes.len(), deserialized.nodes.len());
    assert_eq!(dag.levels.len(), deserialized.levels.len());
}

// ============================================================================
// Cross-Type Integration Tests
// ============================================================================

#[test]
fn test_agent_result_with_metrics() {
    let metrics = AgentMetrics {
        task_id: "task-123".to_string(),
        agent_type: AgentType::ReviewAgent,
        duration_ms: 3000,
        quality_score: Some(90),
        lines_changed: None,
        tests_added: None,
        coverage_percent: None,
        errors_found: Some(2),
        timestamp: chrono::Utc::now(),
    };

    let result = AgentResult {
        status: ResultStatus::Success,
        data: Some(serde_json::json!({"key": "value"})),
        error: None,
        metrics: Some(metrics),
        escalation: None,
    };

    let json = serde_json::to_string(&result).unwrap();
    let deserialized: AgentResult = serde_json::from_str(&json).unwrap();
    assert_eq!(result.status, deserialized.status);
    assert!(deserialized.metrics.is_some());
}

#[test]
fn test_execution_report_full() {
    let summary = ExecutionSummary {
        total: 5,
        completed: 5,
        failed: 0,
        escalated: 0,
        success_rate: 100.0,
    };

    let report = ExecutionReport {
        session_id: "session-123".to_string(),
        device_identifier: "test-device".to_string(),
        start_time: 1000000,
        end_time: 1005000,
        total_duration_ms: 5000,
        summary,
        tasks: vec![],
        metrics: vec![],
        escalations: vec![],
    };

    let json = serde_json::to_string(&report).unwrap();
    let deserialized: ExecutionReport = serde_json::from_str(&json).unwrap();
    assert_eq!(report.session_id, deserialized.session_id);
    assert_eq!(report.total_duration_ms, deserialized.total_duration_ms);
}
