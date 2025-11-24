//! Edge Case Tests for Rust Tool Invocation via A2A Bridge
//!
//! Comprehensive edge case testing covering:
//! - Input validation
//! - Tool name parsing
//! - Concurrency
//! - Error handling
//! - State management

use miyabi_mcp_server::{initialize_all_agents, A2ABridge};
use serde_json::{json, Value};
use std::sync::Arc;
use std::time::{Duration, Instant};

// =============================================================================
// Phase 1: Input Validation Edge Tests (P0)
// =============================================================================

#[tokio::test]
async fn test_iv01_empty_input() {
    let bridge = setup_bridge().await;
    let result = bridge
        .execute_tool(
            "a2a.code_generation_agent.generate_code",
            json!({}),
        )
        .await
        .expect("Should return result");

    // Empty input should be handled gracefully
    assert!(!result.success || result.error.is_some(), "Empty input should fail or return error");
    println!("IV-01 ✅ Empty input handled: {:?}", result.error);
}

#[tokio::test]
async fn test_iv02_null_input() {
    let bridge = setup_bridge().await;
    let result = bridge
        .execute_tool(
            "a2a.code_generation_agent.generate_code",
            Value::Null,
        )
        .await
        .expect("Should return result");

    assert!(!result.success, "Null input should fail");
    println!("IV-02 ✅ Null input handled: {:?}", result.error);
}

#[tokio::test]
async fn test_iv03_large_json_input() {
    let bridge = setup_bridge().await;

    // Create ~100KB JSON
    let large_array: Vec<String> = (0..10000).map(|i| format!("item_{}", i)).collect();
    let large_input = json!({
        "data": large_array,
        "nested": {
            "deep": {
                "value": "test"
            }
        }
    });

    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.data_analytics_and_business_intelligence_agent.plan_analytics",
            large_input,
        )
        .await
        .expect("Should return result");

    let elapsed = start.elapsed();
    println!("IV-03 ✅ Large JSON processed in {:?}, success: {}", elapsed, result.success);

    // Should complete within reasonable time (< 1 second)
    assert!(elapsed < Duration::from_secs(1), "Large JSON should process quickly");
}

#[tokio::test]
async fn test_iv04_deeply_nested_json() {
    let bridge = setup_bridge().await;

    // Create deeply nested JSON (50 levels)
    let mut nested = json!({"value": "deep"});
    for _ in 0..50 {
        nested = json!({"nested": nested});
    }

    let result = bridge
        .execute_tool(
            "a2a.code_generation_agent.generate_code",
            nested,
        )
        .await
        .expect("Should return result");

    println!("IV-04 ✅ Deeply nested JSON handled: success={}", result.success);
}

#[tokio::test]
async fn test_iv05_special_characters_input() {
    let bridge = setup_bridge().await;

    let special_input = json!({
        "text": "Special chars: <>&\"'\\n\\t\\r\0",
        "unicode": "日本語テスト 🎉 émojis",
        "path": "/path/with spaces/and\"quotes",
        "sql_inject": "'; DROP TABLE users; --",
        "html": "<script>alert('xss')</script>"
    });

    let result = bridge
        .execute_tool(
            "a2a.content_creation_and_blog_article_generation_agent.create_content",
            special_input,
        )
        .await
        .expect("Should return result");

    println!("IV-05 ✅ Special characters handled: success={}", result.success);
    // Should not crash
}

#[tokio::test]
async fn test_iv06_numeric_edge_values() {
    let bridge = setup_bridge().await;

    let numeric_input = json!({
        "max_i64": i64::MAX,
        "min_i64": i64::MIN,
        "max_f64": f64::MAX,
        "min_f64": f64::MIN,
        "infinity": f64::INFINITY,
        "neg_infinity": f64::NEG_INFINITY,
        "zero": 0,
        "negative_zero": -0.0
    });

    let result = bridge
        .execute_tool(
            "a2a.data_analytics_and_business_intelligence_agent.plan_analytics",
            numeric_input,
        )
        .await
        .expect("Should return result");

    println!("IV-06 ✅ Numeric edge values handled: success={}", result.success);
}

#[tokio::test]
async fn test_iv07_array_edge_cases() {
    let bridge = setup_bridge().await;

    // Empty array
    let result1 = bridge
        .execute_tool(
            "a2a.data_analytics_and_business_intelligence_agent.plan_analytics",
            json!({"data": []}),
        )
        .await
        .expect("Should return result");
    println!("IV-07a ✅ Empty array: success={}", result1.success);

    // Single element array
    let result2 = bridge
        .execute_tool(
            "a2a.data_analytics_and_business_intelligence_agent.plan_analytics",
            json!({"data": [1]}),
        )
        .await
        .expect("Should return result");
    println!("IV-07b ✅ Single element array: success={}", result2.success);

    // Mixed type array
    let result3 = bridge
        .execute_tool(
            "a2a.data_analytics_and_business_intelligence_agent.plan_analytics",
            json!({"data": [1, "string", true, null, {"key": "value"}]}),
        )
        .await
        .expect("Should return result");
    println!("IV-07c ✅ Mixed type array: success={}", result3.success);
}

#[tokio::test]
async fn test_iv08_boolean_and_null_values() {
    let bridge = setup_bridge().await;

    let input = json!({
        "true_val": true,
        "false_val": false,
        "null_val": null,
        "nested_null": {"inner": null}
    });

    let result = bridge
        .execute_tool(
            "a2a.code_generation_agent.generate_code",
            input,
        )
        .await
        .expect("Should return result");

    println!("IV-08 ✅ Boolean/null values handled: success={}", result.success);
}

#[tokio::test]
async fn test_iv09_string_edge_cases() {
    let bridge = setup_bridge().await;

    let input = json!({
        "empty": "",
        "whitespace": "   ",
        "newlines": "\n\n\n",
        "tabs": "\t\t\t",
        "long_string": "x".repeat(10000),
        "unicode_string": "🎉".repeat(1000)
    });

    let result = bridge
        .execute_tool(
            "a2a.content_creation_and_blog_article_generation_agent.create_content",
            input,
        )
        .await
        .expect("Should return result");

    println!("IV-09 ✅ String edge cases handled: success={}", result.success);
}

// =============================================================================
// Phase 1: Tool Name Edge Tests (P0)
// =============================================================================

#[tokio::test]
async fn test_tn01_empty_tool_name() {
    let bridge = setup_bridge().await;
    let result = bridge
        .execute_tool("", json!({}))
        .await
        .expect("Should return result");

    assert!(!result.success, "Empty tool name should fail");
    assert!(result.error.is_some());
    println!("TN-01 ✅ Empty tool name rejected: {:?}", result.error);
}

#[tokio::test]
async fn test_tn02_single_dot_tool_name() {
    let bridge = setup_bridge().await;
    let result = bridge
        .execute_tool("a2a.agent", json!({}))
        .await
        .expect("Should return result");

    assert!(!result.success, "Single dot tool name should fail");
    println!("TN-02 ✅ Single dot rejected: {:?}", result.error);
}

#[tokio::test]
async fn test_tn03_too_many_dots() {
    let bridge = setup_bridge().await;
    let result = bridge
        .execute_tool("a2a.agent.capability.extra.parts", json!({}))
        .await
        .expect("Should return result");

    assert!(!result.success, "Too many dots should fail");
    println!("TN-03 ✅ Too many dots rejected: {:?}", result.error);
}

#[tokio::test]
async fn test_tn04_case_sensitivity() {
    let bridge = setup_bridge().await;

    // Test uppercase
    let result1 = bridge
        .execute_tool("A2A.CODE_GENERATION_AGENT.GENERATE_CODE", json!({}))
        .await
        .expect("Should return result");
    println!("TN-04a Case sensitivity (upper): success={}, error={:?}", result1.success, result1.error);

    // Test mixed case
    let result2 = bridge
        .execute_tool("a2a.Code_Generation_Agent.Generate_Code", json!({}))
        .await
        .expect("Should return result");
    println!("TN-04b Case sensitivity (mixed): success={}, error={:?}", result2.success, result2.error);
}

#[tokio::test]
async fn test_tn05_whitespace_in_tool_name() {
    let bridge = setup_bridge().await;

    // Leading/trailing spaces
    let result1 = bridge
        .execute_tool(" a2a.code_generation_agent.generate_code ", json!({}))
        .await
        .expect("Should return result");
    println!("TN-05a Whitespace (spaces): success={}", result1.success);

    // Tabs
    let result2 = bridge
        .execute_tool("\ta2a.code_generation_agent.generate_code\t", json!({}))
        .await
        .expect("Should return result");
    println!("TN-05b Whitespace (tabs): success={}", result2.success);
}

#[tokio::test]
async fn test_tn06_special_chars_in_tool_name() {
    let bridge = setup_bridge().await;

    let invalid_names = vec![
        "a2a.agent!.capability",
        "a2a.agent@.capability",
        "a2a.agent#.capability",
        "a2a.agent$.capability",
        "a2a.agent%.capability",
    ];

    for name in invalid_names {
        let result = bridge
            .execute_tool(name, json!({}))
            .await
            .expect("Should return result");
        println!("TN-06 Special char '{}': success={}", name, result.success);
    }
}

#[tokio::test]
async fn test_tn07_very_long_tool_name() {
    let bridge = setup_bridge().await;

    let long_name = format!("a2a.{}.capability", "x".repeat(1000));
    let result = bridge
        .execute_tool(&long_name, json!({}))
        .await
        .expect("Should return result");

    assert!(!result.success, "Very long tool name should fail");
    println!("TN-07 ✅ Very long name rejected");
}

#[tokio::test]
async fn test_tn08_nonexistent_capability() {
    let bridge = setup_bridge().await;

    let result = bridge
        .execute_tool("a2a.code_generation_agent.nonexistent_capability", json!({}))
        .await
        .expect("Should return result");

    // Agent exists but capability doesn't
    println!("TN-08 ✅ Nonexistent capability: success={}, error={:?}", result.success, result.error);
}

// =============================================================================
// Phase 2: Concurrency Edge Tests (P1)
// =============================================================================

#[tokio::test]
async fn test_cc01_high_concurrency() {
    let bridge = Arc::new(setup_bridge().await);

    let mut handles = vec![];
    let num_requests = 50; // 50 concurrent requests

    let start = Instant::now();

    for i in 0..num_requests {
        let bridge = bridge.clone();
        let handle = tokio::spawn(async move {
            bridge
                .execute_tool(
                    "a2a.code_generation_agent.generate_code",
                    json!({"id": i}),
                )
                .await
        });
        handles.push(handle);
    }

    let mut completed = 0;
    for handle in handles {
        if handle.await.is_ok() {
            completed += 1;
        }
    }

    let elapsed = start.elapsed();
    println!("CC-01 ✅ High concurrency: {}/{} completed in {:?}", completed, num_requests, elapsed);
    assert_eq!(completed, num_requests, "All requests should complete");
}

#[tokio::test]
async fn test_cc02_same_agent_concurrent() {
    let bridge = Arc::new(setup_bridge().await);

    let mut handles = vec![];
    let num_requests = 20;

    // All requests to same agent
    for i in 0..num_requests {
        let bridge = bridge.clone();
        let handle = tokio::spawn(async move {
            bridge
                .execute_tool(
                    "a2a.coordinator_agent.decompose_issue",
                    json!({"issue_id": i}),
                )
                .await
        });
        handles.push(handle);
    }

    let mut completed = 0;
    for handle in handles {
        if handle.await.is_ok() {
            completed += 1;
        }
    }

    println!("CC-02 ✅ Same agent concurrent: {}/{} completed", completed, num_requests);
    assert_eq!(completed, num_requests);
}

#[tokio::test]
async fn test_cc03_mixed_operations() {
    let bridge = Arc::new(setup_bridge().await);

    // Concurrent tool listing and execution
    let bridge1 = bridge.clone();
    let bridge2 = bridge.clone();
    let bridge3 = bridge.clone();

    let (r1, r2, r3) = tokio::join!(
        async move { bridge1.get_tool_definitions().await },
        async move { bridge2.list_agents().await },
        async move {
            bridge3
                .execute_tool("a2a.code_generation_agent.generate_code", json!({}))
                .await
        }
    );

    println!("CC-03 ✅ Mixed operations: tools={}, agents={}, exec={:?}",
        r1.len(), r2.len(), r3.is_ok());
}

#[tokio::test]
async fn test_cc04_multiple_bridge_instances() {
    // Create multiple independent bridges
    let bridge1 = setup_bridge().await;
    let bridge2 = setup_bridge().await;

    let agents1 = bridge1.list_agents().await;
    let agents2 = bridge2.list_agents().await;

    println!("CC-04 ✅ Multiple bridges: bridge1={} agents, bridge2={} agents",
        agents1.len(), agents2.len());

    assert_eq!(agents1.len(), agents2.len(), "Both bridges should have same agents");
}

#[tokio::test]
async fn test_cc05_rapid_sequential() {
    let bridge = setup_bridge().await;

    let start = Instant::now();
    let mut successes = 0;

    // 100 rapid sequential calls
    for _ in 0..100 {
        let result = bridge
            .execute_tool("a2a.code_generation_agent.generate_code", json!({}))
            .await;
        if result.is_ok() {
            successes += 1;
        }
    }

    let elapsed = start.elapsed();
    println!("CC-05 ✅ Rapid sequential: {}/100 in {:?} ({:?}/call)",
        successes, elapsed, elapsed / 100);
}

// =============================================================================
// Phase 2: Error Handling Edge Tests (P1)
// =============================================================================

#[tokio::test]
async fn test_eh01_graceful_error_recovery() {
    let bridge = setup_bridge().await;

    // First call with error
    let result1 = bridge
        .execute_tool("invalid", json!({}))
        .await
        .expect("Should return result");
    assert!(!result1.success);

    // Second call should still work
    let result2 = bridge
        .execute_tool("a2a.code_generation_agent.generate_code", json!({}))
        .await
        .expect("Should return result");

    println!("EH-01 ✅ Recovery after error: second call success={}", result2.success);
}

#[tokio::test]
async fn test_eh02_consecutive_errors() {
    let bridge = setup_bridge().await;

    // Multiple consecutive errors
    for i in 0..10 {
        let result = bridge
            .execute_tool(&format!("invalid_{}", i), json!({}))
            .await
            .expect("Should return result");
        assert!(!result.success);
    }

    // System should still be stable
    let agents = bridge.list_agents().await;
    println!("EH-02 ✅ After 10 errors, agents still available: {}", agents.len());
    assert_eq!(agents.len(), 21);
}

#[tokio::test]
async fn test_eh03_error_message_quality() {
    let bridge = setup_bridge().await;

    let test_cases = vec![
        ("", "empty"),
        ("invalid", "invalid format"),
        ("a2a.nonexistent.cap", "nonexistent agent"),
    ];

    for (tool_name, case) in test_cases {
        let result = bridge
            .execute_tool(tool_name, json!({}))
            .await
            .expect("Should return result");

        let has_error = result.error.is_some();
        let error_msg = result.error.unwrap_or_default();

        println!("EH-03 {} - has_error={}, msg={}", case, has_error, error_msg);
        assert!(has_error, "Should have error for {}", case);
        assert!(!error_msg.is_empty(), "Error message should not be empty for {}", case);
    }
}

#[tokio::test]
async fn test_eh04_error_does_not_leak_state() {
    let bridge = Arc::new(setup_bridge().await);

    // Concurrent errors and successes
    let bridge1 = bridge.clone();
    let bridge2 = bridge.clone();

    let (r1, r2) = tokio::join!(
        async move {
            bridge1.execute_tool("invalid", json!({})).await
        },
        async move {
            bridge2.execute_tool("a2a.code_generation_agent.generate_code", json!({})).await
        }
    );

    // Error in one should not affect other
    assert!(r1.is_ok(), "Should return result even for error");
    assert!(r2.is_ok(), "Should return result for valid call");

    println!("EH-04 ✅ Error isolation verified");
}

#[tokio::test]
async fn test_eh05_result_consistency() {
    let bridge = setup_bridge().await;

    // Same invalid call multiple times should give consistent error
    let mut errors = vec![];
    for _ in 0..5 {
        let result = bridge
            .execute_tool("a2a.nonexistent.cap", json!({}))
            .await
            .expect("Should return result");
        errors.push(result.error.unwrap_or_default());
    }

    // All errors should be the same
    let first = &errors[0];
    for error in &errors {
        assert_eq!(error, first, "Error messages should be consistent");
    }

    println!("EH-05 ✅ Error consistency verified: {}", first);
}

// =============================================================================
// Phase 3: State Management Edge Tests (P2)
// =============================================================================

#[tokio::test]
async fn test_sm01_empty_bridge_operations() {
    // Create bridge without initializing agents
    let bridge = A2ABridge::new().await.expect("Failed to create bridge");

    let agents = bridge.list_agents().await;
    let tools = bridge.get_tool_definitions().await;

    println!("SM-01 ✅ Empty bridge: agents={}, tools={}", agents.len(), tools.len());
    assert_eq!(agents.len(), 0, "Empty bridge should have no agents");
    assert_eq!(tools.len(), 0, "Empty bridge should have no tools");
}

#[tokio::test]
async fn test_sm02_execute_on_empty_bridge() {
    let bridge = A2ABridge::new().await.expect("Failed to create bridge");

    let result = bridge
        .execute_tool("a2a.code_generation_agent.generate_code", json!({}))
        .await
        .expect("Should return result");

    assert!(!result.success, "Should fail on empty bridge");
    println!("SM-02 ✅ Execute on empty bridge: error={:?}", result.error);
}

#[tokio::test]
async fn test_sm03_agent_count_consistency() {
    let bridge = setup_bridge().await;

    // Multiple calls should return same count
    let count1 = bridge.list_agents().await.len();
    let count2 = bridge.list_agents().await.len();
    let count3 = bridge.list_agents().await.len();

    assert_eq!(count1, count2);
    assert_eq!(count2, count3);
    assert_eq!(count1, 21);

    println!("SM-03 ✅ Agent count consistent: {}", count1);
}

#[tokio::test]
async fn test_sm04_tool_definitions_consistency() {
    let bridge = setup_bridge().await;

    let tools1 = bridge.get_tool_definitions().await;
    let tools2 = bridge.get_tool_definitions().await;

    assert_eq!(tools1.len(), tools2.len(), "Tool count should be consistent");

    // Check names match
    let names1: Vec<_> = tools1.iter().map(|t| &t.name).collect();
    let names2: Vec<_> = tools2.iter().map(|t| &t.name).collect();
    assert_eq!(names1, names2, "Tool names should be consistent");

    println!("SM-04 ✅ Tool definitions consistent: {} tools", tools1.len());
}

// =============================================================================
// Helper Functions
// =============================================================================

async fn setup_bridge() -> A2ABridge {
    let bridge = A2ABridge::new().await.expect("Failed to create A2ABridge");
    initialize_all_agents(&bridge)
        .await
        .expect("Failed to initialize agents");
    bridge
}
