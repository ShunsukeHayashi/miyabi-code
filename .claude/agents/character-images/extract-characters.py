#!/usr/bin/env python3
"""
Extract character information from AGENT_CHARACTERS.md and generate prompts.json
"""

import re
import json

def extract_characters():
    """Extract all character information from AGENT_CHARACTERS.md"""

    with open('.claude/agents/AGENT_CHARACTERS.md', 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by agent sections
    sections = re.split(r'^### (🔴|🟢|🔵|🟡) (.+)$', content, flags=re.MULTILINE)

    agents = []

    # Process sections (skip first empty section)
    for i in range(1, len(sections), 3):
        if i + 2 >= len(sections):
            break

        color = sections[i]
        name_jp = sections[i + 1].strip()
        section_content = sections[i + 2]

        # Extract English name from parentheses
        name_match = re.search(r'\(([A-Za-z]+)\)', name_jp)
        name_en = name_match.group(1) if name_match else ""
        name_jp_only = re.sub(r'\s*\([^)]+\)', '', name_jp).strip()

        # Extract original agent name
        original_match = re.search(r'\*\*元の名前\*\*:\s*([A-Za-z]+)', section_content)
        original_name = original_match.group(1) if original_match else ""

        # Extract role
        role_match = re.search(r'\*\*オフィスでの役割\*\*:\s*[^\*]+\*\*([^*]+)\*\*', section_content)
        role = role_match.group(1).strip() if role_match else ""

        # Extract what they do
        what_match = re.search(r'\*\*何をする\？\*\*:\s*([^\n]+)', section_content)
        what_do = what_match.group(1).strip() if what_match else ""

        # Map color to role type
        color_map = {
            '🔴': 'leader',
            '🟢': 'executor',
            '🔵': 'analyzer',
            '🟡': 'supporter'
        }

        # Generate agent ID (lowercase, remove spaces)
        agent_id = re.sub(r'[^a-z0-9]', '', name_en.lower()) if name_en else ""

        if agent_id:  # Only add if we have valid data
            agent_data = {
                "id": agent_id,
                "name_jp": name_jp_only,
                "name_en": name_en,
                "original_name": original_name,
                "color": color,
                "role_type": color_map.get(color, "unknown"),
                "role": role,
                "description": what_do,
                "prompt": generate_image_prompt(name_jp_only, name_en, color, role, what_do)
            }
            agents.append(agent_data)

    return agents

def generate_image_prompt(name_jp, name_en, color, role, description):
    """Generate detailed image prompt for character"""

    # Color to visual style mapping
    color_styles = {
        '🔴': {
            'hair': 'emerald-green',
            'outfit': 'deep forest green conductor\'s uniform with gold aiguillettes',
            'aura': 'commanding red and gold',
            'bg': 'high-tech command center with holographic displays'
        },
        '🟢': {
            'hair': 'dark navy blue',
            'outfit': 'deep blue hoodie with glowing cyan code patterns',
            'aura': 'creative green digital particles',
            'bg': 'cybernetic workspace with Matrix-style data streams'
        },
        '🔵': {
            'hair': 'cool silver-blue',
            'outfit': 'sleek analytical jacket with glowing blue circuit patterns',
            'aura': 'intellectual blue light waves',
            'bg': 'analytical dashboard with data visualizations'
        },
        '🟡': {
            'hair': 'warm honey blonde',
            'outfit': 'comfortable pastel knit cardigan',
            'aura': 'gentle golden glow',
            'bg': 'cozy, sunlit office space with natural light'
        }
    }

    style = color_styles.get(color, color_styles['🟡'])

    prompt = f"""A masterpiece high-quality anime illustration of {name_jp} ({name_en}), featuring {style['hair']} hair and an expression that embodies their role as {role}. {description} They are wearing {style['outfit']}. The character is surrounded by {style['aura']} effects. The background shows {style['bg']}, rendered in a vibrant, professional 2D anime art style with dramatic lighting, sharp details, and cinematic composition. Art style: High-quality Japanese animation studio aesthetic with detailed shading and dynamic pose."""

    return prompt

def main():
    print("🎨 Extracting character information from AGENT_CHARACTERS.md")
    print("=" * 60)

    agents = extract_characters()

    print(f"\n✅ Extracted {len(agents)} characters")

    # Save to prompts.json
    output_file = '.claude/agents/character-images/prompts.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(agents, f, ensure_ascii=False, indent=2)

    print(f"💾 Saved to {output_file}")

    # Print summary
    print("\n📊 Character Summary:")
    for agent in agents:
        print(f"  {agent['color']} {agent['name_jp']} ({agent['name_en']}) - {agent['original_name']}")

    print("\n✨ Next steps:")
    print("1. Review prompts.json")
    print("2. Run batch-generate-images.py to generate detailed descriptions")
    print("3. Use AI image generators to create character images")

if __name__ == "__main__":
    main()
