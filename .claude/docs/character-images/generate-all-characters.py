#!/usr/bin/env python3
"""
Generate all missing character images for Miyabi agents
"""

import json
import subprocess
import os
from pathlib import Path
import time

# All characters from gallery.html
CHARACTERS = [
    # Coding Agents
    {'id': 'shikiroon', 'name_jp': 'しきるん', 'name_en': 'Shikiroon', 'type': 'Coding', 'desc': 'タスク調整と並列実行の指揮者'},
    {'id': 'tsukuroon', 'name_jp': 'つくるん', 'name_en': 'Tsukuroon', 'type': 'Coding', 'desc': 'コード生成とプロトタイピング'},
    {'id': 'medaman', 'name_jp': 'めだまん', 'name_en': 'Medaman', 'type': 'Coding', 'desc': 'コードレビューと品質保証'},
    {'id': 'mitsukeroon', 'name_jp': 'みつけるん', 'name_en': 'Mitsukeroon', 'type': 'Coding', 'desc': 'Issue分析とバグ検出'},
    {'id': 'matomeroon', 'name_jp': 'まとめるん', 'name_en': 'Matomeroon', 'type': 'Coding', 'desc': 'Pull Request作成と管理'},
    {'id': 'hakoboon', 'name_jp': 'はこぶん', 'name_en': 'Hakoboon', 'type': 'Coding', 'desc': 'デプロイメントとリリース管理'},
    {'id': 'tsunagun', 'name_jp': 'つなぐん', 'name_en': 'Tsunagun', 'type': 'Coding', 'desc': 'コードベース更新と同期'},
    
    # Business Agents
    {'id': 'kikakuron', 'name_jp': 'きかくろん', 'name_en': 'Kikakuron', 'type': 'Business', 'desc': 'AI起業家・ビジネス戦略立案'},
    {'id': 'jibunkun', 'name_jp': 'じぶんくん', 'name_en': 'Jibunkun', 'type': 'Business', 'desc': '自己分析とスキル開発'},
    {'id': 'shiraberu', 'name_jp': 'しらべるん', 'name_en': 'Shiraberu', 'type': 'Business', 'desc': '市場調査と競合分析'},
    {'id': 'perusona', 'name_jp': 'ぺるそな', 'name_en': 'Perusona', 'type': 'Business', 'desc': 'ペルソナ設計とユーザー理解'},
    {'id': 'konseputan', 'name_jp': 'こんせぷたん', 'name_en': 'Konseputan', 'type': 'Business', 'desc': '商品企画とコンセプト開発'},
    {'id': 'dezainyan', 'name_jp': 'でざいにゃん', 'name_en': 'Dezainyan', 'type': 'Business', 'desc': 'プロダクトデザインとUX'},
    {'id': 'kakuchan', 'name_jp': 'かくちゃん', 'name_en': 'Kakuchan', 'type': 'Business', 'desc': 'コンテンツ作成と記事執筆'},
    {'id': 'notesan', 'name_jp': 'のーとさん', 'name_en': 'Note-san', 'type': 'Business', 'desc': 'Note記事作成と発信'},
    {'id': 'janelkun', 'name_jp': 'じゃねるくん', 'name_en': 'Janelkun', 'type': 'Business', 'desc': 'ファネル設計と導線最適化'},
    {'id': 'snssun', 'name_jp': 'すんすさん', 'name_en': 'Snssan', 'type': 'Business', 'desc': 'SNS戦略と運用'},
    {'id': 'makettosama', 'name_jp': 'まけっとさま', 'name_en': 'Makettosama', 'type': 'Business', 'desc': 'マーケティング戦略全般'},
    {'id': 'saerusu', 'name_jp': 'せーるすせんせい', 'name_en': 'Saerusu', 'type': 'Business', 'desc': 'セールス戦略と営業支援'},
    {'id': 'cusrelo', 'name_jp': 'かすれろちゃん', 'name_en': 'Cusrelo', 'type': 'Business', 'desc': 'CRM構築と顧客関係管理'},
    {'id': 'bunsekyking', 'name_jp': 'ぶんせききんぐ', 'name_en': 'Bunsekyking', 'type': 'Business', 'desc': '分析とインサイト抽出'},
    {'id': 'yuchubeler', 'name_jp': 'ゆーちゅーべらー', 'name_en': 'Yuchubeler', 'type': 'Business', 'desc': 'YouTube戦略と動画コンテンツ'},
    {'id': 'imargesan', 'name_jp': 'いまーじゅさん', 'name_en': 'Imargesan', 'type': 'Business', 'desc': '画像生成とビジュアル戦略'},
    {'id': 'gasladen', 'name_jp': 'すらいどん', 'name_en': 'Gasladen', 'type': 'Business', 'desc': 'スライド作成とプレゼン'},
]

# Style guide for consistent character design
STYLE_GUIDE = """
Anime-style character design with following traits:
- Big expressive eyes that reflect their personality
- Cute chibi proportions (2-3 heads tall)
- Unique hair colors and styles matching their role
- Simple but distinctive outfit related to their function
- Friendly and approachable expression
- Clean vector-like art style
- Pastel color palette with one accent color per character
- White or gradient background
- Full body visible, standing pose
- Small props or symbols related to their specialty
"""

def generate_character_prompt(character):
    """Generate detailed prompt for a character"""
    
    # Role-specific visual traits
    visual_traits = {
        'shikiroon': 'conductor outfit, baton, musical notes floating around, purple hair',
        'tsukuroon': 'builder/craftsman outfit, hammer and wrench, orange hair with goggles',
        'medaman': 'detective outfit with magnifying glass, sharp eyes, dark blue hair',
        'mitsukeroon': 'explorer outfit, telescope, curious expression, green adventurer hair',
        'matomeroon': 'librarian look, organizing papers, neat appearance, brown hair',
        'hakoboon': 'delivery/pilot outfit, package or paper airplane, sky blue hair',
        'tsunagun': 'network/cable design elements, connectors, electric blue hair',
        'kikakuron': 'business suit with creative flair, lightbulb above head, silver hair',
        'jibunkun': 'mirror or reflection theme, self-discovery symbols, gradient hair',
        'shiraberu': 'researcher with clipboard, investigation tools, analytical look',
        'perusona': 'masks or multiple faces theme, empathy symbols, rainbow hair',
        'konseputan': 'artist with idea bubbles, creative tools, pink creative hair',
        'dezainyan': 'cat-themed designer, stylus/tablet, fashionable outfit, purple hair',
        'kakuchan': 'writer with quill/pen, surrounded by papers, literary look',
        'notesan': 'blogger aesthetic, laptop/tablet, modern casual style',
        'janelkun': 'funnel or flow chart elements, strategic planner look',
        'snssun': 'social media icons floating, smartphone, trendy outfit',
        'makettosama': 'marketing guru with charts, confident pose, business casual',
        'saerusu': 'salesperson with briefcase, friendly smile, professional look',
        'cusrelo': 'customer service theme, headset, caring expression',
        'bunsekyking': 'data analyst with graphs, crown/king theme, analytical pose',
        'yuchubeler': 'content creator with camera, play button, energetic pose',
        'imargesan': 'artist with palette, magical image creation effects',
        'gasladen': 'presenter with slides, confident speaker pose'
    }
    
    traits = visual_traits.get(character['id'], 'unique outfit matching their role')
    
    prompt = f"""Create a cute anime-style mascot character based on these specifications:

Character Name: {character['name_jp']} ({character['name_en']})
Role: {character['desc']}
Type: {character['type']} Agent

{STYLE_GUIDE}

Specific traits for this character:
- {traits}
- Personality shown through pose and expression
- {character['type']}-themed color scheme

The character should be instantly recognizable and memorable, embodying their role in a cute, approachable way."""

    return prompt

def call_mcp_tool(server, tool, args):
    """Call an MCP tool using the Python client"""
    cmd = [
        'python3', os.path.expanduser('~/mcp-call.py'),
        server,
        'tools/call',
        json.dumps({
            "name": tool,
            "arguments": args
        })
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error calling MCP tool: {e}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

def generate_character(character, output_dir):
    """Generate a single character image"""
    output_path = output_dir / f"{character['id']}.png"
    
    # Skip if already exists
    if output_path.exists():
        print(f"✓ {character['name_jp']} already exists")
        return True
    
    print(f"Generating {character['name_jp']} ({character['name_en']})...")
    
    prompt = generate_character_prompt(character)
    
    # Call Gemini image generation
    result = call_mcp_tool(
        'gemini3-imagegen',
        'generate_image',
        {
            'prompt': prompt,
            'output_path': str(output_path),
            'aspect_ratio': '1:1',
            'safety_filter': 'moderate'
        }
    )
    
    if result and output_path.exists():
        print(f"✅ Generated {character['name_jp']}")
        return True
    else:
        print(f"❌ Failed to generate {character['name_jp']}")
        return False

def main():
    # Setup paths
    output_dir = Path(__file__).parent / 'generated'
    output_dir.mkdir(exist_ok=True)
    
    # Generate all characters
    results = []
    for i, character in enumerate(CHARACTERS):
        print(f"\n[{i+1}/{len(CHARACTERS)}] Processing {character['id']}...")
        success = generate_character(character, output_dir)
        results.append({
            'character': character,
            'success': success,
            'timestamp': time.time()
        })
        
        # Small delay between generations
        if i < len(CHARACTERS) - 1:
            time.sleep(2)
    
    # Save results
    results_path = Path(__file__).parent / 'generation-results.json'
    with open(results_path, 'w', encoding='utf-8') as f:
        json.dump({
            'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_characters': len(CHARACTERS),
            'successful': sum(1 for r in results if r['success']),
            'results': results
        }, f, indent=2, ensure_ascii=False)
    
    # Summary
    successful = sum(1 for r in results if r['success'])
    print(f"\n{'='*50}")
    print(f"Generation complete: {successful}/{len(CHARACTERS)} successful")
    print(f"Results saved to: {results_path}")

if __name__ == '__main__':
    main()