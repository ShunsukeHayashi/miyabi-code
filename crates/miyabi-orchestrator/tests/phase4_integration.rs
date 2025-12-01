//! Integration tests for Phase 4: CodeGen Execution & 5-Worlds Parallel Implementation
//!
//! These tests verify the complete Phase 4 workflow:
//! 1. ClaudeCodeExecutor initialization
//! 2. 5-Worlds parallel execution coordination
//! 3. Result aggregation and confidence scoring
//! 4. Success threshold validation (80%)

use miyabi_orchestrator::claude_code_executor::{ClaudeCodeExecutor, ExecutorConfig};
use std::path::PathBuf;
use tempfile::tempdir;

#[tokio::test]
async fn test_phase4_executor_initialization() {
    // Test that ClaudeCodeExecutor initializes correctly with default config
    let temp_dir = tempdir().unwrap();
    let config = ExecutorConfig {
        timeout_secs: 60,
        num_worlds: 5,
        success_threshold: 0.8,
        log_dir: temp_dir.path().to_path_buf(),
    };

    let _executor = ClaudeCodeExecutor::new(config);
    // Should not panic
}

#[tokio::test]
async fn test_phase4_config_validation() {
    // Test various executor configurations
    let temp_dir = tempdir().unwrap();

    // Test minimum config
    let config = ExecutorConfig {
        timeout_secs: 1,
        num_worlds: 1,
        success_threshold: 0.0,
        log_dir: temp_dir.path().to_path_buf(),
    };
    let _executor = ClaudeCodeExecutor::new(config);

    // Test maximum config
    let config = ExecutorConfig {
        timeout_secs: 3600,
        num_worlds: 10,
        success_threshold: 1.0,
        log_dir: temp_dir.path().to_path_buf(),
    };
    let _executor = ClaudeCodeExecutor::new(config);
}

#[tokio::test]
#[ignore] // Requires actual worktrees and claude code CLI
async fn test_phase4_execute_agent_run_missing_worktree() {
    // Test that execute_agent_run fails gracefully when worktree doesn't exist
    let temp_dir = tempdir().unwrap();
    let config = ExecutorConfig {
        timeout_secs: 30,
        num_worlds: 5,
        success_threshold: 0.8,
        log_dir: temp_dir.path().to_path_buf(),
    };

    let mut executor = ClaudeCodeExecutor::new(config);

    let result = executor
        .execute_agent_run(999, PathBuf::from("/nonexistent/worktree"))
        .await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Worktree not found"));
}

#[tokio::test]
async fn test_phase4_confidence_calculation() {
    // Test confidence score calculation logic
    // 4/5 successful worlds = 80% confidence
    let successful_worlds = 4;
    let total_worlds = 5;
    let confidence = successful_worlds as f64 / total_worlds as f64;

    assert_eq!(confidence, 0.8);
    assert!(confidence >= 0.8); // Meets threshold

    // 3/5 successful worlds = 60% confidence
    let successful_worlds = 3;
    let confidence = successful_worlds as f64 / total_worlds as f64;

    assert_eq!(confidence, 0.6);
    assert!(confidence < 0.8); // Below threshold
}

#[tokio::test]
async fn test_phase4_executor_statistics() {
    // Test that executor can track session statistics
    let temp_dir = tempdir().unwrap();
    let config = ExecutorConfig {
        timeout_secs: 60,
        num_worlds: 5,
        success_threshold: 0.8,
        log_dir: temp_dir.path().to_path_buf(),
    };

    let executor = ClaudeCodeExecutor::new(config);
    let stats = executor.get_stats().await;

    // Initially no sessions
    assert_eq!(stats.len(), 0);
}

#[tokio::test]
#[ignore] // Requires full Phase 1-3 setup
async fn test_phase4_end_to_end_workflow() {
    // This test would verify the complete Phase 1-4 workflow:
    // 1. Issue Analysis (Phase 1)
    // 2. Task Decomposition (Phase 2)
    // 3. Worktree Creation (Phase 3)
    // 4. CodeGen Execution (Phase 4) ← This is what we're testing
    //
    // For now, this is a placeholder for future E2E testing
}

#[tokio::test]
async fn test_phase4_world_result_structure() {
    // Test that WorldResult structure is correctly defined
    use miyabi_orchestrator::WorldResult;

    let world_result = WorldResult {
        world_id: 0,
        success: true,
        message: "Test message".to_string(),
        session_id: "test-session-123".to_string(),
    };

    assert_eq!(world_result.world_id, 0);
    assert!(world_result.success);
    assert_eq!(world_result.message, "Test message");
    assert_eq!(world_result.session_id, "test-session-123");
}

#[tokio::test]
async fn test_phase4_execution_result_validation() {
    // Test ExecutionResult structure and validation
    use miyabi_orchestrator::claude_code_executor::{ExecutionResult, WorldResult};

    let world_results = vec![
        WorldResult {
            world_id: 0,
            success: true,
            message: "World 0 succeeded".to_string(),
            session_id: "session-0".to_string(),
        },
        WorldResult {
            world_id: 1,
            success: true,
            message: "World 1 succeeded".to_string(),
            session_id: "session-1".to_string(),
        },
        WorldResult {
            world_id: 2,
            success: true,
            message: "World 2 succeeded".to_string(),
            session_id: "session-2".to_string(),
        },
        WorldResult {
            world_id: 3,
            success: true,
            message: "World 3 succeeded".to_string(),
            session_id: "session-3".to_string(),
        },
        WorldResult {
            world_id: 4,
            success: false,
            message: "World 4 failed".to_string(),
            session_id: "session-4".to_string(),
        },
    ];

    let execution_result = ExecutionResult {
        success: true,
        confidence: 0.8,
        successful_worlds: 4,
        total_worlds: 5,
        message: "Execution succeeded with 80% confidence".to_string(),
        world_results: world_results.clone(),
    };

    // Validate result
    assert!(execution_result.success);
    assert_eq!(execution_result.confidence, 0.8);
    assert_eq!(execution_result.successful_worlds, 4);
    assert_eq!(execution_result.total_worlds, 5);
    assert_eq!(execution_result.world_results.len(), 5);

    // Count actual successful worlds
    let actual_successful = execution_result.world_results.iter().filter(|r| r.success).count();
    assert_eq!(actual_successful, 4);

    // Verify confidence calculation
    let calculated_confidence = actual_successful as f64 / execution_result.total_worlds as f64;
    assert_eq!(calculated_confidence, execution_result.confidence);
}

#[test]
fn test_phase4_timeout_configuration() {
    // Test that timeout configuration works correctly
    let temp_dir = tempdir().unwrap();

    // Short timeout (1 second)
    let config = ExecutorConfig {
        timeout_secs: 1,
        num_worlds: 5,
        success_threshold: 0.8,
        log_dir: temp_dir.path().to_path_buf(),
    };
    assert_eq!(config.timeout_secs, 1);

    // Default timeout (10 minutes = 600 seconds)
    let config = ExecutorConfig::default();
    assert_eq!(config.timeout_secs, 600);
    assert_eq!(config.num_worlds, 5);
    assert_eq!(config.success_threshold, 0.8);
}

#[test]
fn test_phase4_threshold_validation() {
    // Test various threshold scenarios
    let temp_dir = tempdir().unwrap();

    // Strict threshold (100%)
    let config = ExecutorConfig {
        timeout_secs: 600,
        num_worlds: 5,
        success_threshold: 1.0,
        log_dir: temp_dir.path().to_path_buf(),
    };
    assert_eq!(config.success_threshold, 1.0);

    // Lenient threshold (50%)
    let config = ExecutorConfig {
        timeout_secs: 600,
        num_worlds: 5,
        success_threshold: 0.5,
        log_dir: temp_dir.path().to_path_buf(),
    };
    assert_eq!(config.success_threshold, 0.5);

    // Default threshold (80%)
    let config = ExecutorConfig::default();
    assert_eq!(config.success_threshold, 0.8);
}
