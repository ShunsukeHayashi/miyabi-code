# Stream Deck アイコン生成ガイド

**最終更新**: 2025-10-26
**API**: BytePlus Ark API (Seedream 4.0)

---

## 🎨 概要

Stream Deck用の32個の専用アイコンを、AI画像生成APIを使って自動生成します。

**生成されるアイコン**: 32個
**サイズ**: 1024x1024px (1K)
**スタイル**: ミニマリスト、フラットデザイン、モダンUI

---

## 📋 セットアップ

### Step 1: APIキーを設定

```bash
export ARK_API_KEY=your_api_key_here
```

**提供されたAPI Key**: `fdc9e681-e525-4122-9ed1-2d896f2cb11c`

### Step 2: アイコン生成スクリプトを実行

```bash
cd /Users/shunsuke/Dev/miyabi-private
tools/stream-deck/generate-icons.sh
```

---

## 🎯 生成されるアイコン一覧

### Row 1: Claude Code基本操作
1. **Next** - 青い右矢印、プレイボタンスタイル
2. **Continue** - ダブル右矢印、早送りシンボル
3. **Fix** - オレンジのレンチツール
4. **Help** - 紫のクエスチョンマーク

### Row 2: ビルド・テスト
5. **Build** - 建設クレーン、ビルディングブロック
6. **Test** - 緑のチェックマーク（円内）
7. **Clippy** - キラキラ付きクリップ
8. **Format** - ペイントローラー

### Row 3: Git操作
9. **Git** - Gitブランチ図、バージョン管理ツリー
10. **Commit** - チェックマーク付きチャット吹き出し
11. **PR** - マージ矢印
12. **Push** - 上向きに発射するロケット

### Row 4: Agent実行
13. **Coordinator** - 標的の的心
14. **CodeGen** - コードブラケット付きギア
15. **Review** - ドキュメント上の虫眼鏡
16. **Deploy** - 航海する船

### Row 5: ドキュメント・解析
17. **Docs** - ブックマーク付き開いた本
18. **Analyze** - 顕微鏡
19. **Benchmark** - チェッカーフラッグ
20. **Profile** - スピードメーター付き稲妻

### Row 6: デプロイ・インフラ
21. **Deploy Prod** - アップロード矢印付き地球
22. **Rollback** - 左を指す円形矢印
23. **Logs** - 行が入ったドキュメント
24. **Monitor** - 信号波付きレーダー画面

### Row 7: ユーティリティ
25. **Clean** - 掃除するほうき
26. **Cache** - リフレッシュ矢印付きデータベース
27. **Deps** - 矢印付きパッケージボックス
28. **Audit** - ロック付きシールド

### Row 8: カスタム・拡張
29. **Voice** - 音波付きスピーカー
30. **Infinity** - グロー効果付き無限記号
31. **Session** - 円形リフレッシュ矢印
32. **Custom** - 星付き設定ギア

---

## 🚀 実行方法

### 全アイコンを一括生成

```bash
export ARK_API_KEY=fdc9e681-e525-4122-9ed1-2d896f2cb11c
tools/stream-deck/generate-icons.sh
```

### 生成時間
- 1アイコンあたり約3-5秒
- 全32アイコン: 約2-3分

### 出力先
```
tools/stream-deck/icons/
├── 01-next.png
├── 02-continue.png
├── 03-fix.png
...
└── 32-custom.png
```

---

## 🎨 アイコンスタイル仕様

### デザインガイドライン
- **スタイル**: ミニマリスト、フラットデザイン
- **背景**: 白背景
- **形状**: クリーンな幾何学デザイン
- **色**: 各機能に適した鮮やかなカラー
- **テーマ**: モダンUI、テクノロジー

### カラーパレット
- **Blue系**: Next, Build, Git, Docs, Voice
- **Green系**: Test, Monitor, Deploy
- **Orange系**: Fix, Build, Rollback
- **Purple系**: Help, PR, Review, Cache
- **特殊**: Infinity (レインボーグラデーション)

---

## 🔧 カスタマイズ

### プロンプトの編集

`generate-icons.sh` 内の `ICONS` 配列を編集：

```bash
["01-next"]="Your custom prompt here"
```

### サイズ変更

APIリクエストの `size` パラメータを変更：
```bash
"size": "2K"  # または "512", "1K", "2K"
```

---

## ⚠️ トラブルシューティング

### APIキーエラー
```
❌ Error: ARK_API_KEY environment variable is not set
```
**解決策**: APIキーを設定
```bash
export ARK_API_KEY=your_key
```

### 生成失敗
```
❌ Failed to generate image
```
**解決策**:
1. APIキーが正しいか確認
2. インターネット接続を確認
3. APIクォータを確認

### Rate Limit
- スクリプトは各リクエスト間に2秒待機
- 必要に応じて `sleep 2` を調整

---

## 📊 API仕様

### エンドポイント
```
POST https://ark.ap-southeast.bytepluses.com/api/v3/images/generations
```

### パラメータ
```json
{
  "model": "seedream-4-0-250828",
  "prompt": "...",
  "sequential_image_generation": "disabled",
  "response_format": "url",
  "size": "1K",
  "stream": false,
  "watermark": false
}
```

---

## 🎯 次のステップ

1. **アイコン生成**: `generate-icons.sh` 実行
2. **Stream Deck設定**: 生成されたアイコンをボタンに設定
3. **カスタマイズ**: 必要に応じてプロンプトを調整して再生成

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**AI生成の美しいアイコンで、Stream Deckを更に魅力的に！** ✨
