#!/bin/bash
# Miyabi Data Warehouse Initialization Script
# Version: 1.0.0

set -e

# Configuration
DB_NAME="${MIYABI_DW_DB:-miyabi_dw}"
DB_USER="${MIYABI_DW_USER:-postgres}"
DB_HOST="${MIYABI_DW_HOST:-localhost}"
DB_PORT="${MIYABI_DW_PORT:-5432}"

echo "======================================"
echo "Miyabi Data Warehouse Initialization"
echo "======================================"
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

# Install extensions
echo ""
echo "Step 2: Installing PostgreSQL extensions..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- Uncomment if using TimescaleDB
-- CREATE EXTENSION IF NOT EXISTS timescaledb;
EOF

echo "✓ Extensions installed"

# Create dimensions
echo ""
echo "Step 3: Creating dimension tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sql/ddl/01_create_dimensions.sql"

echo "✓ Dimension tables created"

# Create facts
echo ""
echo "Step 4: Creating fact tables..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sql/ddl/02_create_facts.sql"

echo "✓ Fact tables created"

# Populate dim_time
echo ""
echo "Step 5: Populating dim_time (2020-2030)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
SELECT populate_dim_time('2020-01-01'::DATE, '2030-12-31'::DATE);
EOF

echo "✓ dim_time populated with $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM dim_time") records"

# Create data marts
echo ""
echo "Step 6: Creating data marts..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../sql/marts/01_mart_development_performance.sql"

echo "✓ Data marts created"

# Create ETL user and grant permissions
echo ""
echo "Step 7: Setting up ETL user permissions..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Create ETL role if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'miyabi_etl') THEN
        CREATE ROLE miyabi_etl WITH LOGIN PASSWORD 'changeme_etl_password';
    END IF;
END
\$\$;

-- Grant permissions
GRANT CONNECT ON DATABASE $DB_NAME TO miyabi_etl;
GRANT USAGE ON SCHEMA public, staging TO miyabi_etl;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, staging TO miyabi_etl;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, staging TO miyabi_etl;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO miyabi_etl;

-- Default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public, staging
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO miyabi_etl;
ALTER DEFAULT PRIVILEGES IN SCHEMA public, staging
    GRANT USAGE, SELECT ON SEQUENCES TO miyabi_etl;
EOF

echo "✓ ETL user configured"

# Verify installation
echo ""
echo "Step 8: Verifying installation..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
")

echo "✓ Found $TABLE_COUNT tables"

# Display summary
echo ""
echo "======================================"
echo "Installation Summary"
echo "======================================"
echo "Database: $DB_NAME"
echo "Dimension Tables: 6"
echo "Fact Tables: 5"
echo "Data Marts: 1"
echo "dim_time Records: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM dim_time")"
echo ""
echo "✅ Data Warehouse initialization complete!"
echo ""
echo "Next steps:"
echo "  1. Load initial dimension data: ./load_initial_dimensions.sh"
echo "  2. Configure Airflow: Setup DAGs in airflow/dags/"
echo "  3. Run ETL pipeline: airflow dags unpause daily_issue_processing_etl"
echo ""
