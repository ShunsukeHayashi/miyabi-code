# 🪝 Miyabi Orchestra - Session End Hooks Guide

**自動報告システム - セッション終了時のオーケストレーション**

---

## 🎯 概要

Miyabi Orchestraの各Agentは、セッション終了時に自動的にConductorに作業状況を報告します。また、Conductorがシャットダウンする際は、全Agentに作業保存指示を自動送信します。

---

## 📁 システム構成

### 1. フック設定ファイル

**場所**: `.claude/hooks.json`

```json
{
  "sessionEnd": {
    "description": "Session end hook for Miyabi Orchestra - Auto-report to Conductor",
    "command": "bash",
    "args": [
      "-c",
      "source ~/.miyabi_hooks.sh && miyabi_session_end_report"
    ]
  },
  "sessionStart": {
    "description": "Session start hook for Miyabi Orchestra",
    "command": "bash",
    "args": [
      "-c",
      "source ~/.miyabi_hooks.sh && miyabi_session_start_notify"
    ]
  }
}
```

### 2. フックスクリプト

**場所**: `~/.miyabi_hooks.sh`

**主要関数**:
1. `miyabi_session_end_report` - Agent終了時の自動報告
2. `miyabi_conductor_shutdown` - Conductor終了時の全Agent通知
3. `miyabi_session_start_notify` - セッション開始ログ記録
4. `miyabi_voicevox_notify` - VOICEVOX音声通知（オプション）

### 3. ログファイル

**セッション終了ログ**: `.ai/logs/orchestra-session-end.log`
**セッション開始ログ**: `.ai/logs/orchestra-session-start.log`

---

## 🔄 動作フロー

### Agent終了時

```
Agent (カエデ/サクラ/ツバキ/ボタン)
  ↓ セッション終了
  ↓ sessionEndフック発動
  ↓ miyabi_session_end_report実行
  ↓ 現在のpane IDを判定
  ↓ Agent名を特定
  ↓ Conductor (%1) にメッセージ送信
  ↓
"[カエデ] セッション終了 - 作業完了報告"
  ↓
Conductor に表示される
  ↓
ログファイルに記録
```

### Conductor終了時

```
Conductor (%1)
  ↓ セッション終了
  ↓ sessionEndフック発動
  ↓ miyabi_conductor_shutdown実行
  ↓ 全Agent (%2, %5, %3, %4) に順次送信
  ↓
"Conductorがセッションを終了します。
 現在の作業を保存して、進捗状況を報告してください。
 完了したら [Agent名] 作業保存完了 と発言してください。"
  ↓
各Agentに表示される
  ↓
ログファイルに記録
```

---

## ⚙️ セットアップ確認

### 1. フックスクリプトの確認

```bash
ls -la ~/.miyabi_hooks.sh
# 実行権限があることを確認
# -rwxr-xr-x ... .miyabi_hooks.sh
```

### 2. フック設定の確認

```bash
cat .claude/hooks.json | jq
# 正しいJSON形式であることを確認
```

### 3. ログディレクトリの確認

```bash
ls -la .ai/logs/
# orchestra-session-end.log と orchestra-session-start.log が作成されることを確認
```

### 4. 関数のテスト

```bash
source ~/.miyabi_hooks.sh
type miyabi_session_end_report
type miyabi_conductor_shutdown
type miyabi_session_start_notify
```

---

## 🧪 動作テスト

### Test 1: Agent終了時の自動報告

**手順**:
1. カエデ (pane %2) でClaude Codeセッションを開始
2. 簡単なタスクを実行
3. セッションを終了（`Ctrl+D` または `/exit`）
4. Conductor (pane %1) に "[カエデ] セッション終了 - 作業完了報告" が表示されることを確認

**期待される動作**:
```
Conductor pane (%1) に以下が表示される:
[カエデ] セッション終了 - 作業完了報告
```

**ログ確認**:
```bash
tail -5 .ai/logs/orchestra-session-end.log
```

### Test 2: Conductor終了時の全Agent通知

**手順**:
1. Conductor (pane %1) でセッションを終了
2. 各Agent pane (%2, %5, %3, %4) に作業保存指示が送信されることを確認

**期待される動作**:
```
各Agent paneに以下が表示される:
Conductorがセッションを終了します。現在の作業を保存して、進捗状況を報告してください。
完了したら [Agent名] 作業保存完了 と発言してください。
```

**ログ確認**:
```bash
tail -5 .ai/logs/orchestra-session-end.log
# "Conductor shutdown - 全Agentに作業保存指示送信" を確認
```

---

## 🎛️ カスタマイズ

### Agent pane IDの変更

`~/.miyabi_hooks.sh` の以下の部分を編集：

```bash
# Agent名判定
case "$current_pane" in
    "%2")
        agent_name="カエデ"
        ;;
    "%5")
        agent_name="サクラ"
        ;;
    "%3")
        agent_name="ツバキ"
        ;;
    "%4")
        agent_name="ボタン"
        ;;
    # 新しいAgentを追加する場合
    "%6")
        agent_name="新Agent名"
        ;;
esac
```

### 報告メッセージのカスタマイズ

```bash
# デフォルト
local report_message="[$agent_name] セッション終了 - 作業完了報告"

# カスタマイズ例
local report_message="[$agent_name] 🎉 タスク完了！次のタスクをお願いします！"
```

### VOICEVOX音声通知の有効化

フックスクリプト内で `miyabi_voicevox_notify` 関数を呼び出す：

```bash
# Agent終了時に音声通知
miyabi_voicevox_notify "${agent_name}のタスクが完了したのだ！" 3

# Conductor終了時に音声通知
miyabi_voicevox_notify "オーケストラシャットダウンするのだ！" 3
```

---

## 🚨 トラブルシューティング

### 問題1: フックが発動しない

**確認**:
```bash
# 1. フックスクリプトの実行権限
ls -la ~/.miyabi_hooks.sh

# 2. フック設定ファイルの存在
ls -la .claude/hooks.json

# 3. Claude Code設定ディレクトリ
ls -la ~/.config/claude/
```

**解決策**:
```bash
# 実行権限を付与
chmod +x ~/.miyabi_hooks.sh

# シンボリックリンク作成（必要に応じて）
ln -s /Users/shunsuke/Dev/miyabi-private/.claude/hooks.json ~/.config/claude/hooks.json
```

### 問題2: Conductorにメッセージが届かない

**確認**:
```bash
# Conductor pane IDが正しいか確認
tmux list-panes -F "#{pane_index}: #{pane_id}"
# pane %1 が存在することを確認
```

**解決策**:
`~/.miyabi_hooks.sh` の `conductor_pane="%1"` を実際のpane IDに変更

### 問題3: ログファイルが作成されない

**確認**:
```bash
# ログディレクトリの存在確認
ls -la .ai/logs/

# 書き込み権限の確認
ls -ld .ai/logs/
```

**解決策**:
```bash
# ディレクトリ作成
mkdir -p .ai/logs

# 権限付与
chmod 755 .ai/logs
```

---

## 📖 関連ドキュメント

- **Agent Control**: `.claude/agents/tmux_agents_control.md`
- **Codex Integration**: `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md`
- **Advanced Techniques**: `.claude/TMUX_ADVANCED_TECHNIQUES.md`
- **Full Index**: `.claude/TMUX_INTEGRATION_INDEX.md`

---

## 💡 ベストプラクティス

1. **定期的なログ確認**: `tail -f .ai/logs/orchestra-session-end.log` で リアルタイム監視
2. **Agent名の統一**: 必ず `[Agent名]` 形式で報告する
3. **作業保存の徹底**: Conductor終了通知を受けたら、必ず作業を保存してから報告
4. **ログローテーション**: 定期的に古いログを削除または圧縮
5. **フックスクリプトのバックアップ**: `~/.miyabi_hooks.sh` のバックアップを作成

---

**🪝 Miyabi Orchestra - Session End Hooks完全ガイド**

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Maintained by**: Miyabi Team
