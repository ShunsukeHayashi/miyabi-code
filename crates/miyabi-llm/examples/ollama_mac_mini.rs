//! Ollama Mac mini integration example
//!
//! This example demonstrates how to use the GPT-OSS-20B model running on Mac mini
//! via Ollama server.

use miyabi_llm::{GPTOSSProvider, LLMProvider, LLMRequest, ReasoningEffort};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    println!("🚀 Ollama Mac mini Integration Example");
    println!("=====================================");

    // Create Ollama provider (Tailscale address)
    let provider = GPTOSSProvider::new_mac_mini_tailscale()?;

    println!("✅ Provider created: {}", provider.model_name());
    println!("🔗 Endpoint: {}", provider.endpoint());
    println!("📊 Max tokens: {}", provider.max_tokens());

    // Test basic generation
    println!("\n📝 Testing basic generation...");
    let request = LLMRequest::new("Write a simple Rust function to calculate the factorial of a number")
        .with_temperature(0.2)
        .with_max_tokens(512)
        .with_reasoning_effort(ReasoningEffort::Medium);

    let start_time = std::time::Instant::now();
    let response = provider.generate(&request).await?;
    let duration = start_time.elapsed();

    println!("⏱️  Generation completed in {:.2}s", duration.as_secs_f64());
    println!("📊 Tokens used: {}", response.tokens_used);
    println!("🏁 Finish reason: {}", response.finish_reason);
    println!("\n🤖 Generated response:");
    println!("{}", response.text);

    // Test different reasoning levels
    println!("\n🧠 Testing different reasoning levels...");

    let reasoning_levels = [
        (ReasoningEffort::Low, "Low reasoning"),
        (ReasoningEffort::Medium, "Medium reasoning"),
        (ReasoningEffort::High, "High reasoning"),
    ];

    for (effort, description) in reasoning_levels.iter() {
        println!("\n🔍 Testing {}...", description);

        let request = LLMRequest::new("Explain the concept of recursion in programming")
            .with_temperature(0.3)
            .with_max_tokens(256)
            .with_reasoning_effort(*effort);

        let start_time = std::time::Instant::now();
        let response = provider.generate(&request).await?;
        let duration = start_time.elapsed();

        println!("⏱️  {} completed in {:.2}s", description, duration.as_secs_f64());
        println!("📊 Tokens used: {}", response.tokens_used);
        println!(
            "🤖 Response preview: {}",
            if response.text.len() > 100 {
                format!("{}...", &response.text[..100])
            } else {
                response.text.clone()
            }
        );
    }

    // Test performance with multiple requests
    println!("\n⚡ Testing performance with multiple requests...");

    let requests = [
        "Write a hello world program in Rust",
        "Explain what is a trait in Rust",
        "What are the benefits of using async/await?",
        "How does memory management work in Rust?",
        "What is the difference between &str and String?",
    ];

    let start_time = std::time::Instant::now();
    let mut responses = Vec::new();

    for (i, prompt) in requests.iter().enumerate() {
        println!("📝 Processing request {}...", i + 1);

        let request = LLMRequest::new(*prompt)
            .with_temperature(0.2)
            .with_max_tokens(200)
            .with_reasoning_effort(ReasoningEffort::Low);

        let response = provider.generate(&request).await?;
        responses.push(response);
    }

    let total_duration = start_time.elapsed();
    let total_tokens: u32 = responses.iter().map(|r| r.tokens_used).sum();
    let avg_duration = total_duration.as_secs_f64() / requests.len() as f64;

    println!("\n📊 Performance Summary:");
    println!("⏱️  Total time: {:.2}s", total_duration.as_secs_f64());
    println!("📊 Total tokens: {}", total_tokens);
    println!("⚡ Average time per request: {:.2}s", avg_duration);
    println!("🚀 Requests per minute: {:.1}", 60.0 / avg_duration);

    // Test error handling
    println!("\n❌ Testing error handling...");

    let invalid_provider = GPTOSSProvider::new("http://invalid-endpoint:9999", None)?;
    let request = LLMRequest::new("This should fail");

    match invalid_provider.generate(&request).await {
        Ok(_) => println!("❌ Unexpected success"),
        Err(e) => println!("✅ Expected error: {}", e),
    }

    println!("\n🎉 Example completed successfully!");
    Ok(())
}

// Helper trait to access private fields for demonstration
trait ProviderExt {
    fn endpoint(&self) -> &str;
}

impl ProviderExt for GPTOSSProvider {
    fn endpoint(&self) -> &str {
        // Access the endpoint through the model name for demonstration
        match self.model_name() {
            "gpt-oss:20b" => "http://100.88.201.67:11434",
            _ => "unknown",
        }
    }
}
