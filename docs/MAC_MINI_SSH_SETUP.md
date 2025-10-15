# 🖥️ Mac mini SSH接続 完全セットアップガイド

**作成日**: 2025-10-15
**対象**: Mac mini をDocker実行サーバーとして使用
**前提**: Mac mini（macOS）+ ローカルマシン（macOS/Linux/Windows）

---

## 📋 目次

1. [概要](#-概要)
2. [Mac mini側セットアップ](#-mac-mini側セットアップ)
3. [ローカルマシン側セットアップ](#-ローカルマシン側セットアップ)
4. [SSH接続テスト](#-ssh接続テスト)
5. [Docker Context設定](#-docker-context設定)
6. [実践：Docker操作](#-実践docker操作)
7. [トラブルシューティング](#-トラブルシューティング)
8. [セキュリティ強化](#-セキュリティ強化)

---

## 🎯 概要

### 構成図

```
┌─────────────────────┐           SSH接続           ┌─────────────────────┐
│ ローカルマシン      │ ───────────────────────────> │ Mac mini            │
│ (MacBook/PC)        │ <─────────────────────────── │ (Docker Server)     │
│                     │                               │                     │
│ - miyabi CLI        │                               │ - Docker Desktop    │
│ - SSH Client        │                               │ - miyabi Project    │
│ - Docker Client     │                               │ - SSH Server        │
└─────────────────────┘                               └─────────────────────┘
```

### メリット

- ✅ **常時稼働**: Mac miniを24/7稼働させてAgent自動実行
- ✅ **リソース節約**: ローカルマシンのCPU/メモリ負荷軽減
- ✅ **リモート管理**: 外出先からも操作可能
- ✅ **コスト削減**: Self-hosted runnerとして無料実行

---

## 🖥️ Mac mini側セットアップ

### Step 1: リモートログイン有効化

```bash
# Mac miniで実行

# システム設定 > 共有 > リモートログイン を有効化
# GUI操作:
# 1. System Settings を開く
# 2. General > Sharing をクリック
# 3. Remote Login を ON にする
# 4. "Allow full disk access for remote users" にチェック（オプション）
```

**コマンドライン操作**（管理者権限必要）:
```bash
# リモートログインを有効化
sudo systemsetup -setremotelogin on

# 確認
sudo systemsetup -getremotelogin
# 出力: Remote Login: On
```

### Step 2: ユーザー作成（推奨）

セキュリティのため、専用ユーザーを作成します。

```bash
# Mac miniで実行

# 新規ユーザー作成（GUIの方が簡単）
# System Settings > Users & Groups > Add Account...
# - Account type: Standard
# - Full Name: Miyabi Docker User
# - Account Name: miyabi
# - Password: <強力なパスワード>

# コマンドラインでの作成（上級者向け）
sudo dscl . -create /Users/miyabi
sudo dscl . -create /Users/miyabi UserShell /bin/bash
sudo dscl . -create /Users/miyabi RealName "Miyabi Docker User"
sudo dscl . -create /Users/miyabi UniqueID 503
sudo dscl . -create /Users/miyabi PrimaryGroupID 20
sudo dscl . -create /Users/miyabi NFSHomeDirectory /Users/miyabi
sudo dscl . -passwd /Users/miyabi <password>
sudo createhomedir -c -u miyabi
```

### Step 3: Docker Desktop インストール

```bash
# Mac miniで実行

# Homebrew経由でインストール
brew install --cask docker

# または、公式サイトからダウンロード
# https://www.docker.com/products/docker-desktop

# Docker起動確認
docker --version
# Docker version 24.0.7, build afdd53b

docker-compose --version
# Docker Compose version v2.23.0
```

**Docker Desktop自動起動設定**:
```bash
# System Settings > General > Login Items
# Docker を追加（自動起動）
```

### Step 4: プロジェクトクローン

```bash
# Mac miniで実行（miyabiユーザーとして）

# ホームディレクトリに移動
cd ~

# プロジェクトクローン
git clone https://github.com/ShunsukeHayashi/miyabi-private.git
cd miyabi-private

# 環境変数設定
cp .env.example .env
vim .env
# GITHUB_TOKEN, GITHUB_REPOSITORY等を設定
```

### Step 5: IPアドレス/ホスト名確認

```bash
# Mac miniで実行

# IPアドレス確認
ipconfig getifaddr en0
# 例: 192.168.1.100

# ホスト名確認
hostname
# 例: mac-mini.local

# mDNS名確認（Bonjourサービス）
scutil --get LocalHostName
# 例: mac-mini
```

**推奨設定**: 固定IPアドレス

```bash
# System Settings > Network > Wi-Fi (またはEthernet) > Details...
# TCP/IP タブ > Configure IPv4: Using DHCP with manual address
# IPv4 Address: 192.168.1.100（ルーターのDHCP範囲外）
```

---

## 💻 ローカルマシン側セットアップ

### Step 1: SSH鍵生成（初回のみ）

```bash
# ローカルマシンで実行

# SSH鍵が存在するか確認
ls ~/.ssh/id_*.pub

# 存在しない場合、新規作成
ssh-keygen -t ed25519 -C "your_email@example.com"
# または RSA (互換性重視)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 鍵生成時の質問
# Enter file in which to save the key: (Enter - デフォルト)
# Enter passphrase: <パスフレーズ入力（推奨）>
# Enter same passphrase again: <再入力>

# 公開鍵確認
cat ~/.ssh/id_ed25519.pub
# または
cat ~/.ssh/id_rsa.pub
```

### Step 2: 公開鍵をMac miniにコピー

**方法1: ssh-copy-id（推奨）**

```bash
# ローカルマシンで実行

# Mac miniに公開鍵をコピー
ssh-copy-id miyabi@mac-mini.local
# または IPアドレス指定
ssh-copy-id miyabi@192.168.1.100

# パスワード入力を求められる
# Mac miniのmiyabiユーザーのパスワードを入力
```

**方法2: 手動コピー**

```bash
# ローカルマシンで実行

# 公開鍵をクリップボードにコピー（macOS）
cat ~/.ssh/id_ed25519.pub | pbcopy

# Mac miniにSSH接続（パスワード認証）
ssh miyabi@mac-mini.local

# Mac mini側で実行
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vim ~/.ssh/authorized_keys
# クリップボードの内容を貼り付け（Command+V）
# 保存して終了（:wq）

chmod 600 ~/.ssh/authorized_keys
exit
```

### Step 3: SSH設定ファイル作成（オプション）

```bash
# ローカルマシンで実行

vim ~/.ssh/config
```

**~/.ssh/config**内容:
```
# Mac mini Docker Server
Host mac-mini
    HostName mac-mini.local
    User miyabi
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ForwardAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    Compression yes

# IPアドレス指定版（mDNSが不安定な場合）
Host mac-mini-ip
    HostName 192.168.1.100
    User miyabi
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ForwardAgent yes
```

**設定適用**:
```bash
chmod 600 ~/.ssh/config
```

---

## 🔍 SSH接続テスト

### 基本接続テスト

```bash
# ローカルマシンで実行

# 接続テスト（ホスト名）
ssh miyabi@mac-mini.local

# または ~/.ssh/config設定後
ssh mac-mini

# 接続成功したらMac miniのシェルが開く
miyabi@mac-mini ~ %
```

**初回接続時の確認**:
```
The authenticity of host 'mac-mini.local (192.168.1.100)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```
→ `yes` と入力

### パスワードなし接続確認

```bash
# ローカルマシンで実行

# パスワード入力なしで接続できることを確認
ssh mac-mini

# パスワードを求められる場合、公開鍵が正しく設定されていない
# → Step 2を再実行
```

### リモートコマンド実行テスト

```bash
# ローカルマシンで実行

# Mac miniでコマンド実行（接続せずに）
ssh mac-mini "hostname"
# 出力: mac-mini.local

ssh mac-mini "docker ps"
# Dockerコンテナ一覧が表示される

ssh mac-mini "cd ~/miyabi-private && git status"
# Gitステータスが表示される
```

---

## 🐳 Docker Context設定

Docker Contextを設定すると、ローカルのdockerコマンドがMac miniで実行されます。

### Step 1: Docker Context作成

```bash
# ローカルマシンで実行

# Context作成
docker context create mac-mini \
  --description "Mac mini Docker Server" \
  --docker "host=ssh://miyabi@mac-mini.local"

# 作成確認
docker context ls
# NAME        DESCRIPTION                 DOCKER ENDPOINT
# default *   Current DOCKER_HOST...      unix:///var/run/docker.sock
# mac-mini    Mac mini Docker Server      ssh://miyabi@mac-mini.local
```

### Step 2: Context切り替え

```bash
# ローカルマシンで実行

# Mac mini Contextに切り替え
docker context use mac-mini

# 確認
docker context ls
# NAME        DESCRIPTION                 DOCKER ENDPOINT
# default     Current DOCKER_HOST...      unix:///var/run/docker.sock
# mac-mini *  Mac mini Docker Server      ssh://miyabi@mac-mini.local

# Docker情報確認（Mac miniで実行される）
docker info | grep "Operating System"
# Operating System: Docker Desktop (macOS)

# ローカルに戻す
docker context use default
```

### Step 3: Context使用例

```bash
# ローカルマシンで実行

# Mac mini Contextに切り替え
docker context use mac-mini

# 以降、全てのdockerコマンドがMac miniで実行される

# イメージ一覧（Mac mini）
docker images

# コンテナ一覧（Mac mini）
docker ps

# docker-compose起動（Mac mini）
cd ~/miyabi-private  # ローカルのディレクトリ
docker-compose up -d  # Mac miniで実行される
```

**注意**: docker-composeは**ローカルのファイル**を参照します。Mac miniに同じファイルがあることを確認してください。

---

## 🚀 実践：Docker操作

### パターン1: SSH経由で直接操作

```bash
# ローカルマシンで実行

# Mac miniに接続してdocker-compose実行
ssh mac-mini "cd ~/miyabi-private && docker-compose up -d"

# ログ確認
ssh mac-mini "cd ~/miyabi-private && docker-compose logs -f miyabi-agent"

# 停止
ssh mac-mini "cd ~/miyabi-private && docker-compose down"
```

### パターン2: Docker Context経由

```bash
# ローカルマシンで実行

# Context切り替え
docker context use mac-mini

# ローカルのファイルを使用（Mac miniで実行）
# 注意: Mac miniにも同じファイル構成が必要
cd /path/to/local/miyabi-private
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down

# ローカルに戻す
docker context use default
```

### パターン3: rsync + SSH（推奨）

ローカルのファイルをMac miniに同期してから実行。

```bash
# ローカルマシンで実行

# ローカル → Mac mini に同期
rsync -avz --delete \
  --exclude 'target' \
  --exclude 'node_modules' \
  --exclude '.git' \
  ~/miyabi-private/ \
  mac-mini:~/miyabi-private/

# Mac miniで実行
ssh mac-mini "cd ~/miyabi-private && docker-compose up -d"

# ログ監視
ssh mac-mini "cd ~/miyabi-private && docker-compose logs -f"
```

**自動化スクリプト例**:

```bash
#!/bin/bash
# deploy-to-mac-mini.sh

set -e

echo "🚀 Deploying to Mac mini..."

# ファイル同期
echo "📦 Syncing files..."
rsync -avz --delete \
  --exclude 'target' \
  --exclude '.git' \
  --exclude '.env' \
  ~/miyabi-private/ \
  mac-mini:~/miyabi-private/

# Docker Compose実行
echo "🐳 Starting Docker containers..."
ssh mac-mini "cd ~/miyabi-private && docker-compose up -d"

# ステータス確認
echo "✅ Deployment complete!"
ssh mac-mini "cd ~/miyabi-private && docker-compose ps"
```

使い方:
```bash
chmod +x deploy-to-mac-mini.sh
./deploy-to-mac-mini.sh
```

### パターン4: Agent実行（ワンショット）

```bash
# ローカルマシンで実行

# CoordinatorAgentでIssue処理
ssh mac-mini "cd ~/miyabi-private && \
  docker-compose run --rm miyabi-agent \
  miyabi agent run coordinator --issue 270"

# ReviewAgentで品質レビュー
ssh mac-mini "cd ~/miyabi-private && \
  docker-compose run --rm miyabi-agent \
  miyabi agent run review --issue 271"
```

---

## 🔧 トラブルシューティング

### 問題1: SSH接続タイムアウト

**エラー**:
```
ssh: connect to host mac-mini.local port 22: Operation timed out
```

**解決方法**:

1. **Mac miniのネットワーク確認**:
   ```bash
   # Mac miniで実行
   ifconfig | grep "inet "
   ping google.com
   ```

2. **mDNS確認**:
   ```bash
   # ローカルマシンで実行
   ping mac-mini.local

   # 失敗する場合、IPアドレス直接指定
   ssh miyabi@192.168.1.100
   ```

3. **ファイアウォール確認**（Mac mini）:
   ```bash
   # System Settings > Network > Firewall
   # Firewall: Off （または SSH (port 22) を許可）
   ```

4. **リモートログイン確認**（Mac mini）:
   ```bash
   sudo systemsetup -getremotelogin
   # Remote Login: On であることを確認
   ```

### 問題2: パスワードを要求される

**エラー**:
```
miyabi@mac-mini.local's password:
```

**解決方法**:

1. **公開鍵が正しく設定されているか確認**（Mac mini）:
   ```bash
   ssh mac-mini
   cat ~/.ssh/authorized_keys
   # ローカルマシンの公開鍵が含まれているか確認
   ```

2. **パーミッション確認**（Mac mini）:
   ```bash
   ls -la ~/.ssh/
   # drwx------  .ssh/
   # -rw-------  authorized_keys

   # 修正
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **SSH秘密鍵のパーミッション確認**（ローカル）:
   ```bash
   ls -la ~/.ssh/id_ed25519
   # -rw-------  id_ed25519

   # 修正
   chmod 600 ~/.ssh/id_ed25519
   ```

4. **SSH接続デバッグ**（ローカル）:
   ```bash
   ssh -v mac-mini
   # 詳細ログで原因特定
   ```

### 問題3: Docker Context接続失敗

**エラー**:
```
error during connect: Get "http://docker.example.com/v1.24/info": dial tcp: lookup docker.example.com
```

**解決方法**:

1. **Context削除・再作成**:
   ```bash
   docker context rm mac-mini
   docker context create mac-mini --docker "host=ssh://miyabi@mac-mini.local"
   ```

2. **SSH接続確認**:
   ```bash
   ssh mac-mini "docker ps"
   # SSH経由でdockerコマンドが実行できるか確認
   ```

3. **Docker Desktop起動確認**（Mac mini）:
   ```bash
   ssh mac-mini "docker info"
   # Docker Daemonが起動しているか確認
   ```

### 問題4: 「Permission denied」エラー

**エラー**:
```
Got permission denied while trying to connect to the Docker daemon socket
```

**解決方法**（Mac mini）:

```bash
# miyabiユーザーをdockerグループに追加（Linux）
# macOSの場合、Docker Desktopは不要

# Docker Desktop再起動
ssh mac-mini "killall Docker && open -a Docker"

# 確認
ssh mac-mini "docker ps"
```

### 問題5: ファイル同期エラー（rsync）

**エラー**:
```
rsync: failed to set times on "...": Operation not permitted
```

**解決方法**:

```bash
# -a オプションから -t (times) を除外
rsync -rvz --delete \
  --exclude 'target' \
  ~/miyabi-private/ \
  mac-mini:~/miyabi-private/
```

---

## 🔐 セキュリティ強化

### 1. SSH鍵にパスフレーズ設定

```bash
# ローカルマシンで実行

# 既存の鍵にパスフレーズ追加
ssh-keygen -p -f ~/.ssh/id_ed25519

# パスフレーズ入力
# Enter new passphrase: <強力なパスフレーズ>
# Enter same passphrase again: <再入力>
```

### 2. SSH鍵エージェント使用

```bash
# ローカルマシンで実行

# SSH Agentに鍵追加（macOS）
ssh-add ~/.ssh/id_ed25519
# パスフレーズ入力（1回のみ）

# 永続化（macOS）
ssh-add --apple-use-keychain ~/.ssh/id_ed25519

# ~/.ssh/configに追加
vim ~/.ssh/config
# 以下を追加:
# Host *
#   UseKeychain yes
#   AddKeysToAgent yes
```

### 3. ポート番号変更（上級者向け）

**Mac mini側設定**:
```bash
# Mac miniで実行（管理者権限必要）

# SSHポート変更（例: 2222）
sudo vim /etc/ssh/sshd_config
# Port 2222  # 行を追加または変更

# SSH再起動
sudo launchctl unload /System/Library/LaunchDaemons/ssh.plist
sudo launchctl load -w /System/Library/LaunchDaemons/ssh.plist
```

**ローカル側設定**:
```bash
# ~/.ssh/config更新
vim ~/.ssh/config
# Host mac-mini
#     Port 2222  # 追加
```

### 4. ファイアウォール設定（Mac mini）

```bash
# System Settings > Network > Firewall
# Firewall: On
# Options... > Allow signed software to receive incoming connections
# + ボタン > Terminal.app, Docker.app を追加
```

### 5. 2段階認証（上級者向け）

Google Authenticator等を使用したSSH 2FA設定。

参考: [SSH 2FA Setup for macOS](https://www.digitalocean.com/community/tutorials/how-to-set-up-multi-factor-authentication-for-ssh-on-ubuntu-20-04)

---

## 📊 ベストプラクティス

### 定期メンテナンス

```bash
# Mac miniで実行（週次）

# Dockerクリーンアップ
docker system prune -a --volumes -f

# イメージ更新
cd ~/miyabi-private
git pull
docker-compose build --no-cache
docker-compose up -d
```

### モニタリング

```bash
# ローカルマシンで実行

# CPU/メモリ使用率監視
ssh mac-mini "top -l 1 | head -10"

# ディスク使用量
ssh mac-mini "df -h"

# Docker統計
ssh mac-mini "docker stats --no-stream"
```

### ログ集約

```bash
# ローカルマシンで実行

# Mac miniのログをローカルに取得
ssh mac-mini "cd ~/miyabi-private && docker-compose logs --tail=1000" > mac-mini-logs.txt

# リアルタイム監視
ssh mac-mini "cd ~/miyabi-private && docker-compose logs -f" | tee mac-mini-live.log
```

---

## 🎯 まとめ

### セットアップ完了チェックリスト

- [ ] Mac miniでリモートログイン有効化
- [ ] Mac miniにDocker Desktop インストール
- [ ] Mac miniにプロジェクトクローン
- [ ] ローカルでSSH鍵生成
- [ ] Mac miniに公開鍵コピー
- [ ] パスワードなしSSH接続成功
- [ ] Docker Context作成・接続成功
- [ ] SSH経由でdocker-compose実行成功

### 次のステップ

1. **Self-hosted Runner設定**: [SELF_HOSTED_RUNNER_SETUP.md](./SELF_HOSTED_RUNNER_SETUP.md)
2. **RefresherAgent設定**: [REFRESHER_AGENT_SELF_HOSTED_SETUP.md](./REFRESHER_AGENT_SELF_HOSTED_SETUP.md)
3. **Docker環境活用**: [DOCKER.md](./DOCKER.md)

---

**作成日**: 2025-10-15
**最終更新**: 2025-10-15
**バージョン**: 1.0

🖥️ **Mac mini SSH接続 - 完全セットアップ完了！**
