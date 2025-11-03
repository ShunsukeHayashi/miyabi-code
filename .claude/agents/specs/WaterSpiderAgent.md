# 🕷️ Water Spider Agent - システム監視・自動復旧Agent

**役割**: Miyabi Orchestra全体を監視し、Agentの健全性を保証する

---

## 🎯 概要

Water Spider Agentは、トヨタ生産方式の「水すまし」から着想を得た、システム全体の監視・調整・自動復旧を担当する特殊Agentです。

**主な責務**:
1. 全AgentのClaude Codeセッション監視
2. 停止・フリーズしたAgentの検出
3. 自動再起動・復旧
4. ヘルスチェック定期実行
5. Conductorへの状態報告

---

## 🏗️ アーキテクチャ

### Pane構成

```
Pane 1 (%1): 🎼 Conductor (Main)
Pane 2 (%2): 🎹 カエデ (CodeGen)
Pane 3 (%5): 🎺 サクラ (Review)
Pane 4 (%3): 🥁 ツバキ (PR)
Pane 5 (%4): 🎷 ボタン (Deploy)
Pane 6 (%6): 🕷️ Water Spider (Monitor) ⭐ NEW
```

### 監視対象

| Agent | Pane ID | 監視項目 |
|-------|---------|----------|
| カエデ | %2 | セッション生存、応答性、タスク進捗 |
| サクラ | %5 | セッション生存、応答性、タスク進捗 |
| ツバキ | %3 | セッション生存、応答性、タスク進捗 |
| ボタン | %4 | セッション生存、応答性、タスク進捗 |

---

## 🔄 監視サイクル

### 1. ヘルスチェック（60秒間隔）

```
Water Spider Agent
  ↓
  ├→ カエデ (%2) にpingメッセージ送信
  ├→ サクラ (%5) にpingメッセージ送信
  ├→ ツバキ (%3) にpingメッセージ送信
  └→ ボタン (%4) にpingメッセージ送信
  ↓
30秒待機
  ↓
応答確認
  ↓
  ├→ 応答あり: ✅ 正常
  └→ 応答なし: ⚠️ 異常検出
       ↓
     自動復旧処理
```

### 2. 異常検出パターン

**パターンA: セッション停止**
```
症状: Claude Codeプロセスが停止
検出: tmux capture-paneで "bypass permissions" が表示されない
対応: 自動再起動
```

**パターンB: フリーズ**
```
症状: pingに応答しない（3回連続）
検出: 30秒×3回待機しても応答なし
対応: /clear送信 → 再起動
```

**パターンC: エラー状態**
```
症状: エラーメッセージ表示
検出: tmux capture-paneで "error" を検出
対応: Conductorに報告 → 手動介入待機
```

### 3. 自動復旧プロセス

```
異常検出
  ↓
Conductorに報告: "[Water Spider] ⚠️ カエデが応答なし - 復旧開始"
  ↓
/clear送信
  ↓
5秒待機
  ↓
再度pingメッセージ送信
  ↓
応答確認
  ↓
  ├→ 復旧成功: "[Water Spider] ✅ カエデ復旧完了"
  └→ 復旧失敗: "[Water Spider] ❌ カエデ復旧失敗 - 手動介入必要"
```

---

## 🛠️ 実装

### 1. 監視スクリプト

**ファイル**: `/Users/shunsuke/Dev/miyabi-private/scripts/water-spider-monitor.sh`

```bash
#!/bin/bash
# Water Spider Agent - Monitoring Script

WORKING_DIR="/Users/shunsuke/Dev/miyabi-private"
CONDUCTOR_PANE="%1"
LOG_FILE="$WORKING_DIR/.ai/logs/water-spider.log"

# Agent定義
declare -A AGENTS=(
    ["%2"]="カエデ"
    ["%5"]="サクラ"
    ["%3"]="ツバキ"
    ["%4"]="ボタン"
)

# ログ関数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Conductorに報告
report_to_conductor() {
    local message="$1"
    tmux send-keys -t "$CONDUCTOR_PANE" "$message" && sleep 0.1 && tmux send-keys -t "$CONDUCTOR_PANE" Enter
}

# pingメッセージ送信
send_ping() {
    local pane_id="$1"
    local agent_name="$2"
    local ping_message="cd '$WORKING_DIR' && [$agent_name] ping応答OK と発言してください。（30秒以内）"

    tmux send-keys -t "$pane_id" "$ping_message" && sleep 0.1 && tmux send-keys -t "$pane_id" Enter
    log_message "[Water Spider] 🏓 ${agent_name}にping送信"
}

# 応答確認
check_response() {
    local pane_id="$1"
    local agent_name="$2"
    local timeout=30
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        local output=$(tmux capture-pane -t "$pane_id" -p | tail -10)

        if echo "$output" | grep -q "ping応答OK"; then
            log_message "[Water Spider] ✅ ${agent_name}応答確認"
            return 0
        fi

        sleep 5
        elapsed=$((elapsed + 5))
    done

    log_message "[Water Spider] ⚠️ ${agent_name}応答なし（${timeout}秒経過）"
    return 1
}

# 自動復旧
auto_recovery() {
    local pane_id="$1"
    local agent_name="$2"

    log_message "[Water Spider] 🔧 ${agent_name}復旧開始"
    report_to_conductor "[Water Spider] ⚠️ ${agent_name}が応答なし - 復旧開始"

    # /clear送信
    tmux send-keys -t "$pane_id" "cd '$WORKING_DIR' && /clear" && sleep 0.1 && tmux send-keys -t "$pane_id" Enter
    sleep 5

    # 再度ping
    send_ping "$pane_id" "$agent_name"
    sleep 5

    if check_response "$pane_id" "$agent_name"; then
        log_message "[Water Spider] ✅ ${agent_name}復旧成功"
        report_to_conductor "[Water Spider] ✅ ${agent_name}復旧完了"
        return 0
    else
        log_message "[Water Spider] ❌ ${agent_name}復旧失敗"
        report_to_conductor "[Water Spider] ❌ ${agent_name}復旧失敗 - 手動介入必要"
        return 1
    fi
}

# メインループ
main_loop() {
    log_message "[Water Spider] 🕷️ 監視開始"
    report_to_conductor "[Water Spider] 🕷️ 監視システム起動"

    local cycle=0

    while true; do
        cycle=$((cycle + 1))
        log_message "[Water Spider] 📊 監視サイクル #${cycle} 開始"

        for pane_id in "${!AGENTS[@]}"; do
            agent_name="${AGENTS[$pane_id]}"

            # pane存在確認
            if ! tmux list-panes -F '#{pane_id}' | grep -q "^${pane_id}$"; then
                log_message "[Water Spider] ⚠️ ${agent_name}のpaneが存在しません"
                report_to_conductor "[Water Spider] ⚠️ ${agent_name}のpane消失 - 確認してください"
                continue
            fi

            # ping送信
            send_ping "$pane_id" "$agent_name"
        done

        # 応答待機
        sleep 30

        # 応答確認
        for pane_id in "${!AGENTS[@]}"; do
            agent_name="${AGENTS[$pane_id]}"

            if ! check_response "$pane_id" "$agent_name"; then
                # 復旧試行
                auto_recovery "$pane_id" "$agent_name"
            fi
        done

        log_message "[Water Spider] 📊 監視サイクル #${cycle} 完了 - 次のサイクルまで60秒待機"
        sleep 60
    done
}

# スクリプト開始
main_loop
```

### 2. systemdサービス化（オプション）

**ファイル**: `/etc/systemd/system/miyabi-water-spider.service`

```ini
[Unit]
Description=Miyabi Orchestra Water Spider Agent
After=network.target

[Service]
Type=simple
User=shunsuke
WorkingDirectory=/Users/shunsuke/Dev/miyabi-private
ExecStart=/Users/shunsuke/Dev/miyabi-private/scripts/water-spider-monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 📊 監視ダッシュボード

Water Spider Agentは、リアルタイムで監視状況を表示します：

```
🕷️ Miyabi Orchestra - Water Spider Monitoring Dashboard

Last Update: 2025-11-03 12:34:56

┌─────────────────────────────────────────────────────┐
│ Agent Status                                         │
├─────────────────────────────────────────────────────┤
│ 🎹 カエデ (Pane %2)   [✅ 正常] Last ping: 12:34:30 │
│ 🎺 サクラ (Pane %5)   [✅ 正常] Last ping: 12:34:35 │
│ 🥁 ツバキ (Pane %3)   [⚠️ 遅延] Last ping: 12:33:10 │
│ 🎷 ボタン (Pane %4)   [✅ 正常] Last ping: 12:34:45 │
└─────────────────────────────────────────────────────┘

📈 Statistics:
  - Uptime: 2h 15m
  - Total pings sent: 120
  - Successful responses: 118
  - Failed responses: 2
  - Auto-recoveries: 1 (ツバキ)

🔔 Recent Events:
  [12:30:15] ツバキ応答なし検出
  [12:30:45] ツバキ自動復旧開始
  [12:31:00] ツバキ復旧成功
```

---

## ⚙️ 設定

### 環境変数

```bash
# 監視間隔（秒）
WATER_SPIDER_INTERVAL=60

# ping応答タイムアウト（秒）
WATER_SPIDER_PING_TIMEOUT=30

# 自動復旧試行回数
WATER_SPIDER_RECOVERY_ATTEMPTS=3

# ログローテーション（日）
WATER_SPIDER_LOG_RETENTION=7
```

---

## 🚀 起動方法

### 手動起動

```bash
# Water Spider pane作成
tmux split-window -v

# 監視スクリプト実行
cd /Users/shunsuke/Dev/miyabi-private
./scripts/water-spider-monitor.sh
```

### 自動起動（tmux session起動時）

`~/.tmux.conf` に追加：

```tmux
# Miyabi Orchestra自動セットアップ
bind-key M-o run-shell "~/Dev/miyabi-private/scripts/miyabi-orchestra-auto-start.sh"
```

---

## 📝 ログ

**ログファイル**: `.ai/logs/water-spider.log`

**ログ形式**:
```
[2025-11-03 12:34:56] [Water Spider] 🕷️ 監視開始
[2025-11-03 12:35:00] [Water Spider] 📊 監視サイクル #1 開始
[2025-11-03 12:35:01] [Water Spider] 🏓 カエデにping送信
[2025-11-03 12:35:02] [Water Spider] 🏓 サクラにping送信
[2025-11-03 12:35:03] [Water Spider] 🏓 ツバキにping送信
[2025-11-03 12:35:04] [Water Spider] 🏓 ボタンにping送信
[2025-11-03 12:35:35] [Water Spider] ✅ カエデ応答確認
[2025-11-03 12:35:36] [Water Spider] ✅ サクラ応答確認
[2025-11-03 12:35:37] [Water Spider] ⚠️ ツバキ応答なし（30秒経過）
[2025-11-03 12:35:38] [Water Spider] 🔧 ツバキ復旧開始
[2025-11-03 12:35:50] [Water Spider] ✅ ツバキ復旧成功
```

---

## 💡 ベストプラクティス

1. **定期的なログ確認**: `tail -f .ai/logs/water-spider.log`
2. **ダッシュボード監視**: Water Spider paneを常に表示
3. **自動復旧失敗時の対応**: 手動で `/clear` → 再起動
4. **監視間隔調整**: 負荷に応じて60秒～180秒の範囲で調整
5. **ログローテーション**: 週次で古いログを圧縮

---

## 🔗 関連ドキュメント

- **Agent Control**: `.claude/agents/tmux_agents_control.md`
- **Session End Hooks**: `.claude/SESSION_END_HOOKS_GUIDE.md`
- **Codex Integration**: `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md`

---

**🕷️ Water Spider Agent - Always Watching, Always Ready**

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Maintained by**: Miyabi Team
