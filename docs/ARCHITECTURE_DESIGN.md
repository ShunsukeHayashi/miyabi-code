# Miyabi Web Platform - Architecture Design

**Phase 0: Architecture Design (Week 1-2)**
**Status**: 🏗️ In Progress
**Issue**: #425

---

## 1. Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **Component Library**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **WebSocket**: Socket.IO Client

### Backend
- **Language**: Rust 2021 Edition
- **Web Framework**: Axum 0.7
- **Database**: PostgreSQL 15
- **ORM**: SQLx (compile-time checked queries)
- **Authentication**: JWT + OAuth 2.0
- **WebSocket**: tokio-tungstenite
- **API Documentation**: OpenAPI 3.1 (via utoipa)

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: AWS Lambda (Rust runtime) / Fly.io
- **Database**: AWS RDS PostgreSQL / Supabase
- **CDN**: Cloudflare
- **Monitoring**: Datadog / Grafana
- **CI/CD**: GitHub Actions

### Development Tools
- **Package Manager**: pnpm (frontend), cargo (backend)
- **Linting**: ESLint, Prettier, Clippy, Rustfmt
- **Testing**: Vitest, Playwright (frontend), cargo-nextest (backend)
- **Design**: Figma

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                            │
└─────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
┌──────────────────────┐   ┌──────────────────────┐
│   Next.js Frontend   │   │   Rust Backend API   │
│   (Vercel)           │←──│   (AWS Lambda/Fly.io)│
│                      │   │                      │
│  - Dashboard UI      │   │  - REST API         │
│  - OAuth Login       │   │  - WebSocket        │
│  - Workflow Editor   │   │  - Agent Execution  │
│  - Real-time Updates │   │  - GitHub Integration│
└──────────────────────┘   └──────────────────────┘
              │                       │
              └───────────┬───────────┘
                          ↓
              ┌────────────────────────┐
              │  PostgreSQL Database   │
              │  (AWS RDS/Supabase)    │
              │                        │
              │  - Users               │
              │  - Repositories        │
              │  - Agent Executions    │
              │  - Workflows           │
              └────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
┌──────────────────────┐   ┌──────────────────────┐
│   GitHub API         │   │   LINE Messaging API │
│   - Issue Management │   │   - Push Notifications│
│   - Repository Data  │   │   - Bot Interactions │
└──────────────────────┘   └──────────────────────┘
```

### Component Interaction Flow

```
User Action (Browser)
    ↓
Next.js App Router
    ↓
React Components (shadcn/ui)
    ↓
TanStack Query (Data Fetching)
    ↓
Rust Axum API (REST/WebSocket)
    ↓
SQLx Query (Type-safe)
    ↓
PostgreSQL Database
    ↓
Response → WebSocket → Real-time UI Update
```

---

## 3. Database Schema (PostgreSQL)

### ER Diagram

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │───┐
│ github_id       │   │
│ email           │   │
│ name            │   │
│ avatar_url      │   │
│ access_token    │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
                      │ (1:N)
                      │
┌─────────────────────┼─────────────────────────┐
│                     ↓                         │
│     ┌──────────────────────┐                 │
│     │   repositories       │                 │
│     ├──────────────────────┤                 │
│     │ id (PK)              │───┐             │
│     │ user_id (FK)         │   │             │
│     │ github_repo_id       │   │             │
│     │ owner                │   │             │
│     │ name                 │   │             │
│     │ full_name            │   │             │
│     │ is_active            │   │             │
│     │ created_at           │   │             │
│     │ updated_at           │   │             │
│     └──────────────────────┘   │             │
│                                │             │
│                                │ (1:N)       │
│                                │             │
│     ┌──────────────────────────┼─────────────┘
│     ↓                          │
│ ┌──────────────────────┐       │
│ │ agent_executions     │       │
│ ├──────────────────────┤       │
│ │ id (PK)              │       │
│ │ repository_id (FK)   │       │
│ │ issue_number         │       │
│ │ agent_type           │       │
│ │ status               │       │
│ │ started_at           │       │
│ │ completed_at         │       │
│ │ result_summary       │       │
│ │ quality_score        │       │
│ │ pr_number            │       │
│ │ created_at           │       │
│ │ updated_at           │       │
│ └──────────────────────┘       │
│                                │
│                                │ (1:N)
│                                │
│     ┌──────────────────────────┘
│     ↓
│ ┌──────────────────────┐
│ │     workflows        │
│ ├──────────────────────┤
│ │ id (PK)              │
│ │ repository_id (FK)   │
│ │ name                 │
│ │ dag_definition       │──→ JSONB (DAG structure)
│ │ is_active            │
│ │ created_at           │
│ │ updated_at           │
│ └──────────────────────┘
│
└─────────────────────────────────┐
                                  │
                                  │ (1:N)
                                  │
             ┌────────────────────┘
             ↓
┌──────────────────────┐
│   line_messages      │
├──────────────────────┤
│ id (PK)              │
│ user_id (FK)         │
│ line_user_id         │
│ message_type         │
│ message_content      │──→ JSONB (message data)
│ sent_at              │
│ created_at           │
└──────────────────────┘

┌──────────────────────────┐
│ websocket_connections    │
├──────────────────────────┤
│ id (PK)                  │
│ user_id (FK)             │
│ connection_id            │
│ connected_at             │
│ last_ping_at             │
└──────────────────────────┘
```

### Table Definitions

#### 1. users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id BIGINT UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    access_token TEXT NOT NULL, -- Encrypted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_email ON users(email);
```

#### 2. repositories
```sql
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id BIGINT UNIQUE NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(511) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
```

#### 3. agent_executions
```sql
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    issue_number INTEGER NOT NULL,
    agent_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, running, completed, failed
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    result_summary JSONB,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    pr_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_executions_repository_id ON agent_executions(repository_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_created_at ON agent_executions(created_at DESC);
```

#### 4. workflows
```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dag_definition JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workflows_repository_id ON workflows(repository_id);
```

#### 5. line_messages
```sql
CREATE TABLE line_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    message_content JSONB NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_line_messages_user_id ON line_messages(user_id);
CREATE INDEX idx_line_messages_line_user_id ON line_messages(line_user_id);
```

#### 6. websocket_connections
```sql
CREATE TABLE websocket_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_ping_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_websocket_connections_user_id ON websocket_connections(user_id);
CREATE INDEX idx_websocket_connections_connection_id ON websocket_connections(connection_id);
```

---

## 4. API Design (REST + WebSocket)

### REST API Endpoints

#### Authentication
- `POST /api/auth/github/callback` - GitHub OAuth callback
- `POST /api/auth/refresh` - Refresh JWT token
- `DELETE /api/auth/logout` - Logout

#### Repositories
- `GET /api/repositories` - List user's repositories
- `POST /api/repositories` - Add repository
- `GET /api/repositories/:id` - Get repository details
- `DELETE /api/repositories/:id` - Remove repository

#### Issues
- `GET /api/repositories/:id/issues` - List repository issues
- `GET /api/repositories/:id/issues/:number` - Get issue details

#### Agents
- `POST /api/agents/execute` - Execute agent on issue
- `GET /api/agents/executions` - List executions
- `GET /api/agents/executions/:id` - Get execution details
- `DELETE /api/agents/executions/:id` - Cancel execution

#### Workflows
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

#### LINE Bot
- `POST /api/line/webhook` - LINE webhook handler
- `POST /api/line/send` - Send LINE message

### WebSocket Protocol

#### Connection
```
ws://api.example.com/ws?token=<JWT>
```

#### Message Format
```typescript
{
  type: "agent_status" | "agent_progress" | "agent_completed" | "ping" | "pong",
  data: {
    executionId: string,
    status?: string,
    progress?: number,
    message?: string
  },
  timestamp: string
}
```

#### Events
- `agent_status` - Agent execution status change
- `agent_progress` - Agent execution progress update (0-100)
- `agent_completed` - Agent execution completed
- `ping` / `pong` - Keep-alive

---

## 5. Security Considerations

### Authentication
- **OAuth 2.0**: GitHub OAuth for user authentication
- **JWT**: Stateless authentication with refresh tokens
- **Token Expiry**: Access token (1 hour), Refresh token (30 days)

### Data Protection
- **Encryption at Rest**: PostgreSQL encrypted storage
- **Encryption in Transit**: TLS 1.3 for all connections
- **Secret Management**: AWS Secrets Manager / Doppler

### Authorization
- **Row-Level Security (RLS)**: PostgreSQL RLS policies
- **API Rate Limiting**: 100 requests/minute per user
- **CORS**: Whitelist frontend domains

---

## 6. Performance Optimization

### Frontend
- **SSR**: Server-Side Rendering for initial load
- **Code Splitting**: Dynamic imports for routes
- **Image Optimization**: Next.js Image component
- **CDN**: Cloudflare edge caching

### Backend
- **Connection Pooling**: SQLx connection pool
- **Query Optimization**: Indexed queries, N+1 prevention
- **Caching**: Redis cache for frequently accessed data
- **WebSocket**: Efficient real-time updates

### Database
- **Indexing**: Strategic indexes on foreign keys, search columns
- **Partitioning**: Time-based partitioning for large tables
- **Replication**: Read replicas for scaling

---

## 7. Monitoring & Observability

### Metrics
- **Application Metrics**: Request rate, latency, error rate
- **Database Metrics**: Query performance, connection pool usage
- **Infrastructure Metrics**: CPU, memory, disk usage

### Logging
- **Structured Logging**: JSON format with tracing IDs
- **Log Aggregation**: Datadog / CloudWatch Logs
- **Log Retention**: 30 days

### Alerting
- **Error Rate**: Alert if error rate > 5%
- **Latency**: Alert if p95 latency > 500ms
- **Database**: Alert if connection pool > 80%

---

## 8. Deployment Strategy

### Environments
- **Development**: Local development
- **Staging**: Pre-production testing
- **Production**: Live environment

### CI/CD Pipeline
```
GitHub Push
    ↓
GitHub Actions
    ↓
├─ Frontend (Next.js)
│  ├─ Build & Test
│  └─ Deploy to Vercel
│
└─ Backend (Rust)
   ├─ Build & Test
   ├─ Build Docker Image
   └─ Deploy to AWS Lambda/Fly.io
```

### Rollback Strategy
- **Frontend**: Vercel instant rollback
- **Backend**: Lambda version alias switch
- **Database**: Migration rollback scripts

---

## 9. Success Criteria

- [x] Technology stack finalized
- [ ] Next.js 14 project initialized
- [ ] Rust `miyabi-web-api` crate created
- [ ] PostgreSQL schema created (7 tables)
- [ ] API specification document completed
- [ ] Figma design created (20 screens)
- [ ] CI/CD pipeline configured

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-22
**Author**: Claude Code (Autonomous Agent)
