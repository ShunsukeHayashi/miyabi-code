# Miyabi Character Studio - MVP Definition

**Version**: 1.0
**Date**: 2025-12-07
**Target Release**: 2026-02-07 (2ヶ月後)
**Status**: Phase 5 - Product Design

---

## 🎯 MVP Overview

### Vision
**30分でプロ級VTuber差分生成** - 既存のNote Article Image Generatorの技術基盤（Gemini 3 Pro）を活用し、VTuberクリエイター向け差分生成特化プラットフォームを構築。

### Success Criteria
- **完成度**: キャラクター一貫性95%達成
- **時間**: ベース画像 → 5種差分 = 30分以内
- **品質**: プロVTuberが商用利用可能なレベル
- **技術**: 既存コードベース80%再利用

---

## 📦 P0 Features (MVP必須機能)

### P0-1: キャラクターアップロード & 一貫性分析
**Priority**: P0 (Critical)
**Estimated Effort**: 5日

#### 仕様
- **入力**: PNG/JPEG/WebP形式のベース画像（最大10MB）
- **処理**: Gemini 3 Pro Vision APIでキャラクター特徴抽出
  - 髪色・髪型・目の色・服装・アクセサリー
  - アート style (イラスト/実写/3D)
  - 体型・プロポーション
- **出力**: JSON形式のキャラクター特徴マスターデータ

#### 技術仕様
```typescript
interface CharacterProfile {
  id: string;
  userId: string;
  name: string;
  baseImageUrl: string;
  features: {
    hair: { color: string; style: string; length: string };
    eyes: { color: string; shape: string };
    outfit: { primary: string; secondary: string; accessories: string[] };
    bodyType: string;
    artStyle: 'illustration' | 'realistic' | '3d' | 'anime';
  };
  geminiPrompt: string; // 一貫性維持用のマスタープロンプト
  createdAt: Date;
}
```

#### API Endpoint
```
POST /api/v1/characters
Request:
{
  "name": "ゆめちゃん",
  "baseImage": "data:image/png;base64,...",
  "style": "illustration"
}

Response:
{
  "characterId": "char_abc123",
  "profile": { ... },
  "estimatedConsistency": 95.2
}
```

#### Implementation (既存コードベース)
- **ベース**: `CharacterDesignView.tsx` (50%再利用)
- **新規実装**:
  - `services/characterAnalysis.ts` (Gemini Vision API統合)
  - `hooks/useCharacterProfile.ts` (状態管理)

---

### P0-2: 差分生成（5種類）
**Priority**: P0 (Critical)
**Estimated Effort**: 7日

#### 仕様
必須5種類のVTuber差分:
1. **通常表情** (Neutral): デフォルト状態
2. **喜び** (Happy): 笑顔、目を細める
3. **怒り** (Angry): 眉を吊り上げる、口を尖らせる
4. **悲しみ** (Sad): 涙目、口角を下げる
5. **驚き** (Surprised): 目を大きく見開く、口を開ける

#### 生成パラメータ
- **一貫性優先モード**: キャラクター特徴100%維持、表情のみ変更
- **品質**: 2K解像度 (2048x2048px)
- **アスペクト比**: 1:1 (OBS/VTube Studio標準)
- **形式**: PNG (透過背景対応)

#### 技術仕様
```typescript
interface DifferenceGenerationRequest {
  characterId: string;
  expressions: ('neutral' | 'happy' | 'angry' | 'sad' | 'surprised')[];
  options: {
    resolution: '1K' | '2K' | '4K';
    backgroundColor: 'transparent' | string;
    aspectRatio: '1:1' | '3:4';
  };
}

interface DifferenceResult {
  id: string;
  characterId: string;
  expression: string;
  imageUrl: string;
  consistency: number; // 0-100
  generatedAt: Date;
}
```

#### Gemini Prompt Strategy (一貫性95%達成)
```typescript
const generateConsistentPrompt = (profile: CharacterProfile, expression: string) => {
  const basePrompt = profile.geminiPrompt; // マスター特徴
  const expressionModifiers = {
    happy: "smiling, eyes slightly closed, cheerful expression",
    angry: "furrowed brows, pouting lips, intense gaze",
    sad: "teary eyes, downturned mouth, melancholic expression",
    surprised: "wide open eyes, open mouth, shocked expression"
  };

  return `${basePrompt}

CRITICAL: Maintain exact character consistency:
- Hair: ${profile.features.hair.color} ${profile.features.hair.style}
- Eyes: ${profile.features.eyes.color} ${profile.features.eyes.shape}
- Outfit: ${profile.features.outfit.primary}

ONLY CHANGE: Facial expression to ${expressionModifiers[expression]}

Same pose, same angle, same lighting, same art style (${profile.features.artStyle}).`;
};
```

#### API Endpoint
```
POST /api/v1/differences/batch
Request:
{
  "characterId": "char_abc123",
  "expressions": ["neutral", "happy", "angry", "sad", "surprised"],
  "options": { "resolution": "2K", "backgroundColor": "transparent" }
}

Response:
{
  "batchId": "batch_xyz789",
  "results": [
    { "expression": "neutral", "imageUrl": "...", "consistency": 96.1 },
    { "expression": "happy", "imageUrl": "...", "consistency": 95.7 },
    ...
  ],
  "averageConsistency": 95.4,
  "generationTime": "23s"
}
```

#### Implementation
- **ベース**: `services/geminiService.ts::generateCharacterSheet()` (70%再利用)
- **新規実装**:
  - `services/differenceGenerator.ts` (バッチ生成ロジック)
  - `utils/consistencyChecker.ts` (一貫性スコア計算)

---

### P0-3: プレビュー & 比較
**Priority**: P0 (Critical)
**Estimated Effort**: 4日

#### 仕様
- **グリッドビュー**: 5差分を1画面で並列表示
- **個別拡大**: クリックで全画面プレビュー
- **比較モード**: 2差分を左右split表示、スライダーで比較
- **一貫性スコア**: 各差分の一貫性%を視覚化

#### UI/UX
```
┌─────────────────────────────────────────────────────┐
│  ベース画像          Consistency: 100%              │
│  [Original Image]                                   │
└─────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 通常     │ 喜び     │ 怒り     │ 悲しみ   │ 驚き     │
│ 96.1%    │ 95.7%    │ 94.8%    │ 95.2%    │ 95.9%    │
│ [Image]  │ [Image]  │ [Image]  │ [Image]  │ [Image]  │
│ [再生成] │ [再生成] │ [再生成] │ [再生成] │ [再生成] │
│ [編集]   │ [編集]   │ [編集]   │ [編集]   │ [編集]   │
│ [DL]     │ [DL]     │ [DL]     │ [DL]     │ [DL]     │
└──────────┴──────────┴──────────┴──────────┴──────────┘

[Compare Mode] [Download All (ZIP)] [Export for VTube Studio]
```

#### 技術仕様
```typescript
interface PreviewState {
  characterId: string;
  baseImage: string;
  differences: DifferenceResult[];
  selectedForComparison: [string, string] | null;
  viewMode: 'grid' | 'fullscreen' | 'compare';
}
```

#### Implementation
- **ベース**: `CharacterDesignView.tsx` (60%再利用)
- **新規コンポーネント**:
  - `components/DifferenceGrid.tsx`
  - `components/ComparisonView.tsx`
  - `components/ConsistencyMeter.tsx`

---

### P0-4: 一括ダウンロード (ZIP)
**Priority**: P0 (Critical)
**Estimated Effort**: 3日

#### 仕様
- **形式**: ZIP圧縮アーカイブ
- **ファイル名規則**: `{CharacterName}_{Expression}_{Timestamp}.png`
- **ディレクトリ構造**:
  ```
  ゆめちゃん_20260207/
  ├── ゆめちゃん_通常.png
  ├── ゆめちゃん_喜び.png
  ├── ゆめちゃん_怒り.png
  ├── ゆめちゃん_悲しみ.png
  ├── ゆめちゃん_驚き.png
  └── metadata.json (キャラクター情報)
  ```

#### 技術仕様
```typescript
interface DownloadOptions {
  format: 'zip' | 'individual';
  includeMetadata: boolean;
  resolution: '1K' | '2K' | '4K';
}

// metadata.json
interface ExportMetadata {
  characterName: string;
  generatedAt: string;
  differences: { expression: string; filename: string; consistency: number }[];
  miyabiVersion: string;
}
```

#### API Endpoint
```
GET /api/v1/differences/export/{batchId}?format=zip

Response: application/zip (Binary)
```

#### Implementation
- **ベース**: `utils/fileUtils.ts::downloadFile()` (40%再利用)
- **新規実装**:
  - `utils/zipExporter.ts` (JSZip統合)
  - `services/exportService.ts`

---

### P0-5: VTube Studio連携エクスポート
**Priority**: P0 (Critical)
**Estimated Effort**: 5日

#### 仕様
VTube StudioおよびLive2Dで使用可能な形式でエクスポート:
- **Live2D Cubism互換**: PSD形式（レイヤー分け）
- **VTube Studio直接インポート**: PNG + JSONメタデータ

#### VTube Studio形式
```json
{
  "version": "1.0",
  "character": {
    "name": "ゆめちゃん",
    "expressions": [
      { "id": "neutral", "file": "ゆめちゃん_通常.png" },
      { "id": "happy", "file": "ゆめちゃん_喜び.png" },
      { "id": "angry", "file": "ゆめちゃん_怒り.png" },
      { "id": "sad", "file": "ゆめちゃん_悲しみ.png" },
      { "id": "surprised", "file": "ゆめちゃん_驚き.png" }
    ]
  },
  "settings": {
    "resolution": "2048x2048",
    "transparency": true
  }
}
```

#### Live2D PSD形式 (Phase 2実装予定)
```
ゆめちゃん.psd
├── Layer: Base (通常)
├── Layer: Happy (喜び)
├── Layer: Angry (怒り)
├── Layer: Sad (悲しみ)
└── Layer: Surprised (驚き)
```

#### API Endpoint
```
POST /api/v1/differences/export/vtube-studio
Request:
{
  "batchId": "batch_xyz789",
  "format": "vtube-studio-json" | "live2d-psd"
}

Response:
{
  "downloadUrl": "https://storage.miyabi.ai/exports/...",
  "expiresAt": "2026-02-08T00:00:00Z"
}
```

#### Implementation
- **新規実装**:
  - `services/vtubeStudioExporter.ts`
  - `utils/psdGenerator.ts` (ag-psd統合)
- **外部ライブラリ**:
  - `ag-psd`: PSD生成
  - `jszip`: ZIP圧縮

---

### P0-6: クレジット管理 (使用量制限)
**Priority**: P0 (Critical)
**Estimated Effort**: 4日

#### 仕様
**Free Plan**:
- 月間生成回数: 5キャラクター/月 (25差分)
- 解像度上限: 1K
- 透過背景: ❌

**Basic Plan** (¥980/月):
- 月間生成回数: 20キャラクター/月 (100差分)
- 解像度上限: 2K
- 透過背景: ✅
- VTube Studio連携: ✅

**Pro Plan** (¥2,980/月):
- 月間生成回数: 無制限
- 解像度上限: 4K
- 透過背景: ✅
- VTube Studio連携: ✅
- 優先生成キュー: ✅
- APIアクセス: ✅

#### 技術仕様
```typescript
interface UserCredit {
  userId: string;
  plan: 'free' | 'basic' | 'pro';
  monthlyQuota: number;
  usedThisMonth: number;
  resetDate: Date;
  stripeSubscriptionId?: string;
}

interface CreditTransaction {
  id: string;
  userId: string;
  characterId: string;
  differencesGenerated: number;
  creditsUsed: number;
  timestamp: Date;
}
```

#### DB Schema (PostgreSQL)
```sql
CREATE TABLE user_credits (
  user_id UUID PRIMARY KEY,
  plan VARCHAR(10) NOT NULL DEFAULT 'free',
  monthly_quota INT NOT NULL,
  used_this_month INT NOT NULL DEFAULT 0,
  reset_date TIMESTAMP NOT NULL,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  character_id UUID REFERENCES characters(id),
  differences_generated INT NOT NULL,
  credits_used INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
```

#### API Endpoint
```
GET /api/v1/credits/usage

Response:
{
  "plan": "basic",
  "quota": 20,
  "used": 7,
  "remaining": 13,
  "resetDate": "2026-03-01T00:00:00Z"
}
```

#### Implementation
- **新規実装**:
  - `services/creditManager.ts`
  - `hooks/useCredits.ts`
  - `components/CreditDisplay.tsx`
- **統合**: Stripe Billing for subscription management

---

## ❌ MVP除外機能 (Phase 2以降)

### Phase 2 (Month 3-4) 実装予定
- **カスタム差分**: ユーザー定義の表情・ポーズ
- **Live2D PSDエクスポート**: 完全対応
- **バッチ編集**: 複数差分を一括調整
- **AIアシスタント**: 差分生成のサジェスト

### Phase 3 (Month 5-6) 実装予定
- **3Dモデル対応**: VRoid/VRM形式
- **アニメーション生成**: 表情モーフィング
- **コミュニティギャラリー**: 作品共有機能
- **API公開**: 外部ツール連携

---

## 🎯 MVP Success Metrics

### 初期ローンチ目標 (Month 1)
- **ユーザー登録**: 50名
- **有料転換率**: 10% (5名)
- **平均生成時間**: 30分以内 (95%達成率)
- **一貫性スコア**: 平均95%以上
- **NPS**: 40+

### 技術KPI
- **API応答時間**: 差分1枚あたり平均4秒
- **エラー率**: 5%以下
- **稼働率**: 99.5%以上

---

## 📅 MVP開発ロードマップ

| Week | タスク | 担当 | 状態 |
|------|--------|------|------|
| 1-2 | 環境構築、DB設計、Rust Backend基盤 | Backend | 未着手 |
| 3 | P0-1: キャラクター分析機能実装 | Backend | 未着手 |
| 4 | P0-2: 差分生成エンジン実装 | Backend | 未着手 |
| 5 | P0-3: プレビューUI実装 | Frontend | 未着手 |
| 6 | P0-4: 一括DL機能実装 | Full-stack | 未着手 |
| 7 | P0-5: VTube Studio連携 | Full-stack | 未着手 |
| 8 | P0-6: クレジット管理 + Stripe統合 | Backend | 未着手 |
| 9 | 統合テスト、UI/UX調整 | All | 未着手 |
| 10 | ソフトローンチ (Beta 5ユーザー) | All | 未着手 |

**完成目標日**: 2026-02-07

---

## 🔗 Next Steps

このMVP定義を元に、次のドキュメントを作成:
1. **UI/UXデザイン** (`02-ui-ux-design.md`)
2. **技術アーキテクチャ** (`03-tech-architecture.md`)
3. **API設計** (`04-api-design.md`)
4. **データベース設計** (`05-database-schema.md`)
5. **開発ロードマップ** (`06-development-roadmap.md`)

---

**Author**: ProductDesignAgent
**Last Updated**: 2025-12-07
**Status**: ✅ Completed
