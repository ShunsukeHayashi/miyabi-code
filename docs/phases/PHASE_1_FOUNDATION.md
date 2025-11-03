# Phase 1: 基盤自動化コンポーネント実装計画

**Phase**: 1 / 4
**期間**: 2週間 (10営業日)
**目的**: 自律稼働に必要な4つの基盤コンポーネントを実装し、完全自動運転の土台を構築

---

## 🎯 Phase 1の目標

### 最終ゴール
人間が手動でタスクを割り当てなくても、システムが自律的に動作する基盤を完成させる

### 達成基準
1. ✅ Agent間で自動的にメッセージ交換できる
2. ✅ GitHub Issuesを自動発見し、適切なAgentに割り当てられる
3. ✅ Agentがクラッシュしても自動で復旧する
4. ✅ サーバー再起動後も自動的にシステムが起動する
5. ✅ 24時間連続稼働テストに成功する

---

## 📋 実装コンポーネント

### 1.1 Agent間自動通信システム (3日間)

#### 目的
Agent同士が人間を介さずに直接メッセージをやり取りできるようにする

#### 設計方針

**メッセージキュー方式: ファイルベース + ポーリング**

```
理由:
- シンプルで実装が容易
- tmux環境と相性が良い
- デバッグが容易（ファイルを直接確認できる）
- 依存ライブラリ不要

代替案（将来的に検討）:
- Redis Pub/Sub（高パフォーマンスだが依存が増える）
- Named Pipe（低レイテンシだが揮発性）
```

#### アーキテクチャ

```
データ構造:
/tmp/miyabi-orchestra/queue/
├── kaede.inbox        # カエデ宛メッセージ
├── sakura.inbox       # サクラ宛メッセージ
├── tsubaki.inbox      # ツバキ宛メッセージ
├── botan.inbox        # ボタン宛メッセージ
├── broadcast.inbox    # 全員宛メッセージ
└── processed/         # 処理済みメッセージアーカイブ

メッセージフォーマット (JSON):
{
  "id": "msg-20251103-001",
  "from": "kaede",
  "to": "sakura",
  "timestamp": "2025-11-03T10:30:00Z",
  "type": "task_complete" | "task_request" | "status_query" | "ack",
  "payload": {
    "issue": 270,
    "status": "completed",
    "details": "..."
  }
}
```

#### 実装内容

**ファイル**: `scripts/miyabi-message-queue.sh`

```bash
#!/bin/bash
# Miyabi Orchestra - Message Queue System

QUEUE_DIR="/tmp/miyabi-orchestra/queue"
PROCESSED_DIR="$QUEUE_DIR/processed"

# 初期化
init_queue() {
    mkdir -p "$QUEUE_DIR" "$PROCESSED_DIR"
    touch "$QUEUE_DIR"/{kaede,sakura,tsubaki,botan,broadcast}.inbox
    chmod 666 "$QUEUE_DIR"/*.inbox
}

# メッセージ送信
send_message() {
    local from=$1
    local to=$2
    local type=$3
    local payload=$4

    local msg_id="msg-$(date +%Y%m%d-%H%M%S)-$$"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    local message=$(jq -n \
        --arg id "$msg_id" \
        --arg from "$from" \
        --arg to "$to" \
        --arg timestamp "$timestamp" \
        --arg type "$type" \
        --argjson payload "$payload" \
        '{id: $id, from: $from, to: $to, timestamp: $timestamp, type: $type, payload: $payload}')

    echo "$message" >> "$QUEUE_DIR/${to}.inbox"
    echo "[QUEUE] Sent: $msg_id from $from to $to" >&2
}

# メッセージ受信
receive_messages() {
    local agent=$1
    local inbox="$QUEUE_DIR/${agent}.inbox"

    if [[ ! -s "$inbox" ]]; then
        return 1
    fi

    # 全メッセージを読み込み
    local messages=$(cat "$inbox")

    # inboxをクリア
    > "$inbox"

    # メッセージをアーカイブ
    echo "$messages" >> "$PROCESSED_DIR/${agent}-$(date +%Y%m%d).log"

    # メッセージを返す
    echo "$messages"
}

# ブロードキャスト送信
broadcast_message() {
    local from=$1
    local type=$2
    local payload=$3

    for agent in kaede sakura tsubaki botan; do
        send_message "$from" "$agent" "$type" "$payload"
    done
}

# Agentメッセージ処理ループ
agent_message_loop() {
    local agent=$1

    while true; do
        # メッセージ受信
        messages=$(receive_messages "$agent")

        if [[ -n "$messages" ]]; then
            # 各メッセージを処理
            echo "$messages" | while IFS= read -r msg; do
                process_message "$agent" "$msg"
            done
        fi

        sleep 1
    done
}

# メッセージ処理ハンドラ
process_message() {
    local agent=$1
    local message=$2

    local msg_id=$(echo "$message" | jq -r '.id')
    local from=$(echo "$message" | jq -r '.from')
    local type=$(echo "$message" | jq -r '.type')
    local payload=$(echo "$message" | jq -r '.payload')

    echo "[$agent] Received message $msg_id from $from (type: $type)"

    case $type in
        task_request)
            handle_task_request "$agent" "$payload"
            ;;
        task_complete)
            handle_task_complete "$agent" "$payload"
            ;;
        status_query)
            handle_status_query "$agent" "$payload"
            ;;
        ack)
            echo "[$agent] Acknowledgment received"
            ;;
        *)
            echo "[$agent] Unknown message type: $type"
            ;;
    esac
}

# タスクリクエスト処理
handle_task_request() {
    local agent=$1
    local payload=$2

    local issue=$(echo "$payload" | jq -r '.issue')
    echo "[$agent] Received task request for Issue #$issue"

    # Agentのpaneにタスクを送信
    local pane=$(get_agent_pane "$agent")
    tmux send-keys -t "miyabi-orchestra:0.$pane" \
        "# [自動割り当て] Issue #$issue を処理します" Enter

    # ACK送信
    send_message "$agent" "conductor" "ack" "{\"issue\": $issue}"
}

# Agent名からpane番号を取得
get_agent_pane() {
    case $1 in
        kaede) echo 1 ;;
        sakura) echo 2 ;;
        tsubaki) echo 3 ;;
        botan) echo 4 ;;
        *) echo 0 ;;
    esac
}

# CLI
case "${1:-}" in
    init)
        init_queue
        ;;
    send)
        send_message "$2" "$3" "$4" "${5:-{}}"
        ;;
    receive)
        receive_messages "$2"
        ;;
    broadcast)
        broadcast_message "$2" "$3" "${4:-{}}"
        ;;
    loop)
        agent_message_loop "$2"
        ;;
    *)
        echo "Usage: $0 {init|send|receive|broadcast|loop} [args...]"
        exit 1
        ;;
esac
```

#### テスト計画

```bash
# テスト1: メッセージキュー初期化
./scripts/miyabi-message-queue.sh init
ls -la /tmp/miyabi-orchestra/queue/

# テスト2: メッセージ送信
./scripts/miyabi-message-queue.sh send conductor kaede task_request \
    '{"issue": 270, "title": "Implement feature X"}'

# テスト3: メッセージ受信
./scripts/miyabi-message-queue.sh receive kaede

# テスト4: ブロードキャスト
./scripts/miyabi-message-queue.sh broadcast conductor status_query '{}'

# テスト5: Agent処理ループ（バックグラウンド）
./scripts/miyabi-message-queue.sh loop kaede &
./scripts/miyabi-message-queue.sh send conductor kaede task_request \
    '{"issue": 270}'
```

#### 成果物
- ✅ `scripts/miyabi-message-queue.sh`
- ✅ メッセージキュー設計書 (`docs/architecture/MESSAGE_QUEUE_DESIGN.md`)
- ✅ ユニットテストスクリプト

#### 所要時間: 3日

---

### 1.2 タスク自動発見・割り当てシステム (4日間)

#### 目的
GitHub Issuesを自動的に監視し、ラベルに基づいて適切なAgentに割り当てる

#### 設計方針

**ポーリング方式 + ラベルベースルーティング**

```
Issue監視周期: 60秒
ラベルマッピング:
  - type:bug          → カエデ (CodeGen)
  - type:enhancement  → カエデ (CodeGen)
  - status:review     → サクラ (Review)
  - status:ready-pr   → ツバキ (PR)
  - status:deploy     → ボタン (Deployment)
```

#### アーキテクチャ

```
データフロー:
1. GitHub Issues API呼び出し
   ↓
2. 未割り当てIssueフィルタ（label: status:todo）
   ↓
3. ラベルに基づくAgent選択
   ↓
4. タスクキューに追加
   ↓
5. Message Queue経由でAgentに通知
   ↓
6. Issue にlabel追加（assigned:agent-name, status:in-progress）
```

#### 実装内容

**ファイル**: `scripts/miyabi-task-scheduler.sh`

```bash
#!/bin/bash
# Miyabi Orchestra - Task Scheduler Daemon

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/miyabi-message-queue.sh"

POLL_INTERVAL=60  # 60秒ごとにチェック
LOG_FILE="logs/scheduler/task-scheduler.log"

# GitHub API設定
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
REPO="${GITHUB_REPOSITORY:-customer-cloud/miyabi-private}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# 未割り当てIssueを取得
fetch_unassigned_issues() {
    gh issue list \
        --repo "$REPO" \
        --label "status:todo" \
        --json number,title,labels,body \
        --jq '.[]'
}

# Issueラベルに基づいてAgentを選択
select_agent_for_issue() {
    local labels=$1

    # ラベルをパース
    if echo "$labels" | jq -e '.[] | select(.name == "type:bug")' > /dev/null; then
        echo "kaede"
    elif echo "$labels" | jq -e '.[] | select(.name == "type:enhancement")' > /dev/null; then
        echo "kaede"
    elif echo "$labels" | jq -e '.[] | select(.name == "status:review")' > /dev/null; then
        echo "sakura"
    elif echo "$labels" | jq -e '.[] | select(.name == "status:ready-pr")' > /dev/null; then
        echo "tsubaki"
    elif echo "$labels" | jq -e '.[] | select(.name == "status:deploy")' > /dev/null; then
        echo "botan"
    else
        # デフォルトはカエデ
        echo "kaede"
    fi
}

# Issueを Agentに割り当て
assign_issue_to_agent() {
    local issue_number=$1
    local issue_title=$2
    local agent=$3

    log "Assigning Issue #$issue_number to $agent: $issue_title"

    # Message Queue経由でAgentに通知
    send_message "scheduler" "$agent" "task_request" \
        "{\"issue\": $issue_number, \"title\": \"$issue_title\"}"

    # GitHubにラベル追加
    gh issue edit "$issue_number" \
        --repo "$REPO" \
        --add-label "assigned:$agent,status:in-progress"

    log "Issue #$issue_number assigned to $agent successfully"
}

# スケジューラメインループ
scheduler_main_loop() {
    log "Task Scheduler started (poll interval: ${POLL_INTERVAL}s)"

    while true; do
        log "Checking for new issues..."

        # 未割り当てIssueを取得
        issues=$(fetch_unassigned_issues)

        if [[ -z "$issues" ]]; then
            log "No unassigned issues found"
        else
            # 各Issueを処理
            echo "$issues" | jq -c '.' | while IFS= read -r issue; do
                issue_number=$(echo "$issue" | jq -r '.number')
                issue_title=$(echo "$issue" | jq -r '.title')
                issue_labels=$(echo "$issue" | jq -c '.labels')

                # Agent選択
                agent=$(select_agent_for_issue "$issue_labels")

                # 割り当て
                assign_issue_to_agent "$issue_number" "$issue_title" "$agent"
            done
        fi

        sleep "$POLL_INTERVAL"
    done
}

# デーモン起動
case "${1:-start}" in
    start)
        mkdir -p "$(dirname "$LOG_FILE")"
        init_queue
        scheduler_main_loop
        ;;
    test)
        # テストモード: 1回だけ実行
        fetch_unassigned_issues
        ;;
    *)
        echo "Usage: $0 {start|test}"
        exit 1
        ;;
esac
```

#### ラベルシステム拡張

新しいラベルを`.github/labels.yml`に追加：

```yaml
# Agent割り当て用ラベル
- name: "assigned:kaede"
  color: "FF6B6B"
  description: "カエデ (CodeGen) に割り当て済み"

- name: "assigned:sakura"
  color: "FFA07A"
  description: "サクラ (Review) に割り当て済み"

- name: "assigned:tsubaki"
  color: "87CEEB"
  description: "ツバキ (PR) に割り当て済み"

- name: "assigned:botan"
  color: "98FB98"
  description: "ボタン (Deployment) に割り当て済み"
```

#### テスト計画

```bash
# テスト1: Issue一覧取得
./scripts/miyabi-task-scheduler.sh test

# テスト2: 手動でテストIssue作成
gh issue create --repo customer-cloud/miyabi-private \
    --title "Test Issue for Auto Assignment" \
    --label "status:todo,type:bug" \
    --body "This is a test issue"

# テスト3: スケジューラ起動（フォアグラウンド、60秒待機）
timeout 120 ./scripts/miyabi-task-scheduler.sh start

# テスト4: 割り当て結果確認
gh issue view <issue-number> --repo customer-cloud/miyabi-private

# テスト5: バックグラウンド起動
nohup ./scripts/miyabi-task-scheduler.sh start > logs/scheduler/nohup.out 2>&1 &
```

#### 成果物
- ✅ `scripts/miyabi-task-scheduler.sh`
- ✅ タスクスケジューラー設計書
- ✅ ラベルシステム拡張
- ✅ テストスクリプト

#### 所要時間: 4日

---

### 1.3 障害時自動復旧システム (Watchdog) (3日間)

#### 目的
Agentのクラッシュやハングを検出し、自動的に復旧する

#### 監視対象

1. **Paneの存在確認**
   - tmux paneが消失していないか

2. **Heartbeat監視**
   - 一定時間（5分）以上出力がないか

3. **プロセス健全性**
   - CPU使用率異常
   - メモリリーク

#### アーキテクチャ

```
監視周期: 10秒
Heartbeatタイムアウト: 5分
復旧アクション:
  1. Pane再作成
  2. Agent初期化スクリプト実行
  3. アラート通知（ログ + オプションでSlack/Discord）
```

#### 実装内容

**ファイル**: `scripts/miyabi-watchdog.sh`

```bash
#!/bin/bash
# Miyabi Orchestra - Watchdog Daemon

SESSION="miyabi-orchestra"
CHECK_INTERVAL=10
HEARTBEAT_TIMEOUT=300  # 5分
LOG_FILE="logs/watchdog/watchdog.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Pane存在確認
check_pane_exists() {
    local pane=$1
    tmux list-panes -t "$SESSION:0.$pane" &>/dev/null
}

# 最終出力時刻を取得
get_last_activity_time() {
    local pane=$1
    local last_line=$(tmux capture-pane -t "$SESSION:0.$pane" -p | tail -1)

    # タイムスタンプファイルから読み取り（簡易実装）
    # より高度な実装: tmuxのpane historyから推定
    local timestamp_file="/tmp/miyabi-watchdog/pane${pane}.timestamp"

    if [[ -f "$timestamp_file" ]]; then
        cat "$timestamp_file"
    else
        date +%s
    fi
}

# Paneを再作成
recreate_pane() {
    local pane=$1
    local agent_name=$2

    log "[CRITICAL] Pane $pane crashed! Recreating..."

    # 既存のpaneが残っていれば削除
    tmux kill-pane -t "$SESSION:0.$pane" 2>/dev/null

    # Pane再作成（レイアウトに応じて調整が必要）
    case $pane in
        1)
            tmux split-window -t "$SESSION:0.0" -h
            ;;
        2)
            tmux split-window -t "$SESSION:0.0" -v
            ;;
        3)
            tmux split-window -t "$SESSION:0.1" -v
            ;;
        4)
            tmux split-window -t "$SESSION:0.2" -v
            ;;
    esac

    # Agent初期化
    tmux send-keys -t "$SESSION:0.$pane" \
        "cd /home/user/miyabi-private && echo '[再起動] $agent_name Agent復旧しました'" Enter

    # Message Queue再起動
    tmux send-keys -t "$SESSION:0.$pane" \
        "./scripts/miyabi-message-queue.sh loop $agent_name &" Enter

    log "[RECOVERY] Pane $pane ($agent_name) recovered successfully"

    # アラート送信（オプション）
    send_alert "Pane $pane ($agent_name) crashed and recovered"
}

# アラート送信
send_alert() {
    local message=$1
    log "[ALERT] $message"

    # Slack/Discord通知（環境変数で設定されている場合）
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"[Miyabi Watchdog] $message\"}"
    fi
}

# Agent監視ループ
watch_agent() {
    local pane=$1
    local agent_name=$2

    while true; do
        # Pane存在確認
        if ! check_pane_exists "$pane"; then
            recreate_pane "$pane" "$agent_name"
        fi

        # Heartbeat確認（省略版）
        # 実装: last_activity_timeと現在時刻を比較

        sleep "$CHECK_INTERVAL"
    done
}

# Watchdogメインループ
watchdog_main() {
    log "Watchdog started for session: $SESSION"

    # 各Agentの監視を並列起動
    watch_agent 1 "kaede" &
    watch_agent 2 "sakura" &
    watch_agent 3 "tsubaki" &
    watch_agent 4 "botan" &

    # メインプロセスは待機
    wait
}

# デーモン起動
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "/tmp/miyabi-watchdog"

case "${1:-start}" in
    start)
        watchdog_main
        ;;
    test)
        # テスト: 1つのAgentのみ監視
        watch_agent 1 "kaede"
        ;;
    *)
        echo "Usage: $0 {start|test}"
        exit 1
        ;;
esac
```

#### テスト計画

```bash
# テスト1: Watchdog起動
./scripts/miyabi-watchdog.sh start &

# テスト2: Pane削除してクラッシュをシミュレート
tmux kill-pane -t miyabi-orchestra:0.1

# テスト3: 復旧確認
tmux list-panes -t miyabi-orchestra:0
tail -f logs/watchdog/watchdog.log

# テスト4: 複数Pane同時クラッシュ
tmux kill-pane -t miyabi-orchestra:0.1
tmux kill-pane -t miyabi-orchestra:0.2
```

#### 成果物
- ✅ `scripts/miyabi-watchdog.sh`
- ✅ Watchdog設計書
- ✅ アラート通知機能（Slack/Discord対応）
- ✅ テストスクリプト

#### 所要時間: 3日

---

### 1.4 セッション永続化 (systemd service) (2日間)

#### 目的
サーバー再起動後も自動的にシステムを起動する

#### 設計方針

**systemd serviceによる管理**

- サービス名: `miyabi-orchestra.service`
- 起動タイプ: `forking` (tmuxセッションをバックグラウンド起動)
- 自動再起動: 有効

#### 実装内容

**ファイル1**: `/etc/systemd/system/miyabi-orchestra.service`

```ini
[Unit]
Description=Miyabi Orchestra - Autonomous Agent Orchestration System
Documentation=https://github.com/customer-cloud/miyabi-private
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
User=shunsuke
Group=shunsuke
WorkingDirectory=/home/user/miyabi-private

# 起動コマンド
ExecStart=/home/user/miyabi-private/scripts/miyabi-orchestra-daemon.sh start

# 停止コマンド
ExecStop=/home/user/miyabi-private/scripts/miyabi-orchestra-daemon.sh stop

# 再起動設定
Restart=always
RestartSec=10

# リソース制限
MemoryLimit=4G
CPUQuota=200%

# ログ設定
StandardOutput=append:/home/user/miyabi-private/logs/systemd/stdout.log
StandardError=append:/home/user/miyabi-private/logs/systemd/stderr.log

[Install]
WantedBy=multi-user.target
```

**ファイル2**: `scripts/miyabi-orchestra-daemon.sh`

```bash
#!/bin/bash
# Miyabi Orchestra - Daemon Startup Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SESSION="miyabi-orchestra"
PIDFILE="/var/run/miyabi-orchestra.pid"

cd "$PROJECT_ROOT" || exit 1

start_daemon() {
    echo "Starting Miyabi Orchestra..."

    # 既存セッションがあれば終了
    tmux kill-session -t "$SESSION" 2>/dev/null

    # 1. tmuxセッション作成 & Orchestra起動
    tmux new-session -d -s "$SESSION" -c "$PROJECT_ROOT"
    "$SCRIPT_DIR/miyabi-orchestra.sh" coding-ensemble

    # 2. Message Queue初期化
    "$SCRIPT_DIR/miyabi-message-queue.sh" init

    # 3. 各AgentのMessage Queueループ起動
    for pane in 1 2 3 4; do
        agent=$(get_agent_name "$pane")
        tmux send-keys -t "$SESSION:0.$pane" \
            "./scripts/miyabi-message-queue.sh loop $agent &" Enter
    done

    # 4. Task Scheduler起動（バックグラウンド）
    nohup "$SCRIPT_DIR/miyabi-task-scheduler.sh" start \
        > logs/scheduler/nohup.out 2>&1 &
    echo $! > "$PIDFILE.scheduler"

    # 5. Watchdog起動（バックグラウンド）
    nohup "$SCRIPT_DIR/miyabi-watchdog.sh" start \
        > logs/watchdog/nohup.out 2>&1 &
    echo $! > "$PIDFILE.watchdog"

    # PIDファイル作成（tmux session PID）
    tmux list-sessions -F "#{session_name} #{pid}" | \
        grep "$SESSION" | awk '{print $2}' > "$PIDFILE"

    echo "Miyabi Orchestra started successfully"
    echo "Session: $SESSION"
    echo "PID: $(cat "$PIDFILE")"
}

stop_daemon() {
    echo "Stopping Miyabi Orchestra..."

    # Task Scheduler停止
    if [[ -f "$PIDFILE.scheduler" ]]; then
        kill "$(cat "$PIDFILE.scheduler")" 2>/dev/null
        rm -f "$PIDFILE.scheduler"
    fi

    # Watchdog停止
    if [[ -f "$PIDFILE.watchdog" ]]; then
        kill "$(cat "$PIDFILE.watchdog")" 2>/dev/null
        rm -f "$PIDFILE.watchdog"
    fi

    # tmuxセッション停止
    tmux kill-session -t "$SESSION" 2>/dev/null

    rm -f "$PIDFILE"
    echo "Miyabi Orchestra stopped"
}

get_agent_name() {
    case $1 in
        1) echo "kaede" ;;
        2) echo "sakura" ;;
        3) echo "tsubaki" ;;
        4) echo "botan" ;;
        *) echo "unknown" ;;
    esac
}

case "${1:-start}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        stop_daemon
        sleep 2
        start_daemon
        ;;
    status)
        if tmux has-session -t "$SESSION" 2>/dev/null; then
            echo "Miyabi Orchestra is running (session: $SESSION)"
            tmux list-panes -t "$SESSION:0" -F "Pane #{pane_index}: #{pane_id}"
        else
            echo "Miyabi Orchestra is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
```

#### セットアップ手順

```bash
# 1. デーモンスクリプトを作成
sudo cp scripts/miyabi-orchestra-daemon.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/miyabi-orchestra-daemon.sh

# 2. systemd serviceファイルを配置
sudo cp deployment/miyabi-orchestra.service /etc/systemd/system/

# 3. systemd reload
sudo systemctl daemon-reload

# 4. サービス有効化
sudo systemctl enable miyabi-orchestra

# 5. サービス起動
sudo systemctl start miyabi-orchestra

# 6. ステータス確認
sudo systemctl status miyabi-orchestra
```

#### テスト計画

```bash
# テスト1: 手動起動/停止
./scripts/miyabi-orchestra-daemon.sh start
./scripts/miyabi-orchestra-daemon.sh status
./scripts/miyabi-orchestra-daemon.sh stop

# テスト2: systemd起動
sudo systemctl start miyabi-orchestra
sudo systemctl status miyabi-orchestra

# テスト3: 自動再起動テスト
sudo systemctl restart miyabi-orchestra

# テスト4: サーバー再起動テスト
sudo reboot
# 再起動後
sudo systemctl status miyabi-orchestra
tmux attach -t miyabi-orchestra

# テスト5: 障害シミュレーション
# tmux sessionを強制終了
tmux kill-session -t miyabi-orchestra
# systemdが自動再起動するか確認
sleep 15
sudo systemctl status miyabi-orchestra
```

#### 成果物
- ✅ `scripts/miyabi-orchestra-daemon.sh`
- ✅ `/etc/systemd/system/miyabi-orchestra.service`
- ✅ デプロイメントガイド
- ✅ テストスクリプト

#### 所要時間: 2日

---

## 🧪 Phase 1統合テスト

### 統合テストシナリオ

#### Test 1: 完全自律稼働テスト (24時間)

```bash
# 前提条件
- systemd serviceが有効化されている
- GitHub repositoryにテストIssueが10件ある

# 手順
1. サーバー再起動
2. 自動的にMiyabi Orchestraが起動することを確認
3. 24時間放置
4. Issue処理状況を確認

# 成功基準
- ダウンタイムなく24時間稼働
- 10件のIssueが全て処理された
- Agent間通信ログが正常に記録されている
```

#### Test 2: 障害復旧テスト

```bash
# シナリオA: Paneクラッシュ
1. tmux paneを手動削除
2. 5秒以内にWatchdogが検出
3. 10秒以内にPaneが復旧
4. Message Queueが再接続される

# シナリオB: プロセスハング
1. Agentプロセスを無限ループに陥らせる
2. Heartbeatタイムアウト（5分）後に検出
3. プロセスがkillされ再起動される

# シナリオC: システムクラッシュ
1. サーバーを強制再起動
2. systemdが自動的にサービスを起動
3. 全Agentが正常に復旧
```

#### Test 3: 負荷テスト

```bash
# 前提条件
- GitHub repositoryに100件のテストIssueを作成

# 手順
1. 全Issueに status:todo ラベルを付与
2. Task Schedulerが順次割り当てることを確認
3. Agent稼働率をモニタリング

# 成功基準
- 全100件のIssueが割り当てられる
- Agent稼働率 > 80%
- メモリリークがない
```

---

## 📊 Phase 1完了基準

### 必須要件（Must Have）

- [ ] メッセージキューが実装され、Agent間通信ができる
- [ ] タスクスケジューラーがIssueを自動割り当てできる
- [ ] Watchdogがクラッシュを検出・復旧できる
- [ ] systemd serviceが正常に動作する
- [ ] 24時間連続稼働テストに成功する

### 推奨要件（Should Have）

- [ ] Slack/Discord通知が動作する
- [ ] ログが適切にローテーションされる
- [ ] パフォーマンスメトリクスが収集されている

### オプション要件（Nice to Have）

- [ ] Grafanaダッシュボードが表示される
- [ ] 自動テストが CI/CD に統合されている

---

## 📅 実装スケジュール

```
Day 1-3   : 1.1 Message Queue実装
Day 4-7   : 1.2 Task Scheduler実装
Day 8-10  : 1.3 Watchdog実装
Day 11-12 : 1.4 systemd service設定
Day 13-14 : 統合テスト & バグ修正
```

---

## 🚀 Phase 1開始手順

```bash
# 1. 作業ブランチ作成
git checkout -b feature/phase1-foundation

# 2. ディレクトリ作成
mkdir -p scripts/{daemons,tests}
mkdir -p logs/{scheduler,watchdog,systemd}
mkdir -p data/{queue,state}
mkdir -p /tmp/miyabi-orchestra/queue

# 3. 実装開始
vim scripts/miyabi-message-queue.sh

# 4. 進捗管理
# 毎日TodoWriteで進捗を更新
```

---

**Phase 1完了後、Phase 2へ進みます**

次回: `docs/phases/PHASE_2_ADVANCED.md`
