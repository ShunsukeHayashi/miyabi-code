use miyabi_pty_manager::{PtyManager, Result};
use std::time::Duration;

#[test]
fn test_pty_manager_creation() {
    let manager = PtyManager::new();
    let sessions = manager.list_sessions();
    assert_eq!(sessions.len(), 0);
}

#[tokio::test]
async fn test_spawn_and_execute() -> Result<()> {
    let manager = PtyManager::new();

    // Spawn session
    let session = manager.spawn_shell(80, 24)?;
    assert_eq!(session.cols, 80);
    assert_eq!(session.rows, 24);
    assert!(session.is_user_managed());

    // Execute command
    manager.execute_command(&session.id, "echo 'Hello, Miyabi'")?;

    // Wait for output
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Get output
    let output = manager.get_output(&session.id, 10)?;
    let found = output.iter().any(|line| line.contains("Hello, Miyabi"));
    assert!(found, "Expected output not found: {:?}", output);

    // Cleanup
    manager.kill_session(&session.id)?;

    Ok(())
}

#[tokio::test]
async fn test_orchestrator_managed_session() -> Result<()> {
    let manager = PtyManager::new();

    // Spawn orchestrator-managed session
    let session = manager.spawn_shell_with_manager(
        80,
        24,
        Some("orchestrator:test-001".to_string()),
    )?;

    assert!(session.is_orchestrator_managed());
    assert_eq!(session.managed_by, Some("orchestrator:test-001".to_string()));

    // List sessions by manager
    let managed_sessions = manager.list_sessions_by_manager("orchestrator:test-001");
    assert_eq!(managed_sessions.len(), 1);
    assert_eq!(managed_sessions[0].id, session.id);

    // Kill all sessions for this manager
    let killed = manager.kill_sessions_by_manager("orchestrator:test-001")?;
    assert_eq!(killed, 1);

    // Verify cleanup
    let managed_sessions = manager.list_sessions_by_manager("orchestrator:test-001");
    assert_eq!(managed_sessions.len(), 0);

    Ok(())
}

#[tokio::test]
async fn test_session_output_search() -> Result<()> {
    let manager = PtyManager::new();

    let session = manager.spawn_shell(80, 24)?;

    // Execute multiple commands
    manager.execute_command(&session.id, "echo 'ERROR: test error'")?;
    manager.execute_command(&session.id, "echo 'INFO: test info'")?;
    manager.execute_command(&session.id, "echo 'WARN: test warning'")?;

    // Wait for output
    tokio::time::sleep(Duration::from_millis(800)).await;

    // Search for ERROR
    let errors = manager.search_output(&session.id, "ERROR")?;
    assert!(
        !errors.is_empty(),
        "Should find ERROR in output: {:?}",
        manager.get_output(&session.id, 20)?
    );

    // Search for INFO
    let infos = manager.search_output(&session.id, "INFO")?;
    assert!(
        !infos.is_empty(),
        "Should find INFO in output: {:?}",
        manager.get_output(&session.id, 20)?
    );

    manager.kill_session(&session.id)?;

    Ok(())
}

#[tokio::test]
async fn test_wait_for_pattern() -> Result<()> {
    let manager = PtyManager::new();

    let session = manager.spawn_shell(80, 24)?;

    // Execute command that will produce known output
    manager.execute_command(&session.id, "echo 'READY'")?;

    // Wait for pattern
    let result = manager
        .wait_for_pattern(&session.id, "READY", Duration::from_secs(2))
        .await?;

    assert!(result.is_some(), "Should find READY pattern");
    assert!(result.unwrap().contains("READY"));

    manager.kill_session(&session.id)?;

    Ok(())
}

#[tokio::test]
async fn test_session_info() -> Result<()> {
    let manager = PtyManager::new();

    let session = manager.spawn_shell(80, 24)?;

    // Get session info
    let info = manager.get_session_info(&session.id)?;

    assert_eq!(info.session.id, session.id);
    assert!(info.is_alive);
    assert!(info.uptime_seconds >= 0);

    manager.kill_session(&session.id)?;

    Ok(())
}

#[tokio::test]
async fn test_multiple_sessions() -> Result<()> {
    let manager = PtyManager::new();

    // Spawn multiple sessions
    let session1 = manager.spawn_shell_with_manager(
        80,
        24,
        Some("orchestrator:agent-1".to_string()),
    )?;
    let session2 = manager.spawn_shell_with_manager(
        80,
        24,
        Some("orchestrator:agent-1".to_string()),
    )?;
    let session3 = manager.spawn_shell_with_manager(
        80,
        24,
        Some("orchestrator:agent-2".to_string()),
    )?;

    // Verify all sessions exist
    let all_sessions = manager.list_sessions();
    assert_eq!(all_sessions.len(), 3);

    // List by manager
    let agent1_sessions = manager.list_sessions_by_manager("orchestrator:agent-1");
    assert_eq!(agent1_sessions.len(), 2);

    let agent2_sessions = manager.list_sessions_by_manager("orchestrator:agent-2");
    assert_eq!(agent2_sessions.len(), 1);

    // Cleanup agent-1 sessions
    let killed = manager.kill_sessions_by_manager("orchestrator:agent-1")?;
    assert_eq!(killed, 2);

    // Verify remaining sessions
    let remaining = manager.list_sessions();
    assert_eq!(remaining.len(), 1);
    assert_eq!(remaining[0].id, session3.id);

    // Cleanup remaining
    manager.kill_session(&session3.id)?;

    Ok(())
}

#[tokio::test]
async fn test_command_execution_sequence() -> Result<()> {
    let manager = PtyManager::new();

    let session = manager.spawn_shell(80, 24)?;

    // Execute sequence of commands
    manager.execute_command(&session.id, "export TEST_VAR='test_value'")?;
    manager.execute_command(&session.id, "echo $TEST_VAR")?;

    // Wait for output
    tokio::time::sleep(Duration::from_millis(800)).await;

    // Check output contains variable value
    let output = manager.get_output(&session.id, 20)?;
    let found = output.iter().any(|line| line.contains("test_value"));

    assert!(
        found,
        "Should find variable value in output: {:?}",
        output
    );

    manager.kill_session(&session.id)?;

    Ok(())
}
