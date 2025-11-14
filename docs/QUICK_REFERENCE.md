# 🚀 Miyabi開発環境 - クイックリファレンス

**最終更新**: 2025-11-14

よく使うコマンドとショートカットの早見表です。

---

## 📱 Pixel Termux → MUGEN接続

```bash
# 基本接続
m          # SSH接続
j          # SSH接続 (majinエイリアス)

# Claude Code
c          # SSH + Claude Code
cc         # SSH + tmux + Claude Code (推奨)
cm         # Mosh + Claude Code
jcc        # Claude Code (majinエイリアス)

# tmux
mt         # tmux接続
jt         # tmux接続 (majinエイリアス)

# 監視
jcpu       # CPU/RAM統計
jgpu       # GPU統計

# ファイル転送
jup <file>     # アップロード
jdown <file>   # ダウンロード

# Git操作
mg         # git status
mgl        # git log (最新10件)
mgd        # git diff
mgp        # git pull

# ビルド
mb         # cargo build
mbt        # cargo test
mbc        # cargo clippy
mbr        # cargo build --release
```

---

## 💻 MacBook tmux制御 (Pixelから)

```bash
# ⚠️ 重要: Enterキー送信は必ず0.5秒待つ!
sleep 0.5 && ssh macbook "/opt/homebrew/bin/tmux send-keys -t 'miyabi-orchestra:1' 'command' Enter"

# ペイン確認
ssh macbook "/opt/homebrew/bin/tmux capture-pane -t 'miyabi-orchestra:1' -p | tail -30"

# セッション一覧
ssh macbook "/opt/homebrew/bin/tmux ls"
```

---

## 🌐 API接続

### Miyabi Management API

```bash
# ステータス確認
curl -H "X-API-Key: 93304e039eea24d50c7d91f6a7cb5d581e931357e04c2c19dce1ae6d3b309d89" \
  http://44.250.27.197:3002/miyabi/status

# ワーカー一覧
curl -H "X-API-Key: 93304e039eea24d50c7d91f6a7cb5d581e931357e04c2c19dce1ae6d3b309d89" \
  http://44.250.27.197:3002/miyabi/workers

# ワーカー起動
curl -X POST -H "X-API-Key: 93304e039eea24d50c7d91f6a7cb5d581e931357e04c2c19dce1ae6d3b309d89" \
  http://44.250.27.197:3002/miyabi/workers/1/start
```

---

## 📱 モバイルアプリ開発

### MacBookでビルド

```bash
ssh macbook 'cd ~/Dev/MiyabiMobileApp && npm run android'
```

### APK転送

```bash
# MacBook → Pixel
scp macbook:~/Dev/01-miyabi/_archive/MiyabiMobileApp/android/app/build/outputs/apk/debug/app-debug.apk ~/

# インストール
termux-open ~/app-debug.apk
```

### Metro Bundler

```bash
# 起動
ssh macbook 'cd ~/Dev/MiyabiMobileApp && npm start'

# ポートクリア (競合時)
ssh macbook 'lsof -ti:8081 | xargs kill -9'
```

---

## 🔧 トラブルシューティング

### SSHD再起動 (Pixel)

```bash
pkill sshd && sshd
pgrep sshd  # 確認
```

### 通知テスト

```bash
~/Scripts/test-notification.sh
```

### MUGEN API確認

```bash
ssh mugen 'ps aux | grep lark-oauth'
ssh mugen 'netstat -tuln | grep 3002'
```

---

## 📚 ドキュメント

- **統合インデックス**: `~/DEVICE_DOCUMENTATION_INDEX.md`
- **環境マップ**: `~/.claude/CLAUDE.md`
- **AWS設定**: `~/AWS_SecurityGroup_Setup.md`
- **SSH設定**: `~/SSH_BIDIRECTIONAL_SETUP.md`

---

**このファイルをPixelのホーム画面に配置してクイックアクセス！**
