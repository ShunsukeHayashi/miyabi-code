#!/usr/bin/env python3
"""
Clean up extra image files not in the gallery
"""

from pathlib import Path

# Expected characters from gallery
EXPECTED = {
    'shikiroon', 'tsukuroon', 'medaman', 'mitsukeroon', 'matomeroon', 
    'hakoboon', 'tsunagun', 'kikakuron', 'jibunkun', 'shiraberu', 
    'perusona', 'konseputan', 'dezainyan', 'kakuchan', 'notesan', 
    'janelkun', 'snssun', 'makettosama', 'saerusu', 'cusrelo', 
    'bunsekyking', 'yuchubeler', 'imargesan', 'gasladen'
}

def cleanup():
    generated_dir = Path(__file__).parent / 'generated'
    
    # Find all PNG files
    all_files = list(generated_dir.glob('*.png'))
    
    # Separate into expected and extra
    expected_files = []
    extra_files = []
    
    for f in all_files:
        if f.stem in EXPECTED:
            expected_files.append(f)
        else:
            extra_files.append(f)
    
    print(f"Expected files: {len(expected_files)}")
    print(f"Extra files: {len(extra_files)}")
    
    if extra_files:
        print("\n=== Extra files to remove ===")
        for f in extra_files:
            print(f"- {f.name}")
        
        response = input("\nRemove extra files? (y/n): ")
        if response.lower() == 'y':
            for f in extra_files:
                f.unlink()
                print(f"Removed {f.name}")
    
    # Check for missing
    existing_names = {f.stem for f in expected_files}
    missing = EXPECTED - existing_names
    
    if missing:
        print(f"\n=== Missing files ===")
        for name in sorted(missing):
            print(f"- {name}.png")
    else:
        print("\n✅ All expected files are present!")
    
    print(f"\nFinal count: {len(list(generated_dir.glob('*.png')))} files")

if __name__ == '__main__':
    cleanup()