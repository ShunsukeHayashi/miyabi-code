# 🚀 SSH Tunnel Manual Connection Guide

## miyabi-oss tmux Layout

現在のmonitorウィンドウは4ペインに分割されています：

```
┌────────────────┬────────────────┐
│  Pane 0        │  Pane 1        │
│  (Original)    │  (SSH Guide)   │
├────────────────┼────────────────┤
│  Pane 2        │  Pane 3        │
│  (MUGEN)       │  (MAJIN)       │
└────────────────┴────────────────┘
```

## 手動接続コマンド

### 🔥 MUGEN (無限) - Pane 2

```bash
# 1. SSH接続
ssh mugen

# 2. プロジェクトディレクトリに移動
cd ~/miyabi-private

# 3. Claudeセッション作成（バージョンアップ後）
tmux new-session -d -s claude-build 'claude --version && claude --help'
tmux new-session -d -s claude-test 'claude --version && claude --help'
tmux new-session -d -s claude-perf 'claude --version && claude --help'

# 4. Codexセッション作成（バージョンアップ後）
tmux new-session -d -s codex-docs 'codex --version && codex --help'
tmux new-session -d -s codex-tests 'codex --version && codex --help'

# 5. セッション一覧確認
tmux list-sessions

# 6. セッションにアタッチ
tmux attach -t claude-build
```

### ⚡ MAJIN (魔神) - Pane 3

```bash
# 1. SSH接続
ssh majin

# 2. プロジェクトディレクトリに移動
cd ~/miyabi-private

# 3. Claudeセッション作成（バージョンアップ後）
tmux new-session -d -s claude-review 'claude --version && claude --help'
tmux new-session -d -s claude-docs 'claude --version && claude --help'

# 4. Codexセッション作成（バージョンアップ後）
tmux new-session -d -s codex-api 'codex --version && codex --help'
tmux new-session -d -s codex-config 'codex --version && codex --help'

# 5. セッション一覧確認
tmux list-sessions

# 6. セッションにアタッチ
tmux attach -t claude-review
```

## 💻 ローカル制御

### tmuxペインの切り替え

```bash
# miyabi-ossセッションのmonitorウィンドウにアタッチ
tmux attach -t miyabi-oss:monitor

# ペイン間の移動
Ctrl+b → 矢印キー
または
Ctrl+b → q → 番号選択
```

### ペイン操作

```bash
# 現在のペインでコマンド実行
# 例：Pane 2 (MUGEN用) を選択してSSH接続
Ctrl+b → 2
ssh mugen

# 例：Pane 3 (MAJIN用) を選択してSSH接続
Ctrl+b → 3
ssh majin
```

## 🔧 バージョンアップ確認

各マシンでClaude CodeとCodexのバージョンアップが完了したら：

```bash
# バージョン確認
claude --version
codex --version

# 設定確認
claude --help | head -20
codex --help | head -20
```

## 📊 リソース監視

### MUGEN監視

```bash
# リソース確認
ssh mugen 'top -n 1 | head -20'
ssh mugen 'free -h'
ssh mugen 'df -h'

# プロセス確認
ssh mugen 'ps aux | grep -E "(claude|codex)" | grep -v grep'
```

### MAJIN監視

```bash
# リソース確認
ssh majin 'top -n 1 | head -20'
ssh majin 'free -h'
ssh majin 'df -h'

# プロセス確認
ssh majin 'ps aux | grep -E "(claude|codex)" | grep -v grep'
```

## 🎯 最大並列セッション構成（バージョンアップ後）

```
【合計：最大17セッション】

ローカル Mac:
├── miyabi-oss (10 windows) ✅ 既存稼働
└── monitor window (4 panes) ✅ SSH制御用

MUGEN (16 vCPU, 118GB RAM):
├── claude-build ⏳ 手動起動待ち
├── claude-test ⏳ 手動起動待ち
├── claude-perf ⏳ 手動起動待ち
├── codex-docs ⏳ 手動起動待ち
└── codex-tests ⏳ 手動起動待ち

MAJIN (8 vCPU, 28GB RAM):
├── claude-review ⏳ 手動起動待ち
├── claude-docs ⏳ 手動起動待ち
├── codex-api ⏳ 手動起動待ち
└── codex-config ⏳ 手動起動待ち
```

## 🚀 起動手順

1. **バージョンアップ完了確認**
2. **SSH接続確立** (各ペインから)
3. **セッション作成** (上記コマンド使用)
4. **動作確認** (--version, --help)
5. **本格稼働開始** 🔥

---

**Status**: Ready for Manual Launch
**Last Updated**: 2025-12-07
**Version**: 1.0.0