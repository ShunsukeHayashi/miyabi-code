//! Integration tests for notification system

use miyabi_approval::notifications::{
    ApprovalRequest, DiscordNotifier, SlackNotifier, WorkflowStatusUpdate,
};

#[cfg(feature = "integration-tests")]
use miyabi_approval::notifications::Notifier;

/// Mock Discord webhook for testing
/// Returns success for valid payloads
#[tokio::test]
async fn test_discord_notifier_creation() {
    let notifier = DiscordNotifier::new("https://discord.com/api/webhooks/test");
    assert!(std::mem::size_of_val(&notifier) > 0);
}

#[tokio::test]
async fn test_slack_notifier_creation() {
    let notifier = SlackNotifier::new("https://hooks.slack.com/services/test");
    assert!(std::mem::size_of_val(&notifier) > 0);
}

#[test]
fn test_approval_request_creation() {
    let req = ApprovalRequest {
        workflow_id: "test-workflow".to_string(),
        approval_id: "test-approval".to_string(),
        title: "Test Approval".to_string(),
        requester: "TestAgent".to_string(),
        details: "This is a test approval request".to_string(),
        approve_url: Some("https://example.com/approve".to_string()),
        reject_url: Some("https://example.com/reject".to_string()),
        required_approvers: vec!["user1".to_string(), "user2".to_string()],
        timeout_seconds: 3600,
    };

    assert_eq!(req.workflow_id, "test-workflow");
    assert_eq!(req.approval_id, "test-approval");
    assert_eq!(req.title, "Test Approval");
    assert_eq!(req.required_approvers.len(), 2);
}

#[test]
fn test_workflow_status_update_creation() {
    let status = WorkflowStatusUpdate {
        workflow_id: "test-workflow".to_string(),
        approval_id: "test-approval".to_string(),
        status: "Completed".to_string(),
        duration_seconds: Some(125),
        results: Some("All tests passed".to_string()),
        error: None,
    };

    assert_eq!(status.workflow_id, "test-workflow");
    assert_eq!(status.status, "Completed");
    assert_eq!(status.format_duration(), "2m 5s");
    assert_eq!(status.status_emoji(), "✅");
}

#[test]
fn test_workflow_status_duration_formatting() {
    let mut status = WorkflowStatusUpdate {
        workflow_id: "test".to_string(),
        approval_id: "test".to_string(),
        status: "Running".to_string(),
        duration_seconds: Some(30),
        results: None,
        error: None,
    };

    // Test seconds only
    assert_eq!(status.format_duration(), "30s");

    // Test minutes and seconds
    status.duration_seconds = Some(125);
    assert_eq!(status.format_duration(), "2m 5s");

    // Test full minutes
    status.duration_seconds = Some(300);
    assert_eq!(status.format_duration(), "5m 0s");

    // Test no duration
    status.duration_seconds = None;
    assert_eq!(status.format_duration(), "N/A");
}

#[test]
fn test_workflow_status_emojis() {
    let status_tests = vec![
        ("Running", "🔄"),
        ("Paused", "⏸️"),
        ("Completed", "✅"),
        ("Failed", "❌"),
        ("Approved", "✅"),
        ("Rejected", "❌"),
        ("TimedOut", "⏰"),
        ("Unknown", "ℹ️"),
    ];

    for (status_str, expected_emoji) in status_tests {
        let status = WorkflowStatusUpdate {
            workflow_id: "test".to_string(),
            approval_id: "test".to_string(),
            status: status_str.to_string(),
            duration_seconds: None,
            results: None,
            error: None,
        };

        assert_eq!(status.status_emoji(), expected_emoji);
    }
}

#[test]
fn test_workflow_status_colors() {
    let status_tests = vec![
        ("Running", 0x3498db),
        ("Paused", 0xf39c12),
        ("Completed", 0x2ecc71),
        ("Failed", 0xe74c3c),
        ("Approved", 0x2ecc71),
        ("Rejected", 0xe74c3c),
        ("TimedOut", 0xe67e22),
        ("Unknown", 0x95a5a6),
    ];

    for (status_str, expected_color) in status_tests {
        let status = WorkflowStatusUpdate {
            workflow_id: "test".to_string(),
            approval_id: "test".to_string(),
            status: status_str.to_string(),
            duration_seconds: None,
            results: None,
            error: None,
        };

        assert_eq!(status.status_color(), expected_color);
    }
}

#[test]
fn test_approval_request_serialization() {
    let req = ApprovalRequest {
        workflow_id: "test-workflow".to_string(),
        approval_id: "test-approval".to_string(),
        title: "Test Approval".to_string(),
        requester: "TestAgent".to_string(),
        details: "Test details".to_string(),
        approve_url: Some("https://example.com/approve".to_string()),
        reject_url: None,
        required_approvers: vec!["user1".to_string()],
        timeout_seconds: 3600,
    };

    let serialized = serde_json::to_string(&req).unwrap();
    let deserialized: ApprovalRequest = serde_json::from_str(&serialized).unwrap();

    assert_eq!(deserialized.workflow_id, req.workflow_id);
    assert_eq!(deserialized.title, req.title);
    assert_eq!(deserialized.requester, req.requester);
}

#[test]
fn test_workflow_status_serialization() {
    let status = WorkflowStatusUpdate {
        workflow_id: "test-workflow".to_string(),
        approval_id: "test-approval".to_string(),
        status: "Completed".to_string(),
        duration_seconds: Some(125),
        results: Some("Success".to_string()),
        error: None,
    };

    let serialized = serde_json::to_string(&status).unwrap();
    let deserialized: WorkflowStatusUpdate = serde_json::from_str(&serialized).unwrap();

    assert_eq!(deserialized.workflow_id, status.workflow_id);
    assert_eq!(deserialized.status, status.status);
    assert_eq!(deserialized.duration_seconds, status.duration_seconds);
}

// Note: Testing actual webhook delivery requires a mock HTTP server
// or environment variables with real webhook URLs.
// These tests verify the structure and formatting without network calls.

#[cfg(feature = "integration-tests")]
mod integration {
    use super::*;
    use std::env;

    #[tokio::test]
    async fn test_discord_webhook_real() {
        let webhook_url = match env::var("DISCORD_WEBHOOK_URL") {
            Ok(url) => url,
            Err(_) => {
                eprintln!("Skipping Discord webhook test: DISCORD_WEBHOOK_URL not set");
                return;
            }
        };

        let notifier = DiscordNotifier::new(webhook_url);
        let req = ApprovalRequest {
            workflow_id: "test-workflow".to_string(),
            approval_id: "test-approval".to_string(),
            title: "Test Approval Request".to_string(),
            requester: "IntegrationTest".to_string(),
            details: "This is a test from Miyabi approval system".to_string(),
            approve_url: Some("https://example.com/approve".to_string()),
            reject_url: Some("https://example.com/reject".to_string()),
            required_approvers: vec!["tester1".to_string(), "tester2".to_string()],
            timeout_seconds: 3600,
        };

        let result = notifier.send_approval_request(&req).await;
        assert!(
            result.is_ok(),
            "Failed to send Discord notification: {:?}",
            result.err()
        );
    }

    #[tokio::test]
    async fn test_slack_webhook_real() {
        let webhook_url = match env::var("SLACK_WEBHOOK_URL") {
            Ok(url) => url,
            Err(_) => {
                eprintln!("Skipping Slack webhook test: SLACK_WEBHOOK_URL not set");
                return;
            }
        };

        let notifier = SlackNotifier::new(webhook_url);
        let status = WorkflowStatusUpdate {
            workflow_id: "test-workflow".to_string(),
            approval_id: "test-approval".to_string(),
            status: "Completed".to_string(),
            duration_seconds: Some(125),
            results: Some("All tests passed successfully".to_string()),
            error: None,
        };

        let result = notifier.send_status_update(&status).await;
        assert!(
            result.is_ok(),
            "Failed to send Slack notification: {:?}",
            result.err()
        );
    }
}
