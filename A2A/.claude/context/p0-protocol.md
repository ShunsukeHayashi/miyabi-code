# P0.2 Communication Protocol

## Overview

P0.2プロトコルはMiyabiマルチエージェントシステムにおける必須通信規約です。

## Core Rule

```bash
tmux send-keys -t %PANE_ID 'MESSAGE' && sleep 0.5 && tmux send-keys -t %PANE_ID Enter
```

## Critical Requirements

### 1. 永続ペインID使用（MUST）

**正しい例:**
```bash
tmux send-keys -t %18 'メッセージ' && sleep 0.5 && tmux send-keys -t %18 Enter
```

**間違い（禁止）:**
```bash
# session:window.index形式は使用禁止
tmux send-keys -t miyabi-main:6.0 'メッセージ'
```

### 2. sleep 0.5 必須

メッセージとEnterキーの間に`sleep 0.5`を挟むことで、安定した配信を保証。

### 3. PUSH型報告

ワーカーはコンダクター（%18）に報告をPUSH。
コンダクターがワーカーをポーリングすることは禁止。

```
Worker → Conductor (PUSH)
Conductor → Worker (Task Assignment)
```

## Syntax Variations

### Basic Send
```bash
tmux send-keys -t %19 '[楓] 完了: 実装完了' && sleep 0.5 && tmux send-keys -t %19 Enter
```

### Multi-line Message
```bash
tmux send-keys -t %18 '[桜] レビュー結果:
- 品質: OK
- セキュリティ: OK
- 推奨: マージ可' && sleep 0.5 && tmux send-keys -t %18 Enter
```

### With Variable
```bash
PANE="%18"
MSG="[楓] 進行中: Issue #270"
tmux send-keys -t "$PANE" "$MSG" && sleep 0.5 && tmux send-keys -t "$PANE" Enter
```

## Error Handling

送信失敗時はリトライ:
```bash
a2a_send() {
  local pane="$1"
  local msg="$2"
  local retries=3

  for i in $(seq 1 $retries); do
    if tmux send-keys -t "$pane" "$msg" && sleep 0.5 && tmux send-keys -t "$pane" Enter; then
      return 0
    fi
    sleep 1
  done
  return 1
}
```
