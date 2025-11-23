//! T2I Single Image Generation Example
//!
//! # Usage
//!
//! ```bash
//! export BYTEPLUS_API_KEY=your_api_key_here
//! cargo run --example t2i_generate -- "a beautiful sunset over mountains" 1024 768
//! ```

use base64::{engine::general_purpose, Engine as _};
use miyabi_seedance_api::{SeedanceClient, T2IRequest};
use std::env;
use std::fs;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt().with_max_level(tracing::Level::INFO).init();

    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: {} <prompt> [size]", args[0]);
        eprintln!("\nSize options: 2K, 1080p, 720p (default: 2K)");
        eprintln!("\nExample:");
        eprintln!("  {} \"a beautiful sunset over mountains\" 2K", args[0]);
        std::process::exit(1);
    }

    let prompt = args[1].clone();
    let size = args.get(2).map(|s| s.as_str()).unwrap_or("2K");

    println!("🎨 BytePlus SEEDREAM T2I Generation");
    println!("====================================");
    println!("📝 Prompt: {}", prompt);
    println!("📐 Size: {}\n", size);

    // Get API key
    let api_key =
        env::var("BYTEPLUS_API_KEY").expect("BYTEPLUS_API_KEY environment variable not set");

    // Create client
    let client = SeedanceClient::new(api_key)?;

    // Build request
    let request = T2IRequest::new(prompt)
        .with_size(size)
        .with_response_format("b64_json".to_string());

    // Generate image
    println!("🚀 Generating image...\n");
    let response = client.generate_image(&request).await?;

    // Save image
    if let Some(image_data) = response.data.first() {
        if let Some(b64_data) = &image_data.b64_json {
            let image_bytes = general_purpose::STANDARD.decode(b64_data)?;
            let filename = "generated_image.png";
            fs::write(filename, image_bytes)?;
            println!("✅ Image saved: {}", filename);
        }
    }

    println!("\n🎉 Generation completed successfully!");

    Ok(())
}
