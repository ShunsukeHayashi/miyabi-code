# A2A完成記念プレゼンテーション - ビジュアル要素パッケージ

**バージョン**: 1.0.0
**作成日**: 2025-12-07
**作成者**: ImageGenAgent (彩) + Claude Code

---

## 📦 パッケージ内容

このディレクトリには、A2A完成記念プレゼンテーション用のすべてのビジュアル要素が含まれています。

```
A2A/presentation/
├── README.md                          # このファイル
├── layout-guide.md                    # レイアウト・デザインガイド
├── generate_diagrams.sh               # PlantUML生成スクリプト
│
├── diagrams/                          # PlantUMLソース
│   ├── 01_system_architecture.puml   # システム全体図
│   ├── 02_communication_flow.puml    # 通信フローシーケンス
│   └── 03_four_phase_flow.puml       # 4フェーズ開発フロー
│
├── data-visualizations/               # インタラクティブチャート
│   ├── commit_stats.html             # 月次コミット数グラフ
│   └── efficiency_curve.html         # 効率向上カーブ
│
├── image-prompts/                     # AI画像生成用
│   └── dalle3_prompts.md             # DALL-E 3プロンプト集
│
└── output/                            # 生成済みファイル
    ├── diagrams/                      # PlantUML PNG出力
    ├── charts/                        # チャートスクリーンショット
    └── images/                        # AI生成画像
```

---

## 🚀 クイックスタート

### 1. 必要なツールのインストール

```bash
# PlantUML (図表生成)
brew install plantuml

# ImageMagick (画像処理)
brew install imagemagick

# Node.js (チャート生成)
brew install node
```

### 2. PlantUML図表の生成

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/A2A/presentation
chmod +x generate_diagrams.sh
./generate_diagrams.sh
```

出力先: `output/diagrams/`

### 3. データビジュアライゼーションのエクスポート

```bash
# HTMLファイルをブラウザで開く
open data-visualizations/commit_stats.html
open data-visualizations/efficiency_curve.html

# スクリーンショットを撮影（Command+Shift+4）
# または Chrome DevToolsでPNG/PDF出力
```

出力先: `output/charts/`

### 4. AI画像生成（DALL-E 3）

```bash
# image-prompts/dalle3_prompts.md を参照
# OpenAI APIまたはChatGPT Plusでプロンプトを実行

# 環境変数設定（BytePlus ARK使用の場合）
export BYTEPLUS_API_KEY="your-api-key"

# ImageGenAgent経由で生成（オプション）
miyabi agent run imagegen --task-file image-prompts/dalle3_batch.json
```

出力先: `output/images/`

---

## 📊 ビジュアル要素一覧

### PlantUML図表（3点）

| ファイル | スライド | 説明 | サイズ |
|---------|---------|------|--------|
| 01_system_architecture.puml | 8 | 6エージェント全体図 | 1600x1200 |
| 02_communication_flow.puml | 7 | 通信フローシーケンス | 1200x900 |
| 03_four_phase_flow.puml | 9-12 | 4フェーズ開発フロー | 1400x1000 |

**生成方法**:
```bash
./generate_diagrams.sh
```

---

### データビジュアライゼーション（2点）

| ファイル | スライド | 説明 | インタラクティブ |
|---------|---------|------|-----------------|
| commit_stats.html | 16 | 月次コミット数推移 | ✅ Yes (hover) |
| efficiency_curve.html | 17 | 効率向上カーブ | ✅ Yes (milestones) |

**使用方法**:
1. ブラウザで開く
2. スクリーンショット撮影（2400x1350 @ 2x推奨）
3. Keynote/PowerPointに貼り付け

**エクスポート推奨設定**:
- Resolution: 2400x1350 (2x for Retina)
- Format: PNG
- Browser: Chrome/Safari (フォントレンダリング最適)

---

### AI生成画像（10点）

| プロンプトID | スライド | 説明 | サイズ | スタイル |
|------------|---------|------|--------|---------|
| 01_title_bg | 1 | タイトル背景（ネットワーク） | 1920x1080 | Abstract Tech |
| 02_team | 7 | 6エージェントキャラクター | 1200x900 | Kawaii Flat |
| 03_flow | 8 | 通信フロー概念図 | 1600x900 | Cyberpunk |
| 04_roadmap | 22 | ロードマップタイムライン | 1800x600 | Infographic |
| 05_society | 20 | Society拡張図 | 1400x1000 | Network Topology |
| 06_vision | 28-29 | 未来ビジョン | 2560x1080 | Cinematic Anime |
| 07_comparison | 25 | Before/After比較 | 1600x900 | Infographic |
| 08_data_bg | 16-18 | データビジュアル背景 | 1920x1080 | Dashboard |
| 09_protocol | 9 | P0.2プロトコル図 | 1200x800 | Technical Blueprint |
| 10_metrics | 17 | 成功メトリクスダッシュボード | 1600x900 | UI Cards |

**生成方法**:
```bash
# DALL-E 3を使用（推奨）
# image-prompts/dalle3_prompts.md から該当プロンプトをコピー
# ChatGPT Plus または OpenAI API で実行

# または BytePlus ARK経由
export BYTEPLUS_API_KEY="your-key"
miyabi agent run imagegen --prompt "$(cat image-prompts/dalle3_prompts.md | sed -n '/## 1. タイトル/,/---/p')"
```

---

## 🎨 デザインシステム

### カラーパレット

```css
/* Primary Colors */
--primary-orange: #FF6B35;
--primary-blue:   #004E89;
--dark-gray:      #1a1a1a;
--accent-green:   #00D084;
--white:          #ffffff;

/* Secondary Colors */
--light-orange:   #F7931E;
--light-blue:     #0066CC;
--medium-gray:    #666666;
--light-gray:     #f5f5f5;
```

### タイポグラフィ

| 要素 | フォント | サイズ | ウェイト |
|------|---------|--------|---------|
| H1 (Title) | Hiragino Sans | 72pt | Bold |
| H2 (Slide Title) | Hiragino Sans | 54pt | Bold |
| H3 (Section) | Hiragino Sans | 36pt | Semi-bold |
| Body | Hiragino Sans | 24pt | Regular |
| Code | SF Mono | 20pt | Regular |
| Caption | Hiragino Sans | 18pt | Regular |

---

## 📐 スライドレイアウト

詳細は `layout-guide.md` を参照。

### 基本グリッド
- **Aspect Ratio**: 16:9 (1920x1080)
- **Padding**: 60px all sides
- **Column Gap**: 40px
- **Content Area**: 1800x960 (after padding)

### レイアウトパターン
1. **タイトルスライド**: Center-aligned, full-screen background
2. **コンテンツスライド**: 2-column (60/40 split)
3. **フルワイド図表**: Center, max-width 80%
4. **比較スライド**: 2-column (50/50 split)

---

## 🔄 ワークフロー

### 1. 図表生成フロー

```
PlantUML Source (.puml)
    ↓
  [generate_diagrams.sh]
    ↓
PNG Output (1x)
    ↓
  [ImageMagick]
    ↓
PNG Output (2x for Retina)
    ↓
Keynote/PowerPoint
```

### 2. チャート生成フロー

```
HTML Visualization (.html)
    ↓
  [Browser Open]
    ↓
Screenshot (2400x1350)
    ↓
  [Image Optimization]
    ↓
Keynote/PowerPoint
```

### 3. AI画像生成フロー

```
Prompt (.md)
    ↓
  [DALL-E 3 / BytePlus ARK]
    ↓
Raw Image (1024x1024 or custom)
    ↓
  [Image Optimization]
    ↓
Resized/Cropped for Slide
    ↓
Keynote/PowerPoint
```

---

## 🛠️ トラブルシューティング

### PlantUML生成エラー

**症状**: `Error: PlantUML not found`

**対処**:
```bash
# macOS
brew install plantuml

# 手動インストール
curl -O https://sourceforge.net/projects/plantuml/files/plantuml.jar/download
alias plantuml='java -jar ~/plantuml.jar'
```

---

### 日本語フォント表示崩れ

**症状**: 図表内の日本語が文字化け

**対処**:
```bash
# PlantUML設定ファイル作成
echo "skinparam defaultFontName Hiragino Sans" > ~/.plantuml/config

# または各.pumlファイルに追記
# skinparam defaultFontName "Hiragino Sans"
```

---

### HTMLチャートのフォント問題

**症状**: ブラウザでフォントが正しく表示されない

**対処**:
```css
/* data-visualizations/*.html に追記 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');

body {
  font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
}
```

---

### DALL-E 3画像サイズ不一致

**症状**: 生成画像が指定サイズと異なる

**対処**:
```bash
# ImageMagickで一括リサイズ
cd output/images
for img in *.png; do
  convert "$img" -resize 1920x1080 -background black -gravity center -extent 1920x1080 "resized_$img"
done
```

---

## 📤 エクスポート & 配布

### Keynoteエクスポート

```
File → Export To → Images
- Format: PNG
- Resolution: 2x (3840x2160)
- Include builds: Yes
```

### PowerPointエクスポート

```
File → Export → PNG
- Resolution: 300 DPI
- Size: 1920x1080
- Color Space: sRGB
```

### PDF（配布用）

```
File → Export → PDF
- Resolution: 300 DPI
- Embed fonts: Yes
- Compression: Medium
```

---

## 🧪 品質チェックリスト

### デザイン
- [ ] カラーパレット統一（#FF6B35, #004E89, #00D084, #1a1a1a）
- [ ] フォントサイズ最小18pt以上
- [ ] コントラスト比 WCAG AA準拠（4.5:1以上）
- [ ] 全スライドに日本語alt text設定

### 技術
- [ ] PlantUML図表: PNG 2x生成済み
- [ ] HTMLチャート: 2400x1350スクリーンショット
- [ ] AI画像: 1920x1080以上
- [ ] 全画像: sRGB色空間

### コンテンツ
- [ ] スライド番号と画像の対応確認
- [ ] 誤字脱字チェック
- [ ] 数値データの最新性確認
- [ ] ロゴ・ブランド表示の正確性

---

## 📚 参考資料

### 内部ドキュメント
- `layout-guide.md` - レイアウト詳細ガイド
- `image-prompts/dalle3_prompts.md` - AI画像生成プロンプト
- `../TMUX_A2A_COMMUNICATION_PROTOCOL.md` - A2A技術仕様

### 外部リソース
- [PlantUML公式](https://plantuml.com/)
- [DALL-E 3 Guide](https://platform.openai.com/docs/guides/images)
- [Keynote User Guide](https://support.apple.com/guide/keynote/)

---

## 🤝 貢献者

| 役割 | 担当 |
|------|------|
| PlantUML設計 | Claude Code |
| データビジュアライゼーション | Claude Code |
| AI画像プロンプト作成 | ImageGenAgent (彩) |
| レイアウトガイド | Claude Code |
| 品質レビュー | ReviewAgent (サクラ) |

---

## 📝 ライセンス

このビジュアル要素パッケージは、Miyabiプロジェクト内部使用のために作成されました。

---

## 📞 サポート

質問や問題があれば：

```bash
# GitHub Issue作成
gh issue create --title "Presentation Visual Issue" --body "詳細..."

# または Slack
#miyabi-dev チャンネルで質問
```

---

**最終更新**: 2025-12-07
**バージョン**: 1.0.0
**ステータス**: ✅ Ready for Use

---

*「イメージできた！これ、すっごく良くなりそう！」 - 彩 (ImageGenAgent) 🎨*
