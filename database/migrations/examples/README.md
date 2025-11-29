# Migration Examples

This directory contains example migration scripts demonstrating common patterns and use cases for the Miyabi Marketplace database.

## Available Examples

### 1. Plugin Dependencies (`example_plugin_dependencies.sql`)

**Use Case**: Track and enforce plugin dependencies and version compatibility

**Features**:
- Plugin dependency relationships
- Version constraints (minimum, maximum, exact)
- Dependency types (required, optional, recommended, conflict)
- Recursive dependency tree queries
- Dependency validation functions

**When to Use**:
- Building a plugin marketplace with dependencies
- Enforcing version compatibility
- Preventing circular dependencies
- Showing dependency graphs to users

**Key Functions**:
- `check_plugin_dependencies(plugin_id)` - Verify all dependencies are satisfied
- `get_plugin_dependency_tree(plugin_id, max_depth)` - Get complete dependency tree

**Example Usage**:
```sql
-- Add a dependency
INSERT INTO plugin_dependencies (
    plugin_id,
    required_plugin_id,
    minimum_version,
    dependency_type
) VALUES (
    'miyabi-advanced-features',
    'miyabi-core',
    '2.0.0',
    'required'
);

-- Check if dependencies are satisfied
SELECT * FROM check_plugin_dependencies('miyabi-advanced-features');

-- Get dependency tree
SELECT * FROM get_plugin_dependency_tree('miyabi-advanced-features', 3);
```

---

### 2. Audit Logs / Activity Tracking (`example_audit_logs.sql`)

**Use Case**: Comprehensive audit trail for security, compliance, and analytics

**Features**:
- Complete action logging (who, what, when, where)
- Change tracking (before/after states)
- Security event monitoring
- Request/session tracking
- Automatic cleanup of old logs
- Performance-optimized indexes

**When to Use**:
- Compliance requirements (SOC 2, GDPR, HIPAA)
- Security monitoring and threat detection
- User activity analytics
- Debugging and troubleshooting
- Forensic analysis

**Key Functions**:
- `log_user_action(user_id, action, resource_type, resource_id, metadata)` - Quick logging
- `get_user_activity_summary(user_id, days)` - Activity summary
- `get_security_events(organization_id, hours)` - Security monitoring
- `cleanup_old_audit_logs(retention_days)` - Maintenance

**Key Views**:
- `recent_audit_errors` - Recent errors (last 7 days)
- `daily_activity_stats` - Daily activity statistics

**Example Usage**:
```sql
-- Log a user action
SELECT log_user_action(
    '123e4567-e89b-12d3-a456-426614174000',
    'plugin.install',
    'subscription',
    'sub_abc123',
    '456e7890-e89b-12d3-a456-426614174000',
    '{"payment_method": "stripe", "amount": 2999}'::jsonb
);

-- Get user activity summary (last 30 days)
SELECT * FROM get_user_activity_summary(
    '123e4567-e89b-12d3-a456-426614174000',
    30
);

-- Get security events (last 24 hours)
SELECT * FROM get_security_events(
    '456e7890-e89b-12d3-a456-426614174000',
    24
);

-- View recent errors
SELECT * FROM recent_audit_errors LIMIT 10;

-- Cleanup old logs (keep 1 year)
SELECT cleanup_old_audit_logs(365);
```

---

### 3. Notification System (`example_notifications.sql`)

**Use Case**: Multi-channel notification delivery with user preferences

**Features**:
- Reusable notification templates
- Multi-channel delivery (email, webhook, LINE, Slack, SMS, push)
- User notification preferences
- Delivery tracking and retry logic
- Digest mode (batch notifications)
- Quiet hours support
- Template variable substitution
- Read/unread tracking

**When to Use**:
- User notifications and alerts
- System-to-user communication
- Multi-channel marketing
- Real-time event notifications
- Transactional emails

**Key Tables**:
- `notification_templates` - Reusable templates
- `user_notification_preferences` - User preferences
- `notifications` - Individual notifications
- `notification_deliveries` - Delivery attempts per channel

**Key Functions**:
- `create_notification_from_template(user_id, template_code, variables)` - Create notification
- `mark_notification_read(notification_id, user_id)` - Mark as read
- `get_unread_count(user_id)` - Get unread count

**Example Usage**:
```sql
-- Create a notification from template
SELECT create_notification_from_template(
    '123e4567-e89b-12d3-a456-426614174000',  -- user_id
    'plugin.installed',                        -- template_code
    '{"plugin_name": "Miyabi Pro", "version": "2.0.0"}'::jsonb,  -- variables
    '456e7890-e89b-12d3-a456-426614174000',  -- organization_id
    'high'                                     -- priority
);

-- Mark notification as read
SELECT mark_notification_read(
    'notif_id_here',
    'user_id_here'
);

-- Get unread count
SELECT get_unread_count('user_id_here');

-- Get user's unread notifications
SELECT id, subject, body, created_at, priority
FROM notifications
WHERE user_id = 'user_id_here'
  AND read_at IS NULL
  AND deleted_at IS NULL
ORDER BY priority DESC, created_at DESC;
```

---

## How to Use These Examples

### Step 1: Review the Example

Read through the example migration file to understand:
- What tables are created
- What indexes are added
- What functions/triggers are included
- Sample data and usage patterns

### Step 2: Customize for Your Needs

Copy the example and modify:
```bash
# Copy example to new migration
cp database/migrations/examples/example_audit_logs.sql \
   database/migrations/008_audit_logs.sql
```

Customize:
1. Update migration number and metadata
2. Adjust table names if needed
3. Add/remove columns for your use case
4. Modify constraints and indexes
5. Update comments and documentation

### Step 3: Test Locally

Test the migration on a development database:
```bash
# Connect to dev database
psql -h localhost -U dev_user -d dev_miyabi

# Run migration
\i database/migrations/008_audit_logs.sql

# Verify
\dt audit_logs
\df *audit*
```

### Step 4: Create Rollback Script

Create corresponding `.down.sql` file:
```sql
-- 008_audit_logs.down.sql
DROP VIEW IF EXISTS recent_audit_errors CASCADE;
DROP VIEW IF EXISTS daily_activity_stats CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_audit_logs(INTEGER);
DROP FUNCTION IF EXISTS get_security_events(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_activity_summary(UUID, INTEGER);
DROP FUNCTION IF EXISTS log_user_action(UUID, VARCHAR, VARCHAR, TEXT, UUID, JSONB);
DROP TABLE IF EXISTS audit_logs CASCADE;
```

### Step 5: Apply to Production

After testing:
1. Review with team
2. Apply to staging
3. Monitor for issues
4. Apply to production
5. Monitor performance

---

## Combining Multiple Examples

You can combine features from multiple examples into a single migration:

```sql
-- 008_comprehensive_features.sql
-- Combining audit logs + notifications

-- From example_audit_logs.sql
CREATE TABLE audit_logs (...);
CREATE FUNCTION log_user_action(...);

-- From example_notifications.sql
CREATE TABLE notification_templates (...);
CREATE TABLE notifications (...);

-- Integration: Send notification when security event is logged
CREATE OR REPLACE FUNCTION notify_on_security_event()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity IN ('error', 'critical') AND NEW.action LIKE '%security%' THEN
        PERFORM create_notification_from_template(
            NEW.user_id,
            'security.alert',
            jsonb_build_object(
                'alert_type', NEW.action,
                'alert_details', NEW.error_message
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_security_notification
    AFTER INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_security_event();
```

---

## Performance Considerations

### Index Selection

Each example includes comprehensive indexes. Review and adjust based on your query patterns:

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('audit_logs', 'notifications', 'plugin_dependencies')
ORDER BY idx_scan;

-- Drop unused indexes
DROP INDEX IF EXISTS idx_rarely_used;
```

### Table Partitioning

For high-volume tables (like `audit_logs`), consider partitioning:

```sql
-- Partition by month
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');
```

### Maintenance

Schedule regular maintenance:

```sql
-- Weekly: Analyze tables
ANALYZE audit_logs;
ANALYZE notifications;

-- Monthly: Cleanup old data
SELECT cleanup_old_audit_logs(365);

-- Quarterly: Reindex
REINDEX TABLE CONCURRENTLY audit_logs;
```

---

## Common Patterns

### Pattern 1: Soft Deletes

```sql
-- Add deleted_at column
deleted_at TIMESTAMP,

-- Index for active records
CREATE INDEX idx_table_active ON table_name(id)
    WHERE deleted_at IS NULL;

-- Query active records
SELECT * FROM table_name WHERE deleted_at IS NULL;
```

### Pattern 2: Audit Trail

```sql
-- Add audit columns
created_at TIMESTAMP DEFAULT NOW(),
created_by UUID REFERENCES web_users(id),
updated_at TIMESTAMP DEFAULT NOW(),
updated_by UUID REFERENCES web_users(id),

-- Auto-update trigger
CREATE TRIGGER trg_table_updated_at
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();
```

### Pattern 3: JSONB Querying

```sql
-- JSONB column
metadata JSONB DEFAULT '{}',

-- GIN index for queries
CREATE INDEX idx_table_metadata ON table_name USING GIN(metadata);

-- Query examples
SELECT * FROM table_name WHERE metadata @> '{"key": "value"}';
SELECT * FROM table_name WHERE metadata ? 'key_name';
SELECT * FROM table_name WHERE metadata->>'key' = 'value';
```

### Pattern 4: Many-to-Many Relationships

```sql
-- Junction table
CREATE TABLE table_a_table_b (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_a_id UUID NOT NULL REFERENCES table_a(id) ON DELETE CASCADE,
    table_b_id UUID NOT NULL REFERENCES table_b(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(table_a_id, table_b_id)
);

-- Indexes
CREATE INDEX idx_a_b_a ON table_a_table_b(table_a_id);
CREATE INDEX idx_a_b_b ON table_a_table_b(table_b_id);
```

---

## Troubleshooting

### Issue: Function already exists

```sql
-- Use CREATE OR REPLACE
CREATE OR REPLACE FUNCTION function_name(...) ...

-- Or drop first
DROP FUNCTION IF EXISTS function_name(...);
CREATE FUNCTION function_name(...) ...
```

### Issue: Constraint violation

```sql
-- Check existing data
SELECT column_name, COUNT(*)
FROM table_name
GROUP BY column_name
HAVING COUNT(*) > 1;

-- Fix duplicates before adding UNIQUE constraint
```

### Issue: Migration timeout

```sql
-- Create indexes concurrently (non-blocking)
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);

-- Add foreign keys without validation, then validate
ALTER TABLE table_name
    ADD CONSTRAINT fk_name
    FOREIGN KEY (column) REFERENCES other_table(id)
    NOT VALID;

ALTER TABLE table_name
    VALIDATE CONSTRAINT fk_name;
```

---

## Additional Resources

- [Main Migration README](../README.md)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
- [PostgreSQL Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Miyabi Architecture Docs](../../../docs/architecture/)

---

**Last Updated**: 2025-11-29
**Examples**: 3 (Plugin Dependencies, Audit Logs, Notifications)
