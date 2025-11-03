# Miyabi Orchestra - Session End Hooks

**Version**: 1.0.0
**Last Updated**: 2025-11-03

## 🎯 概要

Miyabi Orchestraでのtmux並列実行時に、セッション終了タイミングで適切な通信を行うためのフック体系です。

## 📋 フック一覧

### 1. `orchestrator-session-end.sh`

**役割**: オーケストレーター（指揮者）セッション終了時の処理

**動作**:
1. 現在のtmuxセッション内の全paneを検出
2. 各エージェントpaneに最終報告指示を送信
3. Orchestra状態をJSON形式で保存
4. macOS通知を発行

**実行タイミング**: オーケストレーター（pane %1）が終了する時

**使用方法**:
```bash
# Claude Code終了時に自動実行される（設定後）
# または手動実行:
/Users/shunsuke/Dev/miyabi-private/.hooks/orchestrator-session-end.sh
```

---

### 2. `agent-session-end.sh`

**役割**: 各エージェント（作業者）セッション終了時の処理

**動作**:
1. 自分のpane IDとエージェント名を識別
2. オーケストレーターpane（%1）を検出
3. 完了報告をオーケストレーターに送信
4. 作業ログをJSON形式で保存

**実行タイミング**: 各エージェント（pane %2, %3, %4, %5）が終了する時

**使用方法**:
```bash
# Claude Code終了時に自動実行される（設定後）
# または手動実行:
/Users/shunsuke/Dev/miyabi-private/.hooks/agent-session-end.sh
```

---

## ⚙️ セットアップ

### 方法A: Claude Code設定ファイル経由（推奨）

**グローバル設定** (`~/.config/claude/settings.json`):
```json
{
  "hooks": {
    "sessionEnd": "/Users/shunsuke/Dev/miyabi-private/.hooks/agent-session-end.sh"
  }
}
```

**プロジェクトローカル設定** (`.claude/settings.json`):
```json
{
  "hooks": {
    "sessionEnd": {
      "orchestrator": "/Users/shunsuke/Dev/miyabi-private/.hooks/orchestrator-session-end.sh",
      "agent": "/Users/shunsuke/Dev/miyabi-private/.hooks/agent-session-end.sh"
    }
  }
}
```

### 方法B: tmux統合（フォールバック）

tmuxのpane終了時に自動実行:
```bash
# .tmux.confに追加
set-hook -g pane-exited 'run-shell "/Users/shunsuke/Dev/miyabi-private/.hooks/agent-session-end.sh"'
```

---

## 🔄 通信フロー

### オーケストレーター終了時

```
[オーケストレーター (Pane %1)]
         ↓ セッション終了
         ↓
[orchestrator-session-end.sh]
         ↓
         ├─→ [サクラ %2] "最終報告してください"
         ├─→ [ツバキ %5] "最終報告してください"
         ├─→ [スミレ %3] "最終報告してください"
         └─→ [アサガオ %4] "最終報告してください"
```

### エージェント終了時

```
[エージェント (Pane %2 - サクラ)]
         ↓ セッション終了
         ↓
[agent-session-end.sh]
         ↓
         └─→ [オーケストレーター %1] "[サクラ] 作業完了報告"
```

---

## 📊 ログ出力

### ログディレクトリ構造

```
.ai/logs/
├── hooks/
│   ├── orchestrator-session-end-20251103-063000.log
│   └── agent-session-end-20251103-063005.log
├── agent-reports/
│   ├── カエデ-20251103-063005.txt
│   └── サクラ-20251103-063010.txt
└── work-sessions/
    ├── カエデ-20251103-063005.json
    └── サクラ-20251103-063010.json
```

### 状態ファイル

**`.ai/orchestra-state.json`**:
```json
{
  "timestamp": "2025-11-03T06:30:00Z",
  "orchestrator_pane": "%1",
  "session": "1",
  "status": "orchestrator_ended",
  "message": "Orchestrator session ended, agents notified for final reports"
}
```

---

## 🧪 テスト方法

### 1. 単体テスト

```bash
# オーケストレーターフックのテスト
tmux new-session -d -s test-orchestra
tmux split-window -h
/Users/shunsuke/Dev/miyabi-private/.hooks/orchestrator-session-end.sh

# エージェントフックのテスト
/Users/shunsuke/Dev/miyabi-private/.hooks/agent-session-end.sh
```

### 2. 統合テスト

```bash
# Miyabi Orchestraセッションを起動
./scripts/miyabi-orchestra.sh coding-ensemble

# 各paneで作業後、Ctrl+D または /exit でセッション終了
# → フックが自動実行される
```

---

## 🚨 トラブルシューティング

### フックが実行されない

**確認項目**:
1. 実行権限: `chmod +x .hooks/*.sh`
2. tmuxセッション内で実行されているか
3. ログファイルの確認: `.ai/logs/hooks/`

### オーケストレーターに報告が届かない

**対処法**:
1. `.ai/orchestra-state.json` でオーケストレーターpane IDを確認
2. `tmux list-panes -t 1:1` で全paneの状態を確認
3. フォールバック: `.ai/logs/agent-reports/` にレポートが保存される

---

## 📝 カスタマイズ

### エージェント名の変更

`agent-session-end.sh` の `AGENT_MAP` を編集:

```bash
declare -A AGENT_MAP
AGENT_MAP[1]="CustomName1"
AGENT_MAP[2]="CustomName2"
# ...
```

### 通知方法の変更

macOS通知を無効化:
```bash
# osascript行をコメントアウト
# osascript -e 'display notification ...'
```

VOICEVOX統合:
```bash
# 通知部分に追加
curl -X POST "http://localhost:50021/audio_query?text=..."
```

---

## 🔗 関連ドキュメント

- [Miyabi Orchestra ガイド](../.claude/MIYABI_PARALLEL_ORCHESTRA.md)
- [tmux統合インデックス](../.claude/TMUX_INTEGRATION_INDEX.md)
- [エージェント仕様](./.claude/agents/specs/)

---

**このフック体系により、Miyabi Orchestraでの協調的なセッション終了が実現されます。**
