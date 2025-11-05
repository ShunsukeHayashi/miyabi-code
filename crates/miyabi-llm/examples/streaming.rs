//! Streaming example - Real-time text generation from all providers
//!
//! Demonstrates streaming support for:
//! - Anthropic Claude (SSE)
//! - OpenAI GPT (Server-Sent Events)
//! - Google Gemini (SSE)
//!
//! Run with:
//! ```bash
//! export ANTHROPIC_API_KEY="sk-ant-xxx"
//! export OPENAI_API_KEY="sk-xxx"
//! export GOOGLE_API_KEY="xxx"
//!
//! cargo run --example streaming
//! ```

use futures::StreamExt;
use miyabi_llm::{AnthropicClient, GoogleClient, LlmStreamingClient, Message, OpenAIClient};
use std::io::{self, Write};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    println!("=== Streaming Example - All Providers ===\n");

    let prompt = "Write a short story about a robot learning to paint in exactly 3 sentences.";

    // 1. Claude Streaming
    println!("1. Anthropic Claude 3.5 Sonnet (Streaming):");
    if let Ok(claude) = AnthropicClient::from_env() {
        let messages = vec![Message::user(prompt)];
        match claude.chat_stream(messages).await {
            Ok(mut stream) => {
                print!("   ");
                io::stdout().flush()?;

                while let Some(chunk) = stream.next().await {
                    match chunk {
                        Ok(text) => {
                            print!("{}", text);
                            io::stdout().flush()?;
                        }
                        Err(e) => eprintln!("\n   Stream error: {}", e),
                    }
                }
                println!("\n");
            }
            Err(e) => println!("   Error: {}\n", e),
        }
    } else {
        println!("   Skipped (ANTHROPIC_API_KEY not set)\n");
    }

    // 2. OpenAI Streaming
    println!("2. OpenAI GPT-4o-mini (Streaming):");
    if let Ok(openai) = OpenAIClient::from_env() {
        let messages = vec![Message::user(prompt)];
        match openai.chat_stream(messages).await {
            Ok(mut stream) => {
                print!("   ");
                io::stdout().flush()?;

                while let Some(chunk) = stream.next().await {
                    match chunk {
                        Ok(text) => {
                            print!("{}", text);
                            io::stdout().flush()?;
                        }
                        Err(e) => eprintln!("\n   Stream error: {}", e),
                    }
                }
                println!("\n");
            }
            Err(e) => println!("   Error: {}\n", e),
        }
    } else {
        println!("   Skipped (OPENAI_API_KEY not set)\n");
    }

    // 3. Google Gemini Streaming
    println!("3. Google Gemini 1.5 Flash (Streaming):");
    if let Ok(google) = GoogleClient::from_env() {
        let google = google.with_flash();
        let messages = vec![Message::user(prompt)];
        match google.chat_stream(messages).await {
            Ok(mut stream) => {
                print!("   ");
                io::stdout().flush()?;

                while let Some(chunk) = stream.next().await {
                    match chunk {
                        Ok(text) => {
                            print!("{}", text);
                            io::stdout().flush()?;
                        }
                        Err(e) => eprintln!("\n   Stream error: {}", e),
                    }
                }
                println!("\n");
            }
            Err(e) => println!("   Error: {}\n", e),
        }
    } else {
        println!("   Skipped (GOOGLE_API_KEY not set)\n");
    }

    println!("=== Streaming Benefits ===");
    println!("✅ Real-time user feedback");
    println!("✅ Better perceived performance");
    println!("✅ Early cancellation support");
    println!("✅ Reduced time-to-first-token");

    Ok(())
}
