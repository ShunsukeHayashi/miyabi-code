# BytePlus ARK API 画像生成ガイド

BytePlus ARK API（ByteDance）を使った画像生成システム

## 📋 概要

BytePlus ARK APIの**SeedrEam-4-0**モデルを使用して、5つの画像生成モードをサポート：

1. **Text-to-Image** - テキストから画像生成
2. **Image-to-Image** - 既存画像をベースに新しい画像生成
3. **Sequential Generation** - 連続画像生成（最大40枚）
4. **Image-to-Images** - 1つの画像から複数の派生画像を生成
5. **Images-to-Image** - 複数の画像を組み合わせて1つの画像を生成

## 🛠️ セットアップ

### 1. 環境変数設定

`.env`ファイルにAPI Keyを設定：

```bash
# .env
ARK_API_KEY=your_api_key_here
```

### 2. 依存関係インストール

```bash
pip3 install python-dotenv requests
```

## 🚀 使用方法

### 基本的な使用法

#### 1. Text-to-Image（テキスト→画像）

```bash
python3 thumbnail-generator.py \
  --prompt "A futuristic city with flying cars" \
  --output ./city.png
```

**出力**:
- `city.png` - 生成された画像（1920x1080、約2-5MB）

---

#### 2. Image-to-Image（画像→画像）

既存の画像をベースに新しい画像を生成：

```bash
python3 thumbnail-generator.py \
  --prompt "Change this dog to running in a grassy field" \
  --source-image "https://example.com/dog.png" \
  --output ./dog_running.png
```

**使用例**:
- 画像のスタイル変更
- 背景の差し替え
- 色調調整
- 構図変更

---

#### 3. Sequential Generation（連続画像生成）

1つのプロンプトから複数の画像を生成：

```bash
python3 thumbnail-generator.py \
  --prompt "A courtyard corner across four seasons" \
  --sequential \
  --max-images 4 \
  --output ./season.png
```

**出力**:
- `season_00.png` - 春
- `season_01.png` - 夏
- `season_02.png` - 秋
- `season_03.png` - 冬

**パラメータ**:
- `--max-images`: 生成する画像数（最大40枚）
- ストリーミングで順次受信

---

#### 4. Image-to-Images（1つの画像→複数の画像）

1つの画像をベースに複数の派生画像を生成：

```bash
python3 thumbnail-generator.py \
  --prompt "Create brand identity using this logo: bags, hats, boxes, wristbands" \
  --source-image "https://example.com/logo.png" \
  --sequential \
  --max-images 5 \
  --output ./brand.png
```

**出力**:
- `brand_00.png` - ロゴ適用バッグ
- `brand_01.png` - ロゴ適用帽子
- `brand_02.png` - ロゴ適用箱
- `brand_03.png` - ロゴ適用リストバンド
- `brand_04.png` - ロゴ適用ランヤード

**使用例**:
- ブランディング展開
- 商品バリエーション生成
- デザインモックアップ

---

#### 5. Images-to-Image（複数の画像→1つの画像）

複数の画像を組み合わせて1つの新しい画像を生成：

```bash
python3 thumbnail-generator.py \
  --prompt "Replace the clothing in image 1 with the outfit from image 2" \
  --source-images "https://example.com/person.png" "https://example.com/outfit.png" \
  --output ./person_with_new_outfit.png
```

**使用例**:
- 画像1の服を画像2の服に置き換え
- 複数の要素を組み合わせた合成画像
- キャラクターのコスチューム変更

**パラメータ**:
- `--source-images`: 複数のURLをスペース区切りで指定
- 最大2枚の画像を組み合わせ可能

---

### Miyabi専用モード（推奨）

Miyabi開発進捗用のサムネイルを自動生成：

```bash
python3 thumbnail-generator.py \
  --miyabi \
  --commits 60 \
  --audio 14 \
  --output ./output/thumbnail.png
```

**自動生成プロンプト**:
```
A high-tech development progress visualization:
- Abstract digital dashboard with glowing metrics
- Futuristic HUD interface displaying: "60 commits, 14 audio files"
- Cyberpunk aesthetic with neon blue and purple gradients
- Minimalist design with geometric patterns
- Japanese kanji for "進捗" (progress) subtly integrated
- Dark background with bright accent colors
- Professional, clean, modern technology theme
- 16:9 aspect ratio optimized
- Cinematic lighting, depth of field, ray tracing
- High quality render, 4K resolution
```

**出力**:
- Full HD（1920x1080）
- 透かしなし
- Miyabiブランディングに最適化

---

## 📊 モード別比較表

| モード | 入力画像 | 出力画像 | ストリーミング | 用途 |
|--------|---------|---------|---------------|------|
| **Text-to-Image** | なし | 1枚 | ❌ | 基本的な画像生成 |
| **Image-to-Image** | 1枚 | 1枚 | ❌ | 画像の変換・編集 |
| **Sequential** | なし | 最大40枚 | ✅ | 連続画像生成 |
| **Image-to-Images** | 1枚 | 最大40枚 | ✅ | 1つの画像から複数派生 |
| **Images-to-Image** | 2枚 | 1枚 | ❌ | 複数画像の組み合わせ |

---

## 🎨 高度な使い方

### カスタムモデル指定

```bash
python3 thumbnail-generator.py \
  --prompt "Your prompt here" \
  --model "seedream-4-0-250828" \
  --output ./output.png
```

**利用可能なモデル**:
- `seedream-4-0-250828` (デフォルト)

### 透かしの制御

```bash
# デフォルトで透かしなし（watermark=false）
```

### サイズ指定

```bash
# デフォルトで2K（1920x1080）
```

---

## 🔧 miyabi-narrate.sh統合

動画生成時に自動的にサムネイルを生成する機能（将来実装）：

```bash
# フル機能実行（台本 + 音声 + 動画 + サムネイル）
./miyabi-narrate.sh --video --thumbnail
```

**実装予定**:
- Phase 12.6: 動画生成時の自動サムネイル生成
- video-generator.pyとの統合
- BytePlus ARK API自動呼び出し

---

## 📈 パフォーマンス

**生成時間**:
- 単一画像: ~10-20秒
- 連続4枚: ~30-60秒
- 連続10枚: ~60-120秒

**画像サイズ**:
- 2K（1920x1080）: 約2-5MB/枚
- 透かしなし: 約2-4MB/枚

**API制限**:
- 連続画像生成: 最大40枚
- タイムアウト: 60秒（単一）、120秒（連続）

---

## 🐛 トラブルシューティング

### Q1: API Keyエラー

**エラー**:
```
❌ エラー: ARK_API_KEYが設定されていません
```

**対処法**:
```bash
# .envファイルを確認
cat .env

# API Keyが正しく設定されているか確認
echo $ARK_API_KEY
```

---

### Q2: 画像URLが取得できない

**エラー**:
```
RuntimeError: 画像URLが取得できませんでした
```

**原因**:
- APIレスポンスが空
- ネットワークエラー
- 無効なプロンプト

**対処法**:
1. プロンプトを確認（具体的で明確な内容か）
2. ネットワーク接続を確認
3. API Keyの有効性を確認

---

### Q3: ストリーミング受信エラー

**エラー**:
```
JSONDecodeError: Expecting value
```

**原因**:
- ストリーミングデータのパースエラー
- 不完全なレスポンス

**対処法**:
- タイムアウト時間を延長
- `--max-images` を減らす

---

## 📚 API仕様

### BytePlus ARK API

**エンドポイント**:
```
POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations
```

**ヘッダー**:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_API_KEY"
}
```

**リクエストボディ**:
```json
{
  "model": "seedream-4-0-250828",
  "prompt": "Your prompt here",
  "image": "https://example.com/source.png",  // オプション
  "sequential_image_generation": "auto",      // オプション
  "sequential_image_generation_options": {
    "max_images": 4
  },
  "response_format": "url",
  "size": "2K",
  "stream": true,                             // オプション
  "watermark": false
}
```

**レスポンス**:
```json
{
  "data": [
    {
      "url": "https://generated-image-url.com/image.png"
    }
  ]
}
```

---

## 🔗 関連ドキュメント

- **BytePlus ARK API Docs**: https://ark.ap-southeast.bytepluses.com/docs
- **SeedrEam-4-0 Model**: ByteDance 画像生成モデル
- **Miyabi Project**: 開発進捗音声ガイドシステム

---

## 📄 ライセンス

このツールはMiyabiプロジェクトの一部として、プロジェクトのライセンスに従います。

BytePlus ARK APIの利用は、ByteDanceの利用規約に従います。

---

**作成日**: 2025-10-23
**バージョン**: v1.0.0
**作成者**: Claude Code (AI Assistant)
