//! Integration tests for Skills Bridge
//!
//! Tests the bidirectional communication between Skills and Orchestrator

use miyabi_orchestrator::skills_bridge::{ErrorSeverity, OrchestratorEvent, SkillRequest, SkillsBridge};
use std::collections::HashMap;

#[tokio::test]
async fn test_skills_bridge_creation() {
    let (bridge, _rx) = SkillsBridge::new();
    assert!(std::ptr::addr_of!(bridge).is_aligned());
}

#[tokio::test]
async fn test_trigger_skill_completed_event() {
    let (bridge, mut rx) = SkillsBridge::new();

    let mut metadata = HashMap::new();
    metadata.insert("test_key".to_string(), "test_value".to_string());

    let event = OrchestratorEvent::SkillCompleted {
        skill_name: "rust-development".to_string(),
        phase: Some("Phase 4".to_string()),
        metadata,
    };

    bridge.trigger_orchestrator(event).unwrap();

    // Verify event was received
    let received = rx.recv().await.unwrap();
    match received {
        OrchestratorEvent::SkillCompleted { skill_name, phase, .. } => {
            assert_eq!(skill_name, "rust-development");
            assert_eq!(phase, Some("Phase 4".to_string()));
        }
        _ => panic!("Unexpected event type"),
    }
}

#[tokio::test]
async fn test_trigger_stop_token_detected() {
    let (bridge, mut rx) = SkillsBridge::new();

    let mut context = HashMap::new();
    context.insert("ISSUE_NUMBER".to_string(), "809".to_string());

    let event = OrchestratorEvent::StopTokenDetected {
        workflow_id: "wf_123".to_string(),
        step_id: "ai_output_complete".to_string(),
        context,
    };

    bridge.trigger_orchestrator(event).unwrap();

    // Verify event was received
    let received = rx.recv().await.unwrap();
    match received {
        OrchestratorEvent::StopTokenDetected { workflow_id, step_id, .. } => {
            assert_eq!(workflow_id, "wf_123");
            assert_eq!(step_id, "ai_output_complete");
        }
        _ => panic!("Unexpected event type"),
    }
}

#[tokio::test]
async fn test_trigger_error_detected() {
    let (bridge, mut rx) = SkillsBridge::new();

    let event = OrchestratorEvent::ErrorDetected {
        skill_name: "debugging-troubleshooting".to_string(),
        error_message: "Test compilation failed".to_string(),
        severity: ErrorSeverity::Error,
    };

    bridge.trigger_orchestrator(event).unwrap();

    // Verify event was received
    let received = rx.recv().await.unwrap();
    match received {
        OrchestratorEvent::ErrorDetected { skill_name, error_message, severity } => {
            assert_eq!(skill_name, "debugging-troubleshooting");
            assert_eq!(error_message, "Test compilation failed");
            assert!(matches!(severity, ErrorSeverity::Error));
        }
        _ => panic!("Unexpected event type"),
    }
}

#[tokio::test]
async fn test_trigger_quality_check_result() {
    let (bridge, mut rx) = SkillsBridge::new();

    let event = OrchestratorEvent::QualityCheckResult {
        score: 85.0,
        passed: true,
        recommendations: vec!["Fix clippy warnings".to_string()],
    };

    bridge.trigger_orchestrator(event).unwrap();

    // Verify event was received
    let received = rx.recv().await.unwrap();
    match received {
        OrchestratorEvent::QualityCheckResult { score, passed, recommendations } => {
            assert_eq!(score, 85.0);
            assert!(passed);
            assert_eq!(recommendations.len(), 1);
        }
        _ => panic!("Unexpected event type"),
    }
}

#[tokio::test]
async fn test_skill_request_serialization() {
    let mut context = HashMap::new();
    context.insert("ISSUE_NUMBER".to_string(), "809".to_string());
    context.insert("TASK".to_string(), "Run tests".to_string());

    let request = SkillRequest { skill_name: "rust-development".to_string(), context, timeout_secs: 300 };

    // Serialize to JSON
    let json = serde_json::to_string(&request).unwrap();
    assert!(json.contains("rust-development"));
    assert!(json.contains("809"));
    assert!(json.contains("300"));

    // Deserialize back
    let deserialized: SkillRequest = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.skill_name, "rust-development");
    assert_eq!(deserialized.timeout_secs, 300);
    assert_eq!(deserialized.context.get("ISSUE_NUMBER"), Some(&"809".to_string()));
}

#[tokio::test]
async fn test_orchestrator_event_serialization() {
    let event = OrchestratorEvent::SkillCompleted {
        skill_name: "security-audit".to_string(),
        phase: Some("Phase 6".to_string()),
        metadata: HashMap::new(),
    };

    // Serialize to JSON
    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("security-audit"));
    assert!(json.contains("Phase 6"));

    // Deserialize back
    let deserialized: OrchestratorEvent = serde_json::from_str(&json).unwrap();
    match deserialized {
        OrchestratorEvent::SkillCompleted { skill_name, .. } => {
            assert_eq!(skill_name, "security-audit");
        }
        _ => panic!("Unexpected event type after deserialization"),
    }
}

#[tokio::test]
async fn test_multiple_events_in_sequence() {
    let (bridge, mut rx) = SkillsBridge::new();

    // Send multiple events
    bridge
        .trigger_orchestrator(OrchestratorEvent::SkillCompleted {
            skill_name: "skill1".to_string(),
            phase: None,
            metadata: HashMap::new(),
        })
        .unwrap();

    bridge
        .trigger_orchestrator(OrchestratorEvent::ErrorDetected {
            skill_name: "skill2".to_string(),
            error_message: "Error 1".to_string(),
            severity: ErrorSeverity::Warning,
        })
        .unwrap();

    bridge
        .trigger_orchestrator(OrchestratorEvent::QualityCheckResult {
            score: 90.0,
            passed: true,
            recommendations: vec![],
        })
        .unwrap();

    // Receive all events in order
    let event1 = rx.recv().await.unwrap();
    assert!(matches!(event1, OrchestratorEvent::SkillCompleted { .. }));

    let event2 = rx.recv().await.unwrap();
    assert!(matches!(event2, OrchestratorEvent::ErrorDetected { .. }));

    let event3 = rx.recv().await.unwrap();
    assert!(matches!(event3, OrchestratorEvent::QualityCheckResult { .. }));
}

/// Integration test: Execute a skill (will fail if script doesn't exist, which is expected in test environment)
#[tokio::test]
async fn test_execute_skill_not_found() {
    let (bridge, _rx) = SkillsBridge::new();

    let mut context = HashMap::new();
    context.insert("ISSUE_NUMBER".to_string(), "809".to_string());

    let request = SkillRequest { skill_name: "nonexistent-skill".to_string(), context, timeout_secs: 10 };

    let result = bridge.execute_skill(request).await;

    // Should fail because skill script doesn't exist
    assert!(result.is_err());
    let err_msg = result.unwrap_err().to_string();
    assert!(err_msg.contains("Skill script not found"));
}
