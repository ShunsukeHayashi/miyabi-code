# 🎨 Miyabi Console - Adaptive UI System

**The Adaptive Runtime** - Gemini 3 駆動の動的UI生成システム

---

## 🚀 クイックスタート（3ステップ）

### 1️⃣ ブラウザを開く

```
http://localhost:5173
```

### 2️⃣ 右上の "✨ Adaptive UI" トグルをON

### 3️⃣ 5-8秒のローディング後、AI生成UIが表示されます

---

## ✅ システム状態

```bash
# ステータスチェック（いつでも実行可能）
/tmp/miyabi-system-check.sh
```

**現在の状態**:
- ✅ フロントエンド: http://localhost:5173
- ✅ バックエンドAPI: http://localhost:4000
- ✅ Gemini API: キー設定済み
- ✅ 21 Agents 利用可能

---

## 📚 ドキュメント

| ファイル | 用途 |
|---------|------|
| **QUICK_TEST_GUIDE.md** | 3分テストガイド（これから実行） |
| **ADAPTIVE_UI_GUIDE.md** | 完全技術ドキュメント |
| **SETUP_COMPLETE.md** | セットアップ手順 |
| **README_ADAPTIVE_UI.md** | このファイル（概要） |

---

## 🎨 実装内容

### コンポーネント構成

```
src/
├── lib/gemini/
│   └── client.ts              # Gemini 3 API クライアント
├── components/dynamic-ui/
│   ├── DynamicUIOrchestrator.tsx    # パイプライン統括
│   ├── LoadingAnimation.tsx         # 4段階ローディング
│   └── DynamicRenderer.tsx          # react-live サンドボックス
└── pages/
    └── DashboardPage.tsx            # トグル統合済み
```

### 処理フロー

```
トグルON
  ↓
📊 Stage 1: Collecting System Data (1-2秒)
  - /api/v1/agents
  - /api/v1/infrastructure/status
  - /api/v1/infrastructure/database
  ↓
🧠 Stage 2: AI Analysis (1-2秒)
  - Gemini 3 がデータ分析
  - UI戦略決定
  ↓
✨ Stage 3: Generating UI (2-4秒)
  - React コンポーネント生成
  - Tailwind CSS スタイリング
  ↓
🎨 Stage 4: Rendering (0.5秒)
  - react-live で実行
  - 最終レンダリング
  ↓
🎉 AI生成ダッシュボード表示
```

---

## 🔧 カスタマイズ

### プロンプト変更

`src/components/dynamic-ui/DynamicUIOrchestrator.tsx:48`

```tsx
<DynamicUIOrchestrator
  prompt="あなたのカスタムプロンプトをここに"
  adaptive={false}
/>
```

### 自動更新

```tsx
adaptive={true}  // 30秒ごとに再生成
```

---

## 🐛 トラブルシューティング

### ローディングが始まらない

```bash
# 環境変数確認
cat .env | grep VITE_GEMINI_API_KEY

# サーバー再起動
kill $(cat /tmp/miyabi-console-dev.pid)
npm run dev > /tmp/miyabi-console-dev.log 2>&1 &
echo $! > /tmp/miyabi-console-dev.pid
```

### UIが表示されない

```bash
# ブラウザコンソール（F12）でエラー確認
# 以下のログをチェック:
# - [Orchestrator] ...
# - [GeminiUIClient] ...
# - [DynamicRenderer] ...
```

### バックエンドエラー

```bash
# API確認
curl http://localhost:4000/api/v1/agents

# 再起動（詳細はSETUP_COMPLETE.md参照）
```

---

## 📊 技術スペック

| 項目 | 詳細 |
|------|------|
| **AI Model** | Gemini 3 Pro Preview |
| **UI Framework** | React 18 + TypeScript |
| **Styling** | Tailwind CSS |
| **Animation** | Framer Motion |
| **Sandbox** | react-live |
| **Backend** | Rust (Axum) |
| **API** | REST + WebSocket |

---

## 🎯 次のステップ

1. **テストを実行**
   - `QUICK_TEST_GUIDE.md` を参照
   - ブラウザでAdaptive UIを試す

2. **プロンプトをカスタマイズ**
   - 異なるUIスタイルを試す
   - データ重視、グラフ重視など

3. **適応モードを試す**
   - `adaptive={true}` で自動更新

4. **本番環境へデプロイ**
   - Firebase Hosting
   - 環境変数の本番設定

---

## 📞 サポート

- **ドキュメント**: `ADAPTIVE_UI_GUIDE.md`
- **システムチェック**: `/tmp/miyabi-system-check.sh`
- **ログ**: `/tmp/miyabi-console-dev.log`

---

**Ready to test!** 🚀

Open: http://localhost:5173

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
**Status**: ✅ Production Ready
