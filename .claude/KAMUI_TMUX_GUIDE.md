# Miyabi × Kamui tmux Integration Guide

**⚠️ 注意**: このドキュメントは Kamui 特有の tmux 設定に関する参考情報です。最新の運用ガイドは以下を参照してください:
- **推奨**: [ORCHESTRA_COMPLETE_GUIDE.md](./ORCHESTRA_COMPLETE_GUIDE.md) - 標準化された運用手順
- **tmux基礎**: [../docs/TMUX_QUICKSTART.md](../docs/TMUX_QUICKSTART.md) - 5分入門

**Kamui tmux設定でMiyabiエージェント軍を動かす完全ガイド**
**Last Updated**: 2025-10-15 (Kamui特有の設定情報)

---

## 🎯 あなたの環境

```
✅ tmux設定: Kamui (/Users/shunsuke/Dev/kamui/.tmux.conf)
✅ Prefix Key: Ctrl-a (デフォルトのCtrl-bではない)
✅ Mouse: 有効
✅ Base Index: 1 (paneは1から開始)
✅ Status Bar: top
```

**重要**: 以下のドキュメントで `Ctrl-b` と記載されている箇所は、すべて **`Ctrl-a`** に読み替えてください。

---

## ⚡ Quick Start（Kamui版）

### Step 1: 現在のtmuxセッション確認

```bash
# 既にtmuxセッション内にいる場合
echo $TMUX  # 値が表示されればtmux内

# セッション情報確認
tmux display-message -p "Session: #S | Window: #I | Pane: #P"
```

### Step 2: スクリプト実行

```bash
cd /Users/shunsuke/Dev/miyabi-private

# 5-pane構成（Main + 4 Workers）
./scripts/miyabi-orchestra.sh coding-ensemble

# または 7-pane構成（Main + 6 Workers）
./scripts/miyabi-orchestra.sh hybrid-ensemble

# レガシー名も使用可能
# ./scripts/miyabi-orchestra.sh 5pane
# ./scripts/miyabi-orchestra.sh 7pane
```

スクリプトがKamui設定を自動検出して、適切なメッセージを表示します：

```
ℹ️  Detected Kamui tmux configuration (prefix: Ctrl-a)
💡 Tip: Press Ctrl-a + Space to cycle through layouts
💡 Tip: Press Ctrl-a + q to show pane numbers
💡 Tip: Press Ctrl-a + arrow keys to navigate panes
```

### Step 3: pane操作（Kamui版）

| 操作 | Kamuiコマンド | 説明 |
|------|--------------|------|
| **pane移動** | `Ctrl-a + 矢印キー` | pane間を移動 |
| **pane番号表示** | `Ctrl-a + q` | 各paneの番号を表示（1から開始） |
| **レイアウト変更** | `Ctrl-a + Space` | プリセットレイアウト切替 |
| **paneフルスクリーン** | `Ctrl-a + z` | 現在のpaneをフルスクリーン/解除 |
| **pane分割（水平）** | `Ctrl-a + "` | 水平にpane分割 |
| **pane分割（垂直）** | `Ctrl-a + %` | 垂直にpane分割 |
| **pane削除** | `Ctrl-a + x` | 現在のpaneを削除 |
| **マウス選択** | クリック | マウスでpane選択（有効） |

---

## 🚀 実践例（Kamui環境）

### 例1: 5-pane構成でIssue並列処理

```bash
# Step 1: レイアウト作成
./scripts/miyabi-orchestra.sh coding-ensemble
# 質問に "y" を2回入力

# Step 2: pane番号確認（Ctrl-a + q でも確認可能）
tmux list-panes -F "#{pane_index}: #{pane_id}"

# 出力例（Kamui設定ではindexは1から）:
# 0: %22  ← Main (現在のpane)
# 1: %27  ← Worker 1
# 2: %28  ← Worker 2
# 3: %25  ← Worker 3
# 4: %29  ← Worker 4

# Step 3: タスク割り当て（Main pane 0 から実行）
# ⚠️ 実際のpane IDに置き換えてください

# Worker 1: Issue #270
tmux send-keys -t %27 "\
cd /Users/shunsuke/Dev/miyabi-private && \
あなたはWorker1です。Issue #270を処理してください。\
agent-executionスキルを使用してください。\
完了後は tmux send-keys -t %22 '[Worker1] Issue #270完了' && sleep 0.1 && tmux send-keys -t %22 Enter で報告してください。" Enter

# Worker 2: Issue #271
tmux send-keys -t %28 "\
cd /Users/shunsuke/Dev/miyabi-private && \
あなたはWorker2です。Issue #271を処理してください。\
agent-executionスキルを使用してください。\
完了後は tmux send-keys -t %22 '[Worker2] Issue #271完了' && sleep 0.1 && tmux send-keys -t %22 Enter で報告してください。" Enter

# Worker 3: ビルド・テスト
tmux send-keys -t %25 "\
cd /Users/shunsuke/Dev/miyabi-private && \
あなたはWorker3です。rust-developmentスキルでcargo build && cargo testを実行してください。\
完了後は tmux send-keys -t %22 '[Worker3] Build & Test完了' && sleep 0.1 && tmux send-keys -t %22 Enter で報告してください。" Enter

# Step 4: 監視
# Ctrl-a + 矢印キー で各paneを確認
# または
tmux capture-pane -t %27 -p | tail -10
```

---

## 🎨 Kamuiカスタマイズとの共存

### Kamui設定を保持したまま使用

Miyabi tmuxスクリプトはKamui設定を上書きしません。以下の機能はそのまま使えます：

✅ **Kamuiのカスタムステータスバー** - そのまま表示
✅ **Kamuiのキーバインド** - すべて有効
✅ **Kamuiのカラースキーム** - 維持
✅ **マウスサポート** - 有効

### レイアウト保存（Kamui版）

```bash
# 現在のレイアウトを取得
tmux list-windows -F "#{window_layout}"

# Kamui設定に追加（オプション）
# ~/.config/kamui/layouts.conf などに保存
```

---

## 🔧 トラブルシューティング（Kamui環境）

### 問題1: paneが作成されない

**原因**: 既にtmuxセッション内にいる

**解決策**:
```bash
# そのまま実行可能（ネストは不要）
./scripts/miyabi-orchestra.sh coding-ensemble
```

### 問題2: Ctrl-bで反応しない

**原因**: Kamui設定では `Ctrl-a` がprefix

**解決策**:
- すべての `Ctrl-b` を `Ctrl-a` に読み替える
- または、tmux操作は避けてコマンドラインから `tmux send-keys` を使用

### 問題3: pane番号がドキュメントと異なる

**原因**: Kamui設定では `base-index 1`

**解決策**:
```bash
# 実際のpane IDを確認
tmux list-panes -F "#{pane_index}: #{pane_id}"

# 表示されたpane IDを使用
```

---

## 📊 Kamui環境での推奨構成

### 推奨1: 5-pane Coding Pipeline

```
┌─────────────────────────────────────────────────────────┐
│ 🎭 Miyabi  Session: miyabi-work                         │ ← Miyabiステータスバー
├─────────────────────────────────────────────────────────┤
│ Pane 0 (Main) - Coordinator                             │
│ $ tmux list-panes -F "#{pane_index}: #{pane_id}"        │
│ [Worker1] Issue #270完了                                │
├────────────────────────┬────────────────────────────────┤
│ Pane 1: Worker1        │ Pane 2: Worker2                │
│ CodeGenAgent           │ ReviewAgent                    │
├────────────────────────┼────────────────────────────────┤
│ Pane 3: Worker3        │ Pane 4: Worker4                │
│ PRAgent                │ DeploymentAgent                │
└────────────────────────┴────────────────────────────────┘
```

### 推奨2: 7-pane Hybrid (Coding + Business)

```
┌─────────────────────────────────────────────────────────┐
│ 🎭 Miyabi  Session: miyabi-hybrid                       │
├─────────────────────────────────────────────────────────┤
│ Pane 0 (Main)                                           │
├───────────┬───────────┬───────────┬────────────────────┤
│ Pane 1    │ Pane 2    │ Pane 3    │ Pane 4             │
│ CodeGen   │ Review    │ PR        │ MarketResearch     │
├───────────┴───────────┴───────────┼────────────────────┤
│ Pane 5: Content       │ Pane 6: Analytics              │
└───────────────────────┴────────────────────────────────┘
```

---

## 💡 Kamui環境でのベストプラクティス

### 1. セッション管理

```bash
# 作業用セッションを分ける
tmux new-session -s miyabi-agents -d
tmux send-keys -t miyabi-agents "cd /Users/shunsuke/Dev/miyabi-private" Enter
tmux send-keys -t miyabi-agents "./scripts/miyabi-orchestra.sh coding-ensemble" Enter

# セッション一覧
tmux list-sessions

# セッション切り替え（Ctrl-a + s でも可能）
tmux switch-client -t miyabi-agents
```

### 2. ウィンドウ管理

```bash
# 新しいウィンドウで並列作業
tmux new-window -n "Coding-Team"     # Ctrl-a + c でも可
tmux new-window -n "Business-Team"

# ウィンドウ切り替え（Ctrl-a + 数字キー）
# Ctrl-a + 1 → Window 1
# Ctrl-a + 2 → Window 2
```

### 3. マウス活用

Kamui設定ではマウスが有効なので：

```bash
# マウスでpane選択 → クリック
# マウスでpaneリサイズ → 境界をドラッグ
# マウスでスクロール → スクロールホイール
```

---

## 🎯 Kamui × Miyabiハイブリッドワークフロー

### パターン1: Window分離戦略

```bash
# Window 1: Miyabi CLI実行
tmux new-window -n "Miyabi-CLI"
miyabi parallel --issues 270,271,272 --concurrency 3

# Window 2: tmux並列実行（Coding Agents）
tmux new-window -n "Coding-Agents"
./scripts/miyabi-orchestra.sh coding-ensemble

# Window 3: tmux並列実行（Business Agents）
tmux new-window -n "Business-Agents"
./scripts/miyabi-orchestra.sh hybrid-ensemble

# ウィンドウ切り替え: Ctrl-a + n (next) / Ctrl-a + p (previous)
```

### パターン2: セッション分離戦略

```bash
# セッション1: 開発作業
tmux new-session -s dev
# 通常の開発作業

# セッション2: Miyabiエージェント軍
tmux new-session -s miyabi-agents
./scripts/miyabi-orchestra.sh hybrid-ensemble

# セッション切り替え: Ctrl-a + ( / Ctrl-a + )
# または: Ctrl-a + s でセッション一覧表示
```

---

## 📚 関連ドキュメント

### Miyabi tmux関連

- **詳細ガイド**: [.claude/TMUX_OPERATIONS.md](../TMUX_OPERATIONS.md)
- **クイックスタート**: [docs/TMUX_QUICKSTART.md](../docs/TMUX_QUICKSTART.md)
- **レイアウト**: [docs/TMUX_LAYOUTS.md](../docs/TMUX_LAYOUTS.md)

### Kamui関連

- **Kamui設定**: `/Users/shunsuke/Dev/kamui/.tmux.conf`
- **Kamuiドキュメント**: Kamuiプロジェクト参照

---

## 🔗 クイックリファレンス（Kamui版）

### キーバインド

| 操作 | Kamui (Ctrl-a) | 標準tmux (Ctrl-b) |
|------|----------------|------------------|
| Prefix | `Ctrl-a` | `Ctrl-b` |
| pane移動 | `Ctrl-a + 矢印` | `Ctrl-b + 矢印` |
| pane番号 | `Ctrl-a + q` | `Ctrl-b + q` |
| レイアウト | `Ctrl-a + Space` | `Ctrl-b + Space` |
| 新規Window | `Ctrl-a + c` | `Ctrl-b + c` |
| Window切替 | `Ctrl-a + 数字` | `Ctrl-b + 数字` |
| デタッチ | `Ctrl-a + d` | `Ctrl-b + d` |

### コマンド

```bash
# pane操作
tmux list-panes -F "#{pane_index}: #{pane_id}"
tmux send-keys -t <pane_id> "command" Enter
tmux capture-pane -t <pane_id> -p | tail -10

# レイアウト
tmux select-layout tiled
tmux select-layout even-horizontal
tmux select-layout even-vertical

# セッション/ウィンドウ
tmux list-sessions
tmux list-windows
tmux new-window -n "name"
```

---

## 🎉 まとめ

Kamui tmux設定とMiyabi並列実行は完全に互換性があります：

✅ **Kamuiの美しいステータスバー** を保持
✅ **Ctrl-a prefix** で快適操作
✅ **マウスサポート** でGUI的操作
✅ **21種類のエージェント** を自由に組み合わせ

**今すぐ試す**:
```bash
cd /Users/shunsuke/Dev/miyabi-private
./scripts/miyabi-orchestra.sh coding-ensemble
```

---

**Kamui × Miyabi で最強の開発環境を！⚡🤖**
