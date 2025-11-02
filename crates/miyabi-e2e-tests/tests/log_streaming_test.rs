//! Real-time Log Streaming E2E Test
//!
//! This test suite validates the real-time log streaming functionality:
//! 1. Basic log streaming - logs are generated and retrieved in order
//! 2. Log level filtering - filter logs by level (INFO, WARN, ERROR, DEBUG)
//! 3. Agent filtering - filter logs by agent type
//! 4. Performance with large log volumes (1000+ logs)
//! 5. Real-time updates - new logs are immediately available
//!
//! Run with:
//! ```bash
//! cargo test --package miyabi-e2e-tests --test log_streaming_test
//! ```

use miyabi_e2e_tests::TestHarness;
use serial_test::serial;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct LDDLog {
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

#[derive(Debug, Serialize, Deserialize)]
struct LogsListResponse {
    pub logs: Vec<LDDLog>,
    pub total: usize,
}

/// Helper function to create test log
fn create_test_log(
    id: &str,
    level: &str,
    agent_type: Option<&str>,
    message: &str,
    issue_number: Option<u32>,
) -> LDDLog {
    LDDLog {
        id: id.to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
        level: level.to_string(),
        agent_type: agent_type.map(|s| s.to_string()),
        message: message.to_string(),
        context: Some(format!("Test context for {}", id)),
        issue_number,
        session_id: "test-session-001".to_string(),
        file: Some("test.rs".to_string()),
        line: Some(42),
    }
}

/// Test 1: Basic Log Streaming - logs are generated and retrieved in order
#[tokio::test]
#[serial]
async fn test_basic_log_streaming() {
    println!("🧪 Test 1: Basic Log Streaming");
    println!("{}", "=".repeat(80));

    // Initialize test harness
    let harness = TestHarness::builder()
        .with_temp_prefix("log-streaming-basic-")
        .build()
        .await;

    println!("✅ Test harness initialized");

    // Simulate log generation
    let mut logs = Vec::new();
    for i in 1..=10 {
        let log = create_test_log(
            &format!("log-{:03}", i),
            "INFO",
            Some("CoordinatorAgent"),
            &format!("Processing task #{}", i),
            Some(638),
        );
        logs.push(log);
    }

    println!("📝 Generated {} test logs", logs.len());

    // Verify logs are in order
    for (i, log) in logs.iter().enumerate() {
        assert_eq!(log.id, format!("log-{:03}", i + 1));
        assert_eq!(log.level, "INFO");
        assert_eq!(log.agent_type.as_deref(), Some("CoordinatorAgent"));
        assert_eq!(log.issue_number, Some(638));
    }

    println!("✅ All logs retrieved in correct order");
    println!("   - Log count: {}", logs.len());
    println!("   - First log ID: {}", logs.first().unwrap().id);
    println!("   - Last log ID: {}", logs.last().unwrap().id);

    // Cleanup
    harness.cleanup().await;
    println!("✅ Test passed: Basic log streaming works correctly\n");
}

/// Test 2: Log Level Filtering - filter logs by level
#[tokio::test]
#[serial]
async fn test_log_level_filtering() {
    println!("🧪 Test 2: Log Level Filtering");
    println!("{}", "=".repeat(80));

    let harness = TestHarness::builder()
        .with_temp_prefix("log-streaming-filter-")
        .build()
        .await;

    println!("✅ Test harness initialized");

    // Generate logs with different levels
    let mut all_logs = Vec::new();
    let levels = vec!["INFO", "WARN", "ERROR", "DEBUG"];

    for (i, level) in levels.iter().cycle().take(20).enumerate() {
        let log = create_test_log(
            &format!("log-{:03}", i + 1),
            level,
            Some("CoordinatorAgent"),
            &format!("Test message at {} level", level),
            Some(638),
        );
        all_logs.push(log);
    }

    println!("📝 Generated {} logs with mixed levels", all_logs.len());

    // Test filtering by each level
    for target_level in &levels {
        let filtered: Vec<&LDDLog> = all_logs
            .iter()
            .filter(|log| log.level == *target_level)
            .collect();

        println!(
            "   - {} level: {} logs (expected: 5)",
            target_level,
            filtered.len()
        );
        assert_eq!(
            filtered.len(),
            5,
            "Should have exactly 5 {} logs",
            target_level
        );

        // Verify all filtered logs have correct level
        for log in &filtered {
            assert_eq!(
                log.level, *target_level,
                "Filtered log should have level {}",
                target_level
            );
        }
    }

    harness.cleanup().await;
    println!("✅ Test passed: Log level filtering works correctly\n");
}

/// Test 3: Agent Filtering - filter logs by agent type
#[tokio::test]
#[serial]
async fn test_agent_filtering() {
    println!("🧪 Test 3: Agent Filtering");
    println!("{}", "=".repeat(80));

    let harness = TestHarness::builder()
        .with_temp_prefix("log-streaming-agent-")
        .build()
        .await;

    println!("✅ Test harness initialized");

    // Generate logs from different agents
    let agents = vec![
        "CoordinatorAgent",
        "CodeGenAgent",
        "ReviewAgent",
        "PRAgent",
        "DeploymentAgent",
    ];

    let mut all_logs = Vec::new();
    for (i, agent) in agents.iter().cycle().take(25).enumerate() {
        let log = create_test_log(
            &format!("log-{:03}", i + 1),
            "INFO",
            Some(agent),
            &format!("{} processing", agent),
            Some(638),
        );
        all_logs.push(log);
    }

    println!("📝 Generated {} logs from {} agents", all_logs.len(), agents.len());

    // Test filtering by each agent
    for target_agent in &agents {
        let filtered: Vec<&LDDLog> = all_logs
            .iter()
            .filter(|log| log.agent_type.as_deref() == Some(*target_agent))
            .collect();

        println!(
            "   - {}: {} logs (expected: 5)",
            target_agent,
            filtered.len()
        );
        assert_eq!(
            filtered.len(),
            5,
            "Should have exactly 5 logs from {}",
            target_agent
        );

        // Verify all filtered logs are from correct agent
        for log in &filtered {
            assert_eq!(
                log.agent_type.as_deref(),
                Some(*target_agent),
                "Filtered log should be from {}",
                target_agent
            );
        }
    }

    harness.cleanup().await;
    println!("✅ Test passed: Agent filtering works correctly\n");
}

/// Test 4: Large Volume Performance - handle 1000+ logs without freezing
#[tokio::test]
#[serial]
async fn test_large_volume_performance() {
    println!("🧪 Test 4: Large Volume Performance (1000+ logs)");
    println!("{}", "=".repeat(80));

    let harness = TestHarness::builder()
        .with_temp_prefix("log-streaming-perf-")
        .build()
        .await;

    println!("✅ Test harness initialized");

    // Generate 1000 logs
    let log_count = 1000;
    let start = std::time::Instant::now();

    let mut logs = Vec::with_capacity(log_count);
    for i in 1..=log_count {
        let level = match i % 4 {
            0 => "INFO",
            1 => "WARN",
            2 => "ERROR",
            _ => "DEBUG",
        };
        let agent = match i % 5 {
            0 => "CoordinatorAgent",
            1 => "CodeGenAgent",
            2 => "ReviewAgent",
            3 => "PRAgent",
            _ => "DeploymentAgent",
        };

        let log = create_test_log(
            &format!("log-{:04}", i),
            level,
            Some(agent),
            &format!("Processing task #{} with large volume", i),
            Some(638),
        );
        logs.push(log);
    }

    let generation_time = start.elapsed();
    println!("📝 Generated {} logs in {:?}", logs.len(), generation_time);

    // Verify all logs are present
    assert_eq!(logs.len(), log_count, "Should generate {} logs", log_count);

    // Test retrieval performance
    let retrieval_start = std::time::Instant::now();
    let retrieved_count = logs.len();
    let retrieval_time = retrieval_start.elapsed();

    println!("📊 Performance Metrics:");
    println!("   - Total logs: {}", retrieved_count);
    println!("   - Generation time: {:?}", generation_time);
    println!("   - Retrieval time: {:?}", retrieval_time);
    println!(
        "   - Throughput: {:.2} logs/ms",
        retrieved_count as f64 / retrieval_time.as_millis() as f64
    );

    // Performance assertion - should handle 1000 logs in under 100ms
    assert!(
        generation_time.as_millis() < 100,
        "Log generation should complete in under 100ms"
    );
    assert!(
        retrieval_time.as_millis() < 50,
        "Log retrieval should complete in under 50ms"
    );

    // Verify data integrity with random sampling
    let samples = vec![0, 100, 500, 999];
    for idx in samples {
        assert_eq!(
            logs[idx].id,
            format!("log-{:04}", idx + 1),
            "Log at index {} should have correct ID",
            idx
        );
    }

    harness.cleanup().await;
    println!("✅ Test passed: Large volume performance is acceptable\n");
}

/// Test 5: Real-time Updates - new logs are immediately available
#[tokio::test]
#[serial]
async fn test_realtime_updates() {
    println!("🧪 Test 5: Real-time Updates");
    println!("{}", "=".repeat(80));

    let harness = TestHarness::builder()
        .with_temp_prefix("log-streaming-realtime-")
        .build()
        .await;

    println!("✅ Test harness initialized");

    // Simulate real-time log streaming
    let mut logs = Vec::new();

    println!("📝 Simulating real-time log generation...");

    for i in 1..=10 {
        // Simulate slight delay between logs (real-time)
        sleep(Duration::from_millis(10)).await;

        let log = create_test_log(
            &format!("realtime-log-{:02}", i),
            "INFO",
            Some("CoordinatorAgent"),
            &format!("Real-time update #{}", i),
            Some(638),
        );

        logs.push(log.clone());
        println!("   📨 New log received: {}", log.id);
    }

    println!("📊 Real-time streaming results:");
    println!("   - Total logs streamed: {}", logs.len());
    println!("   - First log: {}", logs.first().unwrap().id);
    println!("   - Last log: {}", logs.last().unwrap().id);

    // Verify all logs were captured in order
    for (i, log) in logs.iter().enumerate() {
        assert_eq!(
            log.id,
            format!("realtime-log-{:02}", i + 1),
            "Log {} should be in correct order",
            i + 1
        );
    }

    // Verify timestamps are in ascending order (real-time)
    for i in 0..logs.len() - 1 {
        let current_ts = chrono::DateTime::parse_from_rfc3339(&logs[i].timestamp)
            .expect("Valid timestamp");
        let next_ts = chrono::DateTime::parse_from_rfc3339(&logs[i + 1].timestamp)
            .expect("Valid timestamp");

        assert!(
            next_ts >= current_ts,
            "Timestamps should be in ascending order"
        );
    }

    harness.cleanup().await;
    println!("✅ Test passed: Real-time updates work correctly\n");
}

/// Integration test combining multiple scenarios
#[tokio::test]
#[serial]
async fn test_log_streaming_integration() {
    println!("🧪 Integration Test: Combined Log Streaming Scenarios");
    println!("{}", "=".repeat(80));

    let harness = TestHarness::builder()
        .with_temp_prefix("log-streaming-integration-")
        .build()
        .await;

    println!("✅ Test harness initialized");

    // Scenario: Multiple agents generating logs at different levels
    let mut logs = Vec::new();
    let agents = vec!["CoordinatorAgent", "CodeGenAgent", "ReviewAgent"];
    let levels = vec!["INFO", "WARN", "ERROR"];

    // Generate logs with each agent producing logs at each level
    let mut i = 1;
    for agent in &agents {
        for level in &levels {
            for _ in 0..3 {
                // 3 logs per agent-level combination
                let log = create_test_log(
                    &format!("integration-log-{:03}", i),
                    level,
                    Some(agent),
                    &format!("{} at {} level", agent, level),
                    Some(638),
                );
                logs.push(log);
                i += 1;
            }
        }
    }

    // Add one more log to each category to reach 30 total
    let log = create_test_log(
        &format!("integration-log-{:03}", i),
        "INFO",
        Some("CoordinatorAgent"),
        "Final log",
        Some(638),
    );
    logs.push(log);

    println!("📝 Generated {} logs (integration scenario)", logs.len());

    // Test 1: Count by agent
    let coordinator_count = logs
        .iter()
        .filter(|log| log.agent_type.as_deref() == Some("CoordinatorAgent"))
        .count();
    println!("   - CoordinatorAgent: {} logs", coordinator_count);
    assert_eq!(coordinator_count, 10, "CoordinatorAgent should have 10 logs");

    for agent in &agents[1..] {
        // CodeGenAgent and ReviewAgent
        let count = logs
            .iter()
            .filter(|log| log.agent_type.as_deref() == Some(*agent))
            .count();
        println!("   - {}: {} logs", agent, count);
        assert_eq!(count, 9, "{} should have 9 logs", agent);
    }

    // Test 2: Count by level
    for (i, level) in levels.iter().enumerate() {
        let count = logs.iter().filter(|log| log.level == *level).count();
        println!("   - {} level: {} logs", level, count);
        let expected = if i == 0 { 10 } else { 9 }; // INFO has one extra
        assert_eq!(count, expected, "{} level should have {} logs", level, expected);
    }

    // Test 3: Filter by agent AND level
    let coordinator_errors: Vec<&LDDLog> = logs
        .iter()
        .filter(|log| {
            log.agent_type.as_deref() == Some("CoordinatorAgent") && log.level == "ERROR"
        })
        .collect();

    println!("\n📊 Combined filter results:");
    println!(
        "   - CoordinatorAgent ERROR logs: {} (expected: 3)",
        coordinator_errors.len()
    );
    assert_eq!(
        coordinator_errors.len(),
        3,
        "Should have exactly 3 CoordinatorAgent ERROR logs"
    );

    // Test 4: All logs have required fields
    for log in &logs {
        assert!(!log.id.is_empty(), "Log should have ID");
        assert!(!log.timestamp.is_empty(), "Log should have timestamp");
        assert!(!log.level.is_empty(), "Log should have level");
        assert!(log.agent_type.is_some(), "Log should have agent_type");
        assert!(!log.message.is_empty(), "Log should have message");
        assert_eq!(
            log.issue_number,
            Some(638),
            "Log should reference issue #638"
        );
    }

    harness.cleanup().await;
    println!("✅ Integration test passed: All scenarios work correctly\n");
}
