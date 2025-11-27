# 🎴 TCGカード動的生成プロンプトテンプレート

**Version**: 1.0.0  
**Last Updated**: 2025-11-27  
**Purpose**: 新規エージェント追加時の一貫性あるTCGカード生成

---

## 📝 基本プロンプトテンプレート

```markdown
Create a professional anime-style TCG (Trading Card Game) card for a new Miyabi Agent.

AGENT INFORMATION:
- Name (JP): {{name_jp}}
- Name (EN): {{name_en}}
- Role: {{role}}
- Personality: {{personality}}
- Visual Description: {{appearance}}

CARD SPECIFICATIONS:
- Rarity: {{rarity}} (UR/SSR/SR/R/N)
- Level: {{level}} (1-100)
- Type: {{primary_type}} / {{secondary_type}}
- Attribute: {{attribute}} (⚡/🔥/💧/🌱/🌙/✨)

STATS ALLOCATION (Total points: {{total_stats}}):
- HP: {{hp}} (durability)
- ATK: {{atk}} (execution power)
- DEF: {{def}} (error resistance)
- SPD: {{spd}} (processing speed)

SKILL DESIGN:
- Skill Name: {{skill_name}}
- Skill Type: {{skill_type}} (Active/Passive/Ultimate)
- Effect: {{skill_effect}}
- Cooldown: {{cooldown}} turns

VISUAL REQUIREMENTS:
1. Card frame color based on rarity
2. Holographic effects for SR and above
3. Character in dynamic pose matching their role
4. Background reflecting their work environment
5. Particle effects matching attribute
6. Japanese text for all labels
7. Evolution indicator if applicable

OUTPUT FORMAT:
Standard vertical TCG card (63mm x 88mm ratio) with all game elements clearly visible.
```

---

## 🎮 レアリティ別テンプレート

### UR (Ultra Rare) テンプレート
```markdown
ULTRA RARE CARD REQUIREMENTS:
- Rainbow holographic frame with animated shimmer
- Full-art illustration extending to card edges
- 3D lenticular effect on character
- Floating particle effects
- Secret rare numbering (e.g., 001/???)
- Signature move animation frames
- Base stats: 2000+ HP, 1000+ total offense/defense
```

### SSR (Super Super Rare) テンプレート
```markdown
SSR CARD REQUIREMENTS:
- Gold metallic frame with embossed texture
- Character breaks frame boundaries
- Glowing aura effect
- Foil treatment on skill text
- Limited edition stamp
- Base stats: 1500-2000 HP, 800+ total offense/defense
```

### SR (Super Rare) テンプレート
```markdown
SR CARD REQUIREMENTS:
- Silver metallic frame
- Character with action lines
- Attribute glow effect
- Holographic skill box
- Base stats: 1200-1500 HP, 600+ total offense/defense
```

### R (Rare) テンプレート
```markdown
RARE CARD REQUIREMENTS:
- Blue metallic frame
- Standard character pose
- Simple background pattern
- Base stats: 800-1200 HP, 400+ total offense/defense
```

### N (Normal) テンプレート
```markdown
NORMAL CARD REQUIREMENTS:
- Standard white frame
- Basic character illustration
- Simple gradient background
- Base stats: 500-800 HP, 300+ total offense/defense
```

---

## 🌟 属性別ビジュアルガイド

### ⚡ Lightning (雷)
- Color: Yellow/Electric Blue
- Effects: Sparks, electricity arcs
- Background: Storm clouds, circuit boards
- Personality: Fast, decisive, efficient

### 🔥 Fire (炎)
- Color: Red/Orange
- Effects: Flames, heat waves
- Background: Forge, volcanic
- Personality: Passionate, destructive, intense

### 💧 Water (水)
- Color: Blue/Cyan
- Effects: Water drops, waves
- Background: Ocean, data streams
- Personality: Adaptive, flowing, calm

### 🌱 Nature (自然)
- Color: Green/Brown
- Effects: Leaves, growth
- Background: Forest, organic patterns
- Personality: Sustainable, growing, patient

### 🌙 Dark (闇)
- Color: Purple/Black
- Effects: Shadows, void
- Background: Night sky, deep space
- Personality: Analytical, mysterious, deep

### ✨ Light (光)
- Color: White/Gold
- Effects: Rays, sparkles
- Background: Dawn, crystal
- Personality: Creative, innovative, pure

---

## 📊 ステータス計算式

### レベル別基準値
```javascript
function calculateBaseStats(level, rarity) {
  const rarityMultiplier = {
    'N': 1.0,
    'R': 1.2,
    'SR': 1.5,
    'SSR': 1.8,
    'UR': 2.2
  };
  
  const baseHP = 500 + (level * 25);
  const baseATK = 100 + (level * 15);
  const baseDEF = 100 + (level * 15);
  const baseSPD = 100 + (level * 10);
  
  return {
    hp: Math.floor(baseHP * rarityMultiplier[rarity]),
    atk: Math.floor(baseATK * rarityMultiplier[rarity]),
    def: Math.floor(baseDEF * rarityMultiplier[rarity]),
    spd: Math.floor(baseSPD * rarityMultiplier[rarity])
  };
}
```

---

## 🎯 スキル生成ガイドライン

### Coding系エージェント
```markdown
SKILL PATTERNS:
1. 実行系: "〜バースト", "〜ストリーム"
2. 分析系: "〜アナライズ", "〜スキャン"
3. 修正系: "〜リペア", "〜フィックス"
4. 最適化系: "〜オプティマイズ", "〜ブースト"
```

### Business系エージェント
```markdown
SKILL PATTERNS:
1. 戦略系: "〜ストラテジー", "〜プランニング"
2. 分析系: "〜インサイト", "〜リサーチ"
3. 創造系: "〜クリエイション", "〜ジェネレート"
4. 成長系: "〜グロース", "〜エクスパンション"
```

---

## 💫 進化システムテンプレート

```markdown
EVOLUTION CHAIN:
{{base_name}} (Lv.1-29)
↓ [Lv.30で進化]
{{evolved_name}}EX (Lv.30-49)
↓ [Lv.50で進化]
{{evolved_name}}MASTER (Lv.50-69)
↓ [Lv.70で進化]
{{evolved_name}}Ω (Lv.70-100)

VISUAL CHANGES:
- 各進化で装飾が豪華に
- オーラの色が濃くなる
- 背景がより複雑に
- スキルエフェクトが派手に
```

---

## 🎨 実装例

### 新エージェント「はかるん」（Metrics Agent）
```markdown
Create a professional anime-style TCG card for a new Miyabi Agent.

AGENT INFORMATION:
- Name (JP): はかるん
- Name (EN): Hakarun
- Role: Performance Metrics Analyzer
- Personality: Precise, analytical, always measuring
- Visual Description: Short mint green hair with data goggles, lab coat with holographic charts

CARD SPECIFICATIONS:
- Rarity: SR
- Level: 42
- Type: Business / Analyst
- Attribute: 💧Water

STATS ALLOCATION:
- HP: 1450
- ATK: 750
- DEF: 1100
- SPD: 800

SKILL DESIGN:
- Skill Name: メトリクス・ビジョン
- Skill Type: Active
- Effect: Reveals all hidden stats and increases team accuracy by 50%
- Cooldown: 3 turns

[Standard visual requirements apply]
```

---

## 🔄 自動生成スクリプト統合

```javascript
function generateNewAgentCard(agentData) {
  const prompt = TCG_CARD_TEMPLATE
    .replace('{{name_jp}}', agentData.name_jp)
    .replace('{{name_en}}', agentData.name_en)
    .replace('{{role}}', agentData.role)
    .replace('{{rarity}}', calculateRarity(agentData))
    .replace('{{level}}', agentData.initial_level || 1)
    .replace('{{hp}}', calculateStats(agentData).hp)
    // ... その他の置換
  
  return prompt;
}
```

---

## 📋 チェックリスト

新規カード生成時の確認事項：

- [ ] キャラクター名（日本語・英語）
- [ ] 役割とタイプの整合性
- [ ] レアリティとステータスのバランス
- [ ] 属性とビジュアルの一致
- [ ] スキル名と効果の関連性
- [ ] 進化先の設定
- [ ] 既存エージェントとの差別化
- [ ] ゲームバランスの考慮

---

**このテンプレートを使用することで、新規エージェント追加時も一貫性のあるTCGカードを生成できます。**