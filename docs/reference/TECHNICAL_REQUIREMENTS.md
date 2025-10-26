# Miyabi UI実装 - 詳細技術要件定義書

**作成日**: 2025-10-22
**バージョン**: v1.0
**対象期間**: Week 1-18（2025年11月〜2026年2月）

---

## 📋 目次

1. [Phase 0: アーキテクチャ設計](#phase-0-アーキテクチャ設計)
2. [Phase 1: Web基盤](#phase-1-web基盤)
3. [Phase 2: ワークフローエディタ](#phase-2-ワークフローエディタ)
4. [Phase 3: Agent実行UI](#phase-3-agent実行ui)
5. [Phase 4: リアルタイム監視](#phase-4-リアルタイム監視)
6. [Phase 5: モバイル対応](#phase-5-モバイル対応)
7. [Phase 6: LINE Bot統合](#phase-6-line-bot統合)

---

## Phase 0: アーキテクチャ設計

**期間**: Week 1-2
**担当**: UIデザイナー + あなた（アーキテクト）

### 0.1 技術スタック決定

#### フロントエンド

```typescript
{
  "framework": "Next.js 14",
  "appRouter": true,
  "language": "TypeScript 5.3",
  "styling": "Tailwind CSS 3.4",
  "componentLibrary": "shadcn/ui",
  "stateManagement": "Zustand 4.x",
  "dataFetching": "TanStack Query (React Query) 5.x",
  "forms": "React Hook Form 7.x + Zod",
  "dateHandling": "date-fns",
  "icons": "lucide-react",
  "charts": "recharts",
  "visualization": "react-flow-renderer"
}
```

#### バックエンド（Rust）

```toml
[dependencies]
# Web Framework
axum = "0.7"
tower = "0.4"
tower-http = "0.5"

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

# 認証
jsonwebtoken = "9.2"

# データベース
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres"] }

# エラーハンドリング
thiserror = "1.0"
anyhow = "1.0"

# ログ
tracing = "0.1"
tracing-subscriber = "0.3"
```

#### インフラ

```yaml
Frontend:
  - Hosting: Vercel
  - CDN: Vercel Edge Network
  - Environment: Node.js 20

Backend:
  - Compute: AWS Lambda (Rust)
  - Alternative: Fly.io (Rust container)
  - Database: AWS RDS PostgreSQL 15
  - Cache: Redis (Upstash)

WebSocket:
  - Service: Ably (managed WebSocket)
  - Alternative: AWS API Gateway WebSocket

Storage:
  - Files: AWS S3
  - Secrets: AWS Secrets Manager
```

---

### 0.2 システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│ Client Layer                                                 │
├─────────────────────────────────────────────────────────────┤
│ Web Browser                    │ LINE App                    │
│ - Next.js 14 (App Router)      │ - LINE Messaging API       │
│ - React 18                     │ - Rich Menu                │
│ - Tailwind CSS                 │ - Push Notifications       │
└────────────┬────────────────────┴────────────┬───────────────┘
             │                                 │
             │ HTTPS                           │ HTTPS Webhook
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ API Gateway Layer (Rust + Axum)                             │
├─────────────────────────────────────────────────────────────┤
│ - REST API (/api/*)                                         │
│ - WebSocket (/ws)                                           │
│ - LINE Webhook (/line/webhook)                              │
│ - GitHub OAuth (/auth/github)                               │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Business Logic Layer (Rust)                                 │
├─────────────────────────────────────────────────────────────┤
│ miyabi-web-api/                                             │
│ ├── handlers/          # HTTP/WebSocket handlers           │
│ ├── services/          # Business logic                     │
│ ├── integrations/      # External API integrations          │
│ │   ├── github.rs     # GitHub API                         │
│ │   ├── line.rs       # LINE Messaging API                 │
│ │   └── openai.rs     # GPT-4 API                          │
│ └── models/            # Data models                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Data Layer                                                   │
├─────────────────────────────────────────────────────────────┤
│ PostgreSQL                │ Redis Cache                      │
│ - Users                   │ - Session data                   │
│ - Agents                  │ - WebSocket connections          │
│ - Issues                  │ - Rate limiting                  │
│ - Workflows               │                                  │
└─────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Miyabi Core (既存)                                           │
├─────────────────────────────────────────────────────────────┤
│ miyabi-a2a/           # Agent実行エンジン                    │
│ miyabi-agents/        # Agent実装                           │
│ miyabi-worktree/      # Git Worktree管理                    │
└─────────────────────────────────────────────────────────────┘
```

---

### 0.3 データベース設計

#### ER図

```sql
-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id INTEGER UNIQUE NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    line_user_id VARCHAR(255) UNIQUE, -- LINE統合用
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Repositories Table (連携されたGitHubリポジトリ)
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id INTEGER UNIQUE NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    default_branch VARCHAR(255) DEFAULT 'main',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agent Executions Table
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL, -- 'Coordinator', 'CodeGen', etc.
    issue_number INTEGER,
    status VARCHAR(20) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    result JSONB, -- Agent実行結果（JSON）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflows Table (ワークフロー定義)
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL, -- React Flowの定義（nodes, edges）
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- LINE Messages Table (LINEメッセージログ)
CREATE TABLE line_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) NOT NULL, -- 'text', 'postback', etc.
    message_text TEXT,
    parsed_intent VARCHAR(50), -- GPT-4による意図解析結果
    issue_number INTEGER, -- 作成されたIssue番号
    created_at TIMESTAMP DEFAULT NOW()
);

-- WebSocket Connections Table (アクティブ接続管理)
CREATE TABLE websocket_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    connected_at TIMESTAMP DEFAULT NOW(),
    last_ping_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_line_messages_user_id ON line_messages(user_id);
CREATE INDEX idx_websocket_connections_user_id ON websocket_connections(user_id);
```

---

### 0.4 API設計（REST）

#### 認証エンドポイント

```typescript
// GET /api/auth/github
// GitHub OAuthリダイレクト
interface GitHubAuthRedirectResponse {
  redirectUrl: string;
}

// GET /api/auth/github/callback?code=xxx
// GitHub OAuth コールバック
interface GitHubAuthCallbackResponse {
  token: string; // JWT
  user: {
    id: string;
    githubUsername: string;
    email?: string;
    avatarUrl?: string;
  };
}

// GET /api/auth/me
// 現在のユーザー情報取得
// Headers: Authorization: Bearer <token>
interface CurrentUserResponse {
  id: string;
  githubUsername: string;
  email?: string;
  avatarUrl?: string;
  lineConnected: boolean;
}

// POST /api/auth/logout
// ログアウト
interface LogoutResponse {
  success: boolean;
}
```

#### リポジトリエンドポイント

```typescript
// GET /api/repositories
// ユーザーのGitHubリポジトリ一覧取得
interface Repository {
  id: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isActive: boolean;
}

// POST /api/repositories
// リポジトリ連携
interface ConnectRepositoryRequest {
  githubRepoId: number;
  owner: string;
  name: string;
}

// DELETE /api/repositories/:id
// リポジトリ連携解除
```

#### Issueエンドポイント

```typescript
// GET /api/repositories/:repoId/issues
// Issue一覧取得（GitHubから）
interface Issue {
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

// GET /api/repositories/:repoId/issues/:number
// Issue詳細取得
```

#### Agentエンドポイント

```typescript
// GET /api/agents
// 利用可能なAgent一覧取得
interface Agent {
  type: string; // 'Coordinator', 'CodeGen', etc.
  displayName: string; // 'しきるん', 'つくるん', etc.
  description: string;
  category: 'coding' | 'business';
  estimatedDuration: number; // 秒
}

// POST /api/agents/execute
// Agent実行
interface ExecuteAgentRequest {
  repositoryId: string;
  agentType: string;
  issueNumber?: number;
  workflowId?: string; // ワークフローから実行の場合
  options?: {
    useWorktree?: boolean;
    autoCreatePR?: boolean;
    notifySlack?: boolean;
  };
}

interface ExecuteAgentResponse {
  executionId: string;
  status: 'pending' | 'running';
  estimatedCompletionAt: string;
}

// GET /api/agents/executions/:executionId
// Agent実行状況取得
interface AgentExecutionStatus {
  id: string;
  agentType: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  progress: number; // 0-100
  currentStep?: string;
  errorMessage?: string;
  result?: any;
}

// POST /api/agents/executions/:executionId/cancel
// Agent実行キャンセル
```

#### ワークフローエンドポイント

```typescript
// GET /api/workflows
// ワークフロー一覧取得
interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: {
    nodes: Array<{
      id: string;
      type: string;
      data: any;
      position: { x: number; y: number };
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
    }>;
  };
  isTemplate: boolean;
  isPublic: boolean;
  createdAt: string;
}

// POST /api/workflows
// ワークフロー作成
interface CreateWorkflowRequest {
  name: string;
  description?: string;
  definition: any; // React Flowの定義
}

// PUT /api/workflows/:id
// ワークフロー更新

// DELETE /api/workflows/:id
// ワークフロー削除

// POST /api/workflows/:id/execute
// ワークフロー実行
```

---

### 0.5 WebSocket API設計

#### 接続

```typescript
// WebSocket接続
ws://api.miyabi.dev/ws?token=<JWT>

// 接続確立時
{
  "type": "connected",
  "connectionId": "conn_xxx",
  "user": { ... }
}
```

#### イベント

```typescript
// Agent実行開始
{
  "type": "agent.started",
  "executionId": "exec_xxx",
  "agentType": "CodeGenAgent",
  "issueNumber": 270,
  "timestamp": "2025-11-01T10:00:00Z"
}

// Agent実行進捗更新
{
  "type": "agent.progress",
  "executionId": "exec_xxx",
  "progress": 50,
  "currentStep": "コード生成中...",
  "timestamp": "2025-11-01T10:02:30Z"
}

// Agent実行完了
{
  "type": "agent.completed",
  "executionId": "exec_xxx",
  "result": {
    "prNumber": 145,
    "qualityScore": 95,
    "filesChanged": 3
  },
  "timestamp": "2025-11-01T10:05:00Z"
}

// Agent実行失敗
{
  "type": "agent.failed",
  "executionId": "exec_xxx",
  "errorMessage": "コンパイルエラー: ...",
  "timestamp": "2025-11-01T10:03:00Z"
}
```

---

### 0.6 Figmaデザイン要件

#### デザインシステム

```typescript
// カラーパレット
const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... (Tailwind Blue)
    900: '#1e3a8a',
  },
  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  error: '#ef4444',   // Red
  gray: {
    50: '#f9fafb',
    // ... (Tailwind Gray)
    900: '#111827',
  },
};

// タイポグラフィ
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
  },
};

// スペーシング（Tailwindデフォルト）
// 4px grid system
```

#### コンポーネントライブラリ（shadcn/ui）

```typescript
// 使用コンポーネント
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
```

#### Figma成果物

1. **デザインファイル**（20画面）
   - ログイン画面
   - ダッシュボード（ホーム）
   - リポジトリ選択
   - Issue一覧
   - Issue詳細
   - Agent選択パレット
   - ワークフローエディタ
   - Agent実行ダイアログ
   - 実行ステータス画面
   - ライブダッシュボード
   - 設定画面
   - プロフィール画面
   - LINE連携画面
   - エラー画面
   - 404画面

2. **デザインシステム**
   - カラーパレット
   - タイポグラフィ
   - アイコンセット
   - コンポーネントライブラリ

3. **プロトタイプ**
   - クリッカブルプロトタイプ（全画面遷移）

---

### 0.7 実装チェックリスト（Phase 0）

- [ ] 技術スタック最終決定
- [ ] Next.js 14プロジェクト初期化
- [ ] Rustバックエンドプロジェクト初期化（`miyabi-web-api` crate）
- [ ] PostgreSQLスキーマ作成
- [ ] Figmaデザインファイル作成（20画面）
- [ ] デザインシステム定義
- [ ] API設計ドキュメント完成
- [ ] WebSocket プロトコル設計完成
- [ ] インフラ構成図作成
- [ ] CI/CDパイプライン設計

---

## Phase 1: Web基盤

**期間**: Week 3-6
**担当**: React開発者 + Rust開発者

### 1.1 認証機能

#### タスク分解

**Task 1.1.1: GitHub OAuth実装（Rust）**
- [ ] `axum-oauth2` crate統合
- [ ] GitHub OAuthアプリ作成（GitHub Settings）
- [ ] `GET /api/auth/github` 実装（リダイレクト）
- [ ] `GET /api/auth/github/callback` 実装（トークン取得）
- [ ] JWTトークン生成（`jsonwebtoken` crate）
- [ ] Userレコード作成/更新（PostgreSQL）

**Task 1.1.2: 認証ミドルウェア実装（Rust）**
- [ ] JWTトークン検証ミドルウェア
- [ ] `Authorization: Bearer <token>` ヘッダー解析
- [ ] トークン有効期限チェック
- [ ] ユーザー情報Context注入

**Task 1.1.3: ログイン画面実装（React）**
- [ ] `/login` ページ作成
- [ ] GitHub OAuthボタン実装
- [ ] ローディング状態表示
- [ ] エラーハンドリング

**Task 1.1.4: 認証状態管理（React）**
- [ ] Zustand storeセットアップ（`authStore`）
- [ ] `useAuth` カスタムフック実装
- [ ] トークンローカルストレージ保存
- [ ] 自動ログイン機能
- [ ] ログアウト機能

**実装例**:

```typescript
// app/login/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      // GitHub OAuthリダイレクト
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`;
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px] p-8">
        <h1 className="text-2xl font-bold mb-6">Miyabi へようこそ</h1>
        <Button
          onClick={handleGitHubLogin}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'ログイン中...' : 'GitHubでログイン'}
        </Button>
      </Card>
    </div>
  );
}
```

```rust
// miyabi-web-api/src/handlers/auth.rs
use axum::{
    extract::Query,
    response::{IntoResponse, Redirect},
    Json,
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct GitHubCallbackQuery {
    code: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    token: String,
    user: UserResponse,
}

pub async fn github_auth_redirect() -> impl IntoResponse {
    let client_id = std::env::var("GITHUB_CLIENT_ID").unwrap();
    let redirect_uri = std::env::var("GITHUB_REDIRECT_URI").unwrap();

    let url = format!(
        "https://github.com/login/oauth/authorize?client_id={}&redirect_uri={}&scope=repo,read:user",
        client_id, redirect_uri
    );

    Redirect::to(&url)
}

pub async fn github_auth_callback(
    Query(query): Query<GitHubCallbackQuery>,
) -> Result<Json<AuthResponse>, AppError> {
    // GitHubトークン取得
    let access_token = exchange_code_for_token(&query.code).await?;

    // GitHubユーザー情報取得
    let github_user = fetch_github_user(&access_token).await?;

    // DBにユーザー作成/更新
    let user = upsert_user(&github_user).await?;

    // JWT生成
    let token = generate_jwt(&user)?;

    Ok(Json(AuthResponse {
        token,
        user: user.into(),
    }))
}
```

---

### 1.2 ダッシュボード（ホーム画面）

#### タスク分解

**Task 1.2.1: ダッシュボードレイアウト実装（React）**
- [ ] ダッシュボードページ作成（`/dashboard`）
- [ ] ヘッダーコンポーネント実装（ユーザーアイコン、ログアウト）
- [ ] サイドバー実装（ナビゲーション）
- [ ] メインコンテンツエリア

**Task 1.2.2: サマリーカード実装（React）**
- [ ] 実行中Agent数カード
- [ ] 完了Agent数カード
- [ ] エラーAgent数カード
- [ ] リアルタイム更新（WebSocket接続準備）

**Task 1.2.3: 最近のAgent実行リスト（React）**
- [ ] Agent実行履歴一覧コンポーネント
- [ ] ステータスバッジ（pending, running, completed, failed）
- [ ] 詳細モーダル
- [ ] ページネーション

**Task 1.2.4: ダッシュボードAPI実装（Rust）**
- [ ] `GET /api/dashboard/summary` 実装
- [ ] `GET /api/dashboard/recent-executions` 実装
- [ ] 認証ミドルウェア適用

**実装例**:

```typescript
// app/dashboard/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DashboardSummary {
  runningCount: number;
  completedCount: number;
  errorCount: number;
}

export default function DashboardPage() {
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return res.json();
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Miyabi Dashboard</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-2">実行中</div>
          <div className="text-4xl font-bold">{summary?.runningCount ?? 0}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-2">完了</div>
          <div className="text-4xl font-bold">{summary?.completedCount ?? 0}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-500 mb-2">エラー</div>
          <div className="text-4xl font-bold text-red-500">{summary?.errorCount ?? 0}</div>
        </Card>
      </div>

      <RecentExecutions />
    </div>
  );
}
```

---

### 1.3 Issue一覧画面

#### タスク分解

**Task 1.3.1: リポジトリ選択機能（React）**
- [ ] リポジトリ一覧取得
- [ ] リポジトリ選択ドロップダウン
- [ ] 選択状態永続化（localStorage）

**Task 1.3.2: Issue一覧表示（React）**
- [ ] Issue一覧テーブル実装
- [ ] ステータスフィルター（open/closed）
- [ ] ラベルフィルター
- [ ] 検索機能
- [ ] ソート機能（作成日、更新日）

**Task 1.3.3: Issue詳細モーダル（React）**
- [ ] Issue詳細表示モーダル
- [ ] Markdownレンダリング
- [ ] Agent実行ボタン

**Task 1.3.4: GitHub API統合（Rust）**
- [ ] `GET /api/repositories/:repoId/issues` 実装
- [ ] GitHub APIキャッシュ（Redis、5分TTL）
- [ ] ページネーション対応

---

### 1.4 実装チェックリスト（Phase 1）

- [ ] GitHub OAuth認証完了
- [ ] JWTトークン生成/検証完了
- [ ] ダッシュボード表示完了
- [ ] リポジトリ選択機能完了
- [ ] Issue一覧表示完了
- [ ] Rust APIサーバー稼働
- [ ] PostgreSQLデータベース接続完了
- [ ] Vercelデプロイ完了（フロントエンド）
- [ ] AWS Lambdaデプロイ完了（バックエンド）
- [ ] **Phase 1完了テスト実施**

---

## Phase 2: ワークフローエディタ

**期間**: Week 7-10
**担当**: React開発者

### 2.1 React Flow統合

#### タスク分解

**Task 2.1.1: React Flowセットアップ**
- [ ] `@xyflow/react` インストール
- [ ] カスタムノード型定義
- [ ] カスタムエッジ型定義
- [ ] スタイリング（Tailwind統合）

**Task 2.1.2: ワークフローエディタページ実装**
- [ ] `/workflow/new` ページ作成
- [ ] React Flowキャンバス実装
- [ ] ツールバー実装（保存、実行、リセット）
- [ ] ミニマップ実装
- [ ] コントロール実装（ズーム、フィット）

**Task 2.1.3: Agent選択パレット実装**
- [ ] Agent一覧取得API
- [ ] ドラッグ可能なAgentカード
- [ ] カテゴリフィルター（Coding/Business）
- [ ] 検索機能

**Task 2.1.4: ノード実装**
- [ ] Issueノードコンポーネント
- [ ] Agentノードコンポーネント
- [ ] 条件分岐ノードコンポーネント
- [ ] ノード接続ハンドル

**実装例**:

```typescript
// components/workflow/AgentNode.tsx
import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgentNodeData {
  agentType: string;
  displayName: string;
  category: 'coding' | 'business';
}

export const AgentNode = memo(({ data }: NodeProps<AgentNodeData>) => {
  return (
    <Card className="w-[200px] p-4">
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🤖</span>
        <div>
          <div className="font-bold">{data.displayName}</div>
          <Badge variant={data.category === 'coding' ? 'default' : 'secondary'}>
            {data.category}
          </Badge>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
});
```

```typescript
// app/workflow/new/page.tsx
'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { AgentNode } from '@/components/workflow/AgentNode';

const nodeTypes = {
  agent: AgentNode,
};

export default function WorkflowEditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

---

### 2.2 テンプレートライブラリ

#### タスク分解

**Task 2.2.1: テンプレート一覧画面（React）**
- [ ] `/templates` ページ作成
- [ ] テンプレートカード一覧
- [ ] カテゴリフィルター
- [ ] プレビュー機能

**Task 2.2.2: テンプレート使用機能（React）**
- [ ] テンプレートからワークフロー作成
- [ ] ノード/エッジのコピー
- [ ] 自動配置

**Task 2.2.3: テンプレート保存機能（React + Rust）**
- [ ] ワークフローのテンプレート化
- [ ] `POST /api/workflows/templates` 実装
- [ ] 公開/非公開設定

---

### 2.3 実装チェックリスト（Phase 2）

- [ ] React Flow統合完了
- [ ] Agent選択パレット完了
- [ ] ドラッグ&ドロップ機能完了
- [ ] ワークフロー保存/読み込み完了
- [ ] テンプレートライブラリ完了
- [ ] **Phase 2完了テスト実施**

---

## Phase 3: Agent実行UI

**期間**: Week 11-12
**担当**: React開発者 + Rust開発者

### 3.1 Agent実行ダイアログ

#### タスク分解

**Task 3.1.1: 実行ダイアログ実装（React）**
- [ ] Agent実行モーダルコンポーネント
- [ ] Issue選択ドロップダウン
- [ ] オプション設定フォーム
  - [ ] Worktree並列実行チェックボックス
  - [ ] 自動PR作成チェックボックス
  - [ ] Slack通知チェックボックス
- [ ] 実行ボタン
- [ ] バリデーション

**Task 3.1.2: Agent実行API実装（Rust）**
- [ ] `POST /api/agents/execute` 実装
- [ ] miyabi-a2a統合（既存Agent実行エンジン呼び出し）
- [ ] 非同期実行（Tokio spawn）
- [ ] execution_id生成・返却
- [ ] DBに実行レコード作成

**実装例**:

```typescript
// components/agent/ExecuteAgentDialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useExecuteAgent } from '@/hooks/useExecuteAgent';

interface Props {
  open: boolean;
  onClose: () => void;
  agentType: string;
  issueNumber?: number;
}

export function ExecuteAgentDialog({ open, onClose, agentType, issueNumber }: Props) {
  const [options, setOptions] = useState({
    useWorktree: true,
    autoCreatePR: true,
    notifySlack: false,
  });

  const { execute, loading } = useExecuteAgent();

  const handleExecute = async () => {
    try {
      const result = await execute({
        agentType,
        issueNumber,
        options,
      });

      // 実行ステータス画面に遷移
      router.push(`/executions/${result.executionId}`);
      onClose();
    } catch (error) {
      console.error('Agent execution failed:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agent実行</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="font-medium mb-2">Agent: {agentType}</div>
            <div className="text-sm text-gray-500">Issue #{issueNumber}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Checkbox
                checked={options.useWorktree}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, useWorktree: !!checked })
                }
              />
              <label className="ml-2 text-sm">Worktree並列実行</label>
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={options.autoCreatePR}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, autoCreatePR: !!checked })
                }
              />
              <label className="ml-2 text-sm">自動PR作成</label>
            </div>

            <div className="flex items-center">
              <Checkbox
                checked={options.notifySlack}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, notifySlack: !!checked })
                }
              />
              <label className="ml-2 text-sm">Slack通知</label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleExecute} disabled={loading}>
              {loading ? '実行中...' : '実行開始'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

```rust
// miyabi-web-api/src/handlers/agents.rs
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ExecuteAgentRequest {
    repository_id: Uuid,
    agent_type: String,
    issue_number: Option<i32>,
    options: Option<AgentExecutionOptions>,
}

#[derive(Deserialize)]
pub struct AgentExecutionOptions {
    use_worktree: Option<bool>,
    auto_create_pr: Option<bool>,
    notify_slack: Option<bool>,
}

#[derive(Serialize)]
pub struct ExecuteAgentResponse {
    execution_id: Uuid,
    status: String,
    estimated_completion_at: String,
}

pub async fn execute_agent(
    State(state): State<AppState>,
    Json(req): Json<ExecuteAgentRequest>,
) -> Result<Json<ExecuteAgentResponse>, AppError> {
    // DBに実行レコード作成
    let execution_id = Uuid::new_v4();
    sqlx::query!(
        r#"
        INSERT INTO agent_executions (id, repository_id, agent_type, issue_number, status)
        VALUES ($1, $2, $3, $4, 'pending')
        "#,
        execution_id,
        req.repository_id,
        req.agent_type,
        req.issue_number
    )
    .execute(&state.db)
    .await?;

    // 非同期でAgent実行
    let state_clone = state.clone();
    tokio::spawn(async move {
        if let Err(e) = run_agent_async(state_clone, execution_id, req).await {
            eprintln!("Agent execution failed: {}", e);
        }
    });

    Ok(Json(ExecuteAgentResponse {
        execution_id,
        status: "pending".to_string(),
        estimated_completion_at: chrono::Utc::now()
            .checked_add_signed(chrono::Duration::minutes(5))
            .unwrap()
            .to_rfc3339(),
    }))
}

async fn run_agent_async(
    state: AppState,
    execution_id: Uuid,
    req: ExecuteAgentRequest,
) -> Result<(), AppError> {
    // ステータス更新: pending → running
    sqlx::query!(
        "UPDATE agent_executions SET status = 'running', started_at = NOW() WHERE id = $1",
        execution_id
    )
    .execute(&state.db)
    .await?;

    // miyabi-a2aのAgent実行エンジン呼び出し
    use miyabi_a2a::AgentExecutor;

    let executor = AgentExecutor::new(/* config */);
    let result = executor.execute(&req.agent_type, req.issue_number).await?;

    // ステータス更新: running → completed
    sqlx::query!(
        r#"
        UPDATE agent_executions
        SET status = 'completed', completed_at = NOW(), result = $2
        WHERE id = $1
        "#,
        execution_id,
        serde_json::to_value(&result)?
    )
    .execute(&state.db)
    .await?;

    // WebSocketで通知
    state.ws_broadcast(AgentCompletedEvent {
        execution_id,
        result,
    }).await?;

    Ok(())
}
```

---

### 3.2 実行ステータス表示

#### タスク分解

**Task 3.2.1: 実行ステータスページ（React）**
- [ ] `/executions/:id` ページ作成
- [ ] ステータス表示（pending, running, completed, failed）
- [ ] プログレスバー
- [ ] 経過時間表示
- [ ] ログ表示エリア

**Task 3.2.2: ログストリーミング（React + WebSocket）**
- [ ] WebSocket接続
- [ ] リアルタイムログ受信
- [ ] 自動スクロール

---

### 3.3 実装チェックリスト（Phase 3）

- [ ] Agent実行ダイアログ完了
- [ ] Agent実行API完了
- [ ] miyabi-a2a統合完了
- [ ] 実行ステータス表示完了
- [ ] ログ表示完了
- [ ] **MVP公開準備完了**
- [ ] **Phase 3完了テスト実施**

---

## Phase 4: リアルタイム監視

**期間**: Week 13-14
**担当**: Rust開発者 + React開発者

### 4.1 WebSocket統合

#### タスク分解

**Task 4.1.1: WebSocketサーバー実装（Rust）**
- [ ] `tokio-tungstenite` 統合
- [ ] WebSocket接続ハンドラ（`/ws`）
- [ ] JWT認証
- [ ] 接続管理（connection pooling）
- [ ] Ping/Pong実装（接続維持）

**Task 4.1.2: イベントブロードキャスト実装（Rust）**
- [ ] イベントチャネル作成（`tokio::sync::broadcast`）
- [ ] Agent開始イベント送信
- [ ] Agent進捗イベント送信
- [ ] Agent完了イベント送信
- [ ] Agent失敗イベント送信

**Task 4.1.3: WebSocketクライアント実装（React）**
- [ ] WebSocketフック作成（`useWebSocket`）
- [ ] 自動再接続機能
- [ ] イベントハンドラ登録
- [ ] 接続状態管理

**実装例**:

```rust
// miyabi-web-api/src/websocket/mod.rs
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
};
use tokio::sync::broadcast;

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();

    // イベントチャネル購読
    let mut event_rx = state.event_broadcast.subscribe();

    // イベント受信ループ
    loop {
        tokio::select! {
            // サーバーからのイベント
            Ok(event) = event_rx.recv() => {
                let json = serde_json::to_string(&event).unwrap();
                if sender.send(Message::Text(json)).await.is_err() {
                    break;
                }
            }

            // クライアントからのメッセージ
            Some(Ok(msg)) = receiver.next() => {
                match msg {
                    Message::Text(text) => {
                        // Handle client messages
                    }
                    Message::Close(_) => break,
                    _ => {}
                }
            }
        }
    }
}
```

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';

interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`${url}?token=${token}`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [...prev, data]);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);

      // 自動再接続（5秒後）
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [url]);

  return { connected, events };
}
```

---

### 4.2 ライブダッシュボード

#### タスク分解

**Task 4.2.1: ライブダッシュボードページ（React）**
- [ ] `/live` ページ作成
- [ ] WebSocket接続
- [ ] 実行中Agent一覧表示
- [ ] プログレスバー（リアルタイム更新）

**Task 4.2.2: 通知システム（React）**
- [ ] Toast通知コンポーネント
- [ ] Agent完了通知
- [ ] Agent失敗通知

---

### 4.3 実装チェックリスト（Phase 4）

- [ ] WebSocketサーバー完了
- [ ] WebSocketクライアント完了
- [ ] リアルタイムイベント配信完了
- [ ] ライブダッシュボード完了
- [ ] **Phase 4完了テスト実施**

---

## Phase 5: モバイル対応

**期間**: Week 15-16
**担当**: React開発者

### 5.1 レスポンシブデザイン

#### タスク分解

**Task 5.1.1: Tailwindブレークポイント対応**
- [ ] 全ページでレスポンシブ対応
- [ ] モバイルナビゲーション実装（ハンバーガーメニュー）
- [ ] タブレット対応

**Task 5.1.2: PWA対応**
- [ ] `next-pwa` 統合
- [ ] Service Worker設定
- [ ] manifest.json作成
- [ ] オフライン対応

---

### 5.2 実装チェックリスト（Phase 5）

- [ ] レスポンシブデザイン完了
- [ ] PWA対応完了
- [ ] プッシュ通知完了
- [ ] **Phase 5完了テスト実施**

---

## Phase 6: LINE Bot統合

**期間**: Week 17-18
**担当**: Rust開発者 + NLP統合エンジニア

### 6.1 LINE Messaging API統合

#### タスク分解

**Task 6.1.1: LINE Developers設定**
- [ ] LINE Developersアカウント作成
- [ ] Messaging API Channel作成
- [ ] Channel Access Token取得
- [ ] Webhook URL設定（`https://api.miyabi.dev/line/webhook`）

**Task 6.1.2: LINE Webhook実装（Rust）**
- [ ] `POST /line/webhook` エンドポイント実装
- [ ] LINE署名検証
- [ ] メッセージイベント処理
- [ ] ポストバックイベント処理

**Task 6.1.3: LINE返信実装（Rust）**
- [ ] LINE Messaging API Client実装
- [ ] テキストメッセージ送信
- [ ] Flex Message送信
- [ ] プッシュメッセージ送信

**実装例**:

```rust
// miyabi-web-api/src/integrations/line.rs
use reqwest::Client;
use serde::{Deserialize, Serialize};

pub struct LineClient {
    channel_access_token: String,
    client: Client,
}

#[derive(Serialize)]
struct ReplyMessageRequest {
    reply_token: String,
    messages: Vec<LineMessage>,
}

#[derive(Serialize)]
#[serde(tag = "type")]
enum LineMessage {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "flex")]
    Flex { alt_text: String, contents: serde_json::Value },
}

impl LineClient {
    pub fn new(channel_access_token: String) -> Self {
        Self {
            channel_access_token,
            client: Client::new(),
        }
    }

    pub async fn reply_message(
        &self,
        reply_token: &str,
        text: &str,
    ) -> Result<(), AppError> {
        let req = ReplyMessageRequest {
            reply_token: reply_token.to_string(),
            messages: vec![LineMessage::Text {
                text: text.to_string(),
            }],
        };

        self.client
            .post("https://api.line.me/v2/bot/message/reply")
            .header("Authorization", format!("Bearer {}", self.channel_access_token))
            .json(&req)
            .send()
            .await?;

        Ok(())
    }

    pub async fn push_message(
        &self,
        user_id: &str,
        text: &str,
    ) -> Result<(), AppError> {
        // 実装...
        Ok(())
    }
}
```

```rust
// miyabi-web-api/src/handlers/line.rs
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct LineWebhookRequest {
    events: Vec<LineEvent>,
}

#[derive(Deserialize)]
#[serde(tag = "type")]
enum LineEvent {
    #[serde(rename = "message")]
    Message {
        reply_token: String,
        source: LineSource,
        message: LineMessageContent,
    },
}

#[derive(Deserialize)]
struct LineSource {
    user_id: String,
}

#[derive(Deserialize)]
#[serde(tag = "type")]
enum LineMessageContent {
    #[serde(rename = "text")]
    Text { text: String },
}

pub async fn line_webhook(
    State(state): State<AppState>,
    Json(req): Json<LineWebhookRequest>,
) -> Result<Json<()>, AppError> {
    for event in req.events {
        match event {
            LineEvent::Message {
                reply_token,
                source,
                message,
            } => {
                if let LineMessageContent::Text { text } = message {
                    // GPT-4で自然言語処理
                    let intent = parse_natural_language(&text).await?;

                    // Issue作成
                    let issue_number = create_github_issue(&intent).await?;

                    // Agent実行
                    let execution_id = execute_agent(&intent.agent_type, issue_number).await?;

                    // LINE返信
                    state.line_client.reply_message(
                        &reply_token,
                        &format!(
                            "Issue #{}を作成し、{}で処理を開始しました！",
                            issue_number, intent.agent_display_name
                        ),
                    ).await?;
                }
            }
        }
    }

    Ok(Json(()))
}
```

---

### 6.2 GPT-4自然言語処理統合

#### タスク分解

**Task 6.2.1: OpenAI API統合（Rust）**
- [ ] OpenAI APIクライアント実装
- [ ] GPT-4プロンプト設計
- [ ] 自然言語→構造化Issue変換
- [ ] Agent自動選択ロジック

**実装例**:

```rust
// miyabi-web-api/src/integrations/openai.rs
use reqwest::Client;
use serde::{Deserialize, Serialize};

pub struct OpenAIClient {
    api_key: String,
    client: Client,
}

#[derive(Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Serialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<ChatChoice>,
}

#[derive(Deserialize)]
struct ChatChoice {
    message: ChatMessage,
}

#[derive(Deserialize)]
pub struct ParsedIntent {
    pub title: String,
    pub description: String,
    pub agent_type: String,
    pub priority: String,
}

impl OpenAIClient {
    pub async fn parse_natural_language(&self, text: &str) -> Result<ParsedIntent, AppError> {
        let prompt = format!(
            r#"以下のユーザーメッセージを解析し、GitHub Issueとして構造化してください。

ユーザーメッセージ: "{}"

以下のJSON形式で返してください:
{{
  "title": "Issueのタイトル",
  "description": "Issueの詳細説明（Markdown形式）",
  "agent_type": "適切なAgent名（Coordinator, CodeGen, Review, Deployment, PR, Issueのいずれか）",
  "priority": "優先度（P0-Critical, P1-High, P2-Medium, P3-Lowのいずれか）"
}}"#,
            text
        );

        let req = ChatCompletionRequest {
            model: "gpt-4".to_string(),
            messages: vec![
                ChatMessage {
                    role: "system".to_string(),
                    content: "あなたは開発タスクを分析するアシスタントです。".to_string(),
                },
                ChatMessage {
                    role: "user".to_string(),
                    content: prompt,
                },
            ],
            temperature: 0.3,
        };

        let res: ChatCompletionResponse = self.client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&req)
            .send()
            .await?
            .json()
            .await?;

        let intent: ParsedIntent = serde_json::from_str(&res.choices[0].message.content)?;

        Ok(intent)
    }
}
```

---

### 6.3 リッチメニュー実装

#### タスク分解

**Task 6.3.1: リッチメニュー作成**
- [ ] リッチメニューデザイン（6ボタン）
- [ ] LINE Developers管理画面で設定
- [ ] ポストバックアクション設定

---

### 6.4 実装チェックリスト（Phase 6）

- [ ] LINE Messaging API統合完了
- [ ] Webhook実装完了
- [ ] GPT-4統合完了
- [ ] 自然言語処理完了
- [ ] リッチメニュー完了
- [ ] プッシュ通知完了
- [ ] **LINE Bot公開**🚀
- [ ] **Phase 6完了テスト実施**

---

## 📊 全体テスト戦略

### 単体テスト

**フロントエンド（Jest + React Testing Library）**:
```bash
npm run test
```

- コンポーネントテスト
- フックテスト
- ユーティリティ関数テスト

**バックエンド（Rust + cargo test）**:
```bash
cargo test --all
```

- ハンドラテスト
- サービスロジックテスト
- 統合テスト

---

### E2Eテスト（Playwright）

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('GitHub OAuth login', async ({ page }) => {
  await page.goto('/login');
  await page.click('text=GitHubでログイン');

  // GitHub OAuth画面（Mock）
  await page.fill('[name="login"]', 'testuser');
  await page.fill('[name="password"]', 'testpass');
  await page.click('text=Sign in');

  // ダッシュボードにリダイレクト
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Miyabi Dashboard');
});

test('Agent execution', async ({ page }) => {
  await page.goto('/dashboard');

  // Issue選択
  await page.click('text=Issue #270');

  // Agent実行ダイアログ
  await page.click('text=Agent実行');
  await page.selectOption('[name="agent"]', 'CodeGen');
  await page.click('text=実行開始');

  // 実行ステータスページ
  await expect(page.locator('text=実行中')).toBeVisible();
});
```

---

## 📝 更新履歴

| バージョン | 日付 | 更新内容 |
|-----------|------|----------|
| v1.0 | 2025-10-22 | 初版作成 - Phase 0-6の詳細技術要件定義 |

---

**文責**: Claude Code (AI Assistant)
**優先度**: 🔥 **P0-Critical（最重要）**
**次回レビュー**: Week 4（Phase 1完了時）
