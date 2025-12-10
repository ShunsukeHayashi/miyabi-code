#!/usr/bin/env npx ts-node
/**
 * A2A System Infographic Image Generator
 * Gemini 3 Pro Image Preview を使用して手書き風スライドを生成
 */

import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const MODEL = "gemini-3-pro-image-preview";
const OUTPUT_DIR = "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/A2A/demo/slides";

// スタイルプレフィックス
const STYLE_PREFIX = `Create a hand-drawn whiteboard-style technical infographic illustration.

STYLE REQUIREMENTS:
- Hand-drawn sketch aesthetic with black marker pen and colorful crayon textures
- Black marker outlines with yellow, orange, blue, green, red color accents
- Technical diagram style but friendly and approachable
- Simple cute robot characters for AI agents
- White paper texture background
- Hand-drawn arrows showing flow and connections
- ALL visible text labels MUST be in JAPANESE (日本語)
- High resolution, detailed illustration
- Aspect ratio: 16:9 landscape

`;

// スライド定義
const slides = [
  {
    id: "01_overview",
    title: "A2A システム概要",
    prompt: `${STYLE_PREFIX}
A2A (Agent-to-Agent) システムの全体像を示すインフォグラフィック。

中央上部に大きく「A2A」のロゴ（手書き風）
その下に「エージェント間通信プロトコル」のサブタイトル

中央に指揮者のような帽子をかぶったロボット「指揮論」(Conductor)
周囲に5つの花をモチーフにしたロボットエージェント:
- 🍁 楓 (Kaede) - 緑の葉、CodeGen
- 🌸 桜 (Sakura) - ピンクの花、Review
- 🌺 椿 (Tsubaki) - 赤い花、PR
- 🌼 牡丹 (Botan) - 紫の花、Deploy
- 🔍 見付論 (Mitsukeroon) - 虫眼鏡、Issue

各ワーカーから指揮論に向かってPUSH報告の矢印
tmuxのペイン分割を示す枠線
`
  },
  {
    id: "02_protocol",
    title: "P0.2 通信プロトコル",
    prompt: `${STYLE_PREFIX}
P0.2 通信プロトコルの解説図。

上部にタイトル「P0.2 プロトコル」

コマンド形式を示すコードブロック風の手書き枠:
tmux send-keys -t %PANE_ID 'MESSAGE'

重要ルールを3つのボックスで表示:
✅ 永続ペインID (%18等) を使用
✅ sleep 0.5 を含める
✅ PUSH型報告のみ

メッセージフォーマットの例:
[楓] 🚀 開始: Issue #123
[楓→桜] レビュー依頼: PR #456

ステータスアイコンの凡例:
🚀開始 🔄進行中 ✅完了 ❌エラー ⏳待機 ❓確認
`
  },
  {
    id: "03_flow",
    title: "開発フロー",
    prompt: `${STYLE_PREFIX}
Issue から Deploy までの開発フロー図。

左から右へのパイプライン:
[Issue] → [CodeGen] → [Review] → [PR] → [Deploy]
見付論     楓          桜         椿       牡丹

各ステージの下に具体的なアクション:
- Issue作成・ラベル付け
- コード生成・テスト
- レビュー・LGTM/修正
- マージ・リリース
- 本番デプロイ

タイムラインの矢印で時間の流れを表現
各エージェントがバトンを渡すリレーのイメージ
`
  },
  {
    id: "04_claude_agents",
    title: "Claude --agents の使い方",
    prompt: `${STYLE_PREFIX}
Claude Code の --agents フラグの使い方解説。

タイトル「claude --agents」

コマンド例（手書きターミナル風）:
claude --agents "$(cat agents.json)"

JSON構造の図解:
{
  "kaede": {
    "description": "説明",
    "prompt": "プロンプト"
  }
}

Task tool からの呼び出しフロー:
ユーザー → Claude → Task(kaede) → 楓エージェント

複数のロボットエージェントが並んで待機しているイメージ
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
    const response = await client.models.generateContent({
      model: MODEL,
      contents: slide.prompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Debug: show response structure
    const parts = response.candidates?.[0]?.content?.parts || [];
    console.log(`   Debug: candidates=${response.candidates?.length || 0}, parts=${parts.length}`);
    for (const p of parts) {
      console.log(`   Part keys: ${Object.keys(p).join(', ')}`);
      if (p.text) console.log(`   Text: ${p.text.substring(0, 100)}...`);
    }

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
          }

          const outputPath = path.join(OUTPUT_DIR, `${slide.id}.png`);
          const imageData = Buffer.from(part.inlineData.data, "base64");
          fs.writeFileSync(outputPath, imageData);

          console.log(`   ✅ Saved: ${outputPath}`);
          return outputPath;
        }
      }
    }
    console.log(`   ❌ No image in response`);
    return null;
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    return null;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("   🎨 A2A Infographic Slide Generator");
  console.log("═══════════════════════════════════════════════════════════");

  const results: string[] = [];

  for (const slide of slides) {
    const path = await generateSlide(slide);
    if (path) results.push(path);
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`   ✨ Generated ${results.length}/${slides.length} slides`);
  console.log(`   📁 Output: ${OUTPUT_DIR}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // iTerm2 imgcat で表示
  if (results.length > 0) {
    console.log("Displaying slides with imgcat...\n");
    for (const imgPath of results) {
      const filename = path.basename(imgPath);
      const base64 = fs.readFileSync(imgPath).toString("base64");
      const filenameBase64 = Buffer.from(filename).toString("base64");
      process.stdout.write(`\x1b]1337;File=name=${filenameBase64};inline=1;width=80%:${base64}\x07\n`);
      console.log(`\n📄 ${filename}\n`);
    }
  }
}

main().catch(console.error);
