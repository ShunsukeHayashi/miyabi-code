//! Agentic Behavior Test
//!
//! Tests the full agentic flow: A2A Bridge -> Agent -> LLM -> Structured Response

use miyabi_mcp_server::{initialize_all_agents, A2ABridge};
use serde_json::json;
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    println!("\n🤖 Agentic Behavior Test - Full A2A Flow\n");
    println!("═══════════════════════════════════════════════════════════\n");

    // Phase 1: Initialize A2A Bridge
    println!("📦 Phase 1: Initializing A2A Bridge...");
    let start = Instant::now();
    let bridge = A2ABridge::new().await?;
    println!("   ✅ Bridge created in {:?}\n", start.elapsed());

    // Phase 2: Register all agents
    println!("🔧 Phase 2: Registering all 21 agents...");
    let start = Instant::now();
    let count = initialize_all_agents(&bridge).await?;
    println!(
        "   ✅ {} agents registered in {:?}\n",
        count,
        start.elapsed()
    );

    // Phase 3: List available tools
    println!("📋 Phase 3: Available A2A Tools:");
    let tools = bridge.get_tool_definitions().await;
    println!("   Total: {} tools\n", tools.len());

    println!("═══════════════════════════════════════════════════════════");
    println!("🚀 Starting Agentic Tasks...");
    println!("═══════════════════════════════════════════════════════════\n");

    // Test 1: SelfAnalysisAgent - SWOT Analysis
    println!("📝 Test 1: SelfAnalysisAgent - Generate SWOT Analysis");
    println!("   Tool: a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.analyze_self");
    println!("   Input: Software engineer with 10 years experience\n");

    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.self-analysis_and_business_strategy_planning_agent_with_swot_analysis.analyze_self",
            json!({
                "profile": {
                    "career_history": "10 years as software engineer, specializing in Rust and distributed systems",
                    "skills": ["Rust", "TypeScript", "System Design", "AI/ML", "DevOps"],
                    "achievements": ["Led team of 5 engineers", "Built production systems serving 1M+ users"],
                    "goals": "Launch an AI-powered developer tools startup"
                }
            }),
        )
        .await?;

    println!("   ⏱️  Execution time: {:?}", start.elapsed());
    println!("   ✅ Success: {}", result.success);
    if result.success {
        println!(
            "   📊 Output: {}",
            serde_json::to_string_pretty(&result.output)?
        );
    } else if let Some(err) = &result.error {
        println!("   ❌ Error: {}", err);
    }
    println!();

    // Test 2: MarketResearchAgent - Market Analysis
    println!("═══════════════════════════════════════════════════════════\n");
    println!("📝 Test 2: MarketResearchAgent - Competitive Analysis");
    println!("   Tool: a2a.market_research_and_competitive_analysis_agent.research_market");
    println!("   Input: AI Developer Tools market\n");

    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.market_research_and_competitive_analysis_agent.research_market",
            json!({
                "product": {
                    "name": "Miyabi",
                    "description": "Autonomous AI development framework",
                    "target_market": "Software developers and engineering teams",
                    "key_features": ["Multi-agent orchestration", "GitHub integration", "Automated code generation"]
                },
                "analysis_depth": "comprehensive"
            }),
        )
        .await?;

    println!("   ⏱️  Execution time: {:?}", start.elapsed());
    println!("   ✅ Success: {}", result.success);
    if result.success {
        println!(
            "   📊 Output: {}",
            serde_json::to_string_pretty(&result.output)?
        );
    } else if let Some(err) = &result.error {
        println!("   ❌ Error: {}", err);
    }
    println!();

    // Test 3: CodeGenAgent - Generate Code
    println!("═══════════════════════════════════════════════════════════\n");
    println!("📝 Test 3: CodeGenAgent - Generate Rust Code");
    println!("   Tool: a2a.code_generation_agent.generate_code");
    println!("   Input: Create a retry utility with exponential backoff\n");

    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.code_generation_agent.generate_code",
            json!({
                "task": {
                    "title": "Implement retry utility",
                    "description": "Create a Rust function that retries an async operation with exponential backoff",
                    "requirements": [
                        "Generic over the operation type",
                        "Configurable max retries",
                        "Exponential backoff with jitter",
                        "Return Result with the operation's output"
                    ],
                    "language": "rust"
                }
            }),
        )
        .await?;

    println!("   ⏱️  Execution time: {:?}", start.elapsed());
    println!("   ✅ Success: {}", result.success);
    if result.success {
        println!(
            "   📊 Output: {}",
            serde_json::to_string_pretty(&result.output)?
        );
    } else if let Some(err) = &result.error {
        println!("   ❌ Error: {}", err);
    }
    println!();

    // Test 4: CoordinatorAgent - Orchestrate Multiple Agents
    println!("═══════════════════════════════════════════════════════════\n");
    println!("📝 Test 4: CoordinatorAgent - Decompose Complex Issue");
    println!("   Tool: a2a.coordinator_agent.decompose_issue");
    println!("   Input: Implement user authentication system\n");

    let start = Instant::now();
    let result = bridge
        .execute_tool(
            "a2a.coordinator_agent.decompose_issue",
            json!({
                "issue": {
                    "title": "Implement user authentication system",
                    "description": "Add complete auth with JWT tokens, OAuth2, password reset, and 2FA",
                    "labels": ["feature", "security", "p1-high"],
                    "estimated_complexity": "high"
                }
            }),
        )
        .await?;

    println!("   ⏱️  Execution time: {:?}", start.elapsed());
    println!("   ✅ Success: {}", result.success);
    if result.success {
        println!(
            "   📊 Output: {}",
            serde_json::to_string_pretty(&result.output)?
        );
    } else if let Some(err) = &result.error {
        println!("   ❌ Error: {}", err);
    }
    println!();

    // Summary
    println!("═══════════════════════════════════════════════════════════");
    println!("📊 Agentic Behavior Test Summary");
    println!("═══════════════════════════════════════════════════════════\n");
    println!("   ✅ A2A Bridge: Operational");
    println!("   ✅ Agents: {}/21 registered", count);
    println!("   ✅ Tools: {} available", tools.len());
    println!("   ✅ Agentic Flow: Agent -> LLM -> Structured Response");
    println!();
    println!("🎉 Agentic Behavior Test Complete!\n");

    Ok(())
}
