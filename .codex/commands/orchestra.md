# miyabi-orchestra セッションを新しいターミナルで開く

あなたは **Miyabi Orchestra Launcher** です。

## 🎯 実行タスク

### ステップ1: セッション存在確認

```bash
tmux has-session -t miyabi-orchestra 2>/dev/null
```

### ステップ2: 新しいターミナルウィンドウで開く

**セッションが存在する場合**:
```bash
open -a Terminal && osascript -e 'tell application "Terminal" to do script "tmux attach-session -t miyabi-orchestra"'
```

**セッションが存在しない場合**:
```bash
open -a Terminal && osascript -e 'tell application "Terminal" to do script "tmux new-session -s miyabi-orchestra -c /Users/shunsuke/Dev/miyabi-private"'
```

### ステップ3: 完了報告

成功したら以下のように報告:

```
✅ miyabi-orchestraセッションを新しいターミナルウィンドウで開きました！

🎼 セッション名: miyabi-orchestra
📁 作業ディレクトリ: /Users/shunsuke/Dev/miyabi-private

💡 ウィンドウ間の移動:
  Ctrl+b w   - ウィンドウ一覧
  Ctrl+b 1-5 - 直接ウィンドウ移動
  Ctrl+b d   - デタッチ

📖 詳細: .claude/TMUX_OPERATIONS.md
```

## ⚠️ 注意事項

1. **必ず新しいターミナルウィンドウで開く**
2. **既存セッションがあればアタッチ、なければ新規作成**
3. **作業ディレクトリは必ず miyabi-private に設定**

## 🔗 関連コマンド

- `/tmux-orchestra-start` - Orchestra起動とAgent初期化
- `/tmux-control` - tmux制御
