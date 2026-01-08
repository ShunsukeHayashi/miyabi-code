#!/usr/bin/env python3
"""
Create placeholder images for missing characters
"""

from PIL import Image, ImageDraw, ImageFont
import os
from pathlib import Path

# Missing characters
MISSING_CHARACTERS = [
    {'id': 'kikakuron', 'name': 'きかくろん', 'color': '#667eea'},
    {'id': 'perusona', 'name': 'ぺるそな', 'color': '#ff6b6b'},
    {'id': 'konseputan', 'name': 'こんせぷたん', 'color': '#ff69b4'},
    {'id': 'dezainyan', 'name': 'でざいにゃん', 'color': '#9370db'},
    {'id': 'notesan', 'name': 'のーとさん', 'color': '#4169e1'},
    {'id': 'janelkun', 'name': 'じゃねるくん', 'color': '#20b2aa'},
    {'id': 'snssun', 'name': 'すんすさん', 'color': '#ff4500'},
    {'id': 'makettosama', 'name': 'まけっとさま', 'color': '#ffd700'},
    {'id': 'saerusu', 'name': 'せーるすせんせい', 'color': '#32cd32'},
    {'id': 'cusrelo', 'name': 'かすれろちゃん', 'color': '#ff69b4'},
    {'id': 'bunsekyking', 'name': 'ぶんせききんぐ', 'color': '#4169e1'},
    {'id': 'yuchubeler', 'name': 'ゆーちゅーべらー', 'color': '#ff0000'},
    {'id': 'imargesan', 'name': 'いまーじゅさん', 'color': '#ff1493'},
    {'id': 'gasladen', 'name': 'すらいどん', 'color': '#ff8c00'},
]

def create_placeholder(character, size=512):
    """Create a placeholder image for a character"""
    # Create image with white background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw colored circle background
    margin = size // 8
    circle_bounds = [margin, margin, size - margin, size - margin]
    draw.ellipse(circle_bounds, fill=character['color'] + '33', outline=character['color'], width=3)
    
    # Draw emoji robot in center
    emoji_size = size // 3
    emoji_y = size // 2 - emoji_size // 2
    
    try:
        # Try to use a system font that supports emojis
        font = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", emoji_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Draw robot emoji
    text = "🤖"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - size // 10
    
    draw.text((text_x, text_y), text, fill='black', font=font)
    
    # Draw character name
    try:
        name_font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc", 24)
    except:
        name_font = ImageFont.load_default()
    
    name = character['name']
    bbox = draw.textbbox((0, 0), name, font=name_font)
    name_width = bbox[2] - bbox[0]
    name_x = (size - name_width) // 2
    name_y = size - margin - 40
    
    draw.text((name_x, name_y), name, fill=character['color'], font=name_font)
    
    # Add "PLACEHOLDER" text
    placeholder_text = "PLACEHOLDER"
    try:
        placeholder_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except:
        placeholder_font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), placeholder_text, font=placeholder_font)
    placeholder_width = bbox[2] - bbox[0]
    placeholder_x = (size - placeholder_width) // 2
    placeholder_y = margin + 20
    
    draw.text((placeholder_x, placeholder_y), placeholder_text, fill='#888888', font=placeholder_font)
    
    return img

def main():
    # Create output directory
    output_dir = Path(__file__).parent / 'generated'
    output_dir.mkdir(exist_ok=True)
    
    # Generate placeholders for missing characters
    created = 0
    for character in MISSING_CHARACTERS:
        output_path = output_dir / f"{character['id']}.png"
        
        if not output_path.exists():
            print(f"Creating placeholder for {character['name']}...")
            img = create_placeholder(character)
            img.save(output_path, 'PNG')
            created += 1
        else:
            print(f"✓ {character['name']} already exists")
    
    print(f"\nCreated {created} placeholder images")

if __name__ == '__main__':
    main()