# 📱 Pixel 9 Pro XL - Full Automation Setup Guide

**Version**: 1.0
**Date**: 2025-11-20
**Target**: Pixel 9 Pro XL + Termux

---

## 🎯 Overview

Pixel 9 Pro XLを**完全自動化端末**に改造するための完全ガイド。

**実現する機能**:
- ✅ WiFi接続時に自動でMiyabi開発環境起動
- ✅ バッテリー監視＆通知
- ✅ GitHub Issues自動監視＆P0アラート
- ✅ MUGEN/MAJIN接続管理
- ✅ バックグラウンドサービス管理
- ✅ ホーム画面ウィジェットからワンタップ操作

---

## 📋 Phase 1: アプリインストール

### 1.1 Google Playからインストール

```
必須アプリ (5個):
1. Tasker (有料 ¥400程度) - 自動化のコア
2. Termux:API (無料) - Android APIアクセス
3. Termux:Tasker (無料) - Tasker連携
4. Termux:Widget (無料) - ホーム画面ウィジェット
5. Termux:Boot (無料・オプション) - 起動時自動実行
```

**インストールURL**:
- Tasker: https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm
- Termux:API: https://play.google.com/store/apps/details?id=com.termux.api
- Termux:Tasker: https://play.google.com/store/apps/details?id=com.termux.tasker
- Termux:Widget: https://play.google.com/store/apps/details?id=com.termux.widget

### 1.2 Termuxパッケージインストール

Termux起動後、以下を実行：

```bash
# パッケージ更新
pkg update && pkg upgrade -y

# 必要なパッケージインストール
pkg install -y termux-api jq git openssh rsync curl wget

# 確認
termux-api-list
```

---

## 🏗️ Phase 2: ディレクトリ構造作成

Termux上で実行：

```bash
# 自動化用ディレクトリ作成
mkdir -p ~/.termux/tasker
mkdir -p ~/.miyabi/automation/{services,triggers,monitors,logs,pids,state}
mkdir -p ~/.shortcuts

# 確認
ls -la ~/.termux ~/.miyabi ~/.shortcuts
```

---

## 📝 Phase 3: 自動化スクリプトセットアップ

### 3.1 オールインワンセットアップスクリプト

Termux上で以下を実行：

```bash
cat > ~/setup-automation.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
# Miyabi Pixel Full Automation Setup Script

set -e

echo "🚀 Setting up Miyabi Full Automation..."

# ディレクトリ作成
mkdir -p ~/.termux/tasker
mkdir -p ~/.miyabi/automation/{services,triggers,monitors,logs,pids,state}
mkdir -p ~/.shortcuts

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Miyabi Auto-Start Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cat > ~/.termux/tasker/miyabi-autostart.sh << 'AUTOSTART'
#!/data/data/com.termux/files/usr/bin/bash
LOG_FILE=~/.miyabi/automation/logs/autostart-$(date +%Y%m%d).log
exec > >(tee -a "$LOG_FILE") 2>&1

echo "═══════════════════════════════════════════════════════"
echo "🚀 Miyabi Auto-Start - $(date)"
echo "═══════════════════════════════════════════════════════"

termux-notification -t "🎼 Miyabi Orchestra" -c "開発環境起動中..."

# Network check
if ! ping -c 1 8.8.8.8 &>/dev/null; then
  termux-notification -t "❌ Miyabi" -c "ネットワーク接続なし"
  exit 1
fi

# Git sync
cd ~/Dev/miyabi-private
git pull || (git stash && git pull && git stash pop)

# MUGEN connection
if ssh -o ConnectTimeout=5 mugen "echo OK" &>/dev/null; then
  echo "✅ MUGEN connected"
  ssh mugen "cd ~/miyabi-private && nohup cargo build > build.log 2>&1 &" &
  termux-notification -t "🎼 Miyabi" -c "MUGEN同期完了・ビルド開始"
fi

# System status
echo "📊 System Status:"
echo "  Battery: $(termux-battery-status | jq -r '.percentage')%"
echo "  WiFi: $(termux-wifi-connectioninfo | jq -r '.ssid')"

termux-notification -t "✅ Miyabi Ready" -c "開発環境準備完了" --vibrate "100,50,100" --sound
termux-tts-speak "Miyabi development environment is ready"

echo "✅ Auto-start completed"
AUTOSTART

chmod +x ~/.termux/tasker/miyabi-autostart.sh
echo "✅ Created: miyabi-autostart.sh"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. Battery Monitor Service
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cat > ~/.miyabi/automation/services/battery-monitor.sh << 'BATTERY'
#!/data/data/com.termux/files/usr/bin/bash
LOG_FILE=~/.miyabi/automation/logs/battery-$(date +%Y%m%d).log

while true; do
  BATTERY=$(termux-battery-status)
  LEVEL=$(echo "$BATTERY" | jq -r '.percentage')
  STATUS=$(echo "$BATTERY" | jq -r '.status')

  echo "[$(date '+%H:%M:%S')] Battery: ${LEVEL}% | Status: $STATUS" >> "$LOG_FILE"

  # Low battery warning
  if [ "$LEVEL" -le 20 ] && [ "$STATUS" != "CHARGING" ]; then
    termux-notification -t "⚠️ Battery Low" -c "バッテリー ${LEVEL}% - 充電してください" \
      --priority max --vibrate "500,200,500" --sound
    termux-tts-speak "Battery low. Please charge the device."
  fi

  # Critical battery
  if [ "$LEVEL" -le 10 ] && [ "$STATUS" != "CHARGING" ]; then
    termux-notification -t "🔴 Critical Battery" -c "バッテリー ${LEVEL}% - 緊急充電必要" \
      --priority max --vibrate "1000,500,1000"
  fi

  # Fully charged
  if [ "$LEVEL" -eq 100 ] && [ "$STATUS" = "CHARGING" ]; then
    termux-notification -t "✅ Fully Charged" -c "充電完了" --vibrate "200,100,200"
    termux-tts-speak "Battery fully charged"
  fi

  sleep 600  # Check every 10 minutes
done
BATTERY

chmod +x ~/.miyabi/automation/services/battery-monitor.sh
echo "✅ Created: battery-monitor.sh"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. GitHub Issues Monitor
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cat > ~/.miyabi/automation/services/github-monitor.sh << 'GITHUB'
#!/data/data/com.termux/files/usr/bin/bash
LOG_FILE=~/.miyabi/automation/logs/github-$(date +%Y%m%d).log
STATE_FILE=~/.miyabi/automation/state/github-last-check.json

while true; do
  cd ~/Dev/miyabi-private

  ISSUES=$(gh issue list --limit 5 --state open --json number,title,labels,createdAt 2>/dev/null || echo '[]')

  if [ -f "$STATE_FILE" ]; then
    LAST_CHECK=$(cat "$STATE_FILE")
    NEW_ISSUES=$(echo "$ISSUES" | jq -r --argjson last "$LAST_CHECK" \
      '.[] | select(.createdAt > ($last[0].createdAt // "2000-01-01")) | "#\(.number): \(.title)"')

    if [ -n "$NEW_ISSUES" ]; then
      echo "[$(date)] New issues: $NEW_ISSUES" >> "$LOG_FILE"
      termux-notification -t "📋 New Miyabi Issue" -c "$NEW_ISSUES" --vibrate "200"
      termux-tts-speak "New issue detected"
    fi
  fi

  echo "$ISSUES" > "$STATE_FILE"

  # Check P0 Critical
  CRITICAL=$(echo "$ISSUES" | jq -r '.[] | select(.labels[]?.name | contains("P0")) | "#\(.number): \(.title)"')
  if [ -n "$CRITICAL" ]; then
    termux-notification -t "🔥 P0 Critical Issue" -c "$CRITICAL" \
      --priority max --vibrate "500,200,500" --sound
    termux-tts-speak "Critical priority issue detected"
  fi

  sleep 1800  # Check every 30 minutes
done
GITHUB

chmod +x ~/.miyabi/automation/services/github-monitor.sh
echo "✅ Created: github-monitor.sh"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. Automation Master Control
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cat > ~/.termux/tasker/automation-master.sh << 'MASTER'
#!/data/data/com.termux/files/usr/bin/bash

ACTION="${1:-start}"
LOG_DIR=~/.miyabi/automation/logs
PID_DIR=~/.miyabi/automation/pids

mkdir -p "$LOG_DIR" "$PID_DIR"

start_service() {
  local name="$1"
  local script="$2"
  local pid_file="$PID_DIR/${name}.pid"

  if [ -f "$pid_file" ] && kill -0 $(cat "$pid_file") 2>/dev/null; then
    echo "⚠️  $name already running"
    return
  fi

  nohup bash "$script" > "$LOG_DIR/${name}.log" 2>&1 &
  echo $! > "$pid_file"
  echo "✅ $name started (PID: $!)"
}

stop_service() {
  local name="$1"
  local pid_file="$PID_DIR/${name}.pid"

  if [ -f "$pid_file" ]; then
    kill $(cat "$pid_file") 2>/dev/null && echo "✅ $name stopped" || echo "⚠️  $name not running"
    rm "$pid_file"
  fi
}

case "$ACTION" in
  start)
    echo "🚀 Starting Miyabi Automation Services..."
    start_service "battery-monitor" ~/.miyabi/automation/services/battery-monitor.sh
    start_service "github-monitor" ~/.miyabi/automation/services/github-monitor.sh
    termux-notification -t "🎼 Miyabi Automation" -c "全サービス起動完了"
    ;;
  stop)
    echo "🛑 Stopping services..."
    stop_service "battery-monitor"
    stop_service "github-monitor"
    termux-notification -t "🎼 Miyabi Automation" -c "全サービス停止完了"
    ;;
  status)
    echo "📊 Service Status:"
    for pid_file in "$PID_DIR"/*.pid; do
      [ -f "$pid_file" ] || continue
      name=$(basename "$pid_file" .pid)
      pid=$(cat "$pid_file")
      kill -0 "$pid" 2>/dev/null && echo "● $name running (PID: $pid)" || echo "○ $name stopped"
    done
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    BATTERY=$(termux-battery-status 2>/dev/null || echo '{"percentage":0}')
    echo "🔋 Battery: $(echo $BATTERY | jq -r '.percentage')%"
    WIFI=$(termux-wifi-connectioninfo 2>/dev/null || echo '{"ssid":"N/A"}')
    echo "📡 WiFi: $(echo $WIFI | jq -r '.ssid')"
    ;;
  *)
    echo "Usage: $0 {start|stop|status}"
    ;;
esac
MASTER

chmod +x ~/.termux/tasker/automation-master.sh
echo "✅ Created: automation-master.sh"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. Widget Shortcuts
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cat > ~/.shortcuts/miyabi-start.sh << 'WIDGET1'
#!/data/data/com.termux/files/usr/bin/bash
~/.termux/tasker/miyabi-autostart.sh
WIDGET1

cat > ~/.shortcuts/automation-status.sh << 'WIDGET2'
#!/data/data/com.termux/files/usr/bin/bash
~/.termux/tasker/automation-master.sh status
WIDGET2

cat > ~/.shortcuts/services-start.sh << 'WIDGET3'
#!/data/data/com.termux/files/usr/bin/bash
~/.termux/tasker/automation-master.sh start
WIDGET3

cat > ~/.shortcuts/services-stop.sh << 'WIDGET4'
#!/data/data/com.termux/files/usr/bin/bash
~/.termux/tasker/automation-master.sh stop
WIDGET4

chmod +x ~/.shortcuts/*.sh
echo "✅ Created: 4 widget shortcuts"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Test scripts:"
echo "   ~/.termux/tasker/miyabi-autostart.sh"
echo "   ~/.termux/tasker/automation-master.sh status"
echo ""
echo "2. Add Termux:Widget to home screen"
echo "3. Configure Tasker profiles (see TASKER_PROFILES.md)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
EOF

chmod +x ~/setup-automation.sh
echo "✅ Setup script created!"
echo ""
echo "Run: bash ~/setup-automation.sh"
```

### 3.2 実行

```bash
bash ~/setup-automation.sh
```

---

## 🎨 Phase 4: Taskerプロファイル設定

Taskerアプリを開いて以下のプロファイルを作成：

### Profile 1: WiFi接続時にMiyabi起動

```
Profile: Home WiFi Connected
├─ Context: State → Net → Wifi Connected
│  └─ SSID: <your-home-wifi-name>
│
└─ Task: Miyabi AutoStart
   └─ Action: Plugin → Termux:Tasker
      └─ Configuration:
         - Script: miyabi-autostart.sh
         - Executable: ✓
```

### Profile 2: 起動時に自動化サービス開始

```
Profile: Boot Complete
├─ Context: Event → System → Device Boot
│
└─ Task: Start Automation Services
   └─ Action: Plugin → Termux:Tasker
      └─ Configuration:
         - Script: automation-master.sh start
         - Executable: ✓
```

### Profile 3: 充電開始時

```
Profile: Power Connected
├─ Context: State → Power → Power
│  └─ Source: Any
│
└─ Task: Miyabi Sync
   └─ Actions:
      1. Notify: "Miyabi同期開始"
      2. Plugin → Termux:Tasker
         - Script: miyabi-autostart.sh
```

### Profile 4: 毎朝8時にステータス確認

```
Profile: Morning Status
├─ Context: Time → From 08:00 To 08:01
│
└─ Task: Morning Report
   └─ Action: Plugin → Termux:Tasker
      └─ Configuration:
         - Script: automation-master.sh status
```

### Profile 5: 外出先から帰宅時（位置情報）

```
Profile: Arriving Home
├─ Context: State → Location → GPS
│  └─ Radius: 100m around home
│
└─ Task: Welcome Home
   └─ Actions:
      1. Say: "お帰りなさい。Miyabi環境を起動します"
      2. Plugin → Termux:Tasker
         - Script: miyabi-autostart.sh
```

---

## 🎯 Phase 5: Termux:Widget設定

### 5.1 ウィジェット追加

1. ホーム画面を長押し
2. ウィジェット → Termux:Widget を選択
3. 配置

### 5.2 利用可能なショートカット

ウィジェットに表示される：
- **miyabi-start** - Miyabi開発環境起動
- **automation-status** - ステータス確認
- **services-start** - 全サービス開始
- **services-stop** - 全サービス停止

---

## 🔧 Phase 6: 動作確認

### 6.1 手動テスト

```bash
# Miyabi起動テスト
~/.termux/tasker/miyabi-autostart.sh

# バッテリー監視テスト（バックグラウンド）
~/.miyabi/automation/services/battery-monitor.sh &

# GitHub監視テスト（バックグラウンド）
~/.miyabi/automation/services/github-monitor.sh &

# サービス状態確認
~/.termux/tasker/automation-master.sh status

# サービス停止
~/.termux/tasker/automation-master.sh stop
```

### 6.2 Taskerテスト

1. Taskerアプリを開く
2. プロファイルを選択
3. 「▶」ボタンでテスト実行

### 6.3 ログ確認

```bash
# 最新のログ確認
ls -lht ~/.miyabi/automation/logs/

# リアルタイムログ監視
tail -f ~/.miyabi/automation/logs/autostart-*.log
```

---

## 📊 完成状態

### 自動化される動作

✅ **WiFi接続時**:
- 自動でGit pull
- MUGEN/MAJIN接続確認
- ビルド開始（MUGEN）
- 通知＆音声フィードバック

✅ **バックグラウンド常時監視**:
- バッテリー状態（10分ごと）
- GitHub Issues（30分ごと）
- 低バッテリー/高温アラート
- P0 Critical Issue即時通知

✅ **ホーム画面ウィジェット**:
- ワンタップでMiyabi起動
- ワンタップでステータス確認
- サービスON/OFF切り替え

✅ **毎朝8時**:
- 自動ステータスレポート
- システムヘルスチェック

---

## 🛡️ トラブルシューティング

### Termux:APIが動かない

```bash
# パッケージ再インストール
pkg reinstall termux-api

# 権限確認
termux-api-list
```

### Taskerから実行できない

```bash
# Termux:Tasker権限確認
ls -la ~/.termux/tasker/

# 実行権限確認
chmod +x ~/.termux/tasker/*.sh
```

### サービスが起動しない

```bash
# PIDファイル削除
rm ~/.miyabi/automation/pids/*.pid

# 再起動
~/.termux/tasker/automation-master.sh restart
```

---

## 📚 参考資料

- Tasker公式: https://tasker.joaoapps.com/
- Termux:API: https://wiki.termux.com/wiki/Termux:API
- Termux:Tasker: https://wiki.termux.com/wiki/Termux:Tasker

---

**これでPixel 9 Pro XLは完全自動化端末になります！** 🎉
