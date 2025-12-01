# MIYABI TCG Card Verification Checklist

After running `generate_tcg_cards.py`, use this checklist to verify all cards.

## 📋 Automated Checks

Run these commands to verify basic requirements:

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private

# 1. Count generated files (should be 24 total: 5 existing + 19 new)
ls -1 .claude/agents/character-images/unified-tcg-cards/*.png | wc -l

# 2. Check file sizes (should be 50-500 KB)
ls -lh .claude/agents/character-images/unified-tcg-cards/*.png

# 3. Check for errors in results
cat .claude/agents/character-images/unified-tcg-cards/generation_results.json | grep -i "error"

# 4. Verify all rarities are present
ls -1 .claude/agents/character-images/unified-tcg-cards/*_R.png | wc -l    # Should be 6
ls -1 .claude/agents/character-images/unified-tcg-cards/*_SR.png | wc -l   # Should be 12
ls -1 .claude/agents/character-images/unified-tcg-cards/*_SSR.png | wc -l  # Should be 4
ls -1 .claude/agents/character-images/unified-tcg-cards/*_UR.png | wc -l   # Should be 2
```

## ✅ Manual Visual Inspection

For each card, verify the following elements:

### Card Structure

- [ ] **Top Bar Present**
  - [ ] Rarity badge visible (R/SR/SSR/UR)
  - [ ] Element icon visible
  - [ ] Level number visible (Lv.XX)

- [ ] **Card Frame**
  - [ ] Frame color matches rarity
    - R = Blue
    - SR = Silver-blue gradient
    - SSR = Gold
    - UR = Rainbow holographic
  - [ ] Frame is complete (no cut-offs)

- [ ] **Character Artwork**
  - [ ] Character is centered
  - [ ] Character is visible and clear
  - [ ] Anime style maintained
  - [ ] Background is cyberpunk cityscape
  - [ ] No distortion or artifacts

- [ ] **Name Bar**
  - [ ] Japanese name visible: 【name】title
  - [ ] Text is readable

- [ ] **Stats Bar**
  - [ ] HP value visible with ❤️
  - [ ] ATK value visible with ⚔️
  - [ ] DEF value visible with 🛡️
  - [ ] SPD value visible with ⚡
  - [ ] Type badge present: Type: [AgentType]

- [ ] **Skill Box**
  - [ ] Skill name in brackets: 【name】
  - [ ] Skill description visible
  - [ ] Japanese text readable

- [ ] **Bottom Bar**
  - [ ] Card number present: No.XXX
  - [ ] Edition text: 1st Edition
  - [ ] Evolution arrow: →name
  - [ ] Copyright: MIYABI TCG © 2025

### Quality Checks

- [ ] **Resolution**: 1024x1024 pixels
- [ ] **File Format**: PNG
- [ ] **File Size**: 50-500 KB (optimal: 100-200 KB)
- [ ] **Color Quality**: Vibrant, no washed-out colors
- [ ] **Sharpness**: No blur, clear details
- [ ] **Compression Artifacts**: None visible

## 📊 Per-Card Checklist

Mark each card as you verify:

### Existing Cards (Already Generated)
- [ ] しきるん (shikiroon_unified_SSR.png)
- [ ] つくるん (tsukuroon_unified_SR.png)
- [ ] めだまん (medaman_unified_UR.png)
- [ ] みつけるん (mitsukeroon_unified_R.png)
- [ ] まとめるん (matomeroon_unified_SR.png)

### New Cards (To Be Generated)
- [ ] はこぶん (hakoboon_unified_SR.png)
- [ ] つなぐん (tsunagun_unified_R.png)
- [ ] あきんどさん (akindosan_unified_SSR.png)
- [ ] つくろん (tsukuron_product_unified_SR.png)
- [ ] かくん (kakun_unified_SR.png)
- [ ] みちびきん (michibikin_unified_SR.png)
- [ ] なりきりん (narikirin_unified_R.png)
- [ ] じぶんさん (jibunsan_unified_R.png)
- [ ] しらべるん (shiraberoon_unified_R.png)
- [ ] ひろめるん (hiromeroon_unified_SR.png)
- [ ] かくちゃん (kakuchan_unified_SR.png)
- [ ] つぶやきん (tsubuyakin_unified_R.png)
- [ ] どうがん (dougan_unified_SR.png)
- [ ] うるん (uroon_unified_SR.png)
- [ ] おきゃくさま (okyakusama_unified_SR.png)
- [ ] かぞえるん (kazoeroon_unified_R.png)
- [ ] かきこちゃん (kakikochan_unified_SR.png)
- [ ] えがくん (egakun_unified_SSR.png)
- [ ] ほのかちゃん (honokachan_unified_UR.png)

## 🔍 Detailed Verification Script

Create a simple verification script:

```python
#!/usr/bin/env python3
import os
from pathlib import Path
from PIL import Image

OUTPUT_DIR = Path(".claude/agents/character-images/unified-tcg-cards")

def verify_cards():
    print("Verifying MIYABI TCG Cards...")
    print("=" * 60)

    cards = sorted(OUTPUT_DIR.glob("*.png"))

    for card_path in cards:
        # Get file info
        file_size = card_path.stat().st_size / 1024  # KB

        # Open image
        img = Image.open(card_path)
        width, height = img.size

        # Check criteria
        size_ok = 50 <= file_size <= 500
        res_ok = width == 1024 and height == 1024

        status = "✓" if size_ok and res_ok else "⚠"

        print(f"{status} {card_path.name}")
        print(f"   Size: {file_size:.1f} KB | Resolution: {width}x{height}")

        if not size_ok:
            print(f"   WARNING: File size out of range (50-500 KB)")
        if not res_ok:
            print(f"   WARNING: Resolution not 1024x1024")
        print()

    print("=" * 60)
    print(f"Total Cards: {len(cards)}/24")

if __name__ == "__main__":
    verify_cards()
```

Save as `scripts/verify_cards.py` and run:
```bash
python3 scripts/verify_cards.py
```

## 🚨 Common Issues & Fixes

### Issue 1: Card appears blurry
**Cause**: Low quality generation or compression
**Fix**: Regenerate with higher quality prompt or larger size

### Issue 2: Text is unreadable
**Cause**: Font size too small or poor rendering
**Fix**: Adjust prompt to emphasize "large readable text"

### Issue 3: Character cut off
**Cause**: Composition issue in generation
**Fix**: Regenerate with "centered full body visible" in prompt

### Issue 4: Wrong colors
**Cause**: Element/rarity mismatch
**Fix**: Verify prompt has correct element and rarity specified

### Issue 5: Frame missing or incomplete
**Cause**: Prompt didn't specify frame clearly
**Fix**: Add "complete card frame border" to prompt

### Issue 6: File size too large (>500 KB)
**Cause**: High detail or no compression
**Fix**: Use image optimization tools:
```bash
# Using ImageMagick
convert input.png -quality 85 -strip output.png

# Using pngquant
pngquant --quality=80-95 input.png -o output.png
```

### Issue 7: File size too small (<50 KB)
**Cause**: Over-compression or low quality
**Fix**: Regenerate with better quality settings

## 📸 Screenshot Comparison

For visual comparison, open reference cards alongside new cards:

```bash
# macOS
open .claude/agents/character-images/unified-tcg-cards/shikiroon_unified_SSR.png
open .claude/agents/character-images/unified-tcg-cards/egakun_unified_SSR.png

# Compare side by side
```

Check for:
- Consistent style
- Similar level of detail
- Matching frame aesthetics
- Comparable character quality

## ✅ Final Approval Checklist

Before committing to repository:

- [ ] All 24 cards generated successfully
- [ ] All file sizes in acceptable range (50-500 KB)
- [ ] All resolutions are 1024x1024
- [ ] Visual spot-check passed for all cards
- [ ] No obvious quality issues
- [ ] Cards match reference style
- [ ] generation_results.json shows 100% success
- [ ] Ready to commit

## 🎯 Commit Template

After successful verification:

```bash
git add .claude/agents/character-images/unified-tcg-cards/*.png
git add .claude/agents/character-images/unified-tcg-cards/generation_results.json

git commit -m "feat(agents): Add 19 MIYABI TCG cards completing 24-card set

Generated using BytePlus ARK API (seedream-4-0-250828):
- 6 R (Rare) cards
- 10 SR (Super Rare) cards
- 2 SSR (Super Super Rare) cards
- 1 UR (Ultra Rare) card

All cards verified for:
- 1024x1024 resolution
- 100-200 KB file size
- Cyberpunk TCG style consistency
- Complete card elements

Ref: #issue-number"
```

---

**Verification Complete**: ___/___/___
**Verified By**: _______________
**Issues Found**: ___ (0 = Ready to commit)
