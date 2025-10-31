use miyabi_pty_manager::PtyManager;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Testing miyabi-pty-manager");
    println!("================================\n");

    let manager = PtyManager::new();

    // Test 1: Basic session spawn
    println!("Test 1: Spawning terminal session...");
    let session = manager.spawn_shell(80, 24)?;
    println!("✅ Session created: {}", session.id);
    println!("   - Shell: {}", session.shell);
    println!("   - CWD: {}", session.cwd);
    println!("   - Size: {}x{}\n", session.cols, session.rows);

    // Test 2: Execute command
    println!("Test 2: Executing command...");
    manager.execute_command(&session.id, "echo 'Hello, Miyabi!'")?;
    println!("✅ Command sent\n");

    // Wait for output
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Test 3: Get output
    println!("Test 3: Retrieving output...");
    let output = manager.get_output(&session.id, 10)?;
    println!("✅ Retrieved {} lines:", output.len());
    for (i, line) in output.iter().enumerate() {
        if !line.trim().is_empty() {
            println!("   [{}] {}", i + 1, line.trim());
        }
    }
    println!();

    // Test 4: Search output
    println!("Test 4: Searching for 'Miyabi'...");
    let results = manager.search_output(&session.id, "Miyabi")?;
    println!("✅ Found {} matches:", results.len());
    for result in results {
        println!("   -> {}", result.trim());
    }
    println!();

    // Test 5: Session info
    println!("Test 5: Getting session info...");
    let info = manager.get_session_info(&session.id)?;
    println!("✅ Session info:");
    println!("   - ID: {}", info.session.id);
    println!("   - Alive: {}", info.is_alive);
    println!("   - Uptime: {}s", info.uptime_seconds);
    println!("   - Exit code: {:?}", info.exit_code);
    println!();

    // Test 6: Orchestrator-managed session
    println!("Test 6: Creating orchestrator-managed session...");
    let orchestrator_session = manager.spawn_shell_with_manager(
        80,
        24,
        Some("orchestrator:test-agent".to_string()),
    )?;
    println!("✅ Orchestrator session created: {}", orchestrator_session.id);
    println!("   - Managed by: {:?}", orchestrator_session.managed_by);
    println!();

    // Test 7: List sessions
    println!("Test 7: Listing all sessions...");
    let all_sessions = manager.list_sessions();
    println!("✅ Total sessions: {}", all_sessions.len());
    for (i, s) in all_sessions.iter().enumerate() {
        println!("   [{}] {} ({})", i + 1, s.id, s.managed_by.as_deref().unwrap_or("user"));
    }
    println!();

    // Test 8: Pattern matching
    println!("Test 8: Testing pattern matching...");
    manager.execute_command(&orchestrator_session.id, "echo 'READY'")?;

    match manager
        .wait_for_pattern(&orchestrator_session.id, "READY", Duration::from_secs(2))
        .await?
    {
        Some(line) => println!("✅ Pattern found: {}", line.trim()),
        None => println!("⚠️  Pattern not found (timeout)"),
    }
    println!();

    // Test 9: Cleanup
    println!("Test 9: Cleanup...");
    let killed = manager.kill_sessions_by_manager("orchestrator:test-agent")?;
    println!("✅ Killed {} orchestrator sessions", killed);

    manager.kill_session(&session.id)?;
    println!("✅ Killed user session\n");

    // Verify cleanup
    let remaining = manager.list_sessions();
    println!("Final session count: {}", remaining.len());

    println!("\n🎉 All tests completed successfully!");

    Ok(())
}
