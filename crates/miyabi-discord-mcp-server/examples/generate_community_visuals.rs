//! Example: Generate Miyabi Community visual assets using ARK API
//!
//! Usage:
//! ```
//! ARK_API_KEY=xxx cargo run --example generate_community_visuals
//! ```

use clap::Parser;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Parser)]
struct Args {
    /// ARK API Key
    #[arg(long)]
    api_key: Option<String>,

    /// Output directory for generated images
    #[arg(long, default_value = "./generated_visuals")]
    output_dir: String,
}

#[derive(Serialize, Debug)]
struct ImageGenerationRequest {
    model: String,
    prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    image: Option<String>,
    sequential_image_generation: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    sequential_image_generation_options: Option<SequentialOptions>,
    response_format: String,
    size: String,
    stream: bool,
    watermark: bool,
}

#[derive(Serialize, Debug)]
struct SequentialOptions {
    max_images: u32,
}

#[derive(Deserialize, Debug)]
struct ImageGenerationResponse {
    data: Vec<ImageData>,
}

#[derive(Deserialize, Debug)]
struct ImageData {
    url: String,
}

async fn generate_image(
    client: &reqwest::Client,
    api_key: &str,
    prompt: &str,
    max_images: Option<u32>,
) -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let request = ImageGenerationRequest {
        model: "seedream-4-0-250828".to_string(),
        prompt: prompt.to_string(),
        image: None,
        sequential_image_generation: if max_images.is_some() {
            "auto".to_string()
        } else {
            "disabled".to_string()
        },
        sequential_image_generation_options: max_images
            .map(|max| SequentialOptions { max_images: max }),
        response_format: "url".to_string(),
        size: "2K".to_string(),
        stream: false,
        watermark: true,
    };

    println!("📤 Request: {}", prompt);
    println!("   Model: seedream-4-0-250828");
    println!("   Max images: {:?}", max_images);

    let response = client
        .post("https://ark.ap-southeast.bytepluses.com/api/v3/images/generations")
        .header("Content-Type", "application/json")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&request)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await?;
        return Err(format!("API Error {}: {}", status, text).into());
    }

    let result: ImageGenerationResponse = response.json().await?;
    let urls: Vec<String> = result.data.into_iter().map(|d| d.url).collect();

    println!("   ✅ Generated {} image(s)", urls.len());
    for (i, url) in urls.iter().enumerate() {
        println!("      [{}] {}", i + 1, url);
    }

    Ok(urls)
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let api_key = args
        .api_key
        .or_else(|| env::var("ARK_API_KEY").ok())
        .expect("ARK_API_KEY not found");

    let client = reqwest::Client::new();

    println!("🎨 Miyabi Community Visual Asset Generation");
    println!("{}", "=".repeat(60));

    // 1. Miyabiちゃん - Main mascot character
    println!("\n🌸 Generating Miyabiちゃん (Main Mascot)...");
    let miyabi_prompt =
        "A cute Japanese anime-style AI assistant mascot character named 'Miyabi-chan'. \
        She has a friendly, intelligent, and helpful appearance. \
        Wearing a modern tech-inspired outfit with purple and blue gradient colors. \
        Has short bob-cut hair with digital circuit patterns. \
        Holding a holographic tablet. \
        Chibi style, kawaii, clean background, professional digital art, \
        suitable for Discord server icon, 1024x1024 resolution.";

    let miyabi_urls = generate_image(&client, &api_key, miyabi_prompt, None).await?;
    println!("   📥 Miyabiちゃん URL: {}", miyabi_urls[0]);

    // Small delay to avoid rate limiting
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    // 2. Agent Characters - Generate 6 agent mascots in sequence
    println!("\n🤖 Generating 6 Coding Agent Characters...");
    let agent_prompt = "Create a series of 6 cute chibi anime-style mascot characters representing different coding agents. \
        Each character should have a unique color scheme and personality:\n\
        1. しきるん (Coordinator) - Purple, organized, leadership vibe, holding a clipboard\n\
        2. つくるん (CodeGen) - Blue, creative, holding a magic wand with code symbols\n\
        3. めだまん (Review) - Green, observant, wearing glasses, holding a magnifying glass\n\
        4. はこぶん (Deployment) - Orange, energetic, wearing a delivery cap, holding packages\n\
        5. つなぐん (PR Agent) - Pink, friendly, holding connection symbols\n\
        6. みつけるん (Issue Agent) - Yellow, investigative, holding a detective badge\n\n\
        All characters should be in consistent chibi anime art style, clean backgrounds, \
        suitable for Discord channel icons, professional digital art.";

    let agent_urls = generate_image(&client, &api_key, agent_prompt, Some(6)).await?;

    println!("\n📥 Agent Character URLs:");
    let agent_names = ["しきるん (Coordinator)",
        "つくるん (CodeGen)",
        "めだまん (Review)",
        "はこぶん (Deployment)",
        "つなぐん (PR Agent)",
        "みつけるん (Issue Agent)"];
    for (i, (name, url)) in agent_names.iter().zip(agent_urls.iter()).enumerate() {
        println!("   [{}] {}: {}", i + 1, name, url);
    }

    // Small delay
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

    // 3. Community Banner
    println!("\n🎨 Generating Community Banner...");
    let banner_prompt = "A professional Discord server banner for 'Miyabi Community' - \
        an AI-powered development automation platform. \
        Modern tech aesthetic with purple-blue gradient. \
        Include abstract code symbols, circuit patterns, and digital elements. \
        Text: 'Miyabi Community' in elegant modern font. \
        Subtitle: 'AI-Powered Development Automation'. \
        Wide banner format 1920x1080, clean, professional, futuristic style.";

    let banner_urls = generate_image(&client, &api_key, banner_prompt, None).await?;
    println!("   📥 Banner URL: {}", banner_urls[0]);

    // Summary
    println!("\n{}", "=".repeat(60));
    println!("🎊 Visual Asset Generation Complete!");
    println!("{}", "=".repeat(60));
    println!("\n✅ Generated Assets:");
    println!("   - Miyabiちゃん (Main Mascot): 1 image");
    println!("   - Agent Characters: 6 images");
    println!("   - Community Banner: 1 image");
    println!("   Total: 8 images\n");

    println!("📝 Next Steps:");
    println!("   1. Download images from the URLs above");
    println!("   2. Upload Miyabiちゃん as Discord server icon");
    println!("   3. Upload banner as server banner");
    println!("   4. Use agent characters for channel icons");

    Ok(())
}
