#!/usr/bin/env node
/**
 * Direct Gemini Slide Generation
 * Using Gemini 2.5 Flash Image (Nano Banana) model directly
 */

import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "";
const OUTPUT_DIR = "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/youtube-live-slides";
const MODEL = "gemini-2.5-flash-image";

// Style prefix
const STYLE_PREFIX = `Create a hand-drawn whiteboard-style technical infographic illustration suitable for YouTube Live streaming.

STYLE REQUIREMENTS:
- 16:9 aspect ratio (1920x1080 pixels)
- Hand-drawn sketch aesthetic with marker pen textures
- Black marker outlines with blue, orange, yellow, green color accents
- Technical diagram style but friendly and approachable
- White paper/whiteboard texture background
- Hand-drawn arrows showing flow and connections
- ALL visible text labels MUST be in English
- High resolution, detailed illustration
- Engineering/technical presentation aesthetic

`;

// Slide definitions
const slides = [
  {
    id: "01-tmux-system-overview",
    title: "tmux System Overview",
    prompt: `Draw a tmux session layout diagram showing 6 rectangular panes:

Top row:
- Large pane (left): "Shikirun (Conductor)" with a crown icon
- Three small panes (right, horizontally arranged): "Kaede-01", "Kaede-02", "Kaede-03"

Bottom row:
- "Sakura (Review)" pane
- "Tsubaki (PR)" pane
- "Botan (Deploy)" pane

Add blue curved arrows showing bidirectional communication between Shikirun and all other panes.
Label the arrows "P0.2 Protocol".
Include small agent character icons in each pane (stick figures with distinctive features).`
  },
  {
    id: "02-p02-communication-flow",
    title: "P0.2 Communication Flow",
    prompt: `Draw a vertical flowchart showing the P0.2 protocol:

1. Top: Rectangle "GitHub Issue #123 created" with GitHub logo
2. Arrow down to: Diamond "Shikirun detects"
3. Arrow down to: Rectangle "Parse & Route Decision"
4. Three arrows branching to:
   - "Kaede-01 (Code)"
   - "Kaede-02 (Test)"
   - "Kaede-03 (Doc)"
5. Dotted lines back up labeled "Status Reports"
6. Arrow to final box: "Sakura Review"

Add timing annotations: "t+0s", "t+5s", "t+30s"
Add small "PUSH" and "PULL" labels on arrows.
Include small clock icons for timing.`
  },
  {
    id: "03-permanent-pane-id",
    title: "Permanent Pane ID Mapping",
    prompt: `Draw a comparison diagram:

Left side (marked with red X):
- Header: "Session Index Method ❌"
- Show pane IDs: "%0", "%1", "%2"
- Label: "Fragile - IDs change"
- Broken chain icon

Right side (marked with green check):
- Header: "Permanent ID Method ✅"
- Show pane IDs: "%14", "%27", "%39"
- Label: "Stable - Survives restarts"
- Strong chain icon

Center: Large blue arrow pointing right labeled "Migration"
Bottom: Code box with "tmux send-keys -t %27 'command'"`
  },
  {
    id: "04-message-send-command",
    title: "Message Send Command",
    prompt: `Draw a terminal window with rounded corners:

Header bar with three circles (red, yellow, green)
Terminal content:
$ miyabi_send %27 "[Shikirun→Kaede] Issue #1: Implement feature"
[✓] Message sent to pane %27
[✓] Sleep 0.5s applied
[✓] Enter key pressed

Below the terminal, show small flowchart with 4 steps:
1. "Prepare message" (document icon)
2. "Send to pane" (arrow icon)
3. "Wait buffer" (clock icon)
4. "Press Enter" (keyboard icon)

Connect with arrows.`
  },
  {
    id: "05-mcp-ecosystem",
    title: "MCP Ecosystem Overview",
    prompt: `Draw a mind map with central bubble:

Center (large): "Miyabi MCP Ecosystem (35 servers)"

Five branches radiating out in different colors:
1. Blue branch: "Core Tools"
   - miyabi-mcp
   - miyabi-github
   - miyabi-tmux

2. Green branch: "Development"
   - miyabi-file-watcher
   - miyabi-log-aggregator

3. Orange branch: "AI Integration"
   - gemini3-general
   - gemini3-image-gen

4. Purple branch: "Business Tools"
   - lark-openapi
   - miyabi-commercial-agents

5. Red branch: "Monitoring"
   - miyabi-resource-monitor
   - miyabi-network-inspector

Use curved connecting lines and bubble nodes.`
  },
  {
    id: "06-oss-strategy",
    title: "OSS Release Strategy",
    prompt: `Draw a horizontal timeline with 3 phases:

Phase 1 (Month 1): "Core Release"
- Box: "tmux orchestration"
- Box: "P0.2 protocol docs"
- Box: "Basic MCP servers"
- GitHub star count: "100 stars"

Phase 2 (Month 2-3): "Community Building"
- Box: "Tutorial videos"
- Box: "Best practices guide"
- Box: "Community feedback"
- GitHub star count: "500 stars"

Phase 3 (Month 4+): "Ecosystem Growth"
- Box: "Plugin marketplace"
- Box: "Enterprise features"
- Box: "Multi-language support"
- GitHub star count: "1000+ stars"

Connect phases with arrows. Add milestone flags.`
  },
  {
    id: "07-growth-chart",
    title: "OSS Impact Prediction",
    prompt: `Draw a growth chart:

X-axis: "Month 1-6" with markers
Y-axis: "GitHub Stars & Community"

Line graph showing exponential growth:
- Month 1: 50 stars (Rust community)
- Month 2: 200 stars (Claude AI buzz)
- Month 3: 500 stars (Viral tutorials)
- Month 4: 1000 stars (Enterprise adoption)
- Month 5: 2000 stars (Conference talks)
- Month 6: 5000 stars (Ecosystem maturity)

Add milestone annotations with small icons:
- Hacker News logo
- Anthropic logo
- RustConf badge`
  },
  {
    id: "08-barriers-solutions",
    title: "Community Barriers & Solutions",
    prompt: `Draw a before/after comparison:

Left side (barriers):
- Mountain icon with climber (difficulty)
- "High learning curve"
- "Complex setup"
- "Limited docs"
- Frustrated stick figure

Arrow pointing right: "Miyabi OSS Solution"

Right side (solutions):
- Flat path icon with walker (easy)
- "Step-by-step tutorials"
- "One-command setup"
- "Comprehensive docs"
- "Live demos"
- Happy stick figure

Use red/orange for problems, green for solutions.`
  },
  {
    id: "09-competitive-matrix",
    title: "Competitive Analysis Matrix",
    prompt: `Draw a 2x2 matrix:

X-axis: "Ease of Setup" (Simple ← → Complex)
Y-axis: "AI Integration" (Basic ← → Advanced)

Four quadrants with positioned items:

Top-Left (star icon): "Miyabi"
- "Perfect sweet spot"

Top-Right (dollar sign): "Enterprise Solutions"
- Complex but powerful

Bottom-Left (wrench icon): "Simple Scripts"
- Easy but limited

Bottom-Right (warning triangle): "Complex Frameworks"
- Kubernetes, Docker Compose

Highlight Miyabi with glow effect.`
  },
  {
    id: "10-tech-stack",
    title: "Technical Stack Differentiation",
    prompt: `Draw three columns comparison:

Column 1: "Traditional"
- Tangled spaghetti lines
- Complex boxes
- Confused developer icon

Column 2: "Miyabi" (highlighted)
- Clean grid layout
- Organized boxes:
  * Rust Type Safety
  * Claude AI Native
  * tmux Orchestration
  * 35 MCP Servers
  * P0.2 Protocol
- Happy developer icon

Column 3: "Benefits"
- Green checkmarks:
  * Fast
  * Reliable
  * Scalable
  * Extensible

Bottom banner: "First Rust+Claude+tmux platform"`
  },
  {
    id: "11-contribution-map",
    title: "Contribution Opportunity Map",
    prompt: `Draw a radial contribution map:

Center: "Miyabi OSS Community" with GitHub logo

Five paths radiating out:

1. "Rust Developers"
   → Core improvements
   → New MCP servers
   (Rust crab icon)

2. "Claude Enthusiasts"
   → Prompt optimization
   → New agents
   (AI brain icon)

3. "DevOps Engineers"
   → Infrastructure
   → Deployment tools
   (Server rack icon)

4. "Technical Writers"
   → Documentation
   → Tutorials
   (Book icon)

5. "UI/UX Designers"
   → Dashboard improvements
   → User experience
   (Palette icon)

Show GitHub icons: commits, PRs, issues.`
  },
  {
    id: "12-business-model",
    title: "Open-Core Business Model",
    prompt: `Draw a concentric circles diagram:

Inner circle: "Miyabi OSS (Free)"
- Core framework
- Basic MCP servers
- Community support
(Green color)

Outer ring: "Miyabi Enterprise (Paid)"
- Advanced MCP servers
- Priority support
- Custom integrations
- SLA guarantees
(Blue color)

Four arrows branching from outer ring:
→ Enterprise licenses
→ Consulting services
→ Custom development
→ Training programs

Bottom: Balance scale
Left: "Community Value"
Right: "Business Value"
(Equal weight)`
  },
  {
    id: "13-roadmap",
    title: "6-Month Roadmap",
    prompt: `Draw a Gantt-style timeline:

Horizontal timeline: Month 1-6

Three phases (stacked rows):

Month 1-2: "Foundation"
- Core OSS release (blue bar)
- Documentation (blue bar)
- Basic tutorials (blue bar)
- Risk mitigation notes

Month 3-4: "Community"
- Conference talks (green bar)
- Blog posts (green bar)
- Discord community (green bar)
- Contributor onboarding (green bar)

Month 5-6: "Growth"
- Enterprise features (orange bar)
- Partner integrations (orange bar)
- Certification programs (orange bar)
- International expansion (orange bar)

Add success metrics for each phase.`
  }
];

async function generateSlide(
  slide: { id: string; title: string; prompt: string },
  index: number
): Promise<{ success: boolean; path?: string; error?: string }> {
  console.log(`\n[${index + 1}/${slides.length}] Generating: ${slide.title}...`);

  try {
    const client = new GoogleGenAI({ apiKey: API_KEY });

    const fullPrompt = STYLE_PREFIX + slide.prompt;

    const response = await client.models.generateContent({
      model: MODEL,
      contents: fullPrompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const outputPath = path.join(OUTPUT_DIR, `${slide.id}.png`);

          // Ensure output directory exists
          if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
          }

          // Save image
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);

          console.log(`✅ Saved: ${outputPath}`);
          return { success: true, path: outputPath };
        }
      }
    }

    console.log(`⚠️  No image in response for ${slide.title}`);
    return { success: false, error: "No image in response" };
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log("🎨 YouTube Live Slides Generator");
  console.log("================================");
  console.log(`Total slides: ${slides.length}`);
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Model: ${MODEL}`);
  console.log("");

  if (!API_KEY) {
    console.error("❌ Error: Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable");
    process.exit(1);
  }

  const results = [];

  for (let i = 0; i < slides.length; i++) {
    const result = await generateSlide(slides[i], i);
    results.push(result);

    // Wait 3 seconds between requests to avoid rate limiting
    if (i < slides.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log("\n\n📊 Generation Summary");
  console.log("====================");
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}/${slides.length}`);
  console.log(`❌ Failed: ${failed}/${slides.length}`);

  if (failed > 0) {
    console.log("\n❌ Failed slides:");
    results
      .map((r, i) => ({ ...r, slide: slides[i] }))
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.slide.title}: ${r.error}`);
      });
  }

  console.log(`\n🎬 Slides ready for YouTube Live!`);
  console.log(`Location: ${OUTPUT_DIR}`);
}

main().catch(console.error);
