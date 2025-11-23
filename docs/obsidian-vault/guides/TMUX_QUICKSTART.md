---
title: "Miyabi tmux Quick Start"
created: 2025-11-18
updated: 2025-11-18
author: "Miyabi Team"
category: "guides"
tags: ['agents', 'ai', 'autonomous', 'claude-code', 'guide', 'guides', 'miyabi', 'multiplexer', 'quick-start', 'terminal', 'tmux']
status: "published"
---

# Miyabi tmux Quick Start

**5分でMiyabiエージェント軍をtmuxで動かす**

---

## 📖 目次

1. [前提条件](#前提条件)
2. [Quick Start（最速）](#quick-start最速)
3. [実践例](#実践例)
4. [便利なtmuxコマンド](#便利なtmuxコマンド)
5. [比較: tmux vs Miyabi CLI](#比較-tmux-vs-miyabi-cli)
6. [学習パス](#学習パス)
7. [FAQ](#faq)
8. [関連リソース](#関連リソース)

---

## 📌 前提条件

- ✅ tmux インストール済み
- ✅ Claude Code インストール済み
- ✅ Miyabi プロジェクトをクローン済み

---

## 📖 Miyabi Entity-Relation Model

このドキュメントで扱うEntity:
- **E3 (Agent)**: 自律実行Agent（CodeGen, Review, PR, Deployment）
- **E2 (Task)**: Issueから分解されたタスク
- **E12 (Worktree)**: Git Worktree（並列実行環境）

主要Relationship:
- **R9**: Agent executes Task（AgentがTaskを実行）
- **R8**: Task runs-in Worktree（タスクがWorktree内で実行）

詳細: [ENTITY_RELATION_MODEL.md](../docs/architecture/ENTITY_RELATION_MODEL.md)

### 💡 用語の使い分け

- **Agent**: Miyabiの自律実行エージェント（E3）- CodeGen, Review, PR, Deploymentなど
- **Worker**: tmux pane内で動作するClaude Codeインスタンス
- **関係**: 1つのWorkerが1つのAgentを実行します

**このドキュメントでは**、Claude Codeインスタンスを「Worker」、その内部で動作するMiyabi Agentを「Agent」と表記します。

---

## 🚀 Quick Start（最速）

### Step 1: tmux起動

```bash
tmux
```

### Step 2: 自動セットアップスクリプト実行

```bash
cd /Users/shunsuke/Dev/miyabi-private
./scripts/tmux-demo.sh 5pane
```

対話的にセットアップが完了します：

```
╔════════════════════════════════════════════════════════════════╗
║          Miyabi tmux Demo - Claude Code Company Setup         ║
╚════════════════════════════════════════════════════════════════╝

📐 Creating 5-pane layout (Main + 4 Coding Agents)

✅ Layout created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Pane Layout:

  0: %22 (80x24)   ← Main (You are here)
  1: %27 (40x12)   ← Worker 1
  2: %28 (40x12)   ← Worker 2
  3: %25 (40x12)   ← Worker 3
  4: %29 (40x12)   ← Worker 4

Would you like to start Claude Code in all panes? (y/n)
```

### Step 3: タスク割り当て

Main pane（pane 0）から、各paneにタスクを割り当てます：

```bash
# 実際のpane IDは tmux list-panes -F "#{pane_index}: #{pane_id}" で確認してください

# Worker 1: Issue #270を処理
tmux send-keys -t %27 "あなたはWorker 1です。Issue #270をagent-executionスキルで処理してください。完了後は[Worker1]でメインに報告してください。" Enter

# Worker 2: Issue #271を処理
tmux send-keys -t %28 "あなたはWorker 2です。Issue #271をagent-executionスキルで処理してください。完了後は[Worker2]で報告してください。" Enter

# Worker 3: ビルド・テスト
tmux send-keys -t %25 "あなたはWorker 3です。rust-developmentスキルでcargo build && cargo testを実行してください。完了後は[Worker3]で報告してください。" Enter

# Worker 4: セキュリティスキャン
tmux send-keys -t %29 "あなたはWorker 4です。security-auditスキルでセキュリティスキャンを実行してください。完了後は[Worker4]で報告してください。" Enter
```

### Step 4: 監視

各paneの状況を確認：

```bash
# Ctrl-b + q でpane番号表示
# Ctrl-b + 矢印キー でpane移動

# または、コマンドで確認
tmux capture-pane -t %27 -p | tail -10
```

---

## 🎯 実践例

### 例1: 3つのIssueを並列処理

**シナリオ**: Issue #270, #271, #272を3つのWorkerで並列処理

```bash
# Step 1: tmux起動 + レイアウト作成
tmux
./scripts/tmux-demo.sh 5pane  # y を2回入力

# Step 2: pane ID確認
tmux list-panes -F "#{pane_index}: #{pane_id}"
# 出力例:
# 0: %22  ← Main
# 1: %27  ← Worker 1
# 2: %28  ← Worker 2
# 3: %25  ← Worker 3
# 4: %29  ← Worker 4

# Step 3: タスク割り当て（Main paneで実行）
tmux send-keys -t %27 "\
cd /Users/shunsuke/Dev/miyabi-private && \
あなたはWorker 1（pane1）です。Issue #270を処理してください。\
agent-executionスキルを使用してください。\
完了後はtmux send-keys -t %22 '[Worker1] Issue #270完了' && sleep 0.1 && tmux send-keys -t %22 Enterで報告してください。" Enter &

tmux send-keys -t %28 "\
cd /Users/shunsuke/Dev/miyabi-private && \
あなたはWorker 2（pane2）です。Issue #271を処理してください。\
agent-executionスキルを使用してください。\
完了後はtmux send-keys -t %22 '[Worker2] Issue #271完了' && sleep 0.1 && tmux send-keys -t %22 Enterで報告してください。" Enter &

tmux send-keys -t %25 "\
cd /Users/shunsuke/Dev/miyabi-private && \
あなたはWorker 3（pane3）です。Issue #272を処理してください。\
agent-executionスキルを使用してください。\
完了後はtmux send-keys -t %22 '[Worker3] Issue #272完了' && sleep 0.1 && tmux send-keys -t %22 Enterで報告してください。" Enter &

wait

# Step 4: 報告を待つ（Main paneで）
# Workerからの報告がMain paneに表示されます：
# [Worker1] Issue #270完了
# [Worker2] Issue #271完了
# [Worker3] Issue #272完了
```

### 例2: Coding + Business Agents並列実行

**シナリオ**: コード実装と市場調査を同時進行

```bash
# Step 1: 7-pane レイアウト作成
./scripts/tmux-demo.sh 7pane

# Step 2: タスク割り当て
# Worker 1-3: Coding Agents
tmux send-keys -t %27 "あなたはCodeGenAgentです。Issue #270のコード実装。agent-executionスキル使用。完了後は[CodeGen]で報告。" Enter

tmux send-keys -t %28 "あなたはReviewAgentです。Worker1完了後にコードレビュー実施。完了後は[Review]で報告。" Enter

tmux send-keys -t %25 "あなたはPRAgentです。Worker2完了後にPR作成。完了後は[PR]で報告。" Enter

# Worker 4-6: Business Agents
tmux send-keys -t %29 "あなたはMarketResearchAgentです。Issue #300の市場調査。business-strategy-planningスキル使用。完了後は[MarketResearch]で報告。" Enter

tmux send-keys -t %30 "あなたはContentCreationAgentです。Issue #301のコンテンツ制作。content-marketing-strategyスキル使用。完了後は[Content]で報告。" Enter

tmux send-keys -t %31 "あなたはAnalyticsAgentです。現在のプロジェクト状況分析。growth-analytics-dashboardスキル使用。完了後は[Analytics]で報告。" Enter
```

---

## 🛠️ 便利なtmuxコマンド

### 基本操作

```bash
# pane移動
Ctrl-b + 矢印キー

# pane番号表示
Ctrl-b + q

# レイアウト変更
Ctrl-b + Space

# paneフルスクリーン切替
Ctrl-b + z

# pane分割（水平）
Ctrl-b + "

# pane分割（垂直）
Ctrl-b + %

# pane削除
Ctrl-b + x
```

### 監視・デバッグ

```bash
# 全pane状況確認
for pane in %27 %28 %25 %29; do
    echo "=== Pane $pane ==="
    tmux capture-pane -t $pane -p | tail -5
    echo ""
done

# 特定paneの出力をファイルに保存
tmux capture-pane -t %27 -p > /tmp/pane27.log

# paneにコマンド送信（Enterなし）
tmux send-keys -t %27 "ls -la"

# paneにEnter送信
tmux send-keys -t %27 Enter
```

### トークン管理

```bash
# 全pane一括/clear
for pane in %27 %28 %25 %29; do
    tmux send-keys -t $pane "/clear" Enter
    sleep 0.5
done

# 特定paneのみ/clear
tmux send-keys -t %27 "/clear" Enter
```

---

## 📊 比較: tmux vs Miyabi CLI

### Miyabi CLIアプローチ（推奨 - 定型処理）

```bash
# シンプル・安定・自動化
miyabi parallel --issues 270,271,272 --concurrency 3
```

**メリット**:
- ✅ セットアップ不要
- ✅ Worktree自動管理
- ✅ 報告自動化
- ✅ トークン管理自動化

**デメリット**:
- ❌ CoordinatorAgentのみ
- ❌ 柔軟性が低い

### tmuxアプローチ（推奨 - 柔軟性重視）

```bash
# 複雑だが柔軟・実験的
./scripts/tmux-demo.sh 7pane
# 手動でタスク割り当て
```

**メリット**:
- ✅ 全21エージェント使用可
- ✅ リアルタイム調整可能
- ✅ 異種エージェント同時実行
- ✅ 実験的ワークフロー

**デメリット**:
- ❌ セットアップ複雑
- ❌ 手動管理が必要
- ❌ 学習コスト高い

### ハイブリッドアプローチ（最強）

```bash
# Main: Miyabi CLIで定型処理
miyabi parallel --issues 270,271,272 --concurrency 3

# 別途tmux paneでビジネス系Agentを並列実行
# → MarketResearch, Content, SNS戦略など
```

---

## 🎓 学習パス

### Level 1: 基礎（5分）

1. ✅ tmux起動
2. ✅ `./scripts/tmux-demo.sh 5pane` 実行
3. ✅ 1つのWorkerにタスク送信
4. ✅ 結果確認

### Level 2: 実践（15分）

1. ✅ 3つのIssueを並列処理
2. ✅ 報連相プロトコル実践
3. ✅ /clear実行
4. ✅ pane監視

### Level 3: 応用（30分）

1. ✅ 7-pane構成作成
2. ✅ Coding + Business Agents同時実行
3. ✅ エラーハンドリング
4. ✅ カスタムワークフロー構築

### Level 4: マスター（1時間+）

1. ✅ 独自tmuxレイアウト作成
2. ✅ スクリプト自動化
3. ✅ 複雑な依存関係管理
4. ✅ パフォーマンスチューニング

---

## 🔗 関連リソース

- **詳細ガイド**: [.claude/TMUX_OPERATIONS.md](../.claude/TMUX_OPERATIONS.md)
- **Agent仕様**: [.claude/context/agents.md](../.claude/context/agents.md)
- **Worktreeガイド**: [.claude/context/worktree.md](../.claude/context/worktree.md)
- **元記事**: [Claude Codeを並列組織化してClaude Code "Company"にするtmuxコマンド集](https://zenn.dev/kazuph/articles/claude-code-tmux-parallel)

---

## ❓ FAQ

**Q: tmuxなしでも並列実行できますか？**
A: はい。`miyabi parallel --issues 270,271,272 --concurrency 3` で可能です。

**Q: 何個のpaneまで作れますか？**
A: 理論上無制限ですが、トークン消費を考えると5-7 paneが現実的です。

**Q: Worktreeは使えますか？**
A: はい。各paneで別のWorktreeに移動してから作業できます。

**Q: エラーで停止した場合は？**
A: `tmux capture-pane -t %XX -p | tail -20` で確認 → `/clear` で再起動。

**Q: トークン消費が激しいです**
A: 定期的に `/clear` を実行してください。または並列度を下げてください。

---

## 🎯 次のステップ

1. ✅ 実際に試してみる: `./scripts/tmux-demo.sh 5pane`
2. 📖 詳細を学ぶ: [.claude/TMUX_OPERATIONS.md](../.claude/TMUX_OPERATIONS.md)
3. 🚀 本格運用: カスタムワークフロー構築

---

**Happy Coding with Miyabi tmux! 🎉**

---

## 📚 Related Documents

- [[QUICK_START_3STEPS]]
- [[YOUR_CURRENT_SETUP]]
- [[TMUX_LAYOUTS]]
- [[CLAUDE_CODE_COMMANDS]]
- [[worktree]]
