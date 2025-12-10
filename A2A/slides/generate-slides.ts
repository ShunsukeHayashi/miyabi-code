#!/usr/bin/env npx ts-node
/**
 * A2A Infographic Slides Generator
 *
 * Generates hand-drawn infographic slides for A2A Protocol explanation
 * using Gemini 3 Pro Image Preview
 */

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const MODEL = "models/gemini-3-pro-image-preview";

const STYLE_PREFIX = `Create a hand-drawn whiteboard-style technical infographic illustration.

STYLE REQUIREMENTS:
- Hand-drawn sketch aesthetic with marker pen and crayon textures
- Black marker outlines with yellow, orange, blue, green, purple color accents
- Technical diagram style but friendly and approachable
- Simple stick figure characters and cute robot characters for AI agents
- White paper texture background
- Hand-drawn arrows showing flow and connections
- ALL visible text labels MUST be in JAPANESE
- High resolution, detailed illustration

`;

interface SlideDefinition {
  id: string;
  title: string;
  slide_type: string;
  prompt: string;
}

const slides: SlideDefinition[] = [
  {
    id: "01_title",
    title: "A2A通信プロトコル - タイトル",
    slide_type: "title",
    prompt: `Title slide for A2A (Agent-to-Agent) Communication Protocol.

VISUAL ELEMENTS:
- Large "A2A" logo in the center (hand-drawn style, blue and green gradient effect)
- 6 cute AI agent robot characters arranged around the logo, each with speech bubbles showing they're communicating
- Dotted lines in background suggesting tmux pane divisions
- Small stars and sparkle marks for decoration
- "Miyabi" logo mark in corner

TEXT LABELS (in Japanese):
- "A2A" - main logo
- "Agent-to-Agent" - subtitle
- "通信プロトコル" - sub-subtitle
- "AIエージェントたちがtmuxで会話するリアルタイム・メッセージング・システム" - annotation

MOOD: Welcoming, friendly, exciting, technical but approachable`
  },
  {
    id: "02_problem",
    title: "問題提起 - 混乱したコミュニケーション",
    slide_type: "problem",
    prompt: `Problem visualization slide showing chaotic agent communication.

VISUAL ELEMENTS:
- Office scene with 5 stick figure staff members shouting in different directions
- Speech bubbles tangled and crossing each other
- Central frustrated manager character with "?" marks above head
- Red X marks scattered around
- Tangled/twisted arrows going everywhere
- Papers flying around in chaos

TEXT LABELS (in Japanese):
- "誰に報告すればいい？" - confused staff
- "メッセージが届かない！" - near tangled arrows
- "状況がわからない..." - manager
- "❌ 統一されたルールがない"
- "❌ メッセージが紛失する"
- "❌ 誰が何をしているか不明"

MOOD: Frustrated, confused, overwhelming, chaotic
Use red color accents for emphasis on problems`
  },
  {
    id: "03_solution",
    title: "解決策 - P0.2プロトコル",
    slide_type: "solution",
    prompt: `Solution slide showing organized communication with P0.2 Protocol.

VISUAL ELEMENTS:
- Organized meeting room layout
- Central "conductor" robot character (しきるん) with a conductor's baton
- 5 worker robots arranged neatly around the conductor
- All arrows pointing TOWARD the central conductor (PUSH pattern)
- Green checkmarks
- Light bulb icon showing "aha moment"
- Each robot has a role badge

TEXT LABELS (in Japanese):
- "しきるん（Conductor）" - central robot
- "PUSH報告" - on arrows pointing to center
- "永続ペインID: %18" - conductor's position
- "✅ ワーカーが自発的に報告（PUSH型）"
- "✅ 永続ID（%N）で確実な宛先指定"
- "✅ sleep 0.5で安定配信"

MOOD: Organized, confident, clear, efficient
Use green and blue color accents for positivity`
  },
  {
    id: "04_agents",
    title: "6人のAIエージェントチーム",
    slide_type: "architecture",
    prompt: `Team introduction slide showing 6 AI agent characters.

VISUAL ELEMENTS:
- 6 unique cute robot characters arranged like a team photo
- Each character has distinctive features and holds role-related items:
  * しきるん: Conductor's baton, leadership crown
  * カエデ: Keyboard/code icon, glasses
  * サクラ: Magnifying glass, checklist
  * ツバキ: Git branch icon, PR symbol
  * ボタン: Rocket, cloud icon
  * みつけるん: Sticky notes, bug icon
- Pane IDs shown below each character (%18 to %23)
- Dotted lines connecting them showing teamwork

TEXT LABELS (in Japanese):
- "しきるん %18 - Conductor"
- "カエデ %19 - CodeGen"
- "サクラ %20 - Review"
- "ツバキ %21 - PR"
- "ボタン %22 - Deploy"
- "みつけるん %23 - Issue"
- "開発チームの6エージェント" - title
- "それぞれ専門役割を持つ" - annotation

MOOD: Friendly, professional, team spirit, diverse
Each character should have a unique color accent`
  },
  {
    id: "05_flow",
    title: "実際の通信フロー例",
    slide_type: "process",
    prompt: `Process flow slide showing actual communication flow example.

VISUAL ELEMENTS:
- Left-to-right 4-step flow diagram
- Step 1: カエデ robot writing code (keyboard, happy face)
- Step 2: Arrow from カエデ to しきるん with message bubble
- Step 3: Arrow from しきるん to サクラ with task assignment
- Step 4: サクラ reviewing with checklist
- Numbered circles (1,2,3,4) for each step
- Code snippet bubbles showing actual commands
- Timeline dotted line at bottom

TEXT LABELS (in Japanese):
- "[カエデ] 完了: Issue #270 実装完了" - step 2 bubble
- "[カエデ→サクラ] レビュー依頼" - step 3 bubble
- "tmux send-keys -t %18" - command example
- "1️⃣ カエデが実装完了"
- "2️⃣ しきるんにPUSH報告"
- "3️⃣ サクラにレビュー依頼"
- "4️⃣ サクラがレビュー開始"

MOOD: Dynamic, collaborative, efficient, flowing
Use blue and green for flow arrows`
  },
  {
    id: "06_cta",
    title: "A2Aを使ってみよう！",
    slide_type: "cta",
    prompt: `Call-to-action slide encouraging users to try A2A.

VISUAL ELEMENTS:
- Large megaphone held by excited robot character
- Multiple small agent characters welcoming/waving
- Terminal/code block style boxes showing usage examples
- QR code placeholder box
- Stars and sparkles for celebration
- "START!" banner with ribbon
- Checklist for getting started

TEXT LABELS (in Japanese):
- "今すぐ始めよう！" - main CTA
- "source a2a.sh" - code block 1
- "a2a_completed カエデ '実装完了'" - code block 2
- "a2a_health" - code block 3
- "📁 A2A/a2a.sh をsource"
- "📖 CLAUDE.md で詳細を確認"
- "🔗 miyabi-tmux MCPで統合"
- "A2Aを使ってみよう！" - title

MOOD: Exciting, welcoming, call-to-action, celebratory
Use yellow and orange accents for excitement`
  }
];

async function generateSlide(
  client: GoogleGenAI,
  slide: SlideDefinition,
  outputDir: string
): Promise<void> {
  const outputPath = path.join(outputDir, `slide_${slide.id}.png`);

  console.log(`\n[${slide.id}] Generating: ${slide.title}`);

  const fullPrompt = STYLE_PREFIX + slide.prompt;

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: fullPrompt,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);
          const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
          console.log(`  ✅ Saved: ${path.basename(outputPath)} (${fileSize}KB)`);
          return;
        }
      }
    }
    console.log(`  ❌ No image in response`);
  } catch (error) {
    console.log(`  ❌ Error: ${error instanceof Error ? error.message : error}`);
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Error: Set GEMINI_API_KEY or GOOGLE_API_KEY environment variable");
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });
  const outputDir = path.join(__dirname);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("=".repeat(60));
  console.log("A2A Infographic Slides Generator");
  console.log("=".repeat(60));
  console.log(`Output directory: ${outputDir}`);
  console.log(`Total slides: ${slides.length}`);

  for (const slide of slides) {
    await generateSlide(client, slide, outputDir);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Generation Complete!");
  console.log("=".repeat(60));
}

main().catch(console.error);
