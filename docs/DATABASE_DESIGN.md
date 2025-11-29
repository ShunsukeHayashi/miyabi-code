# Miyabi Database Design Documentation

**Version**: 2.0
**Last Updated**: 2025-11-29
**Status**: Production-Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [PostgreSQL Schema](#postgresql-schema)
3. [DynamoDB Schema](#dynamodb-schema)
4. [Connection Pool Configuration](#connection-pool-configuration)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 1. Overview

### Database Architecture

Miyabi uses a **hybrid database architecture**:

- **PostgreSQL**: Relational data (users, repositories, workflows, subscriptions)
- **DynamoDB**: High-throughput, low-latency data (events, logs, real-time state)

### Design Principles

1. **Data Consistency**: PostgreSQL for ACID transactions
2. **High Availability**: DynamoDB for distributed, scalable storage
3. **Cost Optimization**: Right-size connection pools and indexes
4. **Security First**: Row-Level Security (RLS) + encryption at rest

---

## 2. PostgreSQL Schema

### 2.1 Schema Overview

**Database**: `miyabi_production`
**Version**: PostgreSQL 15+
**Total Tables**: 18
**Total Indexes**: 45+
**Total RLS Policies**: 34

### 2.2 Core Tables

#### 2.2.1 User & Authentication

##### `users` - User Accounts (Marketplace)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  stripe_customer_id TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
```

##### `web_users` - Web UI Users (GitHub OAuth)

```sql
CREATE TABLE web_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id INTEGER UNIQUE NOT NULL,
  github_username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  line_user_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_web_users_github_id ON web_users(github_id);
CREATE INDEX idx_web_users_github_username ON web_users(github_username);
CREATE INDEX idx_web_users_line_user_id ON web_users(line_user_id);
```

**Rationale**: Separate tables for marketplace users and web UI users to avoid tight coupling. Future plan: merge via user federation.

#### 2.2.2 Plugin Marketplace

##### `plugins` - Available Plugins

```sql
CREATE TABLE plugins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  source TEXT NOT NULL,
  version TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise', 'addon')),
  price INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly', 'one-time')),
  author_id UUID REFERENCES users(id),
  description TEXT,
  features JSONB,
  limitations JSONB,
  categories TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  downloads INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  requires_plugin TEXT,
  trial_period INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plugins_tier ON plugins(tier);
CREATE INDEX idx_plugins_verified ON plugins(verified);
CREATE INDEX idx_plugins_featured ON plugins(featured);
CREATE INDEX idx_plugins_categories ON plugins USING GIN(categories);
CREATE INDEX idx_plugins_downloads ON plugins(downloads DESC);
CREATE INDEX idx_plugins_rating ON plugins(rating DESC);
```

**Design Notes**:
- `price` is stored in cents (integer) to avoid floating-point precision issues
- `features` and `limitations` are JSONB for flexible schema
- `categories` is TEXT[] for multi-category support
- GIN index on `categories` for fast array searches

##### `subscriptions` - User Subscriptions

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plugin_id TEXT REFERENCES plugins(id) NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL,
  license_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trial')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plugin_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plugin_id ON subscriptions(plugin_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

**Design Notes**:
- `UNIQUE(user_id, plugin_id)` prevents duplicate subscriptions
- `license_key` is JWT for offline validation
- `status` enum ensures data integrity

#### 2.2.3 Usage Tracking

##### `usage_events` - Individual Events

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plugin_id TEXT REFERENCES plugins(id) NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_events_user_plugin ON usage_events(user_id, plugin_id, created_at DESC);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
```

##### `usage_aggregates` - Monthly Rollups

```sql
CREATE TABLE usage_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  plugin_id TEXT REFERENCES plugins(id) NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM format
  issues INTEGER DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  agent_executions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, plugin_id, period)
);

CREATE INDEX idx_usage_aggregates_period ON usage_aggregates(user_id, plugin_id, period);
```

**Design Rationale**:
- `usage_events`: Raw events for detailed analytics
- `usage_aggregates`: Pre-aggregated for fast billing queries
- `UNIQUE(user_id, plugin_id, period)` enables atomic upserts

#### 2.2.4 Web UI & Agent Orchestration

##### `repositories` - Connected GitHub Repositories

```sql
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
  github_repo_id INTEGER UNIQUE NOT NULL,
  owner VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  default_branch VARCHAR(255) DEFAULT 'main',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_repositories_is_active ON repositories(is_active);
```

##### `agent_executions` - Agent Execution History

```sql
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL,
  issue_number INTEGER,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_agent_type CHECK (
    agent_type IN ('Coordinator', 'CodeGen', 'Review', 'Deployment', 'PR', 'Issue')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('pending', 'running', 'completed', 'failed')
  )
);

CREATE INDEX idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX idx_agent_executions_repository_id ON agent_executions(repository_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_agent_type ON agent_executions(agent_type);
CREATE INDEX idx_agent_executions_created_at ON agent_executions(created_at DESC);
CREATE INDEX idx_agent_executions_user_repo_status ON agent_executions(user_id, repository_id, status);
```

**Design Notes**:
- Composite index `idx_agent_executions_user_repo_status` optimizes common query pattern
- `CHECK` constraints ensure data validity
- `result` is JSONB for flexible output schema

##### `workflows` - React Flow Workflow Definitions

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_repository_id ON workflows(repository_id);
CREATE INDEX idx_workflows_is_template ON workflows(is_template);
CREATE INDEX idx_workflows_is_public ON workflows(is_public);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
```

#### 2.2.5 LINE Bot Integration

##### `line_messages` - LINE Message Logs

```sql
CREATE TABLE line_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
  line_user_id VARCHAR(255) NOT NULL,
  message_type VARCHAR(20) NOT NULL,
  message_text TEXT,
  parsed_intent VARCHAR(50),
  issue_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_message_type CHECK (
    message_type IN ('text', 'postback', 'image', 'video', 'audio', 'file', 'location', 'sticker')
  )
);

CREATE INDEX idx_line_messages_user_id ON line_messages(user_id);
CREATE INDEX idx_line_messages_line_user_id ON line_messages(line_user_id);
CREATE INDEX idx_line_messages_created_at ON line_messages(created_at DESC);
CREATE INDEX idx_line_messages_issue_number ON line_messages(issue_number);
```

#### 2.2.6 Real-time Connections

##### `websocket_connections` - Active WebSocket Connections

```sql
CREATE TABLE websocket_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
  connection_id VARCHAR(255) UNIQUE NOT NULL,
  connected_at TIMESTAMP DEFAULT NOW(),
  last_ping_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_websocket_connections_user_id ON websocket_connections(user_id);
CREATE INDEX idx_websocket_connections_connection_id ON websocket_connections(connection_id);
CREATE INDEX idx_websocket_connections_last_ping ON websocket_connections(last_ping_at);
```

**Design Notes**:
- `last_ping_at` enables automatic stale connection cleanup
- `connection_id` is unique for idempotent reconnections

### 2.3 Database Functions (RPC)

#### `increment_usage` - Atomic Usage Tracking

```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_plugin_id TEXT,
  p_period TEXT,
  p_metric TEXT,
  p_increment INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_aggregates (user_id, plugin_id, period, issues, tokens)
  VALUES (
    p_user_id,
    p_plugin_id,
    p_period,
    CASE WHEN p_metric = 'issues' THEN p_increment ELSE 0 END,
    CASE WHEN p_metric = 'tokens' THEN p_increment ELSE 0 END
  )
  ON CONFLICT (user_id, plugin_id, period)
  DO UPDATE SET
    issues = usage_aggregates.issues + (CASE WHEN p_metric = 'issues' THEN p_increment ELSE 0 END),
    tokens = usage_aggregates.tokens + (CASE WHEN p_metric = 'tokens' THEN p_increment ELSE 0 END),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

**Usage**:
```sql
SELECT increment_usage(
  'user-uuid'::uuid,
  'miyabi-operations-pro',
  '2025-11',
  'issues',
  1
);
```

#### `increment_agent_execution` - Track Agent Runs

```sql
CREATE OR REPLACE FUNCTION increment_agent_execution(
  p_user_id UUID,
  p_plugin_id TEXT,
  p_period TEXT,
  p_agent_name TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_aggregates (user_id, plugin_id, period, agent_executions)
  VALUES (
    p_user_id,
    p_plugin_id,
    p_period,
    jsonb_build_object(p_agent_name, 1)
  )
  ON CONFLICT (user_id, plugin_id, period)
  DO UPDATE SET
    agent_executions = jsonb_set(
      COALESCE(usage_aggregates.agent_executions, '{}'::jsonb),
      ARRAY[p_agent_name],
      to_jsonb(COALESCE((usage_aggregates.agent_executions->>p_agent_name)::integer, 0) + 1)
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 2.4 Row Level Security (RLS)

**Enabled on all tables**. Key policies:

#### Users Table

```sql
-- Users can view their own data
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

#### Subscriptions Table

```sql
-- Users can view their own subscriptions
CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert subscriptions (for purchase flow)
CREATE POLICY "subscriptions_insert_service"
  ON subscriptions FOR INSERT
  WITH CHECK (true);
```

**Total RLS Policies**: 34 across all tables.

---

## 3. DynamoDB Schema

### 3.1 Overview

**Use Cases**:
- High-frequency event logging (100k+ events/sec)
- Real-time agent state management
- WebSocket message queues
- Distributed task coordination

**Design Principles**:
- **Single-table design** for related entities
- **GSI (Global Secondary Indexes)** for query patterns
- **TTL** for automatic data expiration
- **DynamoDB Streams** for event-driven architecture

### 3.2 Table: `MiyabiEvents`

#### Primary Key Design

```
PK: EVENT#{event_type}#{timestamp}
SK: {entity_id}#{sub_entity_id}
```

**Example**:
```
PK: EVENT#agent_execution#2025-11-29T10:30:00Z
SK: user#abc123#repo#xyz456
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String | Partition Key |
| `SK` | String | Sort Key |
| `event_type` | String | `agent_execution`, `usage_event`, `webhook` |
| `user_id` | String | User UUID |
| `repository_id` | String | Repository UUID |
| `timestamp` | Number | Unix timestamp (milliseconds) |
| `data` | Map | Event-specific data (JSONB equivalent) |
| `ttl` | Number | Expiration timestamp (auto-delete after 90 days) |

#### GSI 1: User Events Index

```
GSI1PK: USER#{user_id}
GSI1SK: {timestamp}
```

**Query Pattern**: Get all events for a specific user, ordered by time.

#### GSI 2: Repository Events Index

```
GSI2PK: REPO#{repository_id}
GSI2SK: {timestamp}
```

**Query Pattern**: Get all events for a specific repository.

#### Sample Item

```json
{
  "PK": "EVENT#agent_execution#2025-11-29T10:30:00Z",
  "SK": "user#abc-123#repo#xyz-456",
  "event_type": "agent_execution",
  "user_id": "abc-123",
  "repository_id": "xyz-456",
  "agent_type": "Coordinator",
  "timestamp": 1732877400000,
  "data": {
    "issue_number": 123,
    "status": "completed",
    "duration_ms": 5430,
    "tasks_completed": 12
  },
  "ttl": 1740653400
}
```

### 3.3 Table: `MiyabiAgentState`

**Purpose**: Distributed state management for running agents

#### Primary Key Design

```
PK: AGENT#{agent_id}
SK: STATE#{timestamp}
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String | Partition Key |
| `SK` | String | Sort Key |
| `agent_id` | String | Unique agent execution ID |
| `status` | String | `pending`, `running`, `completed`, `failed` |
| `current_task` | String | Current task description |
| `progress` | Number | Percentage (0-100) |
| `state_data` | Map | Agent-specific state |
| `updated_at` | Number | Last update timestamp |
| `ttl` | Number | Auto-expire after completion + 7 days |

#### Sample Item

```json
{
  "PK": "AGENT#exec-12345",
  "SK": "STATE#1732877400000",
  "agent_id": "exec-12345",
  "status": "running",
  "current_task": "Running test suite",
  "progress": 65,
  "state_data": {
    "files_processed": 12,
    "tests_passed": 45,
    "tests_failed": 2
  },
  "updated_at": 1732877400000,
  "ttl": 1733482200
}
```

### 3.4 Table: `MiyabiWebSocketMessages`

**Purpose**: Persistent WebSocket message queue

#### Primary Key Design

```
PK: CONNECTION#{connection_id}
SK: {timestamp}
```

#### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `PK` | String | Partition Key |
| `SK` | Number | Sort Key (timestamp) |
| `connection_id` | String | WebSocket connection ID |
| `message_type` | String | `execution_update`, `notification`, `ping` |
| `payload` | Map | Message payload |
| `delivered` | Boolean | Delivery status |
| `ttl` | Number | Auto-expire after 24 hours |

#### GSI: Undelivered Messages Index

```
GSI1PK: CONNECTION#{connection_id}
GSI1SK: {delivered}#{timestamp}
```

**Query Pattern**: Get all undelivered messages for a connection.

### 3.5 Cost Optimization

**Provisioned Capacity**:
- `MiyabiEvents`: On-Demand (bursty traffic)
- `MiyabiAgentState`: Provisioned (5 WCU, 10 RCU + Auto Scaling)
- `MiyabiWebSocketMessages`: On-Demand

**Auto Scaling Configuration** (MiyabiAgentState):
```
Min Capacity: 5 WCU / 10 RCU
Max Capacity: 100 WCU / 200 RCU
Target Utilization: 70%
```

**TTL Settings**:
- Events: 90 days
- Agent State: 7 days after completion
- WebSocket Messages: 24 hours

**Estimated Monthly Cost** (10M events/month):
- MiyabiEvents: $25
- MiyabiAgentState: $15
- MiyabiWebSocketMessages: $10
- **Total**: ~$50/month

---

## 4. Connection Pool Configuration

### 4.1 PostgreSQL Connection Pool

#### Production Configuration

```rust
// crates/miyabi-web-api/src/database/pool.rs

use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;

pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: Duration,
    pub idle_timeout: Option<Duration>,
    pub max_lifetime: Option<Duration>,
    pub acquire_timeout: Duration,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: std::env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            max_connections: std::env::var("DB_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "20".to_string())
                .parse()
                .unwrap_or(20),
            min_connections: std::env::var("DB_MIN_CONNECTIONS")
                .unwrap_or_else(|_| "5".to_string())
                .parse()
                .unwrap_or(5),
            connect_timeout: Duration::from_secs(
                std::env::var("DB_CONNECT_TIMEOUT")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .unwrap_or(10),
            ),
            idle_timeout: Some(Duration::from_secs(600)), // 10 minutes
            max_lifetime: Some(Duration::from_secs(1800)), // 30 minutes
            acquire_timeout: Duration::from_secs(5),
        }
    }
}

pub async fn create_pool(config: DatabaseConfig) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(config.max_connections)
        .min_connections(config.min_connections)
        .acquire_timeout(config.acquire_timeout)
        .idle_timeout(config.idle_timeout)
        .max_lifetime(config.max_lifetime)
        .connect_timeout(config.connect_timeout)
        .test_before_acquire(true) // Health check before returning connection
        .connect(&config.url)
        .await
}
```

#### Environment Variables

```bash
# .env

# Database URL (required)
DATABASE_URL=postgresql://user:password@localhost:5432/miyabi_production

# Connection Pool Settings
DB_MAX_CONNECTIONS=20          # Max concurrent connections
DB_MIN_CONNECTIONS=5           # Min idle connections
DB_CONNECT_TIMEOUT=10          # Timeout for new connections (seconds)
DB_ACQUIRE_TIMEOUT=5           # Timeout for acquiring from pool (seconds)

# Connection Lifecycle
DB_IDLE_TIMEOUT=600            # Close idle connections after 10 min
DB_MAX_LIFETIME=1800           # Close connections after 30 min
```

#### Tuning Guidelines

**AWS RDS (db.t3.medium - 2 vCPU, 4GB RAM)**:
- Max Connections: 20-30
- Min Connections: 5
- Recommended for: 100-500 concurrent users

**AWS RDS (db.m5.large - 2 vCPU, 8GB RAM)**:
- Max Connections: 50-100
- Min Connections: 10
- Recommended for: 500-2000 concurrent users

**AWS RDS (db.m5.xlarge - 4 vCPU, 16GB RAM)**:
- Max Connections: 100-200
- Min Connections: 20
- Recommended for: 2000-5000 concurrent users

**Formula**:
```
max_connections = (available_memory_mb / 10) * 0.8
```

Example: 4GB RAM = 4096MB / 10 = 409 * 0.8 = ~327 connections

**PostgreSQL Configuration**:
```sql
-- postgresql.conf
max_connections = 200
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 5MB
maintenance_work_mem = 256MB
```

### 4.2 DynamoDB Client Configuration

#### Rust Configuration

```rust
// crates/miyabi-web-api/src/database/dynamodb.rs

use aws_sdk_dynamodb::{Client, Config};
use aws_config::meta::region::RegionProviderChain;
use std::time::Duration;

pub struct DynamoDBConfig {
    pub region: String,
    pub endpoint: Option<String>, // For local testing
    pub timeout: Duration,
    pub max_attempts: u32,
}

impl Default for DynamoDBConfig {
    fn default() -> Self {
        Self {
            region: std::env::var("AWS_REGION")
                .unwrap_or_else(|_| "ap-northeast-1".to_string()),
            endpoint: std::env::var("DYNAMODB_ENDPOINT").ok(),
            timeout: Duration::from_secs(5),
            max_attempts: 3,
        }
    }
}

pub async fn create_dynamodb_client(config: DynamoDBConfig) -> Client {
    let region_provider = RegionProviderChain::first_try(Some(config.region.clone()))
        .or_default_provider()
        .or_else("ap-northeast-1");

    let mut aws_config_builder = aws_config::from_env()
        .region(region_provider)
        .timeout_config(
            aws_sdk_dynamodb::config::timeout::Config::builder()
                .operation_timeout(config.timeout)
                .build(),
        )
        .retry_config(
            aws_sdk_dynamodb::config::retry::RetryConfig::standard()
                .with_max_attempts(config.max_attempts),
        );

    // Override endpoint for local testing
    if let Some(endpoint) = config.endpoint {
        aws_config_builder = aws_config_builder
            .endpoint_url(endpoint);
    }

    let aws_config = aws_config_builder.load().await;
    Client::new(&aws_config)
}
```

#### Environment Variables

```bash
# .env

# AWS Region
AWS_REGION=ap-northeast-1

# DynamoDB Endpoint (optional, for local testing)
# DYNAMODB_ENDPOINT=http://localhost:8000

# AWS Credentials (use IAM role in production)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Timeouts & Retries
DYNAMODB_TIMEOUT=5             # Operation timeout (seconds)
DYNAMODB_MAX_ATTEMPTS=3        # Max retry attempts
```

#### Best Practices

1. **Use IAM Roles** (not access keys) in production
2. **Enable Point-in-Time Recovery (PITR)** for backups
3. **Set up CloudWatch Alarms** for throttling
4. **Use BatchWriteItem** for bulk operations (25 items/batch)
5. **Implement exponential backoff** for retries

#### Connection Pooling

**Note**: DynamoDB SDK uses HTTP connection pooling internally (via Hyper). No manual pool configuration needed.

**Internal Defaults**:
- Max idle connections: 9
- Idle timeout: 90 seconds
- Keep-alive: Enabled

**Custom Configuration** (if needed):

```rust
use hyper::client::HttpConnector;
use hyper_rustls::HttpsConnector;

let https = HttpsConnectorBuilder::new()
    .with_native_roots()
    .https_or_http()
    .enable_http1()
    .enable_http2()
    .build();

let hyper_client = hyper::Client::builder()
    .pool_idle_timeout(Duration::from_secs(90))
    .pool_max_idle_per_host(10)
    .build(https);

// Pass to DynamoDB client builder
```

---

## 5. Performance Optimization

### 5.1 Query Optimization Patterns

#### Pattern 1: Avoid N+1 Queries

**❌ Bad (N+1)**:
```rust
let users = get_all_users(&pool).await?;
for user in users {
    let repos = get_user_repositories(&pool, user.id).await?; // N queries
}
```

**✅ Good (JOIN)**:
```rust
let users_with_repos = sqlx::query_as::<_, (User, Vec<Repository>)>(
    r#"
    SELECT
        u.id, u.name, u.email,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', r.id,
                    'name', r.name,
                    'owner', r.owner
                )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'
        ) as repositories
    FROM users u
    LEFT JOIN repositories r ON r.user_id = u.id
    GROUP BY u.id
    "#
)
.fetch_all(&pool)
.await?;
```

#### Pattern 2: Use Composite Indexes

```sql
-- Bad: Separate indexes
CREATE INDEX idx_user ON agent_executions(user_id);
CREATE INDEX idx_status ON agent_executions(status);

-- Good: Composite index for combined queries
CREATE INDEX idx_user_status_created
  ON agent_executions(user_id, status, created_at DESC);
```

**Query**:
```sql
SELECT * FROM agent_executions
WHERE user_id = $1 AND status = 'running'
ORDER BY created_at DESC
LIMIT 20;
```

Uses composite index for optimal performance.

#### Pattern 3: Pagination with Cursors

**❌ Bad (OFFSET)**:
```sql
SELECT * FROM agent_executions
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000; -- Scans 1000 rows to skip
```

**✅ Good (Cursor)**:
```sql
SELECT * FROM agent_executions
WHERE created_at < $1 -- Last seen timestamp
ORDER BY created_at DESC
LIMIT 20;
```

#### Pattern 4: Bulk Operations

**❌ Bad (Loop)**:
```rust
for event in events {
    sqlx::query("INSERT INTO usage_events ...")
        .bind(event.user_id)
        .execute(&pool)
        .await?; // N round trips
}
```

**✅ Good (Bulk Insert)**:
```rust
let mut query = String::from(
    "INSERT INTO usage_events (user_id, plugin_id, event_type, created_at) VALUES "
);

for (i, event) in events.iter().enumerate() {
    if i > 0 { query.push(','); }
    query.push_str(&format!(
        "('{}', '{}', '{}', NOW())",
        event.user_id, event.plugin_id, event.event_type
    ));
}

sqlx::query(&query).execute(&pool).await?; // 1 round trip
```

### 5.2 Index Strategy

#### Recommended Indexes

**Users & Authentication**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_web_users_github_id ON web_users(github_id);
```

**Agent Executions** (most critical):
```sql
CREATE INDEX idx_agent_executions_user_repo_status
  ON agent_executions(user_id, repository_id, status);

CREATE INDEX idx_agent_executions_created_at
  ON agent_executions(created_at DESC);
```

**Usage Tracking**:
```sql
CREATE INDEX idx_usage_aggregates_period
  ON usage_aggregates(user_id, plugin_id, period);
```

**JSONB Indexes**:
```sql
-- Full-text search on plugin features
CREATE INDEX idx_plugins_features ON plugins USING GIN(features);

-- Query: Find plugins with specific feature
SELECT * FROM plugins
WHERE features @> '{"api_access": true}'::jsonb;
```

### 5.3 Monitoring & Alerting

#### Key Metrics (CloudWatch / Datadog)

**PostgreSQL**:
- `DatabaseConnections` (should be < 80% of max)
- `CPUUtilization` (alert if > 80%)
- `FreeableMemory` (alert if < 500MB)
- `ReadLatency` / `WriteLatency` (alert if > 100ms p99)
- `DeadlockCount` (alert if > 0)

**DynamoDB**:
- `ConsumedReadCapacityUnits` / `ConsumedWriteCapacityUnits`
- `UserErrors` (alert if > 10/min)
- `SystemErrors` (alert if > 0)
- `ThrottledRequests` (alert if > 5/min)

#### SQL Performance Analysis

```sql
-- Find slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public';
```

---

## 6. Monitoring & Maintenance

### 6.1 Backup Strategy

#### PostgreSQL

**Automated Backups** (AWS RDS):
- Retention: 7 days
- Backup window: 03:00-04:00 UTC
- Snapshots: Daily

**Manual Snapshots**:
```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier miyabi-production \
  --db-snapshot-identifier miyabi-manual-2025-11-29

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier miyabi-restored \
  --db-snapshot-identifier miyabi-manual-2025-11-29
```

#### DynamoDB

**Point-in-Time Recovery (PITR)**:
- Enabled on all tables
- Restore to any point within last 35 days

**On-Demand Backups**:
```bash
# Create backup
aws dynamodb create-backup \
  --table-name MiyabiEvents \
  --backup-name MiyabiEvents-2025-11-29

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name MiyabiEvents-Restored \
  --backup-arn arn:aws:dynamodb:region:account:table/MiyabiEvents/backup/01234567890
```

### 6.2 Migration Strategy

**PostgreSQL Migrations** (SQLx):
```bash
# Create new migration
sqlx migrate add create_new_table

# Run migrations
sqlx migrate run

# Revert last migration
sqlx migrate revert
```

**DynamoDB Schema Evolution**:
- **Backward compatible**: Add new attributes (no migration needed)
- **Breaking changes**: Create new table + dual-write + migrate + switch

### 6.3 Disaster Recovery

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 5 minutes

**Runbook**:
1. Detect outage (CloudWatch alarm)
2. Promote read replica (PostgreSQL) or restore from PITR (DynamoDB)
3. Update DNS / load balancer
4. Verify data integrity
5. Post-mortem analysis

---

## 7. Security

### 7.1 Encryption

- **At Rest**: AES-256 (AWS RDS / DynamoDB KMS)
- **In Transit**: TLS 1.2+ (enforced)

### 7.2 Access Control

**PostgreSQL**:
- Row-Level Security (RLS) enabled
- Service role for API (bypasses RLS)
- `authenticated` role for users (RLS enforced)

**DynamoDB**:
- IAM policies (least privilege)
- VPC endpoints for private access

### 7.3 Secrets Management

**AWS Secrets Manager**:
```bash
# Store database password
aws secretsmanager create-secret \
  --name miyabi/database/password \
  --secret-string "super-secret-password"

# Retrieve in application
DATABASE_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id miyabi/database/password \
  --query SecretString \
  --output text)
```

---

## 8. Appendix

### 8.1 Full Schema DDL

See:
- `/database/migrations/001_initial_schema.sql`
- `/database/migrations/002_row_level_security.sql`
- `/database/migrations/003_web_ui_schema.sql`

### 8.2 Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ subscriptions : has
    users ||--o{ licenses : owns
    users ||--o{ usage_events : generates
    plugins ||--o{ subscriptions : offered
    plugins ||--o{ plugin_reviews : receives
    web_users ||--o{ repositories : connects
    web_users ||--o{ agent_executions : triggers
    repositories ||--o{ agent_executions : runs
    repositories ||--o{ workflows : defines
```

### 8.3 Change Log

- **2025-11-29**: Initial comprehensive design document
- **2025-10-24**: Added Web UI schema (003_web_ui_schema.sql)
- **2025-10-11**: Initial marketplace schema (001, 002)

---

**Document Status**: ✅ Complete
**Next Review**: 2025-12-31
**Maintained By**: Miyabi Database Team

