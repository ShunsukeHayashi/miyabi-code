//! Mac mini LLM server integration test
//!
//! This example tests connection to Mac mini running Ollama with gpt-oss:20b model.
//!
//! # Usage
//!
//! ```bash
//! # Set Mac mini IP address
//! export MAC_MINI_IP="192.168.3.27"  # or "100.88.201.67" for Tailscale
//!
//! # Run example
//! cargo run --example test_mac_mini
//! ```

use miyabi_llm::{GPTOSSProvider, LLMProvider, LLMRequest, ReasoningEffort};
use std::env;
use std::time::Instant;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    println!("=== Mac mini LLM Server Integration Test ===\n");

    // Get Mac mini IP from environment or use default
    let mac_mini_ip = env::var("MAC_MINI_IP").unwrap_or_else(|_| {
        println!("ℹ️  MAC_MINI_IP not set, using default: 192.168.3.27");
        println!("   Set with: export MAC_MINI_IP=\"your_ip_address\"\n");
        "192.168.3.27".to_string()
    });

    println!("📡 Connecting to Mac mini: {}", mac_mini_ip);
    println!("   Endpoint: http://{}:11434\n", mac_mini_ip);

    // Create provider
    let provider = GPTOSSProvider::new_mac_mini(&mac_mini_ip)?;
    println!("✅ Provider created");
    println!("   Model: {}", provider.model_name());
    println!("   Max tokens: {}\n", provider.max_tokens());

    // Test 1: Simple prompt
    println!("🧪 Test 1: Simple prompt");
    let start = Instant::now();

    let request = LLMRequest::new("Say hello in one sentence")
        .with_temperature(0.2)
        .with_max_tokens(100)
        .with_reasoning_effort(ReasoningEffort::Low);

    match provider.generate(&request).await {
        Ok(response) => {
            let elapsed = start.elapsed();
            println!("✅ Success!");
            println!("   Response: {}", response.text.trim());
            println!("   Tokens used: {}", response.tokens_used);
            println!("   Finish reason: {}", response.finish_reason);
            println!("   Elapsed: {:.2}s\n", elapsed.as_secs_f64());
        }
        Err(e) => {
            println!("❌ Failed: {}\n", e);
            return Err(e.into());
        }
    }

    // Test 2: Code generation
    println!("🧪 Test 2: Code generation (Rust)");
    let start = Instant::now();

    let request = LLMRequest::new("Write a Rust function to calculate factorial. Include function signature and implementation only, no explanations.")
        .with_temperature(0.2)
        .with_max_tokens(256)
        .with_reasoning_effort(ReasoningEffort::Medium);

    match provider.generate(&request).await {
        Ok(response) => {
            let elapsed = start.elapsed();
            println!("✅ Success!");
            println!("   Generated code:");
            println!("   {}", "-".repeat(60));
            for line in response.text.lines() {
                println!("   {}", line);
            }
            println!("   {}", "-".repeat(60));
            println!("   Tokens used: {}", response.tokens_used);
            println!("   Elapsed: {:.2}s\n", elapsed.as_secs_f64());
        }
        Err(e) => {
            println!("❌ Failed: {}\n", e);
            return Err(e.into());
        }
    }

    // Test 3: Complex reasoning
    println!("🧪 Test 3: Complex reasoning");
    let start = Instant::now();

    let request = LLMRequest::new("Explain Rust ownership in 2-3 sentences")
        .with_temperature(0.3)
        .with_max_tokens(256)
        .with_reasoning_effort(ReasoningEffort::High);

    match provider.generate(&request).await {
        Ok(response) => {
            let elapsed = start.elapsed();
            println!("✅ Success!");
            println!("   Response: {}", response.text.trim());
            println!("   Tokens used: {}", response.tokens_used);
            println!("   Elapsed: {:.2}s\n", elapsed.as_secs_f64());
        }
        Err(e) => {
            println!("❌ Failed: {}\n", e);
            return Err(e.into());
        }
    }

    println!("=== All tests passed! ===");
    println!("\n✅ Mac mini LLM server is working correctly");
    println!("   You can now integrate it into Miyabi agents\n");

    Ok(())
}
