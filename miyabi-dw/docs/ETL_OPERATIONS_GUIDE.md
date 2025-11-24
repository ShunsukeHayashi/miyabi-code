# Miyabi Data Warehouse - ETL Operations Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Target Audience**: Data Engineers, DevOps, Platform Team

---

## 📋 Table of Contents

1. [ETL Pipeline Overview](#etl-pipeline-overview)
2. [Daily Operations](#daily-operations)
3. [Monitoring & Alerts](#monitoring--alerts)
4. [Troubleshooting](#troubleshooting)
5. [Performance Tuning](#performance-tuning)
6. [Disaster Recovery](#disaster-recovery)

---

## 🔄 ETL Pipeline Overview

### Architecture

```
Source DB (miyabi)     →     Airflow ETL     →     Data Warehouse (miyabi_dw)
  Issues                      Extract              dim_issue
  Agent Logs                  Transform            dim_agent
  Code Gen                    Load                 fact_issue_processing
  Deployments                                      fact_agent_execution
                                                   ...
```

### ETL DAGs

| DAG Name | Schedule | Duration | Purpose |
|----------|----------|----------|---------|
| `daily_issue_processing_etl` | 2:00 AM JST | ~15 min | Daily issue metrics, DORA calculations |
| `hourly_agent_metrics_etl` | Every hour | ~5 min | Agent performance, LLM costs |

---

## 📅 Daily Operations

### Morning Checklist (9:00 AM)

```bash
cd /path/to/miyabi-dw

# 1. Run monitoring script
./scripts/monitor_etl.sh

# 2. Check yesterday's ETL runs
docker-compose exec airflow-scheduler \
  airflow dags list-runs -d daily_issue_processing_etl --state success --state failed | head -5

# 3. Verify fact table growth
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw -c \
  "SELECT COUNT(*) FROM fact_issue_processing WHERE process_date = CURRENT_DATE - 1;"
```

**Expected Results**:
- ✅ Both DAGs show `success` for last 24 hours
- ✅ Fact tables have new records
- ✅ No ERROR logs in Airflow

### Weekly Tasks (Every Monday)

```bash
# 1. Refresh materialized views
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw <<EOF
REFRESH MATERIALIZED VIEW mart_development_performance;
REFRESH MATERIALIZED VIEW mart_agent_performance;
REFRESH MATERIALIZED VIEW mart_infrastructure_cost;
EOF

# 2. Clean up old DAG runs (keep last 30 days)
docker-compose exec airflow-scheduler \
  airflow dags delete -y $(date -d '30 days ago' +%Y-%m-%d)

# 3. Vacuum and analyze fact tables
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw <<EOF
VACUUM ANALYZE fact_issue_processing;
VACUUM ANALYZE fact_agent_execution;
VACUUM ANALYZE fact_code_generation;
EOF
```

### Monthly Tasks (First Monday)

```bash
# 1. Review and optimize slow queries
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw -c \
  "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 2. Archive old data (>6 months)
# TODO: Implement archival process

# 3. Update ETL documentation
git add docs/ETL_OPERATIONS_GUIDE.md
git commit -m "docs: update ETL operations guide"
```

---

## 📊 Monitoring & Alerts

### Real-Time Monitoring

**Airflow Web UI**: http://localhost:8080
- Login: admin / admin
- Dashboard > DAGs
- Browse > DAG Runs

**Command Line Monitoring**:
```bash
# Interactive monitoring dashboard
./scripts/monitor_etl.sh true

# Continuous monitoring (every 5 minutes)
watch -n 300 './scripts/monitor_etl.sh'
```

### Key Metrics to Watch

| Metric | Normal Range | Alert If |
|--------|--------------|----------|
| DAG Success Rate | >95% | <90% |
| ETL Duration (daily) | 10-20 min | >30 min |
| ETL Duration (hourly) | 3-8 min | >15 min |
| Fact Table Growth | 50-200 rows/day | 0 or >1000 |
| Disk Usage | <70% | >85% |

### Setting Up Alerts

**Email Alerts** (via Airflow SMTP):

1. Update `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

2. Restart Airflow:
   ```bash
   docker-compose restart airflow-webserver airflow-scheduler
   ```

**Slack Alerts** (optional):
```python
# In DAG file, add:
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator

slack_alert = SlackWebhookOperator(
    task_id='slack_alert',
    http_conn_id='slack_webhook',
    message='ETL Failed: {{ dag.dag_id }}',
    channel='#data-alerts'
)
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue 1: DAG Not Running

**Symptoms**:
- DAG shows as "paused"
- No recent runs in UI

**Diagnosis**:
```bash
docker-compose exec airflow-scheduler \
  airflow dags list | grep daily_issue_processing_etl
```

**Solution**:
```bash
docker-compose exec airflow-scheduler \
  airflow dags unpause daily_issue_processing_etl
```

---

#### Issue 2: Connection Error to Source DB

**Symptoms**:
```
ERROR: could not connect to server: Connection refused
```

**Diagnosis**:
```bash
# Test connection
psql -h host.docker.internal -p 5432 -U postgres -d miyabi -c "SELECT 1;"

# Check Airflow connection
docker-compose exec airflow-scheduler \
  airflow connections get miyabi_source_db
```

**Solution**:
```bash
# Update connection
docker-compose exec airflow-scheduler \
  airflow connections add miyabi_source_db \
    --conn-type postgres \
    --conn-host host.docker.internal \
    --conn-port 5432 \
    --conn-login postgres \
    --conn-password YOUR_PASSWORD \
    --conn-schema miyabi
```

---

#### Issue 3: Fact Table Not Loading

**Symptoms**:
- DAG shows success
- Fact table count = 0

**Diagnosis**:
```bash
# Check task logs
docker-compose exec airflow-scheduler \
  airflow tasks test daily_issue_processing_etl load_fact_issue_processing 2025-11-17

# Check source data
psql -d miyabi -c "SELECT COUNT(*) FROM issues WHERE updated_at::DATE = CURRENT_DATE;"
```

**Solution**:
- If source has no data: Wait for actual issues to be processed
- If source has data but fact table empty: Check transform logic in DAG

---

#### Issue 4: Out of Memory

**Symptoms**:
```
MemoryError: Unable to allocate array
```

**Diagnosis**:
```bash
docker stats miyabi-airflow-scheduler
```

**Solution**:
```yaml
# In docker-compose.yml, add memory limits:
services:
  airflow-scheduler:
    deploy:
      resources:
        limits:
          memory: 4G
```

---

#### Issue 5: Slow Query Performance

**Symptoms**:
- ETL takes >30 minutes
- Database CPU high

**Diagnosis**:
```bash
# Check running queries
PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw -c \
  "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active';"
```

**Solution**:
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_fact_issue_process_date
  ON fact_issue_processing(process_date);

-- Partition large fact tables (if >1M rows)
-- See: docs/PARTITIONING_GUIDE.md
```

---

## ⚡ Performance Tuning

### Optimizing ETL Speed

#### 1. Parallel Execution

```yaml
# In docker-compose.yml:
environment:
  - AIRFLOW__CORE__PARALLELISM=32  # Increase from 16
  - AIRFLOW__CORE__MAX_ACTIVE_TASKS_PER_DAG=16  # Increase from 8
```

#### 2. Batch Size Tuning

```python
# In DAG transform function:
BATCH_SIZE = 1000  # Adjust based on memory

for i in range(0, len(df), BATCH_SIZE):
    batch = df[i:i+BATCH_SIZE]
    load_to_warehouse(batch)
```

#### 3. Database Connection Pooling

Already configured in docker-compose.yml:
```yaml
command:
  - "-c"
  - "max_connections=200"
  - "-c"
  - "shared_buffers=256MB"
```

### Query Optimization Checklist

- ✅ Add indexes on foreign keys
- ✅ Add indexes on frequently filtered columns (date, status)
- ✅ Use EXPLAIN ANALYZE to identify slow queries
- ✅ Consider partitioning for tables >1M rows
- ✅ Vacuum and analyze regularly

---

## 🚨 Disaster Recovery

### Backup Strategy

**Automated Daily Backups**:
```bash
#!/bin/bash
# Add to crontab: 0 3 * * * /path/to/backup_dw.sh

BACKUP_DIR="/backups/miyabi-dw"
DATE=$(date +%Y%m%d)

# Backup Data Warehouse
PGPASSWORD=postgres pg_dump -h localhost -p 5434 -U postgres miyabi_dw | \
  gzip > "$BACKUP_DIR/miyabi_dw_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "miyabi_dw_*.sql.gz" -mtime +30 -delete
```

**Backup Airflow Metadata**:
```bash
docker-compose exec postgres-airflow \
  pg_dump -U airflow airflow | \
  gzip > "/backups/airflow_$DATE.sql.gz"
```

### Recovery Procedures

#### Scenario 1: Corrupt Fact Table

```sql
-- 1. Drop corrupt table
DROP TABLE fact_issue_processing CASCADE;

-- 2. Recreate from DDL
\i /path/to/sql/ddl/02_create_facts.sql

-- 3. Re-run ETL for affected dates
docker-compose exec airflow-scheduler \
  airflow dags backfill \
    -s 2025-11-01 \
    -e 2025-11-17 \
    daily_issue_processing_etl
```

#### Scenario 2: Complete Database Loss

```bash
# 1. Stop services
docker-compose down

# 2. Remove volumes
docker volume rm miyabi-dw-postgres-data

# 3. Recreate infrastructure
docker-compose up -d

# 4. Restore from backup
gunzip -c /backups/miyabi_dw_20251117.sql.gz | \
  PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d miyabi_dw

# 5. Verify data
./scripts/monitor_etl.sh
```

---

## 📖 Additional Resources

- **Architecture Diagram**: `docs/ARCHITECTURE.md`
- **Data Dictionary**: `docs/DATA_DICTIONARY.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **QUICKSTART Guide**: `QUICKSTART.md`
- **Airflow Docs**: https://airflow.apache.org/docs/

---

## 🆘 Getting Help

**Internal**:
- Data Team Slack: #data-engineering
- Email: data-team@company.com

**External**:
- Airflow Community: https://airflow.apache.org/community/
- PostgreSQL Help: https://www.postgresql.org/support/

---

**Document Maintainer**: Data Engineering Team
**Next Review Date**: 2025-12-18
