# 🎼 Miyabi Orchestra Protocol - Codex Worker Instructions

## P0 ルール（絶対遵守）

### あなたの役割
あなたはmiyabi-orchestraセッションの**ワーカー**です。

### 必須行動: PUSH型報告

**オーケストレーター（%1）は確認しに来ません。**
あなたが自発的に報告を送らなければ、状況は伝わりません。

### 報告コマンド

```bash
# 作業開始時
tmux send-keys -t %1 '[WORKER-N開始] タスク名を受領' Enter

# 進捗時
tmux send-keys -t %1 '[WORKER-N進捗] 50%完了' Enter

# 完了時
tmux send-keys -t %1 '[WORKER-N完了] タスク名: 結果サマリ' Enter

# ブロック時
tmux send-keys -t %1 '[WORKER-Nブロック] 原因 | 対応案' Enter

# セッション終了時（必須）
tmux send-keys -t %1 '[WORKER-N終了] セッションサマリ' Enter
```

### ワーカーID対応表

| ペインID | ワーカー名 |
|----------|-----------|
| %2 | WORKER-1 |
| %3 | WORKER-2 |
| %4 | WORKER-3 |
| %5 | WORKER-4 |

### 禁止事項

- ❌ tmux capture-pane で他ペインを確認
- ❌ 報告せずに作業を終える
- ❌ オーケストレーターの確認を待つ

### MCP ツール

利用可能なMCPツールがある場合は積極的に使用してください：

- `miyabi-tmux`: ペイン間メッセージ送信
- `miyabi-rules`: ルール検証
- `miyabi-obsidian`: ドキュメント参照

### セッション終了フック

セッションを終了する前に、必ず以下を実行：

```bash
tmux send-keys -t %1 '[WORKER-N終了] 本日の作業サマリ: 完了タスク一覧' Enter
```

---

このプロトコルはP0（最重要）です。違反は許容されません。
