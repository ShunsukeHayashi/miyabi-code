//! Claude Sonnet 4.5 Direct Test
//!
//! This example tests direct LLM invocation with Claude Sonnet 4.5

use miyabi_llm_anthropic::AnthropicClient;
use miyabi_llm_core::{LlmClient, Message, Role};

// Note: LlmClient trait must be in scope for the complete() method

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("\n🚀 Claude Sonnet 4.5 Direct LLM Test\n");

    // Create Anthropic client from environment
    let client = AnthropicClient::from_env()?
        .with_model("claude-sonnet-4-5-20250929".to_string())
        .with_max_tokens(1024);

    println!("✅ AnthropicClient created with model: claude-sonnet-4-5-20250929\n");

    // Test 1: Simple completion
    println!("📝 Test 1: Simple math");
    let messages = vec![Message {
        role: Role::User,
        content: "What is 2+2? Reply with just the number.".to_string(),
    }];

    let start = std::time::Instant::now();
    let response = client.chat(messages).await?;
    println!("   Response: {}", response.trim());
    println!("   Time: {:?}\n", start.elapsed());

    // Test 2: Code generation
    println!("📝 Test 2: Rust code generation");
    let messages = vec![
        Message {
            role: Role::User,
            content: "Write a Rust function to calculate factorial. Just the function, no explanation, no markdown.".to_string(),
        }
    ];

    let start = std::time::Instant::now();
    let response = client.chat(messages).await?;
    println!("   Response:\n{}", response);
    println!("   Time: {:?}\n", start.elapsed());

    // Test 3: JSON output
    println!("📝 Test 3: Structured JSON output");
    let messages = vec![
        Message {
            role: Role::User,
            content: r#"Output a JSON object with these fields: name, role, skills (array). Use "Miyabi Agent" as name, "Code Generator" as role, and ["Rust", "TypeScript", "AI"] as skills. Only output the JSON, no markdown."#.to_string(),
        }
    ];

    let start = std::time::Instant::now();
    let response = client.chat(messages).await?;
    println!("   Response: {}", response.trim());
    println!("   Time: {:?}\n", start.elapsed());

    // Parse and validate JSON
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&response) {
        println!("   ✅ Valid JSON parsed successfully");
        if let Some(name) = json.get("name") {
            println!("   Name: {}", name);
        }
    }

    println!("\n🎉 All tests completed successfully!\n");
    Ok(())
}
