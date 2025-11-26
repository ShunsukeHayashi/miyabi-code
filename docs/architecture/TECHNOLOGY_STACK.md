# Miyabi Society - Technology Stack Documentation

**Version**: 1.0.0
**Last Updated**: 2025-11-26
**Related**: ADR 001, Issues #970, #971

---

## Executive Summary

This document defines the complete technology stack for Miyabi Society reconstruction (Phase 0-4).

**Architecture Pattern**: Serverless API + Managed Database + CDN Frontend
**Deployment Model**: AWS Lambda + RDS PostgreSQL + CloudFront
**Development Methodology**: Incremental reconstruction with zero downtime

---

## Backend Stack

### 1. Web Framework

**Choice**: Axum 0.7
**Repository**: https://github.com/tokio-rs/axum

**Rationale**:
- ✅ Already implemented in `crates/miyabi-web-api`
- ✅ Built on Tokio (async runtime)
- ✅ Type-safe routing
- ✅ Excellent performance (comparable to Actix-web)
- ✅ Tower middleware ecosystem

**Key Features**:
```rust
// Example: Type-safe routing
use axum::{Router, extract::State, Json};

async fn handler(
    State(state): State<AppState>,
    Json(payload): Json<CreateTask>,
) -> Result<Json<Task>, ApiError> {
    // Handler logic
}

let app = Router::new()
    .route("/tasks", post(handler))
    .with_state(state);
```

**Dependencies**:
```toml
[dependencies]
axum = { version = "0.7", features = ["macros"] }
tower = "0.5"
tower-http = { version = "0.6", features = ["cors", "trace"] }
```

---

### 2. Database

**Choice**: PostgreSQL 15 (AWS RDS)
**Deployment**: db.t3.small (2 vCPU, 2GB RAM)

**Rationale**:
- ✅ Schema already designed (`crates/miyabi-a2a/src/models`)
- ✅ Superior for complex queries (JOIN, aggregations, window functions)
- ✅ ACID compliance for audit logs
- ✅ Row-level security for multi-tenancy
- ✅ Cost-effective at scale vs Firebase

**Cost Comparison** (100k operations/month):
| Provider | Cost |
|----------|------|
| PostgreSQL (RDS) | $24/mo (fixed) + $0 (queries) |
| Firestore | $60/mo (reads) + $18/mo (writes) |
| DynamoDB | $25/mo (reads) + $12/mo (writes) |

**Winner**: PostgreSQL (3x cheaper)

**Schema Highlights**:
```sql
-- Multi-tenancy support
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RBAC implementation
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    permissions JSONB NOT NULL
);

-- Task management
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id),
    assignee_id UUID REFERENCES users(id),
    status TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON tasks
    USING (organization_id = current_setting('app.current_org_id')::UUID);
```

---

### 3. ORM / Database Access

**Choice**: SQLx 0.8
**Repository**: https://github.com/launchbadge/sqlx

**Rationale**:
- ✅ Already integrated in codebase
- ✅ Compile-time checked SQL
- ✅ Zero-cost abstractions
- ✅ Native async support
- ✅ Connection pooling built-in

**vs Diesel**:
| Feature | SQLx | Diesel |
|---------|------|--------|
| Compile-time safety | ✅ (via macros) | ✅ (via type system) |
| Async support | ✅ Native | ❌ (requires diesel-async) |
| Learning curve | Low | High |
| Performance | Excellent | Excellent |

**Example Usage**:
```rust
// Compile-time checked query
let tasks = sqlx::query_as!(
    Task,
    r#"
    SELECT id, title, status, created_at
    FROM tasks
    WHERE organization_id = $1 AND status = $2
    "#,
    org_id,
    status
)
.fetch_all(&pool)
.await?;
```

**Connection Pool Configuration**:
```rust
let pool = sqlx::postgres::PgPoolOptions::new()
    .max_connections(20)
    .acquire_timeout(Duration::from_secs(3))
    .connect(&database_url)
    .await?;
```

---

### 4. Authentication

**Choice**: JWT + GitHub OAuth 2.0
**Implementation**: Already in `crates/miyabi-a2a/src/auth`

**Flow**:
```
User → GitHub OAuth → Callback → Issue JWT → Subsequent requests use JWT
```

**JWT Claims**:
```rust
#[derive(Serialize, Deserialize)]
struct Claims {
    sub: Uuid,              // User ID
    org: Uuid,              // Organization ID
    role: String,           // User role
    exp: usize,             // Expiration timestamp
    iat: usize,             // Issued at
}
```

**Security**:
- ✅ HS256 algorithm (symmetric signing)
- ✅ Short expiration (15 minutes)
- ✅ Refresh token rotation
- ✅ Revocation list (Redis)

**Dependencies**:
```toml
[dependencies]
jsonwebtoken = "9"
oauth2 = "4"
```

---

### 5. API Documentation

**Choice**: utoipa 5.4 (OpenAPI 3.0)
**Repository**: https://github.com/juhaku/utoipa

**Rationale**:
- ✅ Auto-generate OpenAPI spec from Rust code
- ✅ Swagger UI built-in
- ✅ Type-safe API definitions
- ✅ Compile-time validation

**Example**:
```rust
use utoipa::{OpenApi, ToSchema};

#[derive(Serialize, Deserialize, ToSchema)]
struct CreateTaskRequest {
    #[schema(example = "Implement feature X")]
    title: String,

    #[schema(example = "pending")]
    status: TaskStatus,
}

#[utoipa::path(
    post,
    path = "/api/tasks",
    request_body = CreateTaskRequest,
    responses(
        (status = 201, description = "Task created", body = Task),
        (status = 400, description = "Invalid input")
    )
)]
async fn create_task(/* ... */) {}

#[derive(OpenApi)]
#[openapi(paths(create_task), components(schemas(CreateTaskRequest, Task)))]
struct ApiDoc;
```

**Swagger UI**: Available at `https://api.miyabi.dev/swagger-ui/`

---

### 6. Deployment Platform

**Choice**: AWS Lambda + API Gateway
**Runtime**: Custom Runtime (Rust binary)

**Rationale**:
- ✅ Serverless (no server management)
- ✅ Auto-scaling (0 to 1000s of concurrent executions)
- ✅ Pay-per-use ($0.20 per 1M requests)
- ✅ Cold start < 100ms (with optimization)

**Lambda Configuration**:
```yaml
FunctionName: miyabi-api
Runtime: provided.al2023
Architecture: arm64          # Graviton2 (20% cheaper)
MemorySize: 512             # MB
Timeout: 30                 # seconds
ReservedConcurrentExecutions: 10  # Provisioned for critical endpoints
Environment:
  DATABASE_URL: !Ref RDSConnectionString
  JWT_SECRET: !Ref JWTSecret
```

**API Gateway**:
```yaml
Type: AWS::ApiGatewayV2::Api
Properties:
  Name: miyabi-api-gateway
  ProtocolType: HTTP
  CorsConfiguration:
    AllowOrigins: ['https://miyabi.dev']
    AllowMethods: ['GET', 'POST', 'PUT', 'DELETE']
```

**Cold Start Optimization**:
- Use Rust (fast startup vs Node.js/Python)
- Provisioned concurrency for critical paths
- Connection pooling with RDS Proxy
- Minimal dependencies

---

## Frontend Stack

### 1. Framework

**Choice**: Next.js 15
**Repository**: apps/pantheon-webapp
**Deployment**: S3 + CloudFront

**Features**:
- ✅ React Server Components
- ✅ App Router
- ✅ Static Site Generation (SSG)
- ✅ Incremental Static Regeneration (ISR)
- ✅ API Routes (for BFF pattern)

**Project Structure**:
```
apps/pantheon-webapp/
├── app/
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── login/page.tsx            # Auth flow
│   └── layout.tsx                # Global layout
├── components/
│   └── dashboard/
│       ├── TaskManager.tsx
│       └── RecentActivity.tsx
├── lib/
│   ├── api-client.ts             # API wrapper
│   └── websocket-client.ts       # Real-time updates
└── public/
    └── assets/
```

**Dependencies**:
```json
{
  "dependencies": {
    "next": "15.1.7",
    "react": "19.0.0",
    "tailwindcss": "4.1.17",
    "swr": "2.3.3"
  }
}
```

---

### 2. State Management

**Choice**: SWR (stale-while-revalidate)
**Repository**: https://swr.vercel.app/

**Rationale**:
- ✅ Built by Vercel (Next.js creators)
- ✅ Optimistic UI out of box
- ✅ Auto-revalidation
- ✅ Cache management
- ✅ TypeScript support

**Example**:
```typescript
import useSWR from 'swr';

function TaskList() {
  const { data, error, mutate } = useSWR('/api/tasks', fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <ul>
      {data.map(task => <li key={task.id}>{task.title}</li>)}
    </ul>
  );
}
```

**vs Redux**:
| Feature | SWR | Redux |
|---------|-----|-------|
| Boilerplate | Low | High |
| Learning curve | Easy | Steep |
| Server state | ✅ Native | ❌ (need middleware) |
| Cache management | ✅ Built-in | ❌ (manual) |

---

### 3. UI Library

**Choice**: Tailwind CSS 4.1
**Repository**: https://tailwindcss.com/

**Rationale**:
- ✅ Utility-first CSS
- ✅ Rapid prototyping
- ✅ Consistent design system
- ✅ Excellent tree-shaking (small bundle)

**Custom Theme**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'miyabi-primary': '#1E40AF',
        'miyabi-secondary': '#8B5CF6',
        'miyabi-accent': '#10B981',
      },
    },
  },
};
```

---

### 4. Real-time Updates

**Choice**: WebSocket (via API Gateway WebSocket API)
**Alternative**: Server-Sent Events (SSE)

**Architecture**:
```
Frontend (WebSocket) <--> API Gateway WebSocket <--> Lambda Handler <--> RDS
```

**Client Code**:
```typescript
const ws = new WebSocket('wss://ws.miyabi.dev');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  mutate('/api/tasks'); // Revalidate SWR cache
};
```

**Server Code**:
```rust
// Broadcast task update to all connected clients
async fn broadcast_update(task: &Task, connections: &ConnectionPool) {
    for conn_id in connections.iter() {
        gateway_client
            .post_to_connection(conn_id, serde_json::to_vec(&task)?)
            .await?;
    }
}
```

---

### 5. Deployment

**Choice**: S3 + CloudFront
**Build**: Next.js Static Export

**Pipeline**:
```yaml
name: Deploy Frontend
on:
  push:
    branches: [main]
    paths: ['apps/pantheon-webapp/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: aws s3 sync out/ s3://miyabi-frontend/
      - run: aws cloudfront create-invalidation --distribution-id $DIST_ID
```

**CloudFront Configuration**:
```yaml
Type: AWS::CloudFront::Distribution
Properties:
  DistributionConfig:
    Enabled: true
    Origins:
      - Id: S3Origin
        DomainName: miyabi-frontend.s3.amazonaws.com
    DefaultCacheBehavior:
      ViewerProtocolPolicy: redirect-to-https
      Compress: true
      CachePolicyId: !Ref CacheOptimizedPolicy
```

---

## Infrastructure Stack

### 1. Infrastructure as Code

**Choice**: AWS CDK (TypeScript)
**Alternative**: Terraform (if multi-cloud)

**Rationale**:
- ✅ Type-safe infrastructure
- ✅ Better AWS integration
- ✅ Reusable constructs
- ✅ CloudFormation under the hood

**Example**:
```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';

class MiyabiStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // PostgreSQL database
    const db = new rds.DatabaseInstance(this, 'MiyabiDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
    });

    // Lambda API
    const api = new lambda.Function(this, 'MiyabiAPI', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      code: lambda.Code.fromAsset('../target/lambda/bootstrap.zip'),
      handler: 'bootstrap',
      environment: {
        DATABASE_URL: db.secret!.secretValueFromJson('connectionString').toString(),
      },
    });
  }
}
```

---

### 2. Monitoring

**Choice**: AWS CloudWatch + Grafana Cloud (optional)

**Metrics**:
- API latency (p50, p95, p99)
- Error rate
- Database connections
- Lambda cold starts
- Cache hit rate

**Alarms**:
```yaml
Type: AWS::CloudWatch::Alarm
Properties:
  AlarmName: HighErrorRate
  MetricName: Errors
  Namespace: AWS/Lambda
  Threshold: 10
  EvaluationPeriods: 2
  AlarmActions: [!Ref SNSTopic]
```

---

### 3. CI/CD

**Choice**: GitHub Actions
**Repository**: `.github/workflows/`

**Pipelines**:
1. **Backend CI** (`rust-ci.yml`):
   - Cargo test
   - Cargo clippy
   - Cargo fmt
   - Deploy to Lambda (on main branch)

2. **Frontend CI** (`pantheon-ci.yml`):
   - npm test
   - npm build
   - Deploy to S3 (on main branch)

**Deployment Stages**:
```
PR → CI Tests → Merge to main → Build → Deploy to Staging → Integration Tests → Deploy to Prod
```

---

## Cost Breakdown

### Monthly Infrastructure Costs

| Service | Configuration | Cost |
|---------|--------------|------|
| **Database** | RDS PostgreSQL db.t3.small | $24/mo |
| **API** | Lambda (1M requests/mo) | $20/mo |
| **Frontend** | S3 + CloudFront | $5/mo |
| **Monitoring** | CloudWatch | $3/mo |
| **Total** | | **$52/mo** |

### Scaling Estimates

| Users | Requests/mo | Database | Lambda | Frontend | Total |
|-------|-------------|----------|--------|----------|-------|
| 100 | 1M | $24 | $20 | $5 | $52 |
| 1,000 | 10M | $50 | $200 | $10 | $260 |
| 10,000 | 100M | $200 | $2,000 | $50 | $2,250 |

---

## Development Tools

### Required Tools

```bash
# Backend
rustup 1.28+
cargo 1.91+
sqlx-cli 0.8+

# Frontend
node 20+
npm 10+

# Infrastructure
aws-cli 2.0+
aws-cdk 2.0+

# Database
postgresql-client 15+
```

### Local Development Setup

```bash
# 1. Install dependencies
cargo build
npm ci

# 2. Start local PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:15

# 3. Run migrations
sqlx migrate run

# 4. Start API server
cargo run --bin miyabi-api

# 5. Start frontend dev server
cd apps/pantheon-webapp && npm run dev
```

---

## Security Considerations

### Backend
- ✅ JWT with short expiration
- ✅ HTTPS only
- ✅ CORS restrictions
- ✅ SQL injection prevention (SQLx)
- ✅ Rate limiting (API Gateway)
- ✅ Secrets in AWS Secrets Manager

### Frontend
- ✅ XSS protection (React escapes by default)
- ✅ CSRF tokens
- ✅ CSP headers
- ✅ HTTPOnly cookies
- ✅ SameSite cookie attribute

### Database
- ✅ Row-level security
- ✅ Encrypted at rest (AWS RDS)
- ✅ Encrypted in transit (TLS)
- ✅ Least privilege access
- ✅ Audit logging

---

## Future Considerations

### Phase 5+ (Post-Launch)

**Caching Layer**:
- Redis for session storage
- Edge caching with CloudFront

**Search**:
- OpenSearch for full-text search
- Embedding search with Qdrant

**Analytics**:
- ClickHouse for time-series data
- Grafana for visualization

**Multi-region**:
- RDS read replicas
- Lambda@Edge

---

**Last Updated**: 2025-11-26
**Next Review**: After Phase 1 completion
**Maintainer**: Layer 2 - Orchestrator
