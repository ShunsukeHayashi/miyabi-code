# BytePlus Bootcamp Landing Page - 画像素材要件定義

**バージョン**: v1.0.0
**最終更新**: 2025-10-22
**対象**: `docs/byteplus-bootcamp-landing.html`
**Issue**: #363 (P1) - 画像素材準備

---

## 📊 概要

BytePlus Bootcamp Landing Pageに必要な画像素材8種類の詳細仕様。

### 画像一覧

| # | 画像名 | サイズ | 形式 | 優先度 | 用途 |
|---|-------|------|------|-------|------|
| 1 | OG/Twitter Card画像 | 1200x630px | PNG/JPG | ⭐⭐⭐ | SNSシェア |
| 2 | Hero背景画像 | 1920x1080px | WebP/JPG | ⭐⭐ | Hero セクション |
| 3 | Feature Icon 1: 市場理解 | 256x256px | SVG | ⭐⭐ | Feature Card |
| 4 | Feature Icon 2: 技術理解 | 256x256px | SVG | ⭐⭐ | Feature Card |
| 5 | Feature Icon 3: 実装スキル | 256x256px | SVG | ⭐⭐ | Feature Card |
| 6 | Feature Icon 4: 実践経験 | 256x256px | SVG | ⭐⭐ | Feature Card |
| 7 | Feature Icon 5: 収益化知識 | 256x256px | SVG | ⭐⭐ | Feature Card |
| 8 | Feature Icon 6: 即戦力 | 256x256px | SVG | ⭐⭐ | Feature Card |

---

## 🖼️ 詳細仕様

### 1️⃣ OG/Twitter Card画像

**ファイル名**: `byteplus-bootcamp-og.png` または `byteplus-bootcamp-og.jpg`

**配置先**: `docs/assets/byteplus-bootcamp-og.png`

**サイズ**: 1200x630px（厳守）

**形式**: PNG（透過なし）または JPG（品質90%以上）

**デザイン要件**:

#### カラースキーム
- **プライマリ**: #FF6B00（BytePlus Orange）
- **セカンダリ**: #FF8C42（Lighter Orange）
- **アクセント**: #667eea〜#764ba2（Purple Gradient）
- **背景**: 白または明るいグレー

#### 必須要素
1. **タイトル**: 「BytePlus Video AI Bootcamp 2025」
   - フォント: ゴシック体（太字）
   - サイズ: 大きく目立つように（72px相当）

2. **サブタイトル**: 「3時間で習得する次世代動画生成API実装」
   - フォント: ゴシック体（標準）
   - サイズ: 中サイズ（48px相当）

3. **キーメッセージ**:
   - 「150ページスライド」
   - 「15実装パターン」
   - 「30+コードサンプル」
   - 「無料参加」

4. **BytePlusロゴ**（オプション）:
   - 公式ロゴがある場合は右上に配置

5. **視覚要素**:
   - 動画再生アイコン
   - コードブロック風デザイン
   - グラデーション背景

#### レイアウト例
```
┌─────────────────────────────────────────────┐
│  [BytePlusロゴ]                              │
│                                             │
│   🎥 BytePlus Video AI Bootcamp 2025       │
│                                             │
│   3時間で習得する次世代動画生成API実装         │
│                                             │
│   ✓ 150ページスライド  ✓ 15実装パターン      │
│   ✓ 30+コードサンプル  ✓ 無料参加           │
│                                             │
│           [動画生成イメージ画像]              │
└─────────────────────────────────────────────┘
```

#### 推奨ツール
- **Figma**: https://www.figma.com/
- **Canva**: https://www.canva.com/
- **DALL-E 3**: https://openai.com/dall-e-3
- **Midjourney**: https://www.midjourney.com/

#### 参考URL
- Open Graph画像ベストプラクティス: https://www.kapwing.com/resources/open-graph-image-size/
- Twitter Card画像ガイド: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image

---

### 2️⃣ Hero背景画像

**ファイル名**: `hero-background.webp` または `hero-background.jpg`

**配置先**: `docs/assets/hero-background.webp`

**サイズ**: 1920x1080px（Full HD）

**形式**: WebP（推奨）または JPG

**デザイン要件**:

#### カラースキーム
- グラデーション背景: #FF6B00 → #FF8C42
- オーバーレイ: 半透明の白または黒（0.3透明度）

#### 必須要素
1. **抽象的な動画生成イメージ**:
   - ビデオカメラ
   - コードブロック
   - AI/機械学習のアイコン

2. **パターン**:
   - 幾何学模様
   - グリッドパターン
   - ドット模様

#### 使用場所
```css
.hero {
    background: linear-gradient(135deg, #FF6B00 0%, #FF8C42 100%);
    /* 上記の上にbackground-imageとして配置 */
}
```

#### 最適化
- WebP形式に変換
- 品質: 80-85%
- ファイルサイズ: 300KB以下

---

### 3️⃣〜8️⃣ Feature Icons（6種類）

**共通仕様**:

**サイズ**: 256x256px（SVG: スケーラブル）

**形式**: SVG（推奨）または PNG（透過）

**配置先**: `docs/assets/icons/`

**カラー**: #FF6B00（メインカラー）+ アクセントカラー

---

#### 3️⃣ Feature Icon 1: 市場理解（📊）

**ファイル名**: `icon-market-understanding.svg`

**デザイン要件**:
- チャート・グラフのアイコン
- 上昇トレンドを表現
- ビジネス分析のイメージ

**推奨モチーフ**:
- 折れ線グラフ
- 棒グラフ
- 円グラフ

---

#### 4️⃣ Feature Icon 2: 技術理解（⚙️）

**ファイル名**: `icon-technical-understanding.svg`

**デザイン要件**:
- 歯車・設定アイコン
- APIのイメージ
- 技術スタックのイメージ

**推奨モチーフ**:
- 歯車
- コードブロック
- APIエンドポイント

---

#### 5️⃣ Feature Icon 3: 実装スキル（💻）

**ファイル名**: `icon-implementation-skills.svg`

**デザイン要件**:
- コード・プログラミングのアイコン
- ラップトップ
- 開発者のイメージ

**推奨モチーフ**:
- ノートパソコン
- コードエディタ
- ターミナル

---

#### 6️⃣ Feature Icon 4: 実践経験（🎓）

**ファイル名**: `icon-hands-on-experience.svg`

**デザイン要件**:
- ハンズオン・学習のアイコン
- 実践的なイメージ
- ワークショップのイメージ

**推奨モチーフ**:
- 卒業帽
- チェックリスト
- 成功バッジ

---

#### 7️⃣ Feature Icon 5: 収益化知識（💰）

**ファイル名**: `icon-monetization-knowledge.svg`

**デザイン要件**:
- お金・ビジネスのアイコン
- 収益化のイメージ
- ビジネスモデルのイメージ

**推奨モチーフ**:
- ドル記号/円記号
- コイン
- 上昇グラフ

---

#### 8️⃣ Feature Icon 6: 即戦力（🚀）

**ファイル名**: `icon-immediate-readiness.svg`

**デザイン要件**:
- ロケット・スピードのアイコン
- 即戦力のイメージ
- 成長のイメージ

**推奨モチーフ**:
- ロケット
- 稲妻
- 上昇矢印

---

## 🛠️ 画像生成ツール

### AI画像生成

#### DALL-E 3（推奨）
- **URL**: https://openai.com/dall-e-3
- **用途**: OG画像、Hero背景
- **価格**: $0.04/画像（1024x1024）, $0.08/画像（1792x1024）

**プロンプト例（OG画像）**:
```
Create a professional social media banner image (1200x630px) for a tech bootcamp.
Theme: BytePlus Video AI Bootcamp 2025
Color scheme: Orange gradient (#FF6B00 to #FF8C42) with purple accents
Include:
- Large bold title "BytePlus Video AI Bootcamp 2025"
- Subtitle "3時間で習得する次世代動画生成API実装"
- Key points: "150 pages", "15 patterns", "30+ code samples"
- Abstract video/AI imagery
Style: Modern, tech-focused, professional
```

#### Midjourney
- **URL**: https://www.midjourney.com/
- **用途**: Hero背景、アイコン
- **価格**: $10/月〜

**プロンプト例（Hero背景）**:
```
/imagine abstract gradient background for tech landing page,
orange to light orange gradient (#FF6B00 to #FF8C42),
geometric patterns, video camera icons, code blocks,
AI/ML symbols, modern minimalist style,
high resolution 1920x1080 --ar 16:9
```

### アイコン生成

#### Heroicons（無料）
- **URL**: https://heroicons.com/
- **用途**: Feature Icons
- **形式**: SVG
- **ライセンス**: MIT

#### Font Awesome（無料/有料）
- **URL**: https://fontawesome.com/
- **用途**: Feature Icons
- **形式**: SVG
- **ライセンス**: フリー版あり

#### Iconscout（有料）
- **URL**: https://iconscout.com/
- **用途**: プロフェッショナルなアイコン
- **価格**: $19/月〜

---

## 📐 画像最適化

### WebP変換

#### cwebp（コマンドライン）

**インストール**:
```bash
# macOS
brew install webp

# Ubuntu
sudo apt-get install webp

# Windows
# https://developers.google.com/speed/webp/download からダウンロード
```

**変換コマンド**:
```bash
# JPG/PNGをWebPに変換（品質80%）
cwebp -q 80 input.jpg -o output.webp

# 複数ファイルを一括変換
for img in *.jpg; do
  cwebp -q 80 "$img" -o "${img%.jpg}.webp"
done
```

#### オンラインツール
- **Squoosh**: https://squoosh.app/
- **TinyPNG**: https://tinypng.com/

---

### レスポンシブ画像生成

#### ImageMagick

**インストール**:
```bash
brew install imagemagick
```

**リサイズコマンド**:
```bash
# 複数サイズを生成（320w, 640w, 1280w）
convert input.jpg -resize 320x output-320w.jpg
convert input.jpg -resize 640x output-640w.jpg
convert input.jpg -resize 1280x output-1280w.jpg

# WebP版も生成
for size in 320 640 1280; do
  convert input.jpg -resize ${size}x output-${size}w.jpg
  cwebp -q 80 output-${size}w.jpg -o output-${size}w.webp
done
```

---

## 📂 ディレクトリ構造

```
docs/
├── assets/
│   ├── byteplus-bootcamp-og.png           # OG/Twitter Card画像
│   ├── hero-background.webp               # Hero背景画像（WebP）
│   ├── hero-background.jpg                # Hero背景画像（フォールバック）
│   └── icons/
│       ├── icon-market-understanding.svg
│       ├── icon-technical-understanding.svg
│       ├── icon-implementation-skills.svg
│       ├── icon-hands-on-experience.svg
│       ├── icon-monetization-knowledge.svg
│       └── icon-immediate-readiness.svg
└── byteplus-bootcamp-landing.html
```

---

## 🔗 HTMLへの統合

### OG画像

**現在**:
```html
<meta property="og:image" content="https://shunsukehayashi.github.io/miyabi-private/assets/byteplus-bootcamp-og.png">
```

**確認**: 画像が配置されたら、URLが正しいか確認

### Hero背景画像

**追加**:
```css
.hero {
    background: linear-gradient(135deg, #FF6B00 0%, #FF8C42 100%),
                url('../assets/hero-background.webp') center/cover no-repeat;
}

/* フォールバック（WebP未対応ブラウザ） */
.no-webp .hero {
    background: linear-gradient(135deg, #FF6B00 0%, #FF8C42 100%),
                url('../assets/hero-background.jpg') center/cover no-repeat;
}
```

### Feature Icons

**現在**:
```html
<div class="feature-icon">📊</div>
```

**変更後**:
```html
<div class="feature-icon">
    <img src="assets/icons/icon-market-understanding.svg"
         alt="Market Understanding"
         width="64"
         height="64">
</div>
```

---

## ✅ チェックリスト

### 画像作成

- [ ] OG/Twitter Card画像（1200x630px）
- [ ] Hero背景画像（1920x1080px）
- [ ] Feature Icon 1: 市場理解（256x256px SVG）
- [ ] Feature Icon 2: 技術理解（256x256px SVG）
- [ ] Feature Icon 3: 実装スキル（256x256px SVG）
- [ ] Feature Icon 4: 実践経験（256x256px SVG）
- [ ] Feature Icon 5: 収益化知識（256x256px SVG）
- [ ] Feature Icon 6: 即戦力（256x256px SVG）

### 画像最適化

- [ ] WebP形式に変換
- [ ] ファイルサイズ確認（目標: OG 200KB以下、Hero 300KB以下）
- [ ] alt属性追加
- [ ] レスポンシブ画像対応

### HTMLへの統合

- [ ] OG画像のパス確認
- [ ] Hero背景画像のCSS追加
- [ ] Feature IconsをSVGに置き換え
- [ ] Lighthouseスコア再測定

---

## 📊 期待される効果

| 指標 | 現状 | 改善後 |
|-----|------|--------|
| **SEO Score** | 95+ | 95+ |
| **SNSシェア** | テキストのみ | 画像付き |
| **視覚的訴求力** | 低 | 高 |
| **ブランディング** | 中 | 高 |
| **Lighthouse Performance** | 85-90 | 90+ |

---

## 🔗 参考リソース

### デザインツール
- [Figma](https://www.figma.com/) - UI/UXデザイン
- [Canva](https://www.canva.com/) - グラフィックデザイン
- [Adobe Express](https://www.adobe.com/express/) - クイックデザイン

### AI画像生成
- [DALL-E 3](https://openai.com/dall-e-3) - AI画像生成
- [Midjourney](https://www.midjourney.com/) - AI画像生成
- [Stable Diffusion](https://stability.ai/) - オープンソースAI

### アイコンライブラリ
- [Heroicons](https://heroicons.com/) - 無料SVGアイコン
- [Font Awesome](https://fontawesome.com/) - アイコンフォント
- [Material Icons](https://fonts.google.com/icons) - Googleアイコン

### 画像最適化
- [Squoosh](https://squoosh.app/) - 画像圧縮
- [TinyPNG](https://tinypng.com/) - PNG/JPG圧縮
- [ImageOptim](https://imageoptim.com/) - Mac用画像最適化

---

## 📝 変更履歴

### v1.0.0 (2025-10-22)
- ✅ 画像要件定義（8種類）
- ✅ 詳細仕様（サイズ、形式、デザイン要件）
- ✅ AI画像生成プロンプト例
- ✅ 画像最適化ガイド
- ✅ HTMLへの統合方法

---

**最終更新**: 2025-10-22
**作成者**: Claude Code (AI Assistant)
**Issue**: #363 (P1) - 画像素材準備
