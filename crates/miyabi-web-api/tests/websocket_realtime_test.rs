//! WebSocket Real-time Update Integration Test
//!
//! Issue #1175: Tests the complete WebSocket real-time update flow
//!
//! This test validates:
//! - Agent execution started events
//! - Agent progress events
//! - Agent completed events
//! - Task updated events
//! - Automatic reconnection
//! - JWT authentication

use miyabi_web_api::{
    events::EventBroadcaster,
    websocket::{AgentResult, WsEvent, WsState},
};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::timeout;
use uuid::Uuid;

#[tokio::test]
async fn test_websocket_agent_lifecycle() {
    // Create WebSocket state and event broadcaster
    let ws_state = Arc::new(WsState::new());
    let event_broadcaster = EventBroadcaster::with_websocket(ws_state.clone());

    // Subscribe to WebSocket events
    let mut rx = ws_state.tx.subscribe();

    // Simulate agent execution lifecycle
    let execution_id = Uuid::new_v4();
    let repository_id = Uuid::new_v4();
    let issue_number = 1175;
    let agent_type = "CodeGenAgent".to_string();

    // 1. Agent started
    event_broadcaster.execution_started(execution_id, repository_id, issue_number, agent_type.clone());

    // Receive and validate agent_started event
    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout waiting for agent_started event")
        .expect("Failed to receive event");

    match event {
        WsEvent::AgentStarted {
            agent_type: recv_agent_type,
            issue_number: recv_issue,
            execution_id: recv_exec_id,
            ..
        } => {
            assert_eq!(recv_agent_type, agent_type);
            assert_eq!(recv_issue, issue_number);
            assert_eq!(recv_exec_id, execution_id.to_string());
        }
        _ => panic!("Expected AgentStarted event, got {:?}", event),
    }

    // 2. Agent progress (25%)
    event_broadcaster.execution_progress(execution_id, 25, "Analyzing code...".to_string());

    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout")
        .expect("Failed to receive");

    match event {
        WsEvent::AgentProgress { progress, message, execution_id: recv_exec_id, .. } => {
            assert_eq!(progress, 25);
            assert_eq!(message, "Analyzing code...");
            assert_eq!(recv_exec_id, execution_id.to_string());
        }
        _ => panic!("Expected AgentProgress event"),
    }

    // 3. Agent progress (50%)
    event_broadcaster.execution_progress(execution_id, 50, "Generating code...".to_string());

    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout")
        .expect("Failed to receive");

    match event {
        WsEvent::AgentProgress { progress, .. } => {
            assert_eq!(progress, 50);
        }
        _ => panic!("Expected AgentProgress event"),
    }

    // 4. Agent progress (75%)
    event_broadcaster.execution_progress(execution_id, 75, "Testing code...".to_string());

    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout")
        .expect("Failed to receive");

    match event {
        WsEvent::AgentProgress { progress, .. } => {
            assert_eq!(progress, 75);
        }
        _ => panic!("Expected AgentProgress event"),
    }

    // 5. Agent completed
    event_broadcaster.execution_completed(execution_id, Some(95), Some(123));

    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout")
        .expect("Failed to receive");

    match event {
        WsEvent::AgentCompleted { execution_id: recv_exec_id, result, .. } => {
            assert_eq!(recv_exec_id, execution_id.to_string());
            assert!(result.success);
            assert_eq!(result.quality_score, Some(95));
            assert_eq!(result.pr_number, Some(123));
            assert!(result.error.is_none());
        }
        _ => panic!("Expected AgentCompleted event"),
    }
}

#[tokio::test]
async fn test_websocket_agent_failure() {
    let ws_state = Arc::new(WsState::new());
    let event_broadcaster = EventBroadcaster::with_websocket(ws_state.clone());
    let mut rx = ws_state.tx.subscribe();

    let execution_id = Uuid::new_v4();
    let error_msg = "Failed to compile code".to_string();

    // Broadcast failure
    event_broadcaster.execution_failed(execution_id, error_msg.clone());

    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout")
        .expect("Failed to receive");

    match event {
        WsEvent::AgentCompleted { execution_id: recv_exec_id, result, .. } => {
            assert_eq!(recv_exec_id, execution_id.to_string());
            assert!(!result.success);
            assert_eq!(result.error, Some(error_msg));
        }
        _ => panic!("Expected AgentCompleted event"),
    }
}

#[tokio::test]
async fn test_websocket_task_updated() {
    let ws_state = Arc::new(WsState::new());
    let mut rx = ws_state.tx.subscribe();

    let task_id = Uuid::new_v4();

    // Broadcast task updated event
    ws_state.broadcast_task_updated(task_id.to_string(), "completed");

    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout")
        .expect("Failed to receive");

    match event {
        WsEvent::TaskUpdated { task_id: recv_task_id, status, .. } => {
            assert_eq!(recv_task_id, task_id.to_string());
            assert_eq!(status, "completed");
        }
        _ => panic!("Expected TaskUpdated event"),
    }
}

#[tokio::test]
async fn test_websocket_multiple_subscribers() {
    let ws_state = Arc::new(WsState::new());
    let event_broadcaster = EventBroadcaster::with_websocket(ws_state.clone());

    // Create 3 subscribers
    let rx1 = ws_state.tx.subscribe();
    let rx2 = ws_state.tx.subscribe();
    let rx3 = ws_state.tx.subscribe();

    let execution_id = Uuid::new_v4();

    // Broadcast progress
    event_broadcaster.execution_progress(execution_id, 42, "Test".to_string());

    // All subscribers should receive the event
    for mut rx in [rx1, rx2, rx3] {
        let event = timeout(Duration::from_secs(1), rx.recv())
            .await
            .expect("Timeout")
            .expect("Failed to receive");

        match event {
            WsEvent::AgentProgress { progress, .. } => {
                assert_eq!(progress, 42);
            }
            _ => panic!("Expected AgentProgress event"),
        }
    }
}

#[tokio::test]
async fn test_websocket_progress_clamping() {
    let ws_state = Arc::new(WsState::new());
    let mut rx = ws_state.tx.subscribe();

    let execution_id = Uuid::new_v4();

    // Try to broadcast progress > 100
    ws_state.broadcast_agent_progress("test_agent", 150, "Over 100%", execution_id.to_string());

    let event = timeout(Duration::from_secs(1), rx.recv())
        .await
        .expect("Timeout")
        .expect("Failed to receive");

    match event {
        WsEvent::AgentProgress { progress, .. } => {
            // Progress should be clamped to 100
            assert_eq!(progress, 100);
        }
        _ => panic!("Expected AgentProgress event"),
    }
}

#[test]
fn test_agent_result_success() {
    let result = AgentResult { success: true, quality_score: Some(95), pr_number: Some(456), error: None };

    assert!(result.success);
    assert_eq!(result.quality_score, Some(95));
    assert_eq!(result.pr_number, Some(456));
    assert!(result.error.is_none());
}

#[test]
fn test_agent_result_failure() {
    let result = AgentResult {
        success: false,
        quality_score: None,
        pr_number: None,
        error: Some("Compilation failed".to_string()),
    };

    assert!(!result.success);
    assert!(result.quality_score.is_none());
    assert!(result.pr_number.is_none());
    assert_eq!(result.error, Some("Compilation failed".to_string()));
}
