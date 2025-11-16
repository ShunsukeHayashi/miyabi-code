//! Hybrid Router example - Intelligent routing between 3 providers
//!
//! Demonstrates 3-tier cost-optimized routing:
//! - Simple tasks → GPT-4o-mini ($0.15/1M)
//! - Medium tasks → Gemini Flash ($0.20/1M)
//! - Complex tasks → Claude Sonnet 4.5 ($3.00/1M)
//!
//! Run with:
//! ```bash
//! export ANTHROPIC_API_KEY="sk-ant-xxx"
//! export OPENAI_API_KEY="sk-xxx"
//! export GOOGLE_API_KEY="xxx"
//!
//! cargo run --example hybrid_router
//! ```

use miyabi_llm::{HybridRouter, LlmClient, Message};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    println!("=== Hybrid Router - Intelligent 3-Tier Routing ===\n");

    // Create hybrid router from environment variables
    let router = HybridRouter::from_env()?;

    // Test cases with different complexity levels
    let test_cases = vec![
        ("Simple: Documentation", "Add documentation comment for this function"),
        ("Simple: Typo fix", "Fix typo in the README file"),
        (
            "Medium: API implementation",
            "Implement a new REST API endpoint for user authentication",
        ),
        ("Medium: Bug fix", "Bug fix in the payment integration module"),
        ("Medium: Test writing", "Write unit tests for the struct validation logic"),
        (
            "Complex: Architecture",
            "Design a new architecture for a distributed system with high scalability",
        ),
        ("Complex: Refactoring", "Refactor the authentication system to improve security"),
        (
            "Complex: Performance",
            "Performance optimization for concurrent request handling",
        ),
    ];

    println!("Running {} test cases...\n", test_cases.len());

    for (label, prompt) in test_cases {
        println!("Test: {}", label);
        println!("Prompt: \"{}\"", prompt);

        let messages = vec![Message::user(prompt)];

        match router.chat(messages).await {
            Ok(response) => {
                // Truncate long responses
                let display_response = if response.len() > 100 {
                    format!("{}...", &response[..100])
                } else {
                    response
                };
                println!("Response: {}", display_response);
            },
            Err(e) => {
                println!("Error: {}", e);
            },
        }
        println!();
    }

    // Display cost metrics
    let metrics = router.get_metrics().await;

    println!("=== Cost Metrics ===");
    println!("Provider Breakdown:");
    println!(
        "  OpenAI (Simple):  {} requests, {} tokens",
        metrics.openai_requests, metrics.openai_tokens
    );
    println!(
        "  Google (Medium):  {} requests, {} tokens",
        metrics.google_requests, metrics.google_tokens
    );
    println!(
        "  Claude (Complex): {} requests, {} tokens",
        metrics.claude_requests, metrics.claude_tokens
    );
    println!();
    println!(
        "Total: {} requests, {} tokens",
        metrics.total_requests(),
        metrics.total_tokens()
    );
    println!();
    println!("Cost Analysis:");
    println!("  Actual cost:    ${:.4}", metrics.estimated_cost_usd);
    println!("  Pure Claude:    ${:.4}", (metrics.total_tokens() as f64 / 1_000_000.0) * 3.0);
    println!(
        "  Savings:        ${:.4} ({:.1}%)",
        metrics.cost_savings_vs_pure_claude(),
        metrics.savings_percentage()
    );

    Ok(())
}
