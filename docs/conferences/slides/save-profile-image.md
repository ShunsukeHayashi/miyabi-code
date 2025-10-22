# プロフィール画像の保存手順

アップロードされたプロフィール画像をスライドに統合するための手順です。

## 🖼️ 画像の保存方法

### 方法1: ブラウザから直接保存（推奨）

1. **画像を右クリック**
   - アップロードされた画像を右クリック
   - 「画像を保存」または「名前を付けて画像を保存」を選択

2. **保存先とファイル名を指定**
   - 保存先: `/Users/a003/dev/miyabi-private/docs/conferences/slides/`
   - ファイル名: `source-profile.jpg`
   - **重要**: 拡張子は `.jpg` にする

3. **保存を確認**
   ```bash
   ls -lh /Users/a003/dev/miyabi-private/docs/conferences/slides/source-profile.jpg
   ```

### 方法2: ターミナルでダウンロード（既にダウンロード済みの場合）

```bash
# ダウンロードフォルダから移動
cd ~/Downloads

# 最新のダウンロード画像を確認
ls -lt *.jpg *.png | head -5

# ファイル名を確認したら移動（例: downloaded-image.jpg）
cp downloaded-image.jpg /Users/a003/dev/miyabi-private/docs/conferences/slides/source-profile.jpg

# 確認
ls -lh /Users/a003/dev/miyabi-private/docs/conferences/slides/source-profile.jpg
```

### 方法3: Finderから移動

1. Finderで画像ファイルを見つける
2. ファイルをコピー
3. `/Users/a003/dev/miyabi-private/docs/conferences/slides/` に移動
4. `source-profile.jpg` にリネーム

---

## 🚀 画像保存後の実行手順

### ステップ1: 画像が保存されたことを確認

```bash
cd /Users/a003/dev/miyabi-private/docs/conferences/slides

# ファイル存在確認
ls -lh source-profile.jpg

# 画像情報確認（ImageMagickがある場合）
identify source-profile.jpg
```

### ステップ2: APIキー設定

```bash
export BYTEPLUS_API_KEY=your_api_key_here
```

### ステップ3: 全アセット生成スクリプト実行

```bash
./generate-all-assets.sh
```

このスクリプトは以下を自動実行します:
1. ✅ プロフィール画像の編集（Image Edit API）
2. ✅ 残り8枚の画像生成（Text-to-Image API）
3. ✅ HTMLへの画像統合
4. ✅ プレゼンテーションをブラウザで開く

---

## 📊 実行結果

### 生成される画像ファイル（9枚）

```
images/
├── profile-professional.png      # プロフィール写真（Image Edit）
├── agent-icons-background.png    # タイトル背景（T2I）
├── github-contributions.png      # GitHub活動グラフ（T2I）
├── tool-comparison-arrow.png     # ツール比較（T2I）
├── ai-levels-pyramid.png         # 3レベルピラミッド（T2I）
├── github-os-architecture.png    # アーキテクチャ図（T2I）
├── coding-agents-flowchart.png   # Agentフロー（T2I）
├── rust-performance-comparison.png # パフォーマンス比較（T2I）
└── github-qr-code.png            # QRコード（T2I）
```

### 更新されるファイル

- `index.html` - 画像参照が統合される
- `index.html.backup` - 元のHTMLのバックアップ

---

## ⚠️ トラブルシューティング

### 問題: `source-profile.jpg` が見つからない

**症状**:
```
⚠️  Source image not found: source-profile.jpg
Skipping profile image edit...
```

**解決策**:
1. 画像を正しい場所に保存したか確認
2. ファイル名が `source-profile.jpg` であることを確認
3. ファイルパーミッションを確認: `chmod 644 source-profile.jpg`

### 問題: 画像が破損している

**症状**:
```
❌ Error: Failed to parse response: Invalid image data
```

**解決策**:
1. 元の画像ファイルを確認
2. JPG形式であることを確認
3. 別の画像編集ツールで開けるか確認
4. 必要に応じて画像を再ダウンロード

---

## 🎯 次のステップ

1. **画像を保存** - 上記の方法1〜3のいずれかで `source-profile.jpg` を保存
2. **スクリプト実行** - `./generate-all-assets.sh`
3. **プレビュー確認** - 自動的にブラウザで開かれる
4. **必要に応じて調整** - プロンプトを編集して再生成

---

**準備完了したら、以下を実行してください**:

```bash
cd /Users/a003/dev/miyabi-private/docs/conferences/slides
export BYTEPLUS_API_KEY=your_api_key
./generate-all-assets.sh
```
