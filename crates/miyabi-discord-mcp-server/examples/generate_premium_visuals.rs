//! Example: Generate premium UI/UX focused visuals for Miyabi Community
//!
//! Usage:
//! ```
//! ARK_API_KEY=xxx cargo run --example generate_premium_visuals
//! ```

use clap::Parser;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Parser)]
struct Args {
    /// ARK API Key
    #[arg(long)]
    api_key: Option<String>,
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
    title: &str,
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

    println!("\n{}", "=".repeat(70));
    println!("🎨 {}", title);
    println!("{}", "=".repeat(70));
    println!("📝 Prompt:");
    println!("{}", prompt);
    println!("\n⚙️  Settings:");
    println!("   Model: seedream-4-0-250828");
    println!("   Size: 2K");
    println!("   Max images: {:?}", max_images.unwrap_or(1));

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

    println!("\n✅ Generation Complete!");
    println!("   Generated {} image(s)", urls.len());
    for (i, url) in urls.iter().enumerate() {
        println!("\n   📥 Image #{}: {}", i + 1, url);
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

    println!("\n{}", "▓".repeat(70));
    println!("🎨 Miyabi Community - Premium Visual Asset Generation");
    println!("   UI/UX Focused Design System");
    println!("{}", "▓".repeat(70));

    // Design System Definition
    println!("\n📐 Design System:");
    println!("   • Primary Color: #9B59B6 (Purple)");
    println!("   • Secondary Color: #3498DB (Blue)");
    println!("   • Accent: #E91E63 (Pink)");
    println!("   • Typography: Modern Sans-serif");
    println!("   • Style: Flat Design 2.0 with subtle gradients");
    println!("   • Accessibility: WCAG 2.1 AA compliant");

    // 1. Miyabiちゃん - Premium Mascot
    let miyabi_prompt = "\
A professional UI/UX mascot design for 'Miyabi-chan', an AI assistant character. \
Design requirements:\n\
\n\
**Visual Design**:\n\
- Modern flat design 2.0 aesthetic with subtle depth\n\
- Primary color: #9B59B6 (purple) gradient to #8E44AD (darker purple)\n\
- Secondary elements: #3498DB (blue) for tech elements\n\
- Clean vector-style illustration, suitable for scaling\n\
- Soft shadows for depth (not harsh drop shadows)\n\
\n\
**Character Design**:\n\
- Friendly, approachable anime-style chibi character\n\
- Short purple bob-cut hair with slight gradient\n\
- Wearing modern tech-inspired outfit (not overly complex)\n\
- Holding a holographic tablet with code interface\n\
- Confident, helpful expression\n\
- White/light background for versatility\n\
\n\
**UI/UX Considerations**:\n\
- High contrast for accessibility (WCAG AA)\n\
- Scalable from 128x128 to 1024x1024\n\
- Recognizable at small sizes\n\
- Professional yet friendly\n\
- Gender-neutral appeal\n\
\n\
**Technical Specs**:\n\
- Square format (1:1 ratio)\n\
- Clean edges for icon use\n\
- Transparent or white background\n\
- Professional digital art style\n\
- Suitable for Discord server icon";

    let miyabi_urls = generate_image(
        &client,
        &api_key,
        miyabi_prompt,
        "Premium Mascot: Miyabiちゃん",
        None,
    )
    .await?;

    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // 2. Design System Visual Assets
    let design_system_prompt = "\
Create a professional design system visual guide for 'Miyabi Community'. \
Include the following in a clean, organized layout:\n\
\n\
**Layout Structure** (Grid-based):\n\
1. Logo lockup variations (horizontal, vertical, icon-only)\n\
2. Color palette swatches with hex codes:\n\
   - Primary: #9B59B6 (Purple)\n\
   - Secondary: #3498DB (Blue)\n\
   - Accent: #E91E63 (Pink)\n\
   - Neutral: #34495E (Dark gray), #ECF0F1 (Light gray)\n\
3. Typography hierarchy (3 levels: H1, H2, Body)\n\
4. UI components preview:\n\
   - Button styles (primary, secondary, ghost)\n\
   - Card components\n\
   - Icon style guide\n\
5. Spacing system (8pt grid)\n\
\n\
**Visual Style**:\n\
- Modern, professional, minimalist\n\
- Flat Design 2.0 with subtle gradients\n\
- Clean white background\n\
- Professional presentation format\n\
- Clear labels and annotations\n\
\n\
**Use Case**: \n\
Design handoff document, suitable for developers and designers.\n\
Wide format (16:9), high contrast, print-ready quality.";

    let design_urls = generate_image(
        &client,
        &api_key,
        design_system_prompt,
        "Design System Guide",
        None,
    )
    .await?;

    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // 3. Premium Community Banner
    let banner_prompt = "\
Design a premium Discord server banner for 'Miyabi Community' with exceptional UI/UX.\n\
\n\
**Visual Hierarchy**:\n\
1. Hero text: 'Miyabi Community' (large, bold, modern sans-serif)\n\
2. Subtitle: 'AI-Powered Development Automation' (medium weight)\n\
3. Visual elements: Abstract tech patterns (circuits, nodes, code)\n\
\n\
**Color & Style**:\n\
- Purple-blue gradient background (#9B59B6 → #3498DB)\n\
- Subtle particle effects (not overwhelming)\n\
- Professional depth with layered gradients\n\
- Modern tech aesthetic (not cyberpunk, more corporate)\n\
\n\
**Composition**:\n\
- Wide banner format: 1920x1080 (16:9)\n\
- Safe zone: Text centered, leaving margins for Discord UI\n\
- Balanced composition (rule of thirds)\n\
- Breathing room (not cluttered)\n\
\n\
**Typography**:\n\
- High contrast text (white on gradient)\n\
- Subtle text shadow for legibility\n\
- Modern geometric sans-serif font\n\
\n\
**Accessibility**:\n\
- WCAG AA contrast ratio (4.5:1 minimum)\n\
- Readable at various screen sizes\n\
- No flashing or strobe effects\n\
\n\
**Mood**: \n\
Professional, innovative, trustworthy, cutting-edge.";

    let banner_urls = generate_image(
        &client,
        &api_key,
        banner_prompt,
        "Premium Community Banner",
        None,
    )
    .await?;

    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // 4. Agent Icon Set (Unified Style)
    let agent_icons_prompt = "\
Design a cohesive set of 6 minimalist icon-style mascots for coding agents.\n\
Each should be part of a unified design system.\n\
\n\
**Characters** (all in consistent chibi anime style):\n\
1. しきるん (Coordinator) - Purple (#9B59B6), organized, clipboard\n\
2. つくるん (CodeGen) - Blue (#3498DB), creative, magic wand with <code/> symbol\n\
3. めだまん (Review) - Green (#27AE60), analytical, magnifying glass\n\
4. はこぶん (Deployment) - Orange (#E67E22), energetic, package/rocket\n\
5. つなぐん (PR Agent) - Pink (#E91E63), friendly, link/chain symbol\n\
6. みつけるん (Issue Agent) - Yellow (#F39C12), investigative, detective badge\n\
\n\
**Unified Design Language**:\n\
- Same base character proportions (chibi style)\n\
- Consistent line weight (medium)\n\
- Flat design with subtle gradient (one color family per character)\n\
- Each character holds ONE defining object\n\
- Minimalist facial features (dot eyes, simple smile)\n\
- White/transparent background\n\
\n\
**UI/UX Requirements**:\n\
- Each character distinct at 64x64px size\n\
- Color-blind friendly palette (distinct hues)\n\
- Grid-aligned for pixel-perfect rendering\n\
- Suitable for channel icons\n\
- Professional, not overly cute\n\
\n\
**Layout**:\n\
Arrange all 6 characters in a grid (2 rows × 3 columns) on a single image.\n\
Equal spacing, centered, clean presentation.";

    let agent_urls = generate_image(
        &client,
        &api_key,
        agent_icons_prompt,
        "Agent Icon Set (6 characters)",
        None,
    )
    .await?;

    // Summary Report
    println!("\n{}", "▓".repeat(70));
    println!("🎊 Premium Visual Asset Generation Complete!");
    println!("{}", "▓".repeat(70));

    println!("\n✅ Generated Assets:");
    println!(
        "   1. 🌸 Miyabiちゃん Premium Mascot: {} image(s)",
        miyabi_urls.len()
    );
    println!(
        "   2. 📐 Design System Guide: {} image(s)",
        design_urls.len()
    );
    println!(
        "   3. 🎨 Premium Community Banner: {} image(s)",
        banner_urls.len()
    );
    println!("   4. 🤖 Agent Icon Set: {} image(s)", agent_urls.len());
    println!(
        "   Total: {} images\n",
        miyabi_urls.len() + design_urls.len() + banner_urls.len() + agent_urls.len()
    );

    println!("📝 Asset Usage Guide:");
    println!("   • Miyabiちゃん → Discord server icon (Server Settings → Server Overview)");
    println!("   • Design System → Reference for future designs");
    println!("   • Banner → Discord server banner (Server Settings → Server Overview)");
    println!("   • Agent Icons → Channel icons (split into individual images)");

    println!("\n💡 Next Steps:");
    println!("   1. Download all generated images");
    println!("   2. Review design system guide");
    println!("   3. Upload Miyabiちゃん as server icon");
    println!("   4. Upload banner as server banner");
    println!("   5. Split agent icon set and assign to channels");

    Ok(())
}
