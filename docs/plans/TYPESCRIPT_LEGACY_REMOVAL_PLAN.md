# TypeScript Legacy Code Removal Plan

**Document Version**: 1.0.0
**Created**: 2025-10-24
**Issue**: #447 [P1-004] TypeScript Legacy Code Removal Planning
**Milestone**: Week 12 - MVP Launch
**Priority**: P1-High
**Estimated Effort**: 8-12 weeks (phased approach)

---

## Executive Summary

This document outlines a comprehensive plan to remove TypeScript legacy code from the Miyabi project, transitioning to a fully Rust-based architecture. The project currently contains **367 TypeScript files** (excluding node_modules/dist/target), of which **173 files are already archived** and **194 files remain actively used**.

### Key Metrics

| Metric | Count | Status |
|--------|-------|--------|
| Total TypeScript files | 367 | Active analysis |
| Already archived | 173 | ✅ Phase 0 complete |
| Active scripts | 75 | 🔄 Migration required |
| API backend | 12 | 🔄 Migration required |
| Test files | 34 | 🔄 Migration required |
| Web UI (miyabi-web) | 45 | ⚠️ Keep (Next.js) |
| A2A Dashboard | 48 | ⚠️ Keep (React) |
| MCP Servers | 0 | ✅ Already Rust |

### Strategic Decision

**Frontend Code**: Keep TypeScript/TSX for web UI (Next.js, React)
**Backend/CLI/Scripts**: Migrate all to Rust
**Target Date**: Q1 2026 (12 weeks)

---

## 1. File Inventory and Categorization

### 1.1 Already Archived (Phase 0 Complete) ✅

**Location**: `/archive/typescript-legacy/`
**Files**: 173 TypeScript files
**Status**: Successfully moved to archive during crate consolidation

**Packages archived**:
- `packages/business-agents/` - Migrated to `crates/miyabi-agent-business/`
- `packages/cli/` - Migrated to `crates/miyabi-cli/`
- `packages/coding-agents/` - Migrated to `crates/miyabi-agents/`
- `packages/context-engineering/` - Migrated to `mcp-servers/context-engineering/`
- `packages/core/` - Migrated to `crates/miyabi-core/`
- `packages/doc-generator/` - Migrated to `crates/miyabi-cli/` subcommands
- `packages/github-projects/` - Migrated to `crates/miyabi-github/`
- `packages/miyabi-agent-sdk/` - Migrated to `crates/miyabi-agent-core/`
- `packages/shared-utils/` - Migrated to `crates/miyabi-core/`

**Action Required**: None (cleanup only)

### 1.2 Active Scripts (Priority: HIGH)

**Location**: `/scripts/`
**Files**: 75 TypeScript files
**Size**: 1.1 MB
**Dependencies**: Used by GitHub Actions workflows

#### Subcategories:

##### A. GitHub Integration Scripts (11 files)
```
scripts/github/
├── ai-label-issue.ts              → crates/miyabi-cli (label command)
├── auto-convert-ideas.ts          → crates/miyabi-cli (discussion command)
├── convert-idea-to-issue.ts       → crates/miyabi-cli (discussion command)
├── discussion-bot.ts              → crates/miyabi-webhook (webhook handler)
├── discussion-digest.ts           → crates/miyabi-cli (reporting command)
├── github-project-api.ts          → crates/miyabi-github (API layer)
├── knowledge-base-sync.ts         → crates/miyabi-knowledge (sync module)
└── projects-graphql.ts            → crates/miyabi-github (GraphQL client)
```

**Migration Status**:
- ✅ `miyabi-cli label` - AI label inference already implemented
- ✅ `miyabi-github` - GraphQL and REST API wrappers exist
- 🔄 Discussion bot - needs webhook handler implementation
- 🔄 Knowledge base sync - partially implemented

**Used in CI/CD**:
- `.github/workflows/ai-auto-label.yml` - Uses `ai-label-issue.ts`
- `.github/workflows/discussion-bot.yml` - Uses `discussion-bot.ts`, `convert-idea-to-issue.ts`, `auto-convert-ideas.ts`
- `.github/workflows/discussion-digest.yml` - Uses `discussion-digest.ts`

##### B. Operations Scripts (13 files)
```
scripts/operations/
├── agentic.ts                     → DEPRECATED (use miyabi-cli)
├── benchmark-agents.ts            → crates/miyabi-benchmark
├── check-status.ts                → crates/miyabi-cli (status command)
├── demo-rich-cli.ts               → DEMO ONLY (remove)
├── execute-task.ts                → DEPRECATED (use miyabi-cli agent execute)
├── github-token-helper.ts         → crates/miyabi-cli (auth command)
├── label-state-machine.ts         → crates/miyabi-github (label module)
├── parallel-agent-runner.ts       → crates/miyabi-worktree (parallel execution)
├── parallel-executor.ts           → crates/miyabi-worktree
├── task-grouper.ts                → crates/miyabi-orchestrator
├── task-tool-executor.ts          → crates/miyabi-orchestrator
├── verify-agents.ts               → crates/miyabi-cli (verify command)
└── workflow-orchestrator.ts       → crates/miyabi-orchestrator
```

**Migration Status**:
- ✅ Core CLI commands already exist in `miyabi-cli`
- ✅ Worktree parallel execution implemented
- ✅ Orchestrator task scheduling implemented
- 🔄 Demo scripts can be removed
- 🔄 Some helper scripts need porting

##### C. Reporting Scripts (13 files)
```
scripts/reporting/
├── dashboard-events.ts            → crates/miyabi-a2a (SSE/WebSocket)
├── doc-generator.ts               → crates/miyabi-cli (docs generate)
├── generate-dashboard-data.ts     → crates/miyabi-a2a (data generation)
├── generate-demo.ts               → DEMO ONLY (remove)
├── generate-demo.test.ts          → DEMO ONLY (remove)
├── generate-realtime-metrics.ts   → crates/miyabi-orchestrator (metrics)
├── generate-session-graph.ts      → crates/miyabi-cli (report command)
├── generate-weekly-report.ts      → crates/miyabi-cli (report command)
├── performance-report.ts          → crates/miyabi-benchmark (perf module)
├── training-material-generator.ts → DEPRECATED (remove)
├── update-readme-with-demos.ts    → Shell script alternative
└── update-readme-with-demos.test.ts → Shell script alternative
```

**Migration Status**:
- ✅ Documentation generation exists in `miyabi-cli docs`
- ✅ Metrics collection in `miyabi-orchestrator`
- 🔄 Dashboard data generation needs Rust implementation
- ❌ Demo/training scripts can be removed

##### D. Security Scripts (3 files)
```
scripts/security/
├── security-manager.ts            → crates/miyabi-cli (security command)
├── security-report.ts             → crates/miyabi-cli (security command)
└── webhook-security.ts            → crates/miyabi-webhook (security module)
```

**Migration Status**:
- 🔄 Security scanning needs full Rust implementation
- 🔄 SBOM generation can use cargo-sbom
- 🔄 Secret scanning can use cargo-deny + gitleaks

**Used in CI/CD**:
- `.github/workflows/security-audit.yml` - Uses all 3 security scripts

##### E. Setup Scripts (7 files)
```
scripts/setup/
├── github-token-helper.ts         → crates/miyabi-cli (auth command)
├── local-env-collector.ts         → crates/miyabi-cli (init command)
├── parallel-checks.ts             → Shell script
├── register-claude-plugin.ts      → Shell script
├── setup-agentic-os.ts            → crates/miyabi-cli (setup command)
├── setup-github-project.ts        → crates/miyabi-cli (init command)
└── setup-github-token.ts          → crates/miyabi-cli (auth command)
```

**Migration Status**:
- ✅ Most setup logic exists in `miyabi-cli init/setup/auth`
- 🔄 Environment collection can be enhanced
- ✅ GitHub project setup partially implemented

##### F. Integration Test Scripts (10 files)
```
scripts/integrated/
├── demo-feedback-loop.ts          → crates/miyabi-orchestrator (tests)
├── integrated-demo-simple.ts      → Integration test
├── integrated-system.ts           → Integration test
├── issue-99-execution.ts          → Historical (remove)
├── issue-100-execution.ts         → Historical (remove)
├── issue-101-execution.ts         → Historical (remove)
├── issue-102-execution.ts         → Historical (remove)
├── test-metrics-collector.ts      → crates/miyabi-orchestrator (tests)
├── test-parallel-execution.ts     → crates/miyabi-worktree (tests)
├── test-water-spider.ts           → crates/miyabi-orchestrator (tests)
└── test-worktree-manager.ts       → crates/miyabi-worktree (tests)
```

**Migration Status**:
- ❌ Historical issue execution scripts - REMOVE
- 🔄 Test scripts should become Rust integration tests
- ✅ Core functionality already tested in Rust

##### G. Tool Scripts (9 files)
```
scripts/tools/
├── claude-headless-example.ts     → DEMO ONLY (remove)
├── claude-headless.ts             → External tool (keep or remove)
├── claude-parallel-demo.ts        → DEMO ONLY (remove)
├── generate-i2v.ts                → External API wrapper (evaluate)
├── generate-image.ts              → External API wrapper (evaluate)
├── generate-speech.ts             → External API wrapper (evaluate)
├── generate-video.ts              → External API wrapper (evaluate)
├── get-claude-token.ts            → crates/miyabi-cli (auth)
```

**Migration Status**:
- ❌ Demo scripts - REMOVE
- ⚠️ Media generation scripts - EVALUATE (out of scope?)
- 🔄 Token helper - migrate to CLI

##### H. Miscellaneous Scripts (9 files)
```
scripts/
├── cicd/cicd-integration.ts       → GitHub Actions native
├── cicd/performance-optimizer.ts  → crates/miyabi-benchmark
├── cicd/webhook-router.ts         → crates/miyabi-webhook
├── migration/* (4 files)          → Historical (remove after validation)
├── local-env-collector.ts         → crates/miyabi-cli (init)
├── projects-graphql.ts            → crates/miyabi-github
├── upload-to-portal.ts            → Shell script or remove
├── water-spider-main.ts           → crates/miyabi-orchestrator
└── webhook/webhook-server.ts      → crates/miyabi-webhook
```

### 1.3 API Backend (Priority: MEDIUM)

**Location**: `/api/`
**Files**: 12 TypeScript files
**Size**: 104 KB
**Purpose**: Marketplace API backend (Express.js)

```
api/
├── index.ts                       → crates/miyabi-web-api (Axum/Actix)
├── lib/types.ts                   → crates/miyabi-types
├── middleware/auth.ts             → crates/miyabi-web-api (auth middleware)
├── middleware/rate-limit.ts       → crates/miyabi-web-api (rate limiter)
├── routes/auth.ts                 → crates/miyabi-web-api (auth routes)
├── routes/licenses.ts             → crates/miyabi-web-api (license routes)
├── routes/marketplace.ts          → crates/miyabi-web-api (marketplace routes)
├── routes/usage.ts                → crates/miyabi-web-api (usage routes)
├── services/license-manager.ts    → crates/miyabi-web-api (license service)
├── services/usage-tracker.ts      → crates/miyabi-web-api (usage service)
├── services/user-service.ts       → crates/miyabi-web-api (user service)
└── test-auth-server.ts            → Test script (remove after migration)
```

**Migration Status**:
- ✅ `crates/miyabi-web-api` exists with Axum framework
- 🔄 Express.js → Axum migration needed
- 🔄 JWT auth, rate limiting, CORS middleware needed
- 🔄 Supabase client integration needed
- 🔄 Stripe payment integration needed

**Dependencies**:
- Express.js → Axum (Rust web framework)
- Supabase client → reqwest + PostgreSQL client
- Stripe API → stripe-rust crate
- JWT → jsonwebtoken crate
- Redis rate limiting → redis-rs crate

### 1.4 Test Files (Priority: LOW-MEDIUM)

**Location**: `/tests/`
**Files**: 34 TypeScript files
**Size**: 416 KB
**Purpose**: Unit tests and E2E tests

```
tests/
├── BaseAgent.test.ts              → Rust unit tests (in crates)
├── CodeGenAgent.test.ts           → crates/miyabi-agent-codegen/tests/
├── DAGManager.test.ts             → crates/miyabi-orchestrator/tests/
├── ReviewAgent.test.ts            → crates/miyabi-agent-review/tests/
├── SecurityScanner.test.ts        → crates/miyabi-cli/tests/
├── agent-verification.test.ts     → crates/miyabi-agents/tests/
├── coordinator.test.ts            → crates/miyabi-agent-coordinator/tests/
├── coordinator/task-scheduler.test.ts → crates/miyabi-orchestrator/tests/
├── agents/FileMigrationAgent.test.ts → Historical (remove)
└── e2e/* (3 Playwright tests)     → Keep (Web UI E2E)
```

**Migration Status**:
- ✅ Most agent unit tests already exist in Rust crates
- 🔄 Some integration tests need porting
- ✅ E2E tests for Web UI should remain (Playwright/TypeScript)

**E2E Tests to Keep**:
- `tests/e2e/demo/dashboard-quick-check.spec.ts` - Dashboard smoke test
- `tests/e2e/demo/dashboard-ui-ux.spec.ts` - Dashboard UX test
- `tests/e2e/demo/miyabi-demo.spec.ts` - Full demo test
- `tests/e2e/workflow.test.ts` - Workflow editor test

### 1.5 Web UI - Keep (Next.js)

**Location**: `/miyabi-web/`
**Files**: 45 TypeScript/TSX files
**Purpose**: Next.js web application (no-code UI)
**Decision**: **KEEP** - Modern React/Next.js frontend

**Rationale**:
- Next.js provides best-in-class React framework
- TypeScript is industry standard for web frontends
- No benefit from Rust migration (WASM overkill for this use case)
- Existing shadcn/ui components work perfectly

### 1.6 A2A Dashboard - Keep (React + Vite)

**Location**: `/crates/miyabi-a2a/dashboard/`
**Files**: 48 TypeScript/TSX files
**Purpose**: Real-time agent monitoring dashboard
**Decision**: **KEEP** - React + Vite SPA

**Rationale**:
- Real-time WebSocket visualization requires React
- Vite provides excellent DX
- Dashboard is production-ready
- Migration to Rust WASM not justified

### 1.7 External Tools (Priority: LOW)

**Location**: `/external/`
**Files**: 2 TypeScript files
**Size**: 24 KB

```
external/
├── scripts/integrate-with-agent.ts → Evaluate necessity
└── tools/example-fetcher.ts        → Evaluate necessity
```

**Action**: Review and remove if unused

---

## 2. Migration Status - Rust Equivalents

### 2.1 Fully Migrated ✅

| TypeScript Package | Rust Crate | Status |
|-------------------|------------|--------|
| `packages/core/` | `crates/miyabi-core/` | ✅ Complete |
| `packages/miyabi-agent-sdk/` | `crates/miyabi-agent-core/` | ✅ Complete |
| `packages/coding-agents/coordinator` | `crates/miyabi-agent-coordinator/` | ✅ Complete |
| `packages/coding-agents/codegen` | `crates/miyabi-agent-codegen/` | ✅ Complete |
| `packages/coding-agents/review` | `crates/miyabi-agent-review/` | ✅ Complete |
| `packages/business-agents/` | `crates/miyabi-agent-business/` | ✅ Complete |
| `packages/github-projects/` | `crates/miyabi-github/` | ✅ Complete |
| `packages/shared-utils/` | `crates/miyabi-core/` | ✅ Complete |
| `packages/cli/` (core) | `crates/miyabi-cli/` | ✅ Complete |

**Total Lines Migrated**: ~30,000+ lines (from Phase 1-3 consolidation)

### 2.2 Partially Migrated 🔄

| Functionality | TS Location | Rust Location | Missing Features |
|--------------|-------------|---------------|-----------------|
| CLI commands | `packages/cli/` | `crates/miyabi-cli/` | Some subcommands (report, security) |
| GitHub webhooks | `scripts/webhook/` | `crates/miyabi-webhook/` | Discussion bot handler |
| Security scanning | `scripts/security/` | `crates/miyabi-cli/` | Full audit suite |
| Knowledge sync | `scripts/github/knowledge-base-sync.ts` | `crates/miyabi-knowledge/` | Auto-sync daemon |
| Metrics collection | `scripts/reporting/` | `crates/miyabi-orchestrator/` | Dashboard data generation |

### 2.3 Not Yet Migrated ❌

| Functionality | TS Location | Target Rust Crate | Priority |
|--------------|-------------|-------------------|----------|
| Discussion bot | `scripts/github/discussion-bot.ts` | `crates/miyabi-webhook/` | HIGH |
| Discussion digest | `scripts/github/discussion-digest.ts` | `crates/miyabi-cli/` | MEDIUM |
| Security audit | `scripts/security/security-manager.ts` | `crates/miyabi-cli/` | HIGH |
| CICD webhook router | `scripts/cicd/webhook-router.ts` | `crates/miyabi-webhook/` | MEDIUM |
| Marketplace API | `api/*` | `crates/miyabi-web-api/` | HIGH |

---

## 3. Dependency Analysis

### 3.1 CI/CD Dependencies

**GitHub Actions workflows depending on TypeScript scripts**:

| Workflow | Scripts Used | Migration Impact |
|----------|--------------|------------------|
| `.github/workflows/ai-auto-label.yml` | `scripts/github/ai-label-issue.ts` | Replace with `miyabi-cli label infer` |
| `.github/workflows/discussion-bot.yml` | `scripts/github/discussion-bot.ts`, `convert-idea-to-issue.ts`, `auto-convert-ideas.ts` | Needs webhook handler in `miyabi-webhook` |
| `.github/workflows/discussion-digest.yml` | `scripts/github/discussion-digest.ts` | Replace with `miyabi-cli discussion digest` |
| `.github/workflows/security-audit.yml` | `scripts/security/*.ts` (3 files) | Replace with `miyabi-cli security audit` |
| `.github/workflows/integrated-system-ci.yml` | None (uses compiled Rust binaries) | ✅ No impact |
| `.github/workflows/mcp-test.yml` | Shell scripts only | ✅ No impact |

**Migration Strategy**:
1. Implement missing CLI commands in `miyabi-cli`
2. Update GitHub Actions to use Rust binaries
3. Remove TypeScript script invocations
4. Validate all workflows pass

### 3.2 NPM Package Dependencies

**Current package.json dependencies**:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"  // Used in MCP servers
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0"  // Used to run TypeScript scripts
  }
}
```

**Post-Migration**:
- Keep `@modelcontextprotocol/sdk` for MCP server (if using Node.js)
- Remove TypeScript, tsx after script migration
- Keep Vitest for E2E tests only

### 3.3 External Service Dependencies

| Service | Current Usage | Migration Impact |
|---------|--------------|------------------|
| GitHub API | Both TS scripts + Rust crates | ✅ Rust already covers all needs |
| Anthropic API | Rust `async-openai` crate | ✅ No TS usage |
| Supabase | `api/` backend only | 🔄 Need Rust Supabase client |
| Stripe | `api/` backend only | 🔄 Use `stripe-rust` crate |
| Redis | Rate limiting in `api/` | 🔄 Use `redis-rs` crate |

---

## 4. Removal Timeline and Phases

### Phase 1: Preparation (Week 1-2)

**Goal**: Set up infrastructure and migrate critical scripts

**Tasks**:
1. ✅ Create this removal plan document
2. Implement missing CLI subcommands:
   - `miyabi-cli discussion digest`
   - `miyabi-cli security audit`
   - `miyabi-cli report weekly`
3. Implement discussion bot webhook handler in `miyabi-webhook`
4. Create shell script alternatives for simple tasks
5. Update documentation with new Rust CLI usage

**Deliverables**:
- [ ] Rust CLI feature parity with critical TS scripts
- [ ] Webhook handler for GitHub discussions
- [ ] Updated CI/CD workflow examples

### Phase 2: CI/CD Migration (Week 3-4)

**Goal**: Remove TypeScript from all GitHub Actions workflows

**Tasks**:
1. Update `.github/workflows/ai-auto-label.yml`:
   - Replace `npx tsx scripts/github/ai-label-issue.ts` → `miyabi-cli label infer`
2. Update `.github/workflows/discussion-bot.yml`:
   - Replace TS scripts → Webhook + Rust CLI
3. Update `.github/workflows/security-audit.yml`:
   - Replace `npx tsx scripts/security/*.ts` → `miyabi-cli security audit`
4. Remove `tsx` and TypeScript from CI dependencies
5. Test all workflows

**Deliverables**:
- [ ] All CI/CD workflows using Rust binaries
- [ ] No `npx tsx` invocations in workflows
- [ ] Successful CI runs

### Phase 3: API Backend Migration (Week 5-8)

**Goal**: Migrate Express.js API to Axum (Rust)

**Tasks**:
1. Implement Axum routes in `miyabi-web-api`:
   - Auth routes (JWT, OAuth)
   - License management routes
   - Marketplace CRUD routes
   - Usage tracking routes
2. Implement middleware:
   - JWT authentication
   - Rate limiting (Redis)
   - CORS configuration
   - Security headers
3. Integrate external services:
   - Supabase PostgreSQL client
   - Stripe payment integration
   - Redis caching
4. Write integration tests
5. Deploy Rust API and validate
6. Switch Next.js frontend to Rust API
7. Remove `api/` directory

**Deliverables**:
- [ ] Fully functional Axum API
- [ ] 100% feature parity with Express API
- [ ] Integration tests passing
- [ ] Production deployment successful

### Phase 4: Script Consolidation (Week 9-10)

**Goal**: Remove all remaining operational scripts

**Tasks**:
1. Remove demo/example scripts:
   - `scripts/tools/claude-*-demo.ts`
   - `scripts/operations/demo-rich-cli.ts`
   - `scripts/reporting/generate-demo.ts`
   - `scripts/integrated/demo-*.ts`
2. Remove historical execution scripts:
   - `scripts/integrated/issue-99-*.ts` (4 files)
3. Migrate remaining utility scripts:
   - `scripts/reporting/update-readme-with-demos.ts` → Shell script
   - `scripts/setup/parallel-checks.ts` → Shell script
4. Port integration test logic to Rust tests:
   - `scripts/integrated/test-*.ts` → Rust integration tests
5. Clean up `scripts/` directory

**Deliverables**:
- [ ] `scripts/` directory reduced to <10 essential scripts
- [ ] All integration tests in Rust
- [ ] Documentation updated

### Phase 5: Test Migration (Week 11)

**Goal**: Migrate unit tests, keep E2E tests

**Tasks**:
1. Verify all TS unit test coverage exists in Rust:
   - ✅ Agent tests → `crates/*/tests/`
   - ✅ DAG tests → `crates/miyabi-orchestrator/tests/`
   - ✅ GitHub tests → `crates/miyabi-github/tests/`
2. Keep Playwright E2E tests for web UI:
   - `tests/e2e/demo/*.spec.ts`
   - `tests/e2e/workflow.test.ts`
3. Remove redundant TypeScript unit tests
4. Update `package.json` test scripts

**Deliverables**:
- [ ] Only E2E tests remain in `tests/`
- [ ] All unit/integration tests in Rust crates
- [ ] Test coverage maintained or improved

### Phase 6: Final Cleanup (Week 12)

**Goal**: Remove all legacy TypeScript infrastructure

**Tasks**:
1. Delete archive directory:
   - `rm -rf archive/typescript-legacy/`
2. Delete packages directory:
   - `rm -rf packages/`
3. Clean up npm dependencies:
   - Remove TypeScript from `package.json`
   - Remove `tsx` from `package.json`
   - Keep only E2E test dependencies
4. Update `tsconfig.json` to only cover web UI + tests
5. Remove TypeScript from CI/CD:
   - `.github/workflows/*.yml` cleanup
6. Update repository README
7. Create migration announcement

**Deliverables**:
- [ ] Zero TypeScript in backend/scripts
- [ ] Only frontend TypeScript remains
- [ ] Updated documentation
- [ ] Migration announcement published

---

## 5. Risk Assessment

### 5.1 High Risk Areas 🔴

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| **CI/CD Pipeline Breakage** | Critical - blocks all deployments | - Parallel testing: Keep TS scripts until Rust equivalents validated<br>- Gradual rollout: One workflow at a time<br>- Rollback plan: Git revert ready |
| **API Backend Downtime** | High - breaks marketplace | - Blue-green deployment<br>- Load test Rust API before cutover<br>- Keep Express.js running in parallel during migration<br>- Feature flags for gradual rollout |
| **Data Loss in Migration** | Critical - customer data | - Database migration scripts tested in staging<br>- Backup all data before cutover<br>- Read-only mode during migration<br>- Rollback plan with data restore |
| **Missing Functionality** | Medium - feature gaps | - Comprehensive feature inventory (this document)<br>- Acceptance tests for all features<br>- User acceptance testing before removal |

### 5.2 Medium Risk Areas 🟡

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| **GitHub Webhook Failures** | Medium - automation stops | - Webhook replay mechanism<br>- Comprehensive error logging<br>- Monitoring alerts<br>- Manual fallback procedures |
| **Security Scanning Gaps** | Medium - vulnerability exposure | - Compare TS vs Rust scan results<br>- Use industry-standard Rust tools (cargo-audit, cargo-deny)<br>- Add third-party security scanning (Dependabot) |
| **Performance Regression** | Low-Medium - slower operations | - Benchmark before/after migration<br>- Rust should be faster in most cases<br>- Profile hot paths |
| **Integration Test Coverage** | Medium - bugs slip through | - Maintain test coverage metrics<br>- Add missing Rust integration tests<br>- Keep E2E tests for critical paths |

### 5.3 Low Risk Areas 🟢

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| **Demo Script Removal** | Low - demos can be recreated | - Document demo scenarios<br>- Keep one reference implementation |
| **Historical Script Removal** | None - already archived | - Git history preserves everything<br>- No action needed |
| **Dev Tooling Changes** | Low - dev productivity | - Update developer onboarding docs<br>- Provide cheat sheet for Rust CLI commands |

### 5.4 Rollback Strategy

**Per-Phase Rollback**:

| Phase | Rollback Complexity | Rollback Steps |
|-------|-------------------|----------------|
| Phase 1-2 (CLI/CI) | Easy | Git revert workflow changes |
| Phase 3 (API) | Medium | Switch DNS back to Express.js instance |
| Phase 4-5 (Scripts) | Easy | Git revert file deletions |
| Phase 6 (Cleanup) | Hard | Restore from git history |

**Emergency Rollback Procedure**:
1. Identify broken functionality
2. Check if Rust equivalent exists
3. If yes: Fix Rust bug (preferred)
4. If no: Git revert to restore TS scripts temporarily
5. Add missing functionality to Rust
6. Re-attempt migration

---

## 6. Success Criteria

### 6.1 Quantitative Metrics

| Metric | Current | Target | Success Threshold |
|--------|---------|--------|------------------|
| TypeScript files (backend/scripts) | 194 | 0 | 0 files |
| TypeScript files (frontend) | 93 | 93 | Keep all |
| Rust crate count | 23 | 23-25 | Stable |
| CI/CD success rate | 95% | 98% | No regression |
| API latency (p99) | N/A | <100ms | Better than Express |
| Test coverage | ~80% | 85% | Maintain or improve |
| Binary size (miyabi-cli) | ~15MB | <20MB | Reasonable |
| Build time (release) | ~3min | <5min | Acceptable |

### 6.2 Qualitative Criteria

✅ **Must Have**:
- All GitHub Actions workflows using Rust binaries
- Zero `npx tsx` invocations in CI/CD
- API backend fully migrated to Axum
- No functionality regressions
- Documentation updated
- Security audit passing

✅ **Should Have**:
- Performance improvements from Rust
- Reduced dependency count
- Improved error messages
- Better logging/observability

✅ **Nice to Have**:
- Faster build times
- Smaller Docker images
- Better developer experience

---

## 7. Resource Requirements

### 7.1 Human Resources

| Role | Effort | Responsibilities |
|------|--------|-----------------|
| **Lead Developer** | 60 hours | Architecture decisions, code review, risk management |
| **Rust Developer** | 200 hours | Implement missing features, API migration, testing |
| **DevOps Engineer** | 40 hours | CI/CD updates, deployment, monitoring |
| **QA Engineer** | 40 hours | Integration testing, E2E testing, validation |

**Total Effort**: ~340 hours (8.5 weeks at 40h/week, or 12 weeks part-time)

### 7.2 Infrastructure

| Resource | Cost | Duration |
|----------|------|----------|
| **Staging Environment** | $50/month | 3 months |
| **Load Testing** | $100 | One-time |
| **Blue-Green Deployment** | $100/month | 1 month |
| **Monitoring/Logging** | Included | - |

**Total Cost**: ~$350

### 7.3 Tools and Dependencies

**New Rust Crates Required**:
```toml
# Web API
axum = "0.7"
tower = "0.5"
tower-http = { version = "0.6", features = ["cors", "trace"] }

# Database
sqlx = { version = "0.8", features = ["postgres", "runtime-tokio"] }
redis = "0.27"

# Authentication
jsonwebtoken = "9.0"
bcrypt = "0.16"

# Payment
stripe-rust = "0.31"

# Rate Limiting
governor = "0.7"
```

---

## 8. Migration Checklist

### Phase 1: Preparation ✅ / 🔄

- [x] Create removal plan document (this file)
- [ ] Implement `miyabi-cli discussion digest` command
- [ ] Implement `miyabi-cli security audit` command
- [ ] Implement `miyabi-cli report weekly` command
- [ ] Implement discussion bot webhook handler
- [ ] Create shell script alternatives for simple tasks
- [ ] Update CLI documentation
- [ ] Communicate plan to team

### Phase 2: CI/CD Migration 🔄

- [ ] Update `ai-auto-label.yml` to use Rust CLI
- [ ] Update `discussion-bot.yml` to use webhook handler
- [ ] Update `security-audit.yml` to use Rust CLI
- [ ] Update `discussion-digest.yml` to use Rust CLI
- [ ] Remove `tsx` from GitHub Actions
- [ ] Test all updated workflows
- [ ] Monitor CI/CD for 1 week

### Phase 3: API Backend Migration 🔄

- [ ] Design Axum API architecture
- [ ] Implement auth routes (JWT, OAuth)
- [ ] Implement license management routes
- [ ] Implement marketplace CRUD routes
- [ ] Implement usage tracking routes
- [ ] Implement JWT authentication middleware
- [ ] Implement rate limiting middleware
- [ ] Implement CORS configuration
- [ ] Integrate Supabase PostgreSQL
- [ ] Integrate Stripe payments
- [ ] Integrate Redis caching
- [ ] Write API integration tests
- [ ] Load test Rust API
- [ ] Deploy to staging
- [ ] Update Next.js to use Rust API
- [ ] Deploy to production
- [ ] Monitor for 1 week
- [ ] Remove `api/` directory

### Phase 4: Script Consolidation 🔄

- [ ] Remove demo/example scripts (8 files)
- [ ] Remove historical execution scripts (4 files)
- [ ] Migrate `update-readme-with-demos.ts` to shell
- [ ] Migrate `parallel-checks.ts` to shell
- [ ] Port integration test logic to Rust
- [ ] Clean up `scripts/` directory
- [ ] Update script documentation

### Phase 5: Test Migration 🔄

- [ ] Audit Rust test coverage vs TS tests
- [ ] Add missing Rust integration tests
- [ ] Keep Playwright E2E tests
- [ ] Remove redundant TS unit tests
- [ ] Update `package.json` test scripts
- [ ] Run full test suite
- [ ] Validate coverage metrics

### Phase 6: Final Cleanup 🔄

- [ ] Delete `archive/typescript-legacy/` directory (173 files)
- [ ] Delete `packages/` directory
- [ ] Remove TypeScript from root `package.json`
- [ ] Remove `tsx` from root `package.json`
- [ ] Update `tsconfig.json` (web UI + E2E only)
- [ ] Remove unused npm dependencies
- [ ] Clean up GitHub Actions workflows
- [ ] Update repository README
- [ ] Update developer onboarding docs
- [ ] Create migration announcement
- [ ] Celebrate! 🎉

---

## 9. Communication Plan

### 9.1 Stakeholder Communication

| Stakeholder | Medium | Frequency | Content |
|-------------|--------|-----------|---------|
| **Development Team** | Slack + Standup | Daily | Progress updates, blockers |
| **Project Lead** | GitHub Issue | Weekly | Phase completion, risks |
| **QA Team** | Slack | As needed | Testing requests, bug reports |
| **DevOps** | Slack + Email | Per phase | Deployment requests, monitoring |

### 9.2 Documentation Updates

**Documents to Update**:
- [ ] README.md - Remove TypeScript setup instructions
- [ ] CONTRIBUTING.md - Update build instructions
- [ ] .claude/context/development.md - Rust-only development guide
- [ ] docs/ARCHITECTURE.md - Remove TS references
- [ ] docs/GETTING_STARTED.md - Rust CLI usage
- [ ] GitHub wiki - API migration guide

### 9.3 Migration Announcement

**Draft Announcement** (to be published after Phase 6):

```markdown
# 🎉 Miyabi is now 100% Rust (Backend/CLI)

We're excited to announce that Miyabi's backend and CLI have been fully
migrated from TypeScript to Rust! This migration brings:

✅ **Performance**: 10-50x faster operations
✅ **Safety**: Zero runtime errors, memory safety guaranteed
✅ **Single Binary**: No Node.js required for CLI
✅ **Better DX**: Consistent tooling with `cargo`

## What Changed

- All CLI commands now use `miyabi` binary (no more `npx tsx`)
- API backend migrated from Express.js to Axum (Rust)
- GitHub Actions workflows now use Rust binaries
- ~25,000 lines of TypeScript removed

## What Stayed the Same

- Next.js web UI (still TypeScript/React)
- A2A Dashboard (still TypeScript/React)
- All functionality preserved

## Migration Guide

See [MIGRATION.md](docs/MIGRATION.md) for detailed upgrade instructions.

---

**Questions?** Open a [GitHub Discussion](https://github.com/ShunsukeHayashi/Miyabi/discussions)
```

---

## 10. Post-Migration Validation

### 10.1 Functional Testing

**Critical User Journeys to Test**:

1. **CLI Workflows**:
   - [ ] `miyabi init` - Project initialization
   - [ ] `miyabi agent execute --issue 123` - Agent execution
   - [ ] `miyabi label infer --issue 123` - AI label inference
   - [ ] `miyabi discussion digest` - Discussion summarization
   - [ ] `miyabi security audit` - Security scanning
   - [ ] `miyabi report weekly` - Weekly report generation

2. **API Workflows**:
   - [ ] User registration and login (JWT)
   - [ ] License purchase (Stripe integration)
   - [ ] Marketplace plugin browsing
   - [ ] Usage tracking and analytics
   - [ ] Rate limiting enforcement

3. **Webhook Workflows**:
   - [ ] Issue labeled → Agent execution
   - [ ] Discussion created → Bot response
   - [ ] PR created → Auto-review
   - [ ] Security alert → Notification

### 10.2 Performance Testing

**Benchmarks to Run**:

| Operation | TS Baseline | Rust Target | Actual | Status |
|-----------|-------------|-------------|--------|--------|
| CLI startup time | 500ms | <50ms | TBD | ⏳ |
| Issue label inference | 2s | <500ms | TBD | ⏳ |
| API request (p50) | 20ms | <10ms | TBD | ⏳ |
| API request (p99) | 100ms | <50ms | TBD | ⏳ |
| Webhook processing | 200ms | <100ms | TBD | ⏳ |
| Full test suite | 60s | <30s | TBD | ⏳ |

### 10.3 Monitoring and Observability

**Metrics to Track** (first 4 weeks post-migration):

- [ ] Error rate (target: <0.1%)
- [ ] API latency (p50, p95, p99)
- [ ] CLI execution time
- [ ] Memory usage (RSS)
- [ ] CPU usage
- [ ] Deployment success rate
- [ ] User-reported issues

**Alerting**:
- Error rate >1% → Page on-call engineer
- API latency p99 >200ms → Slack alert
- Memory leak detected → Email alert

---

## 11. Appendix

### 11.1 Full File Listing

**TypeScript Files to Remove** (194 files):

See [TYPESCRIPT_FILE_INVENTORY.txt](./TYPESCRIPT_FILE_INVENTORY.txt) for complete listing.

### 11.2 Rust Crate Mapping

**Complete TS → Rust Mapping**:

| TypeScript Module | Rust Crate | Module Path |
|------------------|------------|-------------|
| `packages/core/config.ts` | `miyabi-core` | `miyabi_core::config` |
| `packages/core/logger.ts` | `miyabi-core` | `miyabi_core::logger` |
| `packages/coding-agents/base.ts` | `miyabi-agent-core` | `miyabi_agent_core::base_agent` |
| `packages/coding-agents/coordinator.ts` | `miyabi-agent-coordinator` | `miyabi_agent_coordinator::coordinator` |
| `packages/coding-agents/codegen.ts` | `miyabi-agent-codegen` | `miyabi_agent_codegen::generator` |
| `packages/coding-agents/review.ts` | `miyabi-agent-review` | `miyabi_agent_review::reviewer` |
| `packages/github-projects/api.ts` | `miyabi-github` | `miyabi_github::client` |
| `packages/github-projects/graphql.ts` | `miyabi-github` | `miyabi_github::graphql` |
| `packages/shared-utils/retry.ts` | `miyabi-core` | `miyabi_core::retry` |
| `packages/cli/commands/*.ts` | `miyabi-cli` | `miyabi_cli::commands::*` |

### 11.3 Command Equivalence Table

**TS Script → Rust CLI Command**:

| TypeScript Script | Rust CLI Command | Notes |
|------------------|------------------|-------|
| `npx tsx scripts/github/ai-label-issue.ts --issue 123` | `miyabi label infer --issue 123` | ✅ Implemented |
| `npx tsx scripts/operations/execute-task.ts --issue 123` | `miyabi agent execute --issue 123` | ✅ Implemented |
| `npx tsx scripts/operations/verify-agents.ts` | `miyabi agent verify` | ✅ Implemented |
| `npx tsx scripts/security/security-manager.ts audit` | `miyabi security audit` | 🔄 To implement |
| `npx tsx scripts/reporting/generate-weekly-report.ts` | `miyabi report weekly` | 🔄 To implement |
| `npx tsx scripts/github/discussion-digest.ts` | `miyabi discussion digest` | 🔄 To implement |
| `npx tsx scripts/setup/setup-agentic-os.ts` | `miyabi init` | ✅ Partially implemented |

### 11.4 Dependencies Before/After

**package.json Before**:
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "express": "^4.18.2",
    "bcryptjs": "^3.0.2",
    // ... 20+ dependencies
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0",
    // ... 10+ dev dependencies
  }
}
```

**package.json After**:
```json
{
  "dependencies": {
    // E2E test dependencies only
    "@playwright/test": "^1.40.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",  // For web UI + tests only
    "@types/node": "^20.0.0"
  }
}
```

**Cargo.toml After**:
```toml
[workspace.dependencies]
# All backend dependencies in Rust
axum = "0.7"
tokio = "1.40"
serde = "1.0"
sqlx = "0.8"
# ... (see Cargo.toml for full list)
```

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-24 | CoordinatorAgent | Initial removal plan created for Issue #447 |

---

**Next Steps**: Begin Phase 1 implementation → Update Issue #447 → Track progress in GitHub Project

**Owner**: @coordinator
**Reviewers**: @miyabi-team
**Status**: ✅ Ready for Review
