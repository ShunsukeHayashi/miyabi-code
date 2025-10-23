# Phase 0: アーキテクチャ設計書

**作成日**: 2025-10-24
**バージョン**: v1.0
**ステータス**: ✅ 設計完了
**関連Issue**: #425

---

## 📋 目次

1. [概要](#概要)
2. [システムアーキテクチャ](#システムアーキテクチャ)
3. [コンポーネント設計](#コンポーネント設計)
4. [データフロー](#データフロー)
5. [セキュリティアーキテクチャ](#セキュリティアーキテクチャ)
6. [スケーラビリティ設計](#スケーラビリティ設計)

---

## 概要

**Miyabi No-Code Web UI** のアーキテクチャ設計書。

### 設計原則

1. **モジュール性**: 各コンポーネントは独立して開発・デプロイ可能
2. **スケーラビリティ**: 水平スケールアウト対応
3. **セキュリティファースト**: 多層防御アーキテクチャ
4. **リアルタイム性**: WebSocketによる双方向通信
5. **可観測性**: ログ・メトリクス・トレーシング完備

---

## システムアーキテクチャ

### 全体構成図

```mermaid
graph TB
    subgraph "クライアント層"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "CDN層 - Vercel Edge Network"
        EdgeCache[Edge Cache]
        EdgeFunctions[Edge Functions]
    end

    subgraph "フロントエンド層 - Vercel"
        NextJS[Next.js 14 App Router]
        SSR[Server Components]
        CSR[Client Components]
        NextAPI[API Routes]
    end

    subgraph "バックエンド層 - Fly.io / AWS Lambda"
        subgraph "Web API - Rust Axum"
            Router[Axum Router]
            Middleware[Tower Middleware]
            Controllers[Controllers]
            Services[Services]
            WSHandler[WebSocket Handler]
        end
    end

    subgraph "データ層"
        PostgreSQL[(PostgreSQL 15)]
        Redis[(Redis 7)]
    end

    subgraph "外部統合層"
        GitHub[GitHub API]
        Anthropic[Anthropic API]
        LINE[LINE Messaging API]
    end

    subgraph "既存Miyabi統合"
        MiyabiA2A[miyabi-a2a]
        MiyabiAgents[miyabi-agents<br/>21 Agents]
        MiyabiGitHub[miyabi-github]
        MiyabiTypes[miyabi-types]
    end

    Browser --> EdgeCache
    Mobile --> EdgeCache
    EdgeCache --> EdgeFunctions
    EdgeFunctions --> NextJS
    NextJS --> SSR
    NextJS --> CSR
    NextJS --> NextAPI

    NextAPI --> Router
    Router --> Middleware
    Middleware --> Controllers
    Controllers --> Services

    CSR -.WebSocket.-> WSHandler

    Services --> PostgreSQL
    Services --> Redis
    Services --> MiyabiA2A
    Services --> GitHub
    Services --> Anthropic
    Services --> LINE

    MiyabiA2A --> MiyabiAgents
    MiyabiAgents --> MiyabiGitHub
    MiyabiAgents --> MiyabiTypes

    style NextJS fill:#0070f3
    style Router fill:#f74c00
    style PostgreSQL fill:#336791
    style Redis fill:#dc382d
    style MiyabiAgents fill:#10b981
```

### レイヤー別責務

#### 1. クライアント層
- **ブラウザ**: Chrome, Firefox, Safari, Edge対応
- **モバイル**: レスポンシブデザイン、PWA対応

#### 2. CDN層（Vercel Edge Network）
- **Edge Cache**: 静的アセット配信（画像、CSS、JS）
- **Edge Functions**: ISR（Incremental Static Regeneration）

#### 3. フロントエンド層（Next.js 14）
- **Server Components**: サーバーサイドレンダリング、SEO最適化
- **Client Components**: インタラクティブUI、WebSocket通信
- **API Routes**: BFF（Backend For Frontend）パターン

#### 4. バックエンド層（Rust Axum）
- **Router**: エンドポイントルーティング
- **Middleware**: CORS、認証、レート制限、ログ
- **Controllers**: リクエストハンドリング
- **Services**: ビジネスロジック
- **WebSocket Handler**: リアルタイム通信

#### 5. データ層
- **PostgreSQL 15**: リレーショナルデータ、JSONB活用
- **Redis 7**: セッション管理、キャッシュ、Pub/Sub

#### 6. 外部統合層
- **GitHub API**: リポジトリ操作、Issue/PR管理
- **Anthropic API**: Claude統合（Agent実行）
- **LINE Messaging API**: LINE Bot統合

#### 7. 既存Miyabi統合
- **miyabi-a2a**: Agent間通信
- **miyabi-agents**: 21個のAutonomous Agents
- **miyabi-github**: GitHub API wrapper
- **miyabi-types**: 共通型定義

---

## コンポーネント設計

### フロントエンド コンポーネント階層

```mermaid
graph TD
    subgraph "Pages - App Router"
        HomePage[Home Page<br/>app/page.tsx]
        DashboardPage[Dashboard Page<br/>app/dashboard/page.tsx]
        AgentsPage[Agents Page<br/>app/agents/page.tsx]
        WorkflowsPage[Workflows Page<br/>app/workflows/page.tsx]
    end

    subgraph "Layouts"
        RootLayout[Root Layout<br/>app/layout.tsx]
        DashboardLayout[Dashboard Layout<br/>app/dashboard/layout.tsx]
    end

    subgraph "Components"
        subgraph "UI Components - shadcn/ui"
            Button[Button]
            Card[Card]
            Dialog[Dialog]
            Dropdown[Dropdown]
        end

        subgraph "Feature Components"
            AgentCard[AgentCard]
            AgentExecutionList[AgentExecutionList]
            WorkflowEditor[WorkflowEditor<br/>React Flow]
            RealtimeStatus[RealtimeStatus<br/>WebSocket]
        end

        subgraph "Dashboard Components"
            StatsCard[StatsCard]
            RecentActivity[RecentActivity]
            ExecutionChart[ExecutionChart<br/>Recharts]
        end
    end

    subgraph "Hooks"
        useAuth[useAuth]
        useWebSocket[useWebSocket]
        useAgentExecution[useAgentExecution]
    end

    subgraph "State Management - Zustand"
        AuthStore[authStore]
        WSStore[websocketStore]
        AgentStore[agentStore]
    end

    subgraph "Data Fetching - TanStack Query"
        AgentQueries[agentQueries]
        RepoQueries[repoQueries]
        ExecutionQueries[executionQueries]
    end

    HomePage --> RootLayout
    DashboardPage --> DashboardLayout
    DashboardLayout --> RootLayout

    DashboardPage --> StatsCard
    DashboardPage --> RecentActivity
    AgentsPage --> AgentCard
    AgentsPage --> AgentExecutionList
    WorkflowsPage --> WorkflowEditor

    AgentCard --> Button
    AgentCard --> Card
    RealtimeStatus --> useWebSocket

    useWebSocket --> WSStore
    useAgentExecution --> AgentQueries
    useAuth --> AuthStore

    style RootLayout fill:#0070f3
    style WorkflowEditor fill:#10b981
    style useWebSocket fill:#f59e0b
```

### バックエンド コンポーネント階層

```mermaid
graph TD
    subgraph "Entry Point"
        Main[main.rs]
    end

    subgraph "Router Layer"
        AppRouter[App Router<br/>routes/mod.rs]
        AuthRoutes[Auth Routes<br/>routes/auth.rs]
        AgentRoutes[Agent Routes<br/>routes/agents.rs]
        RepoRoutes[Repo Routes<br/>routes/repositories.rs]
        WSRoutes[WebSocket Routes<br/>routes/ws.rs]
    end

    subgraph "Middleware Layer"
        AuthMiddleware[Auth Middleware]
        RateLimitMiddleware[Rate Limit]
        LoggingMiddleware[Logging]
        CORSMiddleware[CORS]
    end

    subgraph "Controller Layer"
        AgentController[Agent Controller]
        RepoController[Repo Controller]
        WSController[WebSocket Controller]
    end

    subgraph "Service Layer"
        AgentService[Agent Service]
        RepoService[Repo Service]
        AuthService[Auth Service]
        WSService[WebSocket Service]
    end

    subgraph "Repository Layer"
        AgentRepo[Agent Repository]
        RepoRepo[Repo Repository]
        UserRepo[User Repository]
    end

    subgraph "Model Layer"
        AgentExecution[AgentExecution]
        Repository[Repository]
        User[User]
        Workflow[Workflow]
    end

    subgraph "Database"
        SQLx[SQLx Pool]
        RedisClient[Redis Client]
    end

    subgraph "External Integrations"
        MiyabiA2A[miyabi-a2a<br/>Agent通信]
        Octocrab[octocrab<br/>GitHub API]
        AnthropicSDK[Anthropic SDK]
    end

    Main --> AppRouter
    AppRouter --> AuthRoutes
    AppRouter --> AgentRoutes
    AppRouter --> RepoRoutes
    AppRouter --> WSRoutes

    AgentRoutes --> AuthMiddleware
    AuthMiddleware --> LoggingMiddleware
    LoggingMiddleware --> AgentController

    AgentController --> AgentService
    RepoController --> RepoService
    WSController --> WSService

    AgentService --> AgentRepo
    RepoService --> RepoRepo
    AuthService --> UserRepo

    AgentRepo --> SQLx
    AgentRepo --> RedisClient
    AgentService --> MiyabiA2A
    RepoService --> Octocrab

    style Main fill:#f74c00
    style AgentService fill:#10b981
    style SQLx fill:#336791
    style MiyabiA2A fill:#f59e0b
```

---

## データフロー

### 1. Agent実行フロー

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextJS as Next.js Server
    participant API as Rust API
    participant DB as PostgreSQL
    participant Redis
    participant A2A as miyabi-a2a
    participant Agent as CoordinatorAgent

    User->>Browser: Agent実行ボタンクリック
    Browser->>NextJS: POST /api/agents/execute
    NextJS->>API: POST /agents/execute

    API->>DB: INSERT agent_execution
    DB-->>API: execution_id

    API->>Redis: PUBLISH execution:start
    API-->>NextJS: 202 Accepted {execution_id}
    NextJS-->>Browser: 202 Accepted

    Browser->>Browser: WebSocket接続確立
    Browser->>API: WebSocket /ws/{execution_id}

    API->>A2A: execute_agent(coordinator, task)
    A2A->>Agent: execute(task)

    loop Agent実行中
        Agent->>A2A: progress_update(50%)
        A2A->>API: WebSocket push
        API->>Browser: {progress: 50%}

        Agent->>A2A: log_message("Task分解中...")
        A2A->>API: WebSocket push
        API->>Browser: {log: "Task分解中..."}
    end

    Agent-->>A2A: AgentResult
    A2A-->>API: Result

    API->>DB: UPDATE agent_execution SET status='completed'
    API->>Redis: PUBLISH execution:complete
    API->>Browser: {status: 'completed', result: {...}}

    Browser->>User: 実行完了通知
```

### 2. GitHub OAuth認証フロー

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant NextAuth as NextAuth.js
    participant GitHub as GitHub OAuth
    participant API as Rust API
    participant DB as PostgreSQL

    User->>Browser: "GitHubでログイン"クリック
    Browser->>NextAuth: /api/auth/signin
    NextAuth->>GitHub: OAuth認可リクエスト
    GitHub->>User: 認可画面表示
    User->>GitHub: 認可承認
    GitHub->>NextAuth: Authorization Code
    NextAuth->>GitHub: アクセストークン交換
    GitHub-->>NextAuth: Access Token + User Info

    NextAuth->>API: POST /auth/github/callback
    API->>DB: UPSERT users
    DB-->>API: user_id

    API->>API: JWT生成
    API-->>NextAuth: {jwt_token, user}
    NextAuth-->>Browser: Set-Cookie (session)
    Browser->>User: ダッシュボードへリダイレクト
```

### 3. リアルタイム更新フロー（WebSocket）

```mermaid
sequenceDiagram
    participant Browser1 as Browser A
    participant Browser2 as Browser B
    participant API as Rust API
    participant Redis as Redis Pub/Sub
    participant DB as PostgreSQL

    Browser1->>API: WebSocket接続
    API->>DB: INSERT websocket_connections
    API->>Redis: SUBSCRIBE channel:executions

    Browser2->>API: WebSocket接続
    API->>DB: INSERT websocket_connections
    API->>Redis: SUBSCRIBE channel:executions

    Note over Browser1,API: Agent実行完了（別プロセス）

    API->>Redis: PUBLISH channel:executions<br/>{event: 'completed', execution_id: 123}

    Redis-->>API: Broadcast

    API->>Browser1: WebSocket push<br/>{event: 'execution_completed', data: {...}}
    API->>Browser2: WebSocket push<br/>{event: 'execution_completed', data: {...}}

    Browser1->>Browser1: UIリフレッシュ
    Browser2->>Browser2: UIリフレッシュ
```

---

## セキュリティアーキテクチャ

### 多層防御モデル

```mermaid
graph TD
    subgraph "Layer 1: ネットワーク層"
        Firewall[Firewall<br/>Port制限]
        DDoS[DDoS Protection<br/>Cloudflare/Vercel]
        WAF[WAF<br/>OWASP Top 10対策]
    end

    subgraph "Layer 2: 認証・認可層"
        OAuth[GitHub OAuth 2.0]
        JWT[JWT Token<br/>HMAC SHA-256]
        RBAC[RBAC<br/>Role-Based Access Control]
    end

    subgraph "Layer 3: アプリケーション層"
        RateLimit[Rate Limiting<br/>60 req/min]
        InputValidation[入力検証<br/>Zod Schema]
        CSRF[CSRF Protection<br/>SameSite Cookie]
        CORS[CORS<br/>Origin検証]
    end

    subgraph "Layer 4: データ層"
        Encryption[暗号化<br/>TLS 1.3]
        SQLInjection[SQLインジェクション対策<br/>SQLx Prepared Statement]
        SecretManagement[シークレット管理<br/>環境変数 + Vault]
    end

    subgraph "Layer 5: 監査・ログ層"
        AuditLog[監査ログ<br/>audit_logs table]
        AccessLog[アクセスログ<br/>tracing]
        Alerting[異常検知<br/>Sentry]
    end

    Internet[Internet] --> Firewall
    Firewall --> DDoS
    DDoS --> WAF
    WAF --> OAuth
    OAuth --> JWT
    JWT --> RBAC
    RBAC --> RateLimit
    RateLimit --> InputValidation
    InputValidation --> CSRF
    CSRF --> CORS
    CORS --> Encryption
    Encryption --> SQLInjection
    SQLInjection --> SecretManagement
    SecretManagement --> AuditLog
    AuditLog --> AccessLog
    AccessLog --> Alerting

    style WAF fill:#dc2626
    style JWT fill:#0891b2
    style SQLInjection fill:#7c3aed
```

### セキュリティ対策一覧

| レイヤー | 脅威 | 対策 | 実装箇所 |
|---------|------|------|---------|
| **ネットワーク** | DDoS攻撃 | Vercel/Cloudflare DDoS Protection | CDN層 |
| **ネットワーク** | 不正アクセス | Firewall（ポート制限） | インフラ層 |
| **認証** | 認証情報漏洩 | GitHub OAuth 2.0 | NextAuth.js |
| **認証** | セッション乗っ取り | JWT + HMAC SHA-256 | Rust API |
| **認可** | 権限昇格 | RBAC（is_admin フラグ） | Middleware |
| **アプリ** | SQLインジェクション | SQLx Prepared Statement | Repository層 |
| **アプリ** | XSS攻撃 | React自動エスケープ | Frontend |
| **アプリ** | CSRF攻撃 | SameSite Cookie + CSRF Token | Middleware |
| **アプリ** | Rate Limit回避 | Redis Rate Limiter（60 req/min） | Middleware |
| **データ** | 通信盗聴 | TLS 1.3 | HTTPS |
| **データ** | DB漏洩 | PostgreSQL暗号化 + アクセス制御 | Database |
| **データ** | Secret漏洩 | 環境変数 + .env除外 | .gitignore |
| **監査** | 不正操作隠蔽 | audit_logs テーブル | Database |

---

## スケーラビリティ設計

### 水平スケーリング戦略

```mermaid
graph TD
    subgraph "ロードバランサー層"
        ALB[Application Load Balancer]
    end

    subgraph "フロントエンド層（自動スケール）"
        Next1[Next.js Instance 1<br/>Vercel]
        Next2[Next.js Instance 2<br/>Vercel]
        Next3[Next.js Instance N<br/>Vercel]
    end

    subgraph "バックエンド層（手動スケール）"
        API1[Rust API Instance 1<br/>Fly.io]
        API2[Rust API Instance 2<br/>Fly.io]
        API3[Rust API Instance N<br/>Fly.io]
    end

    subgraph "データ層（レプリケーション）"
        DBPrimary[(PostgreSQL Primary)]
        DBReplica1[(PostgreSQL Replica 1)]
        DBReplica2[(PostgreSQL Replica 2)]

        RedisPrimary[(Redis Primary)]
        RedisReplica[(Redis Replica)]
    end

    Internet[Internet] --> ALB

    ALB --> Next1
    ALB --> Next2
    ALB --> Next3

    Next1 --> API1
    Next2 --> API2
    Next3 --> API3

    API1 --> DBPrimary
    API2 --> DBReplica1
    API3 --> DBReplica2

    DBPrimary -.Replication.-> DBReplica1
    DBPrimary -.Replication.-> DBReplica2

    API1 --> RedisPrimary
    API2 --> RedisPrimary
    API3 --> RedisPrimary

    RedisPrimary -.Replication.-> RedisReplica

    style DBPrimary fill:#336791
    style RedisPrimary fill:#dc382d
    style ALB fill:#ff9900
```

### パフォーマンス最適化

#### フロントエンド最適化

| 手法 | 実装 | 効果 |
|-----|------|-----|
| **Code Splitting** | Next.js Dynamic Import | 初期ロード時間 -40% |
| **Image Optimization** | next/image | 画像サイズ -60% |
| **Static Generation** | ISR (60秒キャッシュ) | TTFB -80% |
| **Edge Caching** | Vercel Edge Network | レイテンシ -70% |
| **Lazy Loading** | React.lazy() | FCP -30% |

#### バックエンド最適化

| 手法 | 実装 | 効果 |
|-----|------|-----|
| **Connection Pooling** | SQLx Pool (max: 20) | DB接続時間 -90% |
| **Query Optimization** | Index活用 | クエリ速度 +500% |
| **Redis Caching** | 頻繁アクセスデータ | API応答時間 -60% |
| **非同期処理** | Tokio Runtime | スループット +300% |
| **Batch Processing** | バルクインサート | 書き込み速度 +1000% |

### スケーリング目標

| メトリクス | 現状（MVP） | 3ヶ月後 | 1年後 |
|----------|-----------|--------|-------|
| **同時接続数** | 100 | 1,000 | 10,000 |
| **Agent実行/日** | 100 | 1,000 | 10,000 |
| **API応答時間** | < 200ms | < 100ms | < 50ms |
| **可用性** | 99.0% | 99.5% | 99.9% |
| **DB容量** | 1 GB | 10 GB | 100 GB |

---

## 次のステップ

- [x] Task 0.3.1: システムアーキテクチャ図作成 ✅
- [ ] Task 0.3.2: ER図作成（7テーブルの関係性）
- [ ] Task 0.3.3: API仕様書作成（OpenAPI 3.0）
- [ ] Task 0.3.4: ユーザーフロー図作成

---

**作成者**: Claude Code
**承認者**: （署名欄）
**承認日**: 2025-10-24

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
