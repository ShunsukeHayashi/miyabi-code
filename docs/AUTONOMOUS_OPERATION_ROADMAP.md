# Miyabi Orchestra - 365日完全自律稼働ロードマップ

**目標**: 人間の介入なしに、Agentが自律的にコミュニケーションし、タスクを処理し続けるシステム

---

## 🎯 現状分析

### ✅ できていること
- tmuxベースの並列実行環境
- リアルタイムモニタリング
- 遠隔操作インターフェース

### ❌ 不足している点（Critical）
1. Agent間自動通信
2. タスク自動発見・割り当て
3. 障害時自動復旧
4. セッション永続化

---

## 📋 実装ロードマップ

### Phase 1: 自律稼働基盤 🚨 CRITICAL

#### 1.1 Agent間自動通信プロトコル

**目的**: Agent同士が自律的にメッセージ交換

**実装案**:
```bash
# 共有メッセージキュー（ファイルベース）
QUEUE_DIR="/tmp/miyabi-orchestra/queue"

# Agentがメッセージを送信
send_message() {
    local to_agent=$1
    local message=$2
    echo "$message" >> "$QUEUE_DIR/${to_agent}.inbox"
}

# Agentがメッセージを受信
receive_message() {
    local agent=$1
    if [[ -f "$QUEUE_DIR/${agent}.inbox" ]]; then
        cat "$QUEUE_DIR/${agent}.inbox"
        > "$QUEUE_DIR/${agent}.inbox"  # クリア
    fi
}

# 各AgentのWatcherスレッド
while true; do
    MSG=$(receive_message "kaede")
    if [[ -n "$MSG" ]]; then
        process_message "$MSG"
    fi
    sleep 1
done
```

**ファイル**: `scripts/miyabi-message-queue.sh`

---

#### 1.2 タスクキュー・スケジューラー

**目的**: GitHub Issuesを自動発見し、Agentに割り当て

**実装案**:
```bash
# Issue監視ループ
while true; do
    # 未割り当てIssueを取得
    ISSUES=$(gh issue list --label "status:todo" --json number,title)

    for ISSUE in $ISSUES; do
        ISSUE_NUM=$(echo "$ISSUE" | jq -r '.number')
        ISSUE_TITLE=$(echo "$ISSUE" | jq -r '.title')

        # ラベルに基づいてAgentを選択
        if echo "$ISSUE_TITLE" | grep -q "bug"; then
            assign_to_agent "kaede" "$ISSUE_NUM"
        elif echo "$ISSUE_TITLE" | grep -q "review"; then
            assign_to_agent "sakura" "$ISSUE_NUM"
        fi
    done

    sleep 60  # 1分ごとにチェック
done

assign_to_agent() {
    local agent=$1
    local issue=$2

    # Agentのpaneにタスクを送信
    case $agent in
        kaede)
            tmux send-keys -t miyabi-orchestra:0.1 \
                "# [自動割り当て] Issue #$issue を処理します" Enter
            ;;
        sakura)
            tmux send-keys -t miyabi-orchestra:0.2 \
                "# [自動割り当て] Issue #$issue をレビューします" Enter
            ;;
    esac

    # Issue にラベル付与
    gh issue edit "$issue" --add-label "status:in-progress,assigned:$agent"
}
```

**ファイル**: `scripts/miyabi-task-scheduler.sh`

---

#### 1.3 障害時自動復旧

**目的**: Agentクラッシュ時に自動再起動

**実装案**:
```bash
# Watchdog for each Agent
watch_agent() {
    local pane=$1
    local agent_name=$2

    while true; do
        # Paneが存在するか確認
        if ! tmux list-panes -t miyabi-orchestra:0.$pane &>/dev/null; then
            echo "[WATCHDOG] Pane $pane crashed! Recreating..."

            # Paneを再作成
            tmux split-window -t miyabi-orchestra:0 -h

            # Agentを再初期化
            tmux send-keys -t miyabi-orchestra:0.$pane \
                "cd /home/user/miyabi-private && echo '[再起動] $agent_name Agent復旧しました'" Enter

            # アラート通知
            echo "[$(date)] $agent_name Agent crashed and recovered" >> logs/watchdog.log
        fi

        # プロセスが応答するか確認（heartbeat）
        LAST_OUTPUT=$(tmux capture-pane -t miyabi-orchestra:0.$pane -p | tail -1)
        CURRENT_TIME=$(date +%s)

        # 5分以上出力がない場合は再起動
        # (実装省略: タイムスタンプ比較ロジック)

        sleep 10
    done
}

# 全Agentのwatchdogを起動
watch_agent 1 "カエデ" &
watch_agent 2 "サクラ" &
watch_agent 3 "ツバキ" &
watch_agent 4 "ボタン" &
```

**ファイル**: `scripts/miyabi-watchdog.sh`

---

#### 1.4 セッション永続化（systemd service）

**目的**: サーバー再起動後も自動起動

**実装案**:
```ini
# /etc/systemd/system/miyabi-orchestra.service
[Unit]
Description=Miyabi Orchestra - Autonomous Agent System
After=network.target

[Service]
Type=forking
User=shunsuke
WorkingDirectory=/home/user/miyabi-private
ExecStart=/usr/bin/tmux new-session -d -s miyabi-orchestra '/home/user/miyabi-private/scripts/miyabi-orchestra-daemon.sh'
ExecStop=/usr/bin/tmux kill-session -t miyabi-orchestra
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**起動スクリプト** (`scripts/miyabi-orchestra-daemon.sh`):
```bash
#!/bin/bash
# Miyabi Orchestra Daemon - 完全自律稼働モード

cd /home/user/miyabi-private

# 1. tmuxセッション作成
./scripts/miyabi-orchestra.sh coding-ensemble

# 2. タスクスケジューラー起動
./scripts/miyabi-task-scheduler.sh &

# 3. Watchdog起動
./scripts/miyabi-watchdog.sh &

# 4. メッセージキュー初期化
./scripts/miyabi-message-queue.sh &

# 5. ヘルスチェック起動
./scripts/miyabi-health-check.sh &

# ログ出力
echo "[$(date)] Miyabi Orchestra Daemon started" >> logs/daemon.log

# デーモンとして稼働し続ける
tail -f /dev/null
```

**有効化**:
```bash
sudo systemctl enable miyabi-orchestra
sudo systemctl start miyabi-orchestra
sudo systemctl status miyabi-orchestra
```

---

### Phase 2: 高度な自律機能

#### 2.1 タスク依存関係管理（DAG）

**実装**:
- `scripts/miyabi-dag-executor.sh`
- Issue間の依存関係をYAMLで定義
- トポロジカルソートで実行順序決定

#### 2.2 結果自動集約・レポート

**実装**:
- `scripts/miyabi-report-aggregator.sh`
- 各Agentの実行結果を収集
- 日次/週次レポートをGitHub Issueに自動投稿

#### 2.3 自動ヘルスチェック

**実装**:
- `scripts/miyabi-health-check.sh`
- Agent応答時間監視
- リソース使用率監視
- Slack/Discord通知

#### 2.4 ログ永続化・検索

**実装**:
- tmuxログを永続ストレージに保存
- Elasticsearch/Grafana連携
- ログ検索UI

---

### Phase 3: 最適化・スケーリング

#### 3.1 動的Agent数調整

**実装**:
- 負荷に応じてAgent数を自動増減
- Pane動的追加/削除

#### 3.2 優先度ベーススケジューリング

**実装**:
- Issue優先度に基づくタスク割り当て
- SLA（Service Level Agreement）管理

#### 3.3 マルチノード対応

**実装**:
- 複数サーバーでのAgent分散実行
- Redis/RabbitMQによるメッセージキュー

---

## 🚀 実装優先順位

### Week 1: 基盤構築
1. ✅ tmuxセットアップ（完了）
2. 🔨 メッセージキュー実装
3. 🔨 タスクスケジューラー実装

### Week 2: 自動化
4. 🔨 Watchdog実装
5. 🔨 systemd service設定
6. 🔨 ヘルスチェック実装

### Week 3-4: 高度化
7. 🔨 DAG依存管理
8. 🔨 自動レポート
9. 🔨 ログ永続化

---

## 📊 成功指標（KPI）

### 自律稼働率
- **目標**: 99.9% (月間ダウンタイム < 43分)
- **測定**: systemdログ、Watchdogログ

### タスク処理スループット
- **目標**: 1日あたり50 Issues処理
- **測定**: GitHub API

### 平均復旧時間（MTTR）
- **目標**: < 5分
- **測定**: Watchdogログ

### Agent稼働率
- **目標**: 平均 > 80%
- **測定**: モニタリングダッシュボード

---

## 🛠️ 実装開始

### すぐに実装できるもの

#### 1. メッセージキュー（30分）
```bash
./scripts/miyabi-message-queue.sh
```

#### 2. 簡易タスクスケジューラー（1時間）
```bash
./scripts/miyabi-task-scheduler.sh
```

#### 3. Watchdog（1時間）
```bash
./scripts/miyabi-watchdog.sh
```

### 実装順序
1. メッセージキュー → Agent間通信テスト
2. タスクスケジューラー → Issue自動割り当てテスト
3. Watchdog → クラッシュ復旧テスト
4. systemd → 再起動テスト

---

## 📝 次のアクション

**今すぐ実装を開始しますか？**

推奨: Phase 1の4つのコンポーネントを順次実装し、各コンポーネントのテストを行った後、統合テストで24時間稼働確認。

---

**🎭 Miyabi Orchestra - Towards Full Autonomy 🎭**
