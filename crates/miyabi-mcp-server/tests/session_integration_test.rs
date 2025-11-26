//! Session Management Integration Tests
//!
//! Tests the SessionHandler integration with MCP Server

use miyabi_mcp_server::session_handler::SessionHandler;
use miyabi_mcp_server::session_rpc::*;
use tempfile::TempDir;

#[tokio::test]
async fn test_session_spawn() {
    let temp_dir = TempDir::new().unwrap();
    let handler = SessionHandler::new(temp_dir.path().to_str().unwrap())
        .await
        .unwrap();

    let params = SessionSpawnParams {
        agent_name: "coordinator".to_string(),
        purpose: "Test task decomposition".to_string(),
        context: SessionContextParams {
            issue_number: Some(100),
            current_phase: "TaskDecomposition".to_string(),
            worktree_path: None,
        },
    };

    let result = handler.spawn_session(params).await;
    assert!(result.is_ok());

    let spawn_result = result.unwrap();
    assert_eq!(spawn_result.agent_name, "coordinator");
    assert!(!spawn_result.session_id.is_empty());
}

#[tokio::test]
async fn test_session_lifecycle() {
    let temp_dir = TempDir::new().unwrap();
    let handler = SessionHandler::new(temp_dir.path().to_str().unwrap())
        .await
        .unwrap();

    // 1. Spawn session
    let spawn_params = SessionSpawnParams {
        agent_name: "coordinator".to_string(),
        purpose: "Test lifecycle".to_string(),
        context: SessionContextParams {
            issue_number: Some(200),
            current_phase: "IssueAnalysis".to_string(),
            worktree_path: None,
        },
    };

    let spawn_result = handler.spawn_session(spawn_params).await.unwrap();
    let session_id = spawn_result.session_id.clone();

    // 2. Get session
    let get_params = SessionGetParams {
        session_id: session_id.clone(),
    };
    let get_result = handler.get_session(get_params).await;
    assert!(get_result.is_ok());

    let session = get_result.unwrap();
    assert_eq!(session.agent_name, "coordinator");
    assert_eq!(session.context.issue_number, Some(200));

    // 3. Monitor session
    let monitor_params = SessionMonitorParams {
        session_id: session_id.clone(),
    };
    let monitor_result = handler.monitor_session(monitor_params).await;
    assert!(monitor_result.is_ok());
}

#[tokio::test]
async fn test_session_handoff() {
    let temp_dir = TempDir::new().unwrap();
    let handler = SessionHandler::new(temp_dir.path().to_str().unwrap())
        .await
        .unwrap();

    // 1. Spawn initial session
    let spawn_params = SessionSpawnParams {
        agent_name: "coordinator".to_string(),
        purpose: "Initial task".to_string(),
        context: SessionContextParams {
            issue_number: Some(300),
            current_phase: "TaskDecomposition".to_string(),
            worktree_path: None,
        },
    };

    let spawn_result = handler.spawn_session(spawn_params).await.unwrap();
    let parent_id = spawn_result.session_id.clone();

    // 2. Handoff to CodeGen
    let handoff_params = SessionHandoffParams {
        from_session_id: parent_id.clone(),
        to_agent: "codegen".to_string(),
        updated_context: SessionContextParams {
            issue_number: Some(300),
            current_phase: "CodeGeneration".to_string(),
            worktree_path: Some("/tmp/worktree-300".to_string()),
        },
    };

    let handoff_result = handler.handoff_session(handoff_params).await;
    assert!(handoff_result.is_ok());

    let handoff = handoff_result.unwrap();
    assert_eq!(handoff.parent_session_id, parent_id);
    assert_eq!(handoff.agent_name, "codegen");

    // 3. Verify lineage (must use child session ID to get full lineage)
    let child_id = handoff.new_session_id.clone();
    let lineage_params = SessionLineageParams {
        session_id: child_id,
    };
    let lineage_result = handler.get_lineage(lineage_params).await;
    assert!(lineage_result.is_ok());

    let lineage = lineage_result.unwrap();
    assert_eq!(lineage.total, 2); // Parent + 1 child
    assert_eq!(lineage.descendants.len(), 1);
}

#[tokio::test]
async fn test_session_list_and_stats() {
    let temp_dir = TempDir::new().unwrap();
    let handler = SessionHandler::new(temp_dir.path().to_str().unwrap())
        .await
        .unwrap();

    // Spawn multiple sessions
    for i in 1..=3 {
        let params = SessionSpawnParams {
            agent_name: format!("agent-{}", i),
            purpose: format!("Task {}", i),
            context: SessionContextParams {
                issue_number: Some(i as u64),
                current_phase: "Test".to_string(),
                worktree_path: None,
            },
        };
        handler.spawn_session(params).await.unwrap();
    }

    // 1. List sessions
    let list_params = SessionListParams {
        status: None,
        limit: 10,
    };
    let list_result = handler.list_sessions(list_params).await;
    assert!(list_result.is_ok());

    let list = list_result.unwrap();
    assert_eq!(list.total, 3);
    assert_eq!(list.sessions.len(), 3);

    // 2. Get stats
    let stats_result = handler.get_stats().await;
    assert!(stats_result.is_ok());

    let stats = stats_result.unwrap();
    assert_eq!(stats.total_sessions, 3);
}

#[tokio::test]
async fn test_session_terminate() {
    let temp_dir = TempDir::new().unwrap();
    let handler = SessionHandler::new(temp_dir.path().to_str().unwrap())
        .await
        .unwrap();

    // Spawn session
    let spawn_params = SessionSpawnParams {
        agent_name: "test-agent".to_string(),
        purpose: "To be terminated".to_string(),
        context: SessionContextParams {
            issue_number: Some(999),
            current_phase: "Test".to_string(),
            worktree_path: None,
        },
    };

    let spawn_result = handler.spawn_session(spawn_params).await.unwrap();
    let session_id = spawn_result.session_id.clone();

    // Terminate
    let terminate_params = SessionTerminateParams {
        session_id: session_id.clone(),
    };
    let terminate_result = handler.terminate_session(terminate_params).await;
    assert!(terminate_result.is_ok());

    let result = terminate_result.unwrap();
    assert_eq!(result.session_id, session_id);
    // Note: terminated may be false if process already exited
}
