# Miyabi No-Code Web UI

**完全自律型AI開発プラットフォーム - Web UI MVP**

GitHub as OS アーキテクチャに基づく、ノーコードAgent実行プラットフォーム。Issue作成からコード実装、PR作成、デプロイまでを完全自動化します。

---

## 📚 目次

1. [技術スタック](#技術スタック)
2. [プロジェクト構造](#プロジェクト構造)
3. [ローカル開発環境](#ローカル開発環境)
4. [デプロイメント](#デプロイメント)
5. [ドキュメント](#ドキュメント)
6. [ライセンス](#ライセンス)

---

## 技術スタック

### フロントエンド

| カテゴリ | 技術 | バージョン |
|---------|------|----------|
| **Framework** | Next.js | 14.2.18 |
| **Language** | TypeScript | 5.3+ |
| **UI Runtime** | React | 18.3.1 |
| **Styling** | Tailwind CSS | 3.4+ |
| **Component Library** | shadcn/ui | latest |
| **State Management** | Zustand | 4.x |
| **Data Fetching** | TanStack Query | 5.x |

### バックエンド

| カテゴリ | Crate | バージョン |
|---------|-------|----------|
| **Web Framework** | axum | 0.7+ |
| **Async Runtime** | tokio | 1.35+ |
| **Database** | PostgreSQL | 15+ |
| **ORM** | sqlx | 0.7+ |
| **WebSocket** | tokio-tungstenite | 0.21+ |

### インフラストラクチャ

- **Frontend**: Vercel (CDN + Edge Functions)
- **Backend**: AWS Lambda / Fly.io
- **Database**: AWS RDS PostgreSQL 15
- **CI/CD**: GitHub Actions

詳細: [docs/phase-0/TECH_STACK_DECISION.md](docs/phase-0/TECH_STACK_DECISION.md)

---

## プロジェクト構造

```
miyabi-web/
├── app/                       # Next.js 14 App Router
│   ├── (auth)/               # 認証ルート
│   ├── (dashboard)/          # ダッシュボードルート
│   ├── api/                  # API Routes
│   └── layout.tsx            # Root Layout
├── components/               # React Components
│   ├── ui/                   # shadcn/ui Components
│   ├── agents/               # Agent UI Components
│   ├── workflows/            # Workflow Editor Components
│   └── dashboard/            # Dashboard Components
├── lib/                      # Utility Libraries
│   ├── api-client.ts         # API Client (Axios)
│   ├── websocket.ts          # WebSocket Client
│   └── utils.ts              # Utility Functions
├── crates/                   # Rust Backend
│   └── miyabi-web-api/       # Web API Crate
│       ├── src/
│       │   ├── main.rs       # Entry Point
│       │   ├── routes/       # Axum Routes
│       │   ├── models/       # Database Models
│       │   ├── services/     # Business Logic
│       │   └── websocket/    # WebSocket Handler
│       └── migrations/       # SQLx Migrations
├── public/                   # Static Assets
├── docker-compose.yml        # Local Development
├── .env.example              # Environment Variables Template
└── README.md                 # This File
```

---

## ローカル開発環境

### 前提条件

- **Node.js**: 20.x LTS
- **Rust**: 1.75+ (Stable)
- **Docker**: 24.x
- **Docker Compose**: 2.x
- **PostgreSQL**: 15+ (Dockerで起動)

### セットアップ手順

#### 1. リポジトリクローン

```bash
git clone https://github.com/customer-cloud/miyabi-private.git
cd miyabi-private/miyabi-web
```

#### 2. 環境変数設定

```bash
cp .env.example .env
```

`.env`ファイルを編集し、以下を設定：
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth App
- `GITHUB_TOKEN` - GitHub Personal Access Token
- `NEXTAUTH_SECRET` - ランダム文字列 (32文字以上)
- `ANTHROPIC_API_KEY` - Anthropic APIキー（Agent実行用）

**GitHub OAuth App作成**: https://github.com/settings/developers

#### 3. Docker Compose起動

```bash
docker-compose up -d
```

起動するサービス：
- **postgres**: PostgreSQL 15 (ポート 5432)
- **redis**: Redis 7 (ポート 6379)
- **api**: Rust Web API (ポート 8080)
- **web**: Next.js Web UI (ポート 3000)

#### 4. データベース移行

```bash
# PostgreSQLコンテナ確認
docker-compose ps

# 移行実行（自動で実行済みだが、手動実行する場合）
docker-compose exec api sqlx migrate run
```

#### 5. フロントエンド起動

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

#### 6. ブラウザでアクセス

- **Web UI**: http://localhost:3000
- **API**: http://localhost:8080
- **API Health Check**: http://localhost:8080/health

---

## 開発コマンド

### Next.js (フロントエンド)

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションサーバー起動
npm run start

# Linter実行
npm run lint

# 型チェック
npm run type-check

# Prettier実行
npm run format

# テスト実行（Vitest）
npm run test

# E2Eテスト実行（Playwright）
npm run test:e2e
```

### Rust (バックエンド)

```bash
# 開発サーバー起動（Hot Reload）
cd crates/miyabi-web-api
cargo watch -x run

# ビルド
cargo build --package miyabi-web-api

# リリースビルド
cargo build --release --package miyabi-web-api

# テスト実行
cargo test --package miyabi-web-api

# Linter実行
cargo clippy --package miyabi-web-api -- -D warnings

# フォーマット
cargo fmt --package miyabi-web-api
```

### Docker Compose

```bash
# 全サービス起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 特定サービスのログ確認
docker-compose logs -f api

# 全サービス停止
docker-compose down

# データベースリセット（注意: 全データ削除）
docker-compose down -v
docker-compose up -d
```

---

## デプロイメント

### フロントエンド（Vercel）

**自動デプロイ**: `main`ブランチへのPushで自動デプロイ

```bash
# 手動デプロイ
vercel --prod
```

**環境変数設定** (Vercel Dashboard):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_WS_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

### バックエンド（Fly.io）

**前提条件**: Fly.io CLI (`flyctl`) インストール

```bash
# ログイン
flyctl auth login

# 初回デプロイ
cd crates/miyabi-web-api
flyctl launch

# 以降のデプロイ
flyctl deploy
```

**環境変数設定** (Fly.io):
```bash
flyctl secrets set DATABASE_URL=postgres://...
flyctl secrets set REDIS_URL=redis://...
flyctl secrets set GITHUB_TOKEN=ghp_...
```

### CI/CD（GitHub Actions）

**自動実行ワークフロー**:
- `.github/workflows/miyabi-web-api-ci.yml` - Rust API CI/CD
- `.github/workflows/miyabi-web-ui-ci.yml` - Next.js UI CI/CD

**トリガー**:
- `main`ブランチへのPush → Production Deploy
- Pull Request → Preview Deploy + Tests

---

## データベーススキーマ

### 7つのコアテーブル

1. **users** - GitHub OAuth認証ユーザー
2. **repositories** - 接続されたGitHubリポジトリ
3. **agent_executions** - Agent実行履歴（進捗・ログ）
4. **workflows** - ユーザー定義ワークフロー（React Flow）
5. **line_messages** - LINE Bot統合（Phase 6）
6. **websocket_connections** - WebSocket接続管理
7. **audit_logs** - セキュリティ監査ログ

**ER図**: 作成予定（Task 0.3）

**Migration**:
```bash
# 新規移行作成
sqlx migrate add <migration_name>

# 移行実行
sqlx migrate run

# ロールバック
sqlx migrate revert
```

---

## ドキュメント

### Phase 0 - アーキテクチャ設計

- [x] **Task 0.1**: [TECH_STACK_DECISION.md](docs/phase-0/TECH_STACK_DECISION.md) ✅
- [x] **Task 0.2**: プロジェクト初期化 ✅
  - Docker Compose設定
  - 環境変数テンプレート
  - CI/CDパイプライン
  - PostgreSQLスキーマ
- [ ] **Task 0.3**: 設計ドキュメント作成（次）
  - アーキテクチャ図
  - ER図
  - API仕様書（OpenAPI 3.0）
- [ ] **Task 0.4**: Figmaデザイン（20画面）

### 関連ドキュメント

- **親プロジェクト**: [../../CLAUDE.md](../../CLAUDE.md)
- **Agent仕様**: [../../.claude/agents/specs/coding/](../../.claude/agents/specs/coding/)
- **Label体系**: [../../docs/LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md)
- **Entity-Relationモデル**: [../../docs/ENTITY_RELATION_MODEL.md](../../docs/ENTITY_RELATION_MODEL.md)

---

## トラブルシューティング

### PostgreSQL接続エラー

```bash
# Dockerコンテナ確認
docker-compose ps

# PostgreSQLログ確認
docker-compose logs postgres

# ヘルスチェック
docker-compose exec postgres pg_isready -U miyabi
```

### Next.js ビルドエラー

```bash
# node_modules削除 + 再インストール
rm -rf node_modules package-lock.json
npm install

# Next.jsキャッシュクリア
rm -rf .next
npm run build
```

### Rust コンパイルエラー

```bash
# Cargoキャッシュクリア
cargo clean

# 依存関係更新
cargo update

# ビルド
cargo build --package miyabi-web-api
```

---

## ライセンス

**Proprietary** - Private Repository

このプロジェクトは、Miyabi開発チームの所有物です。無断での使用・複製・配布を禁止します。

---

## 開発チーム

- **Lead Developer**: Shunsuke Hayashi (@ShunsukeHayashi)
- **AI Assistant**: Claude Code (Anthropic)

---

## 次のステップ

- [ ] Task 0.3: 設計ドキュメント作成
- [ ] Task 0.4: Figmaデザイン
- [ ] Issue #426: Phase 1 Web基盤（GitHub OAuth + Dashboard）
- [ ] Issue #428: Phase 3 Agent実行UI

**Milestone 34**: Week 12 MVP Launch (2026-01-14)

---

**🤖 Generated with [Claude Code](https://claude.com/claude-code)**

Co-Authored-By: Claude <noreply@anthropic.com>
