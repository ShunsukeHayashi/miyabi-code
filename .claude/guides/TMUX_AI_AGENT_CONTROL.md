# TMUX AI Agent Control Playbook

**Last Updated**: 2025-11-04  
**Maintainers**: Miyabi Orchestrator Team

---

## 🎯 目的

Miyabi の AI エージェントが tmux セッションを安全かつ再現性高く制御するための要点をまとめた内部用プレイブックです。詳細な運用手順は `/docs/TMUX_AI_AGENT_CONTROL_GUIDE.md` を参照してください。本書では Claude Code／Codex スキルから tmux を操作する際に守るべきプロトコルと連携図のみを抜粋します。

---

## 1. 標準セッションと役割

| セッション | 用途 | 主要ウィンドウ | 備考 |
|------------|------|----------------|------|
| `miyabi-auto-dev` | 完全自律モード (Infinity) | `Monitor`, `Design` | Water Spider v2.0 が再接続を管理 |
| `Miyabi` | 手動 orchestrator | `1:Conductor`, `2:Business`, `3:Monitor` | Claude Code で直接操る際の標準構成 |
| `kamui` 系 | 開発者個別セッション | 任意 | Prefix `Ctrl-a` (Kamui) |

- ペイン ID は `tmux list-panes -a -F "#{pane_id} #{session_name}:#{window_name}"` で取得し、**pane_id (%番号)** を指定して送信します。  
- セッション命名規約を変更する場合は `.claude/agents/tmux_agents_control.md` と本書を更新してください。

---

## 2. コマンド送信プロトコル

```bash
# 1指示1コマンド + 100ms待機 + Enter
 tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。..." \
   && sleep 0.1 && tmux send-keys -t %4 Enter
```

1. 先頭で `cd` を実行し、ワークスペースを明示。  
2. 連投による制御文字化を防ぐため、必ず `sleep 0.1` を挟んで `Enter`。  
3. ログ解析前には `/clear` を送信して区切りを明確化。  
4. フォールバック時は `tmux capture-pane -t %pane -p | tail -n 40` で直近ログを取得。  

---

## 3. 自動化シナリオ例

| シナリオ | コマンド例 | 補足 |
|----------|------------|------|
| オーケストラ一括起動 | `./scripts/miyabi-orchestra.sh coding-ensemble` | 6 Agent を並列召喚 (Conductor + Coding Agents) |
| 個別エージェント準備確認 | `あなたは「カエデ」です。準備OK と報告してください` | 報告の有無を `capture-pane` で検証 |
| Infinity Mode 起動 | `./scripts/miyabi-orchestra.sh infinity` または `miyabi infinity` | `miyabi-auto-dev` セッションを再生成 |
| 制御モード | `tmux -CC attach -t miyabi-auto-dev` | JSON風イベントをリアルタイム取得（高度な自動化向け） |

補足: 具体的なログ解析・エラー処理手順は `/docs/TMUX_AI_AGENT_CONTROL_GUIDE.md` の「自動化パターン」「デバッグ」節に集約されています。

---

## 4. トラブルシュート要約

- **セッションが見つからない**: `tmux ls` → 不要なソケットは `tmux kill-session -t <name>` で整理。  
- **レスポンスが無いペイン**: `/clear` → 再指示 → 反応なしなら `tmux kill-pane -t %pane`。  
- **ログ調査**: `tmux -vv new` で詳細ログを吐き出し、`tmux-client-*.log` を解析。  
- **C-b Prefix 関連**: Kamui セッションでは Prefix=Ctrl-a。ガイドではすべて標準 C-b で記載されているため、環境に合わせて読み替え。  

---

## 5. 周辺ドキュメント

- `/docs/TMUX_AI_AGENT_CONTROL_GUIDE.md` … フル仕様と実装例  
- `.claude/agents/tmux_agents_control.md` … Agent 別 tmux pane 割当と運用  
- `.claude/TMUX_OPERATIONS.md` … 人間オペレーター向け操作手順  
- `.claude/Miyabi_ORCHESTRA_INTEGRATION.md` … 全体アーキテクチャ  

この Playbook に追加すべきナレッジがあれば、PR または `.claude/agents/tmux_agents_control.md` の更新と合わせて反映してください。
