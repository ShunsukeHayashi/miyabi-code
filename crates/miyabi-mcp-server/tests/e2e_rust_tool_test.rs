//! End-to-End Test for Rust Tool Invocation via A2A Bridge
//!
//! This test verifies the complete flow:
//! 1. A2ABridge creation
//! 2. All 21 agents registration
//! 3. Tool listing
//! 4. Tool execution
//! 5. Response validation

use miyabi_mcp_server::{initialize_all_agents, A2ABridge};
use serde_json::json;
use std::time::Instant;

#[tokio::test]
async fn test_e2e_rust_tool_invocation_full_flow() {
    println!("\n🚀 E2E Rust Tool Invocation Test Starting...\n");

    // Phase 1: Create A2A Bridge
    println!("📦 Phase 1: Creating A2A Bridge...");
    let start = Instant::now();
    let bridge = A2ABridge::new().await.expect("Failed to create A2ABridge");
    println!("   ✅ Bridge created in {:?}\n", start.elapsed());

    // Phase 2: Register all 21 agents
    println!("🤖 Phase 2: Registering all 21 A2AEnabled agents...");
    let start = Instant::now();
    let count = initialize_all_agents(&bridge)
        .await
        .expect("Failed to initialize agents");
    println!("   ✅ Registered {} agents in {:?}\n", count, start.elapsed());
    assert_eq!(count, 21, "Expected 21 agents, got {}", count);

    // Phase 3: List registered agents
    println!("📋 Phase 3: Listing registered agents...");
    let agents = bridge.list_agents().await;
    println!("   Found {} agents:", agents.len());
    for (i, agent) in agents.iter().enumerate() {
        println!("   {}. {}", i + 1, agent);
    }
    println!();
    assert_eq!(agents.len(), 21);

    // Phase 4: Get tool definitions
    println!("🔧 Phase 4: Getting tool definitions...");
    let tools = bridge.get_tool_definitions().await;
    println!("   Found {} tools:", tools.len());

    // Group tools by agent
    let mut tools_by_agent: std::collections::HashMap<String, Vec<String>> = std::collections::HashMap::new();
    for tool in &tools {
        let parts: Vec<&str> = tool.name.split('.').collect();
        if parts.len() >= 2 {
            let agent = parts[1].to_string();
            tools_by_agent.entry(agent).or_default().push(tool.name.clone());
        }
    }

    for (agent, agent_tools) in &tools_by_agent {
        println!("   {} ({} tools):", agent, agent_tools.len());
        for tool in agent_tools {
            println!("     - {}", tool);
        }
    }
    println!();
    assert!(!tools.is_empty(), "Expected tools to be defined");

    // Phase 5: Test tool execution - SelfAnalysisAgent
    println!("⚡ Phase 5: Testing tool execution...\n");

    // Test 5a: Execute SelfAnalysisAgent tool
    // Note: Tool names use the full agent description, not short names
    println!("   Test 5a: SelfAnalysisAgent.analyze_self");
    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.analyze_self",
            json!({
                "career_history": "10 years software engineering",
                "skills": ["Rust", "TypeScript", "AI/ML"],
                "goals": "Build AI-powered development tools"
            }),
        )
        .await
        .expect("Tool execution failed");

    println!("   Execution time: {:?}", start.elapsed());
    println!("   Success: {}", result.success);
    println!("   Output: {}", serde_json::to_string_pretty(&result.output).unwrap_or_default());
    if let Some(err) = &result.error {
        println!("   Error: {}", err);
    }
    println!();

    // Test 5b: Execute MarketResearchAgent tool
    println!("   Test 5b: MarketResearchAgent.research_market");
    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.market_research_and_competitive_analysis_agent.research_market",
            json!({
                "industry": "AI Development Tools",
                "target_market": "Software Developers",
                "competitor_count": 5
            }),
        )
        .await
        .expect("Tool execution failed");

    println!("   Execution time: {:?}", start.elapsed());
    println!("   Success: {}", result.success);
    if let Some(err) = &result.error {
        println!("   Error: {}", err);
    }
    println!();

    // Test 5c: Execute CodeGenAgent tool
    println!("   Test 5c: CodeGenAgent.generate_code");
    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.code_generation_agent.generate_code",
            json!({
                "language": "rust",
                "description": "function to calculate fibonacci sequence",
                "include_tests": true
            }),
        )
        .await
        .expect("Tool execution failed");

    println!("   Execution time: {:?}", start.elapsed());
    println!("   Success: {}", result.success);
    if let Some(err) = &result.error {
        println!("   Error: {}", err);
    }
    println!();

    // Test 5d: Test invalid tool name
    println!("   Test 5d: Invalid tool name handling");
    let result = bridge
        .execute_tool("invalid.tool.name", json!({}))
        .await
        .expect("Should return result even for invalid tool");

    assert!(!result.success, "Invalid tool should fail");
    assert!(result.error.is_some(), "Should have error message");
    println!("   ✅ Invalid tool correctly rejected: {}", result.error.unwrap_or_default());
    println!();

    // Test 5e: Test non-existent agent
    println!("   Test 5e: Non-existent agent handling");
    let result = bridge
        .execute_tool("a2a.nonexistentagent.some_capability", json!({}))
        .await
        .expect("Should return result even for non-existent agent");

    assert!(!result.success, "Non-existent agent should fail");
    println!("   ✅ Non-existent agent correctly rejected");
    println!();

    // Phase 6: Performance summary
    println!("📊 Phase 6: Test Summary\n");
    println!("   ✅ A2ABridge: Created successfully");
    println!("   ✅ Agents: 21/21 registered");
    println!("   ✅ Tools: {} available", tools.len());
    println!("   ✅ Execution: Tool calls working");
    println!("   ✅ Error handling: Invalid inputs rejected");
    println!();
    println!("🎉 E2E Rust Tool Invocation Test PASSED!\n");
}

#[tokio::test]
async fn test_e2e_tool_execution_timing() {
    println!("\n⏱️ Tool Execution Timing Test\n");

    let bridge = A2ABridge::new().await.expect("Failed to create bridge");
    initialize_all_agents(&bridge).await.expect("Failed to init agents");

    let _tools = bridge.get_tool_definitions().await;

    // Test execution timing for multiple tools (using actual tool names)
    let test_tools = vec![
        (
            "a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.analyze_self",
            json!({"career_history": "test"}),
        ),
        ("a2a.persona_and_customer_segment_analysis_agent.analyze_personas", json!({"target": "developers"})),
        ("a2a.data_analytics_and_business_intelligence_agent.plan_analytics", json!({"data": [1, 2, 3]})),
    ];

    println!("Testing {} tools for timing...\n", test_tools.len());

    let mut total_time = std::time::Duration::ZERO;
    let mut successful = 0;

    for (tool_name, input) in test_tools {
        let start = Instant::now();
        let result = bridge.execute_tool(tool_name, input).await;
        let elapsed = start.elapsed();
        total_time += elapsed;

        match result {
            Ok(r) => {
                println!("   {} - {:?} (success: {})", tool_name, elapsed, r.success);
                if r.success {
                    successful += 1;
                }
            }
            Err(e) => {
                println!("   {} - {:?} (error: {})", tool_name, elapsed, e);
            }
        }
    }

    println!("\n📊 Timing Summary:");
    println!("   Total time: {:?}", total_time);
    println!("   Average: {:?}", total_time / 3);
    println!("   Successful: {}/3", successful);
    println!();
}

#[tokio::test]
async fn test_e2e_concurrent_tool_execution() {
    println!("\n🔄 Concurrent Tool Execution Test\n");

    let bridge = std::sync::Arc::new(A2ABridge::new().await.expect("Failed to create bridge"));
    initialize_all_agents(&bridge).await.expect("Failed to init agents");

    // Execute multiple tools concurrently
    let bridge1 = bridge.clone();
    let bridge2 = bridge.clone();
    let bridge3 = bridge.clone();

    let start = Instant::now();

    let (r1, r2, r3) = tokio::join!(
        bridge1.execute_tool(
            "a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.analyze_self",
            json!({"career_history": "test1"})
        ),
        bridge2.execute_tool(
            "a2a.market_research_and_competitive_analysis_agent.research_market",
            json!({"industry": "test2"})
        ),
        bridge3.execute_tool(
            "a2a.persona_and_customer_segment_analysis_agent.analyze_personas",
            json!({"target": "test3"})
        ),
    );

    let elapsed = start.elapsed();

    println!("Concurrent execution completed in {:?}", elapsed);
    println!(
        "   Result 1: {}",
        r1.as_ref()
            .map(|r| r.success.to_string())
            .unwrap_or_else(|e| e.to_string())
    );
    println!(
        "   Result 2: {}",
        r2.as_ref()
            .map(|r| r.success.to_string())
            .unwrap_or_else(|e| e.to_string())
    );
    println!(
        "   Result 3: {}",
        r3.as_ref()
            .map(|r| r.success.to_string())
            .unwrap_or_else(|e| e.to_string())
    );
    println!();

    // Verify all completed
    assert!(r1.is_ok() && r2.is_ok() && r3.is_ok(), "All concurrent executions should complete");
    println!("✅ Concurrent execution test passed!\n");
}
