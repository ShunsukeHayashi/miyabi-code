---
title: "詳細実行プラン 2025-11-26"
created: 2025-11-26
author: "Claude Code (Pixel MAESTRO)"
priority: P0
status: draft
---

# 🎯 Miyabi Society 詳細実行プラン

**作成日時**: 2025-11-26 15:00 JST
**作成者**: Claude Code on Pixel (MAESTRO)
**承認待ち**: ユーザー

---

## 📊 現状分析

### 1. マシン状況

| マシン | Branch | 状態 | 負荷 | Claude | 問題点 |
|--------|--------|------|------|--------|--------|
| 📱 Pixel | `main` | ✅ Clean | - | 1 | CLAUDE.md修正済 |
| 💻 MacBook | `feat/miyabi-society-reconstruction` | ⚠️ | 6-9 | **32** | 多すぎるClaude |
| ⚡ MUGEN | `feat/miyabi-society-reconstruction` | ⚠️ | **17.4** | 2+Codex | 高負荷 |
| ⚡ MAJIN | `main` | 🔴 | 1.0 | 0 | **300+未コミット変更** |

### 2. ブランチ状況

```
main (Pixel, MAJIN)
  └── feat/miyabi-society-reconstruction (MacBook, MUGEN)
        └── 最新コミット: 8bf7e09cf (web-api Axum 0.8)
```

**問題**: ブランチが分岐している。MAJINの大量変更が未マージ。

### 3. Issue依存関係グラフ

```
#970 [P0] Miyabi Society 完全再構築 (PARENT)
  │
  ├── #1169 [P0] AWS Lambda + API Gateway ← 今日の最優先
  │     ├── depends: #1167 (RDS) ✅
  │     └── depends: #1168 (Migrations) ✅
  │
  ├── #1170 [P1] S3 + CloudFront
  │     ├── depends: #1166 (環境変数化)
  │     └── depends: #1169 (API Gateway)
  │
  ├── #1173 [P1] Business Agent DB統合
  │     └── depends: #1172 (DB routes検証)
  │
  ├── #1174 [P1] Coding Agent 並列実行
  │     └── depends: #1173
  │
  ├── #1175 [P1] WebSocket リアルタイム
  │     ├── depends: #1169
  │     └── depends: #1173
  │
  └── #1176 [P1] RBAC Middleware
        ├── depends: #1168
        └── depends: #1172
```

---

## 🚨 緊急対応事項

### Phase 0: 環境整備 (30分)

#### 0.1 MAJINの未コミット変更を処理

**問題**: 300+ファイルの未コミット変更がMAJINに存在
**リスク**: データ損失、マージコンフリクト
**対応**:

```bash
# MAJIN上で実行
ssh majin

# 1. 変更内容を確認
cd ~/miyabi-private
git status | head -50

# 2. 重要な変更をstash
git stash push -m "MAJIN uncommitted changes 2025-11-26"

# 3. または、新しいブランチに保存
git checkout -b backup/majin-changes-2025-11-26
git add -A
git commit -m "backup: MAJIN uncommitted changes"
git checkout main
```

#### 0.2 MacBookのClaude Codeセッション整理

**問題**: 32個のClaude Codeが稼働中
**リスク**: リソース枯渇、コンフリクト
**対応**:

```bash
# MacBook上で実行
ssh mac

# 1. 不要なセッションを特定
ps aux | grep claude | grep -v grep

# 2. 土曜日以前の古いセッションを終了
# (手動で確認後)
```

#### 0.3 ブランチ統一

**方針**: `feat/miyabi-society-reconstruction` を `main` にマージ

```bash
# MUGEN上で実行 (最新コードがある)
ssh mugen
cd ~/miyabi-private
git checkout main
git pull origin main
git merge feat/miyabi-society-reconstruction
git push origin main
```

---

## 🔥 Phase 1: P0 Issue #1169 実装 (4時間)

### AWS Lambda + API Gateway デプロイ環境構築

#### 1.1 アーキテクチャ

```
                    ┌─────────────┐
                    │  CloudFront │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ API Gateway │
                    │  (HTTP API) │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Lambda    │
                    │ (Rust ARM64)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼────┐ ┌────▼────┐
        │    RDS    │ │ Secrets │ │CloudWatch│
        │ PostgreSQL│ │ Manager │ │  Logs   │
        └───────────┘ └─────────┘ └─────────┘
```

#### 1.2 実装ステップ

##### Step 1.2.1: Terraform モジュール作成 (1h)

**ファイル**: `infrastructure/terraform/modules/lambda-api/`

```hcl
# main.tf
resource "aws_lambda_function" "miyabi_api" {
  function_name = "${var.project_name}-api-${var.environment}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DATABASE_URL = var.database_url
      JWT_SECRET   = var.jwt_secret
      RUST_LOG     = var.log_level
    }
  }

  tags = {
    Issue = "#1169"
  }
}

resource "aws_apigatewayv2_api" "miyabi" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Authorization", "Content-Type"]
    max_age       = 86400
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.miyabi.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.miyabi_api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.miyabi.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.miyabi.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
    })
  }
}
```

##### Step 1.2.2: Lambda用Rustビルド設定 (30m)

**ファイル**: `crates/miyabi-web-api/Cargo.toml` 修正

```toml
[package]
name = "miyabi-web-api"
# ... existing config ...

[[bin]]
name = "bootstrap"  # Lambda requires this name
path = "src/main.rs"

[dependencies]
lambda_http = "0.11"
lambda_runtime = "0.11"
# ... existing deps ...

[features]
default = []
lambda = ["lambda_http", "lambda_runtime"]
```

**ファイル**: `crates/miyabi-web-api/src/main.rs` 修正

```rust
#[cfg(feature = "lambda")]
use lambda_http::{run, service_fn, Body, Error, Request, Response};

#[cfg(feature = "lambda")]
#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    let app = create_router().await?;
    run(service_fn(|event: Request| async {
        // Lambda handler
    })).await
}

#[cfg(not(feature = "lambda"))]
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Existing server code
}
```

##### Step 1.2.3: CI/CD Pipeline (1h)

**ファイル**: `.github/workflows/deploy-lambda.yml`

```yaml
name: Deploy to Lambda

on:
  push:
    branches: [main]
    paths:
      - 'crates/miyabi-web-api/**'
  workflow_dispatch:

env:
  CARGO_TERM_COLOR: always
  AWS_REGION: ap-northeast-1

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: aarch64-unknown-linux-gnu

      - name: Install cargo-lambda
        run: pip install cargo-lambda

      - name: Build for Lambda
        run: |
          cargo lambda build --release --arm64 \
            --features lambda \
            -p miyabi-web-api

      - name: Deploy to Lambda
        run: |
          cargo lambda deploy miyabi-api-${{ github.ref_name }} \
            --region ${{ env.AWS_REGION }}
```

##### Step 1.2.4: ローカルテスト (30m)

```bash
# cargo-lambda でローカルテスト
cargo lambda watch -p miyabi-web-api --features lambda

# 別ターミナルでテスト
curl http://localhost:9000/api/v1/health
```

##### Step 1.2.5: デプロイ実行 (1h)

```bash
# 1. Terraformでインフラ構築
cd infrastructure/terraform/environments/dev
terraform init
terraform plan -out=plan.out
terraform apply plan.out

# 2. Lambda関数デプロイ
cargo lambda build --release --arm64 --features lambda -p miyabi-web-api
cargo lambda deploy miyabi-api-dev

# 3. 動作確認
curl https://<api-gateway-url>/api/v1/health
```

#### 1.3 受入条件チェックリスト

- [ ] Lambda関数が正常にデプロイ
- [ ] API Gateway経由で `/api/v1/health` が 200 OK
- [ ] CloudWatch Logsにログ出力
- [ ] RDSへの接続成功（VPC内から）
- [ ] レスポンスタイム < 500ms

---

## 📦 Phase 2: P1 Issues (並列実行可能)

### 2.1 Issue #1170: S3 + CloudFront (3h)

**担当**: DeploymentAgent
**実行場所**: MUGEN

#### アーキテクチャ

```
Route53 (miyabi-society.com)
    │
    ▼
CloudFront Distribution
    │
    ├── /api/* → API Gateway (Origin)
    │
    └── /* → S3 Bucket (Origin)
              └── index.html, assets/
```

#### 実装ステップ

1. **S3バケット作成** (30m)
   - バケットポリシー設定
   - 静的ウェブホスティング有効化
   - CORS設定

2. **CloudFront Distribution** (1h)
   - Origin Access Control (OAC) 設定
   - キャッシュポリシー設定
   - API Gateway Origin追加 (/api/*)
   - SSL証明書設定

3. **デプロイスクリプト** (30m)
   ```bash
   # scripts/deploy-frontend.sh
   #!/bin/bash
   npm run build
   aws s3 sync dist/ s3://$BUCKET_NAME/ --delete
   aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
   ```

4. **Route53設定** (30m)
   - Aレコード (Alias to CloudFront)
   - AAAA レコード (IPv6)

5. **テスト** (30m)
   - https://miyabi-society.com 動作確認
   - /api/* プロキシ確認
   - キャッシュ確認

---

### 2.2 Issue #1173: Business Agent DB統合 (16h)

**担当**: CodeGenAgent
**実行場所**: MacBook または MUGEN

#### 対象Agent (14個)

| # | Agent | 優先度 | 複雑度 |
|---|-------|--------|--------|
| 1 | AIEntrepreneurAgent | High | Medium |
| 2 | SelfAnalysisAgent | High | Low |
| 3 | MarketResearchAgent | High | Medium |
| 4 | PersonaAgent | Medium | Low |
| 5 | ProductConceptAgent | Medium | Medium |
| 6 | ProductDesignAgent | Medium | High |
| 7 | ContentCreationAgent | High | Medium |
| 8 | FunnelDesignAgent | Medium | Medium |
| 9 | SNSStrategyAgent | Medium | Low |
| 10 | MarketingAgent | High | Medium |
| 11 | SalesAgent | Medium | Medium |
| 12 | CRMAgent | Medium | Low |
| 13 | AnalyticsAgent | High | High |
| 14 | YouTubeAgent | Medium | Medium |

#### 実装計画

##### Step 1: 共通トレイト定義 (2h)

```rust
// crates/miyabi-agent-business/src/persistence.rs

use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

#[async_trait]
pub trait PersistableAgent: Send + Sync {
    /// エージェント実行結果をDBに保存
    async fn save_execution(
        &self,
        db: &PgPool,
        result: &AgentResult,
    ) -> Result<Uuid, PersistenceError>;

    /// 実行履歴を取得
    async fn load_history(
        &self,
        db: &PgPool,
        limit: usize,
    ) -> Result<Vec<AgentExecution>, PersistenceError>;

    /// エージェントタイプを返す
    fn agent_type(&self) -> &'static str;
}

#[derive(Debug, Clone)]
pub struct AgentExecution {
    pub id: Uuid,
    pub agent_type: String,
    pub repository_id: Option<i64>,
    pub issue_number: Option<i32>,
    pub status: ExecutionStatus,
    pub result_summary: Option<serde_json::Value>,
    pub started_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}
```

##### Step 2: 各Agentへの実装 (12h)

**実装順序**: 優先度 High → Medium → Low

```rust
// 例: AIEntrepreneurAgent
impl PersistableAgent for AIEntrepreneurAgent {
    async fn save_execution(
        &self,
        db: &PgPool,
        result: &AgentResult,
    ) -> Result<Uuid, PersistenceError> {
        let id = Uuid::new_v4();
        sqlx::query!(
            r#"
            INSERT INTO agent_executions
            (id, agent_type, status, result_summary, started_at)
            VALUES ($1, $2, $3, $4, NOW())
            "#,
            id,
            self.agent_type(),
            result.status.to_string(),
            serde_json::to_value(&result.summary)?
        )
        .execute(db)
        .await?;
        Ok(id)
    }

    fn agent_type(&self) -> &'static str {
        "ai_entrepreneur"
    }
}
```

##### Step 3: Web API統合 (2h)

```rust
// routes/agents.rs に追加
pub async fn execute_business_agent(
    State(state): State<AppState>,
    Path(agent_type): Path<String>,
    Json(req): Json<ExecuteAgentRequest>,
) -> Result<Json<ExecuteAgentResponse>> {
    let agent = get_business_agent(&agent_type)?;

    // 実行開始をDB記録
    let execution_id = agent.save_execution(&state.db, &AgentResult::started()).await?;

    // Agent実行
    let result = agent.execute(&req.input).await?;

    // 結果をDB更新
    update_execution(&state.db, execution_id, &result).await?;

    Ok(Json(ExecuteAgentResponse { execution_id, result }))
}
```

---

### 2.3 Issue #1174: Coding Agent 並列実行 (20h)

**担当**: CoordinatorAgent
**実行場所**: MUGEN (Worktree必要)

#### 並列実行アーキテクチャ

```
                     ┌─────────────────┐
                     │ CoordinatorAgent│
                     │   (Orchestrator)│
                     └────────┬────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Task Decomposer │
                    └─────────┬─────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼──────┐
    │  Worktree 1 │    │  Worktree 2 │    │  Worktree 3 │
    │  CodeGen    │    │   Review    │    │   Issue     │
    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                     ┌────────▼────────┐
                     │   Result Merger │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │    PRAgent      │
                     └────────┬────────┘
                              │
                     ┌────────▼────────┐
                     │ DeploymentAgent │
                     └─────────────────┘
```

#### 実装ステップ

##### Step 1: ParallelExecutor実装 (8h)

```rust
// crates/miyabi-worktree/src/parallel.rs

pub struct ParallelExecutor {
    max_workers: usize,
    pool: WorktreePool,
    semaphore: Arc<Semaphore>,
}

impl ParallelExecutor {
    pub fn new(max_workers: usize) -> Self {
        Self {
            max_workers,
            pool: WorktreePool::new(),
            semaphore: Arc::new(Semaphore::new(max_workers)),
        }
    }

    pub async fn execute_agents(
        &self,
        tasks: Vec<AgentTask>,
    ) -> Result<Vec<AgentResult>> {
        let handles: Vec<_> = tasks
            .into_iter()
            .map(|task| {
                let sem = self.semaphore.clone();
                let pool = self.pool.clone();

                tokio::spawn(async move {
                    let _permit = sem.acquire().await?;
                    let worktree = pool.acquire().await?;

                    let result = task.agent.execute_in_worktree(&worktree).await;

                    pool.release(worktree).await;
                    result
                })
            })
            .collect();

        let results = futures::future::join_all(handles).await;
        // ... error handling
    }
}
```

##### Step 2: Web API統合 (4h)

```rust
// routes/agents.rs
pub async fn execute_parallel(
    State(state): State<AppState>,
    Json(req): Json<ParallelExecuteRequest>,
) -> Result<Json<ParallelExecuteResponse>> {
    let executor = ParallelExecutor::new(req.max_workers.unwrap_or(3));

    let tasks: Vec<AgentTask> = req.agents
        .iter()
        .map(|a| AgentTask::from_request(a))
        .collect();

    let results = executor.execute_agents(tasks).await?;

    Ok(Json(ParallelExecuteResponse {
        execution_id: Uuid::new_v4(),
        results,
    }))
}
```

##### Step 3: Dashboard統合 (4h)

- 並列実行状況のリアルタイム表示
- Worktree使用状況の可視化
- 各Agent進捗のプログレスバー

##### Step 4: テスト (4h)

- 並列実行の正常系テスト
- Worktreeリーク検出テスト
- 負荷テスト (10並列)

---

### 2.4 Issue #1175: WebSocket リアルタイム更新 (12h)

**担当**: CodeGenAgent
**実行場所**: MacBook または MUGEN

#### 実装計画

##### Step 1: Event Types定義 (2h)

```rust
// events.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum WebSocketEvent {
    AgentStarted {
        agent_type: String,
        issue_number: Option<i32>,
        execution_id: Uuid,
    },
    AgentProgress {
        execution_id: Uuid,
        progress: u8,
        message: String,
    },
    AgentCompleted {
        execution_id: Uuid,
        status: String,
        result_summary: Option<serde_json::Value>,
    },
    AgentFailed {
        execution_id: Uuid,
        error: String,
    },
    TaskUpdated {
        task_id: Uuid,
        status: String,
        updated_at: chrono::DateTime<chrono::Utc>,
    },
    WorktreeCreated {
        worktree_id: String,
        branch: String,
    },
    WorktreeDeleted {
        worktree_id: String,
    },
}
```

##### Step 2: Broadcaster実装 (4h)

```rust
// ws/broadcaster.rs
pub struct EventBroadcaster {
    sender: broadcast::Sender<WebSocketEvent>,
}

impl EventBroadcaster {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(1000);
        Self { sender }
    }

    pub async fn broadcast(&self, event: WebSocketEvent) {
        let _ = self.sender.send(event);
    }

    pub fn subscribe(&self) -> broadcast::Receiver<WebSocketEvent> {
        self.sender.subscribe()
    }
}
```

##### Step 3: WebSocket Handler強化 (4h)

```rust
// routes/websocket.rs
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Extension(claims): Extension<Option<Claims>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state, claims))
}

async fn handle_socket(
    socket: WebSocket,
    state: AppState,
    claims: Option<Claims>,
) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.broadcaster.subscribe();

    // 受信タスク (クライアントからのメッセージ)
    let recv_task = tokio::spawn(async move {
        while let Some(msg) = receiver.next().await {
            // Ping/Pong handling
        }
    });

    // 送信タスク (サーバーからのイベント)
    let send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            let msg = serde_json::to_string(&event).unwrap();
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    tokio::select! {
        _ = recv_task => {},
        _ = send_task => {},
    }
}
```

##### Step 4: Frontend統合 (2h)

```typescript
// hooks/useWebSocket.ts
export function useAgentUpdates() {
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`${WS_URL}/api/v1/ws`);

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000); // 自動再接続
      };
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setEvents(prev => [...prev.slice(-100), data]);
      };

      wsRef.current = ws;
    };

    connect();
    return () => wsRef.current?.close();
  }, []);

  return { events, isConnected };
}
```

---

### 2.5 Issue #1176: RBAC Middleware (8h)

**担当**: CodeGenAgent
**実行場所**: MacBook

#### 権限マッピング

| Endpoint | Method | Permission |
|----------|--------|------------|
| `/tasks` | POST | `tasks:write` |
| `/tasks/:id` | DELETE | `tasks:delete` |
| `/organizations` | POST | (auth only) |
| `/organizations/:id/members` | POST | `org:invite` |
| `/organizations/:id/members/:user_id` | DELETE | `org:remove_member` |
| `/organizations/:id/members/:user_id/role` | PUT | `org:change_roles` |
| `/agents/execute` | POST | `agent:execute` |
| `/deploy` | POST | `deploy:production` |
| `/admin/*` | * | `admin:access` |

#### 実装ステップ

##### Step 1: Permission Middleware (3h)

```rust
// middleware/rbac.rs
pub fn require_permission(permission: &'static str) -> impl Fn(/* ... */) {
    move |
        State(state): State<AppState>,
        Extension(claims): Extension<Claims>,
        request: Request,
        next: Next,
    | async move {
        let user_id: Uuid = claims.sub.parse()?;

        let has_perm: bool = sqlx::query_scalar!(
            "SELECT has_permission($1, $2)",
            user_id,
            permission
        )
        .fetch_one(&state.db)
        .await?
        .unwrap_or(false);

        if !has_perm {
            tracing::warn!(
                user_id = %user_id,
                permission = permission,
                "Permission denied"
            );
            return Err((StatusCode::FORBIDDEN, "Permission denied"));
        }

        next.run(request).await
    }
}
```

##### Step 2: Route適用 (3h)

```rust
// routes/mod.rs
pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Public routes
        .route("/health", get(health::health_check))
        .route("/auth/github", get(auth::github_callback))

        // Protected routes with RBAC
        .route("/tasks", post(tasks::create_task)
            .layer(from_fn_with_state(state.clone(), require_permission("tasks:write"))))
        .route("/tasks/:id", delete(tasks::delete_task)
            .layer(from_fn_with_state(state.clone(), require_permission("tasks:delete"))))

        .route("/agents/execute", post(agents::execute_agent)
            .layer(from_fn_with_state(state.clone(), require_permission("agent:execute"))))

        .route("/deploy", post(deployments::deploy)
            .layer(from_fn_with_state(state.clone(), require_permission("deploy:production"))))

        // Admin routes
        .nest("/admin", admin_routes()
            .layer(from_fn_with_state(state.clone(), require_permission("admin:access"))))

        .with_state(state)
}
```

##### Step 3: テスト (2h)

```rust
#[tokio::test]
async fn test_permission_denied() {
    let app = create_test_app().await;
    let token = create_token_for_user_without_permission("tasks:write");

    let response = app
        .oneshot(
            Request::builder()
                .uri("/tasks")
                .method("POST")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap()
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_permission_granted() {
    let app = create_test_app().await;
    let token = create_token_for_admin();

    let response = app
        .oneshot(
            Request::builder()
                .uri("/tasks")
                .method("POST")
                .header("Authorization", format!("Bearer {}", token))
                .header("Content-Type", "application/json")
                .body(Body::from(r#"{"title":"Test"}"#))
                .unwrap()
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CREATED);
}
```

---

## 📅 実行スケジュール

### Day 1 (今日): Phase 0 + Phase 1

| 時間 | タスク | 担当 | 場所 |
|------|--------|------|------|
| 15:00-15:30 | Phase 0: 環境整備 | Pixel MAESTRO | 全マシン |
| 15:30-17:30 | #1169 Step 1-2: Terraform + Rust設定 | MUGEN | MUGEN |
| 17:30-18:30 | #1169 Step 3: CI/CD | MUGEN | MUGEN |
| 18:30-19:00 | #1169 Step 4: ローカルテスト | MUGEN | MUGEN |
| 19:00-20:00 | #1169 Step 5: デプロイ | MUGEN | MUGEN |

### Day 2: Phase 2 (並列実行)

| タスク | 担当 | 場所 | 工数 |
|--------|------|------|------|
| #1170 S3 + CloudFront | DeploymentAgent | MUGEN | 3h |
| #1176 RBAC Middleware | CodeGenAgent | MacBook | 8h |

### Day 3-4: Phase 2 続き

| タスク | 担当 | 場所 | 工数 |
|--------|------|------|------|
| #1173 Business Agent DB | CodeGenAgent | MUGEN | 16h |
| #1175 WebSocket | CodeGenAgent | MacBook | 12h |

### Day 5-6: Phase 2 完了

| タスク | 担当 | 場所 | 工数 |
|--------|------|------|------|
| #1174 Coding Agent 並列 | CoordinatorAgent | MUGEN | 20h |

---

## ⚠️ リスクと対策

### 1. MAJINの未コミット変更

**リスク**: マージコンフリクト、データ損失
**対策**:
- 最初にstash or backup branch作成
- 段階的にマージ

### 2. MacBookの32 Claude問題

**リスク**: リソース枯渇
**対策**:
- 不要セッション終了
- 新規タスクはMUGENへ振り分け

### 3. Lambda Cold Start

**リスク**: 初回リクエスト遅延
**対策**:
- Provisioned Concurrency設定
- ARM64 (Graviton) で起動時間短縮

### 4. WebSocket on API Gateway

**リスク**: HTTP APIはWebSocket非対応
**対策**:
- 別途WebSocket APIを作成
- または、ALB経由のECS併用

---

## ✅ 承認チェックリスト

- [ ] Phase 0 環境整備の方針を承認
- [ ] #1169 Lambda実装アプローチを承認
- [ ] Phase 2 並列実行計画を承認
- [ ] リソース割り当て（MacBook/MUGEN/MAJIN）を承認
- [ ] スケジュールを承認

---

**プラン作成完了**: 2025-11-26 15:30 JST
**次のステップ**: ユーザー承認後、Phase 0 から実行開始
