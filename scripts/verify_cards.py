#!/usr/bin/env python3
"""
MIYABI TCG Card Verification Tool
Verify all generated cards meet quality standards
"""

import os
import sys
from pathlib import Path

# Try to import PIL, provide fallback
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("Warning: PIL (Pillow) not installed. Limited verification available.")
    print("Install with: pip install Pillow")
    print()

OUTPUT_DIR = Path("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards")

# Expected cards (24 total)
EXPECTED_CARDS = {
    # Existing (5)
    "shikiroon_unified_SSR.png": "SSR",
    "tsukuroon_unified_SR.png": "SR",
    "medaman_unified_UR.png": "UR",
    "mitsukeroon_unified_R.png": "R",
    "matomeroon_unified_SR.png": "SR",
    # New (19)
    "hakoboon_unified_SR.png": "SR",
    "tsunagun_unified_R.png": "R",
    "akindosan_unified_SSR.png": "SSR",
    "tsukuron_product_unified_SR.png": "SR",
    "kakun_unified_SR.png": "SR",
    "michibikin_unified_SR.png": "SR",
    "narikirin_unified_R.png": "R",
    "jibunsan_unified_R.png": "R",
    "shiraberoon_unified_R.png": "R",
    "hiromeroon_unified_SR.png": "SR",
    "kakuchan_unified_SR.png": "SR",
    "tsubuyakin_unified_R.png": "R",
    "dougan_unified_SR.png": "SR",
    "uroon_unified_SR.png": "SR",
    "okyakusama_unified_SR.png": "SR",
    "kazoeroon_unified_R.png": "R",
    "kakikochan_unified_SR.png": "SR",
    "egakun_unified_SSR.png": "SSR",
    "honokachan_unified_UR.png": "UR",
}

def verify_basic():
    """Basic verification without PIL"""
    print("=" * 70)
    print("MIYABI TCG Card Verification - Basic Mode")
    print("=" * 70)

    if not OUTPUT_DIR.exists():
        print(f"ERROR: Directory not found: {OUTPUT_DIR}")
        return False

    cards = sorted(OUTPUT_DIR.glob("*.png"))

    print(f"\nFound: {len(cards)}/24 cards")
    print()

    issues = []
    warnings = []

    for card_path in cards:
        file_size_kb = card_path.stat().st_size / 1024

        # Check file size
        if file_size_kb < 50:
            status = "⚠"
            warnings.append(f"{card_path.name}: File too small ({file_size_kb:.1f} KB)")
        elif file_size_kb > 500:
            status = "⚠"
            warnings.append(f"{card_path.name}: File too large ({file_size_kb:.1f} KB)")
        else:
            status = "✓"

        # Check if expected
        if card_path.name not in EXPECTED_CARDS:
            status = "?"
            warnings.append(f"{card_path.name}: Unexpected file")

        print(f"{status} {card_path.name:40s} {file_size_kb:6.1f} KB")

    # Check for missing cards
    existing_names = {c.name for c in cards}
    missing = set(EXPECTED_CARDS.keys()) - existing_names

    print()
    print("=" * 70)
    print(f"Summary: {len(cards)}/24 cards found")

    if missing:
        print(f"\nMissing Cards ({len(missing)}):")
        for m in sorted(missing):
            print(f"  ✗ {m}")
            issues.append(f"Missing: {m}")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings[:5]:  # Show first 5
            print(f"  ⚠ {w}")
        if len(warnings) > 5:
            print(f"  ... and {len(warnings) - 5} more")

    if issues:
        print(f"\nIssues ({len(issues)}):")
        for i in issues:
            print(f"  ✗ {i}")

    print("=" * 70)

    return len(issues) == 0 and len(warnings) == 0

def verify_with_pil():
    """Full verification with PIL"""
    print("=" * 70)
    print("MIYABI TCG Card Verification - Full Mode")
    print("=" * 70)

    if not OUTPUT_DIR.exists():
        print(f"ERROR: Directory not found: {OUTPUT_DIR}")
        return False

    cards = sorted(OUTPUT_DIR.glob("*.png"))

    print(f"\nFound: {len(cards)}/24 cards")
    print()

    issues = []
    warnings = []

    for card_path in cards:
        try:
            # Get file info
            file_size_kb = card_path.stat().st_size / 1024

            # Open image
            img = Image.open(card_path)
            width, height = img.size
            mode = img.mode

            # Check criteria
            size_ok = 50 <= file_size_kb <= 500
            res_ok = width == 1024 and height == 1024
            mode_ok = mode in ["RGB", "RGBA"]

            # Determine status
            if not size_ok or not res_ok or not mode_ok:
                status = "⚠"
            else:
                status = "✓"

            print(f"{status} {card_path.name:40s} {file_size_kb:6.1f} KB  {width}x{height}  {mode}")

            # Collect issues
            if not size_ok:
                if file_size_kb < 50:
                    warnings.append(f"{card_path.name}: File too small ({file_size_kb:.1f} KB)")
                else:
                    warnings.append(f"{card_path.name}: File too large ({file_size_kb:.1f} KB)")

            if not res_ok:
                issues.append(f"{card_path.name}: Wrong resolution ({width}x{height}, expected 1024x1024)")

            if not mode_ok:
                warnings.append(f"{card_path.name}: Unexpected color mode ({mode})")

            # Check if expected
            if card_path.name not in EXPECTED_CARDS:
                warnings.append(f"{card_path.name}: Unexpected file")

        except Exception as e:
            print(f"✗ {card_path.name:40s} ERROR: {str(e)}")
            issues.append(f"{card_path.name}: {str(e)}")

    # Check for missing cards
    existing_names = {c.name for c in cards}
    missing = set(EXPECTED_CARDS.keys()) - existing_names

    # Rarity distribution
    rarity_count = {"R": 0, "SR": 0, "SSR": 0, "UR": 0}
    for card_name in existing_names:
        if card_name in EXPECTED_CARDS:
            rarity = EXPECTED_CARDS[card_name]
            rarity_count[rarity] += 1

    print()
    print("=" * 70)
    print(f"Summary: {len(cards)}/24 cards found")
    print()
    print("Rarity Distribution:")
    print(f"  R (Rare):           {rarity_count['R']}/6")
    print(f"  SR (Super Rare):    {rarity_count['SR']}/12")
    print(f"  SSR (Super S Rare): {rarity_count['SSR']}/4")
    print(f"  UR (Ultra Rare):    {rarity_count['UR']}/2")

    if missing:
        print(f"\nMissing Cards ({len(missing)}):")
        for m in sorted(missing):
            rarity = EXPECTED_CARDS.get(m, "?")
            print(f"  ✗ {m:40s} ({rarity})")
            issues.append(f"Missing: {m}")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings[:10]:
            print(f"  ⚠ {w}")
        if len(warnings) > 10:
            print(f"  ... and {len(warnings) - 10} more")

    if issues:
        print(f"\nIssues ({len(issues)}):")
        for i in issues[:10]:
            print(f"  ✗ {i}")
        if len(issues) > 10:
            print(f"  ... and {len(issues) - 10} more")

    print("=" * 70)

    if len(issues) == 0 and len(warnings) == 0:
        print("✅ All cards PASSED verification!")
        print("\nReady to commit:")
        print("  git add .claude/agents/character-images/unified-tcg-cards/*.png")
        print("  git commit -m 'feat(agents): Add MIYABI TCG cards'")
    elif len(issues) == 0:
        print(f"⚠ Verification PASSED with {len(warnings)} warnings")
        print("\nPlease review warnings before committing.")
    else:
        print(f"❌ Verification FAILED with {len(issues)} issues")
        print("\nPlease fix issues before committing.")

    print("=" * 70)

    return len(issues) == 0

def main():
    """Main execution"""
    if HAS_PIL:
        success = verify_with_pil()
    else:
        success = verify_basic()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
