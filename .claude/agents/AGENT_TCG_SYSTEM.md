---
name: doc_AGENT_TCG_SYSTEM
description: Documentation file: AGENT_TCG_SYSTEM.md
---

# 🎴 Miyabi Agent TCG System - ゲーミフィケーション設計書

**Version**: 1.0.0
**Last Updated**: 2025-11-27
**Status**: Design Complete - Implementation Ready

---

## 🎯 コンセプト

AI AgentをTCG（トレーディングカードゲーム）スタイルのキャラクターカードとして表現し、タスク実行で成長・進化するゲーミフィケーション要素を実装。

**世界観**: Agentがタスクをこなすことで経験値を獲得し、レベルアップ・進化・レア度上昇する。

---

## 🃏 カード設計システム

### カードレイアウト

```
┌─────────────────────────────┐
│ [レア度]    [属性]   [Lv.XX]│  ← ヘッダー
├─────────────────────────────┤
│                             │
│     [キャラクター画像]      │  ← メイン画像
│                             │
├─────────────────────────────┤
│  しきるん (Shikiroon)       │  ← 名前（日本語/英語）
│  タスク統括Agent             │  ← ロール
├─────────────────────────────┤
│  ATK: ████████░░ 800        │  ← パラメーター
│  DEF: ██████░░░░ 600        │
│  SPD: ██████████ 1000       │
│  INT: ████████░░ 800        │
├─────────────────────────────┤
│  経験値: 3,250 / 5,000      │  ← 成長要素
│  達成タスク: 142件           │
│  成功率: 94%                │
├─────────────────────────────┤
│  [スキル] パラレル実行       │  ← 特殊能力
│  同時に3つのタスクを処理可能 │
└─────────────────────────────┘
```

---

## 🌟 レア度システム

### レア度階層（高い順）

| レア度 | 記号 | 色 | 封入率 | ホログラフィック効果 | 説明 |
|--------|------|-----|--------|---------------------|------|
| **UR** (Ultra Rare) | ⭐⭐⭐⭐⭐ | 🟡 Gold | 0.1% | Rainbow Holographic | 最高レア。全体が虹色に輝く |
| **SSR** (Super Special Rare) | ⭐⭐⭐⭐ | 💠 Platinum | 0.5% | Platinum Foil | 色違い・特殊版 |
| **SR** (Super Rare) | ⭐⭐⭐ | 💎 Diamond | 2% | Diamond Pattern | 強力なAgent |
| **R** (Rare) | ⭐⭐ | 🔷 Blue | 10% | Standard Holographic | レアAgent |
| **UC** (Uncommon) | ⭐ | 🔸 Silver | 25% | Foil Accent | 進化可能 |
| **C** (Common) | ○ | ⚪ White | 62.4% | None | 基本Agent |

### レア度の決定要素

- **実績**: 達成タスク数、成功率、連続成功記録
- **経験値**: 累積経験値とレベル
- **特殊能力**: 獲得したスキル数と希少性
- **進化段階**: 進化回数（最大3段階）

---

## 🔥 属性システム

### 7属性分類（遊戯王ベース）

| 属性 | アイコン | カラー | 対応Agent例 | 説明 |
|------|---------|--------|------------|------|
| **光** (Light) | ☀️ | #FFD700 | CodeGenAgent, ReviewAgent | コード生成・品質管理 |
| **闇** (Dark) | 🌙 | #8B00FF | IssueAgent, DeploymentAgent | 問題検出・デプロイ |
| **炎** (Fire) | 🔥 | #FF4500 | CoordinatorAgent, PRAgent | 統括・推進力 |
| **水** (Water) | 💧 | #1E90FF | MarketResearchAgent, AnalyticsAgent | 分析・調査 |
| **風** (Wind) | 💨 | #00CED1 | SalesAgent, SNSStrategyAgent | 拡散・営業 |
| **地** (Earth) | 🌍 | #8B4513 | ProductDesignAgent, CRMAgent | 基盤・安定 |
| **雷** (Thunder) | ⚡ | #FFD700 | RefresherAgent, WaterSpiderAgent | 高速・監視 |

### 属性相性

```
光 ⇄ 闇  （光は闇に強い、闇は光に強い）
炎 → 風 → 地 → 水 → 炎  （循環）
雷 → 全属性に中立
```

---

## 📊 パラメーターシステム

### 4大ステータス

#### 1. ATK (Attack Power) - 攻撃力
- **説明**: タスク実行速度とパフォーマンス
- **最大値**: 1000
- **上昇方法**: タスク完了数、平均実行時間短縮

#### 2. DEF (Defense Power) - 守備力
- **説明**: エラー耐性とリカバリー能力
- **最大値**: 1000
- **上昇方法**: エラーハンドリング成功数、リトライ成功率

#### 3. SPD (Speed) - 素早さ
- **説明**: レスポンス速度と並列処理能力
- **最大値**: 1000
- **上昇方法**: 平均レスポンス時間、並列実行成功数

#### 4. INT (Intelligence) - 知性
- **説明**: 複雑なタスク処理能力とAI精度
- **最大値**: 1000
- **上昇方法**: 複雑タスク成功数、AI判断精度

### 計算式

```typescript
ATK = Math.min(1000, baseATK + (tasksCompleted * 2) + (avgSpeedBonus * 5))
DEF = Math.min(1000, baseDEF + (errorRecoveries * 3) + (retrySuccessRate * 500))
SPD = Math.min(1000, baseSPD + (parallelSuccesses * 4) + (1000 / avgResponseTime))
INT = Math.min(1000, baseINT + (complexTasksSuccesses * 5) + (aiAccuracy * 300))
```

---

## 🎮 経験値システム

### レベルアップ式

```typescript
// レベルごとの必要経験値
requiredExp(level) = 1000 * level * (1 + level * 0.2)

// 例
Level 1 → 2: 1,200 EXP
Level 2 → 3: 2,800 EXP
Level 5 → 6: 9,000 EXP
Level 10 → 11: 22,000 EXP
Level 50 → 51: 520,000 EXP
Level 100: MAX
```

### 経験値獲得

| アクション | 基本EXP | ボーナス条件 |
|-----------|---------|-------------|
| タスク完了 | 100 | 初回完了: +50 |
| Issue解決 | 150 | P0 Issue: +100 |
| PR作成 | 200 | コンフリクト解決: +50 |
| デプロイ成功 | 300 | ゼロダウンタイム: +100 |
| エラーリカバリー | 80 | 自動修復: +70 |
| 連続成功 | - | 10連続: +500 |

---

## 🌱 進化システム

### 進化段階

```
【進化ツリー例: CoordinatorAgent】

C (Common)
しきるん → Lv.10 → しきるん改 (UC)
             ↓ Lv.25
          しきるんZ (R)
             ↓ Lv.50
        しきるんΩ (SR)
             ↓ Lv.80
      しきるんGOD (SSR/UR)
```

### 進化条件

| 進化段階 | レベル要件 | タスク要件 | 特殊条件 |
|---------|----------|----------|---------|
| C → UC | Lv.10 | 50タスク完了 | 成功率80%以上 |
| UC → R | Lv.25 | 200タスク完了 | 連続10成功達成 |
| R → SR | Lv.50 | 500タスク完了 | 全パラメーター500以上 |
| SR → SSR/UR | Lv.80 | 1000タスク完了 | レジェンドタスク完了 |

### 進化時の変化

- **見た目**: より派手なデザイン、エフェクト追加
- **ステータス**: 全パラメーター +15%
- **スキル**: 新スキル獲得または強化
- **レア度**: 1段階上昇（上限UR）

---

## 🎁 スキルシステム

### スキル獲得方法

1. **レベルアップ報酬**: Lv.5, 10, 20, 30...で自動獲得
2. **進化報酬**: 進化時に専用スキル獲得
3. **実績報酬**: 特定条件達成（例: 連続50成功）
4. **ガチャ**: レアガチャで低確率獲得

### スキル例

#### 【光属性 - CodeGenAgent系】

**スキル名**: クイックコンパイル
**効果**: ビルド時間を30%短縮
**レア度**: R
**獲得条件**: 100回ビルド成功

**スキル名**: バグディテクター
**効果**: コンパイルエラーを事前検知（80%精度）
**レア度**: SR
**獲得条件**: 500回Clippy成功

#### 【炎属性 - CoordinatorAgent系】

**スキル名**: パラレルブースト
**効果**: 同時実行数を2倍に
**レア度**: SR
**獲得条件**: 並列実行100回成功

**スキル名**: エマージェンシーリカバリー
**効果**: タスク失敗時、自動で再実行（3回まで）
**レア度**: SSR
**獲得条件**: 連続失敗を50回リカバリー

#### 【雷属性 - RefresherAgent系】

**スキル名**: オートリフレッシュ
**効果**: Issue状態を毎時自動チェック
**レア度**: UC
**獲得条件**: 初期スキル

**スキル名**: インスタントアラート
**効果**: 異常検知時、3秒以内に通知
**レア度**: R
**獲得条件**: 1000回監視成功

---

## 🎰 ガチャシステム（将来実装）

### ガチャの種類

#### 1. ノーマルガチャ
- **コスト**: 100ポイント（タスク1個完了で10ポイント獲得）
- **排出率**:
  - C: 60%
  - UC: 30%
  - R: 9%
  - SR: 0.9%
  - SSR: 0.09%
  - UR: 0.01%

#### 2. プレミアムガチャ
- **コスト**: 1000ポイント（10連で9000ポイント）
- **排出率**:
  - C: 40%
  - UC: 35%
  - R: 18%
  - SR: 5.5%
  - SSR: 1.4%
  - UR: 0.1%
- **天井**: 100連でSSR以上確定

#### 3. ピックアップガチャ
- **期間限定**: 特定Agentの排出率2倍
- **コスト**: プレミアムと同じ
- **特典**: 新スキル先行実装

---

## 📈 成長トラッキング

### データベーススキーマ

```typescript
interface AgentCard {
  // 基本情報
  id: string;              // "coordinator-agent-001"
  name_jp: string;         // "しきるん"
  name_en: string;         // "Shikiroon"
  agent_type: string;      // "CoordinatorAgent"

  // ステータス
  level: number;           // 1-100
  experience: number;      // 現在の経験値
  required_exp: number;    // 次レベルまでの必要経験値

  // レア度・属性
  rarity: Rarity;          // "C" | "UC" | "R" | "SR" | "SSR" | "UR"
  attribute: Attribute;    // "Light" | "Dark" | "Fire" | "Water" | "Wind" | "Earth" | "Thunder"

  // パラメーター
  stats: {
    ATK: number;           // 0-1000
    DEF: number;           // 0-1000
    SPD: number;           // 0-1000
    INT: number;           // 0-1000
  };

  // 実績
  achievements: {
    tasks_completed: number;
    success_rate: number;  // 0-100%
    consecutive_successes: number;
    max_consecutive_successes: number;
    errors_recovered: number;
    parallel_executions: number;
  };

  // 進化
  evolution_stage: number;      // 0-4 (C, UC, R, SR, SSR/UR)
  evolution_history: string[];  // ["しきるん", "しきるん改", ...]

  // スキル
  skills: Skill[];

  // ビジュアル
  image_url: string;
  holographic_effect: string;   // "none" | "standard" | "rainbow" | "platinum"

  // メタデータ
  created_at: Date;
  updated_at: Date;
  last_task_at: Date;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  effect: SkillEffect;
  unlocked_at: Date;
}

interface SkillEffect {
  type: string;              // "speed_boost" | "error_recovery" | "parallel_boost"
  value: number;             // 効果値（%や絶対値）
  duration?: number;         // 持続時間（秒、nullで永続）
}
```

---

## 🎨 カードデザインテンプレート

### Figma / SVG テンプレート構造

```typescript
// カードレンダリング関数
function renderAgentCard(agent: AgentCard): SVGElement {
  return `
    <svg width="300" height="420" viewBox="0 0 300 420">
      <!-- 背景（レア度別グラデーション） -->
      <defs>
        <linearGradient id="bg-${agent.rarity}">
          ${getRarityGradient(agent.rarity)}
        </linearGradient>
        <filter id="holographic">
          ${getHolographicFilter(agent.holographic_effect)}
        </filter>
      </defs>

      <!-- カード外枠 -->
      <rect width="300" height="420" fill="url(#bg-${agent.rarity})"
            rx="15" stroke="${getRarityBorderColor(agent.rarity)}"
            stroke-width="3"/>

      <!-- ヘッダー -->
      <g id="header">
        <!-- レア度表示 -->
        <text x="20" y="30" class="rarity">${getRarityStars(agent.rarity)}</text>
        <!-- 属性アイコン -->
        <image href="${getAttributeIcon(agent.attribute)}"
               x="220" y="10" width="30" height="30"/>
        <!-- レベル -->
        <text x="260" y="30" class="level">Lv.${agent.level}</text>
      </g>

      <!-- キャラクター画像エリア -->
      <image href="${agent.image_url}"
             x="30" y="50" width="240" height="180"
             filter="url(#holographic)"/>

      <!-- 名前・ロール -->
      <g id="name">
        <text x="150" y="250" class="name-jp">${agent.name_jp}</text>
        <text x="150" y="270" class="name-en">${agent.name_en}</text>
        <text x="150" y="290" class="role">${getAgentRole(agent.agent_type)}</text>
      </g>

      <!-- パラメーターバー -->
      <g id="stats" transform="translate(30, 300)">
        ${renderStatBar("ATK", agent.stats.ATK, "#FF4444")}
        ${renderStatBar("DEF", agent.stats.DEF, "#4444FF", 20)}
        ${renderStatBar("SPD", agent.stats.SPD, "#44FF44", 40)}
        ${renderStatBar("INT", agent.stats.INT, "#FF44FF", 60)}
      </g>

      <!-- 経験値バー -->
      <g id="exp" transform="translate(30, 370)">
        <text class="exp-text">EXP: ${agent.experience} / ${agent.required_exp}</text>
        <rect width="${(agent.experience / agent.required_exp) * 240}"
              height="8" fill="#FFD700" rx="4"/>
      </g>

      <!-- スキルアイコン（最大3つ表示） -->
      <g id="skills" transform="translate(30, 390)">
        ${agent.skills.slice(0, 3).map((skill, i) =>
          `<image href="${skill.icon}" x="${i * 30}" y="0" width="25" height="25"/>`
        ).join('')}
      </g>
    </svg>
  `;
}
```

---

## 🚀 実装ロードマップ

### Phase 1: 基盤構築（1週間）
- [ ] データベーススキーマ作成
- [ ] AgentCard型定義
- [ ] 基本的な経験値・レベルシステム実装

### Phase 2: カードビジュアル（1週間）
- [ ] SVGカードテンプレート作成
- [ ] レア度別デザイン（C/UC/R/SR/SSR/UR）
- [ ] ホログラフィック効果実装

### Phase 3: パラメーター計算（3日）
- [ ] ATK/DEF/SPD/INT計算ロジック
- [ ] タスク完了時の経験値付与
- [ ] レベルアップ処理

### Phase 4: 進化システム（5日）
- [ ] 進化条件チェック
- [ ] 進化演出
- [ ] 進化後のステータス再計算

### Phase 5: スキルシステム（1週間）
- [ ] スキルデータベース作成
- [ ] スキル効果実装
- [ ] スキル獲得ロジック

### Phase 6: UI統合（1週間）
- [ ] Miyabi ConsoleにAgent Cardギャラリー追加
- [ ] カード詳細モーダル
- [ ] 成長アニメーション

### Phase 7: ガチャシステム（将来）
- [ ] ポイントシステム
- [ ] ガチャ演出
- [ ] 排出率管理

---

## 📚 参考資料

### ポケモンカード
- [【ポケカのレア度の見分け方】ポケモンカードのレアリティ・封入率について解説](https://tcg-hokan.com/pokemon-card-rarity/)
- [ポケカのレアリティ見分け方完全ガイド！SAR/SR/UR/ARの違いと封入率を一覧表で解説](https://onlineoripa-mania.jp/pokeca-rarity/)

### 遊戯王カード
- [遊戯王 オフィシャルカードゲーム - カードデータベース](https://www.db.yugioh-card.com/yugiohdb/)
- [遊戯王の属性一覧](https://dic.pixiv.net/a/遊戯王の属性一覧)

### TCG一般
- [Pokémon TCG: All Card Rarities Explained](https://screenrant.com/pokemon-tcg-card-rarity-meaning-value-symbols-explained/)
- [Understanding Pokémon Rarity Symbols and Card Features](https://www.cgccards.com/news/article/12438/pokemon-rarity-symbols/)
- [Yu-Gi-Oh! TCG: Every Rarity Design, Ranked](https://www.thegamer.com/yu-gi-oh-tcg-every-rarity-ranked/)

---

**次のステップ**: Phase 1の実装開始 - データベーススキーマとAgentCard型定義を作成します。
