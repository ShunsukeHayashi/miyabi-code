# Miyabi Web UI - System Architecture

**Version**: 1.0  
**Created**: 2025-10-22  
**Author**: Claude Code

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Description](#component-description)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Deployment Architecture](#deployment-architecture)
7. [Security Architecture](#security-architecture)

---

## System Overview

Miyabi Web UI is a No-Code web platform that enables users to visually create and execute AI agent workflows for GitHub repository automation.

**Key Features**:
- GitHub OAuth authentication
- Visual workflow editor (React Flow)
- Real-time agent execution monitoring (WebSocket)
- LINE Bot integration for natural language commands
- Self-hosted infrastructure support

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ Client Layer                                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐         ┌──────────────────────┐         │
│  │   Web Browser        │         │   LINE App           │         │
│  │                      │         │                      │         │
│  │ • Next.js 14         │         │ • LINE Messaging API │         │
│  │ • React 18           │         │ • Rich Menu          │         │
│  │ • Tailwind CSS       │         │ • Push Notifications │         │
│  │ • shadcn/ui          │         │                      │         │
│  │ • React Flow         │         │                      │         │
│  │ • Zustand (State)    │         │                      │         │
│  │ • TanStack Query     │         │                      │         │
│  └──────────┬───────────┘         └──────────┬───────────┘         │
│             │                                │                      │
└─────────────┼────────────────────────────────┼──────────────────────┘
              │                                │
              │ HTTPS (REST)                   │ HTTPS (Webhook)
              │ WSS (WebSocket)                │
              ▼                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│ API Gateway Layer (Rust + Axum)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Axum Web Server (Rust)                                     │   │
│  │                                                              │   │
│  │  • HTTP Routing                                             │   │
│  │    - GET  /api/auth/*         (GitHub OAuth)                │   │
│  │    - GET  /api/repositories/* (Repository management)       │   │
│  │    - GET  /api/agents/*       (Agent execution)            │   │
│  │    - GET  /api/workflows/*    (Workflow management)        │   │
│  │    - POST /line/webhook       (LINE Bot webhook)           │   │
│  │                                                              │   │
│  │  • WebSocket Routing                                        │   │
│  │    - WS /ws                    (Real-time updates)          │   │
│  │                                                              │   │
│  │  • Middleware                                               │   │
│  │    - JWT Authentication                                     │   │
│  │    - CORS Headers                                           │   │
│  │    - Request Logging (tracing)                              │   │
│  │    - Rate Limiting                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Business Logic Layer (Rust)                                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────┐  │
│  │   Handlers         │  │   Services         │  │ Integrations│  │
│  │                    │  │                    │  │             │  │
│  │ • auth.rs          │  │ • user_service.rs  │  │ • github.rs │  │
│  │ • repositories.rs  │  │ • agent_service.rs │  │ • line.rs   │  │
│  │ • agents.rs        │  │ • workflow_service │  │ • openai.rs │  │
│  │ • workflows.rs     │  │                    │  │             │  │
│  │ • line.rs          │  │                    │  │             │  │
│  │ • websocket.rs     │  │                    │  │             │  │
│  └────────────────────┘  └────────────────────┘  └─────────────┘  │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Data Layer                                                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────┐         ┌──────────────────────┐      │
│  │  PostgreSQL 15          │         │  Redis Cache         │      │
│  │                         │         │                      │      │
│  │  • web_users            │         │  • Session data      │      │
│  │  • repositories         │         │  • WebSocket conns   │      │
│  │  • agent_executions     │         │  • Rate limiting     │      │
│  │  • workflows            │         │  • GitHub API cache  │      │
│  │  • line_messages        │         │                      │      │
│  │  • websocket_connections│         │                      │      │
│  └─────────────────────────┘         └──────────────────────┘      │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Miyabi Core (Existing Rust Crates)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  • miyabi-a2a         (Agent-to-Agent execution engine)             │
│  • miyabi-agents      (Agent implementations)                       │
│  • miyabi-worktree    (Git Worktree management)                     │
│  • miyabi-types       (Core type definitions)                       │
│  • miyabi-github      (GitHub API client)                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Description

### 1. Client Layer

#### Web Browser (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 + shadcn/ui
- **State Management**: Zustand 4.x
- **Data Fetching**: TanStack Query (React Query) 5.x
- **Workflow Editor**: React Flow (visual workflow builder)
- **Styling**: Tailwind CSS 3.4

**Key Pages**:
- `/login` - GitHub OAuth login
- `/dashboard` - Agent execution overview
- `/workflow/editor` - Visual workflow editor
- `/executions/:id` - Agent execution detail
- `/settings` - User settings

#### LINE App
- **Integration**: LINE Messaging API
- **Features**:
  - Natural language command input
  - Rich Menu for quick actions
  - Push notifications for agent completion

---

### 2. API Gateway Layer (Rust + Axum)

#### Axum Web Server
- **Framework**: Axum 0.7 (async web framework)
- **Features**:
  - HTTP routing for REST API
  - WebSocket support for real-time updates
  - JWT authentication middleware
  - CORS configuration
  - Request logging with `tracing`

**Routes**:
```rust
// REST API
GET  /api/auth/github           // GitHub OAuth redirect
GET  /api/auth/github/callback  // OAuth callback
GET  /api/auth/me               // Current user
POST /api/auth/logout           // Logout

GET  /api/repositories          // List repositories
POST /api/repositories          // Connect repository
DELETE /api/repositories/:id    // Disconnect repository

GET  /api/agents                // List available agents
POST /api/agents/execute        // Execute agent
GET  /api/agents/executions/:id // Agent execution status

GET  /api/workflows             // List workflows
POST /api/workflows             // Create workflow
PUT  /api/workflows/:id         // Update workflow
POST /api/workflows/:id/execute // Execute workflow

// LINE Bot
POST /line/webhook              // LINE webhook

// WebSocket
WS /ws                          // Real-time updates
```

---

### 3. Business Logic Layer

#### Handlers
- HTTP request handlers
- WebSocket connection management
- Request validation
- Response formatting

#### Services
- Business logic implementation
- Agent execution orchestration
- Workflow management
- User management

#### Integrations
- **GitHub API**: Repository and issue management
- **LINE Messaging API**: Bot message handling
- **OpenAI API**: GPT-4 for natural language processing

---

### 4. Data Layer

#### PostgreSQL 15
- Primary data store
- 7 tables (see ER diagram below)
- ACID compliance
- Foreign key constraints

#### Redis
- Session management
- WebSocket connection tracking
- Rate limiting counters
- GitHub API response cache (5-minute TTL)

---

### 5. Miyabi Core

Existing Rust crates that handle agent execution:
- **miyabi-a2a**: Agent execution engine
- **miyabi-agents**: Agent implementations (Coordinator, CodeGen, Review, etc.)
- **miyabi-worktree**: Git Worktree management for parallel execution
- **miyabi-types**: Core type definitions
- **miyabi-github**: GitHub API client

---

## Entity-Relationship Diagram

```
┌─────────────────────┐
│     web_users       │
├─────────────────────┤
│ id (PK)             │
│ github_id (UNIQUE)  │
│ github_username     │
│ email               │
│ avatar_url          │
│ line_user_id        │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│   repositories      │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │◄────────┐
│ github_repo_id      │         │
│ owner               │         │
│ name                │         │
│ full_name           │         │
│ default_branch      │         │
│ is_active           │         │
│ created_at          │         │
│ updated_at          │         │
└──────────┬──────────┘         │
           │                     │
           │ 1:N                 │
           ▼                     │
┌─────────────────────┐         │
│ agent_executions    │         │
├─────────────────────┤         │
│ id (PK)             │         │
│ user_id (FK)        │─────────┘
│ repository_id (FK)  │
│ agent_type          │
│ issue_number        │
│ status              │
│ started_at          │
│ completed_at        │
│ error_message       │
│ result (JSONB)      │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│     workflows       │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │─────────┐
│ repository_id (FK)  │         │
│ name                │         │
│ description         │         │ 1:N
│ definition (JSONB)  │         │
│ is_template         │         │
│ is_public           │         ▼
│ created_at          │   ┌─────────────────────┐
│ updated_at          │   │   web_users         │
└─────────────────────┘   │  (see above)        │
                          └─────────────────────┘
┌─────────────────────┐
│   line_messages     │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │─────────┘
│ line_user_id        │
│ message_type        │
│ message_text        │
│ parsed_intent       │
│ issue_number        │
│ created_at          │
└─────────────────────┘

┌──────────────────────────┐
│ websocket_connections    │
├──────────────────────────┤
│ id (PK)                  │
│ user_id (FK)             │─────────┘
│ connection_id (UNIQUE)   │
│ connected_at             │
│ last_ping_at             │
└──────────────────────────┘
```

---

## Data Flow

### 1. Authentication Flow

```
1. User clicks "Login with GitHub"
2. Browser → GET /api/auth/github
3. API → Redirect to GitHub OAuth
4. GitHub → User authorizes app
5. GitHub → Redirect to /api/auth/github/callback?code=xxx
6. API → Exchange code for access token
7. API → Fetch GitHub user info
8. API → Create/update user in DB
9. API → Generate JWT
10. API → Return JWT to client
11. Client → Store JWT in localStorage
```

### 2. Agent Execution Flow

```
1. User selects Issue → Click "Execute Agent"
2. Client → POST /api/agents/execute
3. API → Validate JWT
4. API → Create agent_execution record (status: pending)
5. API → Spawn async tokio task
6. API → Return 202 Accepted { executionId }
7. Async Task → Call miyabi-a2a agent executor
8. Async Task → Update agent_execution (status: running)
9. Async Task → Broadcast WebSocket event (agent.started)
10. Agent → Execute code generation
11. Async Task → Broadcast WebSocket event (agent.progress 50%)
12. Agent → Complete execution
13. Async Task → Update agent_execution (status: completed, result: {...})
14. Async Task → Broadcast WebSocket event (agent.completed)
15. Client → Receive WebSocket event → Update UI
```

### 3. WebSocket Real-Time Updates

```
1. Client → Connect to wss://api.miyabi.dev/ws?token=<JWT>
2. Server → Validate JWT
3. Server → Send "connected" event
4. Server → Register connection in websocket_connections table
5. Client → Send { type: "subscribe", executionId: "xxx" }
6. Server → Add client to broadcast channel for executionId
7. Agent execution starts
8. Server → Broadcast { type: "agent.started" } to all subscribed clients
9. Agent progresses
10. Server → Broadcast { type: "agent.progress", progress: 50 }
11. Agent completes
12. Server → Broadcast { type: "agent.completed", result: {...} }
13. Client → Receive events → Update UI in real-time
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4
- **Component Library**: shadcn/ui
- **State Management**: Zustand 4.x
- **Data Fetching**: TanStack Query 5.x
- **Forms**: React Hook Form 7.x + Zod
- **Workflow Editor**: React Flow
- **Icons**: lucide-react
- **Charts**: recharts

### Backend
- **Language**: Rust 2021 Edition
- **Web Framework**: Axum 0.7
- **Async Runtime**: Tokio 1.35
- **Database ORM**: SQLx 0.7 (compile-time checked queries)
- **Authentication**: jsonwebtoken 9.2
- **WebSocket**: tokio-tungstenite 0.21
- **Logging**: tracing + tracing-subscriber
- **Serialization**: serde + serde_json
- **Error Handling**: thiserror + anyhow

### Database
- **Primary DB**: PostgreSQL 15
- **Cache**: Redis (Upstash)

### Infrastructure
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Self-hosted (macOS Mac mini) OR Fly.io
- **Database**: AWS RDS PostgreSQL 15 OR Self-hosted
- **CI/CD**: GitHub Actions (Self-hosted Runner)

---

## Deployment Architecture

### Self-Hosted Configuration (Recommended)

```
┌──────────────────────────────────────────┐
│ Mac mini (Local Network)                 │
│                                           │
│ • miyabi-web-api (Rust binary)           │
│ • PostgreSQL 15                           │
│ • Redis                                   │
│ • GitHub Actions Runner                   │
│                                           │
│ IP: 192.168.3.27                         │
└───────────────┬──────────────────────────┘
                │
                │ Reverse Proxy (Caddy/Nginx)
                │ SSL/TLS Termination
                ▼
┌──────────────────────────────────────────┐
│ Public Internet                           │
│ Domain: api.miyabi.dev                    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Vercel (Frontend)                         │
│                                           │
│ • Next.js 14 SSR/SSG                     │
│ • Domain: miyabi.dev                      │
└──────────────────────────────────────────┘
```

### Cloud Configuration (Alternative)

```
┌──────────────────────────────────────────┐
│ Vercel (Frontend)                         │
│ Domain: miyabi.dev                        │
└──────────────────────────────────────────┘
                │
                │ HTTPS
                ▼
┌──────────────────────────────────────────┐
│ Fly.io (Backend)                          │
│ • Rust Docker Container                   │
│ • Domain: api.miyabi.dev                  │
└───────────────┬──────────────────────────┘
                │
                │ PostgreSQL Connection
                ▼
┌──────────────────────────────────────────┐
│ AWS RDS PostgreSQL 15                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ Upstash Redis                             │
└──────────────────────────────────────────┘
```

---

## Security Architecture

### 1. Authentication
- **GitHub OAuth 2.0**: Secure user authentication
- **JWT Tokens**: Stateless authentication
- **Token Expiration**: 7 days (configurable)
- **HTTPS Only**: All API endpoints require HTTPS

### 2. Authorization
- **User Scoping**: All resources scoped to authenticated user
- **Repository Access Control**: Verify GitHub repository access via API
- **Rate Limiting**: 1000 requests/hour per user

### 3. Data Security
- **Password-less**: No passwords stored (GitHub OAuth only)
- **Environment Variables**: Secrets stored in environment variables
- **Database Encryption**: PostgreSQL SSL connections
- **CORS Configuration**: Strict CORS headers

### 4. Input Validation
- **Request Validation**: All inputs validated with Rust type system
- **SQL Injection Prevention**: SQLx compile-time query checking
- **XSS Prevention**: React automatic escaping

---

## Performance Considerations

### 1. Database Optimization
- **Indexes**: Comprehensive index coverage for all query patterns
- **Connection Pooling**: SQLx connection pool (max 10 connections)
- **Query Optimization**: Use EXPLAIN ANALYZE for slow queries

### 2. Caching Strategy
- **Redis Cache**: GitHub API responses (5-minute TTL)
- **Browser Cache**: Static assets via Vercel CDN
- **API Response Caching**: ETag support for GET endpoints

### 3. Scalability
- **Horizontal Scaling**: Stateless API servers (add more instances)
- **Database Read Replicas**: For read-heavy workloads
- **WebSocket Scaling**: Use Redis Pub/Sub for multi-instance WebSocket

---

## Monitoring & Observability

### 1. Logging
- **tracing**: Structured logging with spans
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Log Aggregation**: Export to file or stdout

### 2. Metrics
- **Request Metrics**: Request count, latency, status codes
- **Database Metrics**: Query count, connection pool usage
- **WebSocket Metrics**: Active connections, message count

### 3. Health Checks
- **GET /health**: API health check endpoint
- **Database Ping**: PostgreSQL connection check
- **Redis Ping**: Redis connection check

---

## Future Enhancements

1. **Multi-tenancy**: Organization-level access control
2. **Plugin System**: User-installable agents
3. **Audit Logs**: Comprehensive audit trail
4. **API Gateway**: Kong or Traefik for advanced routing
5. **Observability**: Prometheus + Grafana integration
6. **Mobile App**: React Native mobile app

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-22  
**Maintained By**: Miyabi Team
