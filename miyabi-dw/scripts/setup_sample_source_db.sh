#!/bin/bash
# Miyabi Data Warehouse - Sample Source Database Setup
# Version: 1.0.0

set -e

# Configuration
DB_NAME="${MIYABI_SOURCE_DB:-miyabi}"
DB_USER="${MIYABI_SOURCE_USER:-postgres}"
DB_HOST="${MIYABI_SOURCE_HOST:-localhost}"
DB_PORT="${MIYABI_SOURCE_PORT:-5432}"

echo "========================================"
echo "Miyabi Source Database Setup (Sample)"
echo "========================================"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Create database if not exists
echo "Step 1: Creating database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"

echo "✓ Database created/verified"

# Create tables
echo ""
echo "Step 2: Creating source tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sql/sample_source_db/01_create_source_schema.sql"

echo "✓ Tables created"

# Load sample data
echo ""
echo "Step 3: Loading sample data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sql/sample_source_db/02_load_sample_data.sql"

echo "✓ Sample data loaded"

# Verify data
echo ""
echo "Step 4: Verifying data..."
ISSUE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM issues")
AGENT_EXEC_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM agent_execution_logs")
CODEGEN_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM code_gen_tasks")

echo "✓ Data verified"
echo ""

# Display summary
echo "========================================"
echo "Sample Source Database Summary"
echo "========================================"
echo "issues: $ISSUE_COUNT records"
echo "agent_execution_logs: $AGENT_EXEC_COUNT records"
echo "code_gen_tasks: $CODEGEN_COUNT records"
echo ""

# Show recent issues
echo "Recent Issues (sample):"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT
    number,
    title,
    priority,
    complexity,
    CASE
        WHEN closed_at IS NULL THEN 'OPEN'
        ELSE 'CLOSED'
    END AS status
FROM issues
ORDER BY number
LIMIT 5;
EOF

echo ""
echo "✅ Sample source database ready!"
echo ""
echo "Next steps:"
echo "  1. Test ETL: docker-compose exec airflow-scheduler airflow dags test daily_issue_processing_etl"
echo "  2. Monitor UI: http://localhost:8080"
echo "  3. Query data: psql -h localhost -p 5432 -U postgres -d miyabi"
echo ""
