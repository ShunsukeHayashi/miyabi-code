#!/usr/bin/env python3
"""
MIYABI TCG Card Generator using Gemini 3 Pro Image (Nano Banana Pro)
Generate TCG card images for all agents using Google's Gemini 3 Image Generation API
"""

import os
import sys
import json
import time
import base64
import requests
from pathlib import Path
from typing import Dict, List, Tuple

# Configuration
API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCW8VhBVDRg7h0NKJJq2tygO7oRvS9jLCI")
# Gemini 3 Pro Image (Nano Banana Pro) API endpoint
API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"
OUTPUT_DIR = Path("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards")
RATE_LIMIT_DELAY = 3.0  # seconds between API calls

# All 24 Miyabi Agents
AGENTS_DATA = [
    # === Coding Team (7 agents) ===
    # 1. Shikiroon - CoordinatorAgent - SSR (EXISTS)
    {
        "id": "shikiroon",
        "name": "しきるん",
        "title": "総監督",
        "agent_type": "CoordinatorAgent",
        "rarity": "SSR",
        "element": "Light",
        "level": 50,
        "hp": 2000,
        "atk": 1000,
        "def": 1200,
        "spd": 900,
        "skill": "DAGオーケストレーション\n複数Agentを並列制御。効率を200%向上。",
        "description": "Elegant conductor in white and gold uniform with baton, orchestrating multiple holographic screens showing agent tasks, surrounded by golden light particles and command chains, cyberpunk control center background, anime style",
        "card_number": "No.001",
        "evolution": "→しきるんEX"
    },
    # 2. Tsukuroon - CodeGenAgent - SR (EXISTS)
    {
        "id": "tsukuroon",
        "name": "つくるん",
        "title": "開発リーダー",
        "agent_type": "CodeGenAgent",
        "rarity": "SR",
        "element": "Tech",
        "level": 42,
        "hp": 1600,
        "atk": 1200,
        "def": 800,
        "spd": 950,
        "skill": "コード生成\nRust/TypeScriptを自動生成。品質を150%向上。",
        "description": "Young programmer with glowing blue code streams flowing from fingertips, wearing tech-inspired jacket with circuit patterns, multiple floating code windows, cyberpunk development studio, anime style",
        "card_number": "No.002",
        "evolution": "→つくるんPRO"
    },
    # 3. Medaman - ReviewAgent - UR (EXISTS)
    {
        "id": "medaman",
        "name": "めだまん",
        "title": "品質管理者",
        "agent_type": "ReviewAgent",
        "rarity": "UR",
        "element": "Dark",
        "level": 55,
        "hp": 2200,
        "atk": 900,
        "def": 1400,
        "spd": 850,
        "skill": "コードレビュー\nセキュリティ脆弱性を100%検出。品質スコアリング。",
        "description": "Mysterious figure with large analytical eye motif, wearing dark cloak with purple accents, surrounded by scanning beams and code analysis holographics, rainbow UR holographic effect, cyberpunk security center, anime style",
        "card_number": "No.003",
        "evolution": "→めだまんEX"
    },
    # 4. Mitsukeroon - Explore Agent - R (EXISTS)
    {
        "id": "mitsukeroon",
        "name": "みつけるん",
        "title": "探索スタッフ",
        "agent_type": "ExploreAgent",
        "rarity": "R",
        "element": "Wind",
        "level": 28,
        "hp": 1100,
        "atk": 700,
        "def": 500,
        "spd": 1200,
        "skill": "コード探索\nファイルパターン検索とキーワード分析。発見速度を3倍に。",
        "description": "Agile explorer with magnifying glass and wind trails, wearing scout uniform with detection sensors, surrounded by file icons and search patterns, cyberpunk exploration zone, anime style",
        "card_number": "No.004",
        "evolution": "→みつけるんEX"
    },
    # 5. Matomeroon - PRAgent - SR (EXISTS)
    {
        "id": "matomeroon",
        "name": "まとめるん",
        "title": "PR担当",
        "agent_type": "PRAgent",
        "rarity": "SR",
        "element": "Water",
        "level": 38,
        "hp": 1500,
        "atk": 850,
        "def": 900,
        "spd": 880,
        "skill": "PR作成\nConventional Commits準拠のPRを自動生成。",
        "description": "Organized manager with clipboard and water-themed design, merging code branches into unified streams, surrounded by merge request icons, cyberpunk collaboration hub, anime style",
        "card_number": "No.005",
        "evolution": "→まとめるんPRO"
    },
    # 6. Hakoboon - DeploymentAgent - SR (GENERATE)
    {
        "id": "hakoboon",
        "name": "はこぶん",
        "title": "配達スタッフ",
        "agent_type": "DeploymentAgent",
        "rarity": "SR",
        "element": "Wind",
        "level": 36,
        "hp": 1400,
        "atk": 900,
        "def": 700,
        "spd": 1100,
        "skill": "本番配達\nCI/CDパイプラインで自動デプロイ。速度を2倍に。",
        "description": "Professional delivery person wearing futuristic blue uniform with wind element symbols and speed lines, carrying glowing deployment packages with rocket boosters, surrounded by cloud infrastructure icons and pipeline animations, cyberpunk logistics center background, anime style",
        "card_number": "No.006",
        "evolution": "→はこぶんPRO"
    },
    # 7. Tsunagun - HooksIntegration - R (GENERATE)
    {
        "id": "tsunagun",
        "name": "つなぐん",
        "title": "連携スタッフ",
        "agent_type": "HooksIntegration",
        "rarity": "R",
        "element": "Tech",
        "level": 28,
        "hp": 1100,
        "atk": 600,
        "def": 550,
        "spd": 950,
        "skill": "イベント監視\nGitHubイベントを検知しAgentを自動呼び出し。",
        "description": "Tech-savvy bridge builder with glowing network cables connecting multiple systems, wearing tech suit with connection symbols, monitoring screens showing GitHub webhooks and event triggers, surrounded by integration APIs, cyberpunk tech hub, anime style",
        "card_number": "No.007",
        "evolution": "→つなぐんEX"
    },

    # === Business Team (17 agents) ===
    # 8. Akindosan - AIEntrepreneurAgent - SSR
    {
        "id": "akindosan",
        "name": "あきんどさん",
        "title": "CEO・社長",
        "agent_type": "AIEntrepreneurAgent",
        "rarity": "SSR",
        "element": "Light",
        "level": 50,
        "hp": 2000,
        "atk": 1000,
        "def": 1000,
        "spd": 800,
        "skill": "8ステップ経営\n8フェーズでビジネスプラン構築。効率を50%向上。",
        "description": "Distinguished business executive in elegant black suit with golden accents, radiating warm light aura of success, holding holographic business strategy documents and growth charts, surrounded by floating yen symbols and success indicators, cyberpunk executive office with city skyline view, anime style",
        "card_number": "No.008",
        "evolution": "→あきんどさんEX"
    },
    # 9. Jibunsan - SelfAnalysisAgent - R
    {
        "id": "jibunsan",
        "name": "じぶんさん",
        "title": "自己分析担当",
        "agent_type": "SelfAnalysisAgent",
        "rarity": "R",
        "element": "Dark",
        "level": 29,
        "hp": 1150,
        "atk": 650,
        "def": 550,
        "spd": 720,
        "skill": "SWOT分析\n強み・弱み・機会・脅威を分析。判断力を80%向上。",
        "description": "Philosophical analyst in dark purple attire with introspective aura, holding SWOT matrix and self-analysis documents, surrounded by floating mirror reflections showing different aspects of self, cyberpunk meditation chamber, anime style",
        "card_number": "No.009",
        "evolution": "→じぶんさんEX"
    },
    # 10. Shiraberoon - MarketResearchAgent - R
    {
        "id": "shiraberoon",
        "name": "しらべるん",
        "title": "市場調査担当",
        "agent_type": "MarketResearchAgent",
        "rarity": "R",
        "element": "Tech",
        "level": 32,
        "hp": 1250,
        "atk": 750,
        "def": 620,
        "spd": 820,
        "skill": "競合分析\n20社以上の競合を調査。市場洞察力を3倍に。",
        "description": "Detective-style researcher with magnifying glass and tech goggles, analyzing competitor data on multiple holographic displays, surrounded by market graphs and trend charts, tech blue color scheme, cyberpunk investigation office, anime style",
        "card_number": "No.010",
        "evolution": "→しらべるんPRO"
    },
    # 11. Narikirin - PersonaAgent - R
    {
        "id": "narikirin",
        "name": "なりきりん",
        "title": "ペルソナ調査担当",
        "agent_type": "PersonaAgent",
        "rarity": "R",
        "element": "Earth",
        "level": 30,
        "hp": 1200,
        "atk": 700,
        "def": 600,
        "spd": 750,
        "skill": "ペルソナ作成\n3〜5人の理想的な顧客像を作成。精度を2倍に。",
        "description": "Empathetic actor character with multiple persona masks floating around, transforming into different customer profiles, surrounded by persona cards and demographic data sheets, earth-toned color scheme with brown and green accents, cyberpunk research lab, anime style",
        "card_number": "No.011",
        "evolution": "→なりきりんEX"
    },
    # 12. Tsukuron_product - ProductConceptAgent - SR
    {
        "id": "tsukuron_product",
        "name": "つくろん",
        "title": "商品開発担当",
        "agent_type": "ProductConceptAgent",
        "rarity": "SR",
        "element": "Fire",
        "level": 40,
        "hp": 1600,
        "atk": 1100,
        "def": 650,
        "spd": 900,
        "skill": "MVP設計\n商品コンセプトを作成しロードマップを描く。創造力を3倍に。",
        "description": "Creative innovator with flame-colored hair and fire-inspired design elements, holding MVP blueprint and product sketches, fire particles and spark effects floating around, surrounded by prototype models and innovation symbols, cyberpunk product workshop, anime style",
        "card_number": "No.012",
        "evolution": "→つくろんPRO"
    },
    # 13. Kakun - ProductDesignAgent - SR
    {
        "id": "kakun",
        "name": "かくん",
        "title": "UI/UX担当",
        "agent_type": "ProductDesignAgent",
        "rarity": "SR",
        "element": "Water",
        "level": 39,
        "hp": 1550,
        "atk": 1000,
        "def": 700,
        "spd": 880,
        "skill": "デザインシステム\nUI/UXを最適化。ユーザビリティを200%向上。",
        "description": "Artistic designer with water-inspired flowing design elements, drawing interface mockups with glowing digital stylus, water droplets and design grids floating around, surrounded by wireframes and color palettes, cyberpunk design studio, anime style",
        "card_number": "No.013",
        "evolution": "→かくんEX"
    },
    # 14. Kakuchan - ContentCreationAgent - SR
    {
        "id": "kakuchan",
        "name": "かくちゃん",
        "title": "コンテンツ制作担当",
        "agent_type": "ContentCreationAgent",
        "rarity": "SR",
        "element": "Water",
        "level": 38,
        "hp": 1500,
        "atk": 1050,
        "def": 690,
        "spd": 900,
        "skill": "コンテンツ作成\nブログ記事・SNS投稿を生成。エンゲージメントを200%向上。",
        "description": "Creative writer with flowing water-inspired design and ink droplets, typing on holographic keyboard with content floating around like water streams, surrounded by blog posts and article drafts, water droplets carrying words and hashtags, cyberpunk content studio, anime style",
        "card_number": "No.014",
        "evolution": "→かくちゃんPRO"
    },
    # 15. Michibikin - FunnelDesignAgent - SR
    {
        "id": "michibikin",
        "name": "みちびきん",
        "title": "導線設計担当",
        "agent_type": "FunnelDesignAgent",
        "rarity": "SR",
        "element": "Wind",
        "level": 37,
        "hp": 1450,
        "atk": 950,
        "def": 680,
        "spd": 920,
        "skill": "カスタマージャーニー\nユーザー導線を最適化。CVRを150%向上。",
        "description": "Strategic guide character with wind trails showing customer journey paths, holding a glowing journey map with funnel visualization, wind currents visualizing user flow from awareness to conversion, cyberpunk marketing center, anime style",
        "card_number": "No.015",
        "evolution": "→みちびきんPRO"
    },
    # 16. Tsubuyakin - SNSStrategyAgent - R
    {
        "id": "tsubuyakin",
        "name": "つぶやきん",
        "title": "SNS運用担当",
        "agent_type": "SNSStrategyAgent",
        "rarity": "R",
        "element": "Wind",
        "level": 33,
        "hp": 1300,
        "atk": 800,
        "def": 640,
        "spd": 1000,
        "skill": "バズ投稿\nSNS投稿を最適化。フォロワー増加率を150%向上。",
        "description": "Social media master with smartphone and floating SNS icons including Twitter bird, Instagram camera, and YouTube play button, wind carrying viral tweets and trending hashtags, surrounded by like hearts and share symbols, cyberpunk social media hub, anime style",
        "card_number": "No.016",
        "evolution": "→つぶやきんEX"
    },
    # 17. Hiromeroon - MarketingAgent - SR
    {
        "id": "hiromeroon",
        "name": "ひろめるん",
        "title": "マーケティング担当",
        "agent_type": "MarketingAgent",
        "rarity": "SR",
        "element": "Fire",
        "level": 41,
        "hp": 1650,
        "atk": 1150,
        "def": 720,
        "spd": 940,
        "skill": "広告戦略\nマーケティング施策を展開。リード獲得を300%増加。",
        "description": "Energetic marketing specialist with megaphone emitting fire-colored promotional waves, surrounded by ad banners and campaign materials, fire-themed branding elements and growth charts, holding target audience radar, cyberpunk advertising agency, anime style",
        "card_number": "No.017",
        "evolution": "→ひろめるんEX"
    },
    # 18. Uroon - SalesAgent - SR
    {
        "id": "uroon",
        "name": "うるん",
        "title": "セールス担当",
        "agent_type": "SalesAgent",
        "rarity": "SR",
        "element": "Earth",
        "level": 39,
        "hp": 1550,
        "atk": 1080,
        "def": 750,
        "spd": 860,
        "skill": "営業戦略\nリード管理と契約締結。成約率を200%向上。",
        "description": "Professional salesperson with confident smile in earth-toned business attire, holding glowing contract documents and briefcase, surrounded by handshake icons and deal-closing symbols, sales funnel visualization, cyberpunk sales office with client meeting room, anime style",
        "card_number": "No.018",
        "evolution": "→うるんEX"
    },
    # 19. Okyakusama - CRMAgent - SR
    {
        "id": "okyakusama",
        "name": "おきゃくさま",
        "title": "CRM担当",
        "agent_type": "CRMAgent",
        "rarity": "SR",
        "element": "Light",
        "level": 37,
        "hp": 1450,
        "atk": 900,
        "def": 850,
        "spd": 850,
        "skill": "LTV最大化\n顧客データを管理し生涯価値を150%向上。",
        "description": "Customer service specialist with warm light aura and caring expression, managing customer database on holographic CRM screens, surrounded by satisfaction star ratings, loyalty badges, and customer journey timelines, light-themed design with golden accents, cyberpunk CRM center, anime style",
        "card_number": "No.019",
        "evolution": "→おきゃくさまPRO"
    },
    # 20. Kazoeroon - AnalyticsAgent - R
    {
        "id": "kazoeroon",
        "name": "かぞえるん",
        "title": "データ分析担当",
        "agent_type": "AnalyticsAgent",
        "rarity": "R",
        "element": "Tech",
        "level": 31,
        "hp": 1200,
        "atk": 700,
        "def": 600,
        "spd": 840,
        "skill": "データ分析\nKPI分析とレポート作成。PDCAサイクル効率を2倍に。",
        "description": "Data analyst with glasses and multiple floating data visualization screens, surrounded by graphs, pie charts, bar charts and analytics dashboards, tech blue and green colors with binary code streams, cyberpunk analytics lab with holographic displays, anime style",
        "card_number": "No.020",
        "evolution": "→かぞえるんEX"
    },
    # 21. Kakikochan - NoteAgent - SR
    {
        "id": "kakikochan",
        "name": "かきこちゃん",
        "title": "note.com担当",
        "agent_type": "NoteAgent",
        "rarity": "SR",
        "element": "Light",
        "level": 38,
        "hp": 1500,
        "atk": 1000,
        "def": 700,
        "spd": 890,
        "skill": "感動記事\n読者の心を動かす記事を作成。note収益を250%向上。",
        "description": "Passionate writer with elegant feather pen and notebook, surrounded by glowing light-themed emotional story symbols, floating note.com article cards with heart reactions, warm golden light aura representing reader connection, cyberpunk writing cafe with cozy atmosphere, anime style",
        "card_number": "No.021",
        "evolution": "→かきこちゃんPRO"
    },
    # 22. Dougan - YouTubeAgent - SR
    {
        "id": "dougan",
        "name": "どうがん",
        "title": "YouTube担当",
        "agent_type": "YouTubeAgent",
        "rarity": "SR",
        "element": "Fire",
        "level": 40,
        "hp": 1600,
        "atk": 1100,
        "def": 710,
        "spd": 920,
        "skill": "動画バズ\nYouTube動画を企画・最適化。再生回数を400%増加。",
        "description": "Video producer with professional camera and ring light, surrounded by fire-colored play buttons and view count counters exploding upward, video thumbnails floating around, YouTube logo glowing, film editing timeline interface, cyberpunk production studio with green screen, anime style",
        "card_number": "No.022",
        "evolution": "→どうがんPRO"
    },
    # 23. Egakun - ImageGenAgent - SSR
    {
        "id": "egakun",
        "name": "えがくん",
        "title": "画像生成担当",
        "agent_type": "ImageGenAgent",
        "rarity": "SSR",
        "element": "Fire",
        "level": 45,
        "hp": 1800,
        "atk": 1300,
        "def": 850,
        "spd": 950,
        "skill": "AI画像生成\nアイキャッチ・図解・サムネイルを自動生成。視覚的魅力を400%向上。",
        "description": "Creative digital artist with glowing tablet and AI painting interface, fire-colored artistic aura streaming from brushes, surrounded by generated images materializing from sparks, canvas frames and design elements floating, SSR gold frame border, cyberpunk art studio with massive displays, anime style",
        "card_number": "No.023",
        "evolution": "→えがくんEX"
    },
    # 24. Honokachan - HonokaAgent - UR
    {
        "id": "honokachan",
        "name": "ほのかちゃん",
        "title": "Udemy担当",
        "agent_type": "HonokaAgent",
        "rarity": "UR",
        "element": "Light",
        "level": 55,
        "hp": 2200,
        "atk": 1200,
        "def": 1100,
        "spd": 900,
        "skill": "13ステップ設計\nUdemyコースを完全設計。受講生満足度とコース収益を500%向上。",
        "description": "Youthful female teacher character age 20 with warm smile and radiant light aura, holding Udemy course materials and educational holographic interface, surrounded by student success testimonials and course completion badges, rainbow holographic UR effect with sparkles, graduation caps and certificates floating, cyberpunk education center with virtual classroom, anime style",
        "card_number": "No.024",
        "evolution": "→ほのかちゃんEX"
    }
]

# Rarity to frame styling
RARITY_STYLES = {
    "R": {"border": "blue metallic", "glow": "soft blue"},
    "SR": {"border": "silver with blue gradient", "glow": "bright silver"},
    "SSR": {"border": "gold with shine", "glow": "golden radiance"},
    "UR": {"border": "rainbow holographic", "glow": "prismatic rainbow"}
}

# Element icons and colors
ELEMENTS = {
    "Fire": {"icon": "flame", "color": "orange-red"},
    "Water": {"icon": "water drop", "color": "blue-cyan"},
    "Wind": {"icon": "wind swirl", "color": "green-teal"},
    "Earth": {"icon": "earth crystal", "color": "brown-green"},
    "Light": {"icon": "star", "color": "golden-white"},
    "Dark": {"icon": "moon", "color": "purple-black"},
    "Tech": {"icon": "circuit", "color": "cyan-blue"}
}

def generate_card_prompt(agent: Dict) -> str:
    """Generate detailed prompt for TCG card image using Gemini 3 style"""
    rarity = agent["rarity"]
    element = agent["element"]
    style = RARITY_STYLES[rarity]
    elem = ELEMENTS[element]

    prompt = f"""Create a professional TCG (Trading Card Game) card illustration in high-quality anime style for the MIYABI game.

CHARACTER DETAILS:
- Name: {agent['name']} ({agent['title']})
- Character Description: {agent['description']}

CARD DESIGN REQUIREMENTS:
- Card Frame: {style['border']} border frame with {style['glow']} glow effect for {rarity} rarity
- Element: {element} element ({elem['icon']} symbol, {elem['color']} color scheme)
- Background: Cyberpunk neon cityscape with futuristic buildings, holographic displays, and atmospheric lighting
- Art Style: High-quality anime/manga illustration style with detailed linework and vibrant colors

COMPOSITION:
- Character positioned center-to-slightly-right in dynamic pose
- Element effects integrated naturally (fire particles, water droplets, wind trails, etc.)
- Depth of field with character in sharp focus
- Cinematic lighting with neon rim lights

TECHNICAL SPECS:
- Resolution: High detail, 8K quality appearance
- Colors: Vibrant, saturated with good contrast
- Style: Modern anime art, clean linework, professional TCG quality

DO NOT include any text, numbers, or card UI elements - only the character illustration with background."""

    return prompt.strip()

def call_gemini_api(prompt: str, filename: str) -> Tuple[bool, str]:
    """Call Gemini 3 API to generate image"""
    if not API_KEY:
        return False, "GEMINI_API_KEY not set"

    headers = {
        "Content-Type": "application/json"
    }

    # Gemini 2.0 Flash with image generation capability
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "temperature": 0.9,
            "topK": 32,
            "topP": 1
        }
    }

    url = f"{API_ENDPOINT}?key={API_KEY}"

    try:
        print(f"  -> Calling Gemini 3 API for {filename}...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)

        if response.status_code != 200:
            return False, f"API Error {response.status_code}: {response.text[:500]}"

        data = response.json()

        # Parse response for image data
        if "candidates" not in data or len(data["candidates"]) == 0:
            return False, "No candidates in API response"

        candidate = data["candidates"][0]
        if "content" not in candidate or "parts" not in candidate["content"]:
            return False, "No content parts in response"

        # Find image part
        for part in candidate["content"]["parts"]:
            if "inlineData" in part:
                mime_type = part["inlineData"].get("mimeType", "image/png")
                b64_image = part["inlineData"]["data"]

                # Decode and save
                image_bytes = base64.b64decode(b64_image)
                output_path = OUTPUT_DIR / filename

                with open(output_path, "wb") as f:
                    f.write(image_bytes)

                file_size = len(image_bytes) / 1024
                print(f"  OK Saved: {filename} ({file_size:.1f} KB)")
                return True, str(output_path)

        # If no image, check for text response
        for part in candidate["content"]["parts"]:
            if "text" in part:
                return False, f"Got text instead of image: {part['text'][:200]}"

        return False, "No image data in response"

    except requests.exceptions.Timeout:
        return False, "API request timeout (120s)"
    except requests.exceptions.RequestException as e:
        return False, f"API request failed: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def main():
    """Main execution function"""
    print("=" * 80)
    print("MIYABI TCG Card Generator - Gemini 3 Pro Image (Nano Banana Pro)")
    print("=" * 80)
    print(f"Output Directory: {OUTPUT_DIR}")
    print(f"Total Cards: {len(AGENTS_DATA)}")
    print("=" * 80)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Check which cards need generation
    existing_cards = set()
    for f in OUTPUT_DIR.glob("*_unified_*.png"):
        # Extract agent id from filename
        agent_id = f.stem.replace("_unified_", "_").split("_")[0]
        existing_cards.add(f.stem)

    print(f"\nExisting cards: {len(existing_cards)}")
    for card in sorted(existing_cards):
        print(f"  - {card}")

    # Generate missing cards
    success_count = 0
    failed_count = 0
    skipped_count = 0
    results = []

    for i, agent in enumerate(AGENTS_DATA, 1):
        agent_id = agent["id"]
        rarity = agent["rarity"]
        filename = f"{agent_id}_unified_{rarity}.png"

        print(f"\n[{i}/{len(AGENTS_DATA)}] {agent['name']} ({rarity})")

        # Check if already exists
        output_path = OUTPUT_DIR / filename
        if output_path.exists():
            print(f"  SKIP: Already exists")
            skipped_count += 1
            results.append({
                "agent": agent["name"],
                "status": "skipped",
                "path": str(output_path)
            })
            continue

        # Generate prompt
        prompt = generate_card_prompt(agent)

        # Call API
        success, message = call_gemini_api(prompt, filename)

        if success:
            success_count += 1
            results.append({
                "agent": agent["name"],
                "id": agent_id,
                "rarity": rarity,
                "status": "success",
                "path": message
            })
        else:
            failed_count += 1
            print(f"  FAIL: {message}")
            results.append({
                "agent": agent["name"],
                "id": agent_id,
                "rarity": rarity,
                "status": "failed",
                "error": message
            })

        # Rate limiting
        if i < len(AGENTS_DATA):
            print(f"  -> Waiting {RATE_LIMIT_DELAY}s...")
            time.sleep(RATE_LIMIT_DELAY)

    # Summary
    print("\n" + "=" * 80)
    print("Generation Complete!")
    print("=" * 80)
    print(f"OK Success: {success_count}")
    print(f"SKIP Skipped: {skipped_count}")
    print(f"FAIL Failed: {failed_count}")
    print(f"Total: {len(AGENTS_DATA)}")
    print("=" * 80)

    # Save results
    results_file = OUTPUT_DIR / "gemini3_generation_results.json"
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "api": "Gemini 3 Pro Image (Nano Banana Pro)",
            "total": len(AGENTS_DATA),
            "success": success_count,
            "skipped": skipped_count,
            "failed": failed_count,
            "results": results
        }, f, ensure_ascii=False, indent=2)

    print(f"\nResults saved to: {results_file}")

    # List failed cards
    if failed_count > 0:
        print("\nFailed Cards:")
        for r in results:
            if r["status"] == "failed":
                print(f"  - {r['agent']}: {r.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()
