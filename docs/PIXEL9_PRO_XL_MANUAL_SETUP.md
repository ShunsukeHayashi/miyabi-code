# Pixel 9 Pro XL - 手動セットアップガイド

**Device**: Google Pixel 9 Pro XL
**Serial**: 4C201FDAS001VX
**Setup Method**: Manual (最も確実)
**Time**: 10-15分

---

## 🎯 簡単3ステップ

Pixel 9 Pro XLで**Termuxアプリを開いて**、以下のコマンドを順番に実行するだけです。

---

## ステップ1: パッケージ更新 (2分)

Termuxで以下をコピー＆ペーストして実行:

```bash
pkg update -y && pkg upgrade -y
```

**何が起こる？**
- パッケージリストを更新
- インストール済みパッケージをアップグレード
- 自動で進行 (途中で質問されたらすべて `y` と答える)

**完了の目印**: `Done` または `Nothing to do` と表示される

---

## ステップ2: 必要なツールをインストール (5分)

```bash
pkg install -y git gh openssh rust jq curl wget tmux neovim termux-api
```

**これでインストールされるもの**:
- `git` - バージョン管理
- `gh` - GitHub CLI
- `openssh` - SSH接続
- `rust` - Rustコンパイラ
- `jq` - JSON処理
- `curl`, `wget` - ファイルダウンロード
- `tmux` - ターミナルマルチプレクサ
- `neovim` - テキストエディタ
- `termux-api` - Android API連携

**完了の目印**: 最後に全てインストール完了のメッセージ

---

## ステップ3: Miyabiリポジトリをクローン (3分)

```bash
cd ~
git clone https://github.com/customer-cloud/miyabi-private.git
```

**何が起こる？**
- ホームディレクトリに移動
- Miyabiリポジトリをクローン (約800MB)
- クローン完了まで2-3分

**完了の目印**: `done.` と表示される

---

## ステップ4: ショートカット作成 (1分)

```bash
mkdir -p ~/.shortcuts

cat > ~/.shortcuts/miyabi-status.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
echo "🌸 Miyabi Status - Pixel 9 Pro XL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Device: Pixel 9 Pro XL"
termux-battery-status 2>/dev/null | jq -r '"Battery: \(.percentage)%"' || echo "Battery: checking..."
echo ""
if [ -d ~/miyabi-private ]; then
    cd ~/miyabi-private
    echo "Repository: ✅ Ready"
    echo ""
    echo "Git Status:"
    git status --short | head -5
else
    echo "Repository: ❌ Not found"
fi
EOF

chmod +x ~/.shortcuts/miyabi-status.sh
```

**これで何ができる？**
- ホーム画面からワンタップでMiyabiステータス確認
- Termux:Widget経由で使用

---

## ステップ5: 動作確認 (1分)

```bash
~/.shortcuts/miyabi-status.sh
```

**期待される出力**:
```
🌸 Miyabi Status - Pixel 9 Pro XL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Device: Pixel 9 Pro XL
Battery: 97%

Repository: ✅ Ready

Git Status:
M .miyabi/polling-worker-state.json
M AGENTS.md
...
```

---

## 🎯 ホーム画面ショートカット追加（オプション）

### 前提: Termux:Widgetをインストール

1. **Play Store**を開く
2. 「**Termux Widget**」を検索
3. **インストール**

### ウィジェットを追加

1. Pixel 9 Pro XLの**ホーム画面を長押し**
2. 「**ウィジェット**」をタップ
3. 下にスクロールして「**Termux**」を探す
4. 「**Termux:Widget**」を長押し
5. ホーム画面にドラッグ＆ドロップ
6. ウィジェットをタップ → `miyabi-status.sh` が表示される

---

## 🚀 完了！

これで以下が使えます：

### Termuxで使えるコマンド

```bash
# Miyabiディレクトリへ移動
cd ~/miyabi-private

# Git status確認
git status

# 最新コードを取得
git pull

# ステータス確認
~/.shortcuts/miyabi-status.sh
```

### ホーム画面から

- **Termux:Widget**をタップ
- **miyabi-status.sh**を選択
- 即座にステータス表示

### Macから（USB接続中）

```bash
# Macから実行:
adb -s 4C201FDAS001VX shell "run-as com.termux bash -c 'cd ~/miyabi-private && git status'"
```

---

## 💡 便利なエイリアス設定（オプション）

Termuxで:

```bash
cat >> ~/.bashrc << 'EOF'

# Miyabi aliases
alias miyabi='cd ~/miyabi-private'
alias ms='~/.shortcuts/miyabi-status.sh'
alias mw='watch -n 5 ~/.shortcuts/miyabi-status.sh'

# Git aliases
alias gs='git status'
alias gp='git pull'
alias gl='git log --oneline -10'

# Quick info
echo "🌸 Miyabi Society - Pixel 9 Pro XL"
echo "Type 'ms' for status, 'miyabi' to go to repo"
EOF

source ~/.bashrc
```

これで以下のショートカットが使えます:
- `ms` → miyabi-status
- `mw` → miyabi-watch (5秒ごと更新)
- `miyabi` → リポジトリへ移動
- `gs` → git status
- `gp` → git pull

---

## 🆘 トラブルシューティング

### Q: `pkg install` でエラーが出る

```bash
# パッケージリストを更新
pkg update

# リトライ
pkg install git
```

### Q: リポジトリクローンが遅い

```bash
# 浅いクローン（履歴なし）で高速化
git clone --depth 1 https://github.com/customer-cloud/miyabi-private.git
```

### Q: ショートカットが実行できない

```bash
# 実行権限を付与
chmod +x ~/.shortcuts/*.sh

# 直接実行してエラー確認
bash ~/.shortcuts/miyabi-status.sh
```

---

## ✅ セットアップ完了チェックリスト

- [ ] Termux更新完了
- [ ] 必要パッケージインストール完了
- [ ] Miyabiリポジトリクローン完了
- [ ] ショートカット作成完了
- [ ] 動作確認OK
- [ ] Termux:Widgetインストール（オプション）
- [ ] ホーム画面ウィジェット追加（オプション）

全てチェックできたら**セットアップ完了**です！🎉

---

## 📱 デバイス情報

```yaml
Device: Pixel 9 Pro XL
Model: komodo
Serial: 4C201FDAS001VX
Android: 16
Role: Maestro Device (Layer 1)
Setup Date: 2025-11-17
```

---

**Version**: 1.0.0
**Method**: Manual Setup
**Time Required**: 10-15 minutes

🌸 **Miyabi Society - Simple & Reliable Setup** 🌸
