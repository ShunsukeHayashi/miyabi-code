# Miyabi Marketplace Database Migrations

## Overview

This directory contains SQL migration scripts for the Miyabi Marketplace database schema.

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `001_initial_schema.sql` | Core marketplace tables (users, plugins, subscriptions, etc.) | ✅ Applied |
| `002_row_level_security.sql` | Row-level security policies for all tables | ✅ Applied |
| `003_web_ui_schema.sql` | Web UI platform tables (web_users, repositories, etc.) | ✅ Applied |
| `004_fix_github_id_type.sql` | Fix github_id column type to BIGINT | ✅ Applied |
| `006_rbac_permissions.sql` | RBAC system (permissions, roles, organizations) | ✅ Applied |
| `007_custom_table_template.sql` | Template for adding custom tables | 📝 Template |

## Migration Naming Convention

### Main Database Migrations (`database/migrations/`)

- **Format**: `NNN_descriptive_name.sql`
- **Numbering**: Sequential (001, 002, 003, ...)
- **Rollback**: `NNN_descriptive_name.down.sql` (optional)

### Web API Migrations (`crates/miyabi-web-api/migrations/`)

- **Format**: `YYYYMMDDHHMMSS_descriptive_name.sql`
- **Framework**: SQLx migrations
- **Rollback**: `YYYYMMDDHHMMSS_descriptive_name.down.sql` (optional)

## How to Create a New Migration

### Step 1: Choose Migration Type

Decide which database needs the migration:
- **Marketplace DB**: `database/migrations/` (this directory)
- **Web API DB**: `crates/miyabi-web-api/migrations/`

### Step 2: Use Template

For Marketplace DB, copy the template:

```bash
# Copy template
cp database/migrations/007_custom_table_template.sql \
   database/migrations/008_your_feature_name.sql

# Copy rollback template
cp database/migrations/007_custom_table_template.down.sql \
   database/migrations/008_your_feature_name.down.sql
```

### Step 3: Customize the Migration

Edit the new migration file:

1. **Update metadata**: Change version, date, description
2. **Rename tables**: Replace `custom_table` with your table name
3. **Customize columns**: Add/remove/modify columns as needed
4. **Update constraints**: Modify CHECK constraints for your use case
5. **Adjust indexes**: Add indexes for your query patterns
6. **Update comments**: Document your tables and columns

### Step 4: Apply Migration

#### For Marketplace DB (PostgreSQL):

```bash
# Connect to database
psql -h <host> -U <user> -d <database>

# Apply migration
\i database/migrations/008_your_feature_name.sql
```

#### For Web API DB (SQLx):

```bash
# Create new migration
sqlx migrate add your_feature_name

# Apply migrations
sqlx migrate run
```

## Migration Template Features

The template (`007_custom_table_template.sql`) includes:

### Core Features

- ✅ UUID primary key
- ✅ Foreign key references (user_id, organization_id)
- ✅ Status field with CHECK constraint
- ✅ JSON fields (metadata, config) for flexible data
- ✅ Boolean flags (is_active, is_public, is_archived)
- ✅ Timestamps (created_at, updated_at, deleted_at)
- ✅ Soft delete support

### Performance

- ✅ Comprehensive indexes (primary, composite, JSONB)
- ✅ GIN index for JSON querying
- ✅ Partial index for soft deletes

### Automation

- ✅ Auto-update trigger for `updated_at`
- ✅ Table and column comments
- ✅ Migration verification script

### Optional Features

- ⚪ Many-to-many relationship table example
- ⚪ Custom function example
- ⚪ Row-level security policies (commented)
- ⚪ Sample data for testing (commented)

## Common Migration Patterns

### 1. Add a New Table

Use the template as-is, customize column names and constraints.

### 2. Add a Column to Existing Table

```sql
ALTER TABLE existing_table
ADD COLUMN new_column VARCHAR(255);

-- Add index if needed
CREATE INDEX idx_existing_table_new_column
ON existing_table(new_column);

-- Add comment
COMMENT ON COLUMN existing_table.new_column IS 'Description';
```

### 3. Modify Column Type

```sql
-- Change column type
ALTER TABLE existing_table
ALTER COLUMN column_name TYPE BIGINT;

-- Update comment if needed
COMMENT ON COLUMN existing_table.column_name IS 'Updated description';
```

### 4. Add Index for Performance

```sql
-- Single column index
CREATE INDEX idx_table_column ON table_name(column_name);

-- Composite index
CREATE INDEX idx_table_col1_col2 ON table_name(col1, col2);

-- JSONB GIN index
CREATE INDEX idx_table_jsonb ON table_name USING GIN(jsonb_column);

-- Partial index
CREATE INDEX idx_table_active
ON table_name(status) WHERE is_active = true;
```

### 5. Add Foreign Key

```sql
-- Add foreign key constraint
ALTER TABLE child_table
ADD CONSTRAINT fk_child_parent
FOREIGN KEY (parent_id)
REFERENCES parent_table(id)
ON DELETE CASCADE;

-- Add index for foreign key
CREATE INDEX idx_child_parent ON child_table(parent_id);
```

## Best Practices

### 1. Always Include Comments

```sql
COMMENT ON TABLE table_name IS 'Clear description of purpose';
COMMENT ON COLUMN table_name.column_name IS 'What this column stores';
```

### 2. Use Consistent Naming

- **Tables**: `snake_case`, plural (e.g., `custom_tables`)
- **Columns**: `snake_case` (e.g., `user_id`)
- **Indexes**: `idx_table_column` (e.g., `idx_users_email`)
- **Functions**: `snake_case_verb` (e.g., `get_active_users`)
- **Triggers**: `trg_table_event` (e.g., `trg_users_updated_at`)

### 3. Add Verification

```sql
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_name = 'new_table';

    IF table_count = 0 THEN
        RAISE EXCEPTION 'Migration failed: table not created';
    END IF;

    RAISE NOTICE 'Migration complete';
END $$;
```

### 4. Include Rollback Script

Always create a `.down.sql` file for complex migrations.

### 5. Test Before Production

1. Test on development database
2. Test rollback script
3. Review with team
4. Apply to staging
5. Apply to production

## Migration Dependencies

### Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Fuzzy text search (optional)
```

### Required Functions

The following functions should exist (from earlier migrations):

- `trigger_set_updated_at()` - Auto-update updated_at timestamp
- `update_plugin_rating()` - Recalculate plugin ratings
- `increment_usage()` - Atomic usage increment
- `increment_agent_execution()` - Agent execution tracking

## Troubleshooting

### Issue: Migration fails with "relation already exists"

**Solution**: Check if migration was already applied

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Issue: Foreign key constraint violation

**Solution**: Ensure referenced table exists and has data

```sql
-- Check if parent table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'parent_table';

-- Check if parent records exist
SELECT COUNT(*) FROM parent_table;
```

### Issue: Index creation takes too long

**Solution**: Create index concurrently (doesn't lock table)

```sql
CREATE INDEX CONCURRENTLY idx_large_table_column
ON large_table(column_name);
```

## Related Documentation

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLx Migration Guide](https://github.com/launchbadge/sqlx/blob/main/sqlx-cli/README.md)
- [Miyabi Architecture](../../docs/architecture/)

## Support

For migration issues or questions:

1. Check existing migrations for similar patterns
2. Review PostgreSQL logs for error details
3. Create an issue in the project repository
4. Contact the Miyabi development team

---

**Last Updated**: 2025-11-29
**Maintainer**: Miyabi Development Team
