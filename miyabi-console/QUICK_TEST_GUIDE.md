# 🚀 Miyabi Adaptive UI - クイックテストガイド

**所要時間**: 3分
**前提条件**: ✅ すべて完了（サーバー起動中、APIキー設定済み）

---

## 📋 テスト手順

### Step 1: ブラウザを開く

```bash
# macOS
open http://localhost:5173

# または手動でブラウザに入力
http://localhost:5173
```

### Step 2: Dashboard ページを確認

- **自動的にDashboardページが表示されます**（トップページがDashboard）
- 静的なUIが表示されているはずです：
  - Quick Stats Grid (4つのカード)
  - System Resources
  - Activity Feed
  - Quick Actions

### Step 3: Adaptive UI トグルを探す

**場所**: 画面右上

- **"✨ Adaptive UI"** というラベルの紫色のカード
- その中にトグルスイッチがあります
- デフォルトは **OFF** (灰色)

### Step 4: トグルを ON にする

1. トグルスイッチをクリック
2. **即座にローディングアニメーションが始まります**

### Step 5: ローディングステージを観察

画面全体がグラデーション背景に切り替わり、4段階のローディングが表示されます：

#### Stage 1: 📊 Collecting System Data (1-2秒)
- バックグラウンドでAPIリクエストが実行されます
- `/api/v1/agents` - エージェント情報
- `/api/v1/infrastructure/status` - インフラ状態
- `/api/v1/infrastructure/database` - データベース情報

#### Stage 2: 🧠 AI Analysis in Progress (1-2秒)
- Gemini 3 がデータを分析
- UI戦略を決定

#### Stage 3: ✨ Generating Adaptive UI (2-4秒)
- Reactコンポーネントコードを生成
- Tailwind CSSスタイリング適用
- インタラクティブ要素の実装

#### Stage 4: 🎨 Finalizing Experience (0.5秒)
- react-liveでコードを実行
- 最終レンダリング

**合計**: 約 5-8秒

### Step 6: 生成されたUIを確認

ローディング完了後、**AI生成された動的ダッシュボード**が表示されます。

**期待される要素**:
- システムデータを視覚化したカード/グラフ
- エージェント状態の表示
- インフラメトリクス
- アニメーション効果（Framer Motion）
- レスポンシブレイアウト

---

## 🔍 確認ポイント

### ✅ 成功の兆候

1. **ローディングアニメーション**
   - [ ] 4段階が順番に表示される
   - [ ] パーティクルエフェクト背景が動く
   - [ ] プログレスバーが進む

2. **生成されたUI**
   - [ ] ページが真っ白にならない
   - [ ] データが表示される
   - [ ] スムーズなアニメーション
   - [ ] レスポンシブ（ウィンドウサイズ変更で適応）

3. **ブラウザコンソール**
   - [ ] エラーがない（F12で確認）
   - [ ] `[Orchestrator]` ログが表示される
   - [ ] `[DynamicRenderer]` ログが表示される

### ❌ エラーの兆候

1. **真っ白な画面** → コード生成エラー
2. **"UI Generation Error"** → Gemini APIエラー
3. **404エラー** → バックエンドAPIが停止

---

## 🐛 トラブルシューティング

### エラー: "VITE_GEMINI_API_KEY environment variable is not set"

```bash
# .env ファイルを確認
cat /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console/.env

# APIキーが正しく設定されているか確認
# 開発サーバーを再起動
kill $(cat /tmp/miyabi-console-dev.pid)
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console
npm run dev > /tmp/miyabi-console-dev.log 2>&1 &
echo $! > /tmp/miyabi-console-dev.pid
```

### エラー: "Failed to fetch agents"

```bash
# バックエンドAPIが起動しているか確認
curl http://localhost:4000/api/v1/agents

# 起動していなければ再起動（SETUP_COMPLETE.md参照）
```

### エラー: UI生成後に真っ白

```bash
# ブラウザコンソール（F12）を開いて確認
# LiveError メッセージを確認
# 生成されたコードにエラーがある可能性

# 対処: トグルをOFFにして再度ONにする（リトライ）
```

---

## 📸 スクリーンショットポイント

テスト中に以下のタイミングでスクリーンショットを撮ると良いです：

1. **静的UI（トグルOFF）**
2. **ローディング Stage 1** （データ収集中）
3. **ローディング Stage 3** （UI生成中）
4. **完成した動的UI**

```bash
# macOS スクリーンショット
# Cmd + Shift + 4 → スペース → ウィンドウをクリック
```

---

## 🎨 動作例

### 期待されるユーザー体験

```
1. ユーザーがDashboardページを開く
   ↓
2. 通常の静的UIが表示される
   ↓
3. 「✨ Adaptive UI」トグルが目に入る
   ↓
4. 興味を持ってクリック
   ↓
5. 画面が切り替わり、美しいローディングアニメーション
   - グラデーション背景
   - パーティクルエフェクト
   - 段階的プログレス
   ↓
6. 5-8秒後、インパクトのある動的UIが表示
   - データに基づいた最適レイアウト
   - スムーズなアニメーション
   - 完全にインタラクティブ
   ↓
7. "Wow!" 体験
```

---

## 🔄 再テスト

異なるプロンプトでテストする場合：

1. `src/components/dynamic-ui/DynamicUIOrchestrator.tsx` を編集
2. `prompt` プロパティを変更
3. ページをリロード（Cmd+R）
4. トグルをONにして再生成

---

## 📊 ログ確認

詳細なログを確認する場合：

```bash
# フロントエンドログ
tail -f /tmp/miyabi-console-dev.log

# バックエンドログ
tail -f /tmp/miyabi-web-api.log

# ブラウザコンソール（F12 → Console）
# フィルター: "Orchestrator" "Gemini" "DynamicRenderer"
```

---

**テストを楽しんでください！** 🚀

何か問題があれば、ブラウザコンソールとログを確認してください。

---

**Last Updated**: 2025-11-19
**Version**: 1.0.0
