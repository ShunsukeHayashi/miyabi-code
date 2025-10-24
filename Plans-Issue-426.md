# Plans for Issue #426

**Title**: [Phase 1] Web基盤 - GitHub OAuth認証とダッシュボード実装

**URL**: https://github.com/customer-cloud/miyabi-private/issues/426

---

## 📋 Summary

- **Total Tasks**: 13
- **Estimated Duration**: 8-10 hours
- **Execution Levels**: 6
- **Has Cycles**: ✅ No
- **Milestone**: Week 12: MVP Launch (Phase 0-3 Complete)
- **Priority**: 🔥 P0-Critical

## 🎯 Objective

Week 3-6で実施するWeb基盤フェーズ。GitHub OAuth認証、ダッシュボード、Issue一覧表示を実装。

## 📝 Task Breakdown

### 1. Analyze Issue #426 requirements ✅

- **ID**: `task-426-analysis`
- **Type**: Docs
- **Status**: ✅ Completed
- **Priority**: 0
- **Estimated Duration**: 15 min

**Analysis Results**:
- Backend infrastructure (miyabi-web-api) already exists with auth handlers
- Need to enhance existing auth routes for complete OAuth flow
- Need to add dashboard and repositories endpoints
- Frontend Next.js app needs to be created from scratch
- Database schema already defined in TECHNICAL_REQUIREMENTS.md

### 2. Implement GitHub OAuth handlers (Rust)

- **ID**: `task-426-oauth`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 1
- **Estimated Duration**: 60 min
- **Dependencies**: task-426-analysis

**Description**:
- ✅ GitHub OAuth initiation already implemented (`/auth/github`)
- ✅ GitHub OAuth callback already implemented (`/auth/github/callback`)
- ✅ JWT token generation already implemented
- ✅ User create/update already implemented
- Need to verify: Token expiration, refresh token logic

**Files**:
- `crates/miyabi-web-api/src/routes/auth.rs` (enhance)
- `crates/miyabi-web-api/src/auth.rs` (enhance)

### 3. Implement JWT authentication middleware (Rust)

- **ID**: `task-426-auth-middleware`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 2
- **Estimated Duration**: 30 min
- **Dependencies**: task-426-oauth

**Description**:
- Create JWT validation middleware
- Add `Authorization: Bearer <token>` header parsing
- Add user context injection for protected routes

**Files**:
- `crates/miyabi-web-api/src/middleware/auth.rs` (new)

### 4. Create Dashboard API handlers (Rust)

- **ID**: `task-426-dashboard-api`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 3
- **Estimated Duration**: 45 min
- **Dependencies**: task-426-auth-middleware

**Description**:
- `GET /api/v1/dashboard/summary` - Agent execution counts (running, completed, error)
- `GET /api/v1/dashboard/recent-executions` - Recent Agent execution history

**Files**:
- `crates/miyabi-web-api/src/routes/dashboard.rs` (new)
- `crates/miyabi-web-api/src/lib.rs` (update routes)

### 5. Create Repositories API handlers (Rust)

- **ID**: `task-426-repositories-api`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 3
- **Estimated Duration**: 45 min
- **Dependencies**: task-426-auth-middleware

**Description**:
- ✅ `GET /api/v1/repositories` already implemented
- ✅ `GET /api/v1/repositories/:id` already implemented
- ✅ `POST /api/v1/repositories` already implemented
- Add: `GET /api/v1/repositories/:repoId/issues` - Fetch issues from GitHub API
- Add: `GET /api/v1/repositories/:repoId/issues/:number` - Fetch issue details

**Files**:
- `crates/miyabi-web-api/src/routes/repositories.rs` (enhance)

### 6. Initialize Next.js 14 frontend application

- **ID**: `task-426-nextjs-init`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 4
- **Estimated Duration**: 30 min
- **Dependencies**: task-426-analysis

**Description**:
- Create Next.js 14 App Router project
- Setup Tailwind CSS 3.4
- Install shadcn/ui components
- Setup TanStack Query (React Query)
- Setup Zustand for state management
- Setup directory structure

**Files**:
- `miyabi-web/next-app/` (new directory)
- `miyabi-web/next-app/package.json`
- `miyabi-web/next-app/next.config.js`
- `miyabi-web/next-app/tailwind.config.js`
- `miyabi-web/next-app/tsconfig.json`

**Directory Structure**:
```
miyabi-web/next-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (redirect to /dashboard)
│   ├── login/
│   │   └── page.tsx
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx
│       └── issues/
│           └── page.tsx
├── components/
│   ├── ui/ (shadcn/ui components)
│   └── dashboard/
├── hooks/
│   └── useAuth.ts
├── stores/
│   └── authStore.ts
├── lib/
│   └── api.ts
└── public/
```

### 7. Implement login page with GitHub OAuth (React)

- **ID**: `task-426-login-page`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 5
- **Estimated Duration**: 30 min
- **Dependencies**: task-426-nextjs-init, task-426-oauth

**Description**:
- Create login page at `/login`
- GitHub OAuth button
- Loading state display
- Error handling
- Redirect to `/dashboard` after successful login
- Token extraction from URL query parameter
- Store token in localStorage

**Files**:
- `miyabi-web/next-app/app/login/page.tsx` (new)
- `miyabi-web/next-app/hooks/useAuth.ts` (new)
- `miyabi-web/next-app/stores/authStore.ts` (new)

### 8. Implement dashboard page with summary cards (React)

- **ID**: `task-426-dashboard-page`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 6
- **Estimated Duration**: 60 min
- **Dependencies**: task-426-nextjs-init, task-426-dashboard-api

**Description**:
- Create dashboard layout at `/dashboard`
- Header with user avatar and logout button
- Sidebar with navigation (Dashboard, Issues, Settings)
- Summary cards: Running Count, Completed Count, Error Count
- Recent Agent executions list
- Real-time updates via polling (WebSocket later in Phase 4)
- Pagination for executions

**Files**:
- `miyabi-web/next-app/app/dashboard/layout.tsx` (new)
- `miyabi-web/next-app/app/dashboard/page.tsx` (new)
- `miyabi-web/next-app/components/dashboard/SummaryCard.tsx` (new)
- `miyabi-web/next-app/components/dashboard/ExecutionsList.tsx` (new)
- `miyabi-web/next-app/components/dashboard/Header.tsx` (new)
- `miyabi-web/next-app/components/dashboard/Sidebar.tsx` (new)

### 9. Implement Issue list page with filters (React)

- **ID**: `task-426-issues-page`
- **Type**: Feature
- **Assigned Agent**: CodeGenAgent
- **Priority**: 7
- **Estimated Duration**: 90 min
- **Dependencies**: task-426-dashboard-page, task-426-repositories-api

**Description**:
- Create Issues page at `/dashboard/issues`
- Repository selection dropdown
- Issues table with columns: Number, Title, State, Labels, Updated At
- Status filter (open/closed)
- Label filter (multi-select)
- Search functionality (title/body)
- Sort functionality (created_at, updated_at)
- Pagination
- Issue detail modal
- Markdown rendering for issue body
- "Execute Agent" button in modal

**Files**:
- `miyabi-web/next-app/app/dashboard/issues/page.tsx` (new)
- `miyabi-web/next-app/components/issues/IssueTable.tsx` (new)
- `miyabi-web/next-app/components/issues/IssueDetailModal.tsx` (new)
- `miyabi-web/next-app/components/issues/Filters.tsx` (new)

### 10. Add integration tests for API endpoints (Rust)

- **ID**: `task-426-api-tests`
- **Type**: Test
- **Assigned Agent**: CodeGenAgent
- **Priority**: 8
- **Estimated Duration**: 45 min
- **Dependencies**: task-426-dashboard-api, task-426-repositories-api

**Description**:
- Test GitHub OAuth flow (mock)
- Test JWT token validation
- Test dashboard summary endpoint
- Test repositories endpoints
- Test issues endpoints

**Files**:
- `crates/miyabi-web-api/tests/integration/auth_test.rs` (new)
- `crates/miyabi-web-api/tests/integration/dashboard_test.rs` (new)
- `crates/miyabi-web-api/tests/integration/repositories_test.rs` (new)

### 11. Add E2E tests for frontend (React)

- **ID**: `task-426-e2e-tests`
- **Type**: Test
- **Assigned Agent**: CodeGenAgent
- **Priority**: 8
- **Estimated Duration**: 45 min
- **Dependencies**: task-426-login-page, task-426-dashboard-page, task-426-issues-page

**Description**:
- Test login flow
- Test dashboard display
- Test issue list display and filtering
- Test issue detail modal

**Files**:
- `miyabi-web/next-app/tests/e2e/auth.spec.ts` (new)
- `miyabi-web/next-app/tests/e2e/dashboard.spec.ts` (new)
- `miyabi-web/next-app/tests/e2e/issues.spec.ts` (new)

### 12. Run ReviewAgent quality check

- **ID**: `task-426-review`
- **Type**: Refactor
- **Assigned Agent**: ReviewAgent
- **Priority**: 9
- **Estimated Duration**: 15 min
- **Dependencies**: task-426-api-tests, task-426-e2e-tests

**Description**: Run quality checks and code review
- Check Rust code quality (clippy, fmt)
- Check TypeScript code quality (eslint, prettier)
- Verify test coverage
- Check documentation completeness
- Verify security best practices (no hardcoded secrets)

### 13. Create Pull Request with PRAgent

- **ID**: `task-426-pr`
- **Type**: Refactor
- **Assigned Agent**: PRAgent
- **Priority**: 10
- **Estimated Duration**: 10 min
- **Dependencies**: task-426-review

**Description**: Create PR with comprehensive summary
- Summarize all changes
- List all new files
- Include test results
- Add deployment checklist
- Tag reviewers

## 🔄 Execution Plan (DAG Levels)

### Level 0 (Sequential Analysis)
- `task-426-analysis` ✅ Completed

### Level 1 (Parallel Backend Foundation)
- `task-426-oauth` - GitHub OAuth handlers
- `task-426-nextjs-init` - Frontend initialization

### Level 2 (Parallel Backend Middleware)
- `task-426-auth-middleware` - JWT middleware

### Level 3 (Parallel Backend API Endpoints)
- `task-426-dashboard-api` - Dashboard API
- `task-426-repositories-api` - Repositories API
- `task-426-login-page` - Login page (can start in parallel)

### Level 4 (Parallel Frontend Pages)
- `task-426-dashboard-page` - Dashboard page
- `task-426-issues-page` - Issues page

### Level 5 (Parallel Testing)
- `task-426-api-tests` - Backend integration tests
- `task-426-e2e-tests` - Frontend E2E tests

### Level 6 (Sequential Quality & PR)
- `task-426-review` - ReviewAgent quality check
- `task-426-pr` - Create Pull Request

## 📊 Dependency Graph

```mermaid
graph TD
    A[task-426-analysis] --> B[task-426-oauth]
    A --> C[task-426-nextjs-init]

    B --> D[task-426-auth-middleware]

    D --> E[task-426-dashboard-api]
    D --> F[task-426-repositories-api]
    C --> G[task-426-login-page]

    E --> H[task-426-dashboard-page]
    F --> I[task-426-issues-page]
    G --> H
    C --> H
    C --> I

    E --> J[task-426-api-tests]
    F --> J
    H --> K[task-426-e2e-tests]
    I --> K

    J --> L[task-426-review]
    K --> L

    L --> M[task-426-pr]
```

## ⏱️ Timeline Estimation

- **Sequential Execution**: 8-10 hours
- **Parallel Execution (Critical Path)**: 4-5 hours
- **Estimated Speedup**: 2x

## 🎯 Success Criteria

- ✅ GitHub OAuth login functional
- ✅ Dashboard displays Agent execution summary
- ✅ Issue list displays with filters
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ ReviewAgent score > 90/100
- ✅ PR created and ready for merge

## 📦 Technology Stack

**Backend**:
- Rust + Axum 0.7
- PostgreSQL 15 + SQLx
- JWT authentication
- GitHub OAuth 2.0

**Frontend**:
- Next.js 14 (App Router)
- React 18
- TypeScript 5.3
- Tailwind CSS 3.4
- shadcn/ui
- TanStack Query (React Query)
- Zustand

**Infrastructure**:
- Vercel (Frontend hosting)
- AWS Lambda (Backend - future)
- AWS RDS PostgreSQL (Database - future)

## 🔐 Environment Variables Required

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/miyabi
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_CALLBACK_URL=http://localhost:3001/api/v1/auth/github/callback
JWT_SECRET=xxx
JWT_EXPIRATION=3600
SERVER_ADDRESS=0.0.0.0:3001
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

## 📝 Implementation Notes

### Existing Infrastructure (✅ Already Implemented)
- GitHub OAuth handlers (initiate, callback)
- JWT token generation
- User CRUD operations
- Repository CRUD operations
- Agent execution endpoints
- Workflow endpoints
- WebSocket endpoint (basic)
- Database schema (users, repositories, agent_executions, workflows)

### New Implementation Required
1. **Backend**:
   - JWT authentication middleware
   - Dashboard summary endpoint
   - Issues fetch from GitHub API endpoint
   - Integration tests

2. **Frontend** (Complete new implementation):
   - Next.js 14 project setup
   - Login page
   - Dashboard page
   - Issues page
   - Authentication state management
   - API client library
   - E2E tests

### Security Considerations
- JWT tokens stored in localStorage (httpOnly cookies in production)
- CORS configured for frontend domain
- GitHub OAuth state parameter for CSRF protection
- Rate limiting on API endpoints (TODO)
- Input validation on all endpoints

### Performance Optimizations
- GitHub API response caching (Redis - Phase 4)
- Database query optimization with indexes
- Frontend data caching with React Query
- Lazy loading for heavy components

---

*Generated by CoordinatorAgent on 2025-10-24 14:55:00 UTC*
