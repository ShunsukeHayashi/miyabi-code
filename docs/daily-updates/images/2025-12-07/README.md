# A2A日次レポート用画像素材集
**日付**: 2025-12-07
**対象記事**: A2A自律型マルチエージェントシステム開発レポート

---

## 📂 ディレクトリ内容

### PlantUML図（技術図）
| ファイル | 説明 | 用途 |
|---------|------|------|
| `a2a-system-overview.puml` | A2Aシステム全体図 | システムアーキテクチャ説明 |
| `tmux-communication-system.puml` | tmux通信シーケンス図 | 通信プロトコル説明 |
| `efficiency-improvement-graph.puml` | 効率向上グラフ | パフォーマンス推移 |

### DALL-E 3プロンプト集
| ファイル | 説明 |
|---------|------|
| `dalle3-prompts.md` | 画像生成用プロンプト4種類 |

### スクリプト
| ファイル | 説明 |
|---------|------|
| `generate_images.sh` | PlantUMLをPNG化するスクリプト |

---

## 🚀 使用方法

### 1. PlantUML図をPNG化

```bash
# 実行権限を付与
chmod +x generate_images.sh

# PlantUMLインストール確認
brew install plantuml

# PNG生成
./generate_images.sh
```

生成されるファイル：
- `a2a-system-overview.png`
- `tmux-communication-system.png`
- `efficiency-improvement-graph.png`

### 2. DALL-E 3画像生成

`dalle3-prompts.md` を参照して、以下のいずれかの方法で生成：

#### A. ChatGPT Web UI（推奨）
1. ChatGPT Plus/Proアカウントでログイン
2. プロンプトをコピー＆ペースト
3. 生成画像をダウンロード

#### B. OpenAI API
```bash
# 環境変数設定
export OPENAI_API_KEY="sk-..."

# API呼び出し例
curl https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A futuristic command center...",
    "size": "1792x1024",
    "quality": "hd"
  }'
```

---

## 📝 記事への埋め込み

### Markdown記法
```markdown
# A2A自律型マルチエージェントシステム

![A2Aシステム全体図](./images/2025-12-07/a2a-system-overview.png)

## 通信プロトコル

![tmux通信システム](./images/2025-12-07/tmux-communication-system.png)

## パフォーマンス推移

![効率向上グラフ](./images/2025-12-07/efficiency-improvement-graph.png)
```

### HTML記法
```html
<figure>
  <img src="./images/2025-12-07/a2a-system-overview.png"
       alt="A2Aシステム全体図"
       width="800">
  <figcaption>図1: A2A自律型マルチエージェントシステム全体図</figcaption>
</figure>
```

---

## ✅ チェックリスト

- [x] PlantUML図3種類作成
- [x] DALL-E 3プロンプト4種類定義
- [x] PNG生成スクリプト作成
- [ ] PlantUML図のPNG生成実行
- [ ] DALL-E 3画像生成実行
- [ ] 記事への画像埋め込み
- [ ] 画像サイズ最適化（WebP変換等）

---

## 🎨 画像仕様

### PlantUML生成PNG
- **フォーマット**: PNG
- **解像度**: 自動（PlantUML標準）
- **推奨最大幅**: 1200px
- **最適化**: TinyPNG等で圧縮推奨

### DALL-E 3生成画像
| 用途 | サイズ | アスペクト比 |
|-----|--------|------------|
| ヘッダー画像 | 1792x1024 | 16:9 |
| SNS投稿 | 1024x1024 | 1:1 |
| 技術図 | 1792x1024 | 16:9 |

---

## 📊 画像対応表

| 記事内プレースホルダー | 対応画像ファイル | 生成方法 |
|---------------------|----------------|---------|
| `[--IMAGE--]` #1 システム概要 | `a2a-system-overview.png` | PlantUML |
| `[--IMAGE--]` #2 通信システム | `tmux-communication-system.png` | PlantUML |
| `[--IMAGE--]` #3 効率グラフ | `efficiency-improvement-graph.png` | PlantUML |
| オプション: ヒーロー画像 | `a2a-hero-20251207-v1.png` | DALL-E 3 |

---

## 🔧 トラブルシューティング

### PlantUML生成エラー
```bash
# PlantUML再インストール
brew reinstall plantuml

# Java確認
java -version
```

### 画像サイズが大きすぎる場合
```bash
# ImageMagickでリサイズ
brew install imagemagick
magick mogrify -resize 1200x1200\> *.png

# WebP変換（さらに圧縮）
brew install webp
cwebp -q 80 input.png -o output.webp
```

---

**作成者**: 彩（ImageGenAgent）🎨
**関連**: `.claude/agents/specs/coding/imagegen-agent.md`
