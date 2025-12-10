#!/usr/bin/env npx tsx
/**
 * A2A System Infographic Image Generator
 * Imagen 3 を使用して手書き風スライドを生成
 */

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// Imagen 3 モデル
const MODEL = "imagen-3.0-generate-002";
const OUTPUT_DIR = "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/A2A/demo/slides";

// スタイルプレフィックス
const STYLE_PREFIX = `Hand-drawn whiteboard-style technical infographic illustration.

STYLE:
- Hand-drawn sketch aesthetic with black marker pen and colorful crayon textures
- Black marker outlines with yellow, orange, blue, green, red color accents
- Technical diagram style but friendly and approachable
- Simple cute robot characters for AI agents
- White paper texture background
- Hand-drawn arrows showing flow and connections
- Japanese text labels (日本語)
- 16:9 landscape aspect ratio

`;

// スライド定義
const slides = [
  {
    id: "01_overview",
    title: "A2A システム概要",
    prompt: `${STYLE_PREFIX}
A2A (Agent-to-Agent) multi-agent system overview infographic.

Large "A2A" logo at top center (hand-drawn style)
Subtitle: "エージェント間通信プロトコル"

Center: Conductor robot with conductor hat labeled "指揮論"
Around it, 5 worker robots with flower motifs:
- Green maple leaf robot "楓" (CodeGen)
- Pink cherry blossom robot "桜" (Review)
- Red camellia robot "椿" (PR)
- Purple peony robot "牡丹" (Deploy)
- Yellow robot with magnifying glass "見付論" (Issue)

Arrows pointing from workers to conductor (PUSH reports)
tmux pane grid lines in background
`
  },
  {
    id: "02_protocol",
    title: "P0.2 通信プロトコル",
    prompt: `${STYLE_PREFIX}
P0.2 communication protocol explanation diagram.

Title: "P0.2 プロトコル" at top

Hand-drawn code block showing:
tmux send-keys -t %PANE_ID 'MESSAGE'

Three rule boxes with checkmarks:
✅ Use permanent pane ID (%18)
✅ Include sleep 0.5
✅ PUSH reports only

Message format examples:
[楓] 🚀 開始: Issue #123
[楓→桜] レビュー依頼: PR #456

Status icon legend at bottom:
🚀 🔄 ✅ ❌ ⏳ ❓
`
  },
  {
    id: "03_flow",
    title: "開発フロー",
    prompt: `${STYLE_PREFIX}
Development pipeline flow diagram from Issue to Deploy.

Left to right pipeline with 5 stages:
[Issue] → [CodeGen] → [Review] → [PR] → [Deploy]
見付論     楓          桜         椿       牡丹

Each stage has action labels below:
- Issue作成
- コード生成
- レビュー
- マージ
- デプロイ

Timeline arrow showing flow
Relay race baton passing imagery
Colorful agents passing work to each other
`
  },
  {
    id: "04_claude_agents",
    title: "Claude --agents",
    prompt: `${STYLE_PREFIX}
Claude Code --agents flag usage guide.

Title: "claude --agents"

Hand-drawn terminal showing command:
claude --agents "$(cat agents.json)"

JSON structure visualization:
{
  "kaede": {
    "description": "説明",
    "prompt": "プロンプト"
  }
}

Flow diagram:
User → Claude → Task(kaede) → 楓 Agent

Multiple cute robot agents standing in a row waiting for tasks
`
  }
];

async function generateSlide(slide: typeof slides[0]) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Set GOOGLE_API_KEY or GEMINI_API_KEY");
  }

  const client = new GoogleGenAI({ apiKey });

  console.log(`\n🎨 Generating: ${slide.title}...`);

  try {
    const response = await client.models.generateImages({
      model: MODEL,
      prompt: slide.prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const image = response.generatedImages[0];
      if (image.image?.imageBytes) {
        if (!fs.existsSync(OUTPUT_DIR)) {
          fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        const outputPath = path.join(OUTPUT_DIR, `${slide.id}.png`);
        const imageData = Buffer.from(image.image.imageBytes, "base64");
        fs.writeFileSync(outputPath, imageData);

        console.log(`   ✅ Saved: ${outputPath}`);
        return outputPath;
      }
    }

    console.log(`   ❌ No image in response`);
    return null;
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    return null;
  }
}

// iTerm2 imgcat function
function imgcat(filePath: string) {
  const filename = path.basename(filePath);
  const base64 = fs.readFileSync(filePath).toString("base64");
  const filenameBase64 = Buffer.from(filename).toString("base64");
  process.stdout.write(`\x1b]1337;File=name=${filenameBase64};inline=1;width=80%:${base64}\x07\n`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("   🎨 A2A Infographic Slide Generator (Imagen 3)");
  console.log("═══════════════════════════════════════════════════════════");

  const results: string[] = [];

  for (const slide of slides) {
    const imgPath = await generateSlide(slide);
    if (imgPath) results.push(imgPath);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`   ✨ Generated ${results.length}/${slides.length} slides`);
  console.log(`   📁 Output: ${OUTPUT_DIR}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // iTerm2 imgcat で表示
  if (results.length > 0) {
    console.log("📸 Displaying slides in iTerm2...\n");
    for (const imgPath of results) {
      console.log(`\n📄 ${path.basename(imgPath)}`);
      imgcat(imgPath);
      console.log("");
    }
  }
}

main().catch(console.error);
