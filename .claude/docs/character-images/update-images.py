#!/usr/bin/env python3
"""
Update character images - rename mismatched files and generate missing ones
"""

import os
import shutil
from pathlib import Path

# Expected characters
EXPECTED = {
    'shikiroon', 'tsukuroon', 'medaman', 'mitsukeroon', 'matomeroon', 
    'hakoboon', 'tsunagun', 'kikakuron', 'jibunkun', 'shiraberu', 
    'perusona', 'konseputan', 'dezainyan', 'kakuchan', 'notesan', 
    'janelkun', 'snssun', 'makettosama', 'saerusu', 'cusrelo', 
    'bunsekyking', 'yuchubeler', 'imargesan', 'gasladen'
}

# Known renames
RENAMES = {
    'jibunsan.png': 'jibunkun.png',
    'shiraberoon.png': 'shiraberu.png',
}

def update_images():
    generated_dir = Path(__file__).parent / 'generated'
    
    # First, rename mismatched files
    print("=== Renaming mismatched files ===")
    for old_name, new_name in RENAMES.items():
        old_path = generated_dir / old_name
        new_path = generated_dir / new_name
        if old_path.exists() and not new_path.exists():
            shutil.move(old_path, new_path)
            print(f"✓ Renamed {old_name} → {new_name}")
    
    # Check what exists now
    existing = set()
    for f in generated_dir.glob('*.png'):
        name = f.stem
        if name in EXPECTED:
            existing.add(name)
    
    # Find missing
    missing = EXPECTED - existing
    
    print(f"\n=== Status ===")
    print(f"Expected: {len(EXPECTED)} characters")
    print(f"Existing: {len(existing)} characters")
    print(f"Missing: {len(missing)} characters")
    
    if missing:
        print(f"\n=== Missing Characters ===")
        for char in sorted(missing):
            print(f"- {char}")
    
    # Generate command for missing characters
    if missing:
        print(f"\n=== To generate missing images, run: ===")
        print("python3 generate-all-characters.py")
    else:
        print("\n✅ All character images are present!")

if __name__ == '__main__':
    update_images()