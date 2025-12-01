#!/usr/bin/env python3
"""
MIYABI TCG Card Generator
Generate TCG card images for all agents using BytePlus ARK API
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
API_KEY = os.getenv("BYTEPLUS_API_KEY")
API_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/images/generations"
OUTPUT_DIR = Path("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards")
RATE_LIMIT_DELAY = 2.0  # seconds between API calls

# Agent Data: (name, agent_type, rarity, element, level, hp, atk, def, spd, skill)
AGENTS_DATA = [
    # 1. はこぶん (Hakoboon) - DeploymentAgent - SR - Wind
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
        "spd": 950,
        "skill": "【本番配達】\nプログラムを本番環境へデプロイ。テスト合格率が100%の場合、速度を2倍にする。",
        "description": "Professional delivery person wearing a blue uniform with wind element symbols, carrying deployment packages, cyberpunk cityscape background with neon lights, anime style character design",
        "card_number": "No.005",
        "evolution": "→はこぶんPRO"
    },
    # 2. つなぐん (Tsunagun) - HooksIntegration - R - Tech
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
        "def": 500,
        "spd": 800,
        "skill": "【イベント監視】\nGitHubイベントを検知し、適切なAgentを呼び出す。自動化の流れを作成。",
        "description": "Tech-savvy bridge builder character with network cables and connection symbols, monitoring screens showing GitHub events, cyberpunk tech background, anime style",
        "card_number": "No.007",
        "evolution": "→つなぐんEX"
    },
    # 3. あきんどさん (Akindosan) - AIEntrepreneurAgent - SSR - Light
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
        "skill": "【8ステップ経営】\n8つのフェーズでビジネスプランを構築。全Agentの効率を50%向上させる。",
        "description": "Distinguished business executive in elegant suit with light aura, holding business plan documents, surrounded by golden light and success symbols, cyberpunk office background, anime style",
        "card_number": "No.008",
        "evolution": "→あきんどさんEX"
    },
    # 4. つくろん (Tsukuron) - ProductConceptAgent - SR - Fire
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
        "skill": "【MVP設計】\n商品コンセプトを作成し、ロードマップを描く。創造力を3倍に高める。",
        "description": "Creative innovator with flame-inspired design elements, holding MVP blueprint and product sketches, fire particles floating around, cyberpunk workshop background, anime style",
        "card_number": "No.009",
        "evolution": "→つくろんPRO"
    },
    # 5. かくん (Kakun) - ProductDesignAgent - SR - Water
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
        "skill": "【デザインシステム】\nUI/UXを最適化し、ユーザビリティスコアを200%向上させる。",
        "description": "Artistic designer with water-inspired color palette, drawing interface mockups with digital pen, water droplets and design elements floating, cyberpunk design studio, anime style",
        "card_number": "No.010",
        "evolution": "→かくんEX"
    },
    # 6. みちびきん (Michibikin) - FunnelDesignAgent - SR - Wind
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
        "skill": "【カスタマージャーニー】\nユーザー導線を最適化。CVR（転換率）を150%向上させる。",
        "description": "Strategic guide character with wind trails showing customer journey paths, holding a journey map, wind currents visualizing user flow, cyberpunk marketing background, anime style",
        "card_number": "No.011",
        "evolution": "→みちびきんPRO"
    },
    # 7. なりきりん (Narikirin) - PersonaAgent - R - Earth
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
        "skill": "【ペルソナ作成】\n3〜5人の理想的な顧客像を作成。ターゲティング精度を2倍にする。",
        "description": "Empathetic actor character transforming into different personas, surrounded by persona cards and profile sheets, earth-toned color scheme, cyberpunk research lab, anime style",
        "card_number": "No.012",
        "evolution": "→なりきりんEX"
    },
    # 8. じぶんさん (Jibunsan) - SelfAnalysisAgent - R - Dark
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
        "skill": "【SWOT分析】\n強み・弱み・機会・脅威を分析。戦略的判断力を80%向上させる。",
        "description": "Philosophical analyst in dark attire with introspective aura, holding SWOT matrix and self-analysis documents, purple and dark blue tones, cyberpunk meditation space, anime style",
        "card_number": "No.013",
        "evolution": "→じぶんさんEX"
    },
    # 9. しらべるん (Shiraberoon) - MarketResearchAgent - R - Tech
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
        "skill": "【競合分析】\n20社以上の競合を調査。市場洞察力を3倍に高める。",
        "description": "Detective character with magnifying glass and market research data, analyzing competitor information on holographic displays, tech blue color scheme, cyberpunk investigation office, anime style",
        "card_number": "No.014",
        "evolution": "→しらべるんPRO"
    },
    # 10. ひろめるん (Hiromeroon) - MarketingAgent - SR - Fire
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
        "skill": "【広告戦略】\nマーケティング施策を展開。リード獲得数を300%増加させる。",
        "description": "Energetic marketing specialist with megaphone and promotional materials, surrounded by fire-colored campaign banners and ad graphics, cyberpunk advertising agency, anime style",
        "card_number": "No.015",
        "evolution": "→ひろめるんEX"
    },
    # 11. かくちゃん (Kakuchan) - ContentCreationAgent - SR - Water
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
        "skill": "【コンテンツ作成】\nブログ記事・SNS投稿を生成。エンゲージメント率を200%向上。",
        "description": "Creative writer with flowing water-inspired design, typing on holographic keyboard with content floating around, water droplets carrying words, cyberpunk content studio, anime style",
        "card_number": "No.016",
        "evolution": "→かくちゃんPRO"
    },
    # 12. つぶやきん (Tsubuyakin) - SNSStrategyAgent - R - Wind
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
        "spd": 900,
        "skill": "【バズ投稿】\nSNS投稿を最適化。フォロワー増加率を150%向上させる。",
        "description": "Social media master with smartphone and SNS icons floating around, wind carrying tweets and posts, surrounded by like and share symbols, cyberpunk social media hub, anime style",
        "card_number": "No.017",
        "evolution": "→つぶやきんEX"
    },
    # 13. どうがん (Dougan) - YouTubeAgent - SR - Fire
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
        "skill": "【動画バズ】\nYouTube動画を企画・最適化。再生回数を400%増加させる。",
        "description": "Video producer with camera and film editing interface, fire-themed play buttons and view count animations, surrounded by video thumbnails, cyberpunk production studio, anime style",
        "card_number": "No.018",
        "evolution": "→どうがんPRO"
    },
    # 14. うるん (Uroon) - SalesAgent - SR - Earth
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
        "skill": "【営業戦略】\nリード管理と契約締結。成約率を200%向上させる。",
        "description": "Professional salesperson with briefcase and contract documents, earth-toned business attire, surrounded by deal-closing symbols and handshake icons, cyberpunk sales office, anime style",
        "card_number": "No.019",
        "evolution": "→うるんEX"
    },
    # 15. おきゃくさま (Okyakusama) - CRMAgent - SR - Light
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
        "def": 800,
        "spd": 850,
        "skill": "【LTV最大化】\n顧客データを管理し、生涯価値を150%向上させる。",
        "description": "Customer service specialist with warm light aura, managing customer database on holographic screens, surrounded by satisfaction ratings and loyalty symbols, cyberpunk CRM center, anime style",
        "card_number": "No.020",
        "evolution": "→おきゃくさまPRO"
    },
    # 16. かぞえるん (Kazoeroon) - AnalyticsAgent - R - Tech
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
        "skill": "【データ分析】\nKPI分析とレポート作成。PDCAサイクルの効率を2倍にする。",
        "description": "Data analyst with glasses and multiple data visualization screens, surrounded by graphs, charts and analytics dashboards, tech blue and green colors, cyberpunk analytics lab, anime style",
        "card_number": "No.021",
        "evolution": "→かぞえるんEX"
    },
    # 17. かきこちゃん (Kakikochan) - NoteAgent - SR - Light
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
        "skill": "【感動記事】\n読者の心を動かす記事を作成。note収益を250%向上させる。",
        "description": "Passionate writer with elegant pen and notebook, light-inspired design with emotional story symbols floating around, surrounded by note.com articles, cyberpunk writing cafe, anime style",
        "card_number": "No.022",
        "evolution": "→かきこちゃんPRO"
    },
    # 18. えがくん (Egakun) - ImageGenAgent - SSR - Fire
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
        "skill": "【AI画像生成】\nアイキャッチ・図解・サムネイルを自動生成。視覚的魅力を400%向上。",
        "description": "Creative artist with digital painting tools and AI generation interface, fire-colored artistic aura, surrounded by generated images and design elements, cyberpunk art studio, anime style",
        "card_number": "No.023",
        "evolution": "→えがくんEX"
    },
    # 19. ほのかちゃん (Honokachan) - HonokaAgent - UR - Light
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
        "skill": "【13ステップ設計】\nUdemyコースを完全設計。受講生満足度とコース収益を500%向上。",
        "description": "Youthful teacher character age 20 with warm smile and light aura, holding online course materials and Udemy platform interface, surrounded by student success symbols and educational icons, rainbow holographic effect for UR rarity, cyberpunk education center, anime style",
        "card_number": "No.024",
        "evolution": "→ほのかちゃんEX"
    }
]

# Rarity to frame color mapping
RARITY_COLORS = {
    "R": "blue",
    "SR": "silver-blue gradient",
    "SSR": "gold",
    "UR": "rainbow holographic"
}

# Element icons
ELEMENT_ICONS = {
    "Fire": "🔥",
    "Water": "💧",
    "Wind": "💨",
    "Earth": "🌍",
    "Light": "✨",
    "Dark": "🌙",
    "Tech": "⚡"
}

def generate_card_prompt(agent: Dict) -> str:
    """Generate detailed prompt for TCG card image"""
    rarity = agent["rarity"]
    element = agent["element"]
    frame_color = RARITY_COLORS[rarity]

    prompt = f"""
Professional TCG (Trading Card Game) card design for MIYABI game, high quality digital illustration:

Character: {agent['description']}

Card Layout:
- Top bar: Rarity badge '{rarity}' in {frame_color}, element icon for {element}, level 'Lv.{agent['level']}'
- Card frame: {frame_color} border matching rarity
- Background: Cyberpunk neon cityscape with futuristic buildings and holographic displays
- Character artwork: Centered, anime-style illustration
- Japanese name bar: 【{agent['name']}】{agent['title']}
- Stats bar: HP:{agent['hp']} ❤️ | ATK:{agent['atk']} ⚔️ | DEF:{agent['def']} 🛡️ | SPD:{agent['spd']} ⚡
- Type badge: Type: [{agent['agent_type']}]
- Skill box: {agent['skill']}
- Bottom bar: {agent['card_number']} / 1st Edition | {agent['evolution']} | MIYABI TCG © 2025

Style Requirements:
- High quality anime art style
- Vibrant cyberpunk neon colors
- Professional TCG card layout
- Sharp, detailed illustration
- Cinematic lighting
- 8k quality, ultra detailed

Negative prompt: blurry, low quality, distorted, pixelated, amateur, simple, boring, monochrome, realistic photo, cluttered, text rendering errors
"""
    return prompt.strip()

def call_byteplus_api(prompt: str, filename: str) -> Tuple[bool, str]:
    """Call BytePlus ARK API to generate image"""
    if not API_KEY:
        return False, "BYTEPLUS_API_KEY environment variable not set"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }

    payload = {
        "model": "seedream-4-0-250828",
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json",
        "quality": "standard"
    }

    try:
        print(f"  → Calling BytePlus ARK API for {filename}...")
        response = requests.post(API_ENDPOINT, headers=headers, json=payload, timeout=60)

        if response.status_code != 200:
            return False, f"API Error {response.status_code}: {response.text}"

        data = response.json()

        if "data" not in data or len(data["data"]) == 0:
            return False, "No image data in API response"

        # Decode base64 image
        b64_image = data["data"][0]["b64_json"]
        image_bytes = base64.b64decode(b64_image)

        # Save image
        output_path = OUTPUT_DIR / filename
        with open(output_path, "wb") as f:
            f.write(image_bytes)

        file_size = len(image_bytes) / 1024  # KB
        print(f"  ✓ Saved: {filename} ({file_size:.1f} KB)")

        return True, str(output_path)

    except requests.exceptions.Timeout:
        return False, "API request timeout (60s)"
    except requests.exceptions.RequestException as e:
        return False, f"API request failed: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def main():
    """Main execution function"""
    print("=" * 80)
    print("MIYABI TCG Card Generator")
    print("=" * 80)
    print(f"Output Directory: {OUTPUT_DIR}")
    print(f"Total Cards to Generate: {len(AGENTS_DATA)}")
    print("=" * 80)

    # Check API key
    if not API_KEY:
        print("ERROR: BYTEPLUS_API_KEY environment variable not set")
        print("Please set it with: export BYTEPLUS_API_KEY='your-key-here'")
        sys.exit(1)

    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Generate cards
    success_count = 0
    failed_count = 0
    results = []

    for i, agent in enumerate(AGENTS_DATA, 1):
        print(f"\n[{i}/{len(AGENTS_DATA)}] Generating: {agent['name']} ({agent['rarity']})")

        # Generate filename
        filename = f"{agent['id']}_unified_{agent['rarity']}.png"

        # Check if file already exists
        output_path = OUTPUT_DIR / filename
        if output_path.exists():
            print(f"  ⚠ File already exists, skipping: {filename}")
            results.append({
                "agent": agent['name'],
                "status": "skipped",
                "path": str(output_path)
            })
            continue

        # Generate prompt
        prompt = generate_card_prompt(agent)

        # Call API
        success, message = call_byteplus_api(prompt, filename)

        if success:
            success_count += 1
            results.append({
                "agent": agent['name'],
                "status": "success",
                "path": message
            })
        else:
            failed_count += 1
            print(f"  ✗ Failed: {message}")
            results.append({
                "agent": agent['name'],
                "status": "failed",
                "error": message
            })

        # Rate limiting (wait before next request)
        if i < len(AGENTS_DATA):
            print(f"  → Waiting {RATE_LIMIT_DELAY}s (rate limit)...")
            time.sleep(RATE_LIMIT_DELAY)

    # Summary
    print("\n" + "=" * 80)
    print("Generation Complete!")
    print("=" * 80)
    print(f"✓ Success: {success_count}")
    print(f"✗ Failed: {failed_count}")
    print(f"Total: {len(AGENTS_DATA)}")
    print("=" * 80)

    # Save results to JSON
    results_file = OUTPUT_DIR / "generation_results.json"
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total": len(AGENTS_DATA),
            "success": success_count,
            "failed": failed_count,
            "results": results
        }, f, ensure_ascii=False, indent=2)

    print(f"\nResults saved to: {results_file}")

    # List failed cards
    if failed_count > 0:
        print("\nFailed Cards:")
        for r in results:
            if r["status"] == "failed":
                print(f"  - {r['agent']}: {r['error']}")

    sys.exit(0 if failed_count == 0 else 1)

if __name__ == "__main__":
    main()
