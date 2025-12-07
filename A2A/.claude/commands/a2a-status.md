# A2A Status

A2Aシステム全体のステータスを表示します。

## 実行内容

1. tmuxセッション一覧の取得
2. miyabi-main:6 ウィンドウのペイン状態確認
3. 各エージェントの最新出力を取得
4. 通信ログの最新エントリ表示

```bash
# セッション一覧
tmux list-sessions

# ペイン一覧
tmux list-panes -t miyabi-main:6 -F "#{pane_id} #{pane_current_command}"

# Conductorの最新出力
tmux capture-pane -t %18 -p | tail -10
```

## 出力フォーマット

```
=== A2A System Status ===
Session: miyabi-main
Window: 6 (agents)

Agents:
  %18 指揮郎 (Conductor) - [status]
  %19 楓    (CodeGen)   - [status]
  %20 桜    (Review)    - [status]
  %21 椿    (PR)        - [status]
  %22 牡丹  (Deploy)    - [status]
  %23 見付郎 (Issue)     - [status]

Recent Activity:
  [最新のログエントリ]
```
