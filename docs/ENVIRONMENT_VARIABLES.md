# Miyabi - 環境変数ドキュメント

**Version**: 1.0.0  
**Last Updated**: 2025-11-29  
**Maintainer**: Miyabi Development Team

---

## 📋 目次

1. [概要](#概要)
2. [環境別設定](#環境別設定)
3. [環境変数一覧](#環境変数一覧)
   - [環境設定](#1-環境設定)
   - [データベース設定](#2-データベース設定)
   - [サーバー設定](#3-サーバー設定)
   - [認証・セキュリティ](#4-認証セキュリティ)
   - [GitHub認証・API](#5-github認証api)
   - [AI/ML API Keys](#6-aiml-api-keys)
   - [Lark統合](#7-lark統合)
   - [Discord統合](#8-discord統合)
   - [Twitter/X統合](#9-twitterx統合)
   - [AWS設定](#10-aws設定)
   - [LINE統合](#11-line統合)
   - [Miyabi固有設定](#12-miyabi固有設定)
   - [Git Worktree設定](#13-git-worktree設定)
   - [デプロイメント設定](#14-デプロイメント設定)
   - [ファイルシステム設定](#15-ファイルシステム設定)
   - [フロントエンド設定](#16-フロントエンド設定)
   - [ロギング・デバッグ](#17-ロギングデバッグ)
   - [テスト設定](#18-テスト設定)
4. [環境別設定例](#環境別設定例)
5. [セキュリティベストプラクティス](#セキュリティベストプラクティス)
6. [トラブルシューティング](#トラブルシューティング)

---

## 概要

Miyabiプロジェクトは、複数のコンポーネント（Rust API、Next.js Web、MCPサーバー、Pythonアプリケーション）で構成されており、それぞれが環境変数を使用して設定を管理します。

### 設定ファイルの配置

- **`.env.example`**: 環境変数のテンプレートファイル（このファイルをコピーして使用）
- **`.env`**: 実際の環境変数設定ファイル（**Gitにコミットしない**）
- **`docs/ENVIRONMENT_VARIABLES.md`**: このドキュメント（詳細説明）

### 設定の読み込み順序

1. **システム環境変数** (最優先)
2. **`.env`ファイル** (ローカル開発)
3. **AWS Secrets Manager** (AWS Lambda環境)
4. **デフォルト値** (コード内定義)

---

## 環境別設定

### ローカル開発環境 (Local Development)

```bash
# .env
ENVIRONMENT=development
NODE_ENV=development
DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi
SERVER_ADDRESS=0.0.0.0:8080
FRONTEND_URL=http://localhost:3000
JWT_SECRET=local-dev-secret-change-this
```

### ステージング環境 (Staging)

```bash
# AWS Secrets Manager or .env
ENVIRONMENT=staging
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@staging-db.rds.amazonaws.com:5432/miyabi
SERVER_ADDRESS=0.0.0.0:8080
FRONTEND_URL=https://staging.miyabi-world.com
JWT_SECRET=<strong-random-secret>
```

### 本番環境 (Production)

```bash
# AWS Secrets Manager
ENVIRONMENT=production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.rds.amazonaws.com:5432/miyabi
SERVER_ADDRESS=0.0.0.0:8080
FRONTEND_URL=https://miyabi-world.com
JWT_SECRET=<very-strong-random-secret>
```

---

## 環境変数一覧

### 1. 環境設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `ENVIRONMENT` | ✅ | `development` | 実行環境 (`development`, `staging`, `production`) |
| `NODE_ENV` | ❌ | `development` | Node.js実行モード (`development`, `production`) |
| `DEVICE_IDENTIFIER` | ❌ | - | デバイス識別子（マルチデバイス環境用） |

**使用箇所**:
- `crates/miyabi-web-api/src/config.rs:203`
- `mcp-servers/miyabi-commercial-agents/src/index.ts:28`

**例**:
```bash
ENVIRONMENT=production
NODE_ENV=production
DEVICE_IDENTIFIER=pixel-9-pro-xl
```

---

### 2. データベース設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `DATABASE_URL` | ✅ | - | PostgreSQL接続URL |
| `DB_MAX_CONNECTIONS` | ❌ | 環境依存 | 最大コネクション数（dev: 20, prod: 100） |
| `DB_MIN_CONNECTIONS` | ❌ | 環境依存 | 最小アイドルコネクション数（dev: 5, prod: 10） |
| `DB_ACQUIRE_TIMEOUT_SECS` | ❌ | 環境依存 | コネクション取得タイムアウト（秒） |
| `DB_IDLE_TIMEOUT_SECS` | ❌ | 環境依存 | アイドルタイムアウト（秒） |
| `DB_MAX_LIFETIME_SECS` | ❌ | 環境依存 | 最大ライフタイム（秒） |
| `DB_TEST_BEFORE_ACQUIRE` | ❌ | 環境依存 | コネクション取得前のテスト有無 |

**使用箇所**:
- `crates/miyabi-web-api/src/config.rs:168-206`

**接続URL形式**:
```
postgresql://ユーザー名:パスワード@ホスト:ポート/データベース名
```

**例**:
```bash
# ローカル開発
DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi

# 本番環境 (RDS)
DATABASE_URL=postgresql://admin:SecurePass123@miyabi-prod.xxxxx.us-west-2.rds.amazonaws.com:5432/miyabi

# プール設定（本番環境）
DB_MAX_CONNECTIONS=100
DB_MIN_CONNECTIONS=10
DB_ACQUIRE_TIMEOUT_SECS=30
DB_IDLE_TIMEOUT_SECS=600
DB_MAX_LIFETIME_SECS=1800
DB_TEST_BEFORE_ACQUIRE=true
```

---

### 3. サーバー設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `SERVER_ADDRESS` | ❌ | `0.0.0.0:8080` | APIサーバーバインドアドレス |
| `PORT` | ❌ | `8080` | サーバーポート |
| `FRONTEND_URL` | ❌ | `http://localhost:3000` | フロントエンドURL（CORS設定用） |
| `BASE_URL` | ❌ | - | ベースURL |
| `ALLOWED_ORIGINS` | ❌ | - | 許可するOrigin（カンマ区切り） |

**使用箇所**:
- `crates/miyabi-web-api/src/config.rs:175-191`
- `mcp-servers/miyabi-sse-gateway/src/index.ts:19`

**例**:
```bash
SERVER_ADDRESS=0.0.0.0:8080
PORT=8080
FRONTEND_URL=https://miyabi-world.com
BASE_URL=https://api.miyabi-world.com
ALLOWED_ORIGINS=https://miyabi-world.com,https://admin.miyabi-world.com
```

---

### 4. 認証・セキュリティ

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `JWT_SECRET` | ✅ | - | JWT署名用シークレットキー |
| `JWT_EXPIRATION` | ❌ | `3600` | JWTトークン有効期限（秒） |
| `REFRESH_EXPIRATION` | ❌ | `604800` | リフレッシュトークン有効期限（秒） |

**使用箇所**:
- `crates/miyabi-web-api/src/config.rs:178-201`

**セキュリティ要件**:
- 本番環境では**最低32文字**の強力なランダム文字列を使用
- 環境ごとに異なるシークレットを使用
- AWS Secrets Managerで管理することを推奨

**シークレット生成方法**:
```bash
# OpenSSLを使用
openssl rand -base64 32

# または、Pythonを使用
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**例**:
```bash
JWT_SECRET=your-very-strong-random-secret-key-minimum-32-characters
JWT_EXPIRATION=3600
REFRESH_EXPIRATION=604800
```

---

### 5. GitHub認証・API

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `GITHUB_TOKEN` | ✅ | - | GitHub Personal Access Token |
| `GITHUB_CLIENT_ID` | OAuth時必須 | - | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth時必須 | - | GitHub OAuth App Client Secret |
| `GITHUB_CALLBACK_URL` | ❌ | `http://localhost:8080/api/v1/auth/github/callback` | OAuth コールバックURL |
| `GITHUB_DEFAULT_OWNER` | ❌ | - | デフォルトのリポジトリオーナー |
| `GITHUB_DEFAULT_REPO` | ❌ | - | デフォルトのリポジトリ名 |
| `GITHUB_REPOSITORY` | ❌ | - | リポジトリフルネーム（owner/repo） |
| `GITHUB_REPOSITORY_PATH` | ❌ | - | ローカルリポジトリパス |
| `GITHUB_WEBHOOK_SECRET` | ❌ | - | Webhookシークレット |

**使用箇所**:
- `crates/miyabi-web-api/src/config.rs:181-188`
- `crates/miyabi-cli/src/commands/a2a.rs:123`
- `mcp-servers/miyabi-github/src/index.ts:19-21`

**必要なスコープ**:
- `repo` - リポジトリへのフルアクセス
- `workflow` - GitHub Actions ワークフロー
- `read:org` - 組織情報の読み取り

**例**:
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_CALLBACK_URL=https://api.miyabi-world.com/api/v1/auth/github/callback
GITHUB_DEFAULT_OWNER=customer-cloud
GITHUB_DEFAULT_REPO=miyabi-private
GITHUB_REPOSITORY=customer-cloud/miyabi-private
GITHUB_REPOSITORY_PATH=/home/ubuntu/miyabi-private
```

---

### 6. AI/ML API Keys

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `ANTHROPIC_API_KEY` | Claude機能使用時必須 | - | Anthropic Claude API Key |
| `GEMINI_API_KEY` | Gemini機能使用時必須 | - | Google Gemini API Key |
| `GEMINI_MODEL` | ❌ | `gemini-3-pro-preview` | 使用するGeminiモデル |
| `GEMINI_THINKING_LEVEL` | ❌ | `high` | 思考レベル (`low`, `medium`, `high`) |
| `OPENAI_API_KEY` | OpenAI機能使用時必須 | - | OpenAI API Key |
| `OPENAI_MODEL` | ❌ | `gpt-4-turbo-preview` | 使用するOpenAIモデル |
| `XAI_API_KEY` | ❌ | - | xAI (Grok) API Key |
| `ARK_API_KEY` | ❌ | - | ARK API Key（画像生成等） |

**使用箇所**:
- `miyabi-web/crates/miyabi-web-api/src/integrations/claude.rs:114`
- `mcp-servers/gemini3-general/src/index.ts:22`
- `mcp-servers/miyabi-openai-assistant/src/index.ts:9`

**例**:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-3-pro-preview
GEMINI_THINKING_LEVEL=high
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
```

---

### 7. Lark統合

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `LARK_APP_ID` | Lark機能使用時必須 | - | Lark App ID |
| `LARK_APP_SECRET` | Lark機能使用時必須 | - | Lark App Secret |
| `LARK_VERIFICATION_TOKEN` | ❌ | - | Lark Verification Token |

**使用箇所**:
- `crates/miyabi-cli/src/commands/lark.rs:128-135`
- `integrations/miyabi-lark-sync/src/index.ts:72-73`

**例**:
```bash
LARK_APP_ID=cli_xxxxxxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_VERIFICATION_TOKEN=xxxxxxxxxxxxxxxxxxxx
```

---

### 8. Discord統合

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `DISCORD_BOT_TOKEN` | Discord機能使用時必須 | - | Discord Bot Token |
| `GUILD_ID` | ❌ | - | Discord Server (Guild) ID |
| `PROGRESS_CHANNEL_ID` | ❌ | - | 進捗報告チャンネルID |
| `INTRODUCTIONS_CHANNEL_ID` | ❌ | - | 自己紹介チャンネルID |

**使用箇所**:
- `crates/miyabi-discord-mcp-server/src/bin/miyabi-bot.rs:771-785`

**例**:
```bash
DISCORD_BOT_TOKEN=MTxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GUILD_ID=1234567890123456789
PROGRESS_CHANNEL_ID=1234567890123456789
INTRODUCTIONS_CHANNEL_ID=1234567890123456789
```

---

### 9. Twitter/X統合

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `TWITTER_API_KEY` | X投稿機能使用時必須 | - | Twitter API Key |
| `TWITTER_API_SECRET` | X投稿機能使用時必須 | - | Twitter API Secret |
| `TWITTER_ACCESS_TOKEN` | X投稿機能使用時必須 | - | Twitter Access Token |
| `TWITTER_ACCESS_SECRET` | X投稿機能使用時必須 | - | Twitter Access Secret |
| `TWITTER_BEARER_TOKEN` | X投稿機能使用時必須 | - | Twitter Bearer Token |

**使用箇所**:
- `mcp-servers/miyabi-commercial-agents/src/agents/tsubuyakun-sns.ts:122-126`

**例**:
```bash
TWITTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_ACCESS_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 10. AWS設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `AWS_REGION` | ❌ | `us-west-2` | AWS リージョン |
| `AWS_ACCESS_KEY_ID` | IAMロール未使用時必須 | - | AWS Access Key ID |
| `AWS_SECRET_ACCESS_KEY` | IAMロール未使用時必須 | - | AWS Secret Access Key |
| `AWS_EXECUTION_ENV` | 自動設定 | - | Lambda実行環境識別子 |

**使用箇所**:
- `openai-apps/miyabi-app/server/core/secrets.py:25`

**注意**:
- Lambda環境では`AWS_EXECUTION_ENV`が自動設定され、Secrets Managerからシークレットを自動ロード
- EC2/ECS環境ではIAMロールの使用を推奨（認証情報不要）

**例**:
```bash
AWS_REGION=us-west-2
# IAMロール未使用の場合のみ
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

### 11. LINE統合

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE機能使用時必須 | - | LINE Channel Access Token |

**使用箇所**:
- `miyabi-web/crates/miyabi-web-api/src/main.rs:32`

**例**:
```bash
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 12. Miyabi固有設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `MIYABI_LICENSE_KEY` | 商用Agent使用時必須 | - | Miyabiライセンスキー |
| `MIYABI_API_KEY` | ❌ | - | Miyabi内部API認証キー |
| `MIYABI_BEARER_TOKEN` | ❌ | - | SSE Gateway認証トークン |
| `MIYABI_OAUTH_SECRET` | ❌ | - | OAuth Secret |
| `MIYABI_RULES_API_URL` | ❌ | - | Rules API URL |
| `MIYABI_LICENSE_API` | ❌ | `https://api.miyabi.tech/validate` | ライセンス検証API URL |
| `MIYABI_SECRET_SALT` | ❌ | `MIYABI_DEFAULT_SALT_2025` | シークレットソルト |

**使用箇所**:
- `mcp-servers/miyabi-commercial-agents/src/license-validator.ts:26`
- `mcp-servers/miyabi-sse-gateway/src/auth.ts:12`

**ライセンスキー形式**:
```
MIYABI-COMMERCIAL-{TIER}-{HASH}
```

**Tierレベル**:
- `STARTER` - 基本機能
- `PRO` - プロフェッショナル機能
- `ENTERPRISE` - エンタープライズ機能

**例**:
```bash
MIYABI_LICENSE_KEY=MIYABI-COMMERCIAL-PRO-A1B2C3D4E5F6G7H8I9J0
MIYABI_API_KEY=miyabi_api_key_xxxxxxxxxxxxxxxxxxxx
MIYABI_BEARER_TOKEN=bearer_token_xxxxxxxxxxxxxxxxxxxx
```

---

### 13. Git Worktree設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `MIYABI_WORKTREE_BASE_PATH` | ❌ | `/tmp/miyabi-worktrees` | Worktreeベースパス |
| `MIYABI_BASE_BRANCH` | ❌ | `main` | Git ベースブランチ |

**使用箇所**:
- `crates/miyabi-cli/src/commands/worktree.rs:89`
- `crates/miyabi-cli/src/commands/agent.rs:371`

**例**:
```bash
MIYABI_WORKTREE_BASE_PATH=/tmp/miyabi-worktrees
MIYABI_BASE_BRANCH=main
```

---

### 14. デプロイメント設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `MIYABI_DEPLOY_ENV` | ❌ | `staging` | デプロイ環境 (`staging`, `production`) |
| `MIYABI_PRODUCTION_HEALTH_URL` | ❌ | - | 本番ヘルスチェックURL |
| `MIYABI_STAGING_HEALTH_URL` | ❌ | - | ステージングヘルスチェックURL |

**使用箇所**:
- `crates/miyabi-cli/src/commands/agent.rs:407-417`

**例**:
```bash
MIYABI_DEPLOY_ENV=production
MIYABI_PRODUCTION_HEALTH_URL=https://api.miyabi-world.com/health
MIYABI_STAGING_HEALTH_URL=https://staging-api.miyabi-world.com/health
```

---

### 15. ファイルシステム設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `MIYABI_REPO_PATH` | ❌ | - | Miyabiリポジトリパス |
| `MIYABI_WATCH_DIR` | ❌ | - | ファイル監視ディレクトリ |
| `MIYABI_FILE_ACCESS_BASE_PATH` | ❌ | `process.cwd()` | ファイルアクセスベースパス |
| `MIYABI_FILE_ACCESS_ALLOW_OUTSIDE` | ❌ | `false` | ベースパス外アクセス許可 |
| `MIYABI_FILE_ACCESS_MAX_SIZE` | ❌ | `10485760` (10MB) | 最大ファイルサイズ（バイト） |
| `MIYABI_LOG_DIR` | ❌ | - | ログディレクトリ |
| `MCP_SERVER_PATH` | ❌ | - | MCPサーバーパス |

**使用箇所**:
- `mcp-servers/miyabi-git-inspector/src/index.ts:9`
- `mcp-servers/miyabi-file-access/src/index.ts:37-43`

**例**:
```bash
MIYABI_REPO_PATH=/home/ubuntu/miyabi-private
MIYABI_WATCH_DIR=/home/ubuntu/miyabi-private
MIYABI_FILE_ACCESS_BASE_PATH=/home/ubuntu/miyabi-private
MIYABI_FILE_ACCESS_ALLOW_OUTSIDE=false
MIYABI_FILE_ACCESS_MAX_SIZE=10485760
MIYABI_LOG_DIR=/home/ubuntu/miyabi-private/.ai/logs
MCP_SERVER_PATH=/home/ubuntu/miyabi-private/mcp-servers
```

---

### 16. フロントエンド設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `NEXT_PUBLIC_API_URL` | ❌ | `http://localhost:8080` | バックエンドAPI URL |
| `NEXT_PUBLIC_WS_URL` | ❌ | `ws://localhost:8080` | WebSocket URL |
| `NEXT_PUBLIC_OAUTH_REDIRECT_URL` | ❌ | `http://localhost:3000/auth/callback` | OAuth リダイレクトURL |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | ❌ | - | GitHub OAuth Client ID (Public) |

**使用箇所**:
- `miyabi-web/src/lib/api.ts:7`
- `apps/pantheon-webapp/app/contexts/AuthContext.tsx:61-63`

**注意**:
- `NEXT_PUBLIC_` プレフィックスは、Next.jsでクライアントサイドに公開される変数
- シークレット情報は含めないこと

**例**:
```bash
NEXT_PUBLIC_API_URL=https://api.miyabi-world.com
NEXT_PUBLIC_WS_URL=wss://api.miyabi-world.com
NEXT_PUBLIC_OAUTH_REDIRECT_URL=https://miyabi-world.com/auth/callback
NEXT_PUBLIC_GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
```

---

### 17. ロギング・デバッグ

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `RUST_LOG` | ❌ | `info` | Rustログレベル |
| `LOG_LEVEL` | ❌ | - | Node.jsログレベル |
| `DEBUG` | ❌ | - | デバッグモード有効化 |

**使用箇所**:
- `crates/miyabi-discord-mcp-server/src/main.rs:32`
- `logging-config.ts:28`

**ログレベル**:
- `trace` - 最も詳細
- `debug` - デバッグ情報
- `info` - 通常の情報
- `warn` - 警告
- `error` - エラーのみ

**例**:
```bash
# 全体をinfo、miyabi関連をdebugに設定
RUST_LOG=miyabi=debug,info

# Node.js
LOG_LEVEL=debug
DEBUG=true
```

---

### 18. テスト設定

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|------------|------|
| `PLAYWRIGHT_BASE_URL` | ❌ | `http://localhost:3000` | Playwright テストベースURL |
| `CI` | 自動設定 | - | CI環境識別子 |
| `SKIP_INTEGRATION_TESTS` | ❌ | - | 統合テストスキップフラグ |
| `DASHBOARD_SERVER_URL` | ❌ | `http://localhost:3001` | テストレポートダッシュボードURL |

**使用箇所**:
- `playwright.config.ts:15-33`
- `crates/miyabi-historical/src/ai/retrieval.rs:159`

**例**:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000
SKIP_INTEGRATION_TESTS=true
DASHBOARD_SERVER_URL=http://localhost:3001
```

---

## 環境別設定例

### 最小構成（ローカル開発）

```bash
# .env
ENVIRONMENT=development
DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi
JWT_SECRET=local-dev-secret-please-change
GITHUB_TOKEN=ghp_your_github_token
ANTHROPIC_API_KEY=sk-ant-api03-your-key
```

### フル構成（本番環境）

```bash
# AWS Secrets Manager
# Secret: miyabi/prod/config
{
  "ENVIRONMENT": "production",
  "NODE_ENV": "production",
  "DATABASE_URL": "postgresql://admin:SecurePass@prod-db.rds.amazonaws.com:5432/miyabi",
  "SERVER_ADDRESS": "0.0.0.0:8080",
  "FRONTEND_URL": "https://miyabi-world.com",
  "JWT_SECRET": "very-strong-random-secret-key-32-chars-min",
  "JWT_EXPIRATION": "3600",
  "REFRESH_EXPIRATION": "604800",
  "GITHUB_CLIENT_ID": "Iv1.xxxx",
  "GITHUB_CLIENT_SECRET": "xxxx",
  "GITHUB_CALLBACK_URL": "https://api.miyabi-world.com/api/v1/auth/github/callback",
  "DB_MAX_CONNECTIONS": "100",
  "DB_MIN_CONNECTIONS": "10",
  "DB_TEST_BEFORE_ACQUIRE": "true",
  "MIYABI_DEPLOY_ENV": "production",
  "MIYABI_PRODUCTION_HEALTH_URL": "https://api.miyabi-world.com/health",
  "RUST_LOG": "info"
}

# Secret: miyabi/prod/api-keys
{
  "GITHUB_TOKEN": "ghp_xxxx",
  "ANTHROPIC_API_KEY": "sk-ant-api03-xxxx",
  "GEMINI_API_KEY": "AIzaSyxxxx",
  "OPENAI_API_KEY": "sk-xxxx",
  "LARK_APP_ID": "cli_xxxx",
  "LARK_APP_SECRET": "xxxx",
  "MIYABI_LICENSE_KEY": "MIYABI-COMMERCIAL-PRO-xxxx",
  "MIYABI_API_KEY": "miyabi_api_key_xxxx",
  "MIYABI_BEARER_TOKEN": "bearer_token_xxxx"
}
```

---

## セキュリティベストプラクティス

### 1. シークレット管理

#### ❌ 悪い例
```bash
# .envファイルをGitにコミット
git add .env
git commit -m "Add environment config"
```

#### ✅ 良い例
```bash
# .env.exampleのみをコミット
git add .env.example
git commit -m "Add environment config template"

# .envは.gitignoreに含める
echo ".env" >> .gitignore
```

### 2. シークレットキーの強度

#### ❌ 悪い例
```bash
JWT_SECRET=secret123
JWT_SECRET=myapp
```

#### ✅ 良い例
```bash
# 32文字以上のランダム文字列
JWT_SECRET=Kx9mN2pQ7vR4wS8tY6uZ3aB5cD1eF0gH
```

### 3. 環境別のシークレット

#### ❌ 悪い例
```bash
# 全環境で同じシークレットを使用
JWT_SECRET=same-secret-for-all-environments
```

#### ✅ 良い例
```bash
# 開発環境
JWT_SECRET=dev-secret-Kx9mN2pQ7vR4wS8t

# ステージング環境
JWT_SECRET=staging-secret-Y6uZ3aB5cD1eF0gH

# 本番環境
JWT_SECRET=prod-secret-P9oL8kJ7hG6fD5sA
```

### 4. AWS Secrets Managerの使用

```bash
# Lambda環境では自動ロード
# openai-apps/miyabi-app/server/core/secrets.py

# 手動ロード（必要な場合）
aws secretsmanager get-secret-value \
  --secret-id miyabi/prod/api-keys \
  --region us-west-2 \
  --query SecretString \
  --output text | jq -r 'to_entries|map("\(.key)=\(.value|@sh)")|.[]'
```

### 5. 環境変数の検証

プロジェクト起動時に必須環境変数をチェック:

```rust
// Rust例 (crates/miyabi-web-api/src/config.rs)
pub fn from_env() -> Result<Self, String> {
    let database_url = env::var("DATABASE_URL").map_err(|_| {
        "DATABASE_URL environment variable is required.\n\
         Example: DATABASE_URL=postgresql://user:password@host:5432/database"
            .to_string()
    })?;
    
    // ...
}
```

---

## トラブルシューティング

### Q1: `DATABASE_URL environment variable is required` エラー

**原因**: DATABASE_URLが設定されていない

**解決方法**:
```bash
# .envファイルに追加
echo "DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi" >> .env

# または、環境変数として設定
export DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi
```

### Q2: `JWT_SECRET environment variable is required` エラー

**原因**: JWT_SECRETが設定されていない

**解決方法**:
```bash
# 強力なシークレットを生成
JWT_SECRET=$(openssl rand -base64 32)

# .envファイルに追加
echo "JWT_SECRET=$JWT_SECRET" >> .env
```

### Q3: GitHub API認証エラー

**原因**: GITHUB_TOKENが無効または権限不足

**解決方法**:
1. GitHubで新しいPersonal Access Tokenを生成
   - Settings > Developer settings > Personal access tokens > Tokens (classic)
   - 必要なスコープ: `repo`, `workflow`, `read:org`
2. .envファイルを更新
   ```bash
   GITHUB_TOKEN=ghp_new_generated_token
   ```

### Q4: Lark/Discord/Twitter統合が動作しない

**原因**: 各サービスのAPI認証情報が未設定

**解決方法**:
1. 各サービスで認証情報を取得
2. .envファイルに追加
   ```bash
   # Lark
   LARK_APP_ID=cli_xxxx
   LARK_APP_SECRET=xxxx
   
   # Discord
   DISCORD_BOT_TOKEN=MTxxxx.xxxx.xxxx
   
   # Twitter
   TWITTER_API_KEY=xxxx
   TWITTER_API_SECRET=xxxx
   ```

### Q5: AWS Lambdaで環境変数が読み込まれない

**原因**: Secrets Managerのシークレット名が間違っている

**解決方法**:
```bash
# シークレット名の確認
# デフォルト: miyabi/prod/api-keys, miyabi/prod/config

# カスタムシークレット名を使用する場合は、secrets.pyを修正
# openai-apps/miyabi-app/server/core/secrets.py:99-104
```

### Q6: MCP サーバーが環境変数を認識しない

**原因**: MCPサーバーの起動前に環境変数が設定されていない

**解決方法**:
```bash
# .envファイルを確認
cat .env

# MCPサーバーを再起動
# Claude Code MCP設定を再読み込み
```

### Q7: Next.js で `NEXT_PUBLIC_*` 変数が undefined

**原因**: ビルド時に環境変数が設定されていない

**解決方法**:
```bash
# ビルド前に.envファイルを確認
cat .env

# Next.jsを再ビルド
npm run build

# または、開発サーバーを再起動
npm run dev
```

---

## 付録: 環境変数チェックリスト

### ローカル開発環境

- [ ] `ENVIRONMENT=development`
- [ ] `DATABASE_URL` (PostgreSQL接続URL)
- [ ] `JWT_SECRET` (強力なランダム文字列)
- [ ] `GITHUB_TOKEN` (Personal Access Token)
- [ ] `ANTHROPIC_API_KEY` (Claude使用時)
- [ ] `GEMINI_API_KEY` (Gemini使用時)

### ステージング環境

- [ ] `ENVIRONMENT=staging`
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (ステージングDB)
- [ ] `JWT_SECRET` (本番用シークレット)
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `FRONTEND_URL`
- [ ] 全てのAPI Keys
- [ ] AWS Secrets Managerに保存済み

### 本番環境

- [ ] `ENVIRONMENT=production`
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL` (本番DB)
- [ ] `JWT_SECRET` (本番用シークレット、ステージングと異なる)
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `FRONTEND_URL`
- [ ] 全てのAPI Keys
- [ ] AWS Secrets Managerに保存済み
- [ ] データベース接続プール設定最適化済み
- [ ] ヘルスチェックURL設定済み
- [ ] ロギングレベル適切に設定済み

---

**最終更新**: 2025-11-29  
**バージョン**: 1.0.0  
**メンテナー**: Miyabi Development Team

---

**関連ドキュメント**:
- [.env.example](/.env.example) - 環境変数テンプレート
- [CLAUDE.md](/CLAUDE.md) - プロジェクト概要
- [docs/DEPLOYMENT.md](/docs/DEPLOYMENT.md) - デプロイメントガイド
- [crates/miyabi-web-api/README.md](/crates/miyabi-web-api/README.md) - Web API ドキュメント
