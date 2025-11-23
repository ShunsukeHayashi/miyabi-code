# Pixel 9 Pro Fold - Maestro Setup Complete

**Device**: Google Pixel 9 Pro Fold
**Serial**: 46271FDKD001PY
**Role**: Secondary Maestro Device (Layer 1)
**Setup Date**: 2025-11-17

---

## ✅ インストール完了

### 基本情報

```yaml
Device:
  Model: Pixel 9 Pro Fold
  Android: 16 (最新)
  Serial: 46271FDKD001PY
  Battery: 41%
  Connection: USB-C

Status:
  ✅ Termux: Installed
  ✅ Essential packages: Installed
  ✅ Miyabi repository: Cloned
  ✅ SSH keys: Configured
  ✅ Shortcuts: Created
  ⏳ Termux:Widget: Needs manual install
  ⏳ Lark: Optional install
```

---

## 📦 インストール済みパッケージ

```bash
# Core tools
✅ git           # Version control
✅ gh            # GitHub CLI
✅ openssh       # SSH client/server
✅ rust          # Rust compiler
✅ cargo         # Rust package manager
✅ jq            # JSON processor
✅ curl          # HTTP client
✅ wget          # File downloader
✅ tmux          # Terminal multiplexer
✅ neovim        # Text editor
```

---

## 🚀 今すぐ使えるコマンド

### Termuxを開いて実行:

```bash
# Miyabiステータス確認
miyabi-status

# リアルタイム監視モード
miyabi-watch

# Miyabiリポジトリへ移動
cd ~/miyabi-private

# Git status確認
git status
```

---

## 🎯 ホーム画面ショートカットの追加方法

### ステップ1: Termux:Widgetのインストール

```
Play Store または F-Droid から:
"Termux:Widget" をインストール
```

### ステップ2: ウィジェット追加

```
1. Pixel 9 Foldのホーム画面で、
   何もないところを長押し

2. 「ウィジェット」をタップ

3. 下にスクロールして「Termux」を探す

4. 「Termux:Widget」を長押ししてホーム画面にドラッグ

5. ウィジェットをタップすると、利用可能なショートカットが表示:
   • miyabi-status.sh  - ステータス確認
   • miyabi-watch.sh   - リアルタイム監視
```

### ステップ3: ショートカットの使用

```
ホーム画面のTermux:Widgetをタップ
  ↓
ショートカットリストが表示
  ↓
"miyabi-status" をタップ
  ↓
Termuxが開き、Miyabiステータスが表示される
```

---

## 🔧 Termux初回起動時の設定

Termuxを開くと、以下のウェルカムメッセージが表示されます:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌸 Miyabi Society - Pixel 9 Pro Fold
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Quick Commands:
  miyabi-status  - Show status
  miyabi-watch   - Monitor mode
  cd miyabi      - Go to repository

Type 'miyabi-status' to get started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎮 Macからのリモート制御

### USB接続時（今のまま）

```bash
cd ~/Dev/01-miyabi/_core/miyabi-private

# ステータス確認
adb -s 46271FDKD001PY shell "run-as com.termux /data/data/com.termux/files/usr/bin/bash -c 'source ~/.bashrc && miyabi-status'"

# Termuxを開く
adb -s 46271FDKD001PY shell am start -n com.termux/.HomeActivity

# スクリーンショット取得
adb -s 46271FDKD001PY shell screencap -p > pixel9fold-screen.png
```

### ワイヤレスADB接続（オプション）

後で設定する場合:

```bash
# Pixel側で開発者オプション → ワイヤレスデバッグ有効化

# Mac側で接続
adb pair [IP]:45678 [ペアリングコード]
adb connect [IP]:43215

# 以降はUSB不要でリモート制御可能
```

---

## 📊 デバイス構成

### Miyabi Society - デュアルMaestro構成

```
Layer 1: Maestro (モバイル監視・制御)
  ├─ Pixel 8 (既存)
  │   └─ IP: 192.168.3.9
  │
  └─ Pixel 9 Pro Fold (新規) ★
      └─ Serial: 46271FDKD001PY
      └─ Connection: USB-C / Wireless ADB

Layer 2: Orchestrator (Mac)
  └─ MacBook Pro
      └─ 両方のPixelを制御可能

Layer 3: Coordinators
  ├─ MUGEN (US West 2)
  └─ MAJIN (Tokyo)
```

---

## 🔐 SSH設定（完了済み）

```bash
# Mac公開鍵がPixel 9 Foldに登録済み
~/.ssh/authorized_keys に追加

# 後でSSHサーバー起動時は:
# Pixel側: sshd
# Mac側: ssh -p 8022 u0_a336@[IP]
```

---

## 📱 推奨アプリ

### 必須
- ✅ **Termux** (インストール済み)
- ⏳ **Termux:Widget** (ショートカット用)
- ⏳ **Termux:API** (通知・センサーアクセス用)

### オプション
- ⏳ **Lark** (Miyabi通知受信用)
- ⏳ **GitHub Mobile** (Issue管理用)
- ⏳ **JuiceSSH** (外出先からのSSH接続用)

---

## 🎯 次のステップ

### 1. Termux:Widgetインストール

```
Play Store:
https://play.google.com/store/apps/details?id=com.termux.widget

または F-Droid:
https://f-droid.org/packages/com.termux.widget/
```

### 2. ホーム画面ショートカット追加

```
ホーム画面長押し → ウィジェット → Termux:Widget
```

### 3. 動作確認

```bash
# ショートカットから "miyabi-status" を実行
# 以下が表示されればOK:
🌸 Miyabi Status
━━━━━━━━━━━━━━━━━━━━━━━━━
Device: Pixel 9 Pro Fold
Battery: XX%
Repository: ✅ Ready
```

### 4. GitHub CLI認証（オプション）

```bash
# Termux内で:
gh auth login

# ブラウザでGitHubアカウント認証
```

### 5. Miyabi CLIインストール（将来）

```bash
cd ~/miyabi-private
cargo install --path crates/miyabi-cli

# 使用:
miyabi status
miyabi execute 1030
```

---

## 🐛 トラブルシューティング

### Q: ショートカットが表示されない

```
A: Termux:Widgetアプリがインストールされているか確認
   ~/.shortcuts/ ディレクトリにスクリプトがあるか確認:

   ls -la ~/.shortcuts/
```

### Q: パッケージがインストールされていない

```
A: Termux内で手動インストール:

   pkg update
   pkg install git gh openssh rust
```

### Q: Miyabiリポジトリがない

```
A: 手動でクローン:

   cd ~
   git clone https://github.com/customer-cloud/miyabi-private.git
```

### Q: USB接続が切れた

```
A: USB-Cケーブルを再接続
   または、ワイヤレスADB設定を行う
```

---

## 🔄 同期とバックアップ

### Gitプル（最新化）

```bash
cd ~/miyabi-private
git pull origin main
```

### 設定のバックアップ

```bash
# Macから実行:
adb -s 46271FDKD001PY pull \
  /data/data/com.termux/files/home/.bashrc \
  pixel9fold-bashrc-backup.txt
```

---

## 📊 使用例

### 例1: 朝のチェック

```
1. Pixel 9 Foldを開く
2. ホーム画面のTermux:Widgetをタップ
3. "miyabi-status" を選択
4. ステータス確認
5. 必要に応じてMacで作業開始
```

### 例2: 外出先から監視

```
1. JuiceSSHアプリを開く（インストール済みの場合）
2. SSHでMac Orchestratorに接続
3. Macから Pixel 9 Foldのステータス確認:
   adb -s 46271FDKD001PY shell ...
4. 必要に応じてワークフロー実行
```

### 例3: Termux内で作業

```bash
# Termux起動
cd ~/miyabi-private

# 最新コードを取得
git pull

# ビルド（将来）
cargo build

# テスト実行
cargo test
```

---

## 🌸 完了！

**Pixel 9 Pro Fold**がMiyabi SocietyのMaestroデバイスとして設定されました。

これで以下が可能になりました:

✅ Macからリモート制御
✅ ホーム画面からワンタップアクセス
✅ リアルタイム監視
✅ Termux内で開発作業
✅ GitHub連携
✅ 自動化ワークフローの監視

---

**Setup Version**: 1.0.0
**Date**: 2025-11-17
**Orchestrator**: Mac (Layer 2)

🌸 **Miyabi Society - Dual Maestro Configuration Active** 🌸
