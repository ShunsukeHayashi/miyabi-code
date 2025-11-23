---
title: Orchestra-Worker通信プロトコル
created: '2025-11-22'
updated: '2025-11-21'
author: Claude Code
category: protocols
tags:
  - miyabi-orchestra
  - tmux
  - communication
  - priority/P0
  - standard
  - mcp
  - hooks
status: active
version: 1.1.0
priority: P0
---
# 🎼 Orchestra-Worker 通信プロトコル v1.1

## 概要

miyabi-orchestraセッションにおけるオーケストレーターとワーカー間の標準通信プロトコル。

## 🔴 P0ルール（絶対遵守）

### 通信モデル: PUSH型（PULL禁止）

```
ORCHESTRATOR ←──自発的に報告─── WORKER
   (待機)                    (完了時に送信)
```

- ❌ オーケストレーターがワーカーを確認しに行くことは禁止
- ❌ `tmux capture-pane` でワーカーをポーリングしない
- ✅ ワーカーが作業完了時に自発的に報告を送信
- ✅ オーケストレーターは報告を待機・集約するだけ

---

## MCPツール群

### 利用可能なMCPツール

| ツール | 用途 | 主要機能 |
|--------|------|----------|
| miyabi-tmux | ペイン間通信 | send_message, broadcast, pane_capture |
| miyabi-rules | ルール検証 | rules_validate, rules_execute |
| miyabi-obsidian | ドキュメント | read_document, create_document |
| miyabi-log-aggregator | ログ監視 | log_get_errors, log_search |
| miyabi-resource-monitor | リソース監視 | resource_overview, resource_cpu |
| miyabi-git-inspector | Git状態 | git_status, git_diff |
| miyabi-github | GitHub連携 | list_issues, create_pr |

---

## フック関数

### インストール
```bash
# ホームディレクトリにリンク作成
ln -sf /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/scripts/miyabi_hooks.sh ~/.miyabi_hooks.sh

# .zshrcに追加
echo 'source ~/.miyabi_hooks.sh' >> ~/.zshrc
```

### 利用可能なフック関数

| 関数 | エイリアス | 用途 |
|------|-----------|------|
| miyabi_task_start | mts | タスク開始報告 |
| miyabi_task_complete | mtc | タスク完了報告 |
| miyabi_progress | mpr | 進捗報告 |
| miyabi_blocked | mbl | ブロック報告 |
| miyabi_session_end_report | mse | セッション終了報告（必須） |
| miyabi_session_start_notify | mss | セッション開始通知 |

### 使用例
```bash
# フック読み込み
source ~/.miyabi_hooks.sh

# タスク開始
mts 'Issue#123実装'

# 進捗報告
mpr '50%' 'テスト作成中'

# タスク完了
mtc 'Issue#123実装' 'PR#456作成済み'

# セッション終了（必須）
mse
```

---

## ペイン構成

| ペインID | 役割 | タイトル |
|----------|------|----------|
| %1 | ORCHESTRATOR | 🎼 ORCHESTRATOR |
| %2 | WORKER-1 | ⚙️ WORKER-1 |
| %3 | WORKER-2 | ⚙️ WORKER-2 |
| %4 | WORKER-3 | ⚙️ WORKER-3 |
| %5 | WORKER-4 | ⚙️ WORKER-4 |

---

## オーケストレーター仕様

### 責務
1. ワーカーへの指示送信
2. ワーカーからの報告受信・集約
3. Guardianへの進捗報告
4. ブロック発生時のエスカレーション

### 指示送信コマンド
```bash
# WORKER-1へ
tmux send-keys -t %2 '指示内容' Enter

# WORKER-2へ
tmux send-keys -t %3 '指示内容' Enter

# WORKER-3へ
tmux send-keys -t %4 '指示内容' Enter

# WORKER-4へ
tmux send-keys -t %5 '指示内容' Enter
```

### 禁止事項
```bash
# ❌ これは禁止（PULL型）
tmux capture-pane -t %2 -p | tail -50  # やらない
tmux capture-pane -t %3 -p | tail -50  # やらない
```

---

## ワーカー仕様

### 責務
1. オーケストレーターからの指示を受領
2. タスク実行
3. 完了時に自発的に報告送信（必須）
4. セッション終了時に終了報告（必須）

### 報告コマンド（必須）
```bash
# フック関数を使用（推奨）
mts 'タスク名'
mtc 'タスク名' '結果'
mse  # セッション終了時

# または直接tmuxコマンド
tmux send-keys -t %1 '[WORKER-N報告] 作業内容: 結果' Enter
```

### 報告タイミング
| タイミング | フォーマット | フック関数 |
|------------|--------------|------------|
| 開始時 | [WORKER-N開始] | mts |
| 進捗時 | [WORKER-N進捗] | mpr |
| 完了時 | [WORKER-N完了] | mtc |
| ブロック時 | [WORKER-Nブロック] | mbl |
| 終了時 | [WORKER-N終了] | mse |

---

## セットアップスクリプト

### 初回セットアップ
```bash
./scripts/orchestra-setup.sh
```

### プロトコル伝達（ワーカー追加時）
```bash
./scripts/orchestra-protocol-broadcast.sh
```

### フック有効化
```bash
chmod +x scripts/miyabi_hooks.sh
ln -sf $(pwd)/scripts/miyabi_hooks.sh ~/.miyabi_hooks.sh
```

---

## Claude Code / Codex 設定

### Claude Code
- 設定ファイル: `.claude/hooks.json`
- プロンプト: `.claude/prompts/orchestra-worker-protocol.md`

### Codex
- 設定ファイル: `CODEX_WORKER_INSTRUCTIONS.md`

### セッション終了フック
hooks.jsonにより、セッション終了時に自動的に `miyabi_session_end_report` が実行されます。

---

## Layer間通信（Pixel → Mac tmux）

### SSH経由でtmux操作
```bash
# セッション一覧確認
ssh pixel-to-mac "tmux list-sessions"

# ペイン一覧確認
ssh pixel-to-mac "tmux list-panes -t miyabi-orchestra -F '#{pane_id}: #{pane_title}'"

# ペインにメッセージ送信
ssh pixel-to-mac "tmux send-keys -t %1 'メッセージ' Enter"

# リアルタイムアタッチ
ssh -t pixel-to-mac "tmux attach -t miyabi-orchestra"
```

---

## 通信フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    miyabi-orchestra                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐                                            │
│  │ ORCHESTRATOR│←─────────┬─────────┬─────────┬──────────┐ │
│  │     %1      │          │         │         │          │ │
│  └──────┬──────┘          │         │         │          │ │
│         │                 │         │         │          │ │
│    指示↓             報告↑    報告↑    報告↑     報告↑   │
│         │                 │         │         │          │ │
│  ┌──────▼──────┐   ┌──────┴───┐ ┌───┴──────┐ ┌──────┴───┐ │
│  │  WORKER-1   │   │ WORKER-2 │ │ WORKER-3 │ │ WORKER-4 │ │
│  │     %2      │   │    %3    │ │    %4    │ │    %5    │ │
│  └─────────────┘   └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## チェックリスト

### 新規ワーカー追加時
- [ ] codex --yolo でペイン作成
- [ ] ペインタイトル設定
- [ ] PUSH型報告ルール伝達
- [ ] フック関数の使用方法伝達
- [ ] 報告先ペインID（%1）を教える

### セッション終了時（ワーカー必須）
- [ ] 作業結果をオーケストレーターに報告
- [ ] miyabi_session_end_report (mse) を実行
- [ ] 未完了タスクがあれば[ブロック]報告

### トラブルシューティング
- ワーカーが報告しない → PUSH型ルールを再伝達
- オーケストレーターがポーリング → PULL禁止ルールを再伝達
- フックが動かない → `source ~/.miyabi_hooks.sh` を実行
- ペインIDが不明 → `tmux list-panes -t miyabi-orchestra` で確認

---

## 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2025-11-22 | 1.0.0 | 初版作成。PUSH型通信プロトコル確立 |
| 2025-11-22 | 1.1.0 | MCPツール群、フック関数、Claude Code/Codex設定追加 |
