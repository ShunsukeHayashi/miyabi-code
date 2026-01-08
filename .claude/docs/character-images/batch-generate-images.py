#!/usr/bin/env python3
"""
Batch generate character images using Gemini 3 Pro Preview via MCP
"""

import json
import subprocess
import time
import os
from datetime import datetime

# Load prompts
with open('.claude/agents/character-images/prompts.json', 'r', encoding='utf-8') as f:
    AGENTS = json.load(f)

def call_gemini_for_image(agent_data):
    """Call Gemini via MCP to generate image description"""
    
    # Prepare the prompt for image generation
    prompt = f"""Please create a detailed image description for this character:

{agent_data['prompt']}

Provide a vivid, detailed description that an artist could use to draw this character. Include specific details about:
- Facial features and expressions
- Hair style and color details
- Clothing details and accessories
- Pose and body language
- Background elements
- Overall mood and atmosphere
- Art style: Professional anime/manga illustration

Format: Provide a single paragraph description optimized for image generation."""
    
    # Prepare MCP call
    mcp_request = {
        "question": prompt
    }
    
    # Call MCP
    cmd = [
        "python3", 
        "/Users/shunsuke/mcp-call.py",
        "gemini3-general",
        "ask_gemini",
        json.dumps(mcp_request)
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            return result.stdout
        else:
            print(f"❌ Error for {agent_data['name_jp']}: {result.stderr}")
            return None
    except Exception as e:
        print(f"❌ Exception for {agent_data['name_jp']}: {str(e)}")
        return None

def save_image_description(agent_id, description):
    """Save the generated description for manual image creation"""
    desc_dir = ".claude/agents/character-images/descriptions"
    os.makedirs(desc_dir, exist_ok=True)
    
    filepath = f"{desc_dir}/{agent_id}.txt"
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(description)
    
    return filepath

def main():
    print("🎨 Batch Character Image Generation with Gemini 3 Pro Preview")
    print("=" * 60)
    
    # Create descriptions directory
    os.makedirs(".claude/agents/character-images/descriptions", exist_ok=True)
    
    # Process each agent
    generated = []
    failed = []
    
    for i, agent in enumerate(AGENTS):
        print(f"\n[{i+1}/{len(AGENTS)}] Processing: {agent['name_jp']} ({agent['name_en']})")
        
        # Generate description
        description = call_gemini_for_image(agent)
        
        if description:
            # Save description
            filepath = save_image_description(agent['id'], description)
            print(f"✅ Description saved: {filepath}")
            generated.append(agent['name_jp'])
            
            # Small delay to avoid rate limiting
            if i < len(AGENTS) - 1:
                time.sleep(2)
        else:
            failed.append(agent['name_jp'])
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Generation Summary")
    print(f"✅ Successfully generated: {len(generated)} descriptions")
    print(f"❌ Failed: {len(failed)} descriptions")
    
    if failed:
        print("\n⚠️ Failed agents:")
        for name in failed:
            print(f"  - {name}")
    
    # Create image generation guide
    guide_content = f"""# Image Generation Guide

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📋 Instructions

1. Use the descriptions in the `descriptions/` folder
2. For each description, use your preferred AI image generator:
   - DALL-E 3
   - Midjourney
   - Stable Diffusion
   - Or any other anime-style image generator

3. Save images as PNG files with the corresponding agent ID:
   - coordinator.png
   - codegen.png
   - reviewer.png
   - etc.

## 🎨 Recommended Image Generation Settings

- **Style**: Anime/manga illustration, professional quality
- **Aspect Ratio**: 1:1 or 3:4 (portrait)
- **Resolution**: At least 1024x1024
- **Background**: Include as specified in descriptions

## 📁 File Structure

```
character-images/
├── descriptions/       # Text descriptions for each character
│   ├── coordinator.txt
│   ├── codegen.txt
│   └── ...
├── coordinator.png     # Generated images go here
├── codegen.png
└── ...
```
"""
    
    with open('.claude/agents/character-images/IMAGE_GENERATION_GUIDE.md', 'w') as f:
        f.write(guide_content)
    
    print("\n📄 Image generation guide created: IMAGE_GENERATION_GUIDE.md")
    print("\n✨ Next steps:")
    print("1. Review the generated descriptions in the descriptions/ folder")
    print("2. Use your preferred AI image generator to create the images")
    print("3. Save the images as PNG files in the character-images/ directory")
    print("4. Open gallery.html to view all characters")

if __name__ == "__main__":
    main()