# ADB Integration - Pixel Maestro Remote Control

**Version**: 1.0.0
**Created**: 2025-11-17
**Purpose**: Mac Orchestrator ↔ Pixel Maestro 双方向制御

---

## 🎯 Overview

ADBを使うことで、Mac Orchestrator（Layer 2）から Pixel Maestro（Layer 1）を直接制御できます。

```
従来の一方向通信:
Mac → GitHub → Workflow → Lark → Pixel
        (Pixelは受動的に通知を受け取るのみ)

ADB統合後の双方向通信:
Mac ←→ ADB ←→ Pixel
    (能動的制御・ステータス取得・リモート実行)
```

---

## 🚀 Quick Start

### 1. Pixelの準備

**開発者オプション有効化**:
```
Settings → About phone → Build number (7回タップ)
```

**ワイヤレスデバッグ有効化**:
```
Settings → Developer options
├─ USB debugging: ON
└─ Wireless debugging: ON
   └─ Pair device with pairing code
```

### 2. 初回接続

```bash
cd ~/Dev/01-miyabi/_core/miyabi-private

# 初回のみ: ペアリングコードを使って接続
./scripts/connect-pixel-adb.sh 123456

# 2回目以降: コードなしで接続
./scripts/connect-pixel-adb.sh
```

**出力例**:
```
🔌 Connecting to Pixel via Wireless ADB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 Connecting to 192.168.3.9:43215...
✅ Connected to Pixel successfully

📊 Device Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model: Pixel 8
Android: 14
Battery: 85%
IP: 192.168.3.9

✅ Termux installed
✅ Lark installed
```

---

## 🎮 基本コマンド

### ステータス確認

```bash
./scripts/pixel-maestro-control.sh status
```

**出力**:
```
📊 Pixel Maestro Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Device: Pixel 8
Android: 14
Battery: 85%
Status: 🔋 On Battery
IP: 192.168.3.9
✅ Termux: Running
✅ Lark: Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Termuxコマンド実行

```bash
# シンプルなコマンド
./scripts/pixel-maestro-control.sh termux "pwd"

# 複雑なコマンド
./scripts/pixel-maestro-control.sh termux "cd ~/miyabi-private && git status"

# Miyabi CLIの実行
./scripts/pixel-maestro-control.sh termux "miyabi status"
```

### スクリーンショット取得

```bash
# デフォルトファイル名
./scripts/pixel-maestro-control.sh screenshot

# カスタムファイル名
./scripts/pixel-maestro-control.sh screenshot maestro-dashboard.png
```

### アプリ起動

```bash
# Larkを開く
./scripts/pixel-maestro-control.sh open-lark

# Termuxを開く
./scripts/pixel-maestro-control.sh open-termux
```

### 通知送信

```bash
./scripts/pixel-maestro-control.sh notify "Workflow Complete" "Issue #1030 finished successfully"
```

### ログ収集

```bash
./scripts/pixel-maestro-control.sh logs

# 保存先: logs/pixel/logcat-YYYYMMDD-HHMMSS.log
```

### リアルタイム監視

```bash
./scripts/pixel-maestro-control.sh monitor

# 5秒ごとに自動更新
# Ctrl-Cで終了
```

---

## 🔄 Workflow統合

### GitHub ActionsからPixel制御

`.github/workflows/codex-autonomous-coordinator.yml`に追加:

```yaml
- name: Notify Pixel via ADB
  run: |
    # Connect to Pixel
    ./scripts/connect-pixel-adb.sh || true

    # Send notification
    ./scripts/pixel-maestro-control.sh notify \
      "Workflow Started" \
      "Issue #${{ env.ISSUE_NUMBER }} is now processing on ${{ runner.name }}"

    # Take screenshot of current state
    ./scripts/pixel-maestro-control.sh screenshot \
      workflow-start-${{ env.ISSUE_NUMBER }}.png

    # Upload screenshot as artifact
    - uses: actions/upload-artifact@v4
      with:
        name: pixel-screenshot-${{ env.ISSUE_NUMBER }}
        path: workflow-start-${{ env.ISSUE_NUMBER }}.png
```

### Macからの自動制御

**cron job設定**:

```bash
# Edit crontab
crontab -e

# Add entries:
# 毎時Pixel接続を確認
0 * * * * cd ~/Dev/01-miyabi/_core/miyabi-private && ./scripts/connect-pixel-adb.sh > /dev/null 2>&1

# 毎朝9時にステータス通知
0 9 * * * cd ~/Dev/01-miyabi/_core/miyabi-private && ./scripts/pixel-maestro-control.sh notify "Good Morning" "$(./scripts/pixel-maestro-control.sh miyabi summary)"
```

---

## 📊 高度な使用例

### 1. リモートMiyabi実行

```bash
#!/bin/bash
# Pixel上でMiyabiコマンドを実行し、結果を取得

RESULT=$(./scripts/pixel-maestro-control.sh termux "cd ~/miyabi-private && miyabi status --json")

echo "Pixel Miyabi Status: $RESULT"
```

### 2. バッテリー監視

```bash
#!/bin/bash
# Pixelのバッテリーが20%以下になったら警告

BATTERY=$(adb shell dumpsys battery | grep level | awk '{print $2}')

if [ $BATTERY -lt 20 ]; then
    echo "⚠️  Pixel battery low: ${BATTERY}%"

    # Larkに通知
    # (Lark MCP経由)
    claude --print "Send Lark notification: Pixel battery is at ${BATTERY}%"
fi
```

### 3. 自動スクリーンショット記録

```bash
#!/bin/bash
# ワークフロー実行前後のPixel画面を記録

ISSUE_NUM=$1

# 実行前
./scripts/pixel-maestro-control.sh screenshot "before-${ISSUE_NUM}.png"

# ワークフロー実行
gh workflow run codex-autonomous-coordinator.yml -f issue_number=$ISSUE_NUM

# 30秒待機
sleep 30

# 実行後
./scripts/pixel-maestro-control.sh screenshot "after-${ISSUE_NUM}.png"

echo "Screenshots saved: before-${ISSUE_NUM}.png, after-${ISSUE_NUM}.png"
```

### 4. Termuxセッション管理

```bash
#!/bin/bash
# Termuxでtmuxセッションを開始/接続

SESSION_NAME="miyabi-monitor"

./scripts/pixel-maestro-control.sh termux "
    if tmux has-session -t $SESSION_NAME 2>/dev/null; then
        tmux attach -t $SESSION_NAME
    else
        tmux new-session -d -s $SESSION_NAME
        tmux send-keys -t $SESSION_NAME 'cd ~/miyabi-private' C-m
        tmux send-keys -t $SESSION_NAME 'miyabi watch' C-m
        tmux attach -t $SESSION_NAME
    fi
"
```

---

## 🔐 セキュリティ

### ADB接続の保護

```bash
# ADB over TCP uses no encryption by default
# For production, use SSH tunnel:

# On Pixel (Termux):
sshd

# On Mac:
ssh -L 5037:localhost:5037 -p 8022 u0_a336@192.168.3.9

# Then use ADB through tunnel:
adb connect localhost:5037
```

### 認証管理

```bash
# Revoke all ADB authorizations (Pixel):
Settings → Developer options → Revoke USB debugging authorizations

# Re-authorize only trusted devices
```

---

## 🐛 トラブルシューティング

### 問題1: 接続できない

```bash
# デバイス確認
adb devices

# 出力が空の場合:
# 1. Pixelのワイヤレスデバッグが有効か確認
# 2. 同じネットワークに接続しているか確認
# 3. ファイアウォール設定を確認

# adbサーバー再起動
adb kill-server
adb start-server
```

### 問題2: "unauthorized"エラー

```bash
# Pixelで認証ダイアログを確認
# "常に許可する"をチェックして"OK"をタップ

# それでもダメな場合:
adb kill-server
rm ~/.android/adbkey*
adb start-server
./scripts/connect-pixel-adb.sh
```

### 問題3: "device offline"

```bash
# Pixel再起動
adb reboot

# または手動で再起動後:
./scripts/connect-pixel-adb.sh
```

### 問題4: Termuxコマンドが実行されない

```bash
# Termux:API がインストールされているか確認
adb shell pm list packages | grep termux.api

# なければインストール:
# F-Droid or Play Store から Termux:API をインストール

# Termux内でAPIパッケージをインストール:
adb shell "am broadcast \
    -a com.termux.RUN_COMMAND \
    --es com.termux.RUN_COMMAND_PATH '/data/data/com.termux/files/usr/bin/pkg' \
    --esa com.termux.RUN_COMMAND_ARGUMENTS 'install,termux-api'"
```

---

## 📊 パフォーマンス最適化

### バッテリー消費を抑える

```bash
# ワイヤレスADBは電力を消費するため、
# 不要時は無効化:

# 無効化
adb shell settings put global adb_enabled 0

# 有効化
adb shell settings put global adb_enabled 1
```

### 接続の永続化

```bash
# ADB接続は時間経過で切れることがあるため、
# keepalive設定:

# ~/.android/adb_usb.ini に追加:
echo "0x18d1" >> ~/.android/adb_usb.ini

# または、定期的に再接続するcron job:
*/15 * * * * cd ~/Dev/01-miyabi/_core/miyabi-private && ./scripts/connect-pixel-adb.sh > /dev/null 2>&1
```

---

## 🎯 使用シナリオ

### シナリオ1: Mac作業中にPixel状態確認

```bash
# 作業の合間に
./scripts/pixel-maestro-control.sh status

# 出力:
# ✅ Termux: Running
# ✅ Lark: Running
# Battery: 65%

# OK、問題なし
```

### シナリオ2: ワークフロー実行前の準備

```bash
# Pixelを最適な状態にセットアップ
./scripts/pixel-maestro-control.sh open-lark
./scripts/pixel-maestro-control.sh notify "Preparing" "Workflow will start in 10 seconds"

sleep 10

# ワークフロー実行
gh workflow run codex-autonomous-coordinator.yml -f issue_number=1030
```

### シナリオ3: 緊急時のリモートログ収集

```bash
# 問題発生時、Pixelに物理アクセスせずにログ収集
./scripts/pixel-maestro-control.sh logs

# スクリーンショットも取得
./scripts/pixel-maestro-control.sh screenshot emergency-$(date +%Y%m%d-%H%M%S).png

# Pixelのシステム情報を取得
adb shell dumpsys > emergency-dumpsys.txt

# 全てを圧縮して保存
tar czf emergency-logs-$(date +%Y%m%d-%H%M%S).tar.gz logs/pixel/*.log *.png *.txt
```

---

## 🔄 統合フロー

### 完全な自動化フロー

```
1. ユーザーがMacでコマンド実行:
   $ miyabi execute 1030

2. Mac Orchestrator:
   ├─ Pixel接続確認 (ADB)
   ├─ Pixelステータス取得
   ├─ GitHub Workflowトリガー
   └─ Pixelに開始通知送信 (ADB)

3. Workflow実行 (MUGEN/MAJIN):
   ├─ タスク処理
   ├─ 進捗をPixelに通知 (ADB経由)
   └─ 完了

4. 結果報告:
   ├─ GitHub Issueにコメント
   ├─ Pixelに完了通知 (ADB + Lark)
   └─ スクリーンショット取得・保存 (ADB)
```

---

## 📚 関連ドキュメント

- [Pixel Maestro Usability Design](./obsidian-vault/architecture/2025-11-17-architecture-pixel-maestro-usability-design.md)
- [GitHub Actions Autonomous Execution](../.claude/docs/GITHUB_ACTIONS_AUTONOMOUS_EXECUTION.md)
- [PANTHEON_HIERARCHY](../miyabi_def/PANTHEON_HIERARCHY.md)

---

## 🚀 次のステップ

1. **Pixel側のTermux設定**:
   ```bash
   # Termux:APIのインストール
   pkg install termux-api

   # Miyabi CLIのインストール
   cd ~/miyabi-private
   cargo install --path crates/miyabi-cli
   ```

2. **自動化スクリプトの作成**:
   - 定期的なステータスチェック
   - バッテリー監視
   - 自動ログ収集

3. **Dashboard統合**:
   - Pixel画面のリアルタイム表示
   - Web UIでの遠隔操作
   - メトリクス可視化

---

**Version**: 1.0.0
**Status**: Operational
**Last Updated**: 2025-11-17

🌸 **Miyabi Society - ADB-Powered Remote Control** 🌸
