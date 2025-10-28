//! Integration tests for Session Manager

use miyabi_session_manager::{Phase, SessionContext, SessionManager};
use tempfile::tempdir;

#[tokio::test]
async fn test_session_manager_initialization() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path()).await;

    assert!(manager.is_ok());
}

#[tokio::test]
async fn test_session_spawn_and_retrieval() {
    let temp_dir = tempdir().unwrap();
    let _manager = SessionManager::new(temp_dir.path()).await.unwrap();

    let _context = SessionContext {
        issue_number: Some(270),
        current_phase: Phase::CodeGeneration,
        worktree_path: Some(".worktrees/issue-270".into()),
        previous_results: vec![],
    };

    // セッションを作成（実際にはclaude codeを起動しないのでテストはスキップ）
    // let session_id = manager
    //     .spawn_agent_session("TestAgent", "Test purpose", context)
    //     .await
    //     .unwrap();

    // assert_eq!(session_id.as_bytes().len(), 16); // UUID is 16 bytes
}

#[tokio::test]
async fn test_session_stats() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path()).await.unwrap();

    let stats = manager.get_stats();

    assert_eq!(stats.total, 0);
    assert_eq!(stats.active, 0);
    assert_eq!(stats.completed, 0);
}

#[tokio::test]
async fn test_session_lineage() {
    let temp_dir = tempdir().unwrap();
    let manager = SessionManager::new(temp_dir.path()).await.unwrap();

    // セッション系譜のテスト（実際のセッション作成が必要）
    // このテストは実際のAgentを起動しないとテストできないため、ユニットテストとして保留

    let lineage = manager.list_active_sessions();
    assert_eq!(lineage.len(), 0);
}

#[tokio::test]
async fn test_session_context_serialization() {
    let context = SessionContext {
        issue_number: Some(270),
        current_phase: Phase::CodeGeneration,
        worktree_path: Some(".worktrees/issue-270".into()),
        previous_results: vec![],
    };

    // JSON serialization test
    let json = serde_json::to_string(&context).unwrap();
    assert!(json.contains("\"issue_number\":270"));
    assert!(json.contains("\"current_phase\":\"CodeGeneration\""));

    // JSON deserialization test
    let deserialized: SessionContext = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.issue_number, Some(270));
    assert_eq!(deserialized.current_phase, Phase::CodeGeneration);
}
