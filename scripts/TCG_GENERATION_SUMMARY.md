# MIYABI TCG Card Generation - Summary

## What Was Created

I've created a complete system to generate MIYABI TCG card images for all 24 agents using BytePlus ARK API.

### Files Created

1. **`scripts/generate_tcg_cards.py`** (Main Generator)
   - Full-featured TCG card generation script
   - Generates 19 missing agent cards
   - Uses BytePlus ARK API (seedream-4-0-250828)
   - Implements rate limiting (2s between calls)
   - Saves results to JSON

2. **`scripts/check_tcg_env.py`** (Environment Checker)
   - Verifies Python version
   - Checks BYTEPLUS_API_KEY
   - Validates dependencies
   - Lists existing cards

3. **`scripts/README_TCG_GENERATION.md`** (Documentation)
   - Complete usage guide
   - Troubleshooting tips
   - Card specifications
   - Manual generation instructions

## Agents to Generate (19 Cards)

Based on your request, these agents will be generated:

| # | Agent Name | Type | Rarity | Element | Level |
|---|------------|------|--------|---------|-------|
| 1 | はこぶん | DeploymentAgent | SR | Wind | 36 |
| 2 | つなぐん | HooksIntegration | R | Tech | 28 |
| 3 | あきんどさん | AIEntrepreneurAgent | SSR | Light | 50 |
| 4 | つくろん | ProductConceptAgent | SR | Fire | 40 |
| 5 | かくん | ProductDesignAgent | SR | Water | 39 |
| 6 | みちびきん | FunnelDesignAgent | SR | Wind | 37 |
| 7 | なりきりん | PersonaAgent | R | Earth | 30 |
| 8 | じぶんさん | SelfAnalysisAgent | R | Dark | 29 |
| 9 | しらべるん | MarketResearchAgent | R | Tech | 32 |
| 10 | ひろめるん | MarketingAgent | SR | Fire | 41 |
| 11 | かくちゃん | ContentCreationAgent | SR | Water | 38 |
| 12 | つぶやきん | SNSStrategyAgent | R | Wind | 33 |
| 13 | どうがん | YouTubeAgent | SR | Fire | 40 |
| 14 | うるん | SalesAgent | SR | Earth | 39 |
| 15 | おきゃくさま | CRMAgent | SR | Light | 37 |
| 16 | かぞえるん | AnalyticsAgent | R | Tech | 31 |
| 17 | かきこちゃん | NoteAgent | SR | Light | 38 |
| 18 | えがくん | ImageGenAgent | SSR | Fire | 45 |
| 19 | ほのかちゃん | HonokaAgent | UR | Light | 55 |

### Rarity Distribution
- **R (Rare)**: 6 cards - Blue frame
- **SR (Super Rare)**: 10 cards - Silver-blue gradient
- **SSR (Super Super Rare)**: 2 cards - Gold frame
- **UR (Ultra Rare)**: 1 card - Rainbow holographic

### Element Distribution
- Fire: 5 cards 🔥
- Water: 2 cards 💧
- Wind: 3 cards 💨
- Earth: 2 cards 🌍
- Light: 5 cards ✨
- Dark: 1 card 🌙
- Tech: 5 cards ⚡

## How to Run

### Step 1: Check Environment

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
python3 scripts/check_tcg_env.py
```

This will verify:
- Python 3.7+ is installed
- BYTEPLUS_API_KEY is set
- `requests` library is available
- Output directory exists
- Reference cards are present

### Step 2: Set API Key (if not set)

```bash
export BYTEPLUS_API_KEY="your-byteplus-ark-api-key"
```

### Step 3: Run Generator

```bash
python3 scripts/generate_tcg_cards.py
```

Expected output:
```
================================================================================
MIYABI TCG Card Generator
================================================================================
Output Directory: .../unified-tcg-cards
Total Cards to Generate: 19
================================================================================

[1/19] Generating: はこぶん (SR)
  → Calling BytePlus ARK API for hakoboon_unified_SR.png...
  ✓ Saved: hakoboon_unified_SR.png (145.3 KB)
  → Waiting 2s (rate limit)...

[2/19] Generating: つなぐん (R)
...
```

### Step 4: Verify Results

```bash
# List generated files
ls -lh .claude/agents/character-images/unified-tcg-cards/*.png

# Check results JSON
cat .claude/agents/character-images/unified-tcg-cards/generation_results.json
```

## Card Design Specifications

### Layout (Matching Reference Cards)

Based on `shikiroon_unified_SSR.png` and `tsukuroon_unified_SR.png`:

1. **Top Bar**
   - Rarity badge (left): R/SR/SSR/UR
   - Element icon (center): 🔥💧💨🌍✨🌙⚡
   - Level (right): Lv.XX

2. **Card Frame**
   - Rarity-specific color
   - Cyberpunk aesthetic
   - Neon glow effects

3. **Character Artwork**
   - Centered, full illustration
   - Anime-style character
   - Cyberpunk cityscape background
   - Action pose or professional stance

4. **Name Bar**
   - Japanese format: 【キャラ名】タイトル
   - Example: 【はこぶん】配達スタッフ

5. **Stats Bar**
   - HP: ❤️ (1000-2200)
   - ATK: ⚔️ (600-1300)
   - DEF: 🛡️ (500-1100)
   - SPD: ⚡ (700-950)

6. **Type Badge**
   - Format: Type: [AgentType]
   - Example: Type: [DeploymentAgent]

7. **Skill Box**
   - Skill name in brackets: 【スキル名】
   - Effect description
   - 2-3 lines max

8. **Bottom Bar**
   - Card number: No.XXX / 1st Edition
   - Evolution: →進化形EX
   - Copyright: MIYABI TCG © 2025

### Image Specifications

- **Size**: 1024x1024 pixels
- **Format**: PNG
- **Quality**: High detail, 8k prompt
- **File Size**: 100-200 KB target
- **Color Space**: sRGB
- **Style**: Anime cyberpunk TCG

## Estimated Generation Time

- API calls: ~5-10 seconds per card
- Rate limit delay: 2 seconds between calls
- Total time: ~40-60 seconds for all 19 cards

## Output Location

All cards will be saved to:
```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards/
```

Files:
```
hakoboon_unified_SR.png
tsunagun_unified_R.png
akindosan_unified_SSR.png
tsukuron_product_unified_SR.png
kakun_unified_SR.png
michibikin_unified_SR.png
narikirin_unified_R.png
jibunsan_unified_R.png
shiraberoon_unified_R.png
hiromeroon_unified_SR.png
kakuchan_unified_SR.png
tsubuyakin_unified_R.png
dougan_unified_SR.png
uroon_unified_SR.png
okyakusama_unified_SR.png
kazoeroon_unified_R.png
kakikochan_unified_SR.png
egakun_unified_SSR.png
honokachan_unified_UR.png
```

## Quality Assurance

After generation, verify:

1. **File Existence**: All 19 PNG files present
2. **File Size**: 50-500 KB range (quality indicator)
3. **Image Quality**: 1024x1024, clear and detailed
4. **Card Elements**: All text/stats visible
5. **Style Consistency**: Matches reference cards

## Troubleshooting

### Common Issues

**Issue 1: API Key Error**
```
ERROR: BYTEPLUS_API_KEY environment variable not set
```
Solution: `export BYTEPLUS_API_KEY="your-key"`

**Issue 2: Module Not Found**
```
ModuleNotFoundError: No module named 'requests'
```
Solution: `pip install requests`

**Issue 3: Rate Limit**
```
429 Too Many Requests
```
Solution: Wait 60 seconds, run again

**Issue 4: Low Quality Images**
- Check prompt quality
- Verify API model: seedream-4-0-250828
- Increase size parameter if needed

## Next Steps

After successful generation:

1. **Review All Cards**
   - Open each PNG in image viewer
   - Check for quality issues
   - Verify text readability

2. **Regenerate if Needed**
   - Delete low-quality cards
   - Run script again (skips existing)

3. **Commit to Repository**
   ```bash
   git add .claude/agents/character-images/unified-tcg-cards/*.png
   git commit -m "feat: Add 19 MIYABI TCG agent cards"
   ```

4. **Update Documentation**
   - Add cards to agent gallery
   - Update character documentation
   - Create showcase page

## API Usage Estimate

- **Total API Calls**: 19 (one per agent)
- **Cost per Call**: ~$0.01-0.02 (estimate)
- **Total Cost**: ~$0.20-0.40 (estimate)
- **Model**: seedream-4-0-250828
- **Resolution**: 1024x1024

## Contact & Support

- **BytePlus ARK Docs**: https://www.byteplus.com/docs/
- **API Issues**: Check BytePlus console
- **Script Issues**: Check generation_results.json

---

**Created**: 2025-11-30
**Script Version**: 1.0
**Model**: seedream-4-0-250828
**Target**: 19 agent cards (completing 24-card set)
