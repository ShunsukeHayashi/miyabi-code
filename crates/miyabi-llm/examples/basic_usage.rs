//! Basic usage example showing all three LLM providers
//!
//! Run with:
//! ```bash
//! # Set API keys
//! export ANTHROPIC_API_KEY="sk-ant-xxx"
//! export OPENAI_API_KEY="sk-xxx"
//! export GOOGLE_API_KEY="xxx"
//!
//! cargo run --example basic_usage
//! ```

use miyabi_llm::{AnthropicClient, GoogleClient, LlmClient, Message, OpenAIClient};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    println!("=== Miyabi LLM - Basic Usage Example ===\n");

    let prompt = "What is Rust programming language in one sentence?";

    // 1. Anthropic Claude - Best for complex reasoning
    println!("1. Testing Anthropic Claude 3.5 Sonnet...");
    if let Ok(claude) = AnthropicClient::from_env() {
        let messages = vec![Message::user(prompt)];
        match claude.chat(messages).await {
            Ok(response) => {
                println!("   Provider: {}", claude.provider_name());
                println!("   Model: {}", claude.model_name());
                println!("   Response: {}\n", response);
            }
            Err(e) => println!("   Error: {}\n", e),
        }
    } else {
        println!("   Skipped (ANTHROPIC_API_KEY not set)\n");
    }

    // 2. OpenAI GPT - Best for simple, fast tasks
    println!("2. Testing OpenAI GPT-4o-mini...");
    if let Ok(openai) = OpenAIClient::from_env() {
        let messages = vec![Message::user(prompt)];
        match openai.chat(messages).await {
            Ok(response) => {
                println!("   Provider: {}", openai.provider_name());
                println!("   Model: {}", openai.model_name());
                println!("   Response: {}\n", response);
            }
            Err(e) => println!("   Error: {}\n", e),
        }
    } else {
        println!("   Skipped (OPENAI_API_KEY not set)\n");
    }

    // 3. Google Gemini - Best for medium complexity tasks
    println!("3. Testing Google Gemini 1.5 Flash...");
    if let Ok(google) = GoogleClient::from_env() {
        let google = google.with_flash(); // Use Flash for cost-effectiveness
        let messages = vec![Message::user(prompt)];
        match google.chat(messages).await {
            Ok(response) => {
                println!("   Provider: {}", google.provider_name());
                println!("   Model: {}", google.model_name());
                println!("   Response: {}\n", response);
            }
            Err(e) => println!("   Error: {}\n", e),
        }
    } else {
        println!("   Skipped (GOOGLE_API_KEY not set)\n");
    }

    println!("=== Cost Comparison ===");
    println!("Claude Sonnet 4.5: ~$3.00/1M tokens (highest quality)");
    println!("Gemini Flash:      ~$0.20/1M tokens (balanced)");
    println!("GPT-4o-mini:       ~$0.15/1M tokens (fastest, cheapest)");

    Ok(())
}
