---
name: tmux Multi-Agent Messaging
description: tmuxペインへの確実なメッセージ送信とEnterキータイミング制御。マルチエージェント間コミュニケーションの信頼性を保証。
allowed-tools: Bash, Read, Write, Edit
---

# 📡 tmux Multi-Agent Messaging Skill

**Version**: 1.0.0
**Created**: 2025-12-05
**Priority**: P0 (Critical)
**Purpose**: tmuxペインへの確実なメッセージ送信とタイミング制御

---

## 🚨 問題の背景

tmux send-keysでメッセージを送信する際、以下の問題が発生する：

1. **Enterキーが送信されない** - 長いメッセージの後、Enterが認識されない
2. **メッセージが途切れる** - バッファ制限で一部のみ送信
3. **タイミングの問題** - Claude Codeが起動完了前に送信

---

## 🎯 解決策: 3段階送信プロトコル

### Phase 1: ペイン準備確認

```bash
# ペインが応答可能か確認
tmux_pane_ready() {
    local pane_id="$1"
    local max_wait=10
    local count=0

    while [ $count -lt $max_wait ]; do
        # プロンプトが表示されているか確認
        if tmux capture-pane -t "$pane_id" -p | grep -q '>' ; then
            return 0
        fi
        sleep 1
        ((count++))
    done
    return 1
}
```

### Phase 2: チャンク分割送信

```bash
# 長いメッセージを分割して送信
tmux_send_chunked() {
    local pane_id="$1"
    local message="$2"
    local chunk_size=200  # 1回の送信サイズ

    # メッセージをチャンクに分割
    local i=0
    local len=${#message}

    while [ $i -lt $len ]; do
        local chunk="${message:$i:$chunk_size}"
        tmux send-keys -t "$pane_id" -l "$chunk"
        sleep 0.1  # チャンク間の待機
        ((i+=chunk_size))
    done
}
```

### Phase 3: 確実なEnter送信

```bash
# Enterキーを確実に送信
tmux_send_enter() {
    local pane_id="$1"

    sleep 0.3  # メッセージ完了を待つ
    tmux send-keys -t "$pane_id" Enter
    sleep 0.2  # Enter処理を待つ
}
```

---

## 📋 完全な送信関数

### 単一メッセージ送信

```bash
#!/bin/bash
# tmux-safe-send.sh

tmux_safe_send() {
    local pane_id="$1"
    local message="$2"
    local send_enter="${3:-true}"  # デフォルトでEnter送信

    # Phase 1: 待機
    sleep 0.5

    # Phase 2: メッセージ送信（リテラルモード -l を使用）
    if [ ${#message} -gt 200 ]; then
        # 長いメッセージは分割
        local chunk_size=200
        local i=0
        local len=${#message}

        while [ $i -lt $len ]; do
            local chunk="${message:$i:$chunk_size}"
            tmux send-keys -t "$pane_id" -l "$chunk"
            sleep 0.1
            ((i+=chunk_size))
        done
    else
        # 短いメッセージは一括送信
        tmux send-keys -t "$pane_id" -l "$message"
    fi

    # Phase 3: Enter送信
    if [ "$send_enter" = "true" ]; then
        sleep 0.3
        tmux send-keys -t "$pane_id" Enter
        sleep 0.2
    fi

    return 0
}
```

### 複数ペイン一括送信

```bash
#!/bin/bash
# tmux-broadcast.sh

tmux_broadcast() {
    local message="$1"
    shift
    local pane_ids=("$@")

    for pane_id in "${pane_ids[@]}"; do
        tmux_safe_send "$pane_id" "$message" true
        sleep 0.5  # ペイン間の待機
    done
}

# 使用例
# tmux_broadcast "Hello all agents" %9 %10 %12 %11
```

---

## 🤖 Agent別メッセージテンプレート

### Coordinator Agent

```bash
COORDINATOR_PROMPT='## コミュニケーションプロトコル

あなたはCoordinator Agentです。

### 送信フォーマット
@[Agent名] [タスク種別]: [内容]

### 優先度
- P0: 即時対応
- P1: 当日対応
- P2: 今週対応

gh issue list でIssueを確認してください。'

tmux_safe_send %9 "$COORDINATOR_PROMPT" true
```

### CodeGen Agent

```bash
CODEGEN_PROMPT='## コミュニケーションプロトコル

あなたはCodeGen Agentです。

### 応答フォーマット
ACK: 受領
PROGRESS: 進捗
DONE: 完了
BLOCKED: ブロック

cargo build/test で検証してください。'

tmux_safe_send %10 "$CODEGEN_PROMPT" true
```

### Review Agent

```bash
REVIEW_PROMPT='## コミュニケーションプロトコル

あなたはReview Agentです。

### チェックリスト
1. cargo fmt --check
2. cargo clippy
3. cargo test

gh pr list でPRを確認してください。'

tmux_safe_send %12 "$REVIEW_PROMPT" true
```

### Issue Agent

```bash
ISSUE_PROMPT='## コミュニケーションプロトコル

あなたはIssue Agentです。

### コマンド
- gh issue list
- gh issue create
- gh issue edit

ラベルシステムに従って管理してください。'

tmux_safe_send %11 "$ISSUE_PROMPT" true
```

---

## 🔧 実行スクリプト

### 全エージェント初期化

```bash
#!/bin/bash
# init-agents.sh

source ~/.claude/scripts/tmux-safe-send.sh

# ペインIDを取得
PANES=($(tmux list-panes -t miyabi-main:agents -F "#{pane_id}"))

# 各エージェントにプロンプトを送信
echo "Initializing Coordinator..."
tmux_safe_send "${PANES[0]}" "$COORDINATOR_PROMPT" true
sleep 2

echo "Initializing CodeGen..."
tmux_safe_send "${PANES[1]}" "$CODEGEN_PROMPT" true
sleep 2

echo "Initializing Review..."
tmux_safe_send "${PANES[2]}" "$REVIEW_PROMPT" true
sleep 2

echo "Initializing Issue..."
tmux_safe_send "${PANES[3]}" "$ISSUE_PROMPT" true
sleep 2

echo "All agents initialized!"
```

---

## ⚠️ トラブルシューティング

### Enterが送信されない場合

```bash
# 明示的にEnterを送信
tmux send-keys -t %9 C-m  # Ctrl+M = Enter
# または
tmux send-keys -t %9 Enter
sleep 0.5
tmux send-keys -t %9 Enter  # 2回送信
```

### メッセージが途切れる場合

```bash
# リテラルモード(-l)を使用
tmux send-keys -t %9 -l "メッセージ内容"
# 特殊文字がエスケープされずに送信される
```

### ペインが応答しない場合

```bash
# ペインの状態確認
tmux capture-pane -t %9 -p | tail -5

# Claude Codeを再起動
tmux send-keys -t %9 C-c
sleep 1
tmux send-keys -t %9 'claude --dangerously-skip-permissions' Enter
```

---

## 📊 タイミング表

| 操作 | 推奨待機時間 |
|------|-------------|
| メッセージ送信後 | 0.3秒 |
| Enter送信後 | 0.2秒 |
| チャンク間 | 0.1秒 |
| ペイン間 | 0.5秒 |
| Claude起動待ち | 3-5秒 |
| 長いプロンプト後 | 1秒 |

---

## 👁️ Agent Watcher - 自動再起動

### セッション終了検出パターン

```bash
SESSION_END_PATTERNS=(
    "Session ended"
    "session has ended"
    "conversation ended"
    "Goodbye"
    "Session complete"
    "Cost:"
    "Thank you for using"
)
```

### Watcher起動

```bash
# バックグラウンドで監視開始
~/.claude/scripts/agent-watcher.sh miyabi-main agents 10 &

# または tmux内で実行
tmux new-window -t miyabi-main -n 'watcher'
tmux send-keys -t miyabi-main:watcher '~/.claude/scripts/agent-watcher.sh' Enter
```

### Watcher停止

```bash
# プロセスを見つけて停止
pkill -f agent-watcher.sh

# または Ctrl+C
```

### ログ確認

```bash
tail -f /tmp/miyabi-agent-watcher/watcher.log
```

---

## 🔗 関連Skills

- **tmux-iterm-integration**: プロファイル・レイアウト管理
- **agent-execution**: Agent実行フロー
- **debugging-troubleshooting**: エラー対応

---

## 📁 スクリプト一覧

| スクリプト | 場所 | 用途 |
|-----------|------|------|
| `tmux-safe-send.sh` | `~/.claude/scripts/` | 安全なメッセージ送信 |
| `init-agents.sh` | `~/.claude/scripts/` | エージェント初期化 |
| `agent-watcher.sh` | `~/.claude/scripts/` | 自動再起動監視 |
| `task-queue.sh` | `~/.claude/scripts/` | タスクキュー管理 |
| `agent-watcher-with-queue.sh` | `~/.claude/scripts/` | キュー統合監視 |

---

## 📋 Task Queue System

### キュー操作コマンド

```bash
# キュー初期化
~/.claude/scripts/task-queue.sh init

# タスク追加（優先度: P0/P1/P2/P3）
~/.claude/scripts/task-queue.sh add coordinator "gh issue list" P1
~/.claude/scripts/task-queue.sh add codegen "implement feature X" P0

# キュー確認
~/.claude/scripts/task-queue.sh peek-all

# タスク取得（先頭を取り出し）
~/.claude/scripts/task-queue.sh get coordinator

# キュークリア
~/.claude/scripts/task-queue.sh clear all
```

### バックログ管理

```bash
# バックログからキューにロード
~/.claude/scripts/task-queue.sh load-backlog

# バックログにタスク追加
~/.claude/scripts/task-queue.sh add-backlog codegen "implement new feature"
```

### バックログファイル

```
/tmp/miyabi-task-queue/backlog.json
```

```json
{
  "version": "1.0.0",
  "backlog": {
    "coordinator": ["task1", "task2"],
    "codegen": ["task1", "task2"],
    "review": ["task1", "task2"],
    "issue": ["task1", "task2"]
  }
}
```

### キュー統合Watcher起動

```bash
# watcherウィンドウで実行
~/.claude/scripts/agent-watcher-with-queue.sh miyabi-main agents 10
```

- アイドル検出 → キューからタスク取得 → 自動投入
- キュー空の場合はスキップ
