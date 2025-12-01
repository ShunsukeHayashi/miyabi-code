# 🎨 Quick Start: MIYABI TCG Card Generation

## Current Status

**Existing Cards**: 5/24
- ✅ しきるん (Shikiroon) - SSR
- ✅ つくるん (Tsukuroon) - SR
- ✅ めだまん (Medaman) - UR
- ✅ みつけるん (Mitsukeroon) - R
- ✅ まとめるん (Matomeroon) - SR

**Cards to Generate**: 19/24

## 🚀 Quick Start (30 seconds)

### 1. Check Environment
```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
python3 scripts/check_tcg_env.py
```

### 2. Set API Key (if needed)
```bash
export BYTEPLUS_API_KEY="your-api-key-here"
```

### 3. Generate All Cards
```bash
python3 scripts/generate_tcg_cards.py
```

That's it! The script will:
- ⏭️ Skip existing 5 cards
- 🎨 Generate 19 new cards
- ⏱️ Take ~40-60 seconds total
- 💾 Save to `.claude/agents/character-images/unified-tcg-cards/`

## 📊 Expected Output

```
[1/19] Generating: はこぶん (SR)
  → Calling BytePlus ARK API...
  ✓ Saved: hakoboon_unified_SR.png (145.3 KB)
  → Waiting 2s...

[2/19] Generating: つなぐん (R)
  → Calling BytePlus ARK API...
  ✓ Saved: tsunagun_unified_R.png (132.1 KB)
  → Waiting 2s...

...

✓ Success: 19
✗ Failed: 0
Total: 19
```

## 🎯 What You'll Get

19 high-quality TCG cards matching the style of existing cards:
- 1024x1024 PNG images
- Cyberpunk anime style
- Professional TCG layout
- Rarity-specific frames
- Complete stats and skills

## 📝 Detailed Documentation

For full details, see:
- `scripts/README_TCG_GENERATION.md` - Complete guide
- `scripts/TCG_GENERATION_SUMMARY.md` - Detailed summary
- `scripts/generate_tcg_cards.py` - Source code

## ⚡ Troubleshooting One-Liners

```bash
# Check if API key is set
echo $BYTEPLUS_API_KEY

# Install requests library
pip install requests

# View generated cards
ls -lh .claude/agents/character-images/unified-tcg-cards/*.png

# Check generation results
cat .claude/agents/character-images/unified-tcg-cards/generation_results.json
```

## 🎨 Cards Being Generated

| Agent | Type | Rarity | Element |
|-------|------|--------|---------|
| はこぶん | DeploymentAgent | SR | Wind |
| つなぐん | HooksIntegration | R | Tech |
| あきんどさん | AIEntrepreneurAgent | SSR | Light |
| つくろん | ProductConceptAgent | SR | Fire |
| かくん | ProductDesignAgent | SR | Water |
| みちびきん | FunnelDesignAgent | SR | Wind |
| なりきりん | PersonaAgent | R | Earth |
| じぶんさん | SelfAnalysisAgent | R | Dark |
| しらべるん | MarketResearchAgent | R | Tech |
| ひろめるん | MarketingAgent | SR | Fire |
| かくちゃん | ContentCreationAgent | SR | Water |
| つぶやきん | SNSStrategyAgent | R | Wind |
| どうがん | YouTubeAgent | SR | Fire |
| うるん | SalesAgent | SR | Earth |
| おきゃくさま | CRMAgent | SR | Light |
| かぞえるん | AnalyticsAgent | R | Tech |
| かきこちゃん | NoteAgent | SR | Light |
| えがくん | ImageGenAgent | SSR | Fire |
| ほのかちゃん | HonokaAgent | UR | Light |

**Rarity Count**:
- R: 6 cards (Blue)
- SR: 10 cards (Silver-blue)
- SSR: 2 cards (Gold)
- UR: 1 card (Rainbow holographic)

---

**Ready to generate? Just run:**
```bash
python3 scripts/generate_tcg_cards.py
```
