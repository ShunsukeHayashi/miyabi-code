#!/usr/bin/env python3
"""
Miyabi CCG/CG Architecture Diagram Generator
Uses Gemini 3 Pro Image Generation API
"""

import os
import base64
from pathlib import Path
from google import genai
from google.genai import types

# Initialize client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Output directory
OUTPUT_DIR = Path(__file__).parent / "images"
OUTPUT_DIR.mkdir(exist_ok=True)

# Diagram prompts (Japanese)
DIAGRAMS = [
    {
        "name": "ccg_architecture",
        "prompt": """Create a clean, professional technical architecture diagram with JAPANESE text:

タイトル: 「Claude Code (CCG) サブエージェントアーキテクチャ」

Layout:
- At the top: A purple box labeled "親オーケストレーター（メインコンテキスト）"
- Below it: Three blue boxes in a row labeled "サブエージェント1 (200k)", "サブエージェント2 (200k)", "サブエージェント3 (200k)"
- Arrows flowing DOWN from Parent to each Subagent labeled "タスク委譲"
- Dashed arrows flowing UP from each Subagent back to Parent labeled "結果"

Style:
- Modern, flat design
- Color scheme: Purple (#9370DB) for parent, Blue (#72A2F7) for subagents
- White background
- Clean Japanese font (Gothic style)
- Rounded corners on boxes
- Professional infographic style

Important: ALL TEXT MUST BE IN JAPANESE. This is a technical software architecture diagram."""
    },
    {
        "name": "cg_architecture",
        "prompt": """Create a clean, professional technical architecture diagram with JAPANESE text:

タイトル: 「Codex (CG) MCPベースアーキテクチャ」

Layout:
- At the top: A green box labeled "Codex MCPサーバー"
- Below it: Three green boxes - "プロジェクトマネージャー", "開発者", "テスター"
- Bidirectional arrows connecting MCP Server to each agent
- Dashed horizontal arrows between agents labeled "ハンドオフ"

Style:
- Modern, flat design
- Color scheme: Green (#10A37F) for all boxes
- White background
- Clean Japanese font (Gothic style)
- Rounded corners on boxes
- Professional infographic style

Important: ALL TEXT MUST BE IN JAPANESE. This is a technical software architecture diagram."""
    },
    {
        "name": "hybrid_architecture",
        "prompt": """Create a clean, professional technical architecture diagram with JAPANESE text:

タイトル: 「Miyabi ハイブリッドCCG/CG協調アーキテクチャ」

Layout:
- At the top center: A large purple box "Miyabi オーケストレーター（A2Aゲートウェイ）"
- Below left: A blue section labeled "CCGコントローラー（Claude Code）" with two smaller boxes "計画" and "探索"
- Below right: A green section labeled "CGコントローラー（Codex）" with two smaller boxes "開発" and "テスト"
- Arrows from Orchestrator to both controllers
- A dashed bidirectional arrow between CCG and CG labeled "A2A通信"

Style:
- Modern, flat design
- Colors: Purple (#9370DB) for Miyabi, Blue (#72A2F7) for CCG, Green (#10A37F) for CG
- White background
- Clean Japanese font (Gothic style)
- Professional infographic style

Important: ALL TEXT MUST BE IN JAPANESE. This is a technical software architecture diagram."""
    },
    {
        "name": "workflow_pattern",
        "prompt": """Create a clean, professional workflow diagram with JAPANESE text:

タイトル: 「探索-計画-実装-コミット ワークフロー」

Layout (horizontal flow, left to right):
1. Blue box "探索" with magnifying glass icon
2. Arrow pointing right
3. Purple box "計画" with document icon
4. Arrow pointing right
5. Green box "実装" with code brackets icon
6. Arrow pointing right
7. Orange box "コミット" with checkmark icon

Below each box, small text:
- 探索: "CCG Haiku"
- 計画: "CCG Opus"
- 実装: "CG GPT-5"
- コミット: "CCG レビュー"

Style:
- Modern, flat design with subtle gradients
- White background
- Clean icons
- Professional infographic style
- Horizontal timeline layout

Important: ALL TEXT MUST BE IN JAPANESE. This is a software development workflow diagram."""
    },
    {
        "name": "context_management",
        "prompt": """Create a clean, professional diagram with JAPANESE text:

タイトル: 「マルチエージェントシステムのコンテキスト管理」

Layout:
- Center: Large circle "オーケストレーター" with indicator showing "コンパクト状態"
- Around it: 4 smaller circles representing subagents, each labeled "サブエージェント" with "200kコンテキスト"
- Arrows from center to each subagent labeled "タスク関連情報のみ"
- Arrows back labeled "要約された結果"
- A "×" mark over a line showing "ピアツーピア通信禁止"

Style:
- Modern, minimalist design
- Blue and purple color scheme
- White background
- Clean Japanese font (Gothic style)
- Professional infographic style

Important: ALL TEXT MUST BE IN JAPANESE. This is a technical diagram about AI context window management."""
    }
]


def generate_diagram(name: str, prompt: str) -> Path:
    """Generate a single diagram using Gemini API"""
    print(f"Generating: {name}...")

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-image-preview",  # Gemini 3 Pro Image Generation
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            )
        )

        # Extract image from response
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'inline_data') and part.inline_data:
                image_data = part.inline_data.data
                mime_type = part.inline_data.mime_type

                # Determine file extension
                ext = "png" if "png" in mime_type else "jpg"
                output_path = OUTPUT_DIR / f"{name}.{ext}"

                # Save image
                with open(output_path, "wb") as f:
                    f.write(base64.b64decode(image_data) if isinstance(image_data, str) else image_data)

                print(f"  Saved: {output_path}")
                return output_path

        print(f"  Warning: No image in response for {name}")
        return None

    except Exception as e:
        print(f"  Error generating {name}: {e}")
        return None


def main():
    """Generate all diagrams"""
    print("=" * 50)
    print("Miyabi CCG/CG Diagram Generator")
    print("=" * 50)

    if not os.environ.get("GEMINI_API_KEY"):
        print("\nError: GEMINI_API_KEY environment variable not set")
        print("Please set it with: export GEMINI_API_KEY='your-api-key'")
        return

    generated = []
    for diagram in DIAGRAMS:
        result = generate_diagram(diagram["name"], diagram["prompt"])
        if result:
            generated.append(result)

    print("\n" + "=" * 50)
    print(f"Generated {len(generated)}/{len(DIAGRAMS)} diagrams")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 50)


if __name__ == "__main__":
    main()
