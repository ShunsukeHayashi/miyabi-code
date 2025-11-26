# Phase 1: Database Foundation Implementation Plan

**Phase**: 1 of 4
**Duration**: Week 3-4 (2 weeks)
**Effort**: 60-80 hours
**Priority**: P0 (Critical Path)
**Dependencies**: Phase 0 completion
**Related**: Issue #970, ADR 001

---

## Executive Summary

Phase 1 establishes the complete database foundation for Miyabi Society, including:
- AWS RDS PostgreSQL provisioning
- Base schema migration
- Organization/Team multi-tenancy
- RBAC (Role-Based Access Control)
- Connection pooling optimization

**Success Criteria**: 100% operational database layer with full test coverage

---

## Timeline Breakdown

### Week 3: PostgreSQL Setup + Base Schema (30-40h)

#### Day 1-2: AWS RDS Provisioning (8-10h)
- Provision RDS PostgreSQL 15 db.t3.small
- Configure security groups
- Setup parameter groups
- Enable automated backups
- Configure monitoring

#### Day 3-4: Base Schema Migration (12-16h)
- Migrate core tables (users, tasks, logs)
- Create indexes
- Setup foreign keys
- Add constraints
- Write migration tests

#### Day 5: Connection Pool Optimization (10-14h)
- Implement SQLx connection pool
- Configure RDS Proxy (optional)
- Test connection limits
- Benchmark query performance

### Week 4: Multi-tenancy + RBAC (30-40h)

#### Day 1-2: Organization Schema (12-16h)
- Organizations table
- Teams table
- Organization-user relationships
- Row-level security policies

#### Day 3-4: RBAC Implementation (12-16h)
- Roles table
- Permissions table
- Role-permission relationships
- Policy enforcement functions

#### Day 5: Testing + Documentation (6-8h)
- Integration tests
- Performance benchmarks
- Schema documentation
- Migration guide

---

## Detailed Task Breakdown

### Task 1.1: AWS RDS Provisioning

**Goal**: Production-ready PostgreSQL instance

**Infrastructure as Code** (using AWS CDK):
```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class MiyabiDatabaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // VPC for database
    const vpc = new ec2.Vpc(this, 'MiyabiVPC', {
      maxAzs: 2,  // Multi-AZ for high availability
    });

    // Security group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for Miyabi RDS',
      allowAllOutbound: true,
    });

    // Allow Lambda to access database
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from Lambda'
    );

    // RDS instance
    const db = new rds.DatabaseInstance(this, 'MiyabiDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_6,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      multiAz: false,  // Single-AZ for cost savings (upgrade to multi-AZ in production)
      allocatedStorage: 20,  // GB
      maxAllocatedStorage: 100,  // Auto-scaling up to 100GB
      storageType: rds.StorageType.GP3,
      deletionProtection: true,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',  // UTC
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      parameterGroup: new rds.ParameterGroup(this, 'MiyabiDBParams', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_6,
        }),
        parameters: {
          'shared_preload_libraries': 'pg_stat_statements',
          'log_statement': 'all',
          'log_min_duration_statement': '1000',  // Log slow queries (> 1s)
        },
      }),
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: db.dbInstanceEndpointAddress,
    });

    new cdk.CfnOutput(this, 'DatabaseSecret', {
      value: db.secret!.secretArn,
    });
  }
}
```

**Deployment**:
```bash
cd infrastructure/
npm install
npx cdk bootstrap
npx cdk deploy MiyabiDatabaseStack
```

**Validation**:
```bash
# Test connection
psql -h <rds-endpoint> -U postgres -d miyabi

# Check version
SELECT version();

# Verify extensions
SELECT * FROM pg_available_extensions;
```

---

### Task 1.2: Base Schema Migration

**Goal**: Core tables with proper relationships

**Schema Structure**:
```
users
  ├─> tasks (assignee)
  ├─> organizations (via org_users)
  └─> audit_logs (actor)

organizations
  ├─> teams
  ├─> tasks
  └─> org_users

tasks
  ├─> task_dependencies (parent/child)
  └─> task_history (audit trail)
```

**Migration File** (`migrations/001_base_schema.sql`):
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id BIGINT UNIQUE NOT NULL,
    github_login TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_email ON users(email);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Organization-User relationships
CREATE TABLE org_users (
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX idx_org_users_user_id ON org_users(user_id);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_teams_org_id ON teams(organization_id);

-- Team-User relationships
CREATE TABLE team_users (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('lead', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_org_id ON tasks(organization_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Task dependencies
CREATE TABLE task_dependencies (
    parent_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    child_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('blocks', 'related')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (parent_task_id, child_task_id),
    CHECK (parent_task_id != child_task_id)
);

-- Task history (audit log)
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_created_at ON task_history(created_at DESC);

-- Audit logs (system-wide)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Updated trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Migration Command**:
```bash
sqlx migrate add base_schema
sqlx migrate run
```

**Validation**:
```sql
-- Test data insertion
INSERT INTO users (github_id, github_login, email, name)
VALUES (123456, 'testuser', 'test@example.com', 'Test User')
RETURNING *;

INSERT INTO organizations (name, slug)
VALUES ('Test Org', 'test-org')
RETURNING *;

-- Verify relationships
SELECT u.name, o.name AS organization
FROM users u
JOIN org_users ou ON u.id = ou.user_id
JOIN organizations o ON ou.organization_id = o.id;
```

---

### Task 1.3: RBAC Implementation

**Goal**: Fine-grained permission system

**RBAC Schema** (`migrations/002_rbac.sql`):
```sql
-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_roles_org_id ON roles(organization_id);

-- User-Role relationships
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Permission check function
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_org_id UUID,
    p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
          AND r.organization_id = p_org_id
          AND r.permissions @> jsonb_build_array(p_permission)::jsonb
    ) INTO has_perm;

    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Default roles
INSERT INTO roles (organization_id, name, description, permissions, is_system)
SELECT
    o.id,
    'Admin',
    'Full administrative access',
    '["*"]'::jsonb,
    TRUE
FROM organizations o;

INSERT INTO roles (organization_id, name, description, permissions, is_system)
SELECT
    o.id,
    'Developer',
    'Can create and manage tasks',
    '["tasks:read", "tasks:write", "tasks:delete"]'::jsonb,
    TRUE
FROM organizations o;

INSERT INTO roles (organization_id, name, description, permissions, is_system)
SELECT
    o.id,
    'Viewer',
    'Read-only access',
    '["tasks:read", "users:read"]'::jsonb,
    TRUE
FROM organizations o;
```

**Permission List**:
```json
{
  "global": ["*"],
  "tasks": ["tasks:read", "tasks:write", "tasks:delete", "tasks:assign"],
  "users": ["users:read", "users:write", "users:delete", "users:invite"],
  "teams": ["teams:read", "teams:write", "teams:delete", "teams:manage_members"],
  "roles": ["roles:read", "roles:write", "roles:delete", "roles:assign"]
}
```

**Rust Integration** (`crates/miyabi-web-api/src/rbac.rs`):
```rust
use sqlx::PgPool;
use uuid::Uuid;

pub struct RbacService {
    pool: PgPool,
}

impl RbacService {
    pub async fn check_permission(
        &self,
        user_id: Uuid,
        org_id: Uuid,
        permission: &str,
    ) -> Result<bool, sqlx::Error> {
        let result: bool = sqlx::query_scalar(
            "SELECT user_has_permission($1, $2, $3)"
        )
        .bind(user_id)
        .bind(org_id)
        .bind(permission)
        .fetch_one(&self.pool)
        .await?;

        Ok(result)
    }

    pub async fn get_user_permissions(
        &self,
        user_id: Uuid,
        org_id: Uuid,
    ) -> Result<Vec<String>, sqlx::Error> {
        let permissions: Vec<String> = sqlx::query_scalar(
            r#"
            SELECT DISTINCT jsonb_array_elements_text(r.permissions)
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = $1 AND r.organization_id = $2
            "#
        )
        .bind(user_id)
        .bind(org_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(permissions)
    }
}
```

---

### Task 1.4: Row-Level Security (RLS)

**Goal**: Automatic tenant isolation

**RLS Policies** (`migrations/003_rls.sql`):
```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Set current organization context
CREATE OR REPLACE FUNCTION set_current_organization(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_org_id', p_org_id::text, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Policy: Users can only see tasks in their organization
CREATE POLICY org_isolation_tasks ON tasks
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY org_isolation_teams ON teams
    USING (organization_id = current_setting('app.current_org_id')::UUID);

CREATE POLICY org_isolation_audit_logs ON audit_logs
    USING (organization_id = current_setting('app.current_org_id')::UUID);

-- Bypass RLS for service role (used by background jobs)
CREATE ROLE miyabi_service;
GRANT ALL ON ALL TABLES IN SCHEMA public TO miyabi_service;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;  -- Enforce even for table owner
```

**Rust Usage**:
```rust
// Set organization context for connection
sqlx::query("SELECT set_current_organization($1)")
    .bind(org_id)
    .execute(&pool)
    .await?;

// All subsequent queries are automatically filtered by org_id
let tasks = sqlx::query_as!(Task, "SELECT * FROM tasks")
    .fetch_all(&pool)
    .await?;
```

---

### Task 1.5: Connection Pool Optimization

**Goal**: Minimize cold starts, maximize throughput

**Configuration** (`crates/miyabi-web-api/src/db.rs`):
```rust
use sqlx::postgres::{PgPoolOptions, PgConnectOptions};
use std::time::Duration;

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let options = database_url
        .parse::<PgConnectOptions>()?
        .application_name("miyabi-api")
        .statement_cache_capacity(100);

    let pool = PgPoolOptions::new()
        .max_connections(20)                    // Max concurrent connections
        .min_connections(2)                      // Keep-alive connections
        .acquire_timeout(Duration::from_secs(3)) // Fail fast
        .idle_timeout(Duration::from_secs(300))  // Close idle after 5min
        .max_lifetime(Duration::from_secs(1800)) // Recycle after 30min
        .connect_with(options)
        .await?;

    Ok(pool)
}
```

**RDS Proxy (Optional)**:
```typescript
// AWS CDK
const proxy = new rds.DatabaseProxy(this, 'MiyabiDBProxy', {
  proxyTarget: rds.ProxyTarget.fromInstance(db),
  secrets: [db.secret!],
  vpc,
  requireTLS: true,
  idleClientTimeout: cdk.Duration.minutes(5),
});

// Lambda uses proxy endpoint instead of RDS directly
const proxyEndpoint = proxy.endpoint;
```

**Benefits of RDS Proxy**:
- ✅ Connection pooling at AWS level
- ✅ Reduces Lambda cold start time
- ✅ Better handling of connection storms
- ✅ Automatic failover

---

## Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[sqlx::test]
    async fn test_create_organization(pool: PgPool) {
        let org = Organization {
            name: "Test Org".to_string(),
            slug: "test-org".to_string(),
            ..Default::default()
        };

        let result = create_organization(&pool, org).await;
        assert!(result.is_ok());
    }

    #[sqlx::test]
    async fn test_rbac_permission_check(pool: PgPool) {
        let user_id = create_test_user(&pool).await;
        let org_id = create_test_org(&pool).await;
        let role = create_admin_role(&pool, org_id).await;
        assign_role(&pool, user_id, role.id).await;

        let has_perm = check_permission(&pool, user_id, org_id, "tasks:write").await;
        assert!(has_perm.unwrap());
    }

    #[sqlx::test]
    async fn test_row_level_security(pool: PgPool) {
        let org1 = create_test_org(&pool).await;
        let org2 = create_test_org(&pool).await;
        let task1 = create_test_task(&pool, org1.id).await;
        let task2 = create_test_task(&pool, org2.id).await;

        // Set context to org1
        set_current_organization(&pool, org1.id).await;

        let tasks = sqlx::query_as!(Task, "SELECT * FROM tasks")
            .fetch_all(&pool)
            .await
            .unwrap();

        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].id, task1.id);
    }
}
```

### Integration Tests

```rust
#[tokio::test]
async fn test_full_api_workflow() {
    let pool = setup_test_db().await;

    // 1. Create organization
    let org = create_organization(&pool, "Test Org").await.unwrap();

    // 2. Create user
    let user = create_user(&pool, "testuser", "test@example.com").await.unwrap();

    // 3. Add user to organization
    add_user_to_org(&pool, user.id, org.id, "admin").await.unwrap();

    // 4. Create task
    let task = create_task(&pool, org.id, user.id, "Test Task").await.unwrap();

    // 5. Update task status
    update_task_status(&pool, task.id, "completed").await.unwrap();

    // 6. Verify audit log
    let logs = get_audit_logs(&pool, org.id).await.unwrap();
    assert_eq!(logs.len(), 3);  // org_created, task_created, task_updated
}
```

### Performance Benchmarks

```bash
# Run benchmarks
cargo bench --bench database_bench

# Expected results:
# - Task creation: < 10ms
# - Task query (100 results): < 50ms
# - Permission check: < 5ms
# - RLS overhead: < 2ms
```

---

## Success Criteria Checklist

**Phase 1 Completion**:
- [ ] RDS PostgreSQL instance provisioned
- [ ] All migrations executed successfully
- [ ] RBAC system functional
- [ ] Row-level security enabled
- [ ] Connection pool optimized
- [ ] 100% test coverage for database layer
- [ ] Performance benchmarks met
- [ ] Documentation complete

**Performance Targets**:
- [ ] Task creation: < 10ms p95
- [ ] Task query: < 50ms p95 (100 results)
- [ ] Permission check: < 5ms p95
- [ ] Connection pool acquisition: < 5ms p95

**Quality Targets**:
- [ ] 100% test coverage for RBAC
- [ ] Zero SQL injection vulnerabilities
- [ ] Zero data leakage between organizations
- [ ] All foreign keys properly indexed

---

## Risks and Mitigation

### Risk 1: Migration Failures
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Test migrations in staging
  - Automated rollback procedures
  - Backup before migration

### Risk 2: RLS Performance Impact
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**:
  - Benchmark with RLS enabled/disabled
  - Optimize policies if needed
  - Consider selective RLS (only sensitive tables)

### Risk 3: Connection Pool Exhaustion
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Monitor connection metrics
  - Implement circuit breaker
  - Use RDS Proxy for better pooling

---

## Next Steps (Phase 2)

After Phase 1 completion:
1. Backend API implementation
2. Lambda deployment
3. API Gateway configuration
4. WebSocket integration

---

**Last Updated**: 2025-11-26
**Status**: Ready for implementation
**Next Review**: After Week 3 completion
