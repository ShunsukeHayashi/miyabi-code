# Miyabi AI Agentによる tmux 制御ガイド

最終更新: 2025-11-04  
対象読者: Miyabi Orchestrator で tmux セッションを遠隔操作する AI Agent／自動化スクリプト

---

## 1. tmux と Miyabi の関係

tmux はクライアント・サーバーモデルのターミナルマルチプレクサです。  
1 つのサーバープロセスが `/tmp/tmux-<uid>/` のソケットで待機し、複数クライアント（人間・AI）からの接続を受け付けます。Miyabi では以下の用途で tmux を利用します。

- AI エージェントごとに独立したペイン／ウィンドウを用意し、CLI 操作ログをリアルタイムに監視。
- tmux `send-keys` 経由で Claude Code / Codex / Rust 実装スキルを遠隔実行。
- `capture-pane` で AI へログをフィードバックし、結果を解析・報告。

このガイドでは、AI Agent が tmux を安全かつ再現性高く操作するためのプロトコルをまとめます。

---

## 2. 前提条件

1. **tmux 3.3 以降推奨**  
   - `libevent 2.x` と `ncurses` が必須。macOS/Homebrew では `brew install tmux`。
2. **Miyabi ワークスペースの標準セッション**  
   - コーディング自動化: `miyabi-auto-dev`  
   - 手動オーケストレーション: `Miyabi`（Conductor + Coding Agents）  
   - セッション設計書: `.claude/agents/tmux_agents_control.md`
3. **AI エージェント側の実行権限**  
   - `tmux send-keys` を使う際は、コマンド実行後に `sleep 0.1` → `Enter` を送るプロトコルを厳守（連続入力で制御文字化する事故を防ぐ）。

---

## 3. セッションとペインの構成

| セッション | 用途 | 代表ウィンドウ | 備考 |
|------------|------|----------------|------|
| `miyabi-auto-dev` | 完全自動モード（Infinity Mode） | `Monitor` / `Design` など | Water Spider v2.0 が自動再接続 |
| `Miyabi` | 手動 orchestration | `1:Conductor`, `2:Business`, `3:Monitor` | Conductor が指揮、各Paneにカエデ/サクラ… |
| `kamui` 系 | 開発者個人用（Ctrl-a プレフィックス） | 任意 | 必要に応じ attach |

各ウィンドウのペイン ID は `tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_id}"` で確認します。  
Agent からペインを指定する際は **pane_id（例: `%2`）を使用** してください。

---

## 4. 基本操作（AI用コマンド例）

```bash
# セッション一覧
tmux ls

# セッションへアタッチ／デタッチ
tmux attach -t miyabi-auto-dev
# Ctrl-b d でデタッチ

# 既存セッションの破棄（安全確認後）
tmux kill-session -t miyabi-auto-dev
```

### ペインへの指示送信

```bash
# プロトコル: command && sleep 0.1 && Enter
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。..." \
  && sleep 0.1 && tmux send-keys -t %4 Enter
```

- コマンド先頭で `cd` を実行し、ワークディレクトリを明示（エージェントの混線防止）。
- `/clear` など履歴クリア指示も同プロトコルで送信。

### ログ取得

```bash
# 直近 40 行を取得
tmux capture-pane -t %4 -p | tail -n 40

# 活動ログを継続ウォッチ（AIエージェントが解析用に使用）
tmux capture-pane -t %4 -p -S -200
```

---

## 5. ペイン／ウィンドウ操作

| 操作 | キー | コマンド |
|------|------|----------|
| 水平分割 | `Ctrl-b "` | `tmux split-window -h` |
| 垂直分割 | `Ctrl-b %` | `tmux split-window -v` |
| ペイン切替 | `Ctrl-b o` | `tmux select-pane -t <target>` |
| ペイン移動 | `Ctrl-b {` / `Ctrl-b }` | `tmux swap-pane` |
| 新規ウィンドウ | `Ctrl-b c` | `tmux new-window -n <name>` |
| ウィンドウ切替 | `Ctrl-b n/p` | `tmux select-window -t <idx>` |
| ウィンドウ名変更 | `Ctrl-b ,` | `tmux rename-window '<name>'` |

AI が自動でペインを追加する場合は、既存レイアウトを崩さないよう分割パターンを明示してください。

---

## 6. 自動化パターン集

### 6.1 ワークフロー一括実行

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && ./scripts/miyabi-orchestra.sh coding-ensemble" \
  && sleep 0.1 && tmux send-keys -t %2 Enter
```

### 6.2 エージェントの準備確認

```bash
tmux send-keys -t %2 "あなたは「カエデ」です。[カエデ] 準備OK と報告してください。" \
  && sleep 0.1 && tmux send-keys -t %2 Enter
tmux capture-pane -t %2 -p | grep "\[カエデ\] 準備OK"
```

### 6.3 コントロールモードによる制御

```bash
# tmux を制御モードで起動し、JSON風のイベントをパイプで受信
tmux -CC attach -t miyabi-auto-dev
```

- 制御モードでは pane 出力・レイアウト変更が即座に通知されるため、AI が状態遷移をトリガーする高度な自動化が可能。

---

## 7. デバッグとフォールバック

| ステップ | コマンド | 説明 |
|----------|----------|------|
| ログ生成 | `tmux -vv new` | サーバー・クライアントの詳細ログ (`tmux-client-*.log` など) をカレントに出力 |
| セッション復旧 | `tmux ls`, `tmux attach -t <session>` | 想定セッションが存在するか確認し再接続 |
| ペイン停止 | `tmux kill-pane -t %5` | 無応答ペインを切り離す（必ずタスク完了を確認） |
| 設定確認 | `tmux show-options -g` | グローバルオプションのダンプ。Miyabi 専用オプションは `.tmux.conf` で管理 |

---

## 8. ベストプラクティス

1. **1 コマンド = 1 `send-keys`**  
   複数行を一度に投げるとエラー復帰が難しいため、原則 1 指示 1 コマンドで送信。
2. **適切な遅延**  
   コマンド直後に `sleep 0.1` を入れて Enter を送ることで、入力バッファ詰まりを回避。
3. **ログ解析前に `/clear`**  
   新しいタスク開始時には `/clear` を送信し、解析対象のログ区間を明確化。
4. **権限に注意**  
   `tmux run-shell` などでシステムコマンドを叩く際は、ユーザー権限・安全性を確認。
5. **セッション名の一貫性**  
   スクリプトや AI Agent 内でセッション名がハードコードされるため、ローカル変更時は `.claude/agents/tmux_agents_control.md` と本書を更新。

---

## 9. 参考資料

- `README.ja` (tmux 本体) – ビルド方法・基本使用法  
- `tmux.1` – 公式マニュアル（全コマンド・キーバインド詳細）  
- `.claude/agents/tmux_agents_control.md` – Miyabi Orchestra の tmux 運用仕様  
- `docs/YOUR_CURRENT_SETUP.md` – `tmux send-keys` プロトコル例  
- `docs/AUTO_DEV_MODE.md` – Infinity Mode と tmux の連携

---

このガイドは Miyabi の AI エージェントが tmux 上で確実にタスクを遂行するための共通仕様です。追加の運用ノウハウが見つかった場合は本ファイルと関連ドキュメントを更新し、エージェント群に周知してください。
