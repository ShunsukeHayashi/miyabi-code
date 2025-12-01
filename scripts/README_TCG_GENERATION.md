# MIYABI TCG Card Generation Guide

## Overview

This script generates TCG card images for 19 MIYABI agents using BytePlus ARK API.

## Prerequisites

1. **BytePlus API Key**: Must be set in environment
   ```bash
   export BYTEPLUS_API_KEY="your-api-key-here"
   ```

2. **Python 3.7+**: With `requests` library
   ```bash
   pip install requests
   ```

## Agents to Generate

The script will generate cards for these 19 agents:

1. はこぶん (Hakoboon) - DeploymentAgent - SR - Wind
2. つなぐん (Tsunagun) - HooksIntegration - R - Tech
3. あきんどさん (Akindosan) - AIEntrepreneurAgent - SSR - Light
4. つくろん (Tsukuron) - ProductConceptAgent - SR - Fire
5. かくん (Kakun) - ProductDesignAgent - SR - Water
6. みちびきん (Michibikin) - FunnelDesignAgent - SR - Wind
7. なりきりん (Narikirin) - PersonaAgent - R - Earth
8. じぶんさん (Jibunsan) - SelfAnalysisAgent - R - Dark
9. しらべるん (Shiraberoon) - MarketResearchAgent - R - Tech
10. ひろめるん (Hiromeroon) - MarketingAgent - SR - Fire
11. かくちゃん (Kakuchan) - ContentCreationAgent - SR - Water
12. つぶやきん (Tsubuyakin) - SNSStrategyAgent - R - Wind
13. どうがん (Dougan) - YouTubeAgent - SR - Fire
14. うるん (Uroon) - SalesAgent - SR - Earth
15. おきゃくさま (Okyakusama) - CRMAgent - SR - Light
16. かぞえるん (Kazoeroon) - AnalyticsAgent - R - Tech
17. かきこちゃん (Kakikochan) - NoteAgent - SR - Light
18. えがくん (Egakun) - ImageGenAgent - SSR - Fire
19. ほのかちゃん (Honokachan) - HonokaAgent - UR - Light

## Running the Script

### Method 1: Direct Execution

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
python3 scripts/generate_tcg_cards.py
```

### Method 2: Using Termux (Pixel)

```bash
# Navigate to project
m  # or cd ~/Dev/miyabi-private

# Ensure API key is set
echo $BYTEPLUS_API_KEY

# Run script
python3 scripts/generate_tcg_cards.py
```

## Output

All generated images will be saved to:
```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.claude/agents/character-images/unified-tcg-cards/
```

Filename format: `{agent_id}_unified_{RARITY}.png`

Examples:
- `hakoboon_unified_SR.png`
- `akindosan_unified_SSR.png`
- `honokachan_unified_UR.png`

## Card Specifications

### Image Format
- Size: 1024x1024 pixels
- Format: PNG
- Quality: High (8k quality prompt)
- Target file size: 100-200 KB per card

### Rarity Tiers
- **R (Rare)**: Blue frame
- **SR (Super Rare)**: Silver-blue gradient frame
- **SSR (Super Super Rare)**: Gold frame
- **UR (Ultra Rare)**: Rainbow holographic frame

### Card Elements
- Top bar: Rarity badge | Element icon | Level
- Character artwork (center)
- Japanese name: 【キャラ名】タイトル
- Stats: HP/ATK/DEF/SPD
- Type badge
- Skill description
- Bottom: Card number / Edition | Evolution | Copyright

## Rate Limiting

The script enforces a 2-second delay between API calls to respect BytePlus rate limits.

Expected total time: ~40 seconds for 19 cards (19 × 2s)

## Results

After completion, check:
```
.claude/agents/character-images/unified-tcg-cards/generation_results.json
```

This JSON file contains:
- Timestamp
- Success/failure counts
- Detailed results for each card
- Error messages for failed generations

## Troubleshooting

### API Key Error
```
ERROR: BYTEPLUS_API_KEY environment variable not set
```
**Solution**: Export the API key
```bash
export BYTEPLUS_API_KEY="your-key-here"
```

### API Timeout
```
API request timeout (60s)
```
**Solution**: Run the script again (failed cards will be regenerated)

### Rate Limit Hit
```
429 Too Many Requests
```
**Solution**: Wait 60 seconds and run again

### File Already Exists
The script will skip cards that already exist. To regenerate:
```bash
rm .claude/agents/character-images/unified-tcg-cards/{agent_id}_unified_{RARITY}.png
python3 scripts/generate_tcg_cards.py
```

## Manual Generation (Single Card)

If you need to generate a single card manually:

```python
python3 -c "
from scripts.generate_tcg_cards import AGENTS_DATA, generate_card_prompt, call_byteplus_api
agent = AGENTS_DATA[0]  # Change index for different agent
prompt = generate_card_prompt(agent)
filename = f\"{agent['id']}_unified_{agent['rarity']}.png\"
call_byteplus_api(prompt, filename)
"
```

## Quality Verification

After generation, verify:
1. All 19 PNG files exist
2. File sizes are reasonable (50-500 KB)
3. Images display correctly
4. Card elements are visible and readable

```bash
ls -lh .claude/agents/character-images/unified-tcg-cards/*.png
```

## Next Steps

After successful generation:
1. Review all generated cards
2. Check for quality issues
3. Regenerate any low-quality cards
4. Commit to git repository

---

**Script Version**: 1.0
**Created**: 2025-11-30
**BytePlus API Model**: seedream-4-0-250828
