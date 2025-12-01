# MIYABI TCG Card Design Specification

## Card Layout Template

Based on reference cards: `shikiroon_unified_SSR.png` and `tsukuroon_unified_SR.png`

```
┌─────────────────────────────────────────────┐
│ ┌───────┐   ┌─────┐   ┌──────────┐        │  Top Bar
│ │  SSR  │   │  ⚡  │   │  Lv.45   │        │  - Rarity badge
│ └───────┘   └─────┘   └──────────┘        │  - Element icon
├─────────────────────────────────────────────┤  - Level
│                                             │
│         ┌───────────────────┐               │
│         │                   │               │
│         │   Character       │               │  Character
│         │   Artwork         │               │  Artwork
│         │   (Anime Style)   │               │  (Center)
│         │                   │               │
│         └───────────────────┘               │
│                                             │
├─────────────────────────────────────────────┤
│  【キャラ名】タイトル                         │  Name Bar
├─────────────────────────────────────────────┤  (Japanese)
│  HP:1800 ❤️ │ATK:850 ⚔️│DEF:950 🛡️│SPD:720 ⚡│  Stats Bar
│  Type: [Coding/Coordinator]                │  Type Badge
├─────────────────────────────────────────────┤
│  【スキル名】                                │  Skill Box
│  スキル効果の説明。                          │  - Skill name
│  数値や効果を詳しく記述する。                │  - Effect desc
├─────────────────────────────────────────────┤
│  No.001 / 1st Edition  →進化形EX  © 2025   │  Bottom Bar
└─────────────────────────────────────────────┘
```

## Element Icons & Colors

| Element | Icon | Primary Color | Secondary Color | Theme |
|---------|------|---------------|-----------------|-------|
| Fire | 🔥 | #FF5722 (Red-Orange) | #FF9800 (Orange) | Flames, energy |
| Water | 💧 | #2196F3 (Blue) | #03A9F4 (Light Blue) | Flowing, calm |
| Wind | 💨 | #4CAF50 (Green) | #8BC34A (Light Green) | Swift, movement |
| Earth | 🌍 | #795548 (Brown) | #A1887F (Light Brown) | Solid, stable |
| Light | ✨ | #FFD700 (Gold) | #FFF9C4 (Light Yellow) | Radiant, pure |
| Dark | 🌙 | #673AB7 (Purple) | #9C27B0 (Violet) | Mysterious, deep |
| Tech | ⚡ | #00BCD4 (Cyan) | #00E5FF (Bright Cyan) | Digital, electric |

## Rarity Frame Specifications

### R (Rare) - Blue Frame
```
Frame Color: #2196F3 (Blue)
Border Width: 8px
Glow Effect: Subtle blue glow
Shine: Minimal
Background Gradient: Dark blue to black
```

### SR (Super Rare) - Silver-Blue Gradient
```
Frame Color: Linear gradient #C0C0C0 to #2196F3
Border Width: 10px
Glow Effect: Silver-blue shine
Shine: Medium sparkle effect
Background Gradient: Silver to blue
```

### SSR (Super Super Rare) - Gold Frame
```
Frame Color: #FFD700 (Gold)
Border Width: 12px
Glow Effect: Strong golden glow
Shine: High sparkle, light rays
Background Gradient: Gold to orange
Holographic: Gold foil effect
```

### UR (Ultra Rare) - Rainbow Holographic
```
Frame Color: Rainbow gradient (all colors)
Border Width: 14px
Glow Effect: Intense rainbow shimmer
Shine: Maximum sparkle, rainbow light rays
Background Gradient: Multi-color shift
Holographic: Full rainbow prismatic effect
Special: Animated-looking static effect
```

## Character Artwork Guidelines

### Pose & Composition
- **Center aligned**: Character should be in the middle
- **Action pose**: Dynamic, showing personality
- **Professional stance**: For business agents
- **Tool display**: Holding relevant items (laptop, documents, etc.)
- **Face visibility**: Face should be clearly visible
- **Eye level**: Character's eyes at 60% height

### Background Elements
- **Cyberpunk cityscape**: Neon lights, tall buildings
- **Holographic displays**: Floating UI elements
- **Element-themed effects**: Fire particles, water droplets, etc.
- **Atmospheric lighting**: Neon glow, ambient occlusion
- **Depth**: Background should be slightly blurred

### Character Design
- **Age appearance**: Varies by agent (18-30 range)
- **Anime style**: Clean lines, expressive eyes
- **Color harmony**: Match element colors
- **Outfit**: Professional or thematic to role
- **Accessories**: Related to agent function

## Typography Specifications

### Font Sizes (1024x1024 canvas)
```
Rarity Badge:    48px - Bold, All Caps
Level:           36px - Bold
Name (Japanese): 32px - Bold
Title:           24px - Regular
Stats:           28px - Bold (numbers), Regular (labels)
Type:            20px - Regular
Skill Name:      28px - Bold
Skill Desc:      18px - Regular
Bottom Info:     16px - Regular
```

### Font Styles
- **Japanese**: Noto Sans JP or similar clean sans-serif
- **English**: Roboto or similar modern sans-serif
- **Numbers**: Tabular nums for alignment
- **Readability**: High contrast, clear spacing

### Text Colors
```
Rarity Badge: White (#FFFFFF)
Level:        White (#FFFFFF)
Name:         White or Gold (#FFD700) for high rarity
Stats:        Color-coded by type (HP=Red, ATK=Orange, DEF=Blue, SPD=Yellow)
Type:         Light gray (#E0E0E0)
Skill:        White (#FFFFFF)
Bottom:       Light gray (#B0B0B0)
```

## Stat Ranges by Rarity

### R (Rare)
```
HP:   1000 - 1300
ATK:  600  - 800
DEF:  500  - 700
SPD:  700  - 900
Level: 28 - 33
```

### SR (Super Rare)
```
HP:   1400 - 1700
ATK:  900  - 1200
DEF:  650  - 850
SPD:  850  - 950
Level: 36 - 41
```

### SSR (Super Super Rare)
```
HP:   1800 - 2000
ATK:  1000 - 1300
DEF:  850  - 1000
SPD:  800  - 950
Level: 42 - 50
```

### UR (Ultra Rare)
```
HP:   2000 - 2500
ATK:  1200 - 1500
DEF:  1000 - 1200
SPD:  900  - 1000
Level: 50 - 60
```

## Skill Description Format

### Structure
```
【スキル名】
効果の説明。数値や条件を明記する。
```

### Examples

**Coding Agent (つくるん)**
```
【コードバースト】
瞬間的に1000行のコードを生成。バグ発生率わずか0.1%。
```

**Business Agent (あきんどさん)**
```
【8ステップ経営】
8つのフェーズでビジネスプランを構築。全Agentの効率を50%向上させる。
```

**Marketing Agent (ひろめるん)**
```
【広告戦略】
マーケティング施策を展開。リード獲得数を300%増加させる。
```

## Card Number Format

```
No.XXX / 1st Edition
```

- **No.001-007**: Coding Agents (しきるん, つくるん, etc.)
- **No.008-024**: Business Agents (あきんどさん, etc.)
- **Edition**: Always "1st Edition" for initial release

## Evolution Format

```
→進化形EX
→進化形PRO
→進化形ULTRA
```

Pattern: `→{agent_name}{SUFFIX}`

Examples:
- `→しきるんEX`
- `→つくるんPRO`
- `→あきんどさんULTRA`

## Copyright Notice

```
MIYABI TCG © 2025
```

Always at bottom right corner, small size (14-16px).

## Quality Checklist

Before finalizing a card, verify:

- [ ] Rarity badge matches rarity level
- [ ] Element icon is correct and visible
- [ ] Level number is appropriate for rarity
- [ ] Character artwork is centered and high quality
- [ ] Name is in Japanese with correct format
- [ ] Stats are within rarity ranges
- [ ] Skill description is clear and concise
- [ ] Card number follows numbering scheme
- [ ] Evolution name is consistent
- [ ] Copyright notice is present
- [ ] Overall design matches reference cards
- [ ] File size is 100-300 KB
- [ ] Resolution is 1024x1024
- [ ] Format is PNG

## Example Prompts for BytePlus ARK

### SSR Card (Gold Frame)
```
Professional TCG card for MIYABI game, SSR rarity:

Gold ornate card frame with holographic shine effects,
cyberpunk neon cityscape background,
centered anime character [description],
top bar with "SSR" badge in gold, fire element icon, "Lv.45",
Japanese name bar "【えがくん】画像生成担当",
stats bar "HP:1800 ❤️ | ATK:1300 ⚔️ | DEF:850 🛡️ | SPD:950 ⚡",
type badge "Type: [ImageGenAgent]",
skill description box with Japanese text,
bottom "No.023 / 1st Edition | →えがくんEX | MIYABI TCG © 2025",
high quality 8k detail, professional TCG design
```

### UR Card (Rainbow Holographic)
```
Ultra rare TCG card for MIYABI game, UR rarity:

Rainbow holographic card frame with intense prismatic effects,
cyberpunk neon cityscape background,
centered anime character [description],
top bar with "UR" badge in rainbow gradient, light element icon, "Lv.55",
Japanese name bar "【ほのかちゃん】Udemy担当",
stats bar "HP:2200 ❤️ | ATK:1200 ⚔️ | DEF:1100 🛡️ | SPD:900 ⚡",
type badge "Type: [HonokaAgent]",
skill description box with Japanese text,
bottom "No.024 / 1st Edition | →ほのかちゃんEX | MIYABI TCG © 2025",
ultra high quality 8k detail, maximum holographic effect, professional TCG design
```

---

**Version**: 1.0
**Last Updated**: 2025-11-30
**Reference Cards**: shikiroon_unified_SSR.png, tsukuroon_unified_SR.png
