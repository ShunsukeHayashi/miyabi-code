---
title: "Miyabi Orchestra - 3-Step Quick Start"
created: 2025-11-17
updated: 2025-11-17
author: "Miyabi Team"
category: "guides"
tags: ["miyabi", "quick-start", "tmux", "orchestra", "guide", "beginner"]
status: "published"
related:
  - "[[TMUX_QUICKSTART]]"
  - "[[YOUR_CURRENT_SETUP]]"
  - "[[CLAUDE_CODE_COMMANDS]]"
  - "[[ORCHESTRA_ARCHITECTURE]]"
---

# Miyabi Orchestra - 3ステップクイックスタート

**たった3ステップで21のエージェントを動かす**

---

## 📋 前提条件

- ✅ tmux 2.6以上インストール済み
- ✅ Claude Code インストール済み
- ✅ Miyabiプロジェクトクローン済み（`/Users/shunsuke/Dev/miyabi-private`）

---

## 📖 Miyabi Entity-Relation Model

このドキュメントで扱うEntity:
- **E3 (Agent)**: 自律実行Agent（カエデ、サクラ、ツバキ、ボタン）
- **E7 (Command)**: Claude Codeコマンド（`tmux send-keys`経由で実行）
- **E12 (Worktree)**: Git Worktree（並列実行環境）

主要Relationship:
- **R15**: Command invoked-by Agent（コマンドがAgentを起動）
- **R8**: Task runs-in Worktree（タスクがWorktree内で実行）

詳細: [[miyabi-definition|Miyabi Definition (14 Entities, 39 Relations)]]

---

## 🚀 最速スタート（3分）

### Step 1: スクリプト実行

```bash
cd /Users/shunsuke/Dev/miyabi-private
./scripts/miyabi-orchestra-interactive.sh
```

### Step 2: メニューで選択

```
選択してください [1/2/3/q]: 1  ← 初めての方は「1」
```

### Step 3: Agentを起動

```
選択 [y/n]: y  ← 「y」で自動起動
選択 [1/2]: 1  ← 安全モード推奨
```

**完了！** 🎉

---

## 📋 画面イメージ

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🎭  Miyabi Parallel Orchestra  🎭                  ║
║                                                              ║
║         21のエージェントが奏でる雅なる並列実行                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1/3: 環境チェック

  ✓ tmux session detected
  ✓ Claude Code available
  ✓ Kamui tmux detected (prefix: Ctrl-a)

  すべてのチェックに合格しました！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 2/3: Ensembleタイプを選択

  1) Coding Ensemble (推奨 - 初心者向け)
     → Conductor + 4 Coding Agents
     → 用途: Issue実装・バグ修正・リファクタリング
     → エージェント: カエデ・サクラ・ツバキ・ボタン

  2) Hybrid Ensemble (上級者向け)
     → Conductor + 3 Coding + 3 Business Agents
     → 用途: 技術実装 + ビジネス戦略同時展開
     → エージェント: Coding 3名 + Business 3名

  3) Quick Demo (3分でお試し)
     → 最小構成で動作確認
     → Conductor + 1 Agent のみ

  q) 終了

選択してください [1/2/3/q]: _
```

---

## 🎯 次のステップ

### 基本操作を学ぶ
- [[TMUX_QUICKSTART|tmux 5分ガイド]] - tmux基本操作
- [[CLAUDE_CODE_COMMANDS|コマンドリファレンス]] - よく使うコマンド集

### 詳細を理解する
- [[ORCHESTRA_ARCHITECTURE|Orchestra Architecture]] - システムアーキテクチャ
- [[Agent-System-Overview|Agent System]] - 21 Agents詳細

### 実践する
- [[YOUR_CURRENT_SETUP|あなた専用セットアップ]] - 環境に合わせたガイド
- [[MIYABI_PARALLEL_ORCHESTRA|並列実行の哲学]] - Orchestraコンセプト

---

## 🔍 トラブルシューティング

### エラー: "tmux session not found"
```bash
# 新しいsessionを作成
tmux new -s miyabi
```

### エラー: "Claude Code not found"
```bash
# Claude Codeインストール確認
which claude
```

### エラー: "Worktree creation failed"
```bash
# Worktreeクリーンアップ
miyabi cleanup --worktrees
```

---

## 📚 関連ドキュメント

### Guides
- [[TMUX_QUICKSTART|tmux Quick Start]]
- [[YOUR_CURRENT_SETUP|Your Setup Guide]]
- [[MIYABI_LARK_INTEGRATION_GUIDE|Lark Integration]]

### Architecture
- [[ORCHESTRA_ARCHITECTURE|Orchestra Architecture]]
- [[2025-11-17-architecture-pixel-maestro-usability-design|Pixel Maestro Design]]

### Context
- [[core-rules|Core Rules (P0)]]
- [[agents|Agents Context]]

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Category**: Quick Start Guide
**Difficulty**: Beginner

🌸 **Miyabi Orchestra - Start your journey!** 🌸

---

## 📚 Related Documents

- [[TMUX_QUICKSTART]]
- [[CLAUDE_CODE_COMMANDS]]
- [[YOUR_CURRENT_SETUP]]
- [[miyabi-definition]]
- [[core-rules]]
- [[agents]]
