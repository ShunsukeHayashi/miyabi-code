# AIfactory Integration Context

**Version**: 1.0.0
**Priority**: ⭐⭐⭐⭐
**Category**: Integration
**Status**: 📋 Planning Phase

---

## 🎯 Purpose

This module provides context for integrating **AIfactory** (TypeScript Web Application) into **Miyabi** (Rust Agent Operating System).

## 📊 Quick Reference

### Source System (AIfactory)

**Location**: `/Users/shunsuke/Dev/AIfactory`
**Tech Stack**: React 18 + TypeScript + NestJS + AWS
**Status**: 📊 65/100 (B-) - Recovery Mode

**Key Components**:
- Frontend: 17 React components + 6 services (1,581 LOC)
- Backend: NestJS (81 files) + Prisma ORM
- Infrastructure: AWS (ECS/RDS/S3) + Vercel

### Target System (Miyabi)

**Location**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private`
**Tech Stack**: Rust 2021 + Cargo Workspace + tmux
**Architecture**: 24 Agents + Git Worktree orchestration

**Integration Points**:
- `miyabi-web-api` - Axum REST API
- `miyabi-a2a` - Agent-to-Agent communication
- `miyabi-types` - Shared type definitions
- `miyabi-business-api` - 🆕 New crate for business logic

## 🏗️ Architecture Pattern

### Unified Backend with Dual Frontends

```
┌─────────────────────────────────────────┐
│  AIfactory UI (React) + Miyabi CLI      │
│             ↓ WebSocket + REST          │
│      Miyabi Unified Web API (Rust)      │
│             ↓ State Management          │
│      Composite State Manager            │
│  - AgentState (A2A storage)             │
│  - BusinessState (PostgreSQL)           │
│  - UserState (memory)                   │
└─────────────────────────────────────────┘
```

**Key Decisions**:
1. ✅ Consolidate backends into single Rust API
2. ✅ Keep React UI as separate frontend
3. ✅ Use JWT for unified authentication
4. ✅ PostgreSQL for persistent business data
5. ✅ GitHub Issues for agent coordination (A2A)

## 🔑 Core Types

### Composite Service State

```rust
pub struct CompositeServiceState {
    pub agent_state: AgentState,      // Miyabi agents
    pub business_state: BusinessState, // AIfactory business
    pub user_state: UserState,         // Authentication
    pub last_updated: DateTime<Utc>,
    pub version: u64,                  // Optimistic locking
}
```

### Business State Components

```rust
pub struct BusinessState {
    pub products: Vec<Product>,        // Product catalog
    pub orders: Vec<Order>,            // Order management
    pub ai_jobs: Vec<AiJob>,           // AI generation jobs
    pub payments: Vec<Payment>,        // Payment transactions
    pub approvals: Vec<Approval>,      // Approval workflows
}
```

## 🤖 New Business Agents

Converting AIfactory services to Miyabi agents:

| AIfactory Service | → | Miyabi Agent |
|-------------------|---|--------------|
| Course Generation | → | `CourseGeneratorAgent` |
| Document Generation | → | `DocumentGeneratorAgent` |
| AI Search | → | `ContentSearchAgent` |
| Payment Processing | → | `PaymentProcessorAgent` |
| Approval Workflow | → | `ApprovalWorkflowAgent` |

**Agent Type IDs**: `201-205` (Business Agent range)

## 📋 Integration Timeline

| Phase | Duration | Milestone |
|-------|----------|-----------|
| Phase 1 | Week 1 | Foundation (crate setup, DB schema) |
| Phase 2 | Week 2-3 | API Parity (NestJS → Rust) |
| Phase 3 | Week 4 | Connected UI (React → Miyabi API) |
| Phase 4 | Week 5 | Unified Agents (Business agents) |
| Phase 5 | Week 6 | Production Ready (Tests, deploy) |

**Target Completion**: 2025-12-24 (6 weeks)

## 🔗 Related Files

**Detailed Plan**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/planning/AIFACTORY_MIYABI_INTEGRATION_PLAN.md`

**Context Modules**:
- `miyabi-definition.md` - Entity/Relation/Label system
- `agents.md` - Existing agent system
- `architecture.md` - Cargo workspace structure
- `development.md` - Rust development standards

**Agent Specs** (to be created):
- `.claude/agents/specs/business/course-generator-agent.md`
- `.claude/agents/specs/business/document-generator-agent.md`
- `.claude/agents/specs/business/content-search-agent.md`
- `.claude/agents/specs/business/payment-processor-agent.md`
- `.claude/agents/specs/business/approval-workflow-agent.md`

## 🚀 Quick Actions

### Phase 1 Start

```bash
# 1. Create new crate
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private
cargo new --lib crates/miyabi-business-api

# 2. Setup PostgreSQL
psql -U postgres -c "CREATE DATABASE miyabi_dev;"

# 3. Add composite state types
vim crates/miyabi-types/src/composite_state.rs
```

### Check Integration Status

```bash
# Check if composite_state.rs exists
ls crates/miyabi-types/src/composite_state.rs

# Check if miyabi-business-api crate exists
ls crates/miyabi-business-api/

# Check database
psql -U postgres -d miyabi_dev -c "\\dt"
```

## 📊 Success Metrics

**Technical**:
- API Latency: <100ms p95
- Test Coverage: >80% backend, >70% frontend
- Build Time: <5 minutes

**Business**:
- Order Completion Rate: >90%
- AI Job Success Rate: >95%
- User Satisfaction: NPS >50

---

**When to Use This Context**:
- Implementing AIfactory integration features
- Creating new business agents
- Working on state management
- Migrating NestJS endpoints to Rust
- Setting up integration tests

**Load Order**: After `core-rules.md` and `miyabi-definition.md`

---

**Last Updated**: 2025-11-12
**Author**: Claude Code
**Estimated Token Size**: ~600 tokens
