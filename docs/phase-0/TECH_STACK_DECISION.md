# Phase 0: 技術スタック最終決定書

**作成日**: 2025-10-24
**バージョン**: v1.0
**ステータス**: ✅ 決定完了
**関連Issue**: #425

---

## 📋 目次

1. [概要](#概要)
2. [フロントエンド技術スタック](#フロントエンド技術スタック)
3. [バックエンド技術スタック](#バックエンド技術スタック)
4. [インフラストラクチャ](#インフラストラクチャ)
5. [開発ツール](#開発ツール)
6. [決定理由](#決定理由)

---

## 概要

Miyabi No-Code Web UI MVP（Week 12 Launch）の技術スタックを最終決定。
モダンなフルスタック構成で、高速開発と本番環境でのスケーラビリティを両立。

**目標**:
- ✅ 高速な開発サイクル（Hot Reload、TypeScript型安全性）
- ✅ 優れたユーザー体験（React 18、Next.js 14 App Router）
- ✅ 高いパフォーマンス（Rust、WebAssembly対応）
- ✅ スケーラビリティ（Serverless、PostgreSQL）
- ✅ 低コスト運用（Vercel無料枠 + AWS Lambda最適化）

---

## フロントエンド技術スタック

### コア技術

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|----------|---------|
| **Framework** | Next.js | 14.x | App Router、Server Components、最新React機能 |
| **Language** | TypeScript | 5.3+ | 型安全性、開発効率、エディタサポート |
| **UI Runtime** | React | 18.x | Server Components、Suspense、Concurrent Features |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first、高速開発、shadcn/ui互換 |
| **Component Library** | shadcn/ui | latest | Radix UI + Tailwind、カスタマイズ性高 |

### 状態管理・データフェッチ

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|----------|---------|
| **State Management** | Zustand | 4.x | 軽量、シンプルAPI、TypeScript親和性 |
| **Data Fetching** | TanStack Query | 5.x | キャッシュ管理、自動リフェッチ、Suspense対応 |
| **Form Handling** | React Hook Form | 7.x | 高速、バリデーション（Zod統合） |
| **Schema Validation** | Zod | 3.x | TypeScript型推論、エラーメッセージ |

### UI/UX ライブラリ

| カテゴリ | 技術 | バージョン | 選定理由 |
|---------|------|----------|---------|
| **Icons** | lucide-react | latest | Modern、Tree-shakable、SVG |
| **Charts** | recharts | 2.x | Declarative、Responsive、React統合 |
| **Date Handling** | date-fns | 3.x | Immutable、Tree-shakable、i18n対応 |
| **Workflow Visualization** | react-flow-renderer | 11.x | ノードベースUI、カスタマイズ性 |

### フロントエンド package.json（抜粋）

```json
{
  "name": "miyabi-web-ui",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "lucide-react": "^0.292.0",
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "react-flow-renderer": "^11.10.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "14.0.0",
    "prettier": "^3.1.0",
    "prettier-plugin-tailwindcss": "^0.5.7"
  }
}
```

---

## バックエンド技術スタック

### コア技術（Rust）

| カテゴリ | Crate | バージョン | 選定理由 |
|---------|-------|----------|---------|
| **Web Framework** | axum | 0.7+ | Tokio統合、型安全、高速 |
| **HTTP Utilities** | tower | 0.4+ | Middleware、Service抽象化 |
| **HTTP Middleware** | tower-http | 0.5+ | CORS、Compression、Tracing |
| **Async Runtime** | tokio | 1.35+ | Non-blocking I/O、マルチスレッド |
| **WebSocket** | tokio-tungstenite | 0.21+ | リアルタイム通信（Agent進捗） |

### データベース・ORM

| カテゴリ | Crate | バージョン | 選定理由 |
|---------|-------|----------|---------|
| **Database** | PostgreSQL | 15+ | JSONB、Full-text search、Partitioning |
| **ORM** | sqlx | 0.7+ | Compile-time query verification、Async |
| **Migration** | sqlx-cli | 0.7+ | スキーマ管理、バージョニング |

### 認証・セキュリティ

| カテゴリ | Crate | バージョン | 選定理由 |
|---------|-------|----------|---------|
| **JWT** | jsonwebtoken | 9.2+ | GitHub OAuth token管理 |
| **Password Hashing** | argon2 | 0.5+ | 将来の拡張（パスワード認証） |
| **CORS** | tower-http | 0.5+ | Cross-Origin対応 |

### Miyabi統合

| カテゴリ | Crate | パス | 説明 |
|---------|-------|------|-----|
| **Agent-to-Agent** | miyabi-a2a | `../miyabi-a2a` | Agent間通信 |
| **Core Types** | miyabi-types | `../miyabi-types` | 共通型定義 |
| **GitHub Integration** | miyabi-github | `../miyabi-github` | GitHub API |
| **Agent System** | miyabi-agents | `../miyabi-agents` | 21 Agents |

### バックエンド Cargo.toml（抜粋）

```toml
[package]
name = "miyabi-web-api"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web Framework
axum = { version = "0.7", features = ["ws", "macros"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace", "compression-gzip"] }

# 非同期ランタイム
tokio = { version = "1.35", features = ["full"] }

# シリアライゼーション
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# WebSocket
tokio-tungstenite = "0.21"

# HTTP Client
reqwest = { version = "0.11", features = ["json"] }

# 既存Miyabi統合
miyabi-a2a = { path = "../miyabi-a2a" }
miyabi-types = { path = "../miyabi-types" }
miyabi-github = { path = "../miyabi-github" }
miyabi-agents = { path = "../miyabi-agents" }

# 認証
jsonwebtoken = "9.2"
argon2 = "0.5"

# データベース
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "macros", "migrate"] }

# エラーハンドリング
thiserror = "1.0"
anyhow = "1.0"

# ログ
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# 環境変数
dotenvy = "0.15"

[dev-dependencies]
axum-test = "14.0"
```

---

## インフラストラクチャ

### フロントエンド（Vercel）

```yaml
Platform: Vercel
  Framework: Next.js 14 (自動検出)
  Node.js: 20.x
  Build Command: npm run build
  Output Directory: .next
  Install Command: npm install
  Environment Variables:
    - NEXT_PUBLIC_API_URL
    - NEXT_PUBLIC_WS_URL
    - NEXTAUTH_SECRET
    - GITHUB_CLIENT_ID
    - GITHUB_CLIENT_SECRET

CDN: Vercel Edge Network
  - Global distribution
  - Automatic HTTPS
  - HTTP/2 + HTTP/3

Free Tier:
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Preview deployments (PR)
```

### バックエンド（AWS Lambda + Fly.io）

```yaml
# Option 1: AWS Lambda (Serverless)
Platform: AWS Lambda
  Runtime: Custom Runtime (Rust binary)
  Architecture: arm64 (Graviton2)
  Memory: 512 MB
  Timeout: 30s
  Handler: bootstrap
  Deployment: cargo-lambda

Database: AWS RDS PostgreSQL 15
  Instance: db.t3.micro (2 vCPU, 1 GB RAM)
  Storage: 20 GB gp3
  Backup: Automated (7-day retention)

# Option 2: Fly.io (Container)
Platform: Fly.io
  Runtime: Docker (Rust binary)
  Regions: Tokyo (nrt), US East (iad)
  Instances: 1x shared-cpu-1x (256 MB RAM)
  Auto-scaling: Off (MVP phase)

Database: Fly.io Postgres
  Storage: 10 GB
  Backups: Daily
```

### CI/CD（GitHub Actions）

```yaml
Workflows:
  - Frontend Build & Deploy (Vercel)
  - Backend Build & Test (Rust)
  - Database Migration (sqlx migrate)
  - E2E Tests (Playwright)

Triggers:
  - Push to main → Production deploy
  - Pull Request → Preview deploy
  - Tag push → Release deploy
```

---

## 開発ツール

### ローカル開発環境

| ツール | バージョン | 用途 |
|-------|----------|------|
| **Docker** | 24.x | PostgreSQL、Redis（ローカル） |
| **Docker Compose** | 2.x | マルチコンテナ管理 |
| **Node.js** | 20.x LTS | フロントエンド実行環境 |
| **Rust** | 1.75+ (Stable) | バックエンド実行環境 |
| **cargo-watch** | latest | Hot reload（Rust） |
| **sqlx-cli** | 0.7+ | Migration管理 |

### コード品質

| ツール | 用途 |
|-------|------|
| **ESLint** | JavaScript/TypeScript Linter |
| **Prettier** | コードフォーマッター |
| **cargo clippy** | Rust Linter |
| **cargo fmt** | Rustフォーマッター |
| **Husky** | Git hooks（pre-commit） |
| **lint-staged** | Staged filesのみlint |

### テスト

| ツール | 用途 |
|-------|------|
| **Vitest** | Unit tests (フロントエンド) |
| **Playwright** | E2E tests |
| **cargo test** | Unit tests (バックエンド) |
| **axum-test** | Integration tests (Rust) |

---

## 決定理由

### なぜNext.js 14？

1. **App Router**: Server Components、Streaming、Parallel Routes
2. **React 18**: Suspense、Concurrent Rendering、Server Components
3. **TypeScript統合**: 型安全性、開発効率
4. **Vercel最適化**: 自動デプロイ、Edge Functions、ISR
5. **エコシステム**: shadcn/ui、TanStack Query等の豊富なライブラリ

### なぜRust (Axum)？

1. **高速**: ゼロコスト抽象化、メモリ安全性
2. **既存Miyabi統合**: 既存Rustクレート（miyabi-agents等）を直接利用
3. **WebSocket対応**: tokio-tungsteniteでリアルタイム通信
4. **型安全性**: コンパイル時エラー検出
5. **Serverless対応**: AWS Lambda（cargo-lambda）、Fly.io対応

### なぜPostgreSQL 15？

1. **JSONB**: 柔軟なスキーマ（Agent execution results）
2. **Full-text search**: ログ検索機能
3. **Partitioning**: 大量データ対応（将来）
4. **成熟度**: 安定性、パフォーマンス、ツール充実
5. **AWS RDS対応**: マネージドサービス、自動バックアップ

### なぜVercel？

1. **Next.js最適化**: 自動ビルド、キャッシュ、CDN
2. **無料枠**: 100 GB/month（MVP十分）
3. **Preview deployments**: PR毎にプレビュー環境
4. **GitHub統合**: Push→自動デプロイ
5. **Edge Network**: グローバル配信、低レイテンシ

---

## 次のステップ

- [x] Task 0.1: 技術スタック決定 ✅
- [ ] Task 0.2: プロジェクト初期化
- [ ] Task 0.3: 設計ドキュメント作成
- [ ] Task 0.4: Figmaデザイン

**次**: Task 0.2（プロジェクト初期化）に進む

---

**作成者**: Claude Code
**承認者**: （署名欄）
**承認日**: 2025-10-24
