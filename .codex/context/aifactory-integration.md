# AIfactory Integration Context (Codex)

**Version**: 1.0.0
**Priority**: ⭐⭐⭐⭐
**Category**: Integration
**Target**: Claude Codex

---

## 🎯 Integration Mission

Integrate AIfactory TypeScript application into Miyabi Rust ecosystem to create unified AI-powered platform.

## 📊 Source → Target Mapping

### AIfactory (Source)
- **Location**: `/Users/shunsuke/Dev/AIfactory`
- **Stack**: React 18 + TypeScript + NestJS + Prisma
- **Components**: 17 UI components, 6 services (1,581 LOC), 81 backend files

### Miyabi (Target)
- **Location**: `/Users/shunsuke/Dev/miyabi-private`
- **Stack**: Rust 2021 + Axum + SQLx + tmux
- **New Crate**: `miyabi-business-api` (to be created)

## 🏗️ Architecture: Unified Backend + Dual Frontends

```
Frontend Layer:
├── AIfactory UI (React/TS) → Vercel
└── Miyabi CLI (Rust TUI) → Local

Backend Layer (Unified):
└── miyabi-web-api (Rust/Axum)
    ├── /api/auth/*        # JWT authentication
    ├── /api/products/*    # Product catalog
    ├── /api/orders/*      # Order management
    ├── /api/ai/*          # AI job execution
    └── /ws                # WebSocket for realtime

State Layer (Composite):
└── StateManager
    ├── AgentState → GitHub Issues (A2A)
    ├── BusinessState → PostgreSQL
    └── UserState → Memory

Persistence:
├── PostgreSQL (SQLx) - users, products, orders, ai_jobs
└── GitHub Issues (A2A) - agent tasks, coordination
```

## 🔑 Key Type Definitions

### Composite State (New)

```rust
// crates/miyabi-types/src/composite_state.rs

pub struct CompositeServiceState {
    pub agent_state: AgentState,
    pub business_state: BusinessState,
    pub user_state: UserState,
    pub last_updated: DateTime<Utc>,
    pub version: u64,
}

pub struct BusinessState {
    pub products: Vec<Product>,
    pub orders: Vec<Order>,
    pub ai_jobs: Vec<AiJob>,
    pub payments: Vec<Payment>,
    pub approvals: Vec<Approval>,
}

pub struct Product {
    pub id: String,
    pub name: String,
    pub description: String,
    pub price: f64,
    pub category: ProductCategory,
    pub status: ProductStatus,
    pub created_at: DateTime<Utc>,
}

pub enum ProductCategory {
    AiCourseGeneration,
    AiDocumentGeneration,
    AiSearchService,
    BusinessConsulting,
    TechnicalSupport,
}

pub struct Order {
    pub id: String,
    pub user_id: String,
    pub product_id: String,
    pub status: OrderStatus,
    pub total_amount: f64,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

pub struct AiJob {
    pub id: String,
    pub job_type: AiJobType,
    pub user_id: String,
    pub status: AiJobStatus,
    pub input_params: serde_json::Value,
    pub output_data: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}
```

## 🤖 New Business Agents (5 Agents)

### Agent Mapping

| ID | Agent | Description | Priority |
|----|-------|-------------|----------|
| 201 | CourseGeneratorAgent | AI course generation using LLM | P0 |
| 202 | DocumentGeneratorAgent | AI document generation | P0 |
| 203 | ContentSearchAgent | AI-powered semantic search | P1 |
| 204 | PaymentProcessorAgent | Payment transaction handling | P0 |
| 205 | ApprovalWorkflowAgent | Multi-stage approval management | P1 |

### Implementation Template

```rust
// crates/miyabi-agent-business/src/course_generator.rs

use miyabi_types::{Agent, AgentType, Task, AgentResult};

pub struct CourseGeneratorAgent {
    llm_provider: Arc<dyn LlmProvider>,
    state_manager: Arc<StateManager>,
}

impl Agent for CourseGeneratorAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CourseGeneratorAgent
    }

    async fn execute(&self, task: Task) -> Result<AgentResult, AgentError> {
        // 1. Parse request
        let request: CourseGenerationRequest =
            serde_json::from_value(task.metadata.unwrap())?;

        // 2. Generate outline
        let outline = self.generate_outline(&request).await?;

        // 3. Generate content per section
        let content = self.generate_content(&outline).await?;

        // 4. Store in database
        self.store_course(&content).await?;

        // 5. Update state
        self.state_manager.update_business_state(|state| {
            state.ai_jobs.push(AiJob {
                id: task.id.clone(),
                job_type: AiJobType::CourseGeneration,
                status: AiJobStatus::Completed,
                output_data: Some(serde_json::to_value(&content)?),
                completed_at: Some(Utc::now()),
                ..Default::default()
            });
        }).await?;

        Ok(AgentResult::success())
    }
}
```

## 📋 Phase Implementation Checklist

### Phase 1: Foundation (Week 1)

- [ ] Create `miyabi-business-api` crate
- [ ] Add to workspace `Cargo.toml`
- [ ] Define `CompositeServiceState` in `miyabi-types`
- [ ] Setup PostgreSQL schema (users, products, orders, ai_jobs)
- [ ] Implement `StateManager` with RwLock
- [ ] Write initial integration tests

### Phase 2: API Migration (Week 2-3)

- [ ] Migrate auth: JWT generation + validation middleware
- [ ] Migrate products: CRUD endpoints + search
- [ ] Migrate orders: Create, update, tracking
- [ ] Migrate AI services: Job queue + status tracking
- [ ] Integrate with `miyabi-llm` for Claude API
- [ ] Add WebSocket for realtime updates

### Phase 3: Frontend Integration (Week 4)

- [ ] Update AIfactory API client base URL
- [ ] Remove Cognito SDK, use JWT tokens
- [ ] Update all service calls to new endpoints
- [ ] Add WebSocket client for realtime updates
- [ ] Deploy frontend to Vercel
- [ ] Configure CORS in Rust API

### Phase 4: Agent Integration (Week 5)

- [ ] Define 5 new agent types in `miyabi-types`
- [ ] Implement CourseGeneratorAgent
- [ ] Implement DocumentGeneratorAgent
- [ ] Implement ContentSearchAgent
- [ ] Implement PaymentProcessorAgent
- [ ] Implement ApprovalWorkflowAgent
- [ ] Register agents in orchestrator
- [ ] Add agent routing logic

### Phase 5: Testing & Deployment (Week 6)

- [ ] Integration tests: API endpoints (>80% coverage)
- [ ] Integration tests: State manager
- [ ] Integration tests: Business agents
- [ ] E2E tests: User flows (Playwright)
- [ ] Load testing: 1000 concurrent users
- [ ] Deploy Rust API to Cloud Run
- [ ] Deploy React UI to Vercel
- [ ] Monitor production metrics

## 🗄️ Database Schema

```sql
-- PostgreSQL schema for business data

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    cognito_sub VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    input_params JSONB NOT NULL,
    output_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_ai_jobs_user_id ON ai_jobs(user_id);
CREATE INDEX idx_ai_jobs_status ON ai_jobs(status);
```

## 📊 Success Metrics

### Technical Targets
- API Latency: p95 <100ms, p99 <200ms
- Test Coverage: Backend >80%, Frontend >70%
- Build Time: Full build <5 minutes
- Deployment Time: <10 minutes

### Business Targets
- Order Completion Rate: >90%
- AI Job Success Rate: >95%
- Payment Success Rate: >99%
- User Satisfaction: NPS >50

## 🔗 Related Documentation

**Detailed Plan**: `/Users/shunsuke/Dev/miyabi-private/docs/planning/AIFACTORY_MIYABI_INTEGRATION_PLAN.md`

**Context Modules**:
- `.codex/context/core-rules.md`
- `.codex/context/miyabi-definition.md`
- `.codex/context/agents.md`

**Agent Specs** (to be created):
- `.codex/agents/specs/business/course-generator-agent.md`
- `.codex/agents/specs/business/document-generator-agent.md`
- `.codex/agents/specs/business/content-search-agent.md`
- `.codex/agents/specs/business/payment-processor-agent.md`
- `.codex/agents/specs/business/approval-workflow-agent.md`

---

**Target Completion**: 2025-12-24 (6 weeks)
**Status**: 📋 Planning → Ready for Phase 1
**Last Updated**: 2025-11-12
