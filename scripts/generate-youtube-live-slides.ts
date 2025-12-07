#!/usr/bin/env bun
/**
 * YouTube Live Slides Generator
 * Generates 13 hand-drawn whiteboard style infographic slides
 * using Gemini 3 Pro Image Preview model
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync } from "fs";
import { join } from "path";

const API_KEY = process.env.GEMINI_API_KEY || "";
const OUTPUT_DIR = "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/youtube-live-slides";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);

// Slide prompts from markdown files
const tmuxProtocolSlides = [
  {
    name: "01-tmux-system-overview",
    prompt: `Create a technical whiteboard sketch showing a tmux session layout.
Draw 6 rectangular panes arranged in a grid pattern:
- Top left (large): "Shikirun (Conductor)" with a crown icon
- Top right (3 small panes horizontally): "Kaede-01", "Kaede-02", "Kaede-03"
- Bottom left: "Sakura (Review)"
- Bottom middle: "Tsubaki (PR)"
- Bottom right: "Botan (Deploy)"

Add blue arrows showing bidirectional communication between Shikirun and all other panes.
Label the arrows with "P0.2 Protocol".
Hand-drawn marker style on white background, engineering sketch aesthetic, 16:9 aspect ratio.`
  },
  {
    name: "02-p02-communication-flow",
    prompt: `Draw a whiteboard flowchart showing the P0.2 communication protocol:

1. Top: Box labeled "GitHub Issue #123 created"
2. Arrow down to: Diamond shape "Shikirun detects"
3. Arrow down to: Rectangle "Parse & Route Decision"
4. Three arrows branching to: "Kaede-01 (Code)", "Kaede-02 (Test)", "Kaede-03 (Doc)"
5. Dotted lines back up labeled "Status Reports"
6. Arrow to final box: "Sakura Review"

Include timing annotations like "t+0s", "t+5s", "t+30s".
Add small "PUSH" and "PULL" labels on arrows.
Hand-drawn technical diagram style with black marker on white background.`
  },
  {
    name: "03-permanent-pane-id-mapping",
    prompt: `Sketch a technical diagram showing tmux pane ID mapping:

Left side: "Session Index Method (❌)"
- Show "%0", "%1", "%2" with X marks
- Label "Fragile - IDs change"

Right side: "Permanent ID Method (✅)"
- Show "%14", "%27", "%39" with checkmarks
- Label "Stable - Survives restarts"

Center: Large arrow pointing right labeled "Migration"
Bottom: Code snippet box showing "tmux send-keys -t %27 'command'"

Hand-drawn engineering diagram style, marker on whiteboard, technical education aesthetic.`
  },
  {
    name: "04-message-send-command",
    prompt: `Draw a terminal window sketch showing command execution:

Top: Terminal header bar
Inside terminal:
$ miyabi_send %27 "[Shikirun→Kaede] Issue #1: Implement feature"
[✓] Message sent to pane %27
[✓] Sleep 0.5s applied
[✓] Enter key pressed

Bottom: Small flowchart showing:
1. "Prepare message"
2. "Send to pane"
3. "Wait buffer"
4. "Press Enter"

Hand-drawn terminal interface with rounded corners, command line aesthetic, marker sketch style.`
  },
  {
    name: "05-mcp-ecosystem-overview",
    prompt: `Create a mind map style diagram showing MCP server categories:

Center: "Miyabi MCP Ecosystem (35 servers)"

Branches radiating out:
1. "Core Tools" (miyabi-mcp, miyabi-github, miyabi-tmux)
2. "Development" (miyabi-file-watcher, miyabi-log-aggregator)
3. "AI Integration" (gemini3-general, gemini3-image-gen)
4. "Business Tools" (lark-openapi, miyabi-commercial-agents)
5. "Monitoring" (miyabi-resource-monitor, miyabi-network-inspector)

Each branch shows 3-4 representative servers.
Hand-drawn mind map style with curved branches, bubble nodes, whiteboard marker aesthetic.`
  },
  {
    name: "06-oss-release-strategy",
    prompt: `Draw a strategy roadmap diagram:

Timeline from left to right showing 3 phases:

Phase 1 (Month 1): "Core Release"
- Box showing "tmux orchestration"
- Box showing "P0.2 protocol docs"
- Box showing "Basic MCP servers"

Phase 2 (Month 2-3): "Community Building"
- Box showing "Tutorial videos"
- Box showing "Best practices guide"
- Box showing "Community feedback"

Phase 3 (Month 4+): "Ecosystem Growth"
- Box showing "Plugin marketplace"
- Box showing "Enterprise features"
- Box showing "Multi-language support"

Connect with arrows and add GitHub star predictions: "100 stars", "500 stars", "1000+ stars".
Hand-drawn project timeline style, marker on whiteboard.`
  }
];

const ossStrategySlides = [
  {
    name: "07-oss-impact-prediction",
    prompt: `Draw a growth chart diagram on a whiteboard:

X-axis: Timeline "Month 1-6"
Y-axis: "GitHub Stars & Community"

Line graph showing exponential growth:
- Month 1: 50 stars (Rust community discovery)
- Month 2: 200 stars (Claude AI integration buzz)
- Month 3: 500 stars (Tutorial videos viral)
- Month 4: 1000 stars (Enterprise adoption)
- Month 5: 2000 stars (Conference presentations)
- Month 6: 5000 stars (Ecosystem maturity)

Add milestone annotations:
- "Hacker News front page"
- "Anthropic blog mention"
- "RustConf talk"

Hand-drawn business chart style, marker on whiteboard, startup growth aesthetic.`
  },
  {
    name: "08-community-barriers-solutions",
    prompt: `Create a problem-solution comparison diagram:

Left side - "Barriers (Current)"
- High learning curve icon
- Complex setup process
- Limited documentation
- No examples

Arrow pointing right labeled "Miyabi OSS Solution"

Right side - "Solutions (With OSS)"
- Step-by-step tutorials
- One-command setup script
- Comprehensive docs
- Live demo videos
- Community Discord

Use iconography: climbing mountain (hard) → walking path (easy)
Hand-drawn before/after comparison style, whiteboard marker aesthetic.`
  },
  {
    name: "09-competitive-analysis-matrix",
    prompt: `Draw a 2x2 matrix comparison:

X-axis: "Ease of Setup" (Simple ← → Complex)
Y-axis: "AI Integration" (Basic ← → Advanced)

Plot 4 quadrants:
- Top Left: "Miyabi (Target)" - star icon
- Top Right: "Enterprise Solutions" - dollar sign
- Bottom Left: "Simple Scripts" - wrench icon
- Bottom Right: "Complex Frameworks" - warning triangle

Add product names:
- Miyabi: "Perfect sweet spot"
- Others: "Docker Compose", "Kubernetes", "Shell Scripts"

Hand-drawn competitive analysis matrix, business strategy whiteboard style.`
  },
  {
    name: "10-technical-stack-differentiation",
    prompt: `Create a technical architecture comparison:

Top: "Why Miyabi is Different"

Three columns showing:
1. "Traditional" - Complex boxes connected with tangled lines
2. "Miyabi" - Clean, organized grid layout
3. "Benefits" - Check marks with advantages

Key differentiators in boxes:
- "Rust Type Safety"
- "Claude AI Native"
- "tmux Orchestration"
- "35 MCP Servers"
- "P0.2 Protocol"

Bottom banner: "First Rust+Claude+tmux integrated platform"

Hand-drawn technical comparison chart, engineering whiteboard style.`
  },
  {
    name: "11-contribution-opportunity-map",
    prompt: `Draw a skill-based contribution map:

Center: "Miyabi OSS Community"

Radiating paths for different contributor types:
1. "Rust Developers" → Core improvements, new MCP servers
2. "Claude Enthusiasts" → Prompt optimization, new agents
3. "DevOps Engineers" → Infrastructure, deployment tools
4. "Technical Writers" → Documentation, tutorials
5. "UI/UX Designers" → Dashboard improvements, user experience

Each path shows specific tasks and skill requirements.
Add GitHub contribution icons: commits, issues, PRs.

Hand-drawn community roadmap style, inclusive contribution diagram.`
  },
  {
    name: "12-open-core-business-model",
    prompt: `Draw an open-core business model diagram:

Center circle: "Miyabi OSS (Free)"
- Core framework
- Basic MCP servers
- Community support

Outer ring: "Miyabi Enterprise (Paid)"
- Advanced MCP servers
- Priority support
- Custom integrations
- SLA guarantees

Revenue streams branching out:
- Enterprise licenses
- Consulting services
- Custom development
- Training programs

Balance scale showing "Community Value" ← → "Business Value"

Hand-drawn business model canvas style, sustainable OSS approach.`
  },
  {
    name: "13-6month-roadmap-detailed",
    prompt: `Create a detailed project timeline:

Gantt chart style showing:

Month 1-2: "Foundation"
- Core OSS release
- Documentation
- Basic tutorials

Month 3-4: "Community"
- Conference talks
- Blog posts
- Community Discord
- Contributor onboarding

Month 5-6: "Growth"
- Enterprise features
- Partner integrations
- Certification programs
- International expansion

Add risk mitigation strategies and success metrics for each phase.

Hand-drawn project management timeline, startup execution roadmap style.`
  }
];

const allSlides = [...tmuxProtocolSlides, ...ossStrategySlides];

async function generateSlide(slide: { name: string; prompt: string }, index: number) {
  console.log(`\n[${index + 1}/${allSlides.length}] Generating: ${slide.name}...`);

  try {
    // Use Gemini 2.0 Flash Image Generation model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation"
    });

    const result = await model.generateContent([
      {
        text: slide.prompt + "\n\nGenerate this as a high-quality infographic image suitable for YouTube Live streaming. 16:9 aspect ratio, whiteboard hand-drawn marker style."
      }
    ]);

    const response = await result.response;

    // Check if image was generated
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];

      // Extract image data if available
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if ('inlineData' in part && part.inlineData) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;

            // Determine file extension
            const ext = mimeType === 'image/png' ? 'png' : 'jpg';
            const outputPath = join(OUTPUT_DIR, `${slide.name}.${ext}`);

            // Save image
            const buffer = Buffer.from(imageData, 'base64');
            writeFileSync(outputPath, buffer);

            console.log(`✅ Saved: ${outputPath}`);
            return { success: true, path: outputPath };
          }
        }
      }
    }

    console.log(`⚠️  No image generated for ${slide.name}`);
    console.log(`Response: ${JSON.stringify(response, null, 2)}`);
    return { success: false, name: slide.name };

  } catch (error) {
    console.error(`❌ Error generating ${slide.name}:`, error);
    return { success: false, name: slide.name, error };
  }
}

async function main() {
  console.log("🎨 YouTube Live Slides Generator");
  console.log("================================");
  console.log(`Total slides to generate: ${allSlides.length}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Model: Gemini 2.0 Flash Image Generation (Experimental)`);

  if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY environment variable not set");
    process.exit(1);
  }

  const results = [];

  // Generate slides sequentially to avoid rate limits
  for (let i = 0; i < allSlides.length; i++) {
    const result = await generateSlide(allSlides[i], i);
    results.push(result);

    // Wait 2 seconds between requests to avoid rate limiting
    if (i < allSlides.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log("\n\n📊 Generation Summary");
  console.log("====================");
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Successful: ${successful}/${allSlides.length}`);
  console.log(`❌ Failed: ${failed}/${allSlides.length}`);

  if (failed > 0) {
    console.log("\nFailed slides:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }

  console.log(`\n🎬 Slides ready for YouTube Live streaming!`);
  console.log(`Location: ${OUTPUT_DIR}`);
}

main().catch(console.error);
