#!/bin/bash
# Miyabi Data Warehouse - Load Initial Dimensions
# Version: 1.0.0

set -e

# Configuration
DB_NAME="${MIYABI_DW_DB:-miyabi_dw}"
DB_USER="${MIYABI_DW_USER:-postgres}"
DB_HOST="${MIYABI_DW_HOST:-localhost}"
DB_PORT="${MIYABI_DW_PORT:-5432}"

echo "========================================"
echo "Miyabi DW - Initial Dimension Load"
echo "========================================"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# ============================================================================
# Phase 1: Load dim_agent
# ============================================================================

echo "Phase 1: Loading dim_agent..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sql/dml/load_dim_agent.sql"

AGENT_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM dim_agent WHERE is_active = TRUE")
echo "✓ Loaded $AGENT_COUNT active agents"
echo ""

# ============================================================================
# Phase 2: Load dim_label
# ============================================================================

echo "Phase 2: Loading dim_label (Miyabi 57-label system)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sql/dml/load_dim_label.sql"

LABEL_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM dim_label WHERE is_active = TRUE")
echo "✓ Loaded $LABEL_COUNT active labels"
echo ""

# ============================================================================
# Phase 3: Verify dim_time (should already be populated by init_dw.sh)
# ============================================================================

echo "Phase 3: Verifying dim_time..."
TIME_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM dim_time")

if [ "$TIME_COUNT" -eq 0 ]; then
    echo "⚠️  dim_time is empty, populating 2020-2030..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT populate_dim_time('2020-01-01'::DATE, '2030-12-31'::DATE);
EOF
    TIME_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM dim_time")
    echo "✓ Populated $TIME_COUNT time records"
else
    echo "✓ dim_time already populated with $TIME_COUNT records"
fi
echo ""

# ============================================================================
# Phase 4: Sample Infrastructure Data (Optional)
# ============================================================================

echo "Phase 4: Loading sample infrastructure data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Load sample AWS infrastructure
INSERT INTO dim_infrastructure (
    resource_id,
    resource_type,
    resource_name,
    cloud_provider,
    region,
    availability_zone,
    instance_type,
    cpu_count,
    memory_gb,
    storage_gb,
    storage_type,
    hourly_cost_usd,
    monthly_cost_usd,
    tags,
    effective_date,
    is_current,
    version
) VALUES
    ('vpc-miyabi-prod', 'VPC', 'miyabi-production-vpc', 'AWS', 'ap-northeast-1', NULL,
     NULL, NULL, NULL, NULL, NULL, 0, 0,
     '{"environment": "production", "project": "miyabi"}'::jsonb,
     CURRENT_DATE, TRUE, 1),

    ('ecs-cluster-prod', 'ECS', 'miyabi-ecs-cluster', 'AWS', 'ap-northeast-1', 'ap-northeast-1a',
     't3.medium', 2, 4, 20, 'gp3', 0.0416, 30.00,
     '{"environment": "production", "project": "miyabi", "managed_by": "terraform"}'::jsonb,
     CURRENT_DATE, TRUE, 1),

    ('rds-postgres-prod', 'RDS', 'miyabi-postgres-main', 'AWS', 'ap-northeast-1', 'ap-northeast-1a',
     'db.t3.medium', 2, 4, 100, 'gp3', 0.068, 49.00,
     '{"environment": "production", "project": "miyabi", "engine": "postgres15"}'::jsonb,
     CURRENT_DATE, TRUE, 1),

    ('s3-artifacts', 'S3', 'miyabi-artifacts', 'AWS', 'ap-northeast-1', NULL,
     NULL, NULL, NULL, 1000, 'S3', 0.025, 18.00,
     '{"environment": "production", "project": "miyabi", "versioning": "enabled"}'::jsonb,
     CURRENT_DATE, TRUE, 1),

    ('lambda-worker', 'Lambda', 'miyabi-async-worker', 'AWS', 'ap-northeast-1', NULL,
     'arm64', 1, 1, 0, NULL, 0.0000133, 9.60,
     '{"environment": "production", "project": "miyabi", "runtime": "provided.al2"}'::jsonb,
     CURRENT_DATE, TRUE, 1)

ON CONFLICT (resource_id) WHERE is_current = TRUE DO NOTHING;
EOF

INFRA_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM dim_infrastructure WHERE is_current = TRUE")
echo "✓ Loaded $INFRA_COUNT infrastructure resources"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "========================================"
echo "Initial Dimension Load Summary"
echo "========================================"
echo "dim_agent: $AGENT_COUNT active agents"
echo "dim_label: $LABEL_COUNT active labels"
echo "dim_time: $TIME_COUNT time records"
echo "dim_infrastructure: $INFRA_COUNT current resources"
echo ""

# Display dimension statistics
echo "Dimension Statistics:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT
    'dim_time' AS dimension,
    COUNT(*) AS total_records,
    MIN(full_date) AS min_date,
    MAX(full_date) AS max_date
FROM dim_time

UNION ALL

SELECT
    'dim_agent',
    COUNT(*),
    NULL::DATE,
    NULL::DATE
FROM dim_agent

UNION ALL

SELECT
    'dim_label',
    COUNT(*),
    NULL::DATE,
    NULL::DATE
FROM dim_label

UNION ALL

SELECT
    'dim_infrastructure',
    COUNT(*),
    NULL::DATE,
    NULL::DATE
FROM dim_infrastructure WHERE is_current = TRUE

UNION ALL

SELECT
    'dim_issue',
    COUNT(*),
    NULL::DATE,
    NULL::DATE
FROM dim_issue WHERE is_current = TRUE

UNION ALL

SELECT
    'dim_worktree',
    COUNT(*),
    NULL::DATE,
    NULL::DATE
FROM dim_worktree;
EOF

echo ""
echo "✅ Initial dimension load complete!"
echo ""
echo "Next steps:"
echo "  1. Configure Airflow connections:"
echo "     - miyabi_source_db (source PostgreSQL)"
echo "     - miyabi_dw (data warehouse PostgreSQL)"
echo "  2. Enable DAGs:"
echo "     airflow dags unpause daily_issue_processing_etl"
echo "     airflow dags unpause hourly_agent_metrics_etl"
echo "  3. Trigger initial backfill (if needed):"
echo "     airflow dags backfill -s 2025-01-01 -e 2025-01-31 daily_issue_processing_etl"
echo ""
