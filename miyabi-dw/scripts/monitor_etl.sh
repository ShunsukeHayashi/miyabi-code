#!/bin/bash
# Miyabi Data Warehouse - ETL Monitoring Script
# Version: 1.0.0

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in interactive mode
INTERACTIVE=${1:-false}

echo "========================================"
echo "Miyabi DW - ETL Monitoring Dashboard"
echo "========================================"
echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ============================================================================
# Function: Check DAG Status
# ============================================================================
check_dag_status() {
    local dag_id=$1
    echo -e "${BLUE}📊 DAG: $dag_id${NC}"
    echo "----------------------------------------"

    # Check if DAG is paused
    PAUSED=$(docker-compose exec -T airflow-scheduler airflow dags list 2>/dev/null | grep "$dag_id" | awk '{print $NF}')

    if [ "$PAUSED" = "True" ]; then
        echo -e "  Status: ${RED}⏸️  PAUSED${NC}"
    else
        echo -e "  Status: ${GREEN}▶️  ACTIVE${NC}"
    fi

    # Get recent runs
    echo ""
    echo "  Recent Runs:"
    docker-compose exec -T airflow-scheduler airflow dags list-runs -d "$dag_id" --no-backfill 2>/dev/null | head -5 | tail -3 | while read line; do
        if echo "$line" | grep -q "success"; then
            echo -e "    ${GREEN}✅ $line${NC}"
        elif echo "$line" | grep -q "failed"; then
            echo -e "    ${RED}❌ $line${NC}"
        elif echo "$line" | grep -q "running"; then
            echo -e "    ${YELLOW}🔄 $line${NC}"
        else
            echo "    $line"
        fi
    done

    echo ""
}

# ============================================================================
# Function: Check Database Connections
# ============================================================================
check_connections() {
    echo -e "${BLUE}🔌 Database Connections${NC}"
    echo "----------------------------------------"

    # Source DB
    echo -n "  Source DB (miyabi): "
    if psql -h localhost -p 5432 -d miyabi -U $USER -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
        ISSUE_COUNT=$(psql -h localhost -p 5432 -d miyabi -U $USER -t -c "SELECT COUNT(*) FROM issues" 2>/dev/null | tr -d ' ')
        echo "    └─ Issues: $ISSUE_COUNT records"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi

    # Data Warehouse
    echo -n "  Data Warehouse (miyabi_dw): "
    if PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
        DIM_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw -t -c "SELECT COUNT(*) FROM dim_time" 2>/dev/null | tr -d ' ')
        echo "    └─ dim_time: $DIM_COUNT records"
    else
        echo -e "${RED}❌ Failed${NC}"
    fi

    echo ""
}

# ============================================================================
# Function: Check Fact Tables
# ============================================================================
check_fact_tables() {
    echo -e "${BLUE}📈 Fact Tables Status${NC}"
    echo "----------------------------------------"

    PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw -t -c "
    SELECT
        'fact_issue_processing' AS table_name,
        COUNT(*) AS records
    FROM fact_issue_processing
    UNION ALL
    SELECT 'fact_agent_execution', COUNT(*) FROM fact_agent_execution
    UNION ALL
    SELECT 'fact_code_generation', COUNT(*) FROM fact_code_generation
    UNION ALL
    SELECT 'fact_deployment', COUNT(*) FROM fact_deployment
    UNION ALL
    SELECT 'fact_performance_metrics', COUNT(*) FROM fact_performance_metrics
    " 2>/dev/null | while read line; do
        TABLE=$(echo "$line" | awk '{print $1}' | tr -d '|')
        COUNT=$(echo "$line" | awk '{print $NF}')

        if [ "$COUNT" -gt 0 ]; then
            echo -e "  ${GREEN}✅${NC} $TABLE: $COUNT records"
        else
            echo -e "  ${YELLOW}⚠️${NC}  $TABLE: $COUNT records"
        fi
    done

    echo ""
}

# ============================================================================
# Function: Check Airflow Services
# ============================================================================
check_airflow_services() {
    echo -e "${BLUE}🔧 Airflow Services${NC}"
    echo "----------------------------------------"

    docker-compose ps 2>/dev/null | grep airflow | while read line; do
        SERVICE=$(echo "$line" | awk '{print $1}')
        STATUS=$(echo "$line" | awk '{print $7}')

        if echo "$STATUS" | grep -q "Up"; then
            echo -e "  ${GREEN}✅${NC} $SERVICE"
        else
            echo -e "  ${RED}❌${NC} $SERVICE - $STATUS"
        fi
    done

    echo ""
}

# ============================================================================
# Function: Show Latest Errors (if any)
# ============================================================================
show_latest_errors() {
    echo -e "${BLUE}⚠️  Recent Errors (if any)${NC}"
    echo "----------------------------------------"

    ERROR_COUNT=$(docker-compose logs airflow-scheduler 2>/dev/null | grep -c "ERROR" || echo "0")

    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "  ${RED}Found $ERROR_COUNT error(s) in logs${NC}"
        echo ""
        echo "  Last 3 errors:"
        docker-compose logs --tail=1000 airflow-scheduler 2>/dev/null | grep "ERROR" | tail -3 | sed 's/^/    /'
    else
        echo -e "  ${GREEN}✅ No errors in recent logs${NC}"
    fi

    echo ""
}

# ============================================================================
# Main Monitoring
# ============================================================================

check_airflow_services
check_connections
check_dag_status "daily_issue_processing_etl"
check_dag_status "hourly_agent_metrics_etl"
check_fact_tables
show_latest_errors

# ============================================================================
# Interactive Mode
# ============================================================================

if [ "$INTERACTIVE" = "true" ]; then
    echo "========================================"
    echo "Monitoring Options:"
    echo "========================================"
    echo "1. Trigger daily_issue_processing_etl"
    echo "2. Trigger hourly_agent_metrics_etl"
    echo "3. View Airflow Web UI (http://localhost:8080)"
    echo "4. Check scheduler logs"
    echo "5. Exit"
    echo ""

    read -p "Select option (1-5): " OPTION

    case $OPTION in
        1)
            echo "Triggering daily_issue_processing_etl..."
            docker-compose exec airflow-scheduler airflow dags trigger daily_issue_processing_etl
            ;;
        2)
            echo "Triggering hourly_agent_metrics_etl..."
            docker-compose exec airflow-scheduler airflow dags trigger hourly_agent_metrics_etl
            ;;
        3)
            echo "Opening Airflow Web UI..."
            open http://localhost:8080 || xdg-open http://localhost:8080 || echo "Please open http://localhost:8080 in your browser"
            ;;
        4)
            echo "Scheduler logs (last 50 lines):"
            docker-compose logs --tail=50 airflow-scheduler
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option"
            exit 1
            ;;
    esac
fi

echo "========================================"
echo "Monitoring complete!"
echo "========================================"
