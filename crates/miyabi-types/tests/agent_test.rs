use miyabi_types::agent::*;
use serde_json;

#[test]
fn test_agent_type_serialization() {
    let agent = AgentType::CoordinatorAgent;
    let json = serde_json::to_string(&agent).unwrap();
    assert_eq!(json, r#""CoordinatorAgent""#);

    let deserialized: AgentType = serde_json::from_str(&json).unwrap();
    assert_eq!(agent, deserialized);
}

#[test]
fn test_all_agent_types() {
    let agents = vec![
        AgentType::CoordinatorAgent,
        AgentType::CodeGenAgent,
        AgentType::ReviewAgent,
        AgentType::IssueAgent,
        AgentType::PRAgent,
        AgentType::DeploymentAgent,
        AgentType::WaterSpiderAgent,
    ];

    for agent in agents {
        let json = serde_json::to_string(&agent).unwrap();
        let deserialized: AgentType = serde_json::from_str(&json).unwrap();
        assert_eq!(agent, deserialized);
    }
}

#[test]
fn test_agent_status_transitions() {
    let status = AgentStatus::Idle;
    assert_eq!(format!("{:?}", status), "Idle");

    let status = AgentStatus::Running;
    assert_eq!(format!("{:?}", status), "Running");

    let status = AgentStatus::Completed;
    assert_eq!(format!("{:?}", status), "Completed");

    let status = AgentStatus::Failed;
    assert_eq!(format!("{:?}", status), "Failed");

    let status = AgentStatus::Escalated;
    assert_eq!(format!("{:?}", status), "Escalated");
}

#[test]
fn test_agent_status_serialization() {
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
fn test_escalation_target_serialization() {
    let targets = vec![
        EscalationTarget::TechLead,
        EscalationTarget::PO,
        EscalationTarget::CISO,
        EscalationTarget::CTO,
        EscalationTarget::DevOps,
    ];

    for target in targets {
        let json = serde_json::to_string(&target).unwrap();
        let deserialized: EscalationTarget = serde_json::from_str(&json).unwrap();
        assert_eq!(target, deserialized);
    }
}

#[test]
fn test_severity_levels() {
    let severities = vec![
        Severity::Sev1Critical,
        Severity::Sev2High,
        Severity::Sev3Medium,
        Severity::Sev4Low,
        Severity::Sev5Trivial,
    ];

    for severity in severities {
        let json = serde_json::to_string(&severity).unwrap();
        let deserialized: Severity = serde_json::from_str(&json).unwrap();
        assert_eq!(severity, deserialized);
    }
}

#[test]
fn test_impact_levels() {
    let impacts = vec![
        ImpactLevel::Critical,
        ImpactLevel::High,
        ImpactLevel::Medium,
        ImpactLevel::Low,
    ];

    for impact in impacts {
        let json = serde_json::to_string(&impact).unwrap();
        let deserialized: ImpactLevel = serde_json::from_str(&json).unwrap();
        assert_eq!(impact, deserialized);
    }
}

#[test]
fn test_agent_result_success() {
    let result = AgentResult {
        status: AgentResultStatus::Success,
        data: None,
        error: None,
        metrics: None,
        escalation: None,
    };

    assert_eq!(result.status, AgentResultStatus::Success);
    assert!(result.data.is_none());
    assert!(result.error.is_none());
}

#[test]
fn test_agent_result_failed() {
    let result = AgentResult {
        status: AgentResultStatus::Failed,
        data: None,
        error: Some("Test error".to_string()),
        metrics: None,
        escalation: None,
    };

    assert_eq!(result.status, AgentResultStatus::Failed);
    assert!(result.error.is_some());
    assert_eq!(result.error.unwrap(), "Test error");
}

#[test]
fn test_agent_result_escalated() {
    let escalation = EscalationInfo {
        reason: "Test escalation".to_string(),
        target: EscalationTarget::TechLead,
        severity: Severity::Sev2High,
        context: serde_json::json!({"key": "value"}),
        timestamp: "2025-10-15T00:00:00Z".to_string(),
    };

    let result = AgentResult {
        status: AgentResultStatus::Escalated,
        data: None,
        error: None,
        metrics: None,
        escalation: Some(escalation),
    };

    assert_eq!(result.status, AgentResultStatus::Escalated);
    assert!(result.escalation.is_some());
}

#[test]
fn test_agent_metrics_creation() {
    let metrics = AgentMetrics {
        task_id: "task-1".to_string(),
        agent_type: AgentType::CodeGenAgent,
        duration_ms: 5000,
        quality_score: Some(85),
        lines_changed: Some(100),
        tests_added: Some(10),
        coverage_percent: Some(80.0),
        errors_found: Some(0),
        timestamp: "2025-10-15T00:00:00Z".to_string(),
    };

    assert_eq!(metrics.task_id, "task-1");
    assert_eq!(metrics.agent_type, AgentType::CodeGenAgent);
    assert_eq!(metrics.duration_ms, 5000);
    assert_eq!(metrics.quality_score, Some(85));
}

#[test]
fn test_agent_config_serialization() {
    let config = AgentConfig {
        device_identifier: "Test Device".to_string(),
        github_token: "ghp_test".to_string(),
        use_task_tool: true,
        use_worktree: true,
        worktree_base_path: Some("/tmp/worktrees".to_string()),
        log_directory: ".ai/logs".to_string(),
        report_directory: ".ai/reports".to_string(),
        tech_lead_github_username: Some("techlead".to_string()),
        ciso_github_username: Some("ciso".to_string()),
        po_github_username: Some("po".to_string()),
        firebase_production_project: None,
        firebase_staging_project: None,
        production_url: None,
        staging_url: None,
    };

    let json = serde_json::to_string(&config).unwrap();
    let deserialized: AgentConfig = serde_json::from_str(&json).unwrap();
    assert_eq!(config.device_identifier, deserialized.device_identifier);
    assert_eq!(config.use_task_tool, deserialized.use_task_tool);
}

#[test]
fn test_escalation_info_creation() {
    let info = EscalationInfo {
        reason: "Critical bug found".to_string(),
        target: EscalationTarget::CISO,
        severity: Severity::Sev1Critical,
        context: serde_json::json!({
            "bug_id": "BUG-123",
            "impact": "Production down"
        }),
        timestamp: "2025-10-15T00:00:00Z".to_string(),
    };

    assert_eq!(info.reason, "Critical bug found");
    assert_eq!(info.target, EscalationTarget::CISO);
    assert_eq!(info.severity, Severity::Sev1Critical);
}

#[test]
fn test_agent_result_status_serialization() {
    let statuses = vec![
        AgentResultStatus::Success,
        AgentResultStatus::Failed,
        AgentResultStatus::Escalated,
    ];

    for status in statuses {
        let json = serde_json::to_string(&status).unwrap();
        let deserialized: AgentResultStatus = serde_json::from_str(&json).unwrap();
        assert_eq!(status, deserialized);
    }
}

#[test]
fn test_agent_metrics_optional_fields() {
    let metrics = AgentMetrics {
        task_id: "task-1".to_string(),
        agent_type: AgentType::ReviewAgent,
        duration_ms: 3000,
        quality_score: None,
        lines_changed: None,
        tests_added: None,
        coverage_percent: None,
        errors_found: Some(5),
        timestamp: "2025-10-15T00:00:00Z".to_string(),
    };

    assert!(metrics.quality_score.is_none());
    assert!(metrics.lines_changed.is_none());
    assert_eq!(metrics.errors_found, Some(5));
}
