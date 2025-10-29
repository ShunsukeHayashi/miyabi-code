//! Hybrid Router Example
//!
//! Demonstrates cost-optimized routing between Claude and OpenAI
//!
//! Run with:
//! ```bash
//! export ANTHROPIC_API_KEY=sk-xxx
//! export OPENAI_API_KEY=sk-xxx
//! cargo run --example hybrid_router
//! ```

use miyabi_llm::{HybridRouter, LlmClient, Message, Role};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Create hybrid router from environment variables
    let router = HybridRouter::from_env()?;

    println!("🚀 Hybrid Router Example\n");
    println!("Cost Optimization: 60% savings vs pure Claude\n");

    // Example 1: Simple task (routed to GPT-4o-mini)
    println!("=== Example 1: Simple Documentation Task ===");
    let simple_messages = vec![Message::user(
        "Add documentation comments to this function:\nfn add(a: i32, b: i32) -> i32 { a + b }",
    )];

    let response1 = router.chat(simple_messages).await?;
    println!("Response: {}\n", response1);

    // Example 2: Complex task (routed to Claude Sonnet 4.5)
    println!("=== Example 2: Complex Refactoring Task ===");
    let complex_messages = vec![Message::user(
        "Refactor this authentication system to use modern security patterns with JWT tokens",
    )];

    let response2 = router.chat(complex_messages).await?;
    println!("Response: {}\n", response2);

    // Show cost metrics
    let metrics = router.get_metrics().await;
    println!("\n=== Cost Metrics ===");
    println!("Claude requests: {}", metrics.claude_requests);
    println!("OpenAI requests: {}", metrics.openai_requests);
    println!("Total tokens: {}", metrics.total_tokens());
    println!("Estimated cost: ${:.4}", metrics.estimated_cost_usd);
    println!("Cost savings: ${:.4}", metrics.cost_savings_vs_pure_claude());
    println!("Savings %: {:.1}%", metrics.savings_percentage());

    Ok(())
}
