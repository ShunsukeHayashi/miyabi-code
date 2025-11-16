# AIFactory × Miyabi Integration Architecture

**Project**: The Pantheon - AIFactory Integration
**Version**: 1.0.0
**Date**: 2025-11-12
**Status**: 📋 Architecture Definition Phase

---

## 🎯 Executive Summary

**Goal**: AIFactory (React/TypeScript Web App) を Miyabi (Rust Agent OS) に完全統合し、統一されたバックエンドと自律型エージェントシステムを実現

### Before & After

```
BEFORE:
┌─────────────────┐     ┌─────────────────┐
│   AIFactory     │     │     Miyabi      │
│                 │     │                 │
│  React UI       │     │   Rust Agents   │
│     ↓           │     │       ↓         │
│  NestJS API     │     │  miyabi-web-api │
│     ↓           │     │       ↓         │
│  PostgreSQL     │     │  GitHub Issues  │
└─────────────────┘     └─────────────────┘
   Separate Systems       Separate Systems

AFTER:
┌────────────────────────────────────────────────┐
│           The Pantheon Unified System          │
│                                                │
│  ┌──────────────┐    ┌────────────────────┐  │
│  │  AIFactory   │    │  Pantheon Web APP  │  │
│  │   (React)    │    │    (Next.js)       │  │
│  └──────┬───────┘    └─────────┬──────────┘  │
│         │                      │              │
│         └──────────┬───────────┘              │
│                    ▼                          │
│        ┌─────────────────────────┐            │
│        │  Miyabi Unified Web API │            │
│        │     (Rust Axum)         │            │
│        └────────┬────────────────┘            │
│                 │                             │
│    ┌────────────┼────────────┐               │
│    ▼            ▼            ▼               │
│ PostgreSQL  GitHub API   AWS API             │
│ (Business)  (A2A State)  (Infrastructure)    │
└────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│                                                          │
│  ┌──────────────────┐        ┌─────────────────────┐   │
│  │   AIFactory UI   │        │  Pantheon Web APP   │   │
│  │  (React 18 + TS) │        │  (Next.js 14)       │   │
│  │                  │        │                     │   │
│  │  • AI Search     │        │  • Agent Dashboard  │   │
│  │  • Settings      │        │  • AWS Diagram      │   │
│  │  • Product Mgmt  │        │  • Analytics        │   │
│  └────────┬─────────┘        └──────────┬──────────┘   │
│           │                             │              │
│           └──────────┬──────────────────┘              │
└──────────────────────┼─────────────────────────────────┘
                       │
                REST + WebSocket
                       │
┌──────────────────────┼─────────────────────────────────┐
│                      ▼                                  │
│          Miyabi Unified Web API (Axum)                 │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │         Router Layer (Axum)                    │   │
│  │  /api/v1/agents       - Agent management       │   │
│  │  /api/v1/aws          - AWS resources          │   │
│  │  /api/v1/business     - Business logic         │   │
│  │  /api/v1/auth         - Authentication         │   │
│  │  /ws                  - WebSocket              │   │
│  └─────────────────┬──────────────────────────────┘   │
│                    │                                   │
│  ┌─────────────────┼─────────────────────┐            │
│  │                 ▼                     │            │
│  │       Middleware Layer                │            │
│  │  • JWT Authentication                 │            │
│  │  • CORS                               │            │
│  │  • Rate Limiting                      │            │
│  │  • Request Logging                    │            │
│  │  • Error Handling                     │            │
│  └─────────────────┬─────────────────────┘            │
│                    │                                   │
│  ┌─────────────────┼─────────────────────┐            │
│  │                 ▼                     │            │
│  │         Service Layer                 │            │
│  │                                       │            │
│  │  ┌─────────────┐  ┌────────────────┐ │            │
│  │  │ Agent Svc   │  │ Business Svc   │ │            │
│  │  │ (Orchestrator)│  │ (CRUD Logic)   │ │            │
│  │  └─────────────┘  └────────────────┘ │            │
│  │                                       │            │
│  │  ┌─────────────┐  ┌────────────────┐ │            │
│  │  │  AWS Svc    │  │   Auth Svc     │ │            │
│  │  │ (Resources) │  │  (JWT/RBAC)    │ │            │
│  │  └─────────────┘  └────────────────┘ │            │
│  └─────────────────┬─────────────────────┘            │
│                    │                                   │
│  ┌─────────────────┼─────────────────────┐            │
│  │                 ▼                     │            │
│  │      Data Access Layer (SeaORM)      │            │
│  │  • Database Models                    │            │
│  │  • Query Builder                      │            │
│  │  • Transaction Management             │            │
│  └─────────────────┬─────────────────────┘            │
└────────────────────┼─────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌─────────┐ ┌────────┐
│  PostgreSQL  │ │ GitHub  │ │  AWS   │
│  (Business)  │ │  API    │ │  API   │
│              │ │ (A2A)   │ │ (Infra)│
└──────────────┘ └─────────┘ └────────┘
```

### Component Breakdown

#### Frontend Components

##### AIFactory UI (React 18 + TypeScript)

**Location**: `/Users/shunsuke/Dev/AIfactory`

**Current Components** (17 components, 1,581 LOC):
- `AIServiceSearch.tsx` - AI service discovery
- `SettingsPanel.tsx` - Configuration management
- `ProductManager.tsx` - Product CRUD
- `OrderList.tsx` - Order management
- etc.

**Migration Strategy**:
1. Keep all React components as-is
2. Update API client to point to Miyabi Web API
3. Replace NestJS endpoint calls with Rust Axum endpoints
4. Add WebSocket connection for real-time updates

##### Pantheon Web APP (Next.js 14)

**Location**: `/Users/shunsuke/Dev/miyabi-private/pantheon-webapp` (to be created)

**New Components**:
- Historical Agents pages
- Guardians dashboard
- Council visualization
- AWS architecture diagram
- Analytics dashboard

#### Backend Components

##### Miyabi Unified Web API (Rust Axum)

**Crate**: `miyabi-web-api` (existing, to be extended)

**Current Features**:
- Basic REST API
- WebSocket support
- Mission Control integration

**New Features**:
- AIFactory endpoints migration
- Business logic services
- JWT authentication middleware
- CORS configuration for multiple frontends

##### miyabi-business-api (New Crate)

**Purpose**: AIFactory business logic in Rust

**Structure**:
```
crates/miyabi-business-api/
├── src/
│   ├── lib.rs
│   ├── routes/
│   │   ├── products.rs      # Product CRUD
│   │   ├── orders.rs        # Order management
│   │   ├── ai_jobs.rs       # AI generation jobs
│   │   ├── payments.rs      # Payment processing
│   │   └── approvals.rs     # Approval workflows
│   ├── models/
│   │   ├── product.rs       # SeaORM entity
│   │   ├── order.rs
│   │   ├── ai_job.rs
│   │   ├── payment.rs
│   │   └── approval.rs
│   ├── services/
│   │   ├── product_service.rs
│   │   ├── order_service.rs
│   │   └── ai_service.rs
│   ├── agents/
│   │   ├── course_generator.rs    # Agent 201
│   │   ├── document_generator.rs  # Agent 202
│   │   ├── content_search.rs      # Agent 203
│   │   ├── payment_processor.rs   # Agent 204
│   │   └── approval_workflow.rs   # Agent 205
│   └── error.rs
└── Cargo.toml
```

##### miyabi-composite-state (New Crate)

**Purpose**: Unified state management across all systems

**Structure**:
```
crates/miyabi-composite-state/
├── src/
│   ├── lib.rs
│   ├── manager.rs           # CompositeStateManager
│   ├── agent_state.rs       # Agent state (from A2A)
│   ├── business_state.rs    # Business state (PostgreSQL)
│   ├── user_state.rs        # User state (in-memory)
│   ├── aws_state.rs         # AWS state (from AWS API)
│   ├── sync.rs              # State synchronization
│   └── events.rs            # Event-driven updates
└── Cargo.toml
```

---

## 🔑 Core Data Models

### Database Schema (PostgreSQL)

```sql
-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    user_id UUID NOT NULL,
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Jobs
CREATE TABLE ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(100) NOT NULL,  -- 'course', 'document', 'search'
    input_data JSONB NOT NULL,
    output_data JSONB,
    status VARCHAR(50) DEFAULT 'queued',
    agent_id INT,  -- 201-205
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    stripe_payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    approver_id UUID,
    status VARCHAR(50) DEFAULT 'pending',
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users (for AIFactory)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Rust Data Models (SeaORM)

```rust
// crates/miyabi-business-api/src/models/product.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "products")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub price: Decimal,
    pub category: Option<String>,
    pub status: String,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::order::Entity")]
    Orders,
}

impl Related<super::order::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Orders.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
```

```rust
// crates/miyabi-business-api/src/models/ai_job.rs
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "ai_jobs")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub job_type: String,
    pub input_data: Json,
    pub output_data: Option<Json>,
    pub status: String,
    pub agent_id: Option<i32>,
    pub error_message: Option<String>,
    pub started_at: Option<DateTime>,
    pub completed_at: Option<DateTime>,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

### Composite State Model

```rust
// crates/miyabi-composite-state/src/manager.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompositeServiceState {
    pub agent_state: AgentState,
    pub business_state: BusinessState,
    pub user_state: UserState,
    pub aws_state: AwsState,
    pub last_updated: DateTime<Utc>,
    pub version: u64,
}

pub struct CompositeStateManager {
    state: Arc<RwLock<CompositeServiceState>>,
    db: DatabaseConnection,
    github_client: Arc<GitHubClient>,
    aws_client: Arc<AwsClient>,
}

impl CompositeStateManager {
    pub async fn new(
        db: DatabaseConnection,
        github_client: Arc<GitHubClient>,
        aws_client: Arc<AwsClient>,
    ) -> Result<Self> {
        let initial_state = Self::load_initial_state(&db, &github_client, &aws_client).await?;

        Ok(Self {
            state: Arc::new(RwLock::new(initial_state)),
            db,
            github_client,
            aws_client,
        })
    }

    pub async fn get_state(&self) -> CompositeServiceState {
        self.state.read().await.clone()
    }

    pub async fn update_agent_state(&self, agent_state: AgentState) -> Result<()> {
        let mut state = self.state.write().await;
        state.agent_state = agent_state;
        state.version += 1;
        state.last_updated = Utc::now();
        Ok(())
    }

    pub async fn update_business_state(&self) -> Result<()> {
        // Fetch from PostgreSQL
        let products = self.fetch_products().await?;
        let orders = self.fetch_orders().await?;
        let ai_jobs = self.fetch_ai_jobs().await?;
        let payments = self.fetch_payments().await?;

        let mut state = self.state.write().await;
        state.business_state = BusinessState {
            products,
            orders,
            ai_jobs,
            payments,
            approvals: vec![],
        };
        state.version += 1;
        state.last_updated = Utc::now();

        Ok(())
    }

    pub async fn sync_all(&self) -> Result<()> {
        // Sync from all sources
        self.update_agent_state(self.fetch_agent_state().await?).await?;
        self.update_business_state().await?;
        self.update_aws_state(self.fetch_aws_state().await?).await?;

        Ok(())
    }
}
```

---

## 🔄 API Migration Plan

### NestJS → Rust Axum Endpoint Mapping

| NestJS Endpoint | Method | Rust Axum Endpoint | Crate | Status |
|----------------|--------|-------------------|-------|--------|
| `/api/products` | GET | `/api/v1/products` | `miyabi-business-api` | 📋 Planned |
| `/api/products` | POST | `/api/v1/products` | `miyabi-business-api` | 📋 Planned |
| `/api/products/:id` | GET | `/api/v1/products/:id` | `miyabi-business-api` | 📋 Planned |
| `/api/products/:id` | PUT | `/api/v1/products/:id` | `miyabi-business-api` | 📋 Planned |
| `/api/products/:id` | DELETE | `/api/v1/products/:id` | `miyabi-business-api` | 📋 Planned |
| `/api/orders` | GET | `/api/v1/orders` | `miyabi-business-api` | 📋 Planned |
| `/api/orders` | POST | `/api/v1/orders` | `miyabi-business-api` | 📋 Planned |
| `/api/ai/generate` | POST | `/api/v1/ai/generate` | `miyabi-business-api` | 📋 Planned |
| `/api/payments` | POST | `/api/v1/payments` | `miyabi-business-api` | 📋 Planned |
| `/api/approvals` | GET | `/api/v1/approvals` | `miyabi-business-api` | 📋 Planned |
| `/api/auth/login` | POST | `/api/v1/auth/login` | `miyabi-web-api` | 📋 Planned |
| `/api/auth/refresh` | POST | `/api/v1/auth/refresh` | `miyabi-web-api` | 📋 Planned |

### Example: Product CRUD Endpoint

```rust
// crates/miyabi-business-api/src/routes/products.rs
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{models::product, services::product_service::ProductService};

#[derive(Debug, Deserialize)]
pub struct ListProductsQuery {
    pub category: Option<String>,
    pub status: Option<String>,
    pub limit: Option<u64>,
    pub offset: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct ProductResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub price: String,
    pub category: Option<String>,
    pub status: String,
}

impl From<product::Model> for ProductResponse {
    fn from(model: product::Model) -> Self {
        Self {
            id: model.id,
            name: model.name,
            description: model.description,
            price: model.price.to_string(),
            category: model.category,
            status: model.status,
        }
    }
}

// GET /api/v1/products
pub async fn list_products(
    State(service): State<ProductService>,
    Query(query): Query<ListProductsQuery>,
) -> Result<Json<Vec<ProductResponse>>, AppError> {
    let products = service.list_products(query).await?;
    let response = products.into_iter().map(ProductResponse::from).collect();
    Ok(Json(response))
}

// POST /api/v1/products
pub async fn create_product(
    State(service): State<ProductService>,
    Json(payload): Json<CreateProductRequest>,
) -> Result<(StatusCode, Json<ProductResponse>), AppError> {
    let product = service.create_product(payload).await?;
    Ok((StatusCode::CREATED, Json(product.into())))
}

// GET /api/v1/products/:id
pub async fn get_product(
    State(service): State<ProductService>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProductResponse>, AppError> {
    let product = service.get_product(id).await?;
    Ok(Json(product.into()))
}

// PUT /api/v1/products/:id
pub async fn update_product(
    State(service): State<ProductService>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateProductRequest>,
) -> Result<Json<ProductResponse>, AppError> {
    let product = service.update_product(id, payload).await?;
    Ok(Json(product.into()))
}

// DELETE /api/v1/products/:id
pub async fn delete_product(
    State(service): State<ProductService>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    service.delete_product(id).await?;
    Ok(StatusCode::NO_CONTENT)
}
```

---

## 🤖 Business Agents Integration

### 5 New Business Agents

#### Agent 201: CourseGeneratorAgent

```rust
// crates/miyabi-business-api/src/agents/course_generator.rs
use miyabi_agent_core::{Agent, AgentResult, Task};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct CourseGeneratorAgent {
    id: u32,
    llm_client: Arc<LlmClient>,
    db: DatabaseConnection,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CourseGenerationRequest {
    pub topic: String,
    pub difficulty: String,
    pub duration_weeks: u32,
    pub target_audience: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CourseContent {
    pub title: String,
    pub description: String,
    pub modules: Vec<Module>,
    pub assessments: Vec<Assessment>,
}

impl Agent for CourseGeneratorAgent {
    fn id(&self) -> u32 {
        201
    }

    fn name(&self) -> &str {
        "CourseGeneratorAgent"
    }

    async fn execute(&self, task: Task) -> AgentResult {
        // 1. Parse request
        let request: CourseGenerationRequest = serde_json::from_value(task.input)?;

        // 2. Generate course outline via LLM
        let outline = self.generate_course_outline(&request).await?;

        // 3. Generate detailed content for each module
        let modules = self.generate_module_content(&outline).await?;

        // 4. Create assessments
        let assessments = self.generate_assessments(&outline).await?;

        // 5. Store in database
        let job_id = self.save_ai_job(&request, &modules).await?;

        // 6. Return result
        Ok(AgentResult {
            status: "completed".to_string(),
            output: serde_json::to_value(CourseContent {
                title: outline.title,
                description: outline.description,
                modules,
                assessments,
            })?,
            metadata: serde_json::json!({
                "job_id": job_id,
                "agent_id": 201,
            }),
        })
    }
}
```

#### Agent 202: DocumentGeneratorAgent

Similar structure to CourseGeneratorAgent, but focused on business document generation (proposals, contracts, reports).

#### Agent 203: ContentSearchAgent

RAG-based semantic search agent using Qdrant + OpenAI embeddings.

#### Agent 204: PaymentProcessorAgent

Stripe integration for payment processing.

#### Agent 205: ApprovalWorkflowAgent

Multi-stage approval workflow with Slack/Discord notifications.

---

## 🔐 Authentication & Authorization

### JWT-based Authentication

```rust
// crates/miyabi-web-api/src/auth/jwt.rs
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // user_id
    pub email: String,
    pub role: String,
    pub exp: u64,
    pub iat: u64,
}

pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(secret: &str) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret.as_bytes()),
            decoding_key: DecodingKey::from_secret(secret.as_bytes()),
        }
    }

    pub fn generate_token(&self, user_id: &str, email: &str, role: &str) -> Result<String> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs();

        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            role: role.to_string(),
            iat: now,
            exp: now + 3600 * 24, // 24 hours
        };

        encode(&Header::default(), &claims, &self.encoding_key)
            .map_err(Into::into)
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        decode::<Claims>(token, &self.decoding_key, &Validation::default())
            .map(|data| data.claims)
            .map_err(Into::into)
    }
}
```

### RBAC Middleware

```rust
// crates/miyabi-web-api/src/auth/middleware.rs
use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};

pub async fn require_auth(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];
    let jwt_service = request.extensions().get::<JwtService>()
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

    let claims = jwt_service
        .verify_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Insert claims into request extensions
    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}

pub async fn require_admin(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let claims = request.extensions().get::<Claims>()
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if claims.role != "admin" {
        return Err(StatusCode::FORBIDDEN);
    }

    Ok(next.run(request).await)
}
```

---

## 🔄 Real-time Updates (WebSocket)

### WebSocket Handler

```rust
// crates/miyabi-web-api/src/websocket/handler.rs
use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
};
use futures::{SinkExt, StreamExt};
use tokio::sync::broadcast;

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.broadcast_tx.subscribe();

    // Send initial state
    let initial_state = state.composite_state_manager.get_state().await;
    let msg = serde_json::to_string(&initial_state).unwrap();
    let _ = sender.send(Message::Text(msg)).await;

    // Listen for updates
    tokio::spawn(async move {
        while let Ok(update) = rx.recv().await {
            let msg = serde_json::to_string(&update).unwrap();
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages
    while let Some(Ok(msg)) = receiver.next().await {
        // Handle client messages if needed
    }
}
```

---

## 📊 Database Migration Strategy

### Phase 1: Schema Setup

```bash
# Create PostgreSQL database
createdb miyabi_dev

# Run migrations
sea-orm-cli migrate up

# Seed initial data
cargo run --bin seed_database
```

### Phase 2: Data Migration

```rust
// Migration script: Prisma → SeaORM
async fn migrate_data() -> Result<()> {
    // 1. Export data from Prisma
    let prisma_data = export_prisma_data().await?;

    // 2. Transform to SeaORM models
    let seaorm_models = transform_data(prisma_data)?;

    // 3. Import to PostgreSQL via SeaORM
    import_to_seaorm(seaorm_models).await?;

    Ok(())
}
```

---

## 📈 Performance Optimization

### Caching Strategy

```rust
// Redis caching for frequently accessed data
use redis::AsyncCommands;

pub struct CacheService {
    redis: redis::Client,
}

impl CacheService {
    pub async fn get_product(&self, id: Uuid) -> Result<Option<Product>> {
        let key = format!("product:{}", id);
        let mut conn = self.redis.get_async_connection().await?;
        let cached: Option<String> = conn.get(&key).await?;

        if let Some(json) = cached {
            let product = serde_json::from_str(&json)?;
            return Ok(Some(product));
        }

        Ok(None)
    }

    pub async fn set_product(&self, product: &Product) -> Result<()> {
        let key = format!("product:{}", product.id);
        let json = serde_json::to_string(product)?;
        let mut conn = self.redis.get_async_connection().await?;
        conn.set_ex(&key, json, 300).await?; // 5 min TTL
        Ok(())
    }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_product() {
        let db = setup_test_db().await;
        let service = ProductService::new(db);

        let request = CreateProductRequest {
            name: "Test Product".to_string(),
            price: Decimal::from_str("99.99").unwrap(),
            ..Default::default()
        };

        let result = service.create_product(request).await;
        assert!(result.is_ok());
    }
}
```

### Integration Tests

```rust
#[tokio::test]
async fn test_end_to_end_order_flow() {
    // 1. Create product
    // 2. Create order
    // 3. Process payment
    // 4. Verify order status
}
```

---

## 🚀 Deployment Strategy

### Docker Compose (Development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: miyabi_dev
      POSTGRES_USER: miyabi
      POSTGRES_PASSWORD: miyabi_password
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  miyabi-api:
    build: .
    environment:
      DATABASE_URL: postgresql://miyabi:miyabi_password@postgres:5432/miyabi_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_key
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
```

### AWS Deployment (Production)

```
ECS Fargate
    ├── Task Definition: miyabi-api
    ├── Service: miyabi-web-service
    │   ├── Desired Count: 2
    │   └── Load Balancer: ALB
    └── Environment:
        ├── DATABASE_URL (from Secrets Manager)
        ├── REDIS_URL (ElastiCache)
        └── JWT_SECRET (from Secrets Manager)
```

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Latency (p95) | <100ms | CloudWatch |
| Database Query Time | <50ms | SeaORM metrics |
| WebSocket Latency | <50ms | Custom metrics |
| Error Rate | <1% | Logging |
| Test Coverage | >80% | cargo tarpaulin |

---

## 🔗 Related Documentation

- `.ai/plans/THE_PANTHEON_REQUIREMENTS.md`
- `.claude/context/aifactory-integration.md`
- `docs/planning/AIFACTORY_MIYABI_INTEGRATION_PLAN.md`

---

**Status**: 🟢 Architecture Complete - Ready for Implementation

**Next Steps**:
1. Review architecture with team
2. Create `miyabi-business-api` crate
3. Create `miyabi-composite-state` crate
4. Setup PostgreSQL database
5. Begin endpoint migration

**Last Updated**: 2025-11-12
**Maintained By**: Miyabi Team
