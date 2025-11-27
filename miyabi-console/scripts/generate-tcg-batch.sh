#!/bin/bash

# Script to generate TCG cards for all Miyabi characters
# Using proper image generation with detailed prompts

OUTPUT_DIR="/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console/public/images/miyabi-tcg"
mkdir -p "$OUTPUT_DIR"

# Character array with all necessary data
declare -A characters=(
    ["shikiroon"]="しきるん|Shikiroon|Orchestrator|Master Agent|8|3000|3500|4000|SSR|Light|Orchestra Command: When played, activate up to 3 other Agent cards|MI-001|#FFD700"
    ["tsukuroon"]="つくるん|Tsukuroon|CodeGen Agent|Creator Agent|5|2500|2000|3000|SR|Tech|Code Generation: Create a Support card token each turn|MI-002|#4169E1"
    ["medaman"]="めだまん|Medaman|Review Agent|Guardian Agent|4|1800|3000|3200|SR|Mind|All-Seeing Eye: Reveal opponent's hand when deployed|MI-003|#9370DB"
    ["mitsukeroon"]="みつけるん|Mitsukeroon|Issue Agent|Scout Agent|3|2200|1500|2500|R|Wind|Issue Hunter: Draw 2 cards when finding a bug token|MI-004|#32CD32"
    ["matomeroon"]="まとめるん|Matomeroon|PR Agent|Support Agent|4|2000|2500|2800|R|Order|PR Master: Merge 2 Code tokens into a Release token|MI-005|#FF8C00"
    ["hakoboon"]="はこぶん|Hakoboon|Deployment Agent|Transport Agent|6|2800|2200|3500|SR|Speed|Swift Deploy: Deploy cards directly to production zone|MI-006|#DC143C"
    ["tsunagun"]="つなぐん|Tsunagun|Refresher Agent|Link Agent|3|1500|2000|2500|R|Flow|Refresh Link: Restore 1000 HP to all friendly Agents|MI-007|#00CED1"
    ["kikakuron"]="きかくろん|Kikakuron|AI Entrepreneur|Business Agent|7|3200|2800|4000|SSR|Innovation|Business Vision: Generate 2 revenue tokens per turn|MI-008|#FF1493"
    ["jibunkun"]="じぶんくん|Jibunkun|Self Analysis|Insight Agent|2|1200|1800|2000|R|Mind|Self Reflection: Copy target Agent's ability|MI-009|#9932CC"
    ["shiraberu"]="しらべる|Shiraberu|Market Research|Research Agent|3|1600|2200|2500|R|Data|Market Scan: Look at top 5 cards of deck|MI-010|#4682B4"
    ["perusona"]="ぺるそな|Perusona|Persona Designer|Creator Agent|4|2000|2000|2800|R|Identity|Persona Craft: Transform Agent into any type|MI-011|#FF69B4"
    ["konseputan"]="こんせぷたん|Konseputan|Product Concept|Design Agent|3|1800|1600|2400|R|Idea|Concept Birth: Create a Product token|MI-012|#DA70D6"
    ["dezainyan"]="でざいにゃん|Dezainyan|Product Designer|Art Agent|5|2400|2600|3200|SR|Beauty|Design Magic: Double ATK of Product tokens|MI-013|#FF1493"
    ["kakuchan"]="かくちゃん|Kakuchan|Content Creator|Media Agent|4|2200|1800|2600|R|Story|Content Stream: Draw a card for each Content token|MI-014|#FFB6C1"
    ["notesan"]="のーとさん|Notesan|Note Blogger|Writer Agent|3|1600|2000|2400|R|Words|Blog Power: Create Article token each turn|MI-015|#20B2AA"
    ["janelkun"]="じゃねるくん|Janelkun|Funnel Designer|Flow Agent|5|2300|2100|3000|SR|Conversion|Funnel Master: Convert 3 tokens into Victory points|MI-016|#FF8C00"
    ["snssun"]="すんすさん|SNSsun|SNS Strategist|Social Agent|4|2000|2200|2800|R|Network|Viral Spread: Copy ability to all friendly Agents|MI-017|#1DA1F2"
    ["makettosama"]="まけっとさま|Makettosama|Marketing Master|Master Agent|7|3500|2500|4000|SSR|Strategy|Market Domination: All Business Agents gain +1000 ATK|MI-018|#FFD700"
    ["saerusu"]="せーるすせんせい|Saerusu Sensei|Sales Teacher|Mentor Agent|6|2800|2400|3500|SR|Persuasion|Sales Lesson: Convert opponent's token to your side|MI-019|#228B22"
    ["cusrelo"]="かすれろちゃん|Cusrelo-chan|CRM Manager|Support Agent|4|1800|2600|3000|R|Relations|Customer Care: Heal 500 HP per Customer token|MI-020|#FFA07A"
    ["bunsekyking"]="ぶんせききんぐ|Bunseki King|Analysis King|Royal Agent|6|2600|3000|3800|SR|Logic|Royal Analysis: Reveal all hidden information|MI-021|#4169E1"
    ["yuchubeler"]="ゆーちゅーべらー|Yuchubeler|YouTuber|Star Agent|5|2500|2000|3000|SR|Fame|Channel Power: Gain +500 ATK per View token|MI-022|#FF0000"
    ["imargesan"]="いまーじゅさん|Imargesan|Image Creator|Visual Agent|4|2200|2000|2800|R|Art|Image Magic: Create illusion copy of any Agent|MI-023|#FF69B4"
    ["gasladen"]="すらいどん|Gasladen|Slide Presenter|Presenter Agent|5|2400|2200|3200|SR|Presentation|Perfect Pitch: Skip opponent's next turn|MI-024|#FF4500"
)

# Function to generate a single card
generate_card() {
    local id=$1
    IFS='|' read -r name_ja name_en role type cost atk def hp rarity element ability card_num color <<< "${characters[$id]}"
    
    echo "Generating TCG card for $name_en ($name_ja)..."
    
    # Create the prompt with all card details
    local prompt="Create a premium holographic TCG trading card in anime style featuring:

CHARACTER DESIGN:
- Name: $name_en ($name_ja)
- Role: $role
- Style: Extremely cute chibi/anime character with large expressive eyes
- Pose: Dynamic action pose that reflects their role as $role
- Outfit: Colorful and detailed, matching their personality
- Expression: Cheerful and appealing

CARD LAYOUT (Standard TCG format 2.5x3.5 ratio):
1. TOP SECTION:
   - Card name \"$name_en\" in bold holographic letters
   - Japanese name \"$name_ja\" below in elegant font
   - Energy cost ($cost) shown as glowing orbs in top-right corner

2. MAIN ART AREA (70% of card):
   - Chibi character illustration with dynamic pose
   - Holographic rainbow foil background
   - Sparkles, light effects, and energy aura
   - Geometric patterns in background

3. CARD TYPE BANNER:
   - \"$type\" text with $rarity rarity symbol
   - Element: $element theme

4. STATS BOX:
   - ATK: $atk | DEF: $def | HP: $hp
   - Modern TCG layout with metallic borders

5. ABILITY BOX:
   - \"$ability\"
   - Holographic text effect

6. BOTTOM:
   - Card number: $card_num
   - Element icon for $element

VISUAL EFFECTS:
- Premium holographic foil overlay
- Rainbow prismatic shine
- Sparkles and particle effects
- Glowing energy matching $color color theme
- High-quality TCG card texture
- Depth and 3D-like appearance

Style reference: Pokemon EX/GX cards, Magic the Gathering mythic rares
Quality: Ultra high resolution, suitable for printing"

    # Save prompt to file for debugging
    echo "$prompt" > "$OUTPUT_DIR/${id}_prompt.txt"
    
    # Generate image using the prompt
    # Note: You'll need to replace this with your actual image generation command
    echo "Prompt saved to: $OUTPUT_DIR/${id}_prompt.txt"
    echo "TODO: Implement actual image generation"
    echo ""
}

# Main execution
echo "Starting TCG card generation for all 24 Miyabi characters..."
echo "Output directory: $OUTPUT_DIR"
echo ""

count=1
for char_id in "${!characters[@]}"; do
    echo "[$count/24] Processing $char_id..."
    generate_card "$char_id"
    ((count++))
    
    # Add delay to avoid rate limiting
    sleep 2
done

echo "TCG card generation complete!"
echo "Prompts saved to: $OUTPUT_DIR/"