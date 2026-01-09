# Miyabi 環境構築ガイド

**Version**: 1.0.0
**Last Updated**: 2026-01-09
**対象**: macOS / Linux / Windows (WSL2)

---

## 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [クイックスタート](#クイックスタート)
4. [詳細セットアップ](#詳細セットアップ)
5. [環境変数設定](#環境変数設定)
6. [検証](#検証)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

Miyabiは完全自律型AI開発オペレーションプラットフォームです。このガイドでは、開発環境のセットアップ方法を説明します。

### システム構成

```
┌─────────────────────────────────────────────────────────┐
│                    Miyabi Platform                       │
├─────────────────────────────────────────────────────────┤
│  Frontend (Next.js)  │  Backend (Rust)  │  Agents (21)  │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL  │  MCP Servers  │  GitHub Integration      │
└─────────────────────────────────────────────────────────┘
```

---

## 前提条件

### 必須ツール

| ツール | 最小バージョン | 推奨バージョン | 用途 |
|--------|---------------|---------------|------|
| **Node.js** | 18.x | 22.x | フロントエンド、MCP Servers |
| **Git** | 2.40 | 2.43+ | バージョン管理 |
| **Rust** | 1.75.0 | stable (latest) | バックエンド |
| **GitHub CLI** | 2.40 | 2.63+ | GitHub操作 |

### 推奨ツール

| ツール | 用途 |
|--------|------|
| **Docker** | コンテナ実行、PostgreSQL |
| **Claude Code** | AI開発支援 |
| **tmux** | マルチセッション管理 |

---

## クイックスタート

### 3分セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/ShunsukeHayashi/miyabi-private.git
cd miyabi-private

# 2. 環境変数設定
cp .env.example .env
# .env を編集して必要な値を設定

# 3. 依存関係インストール
npm install

# 4. 環境確認
npx miyabi doctor
```

---

## 詳細セットアップ

### Step 1: Node.js インストール

#### macOS (Homebrew)

```bash
# Node.js インストール
brew install node@22

# バージョン確認
node --version  # v22.x.x
npm --version   # 10.x.x
```

#### Ubuntu/Debian

```bash
# NodeSource リポジトリ追加
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# インストール
sudo apt-get install -y nodejs

# バージョン確認
node --version
```

#### Windows (WSL2)

```bash
# WSL2内でUbuntuの手順に従う
```

### Step 2: Git インストール

#### macOS

```bash
# Homebrew経由
brew install git

# バージョン確認
git --version  # git version 2.43.0+
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y git

git --version
```

### Step 3: Rust インストール

```bash
# rustup インストール
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# パス設定
source $HOME/.cargo/env

# バージョン確認
rustc --version  # rustc 1.75.0+
cargo --version

# コンポーネント追加
rustup component add rustfmt clippy
```

### Step 4: GitHub CLI インストール

#### macOS

```bash
brew install gh

# 認証
gh auth login
```

#### Ubuntu/Debian

```bash
# GPGキー追加
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg

# リポジトリ追加
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null

# インストール
sudo apt update
sudo apt install gh

# 認証
gh auth login
```

### Step 5: PostgreSQL (Docker推奨)

```bash
# Docker Compose で起動
docker compose up -d db

# または直接実行
docker run -d \
  --name miyabi-postgres \
  -e POSTGRES_USER=miyabi_admin \
  -e POSTGRES_PASSWORD=miyabi_local_dev \
  -e POSTGRES_DB=miyabi \
  -p 5432:5432 \
  postgres:16
```

### Step 6: プロジェクトセットアップ

```bash
# リポジトリクローン
git clone https://github.com/ShunsukeHayashi/miyabi-private.git
cd miyabi-private

# Node.js依存関係
npm install

# Rustビルド (初回は時間がかかります)
cargo build

# Prismaセットアップ
npm run db:generate
npm run db:push
```

---

## 環境変数設定

### 基本設定

```bash
# .env.example をコピー
cp .env.example .env
```

### 必須環境変数

```bash
# === 必須 ===

# GitHub Personal Access Token
# スコープ: repo, workflow, read:org
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# データベース接続
DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi

# JWT シークレット (本番は強力なランダム文字列)
JWT_SECRET=your-jwt-secret-key-change-this-in-production

# 環境
ENVIRONMENT=development
NODE_ENV=development
```

### AI API キー (機能に応じて設定)

```bash
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx

# Google Gemini
GEMINI_API_KEY=xxxxxxxxxxxx

# OpenAI (オプション)
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

### GitHub OAuth (Web UIを使用する場合)

```bash
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/v1/auth/github/callback
```

---

## 検証

### miyabi doctor

```bash
npx miyabi doctor
```

**成功時の出力:**

```
🩺 Miyabi Health Check

  ✓ Node.js: v22.x.x (OK)
  ✓ Git: git version 2.43.x (OK)
  ✓ GitHub CLI: gh version 2.63.x (OK)
  ✓ GITHUB_TOKEN: Valid token format
  ✓ Token Permissions: repo, workflow scopes verified
  ✓ Network Connectivity: GitHub API reachable
  ✓ Repository: Git repository detected
  ✓ .miyabi.yml: Valid configuration
  ✓ Claude Code: Detected

Summary:
  ✓ 9 checks passed
  9 total checks

✓ Overall: All systems operational
```

### 個別コンポーネント確認

```bash
# Node.js
node --version

# Git
git --version

# Rust
rustc --version
cargo --version

# GitHub CLI
gh --version
gh auth status

# PostgreSQL接続
docker exec miyabi-postgres psql -U miyabi_admin -d miyabi -c "SELECT 1;"

# Rustビルド
cargo check

# フロントエンド
npm run dev
```

---

## トラブルシューティング

### GitHub CLI認証エラー

```bash
# 再認証
gh auth logout
gh auth login

# トークン確認
gh auth status
```

### PostgreSQL接続エラー

```bash
# コンテナ状態確認
docker ps -a | grep postgres

# ログ確認
docker logs miyabi-postgres

# 再起動
docker restart miyabi-postgres
```

### Rustビルドエラー

```bash
# キャッシュクリア
cargo clean

# 依存関係更新
cargo update

# 再ビルド
cargo build
```

### Node.jsパッケージエラー

```bash
# node_modules削除
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

### GitHub APIレート制限

```bash
# レート制限確認
gh api rate_limit

# 認証トークンが正しく設定されているか確認
echo $GITHUB_TOKEN | head -c 10
```

### ネットワーク接続エラー

```bash
# GitHub API疎通確認
curl -s https://api.github.com | head -5

# DNS確認
nslookup api.github.com
```

---

## 推奨開発環境

### macOS 一括セットアップ

```bash
# Homebrew一括インストール
brew install node@22 git gh rust docker

# Claude Code
brew install --cask claude

# tmux (オプション)
brew install tmux
```

### VS Code 拡張機能

推奨拡張機能:
- `rust-lang.rust-analyzer` - Rust言語サポート
- `tamasfe.even-better-toml` - TOML サポート
- `dbaeumer.vscode-eslint` - ESLint
- `esbenp.prettier-vscode` - Prettier
- `bradlc.vscode-tailwindcss` - Tailwind CSS

---

## EC2 (MUGEN/MAJIN) セットアップ

### SSH接続

```bash
# MUGEN
ssh -i ~/.ssh/mugen.pem ubuntu@mugen.miyabi.tech

# MAJIN
ssh -i ~/.ssh/majin.pem ubuntu@majin.miyabi.tech
```

### EC2 初期設定

```bash
# 依存関係インストール
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev

# Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install -y gh

# 認証
gh auth login
```

---

## 次のステップ

セットアップ完了後:

1. **miyabi doctor** で環境確認
2. **miyabi run** で自律開発を開始
3. **miyabi status** で状態監視

---

## 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [CLAUDE.md](../CLAUDE.md) | 開発ルール・プロトコル |
| [.env.example](../.env.example) | 環境変数リファレンス |
| [docker-compose.yml](../docker-compose.yml) | Docker構成 |
| [Cargo.toml](../Cargo.toml) | Rustワークスペース設定 |

---

*Generated by Miyabi Documentation System v1.0.0*
