# BDR Hunter - Claude.ai Integration Guide

**Version**: 1.0.0
**Last Updated**: 2025-12-03

---

## 🎯 概要

このガイドは、Claude.ai環境からBDR Hunter Appを開発する際のベストプラクティスを提供します。

---

## 📂 利用可能なスキル

### 1. Orchestra Management
**パス**: `.claude/Skills/orchestra-management/SKILL.md`

Claude.ai ↔ Orchestra Agent 連携のガイド:
- 環境判定方法
- Pane構成 (CodeGen, Review, Issue, PR, Deploy, Refresh)
- タスク送信パターン
- エラーハンドリング

### 2. tmux A2A Communication
**パス**: `.claude/Skills/tmux-a2a-communication/SKILL.md`

Agent間メッセージングのガイド:
- 通信アーキテクチャ
- メッセージフォーマット (TASK/GIT/REVIEW/FEEDBACK)
- Pane役割マッピング
- 使用例

---

## 🔧 セットアップスクリプト

### GitHub認証セットアップ
```bash
bash .claude/scripts/setup-github-auth.sh
```

### 環境検出
```bash
bash .claude/scripts/detect-environment.sh
```

---

## 🔄 Claude.ai環境でのワークフロー

### ファイル操作
```
読み込み: Miyabi:read_file
書き込み: Miyabi:write_file
一覧: Miyabi:list_files
```

### ビルド/Git操作
```
1. Orchestra Agentにタスク送信
2. Miyabi:tmux_send_keys でメッセージ送信
3. 結果をMiyabi:obsidian_create_noteで記録
```

### フィードバック記録
```
Miyabi:obsidian_create_note({
  title: "YYYY-MM-DD-task-name",
  folder: "retrospectives",
  content: "...",
  tags: ["retrospective", "bdr-hunter"]
})
```

---

## ⚠️ 既知の制限

| 制限 | 対処法 |
|------|--------|
| ローカルパス直接アクセス不可 | MCP経由 or Orchestra経由 |
| bash_toolが隔離環境で実行 | Orchestra Agentにタスク委譲 |
| GitHub認証エラー | setup-github-auth.sh実行 |
| tmux接続エラー | MacBook/MUGENで確認 |

---

## 📋 クイックリファレンス

### MCP Tools
- `Miyabi:read_file` - ファイル読み込み
- `Miyabi:write_file` - ファイル書き込み
- `Miyabi:list_files` - ファイル一覧
- `Miyabi:git_status` - Git状態確認
- `Miyabi:obsidian_create_note` - Obsidian記録
- `Miyabi:tmux_send_keys` - Orchestra通信

### Orchestra Panes
- %18: CodeGen Agent
- %19: Review Agent
- %20: Issue Agent
- %21: PR Agent
- %22: Deploy Agent
- %23: Refresher Agent

---

#claude-ai #bdr-hunter #miyabi #guide
