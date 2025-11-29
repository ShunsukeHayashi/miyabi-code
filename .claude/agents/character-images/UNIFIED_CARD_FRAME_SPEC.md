---
name: doc_UNIFIED_CARD_FRAME_SPEC
description: Documentation file: UNIFIED_CARD_FRAME_SPEC.md
---

# 🎴 統一TCGカードフレーム仕様書

**Version**: 1.0.0  
**Last Updated**: 2025-11-27  
**Purpose**: 全てのカードで一貫性のある外枠デザインを確保

---

## 📐 カード基本仕様

### 物理的寸法
- **カードサイズ**: 63mm × 88mm (標準TCGサイズ)
- **コーナー半径**: 3.5mm
- **ブリード領域**: 3mm
- **セーフエリア**: 内側5mm

### フレーム構造（外側から内側へ）

```
┌─────────────────────────────────┐ ← 1. 最外枠 (2mm)
│┌───────────────────────────────┐│ ← 2. レアリティ枠 (3mm)
││┌─────────────────────────────┐││ ← 3. 基本フレーム (8mm)
│││                             │││
│││      コンテンツエリア         │││
│││                             │││
││└─────────────────────────────┘││
│└───────────────────────────────┘│
└─────────────────────────────────┘
```

---

## 🎨 統一フレームデザイン

### 1. 最外枠（全カード共通）
- **色**: ダークグレー (#1a1a1a)
- **幅**: 2mm
- **効果**: マットな質感

### 2. レアリティ枠（レアリティによる変化）
- **幅**: 3mm（全レアリティ共通）
- **デザイン**:
  - **UR**: レインボーグラデーション + アニメーション
  - **SSR**: ゴールドメタリック
  - **SR**: シルバーメタリック
  - **R**: ブルーメタリック
  - **N**: ライトグレー

### 3. 基本フレーム（全カード共通）
- **色**: ブラック (#000000)
- **幅**: 8mm
- **装飾**: サイバーパンク風の回路パターン
- **透明度**: 90%（背景が少し透ける）

---

## 📍 固定要素の配置

### 上部セクション（高さ: 15mm）
```
[レア度]        [属性アイコン]        [Lv.XX]
  5mm              中央               5mm
```

### カードナンバー（左下）
```
No.001
1st Edition
```

### コレクション情報（右下）
```
MIYABI TCG
© 2025
```

---

## 🖼️ アートワークエリア

### 配置ルール
- **上端**: フレーム内側から 15mm
- **下端**: フレーム内側から 35mm
- **左右**: フレーム内側から 8mm
- **実際のアートサイズ**: 47mm × 38mm

### アートフレーム
- **全カード共通**: 1mmの黒い境界線
- **SR以上**: 追加で1mmのメタリック境界線

---

## 📝 テキストエリア仕様

### 名前バー（アート下部）
- **高さ**: 8mm
- **背景**: 半透明ブラック (rgba(0,0,0,0.8))
- **フォント**: ゴシック体、太字
- **文字サイズ**: 14pt

### ステータスボックス
- **配置**: 名前バー下部
- **高さ**: 12mm
- **背景**: 半透明グレー (rgba(128,128,128,0.3))
- **枠線**: 1mm、属性色

### スキルボックス
- **配置**: ステータス下部
- **高さ**: 可変（最大15mm）
- **背景**: 半透明ブラック (rgba(0,0,0,0.6))
- **枠線**: 0.5mm、白

---

## 🎯 統一プロンプト追加要素

以下の要素を全てのカード生成プロンプトに必ず含める：

```
UNIFIED FRAME SPECIFICATIONS:
- Exact card dimensions: 63mm x 88mm with 3.5mm rounded corners
- Three-layer frame structure:
  1. Outermost border: 2mm solid dark grey (#1a1a1a)
  2. Rarity frame: 3mm (color varies by rarity)
  3. Base frame: 8mm solid black with cyberpunk circuit patterns
- Consistent element placement:
  - Top section (15mm height): Rarity, Attribute, Level
  - Artwork area: 47mm x 38mm centered
  - Name bar: 8mm height, semi-transparent black
  - Stats box: 12mm height, semi-transparent grey
  - Skill box: Variable height, semi-transparent black
- Bottom corners: Card number (left), Collection info (right)
- All text areas must have consistent opacity and border styles
```

---

## 🔧 実装チェックリスト

### カード生成前の確認事項
- [ ] フレーム幅の統一（2mm + 3mm + 8mm）
- [ ] 要素配置の座標確認
- [ ] フォントサイズの統一
- [ ] 背景透明度の一致
- [ ] コーナー半径の一致

### 品質確認
- [ ] 全カードを並べて枠の一致を確認
- [ ] レアリティ枠以外の要素が完全に一致
- [ ] テキストボックスの位置とサイズが統一
- [ ] カードナンバーとコレクション情報の位置

---

## 🎨 カラーコード一覧

### フレームカラー
```css
/* 基本フレーム */
--frame-outer: #1a1a1a;
--frame-base: #000000;
--frame-normal: #cccccc;
--frame-rare: #3b82f6;
--frame-sr: #c0c0c0;
--frame-ssr: #ffd700;
--frame-ur: linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff);

/* テキストエリア */
--bg-name-bar: rgba(0, 0, 0, 0.8);
--bg-stats: rgba(128, 128, 128, 0.3);
--bg-skill: rgba(0, 0, 0, 0.6);
```

---

**この仕様書に従うことで、全てのカードが統一された外枠を持つようになります。**