# Miyabi Data Warehouse Design & ETL Architecture

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Design Proposal

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Dimensional Model](#dimensional-model)
3. [ETL Pipeline](#etl-pipeline)
4. [Data Marts](#data-marts)
5. [Implementation Guide](#implementation-guide)

---

## 🎯 Overview

### Purpose

MiyabiのデータウェアハウスはAI駆動開発フレームワークの分析基盤として以下を実現：

- **開発プロセスの可視化**: Issue→Code→Review→Deploy のフロー分析
- **Agent性能評価**: 各Agentのパフォーマンス・コスト・品質メトリクス
- **インフラ最適化**: リソース使用率とコスト分析
- **予測分析**: AI/MLモデルによる開発時間・コスト予測

### Architecture Pattern

**Star Schema** を採用：
- 5つのFact Tables (事実テーブル)
- 6つのDimension Tables (次元テーブル)
- Type 1 & Type 2 Slowly Changing Dimensions (SCD)

### Technology Stack

```yaml
Database: PostgreSQL 15+
ETL Framework: Apache Airflow 2.7+
Data Processing: Rust + SQLx
Orchestration: Temporal.io
Monitoring: Grafana + Prometheus
BI Tool: Metabase / Superset
```

---

## 📊 Dimensional Model

### Fact Tables

#### F1: fact_issue_processing

**Purpose**: Issue処理の包括的なメトリクス

```sql
CREATE TABLE fact_issue_processing (
    issue_processing_key BIGSERIAL PRIMARY KEY,

    -- Foreign Keys to Dimensions
    issue_key BIGINT REFERENCES dim_issue(issue_key),
    agent_key BIGINT REFERENCES dim_agent(agent_key),
    time_key INT REFERENCES dim_time(time_key),
    label_key BIGINT REFERENCES dim_label(label_key),
    worktree_key BIGINT REFERENCES dim_worktree(worktree_key),

    -- Process Metrics
    processing_duration_seconds INT NOT NULL,
    lines_of_code_generated INT DEFAULT 0,
    files_modified INT DEFAULT 0,

    -- Quality Metrics
    review_score DECIMAL(3,2) CHECK (review_score BETWEEN 0 AND 1),
    test_coverage_percent DECIMAL(5,2) CHECK (test_coverage_percent BETWEEN 0 AND 100),
    clippy_warnings INT DEFAULT 0,
    fmt_issues INT DEFAULT 0,

    -- Success Indicators
    build_success BOOLEAN NOT NULL,
    test_success BOOLEAN NOT NULL,
    deployment_success BOOLEAN,

    -- Cost Metrics
    ai_cost_usd DECIMAL(10,4) DEFAULT 0,
    infrastructure_cost_usd DECIMAL(10,4) DEFAULT 0,

    -- Temporal Data
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,

    -- Degenerate Dimensions
    issue_number INT NOT NULL,
    commit_sha VARCHAR(40),
    pr_number INT,

    CONSTRAINT valid_duration CHECK (completed_at >= started_at)
);

CREATE INDEX idx_fip_time ON fact_issue_processing(time_key);
CREATE INDEX idx_fip_agent ON fact_issue_processing(agent_key);
CREATE INDEX idx_fip_issue ON fact_issue_processing(issue_key);
CREATE INDEX idx_fip_completed ON fact_issue_processing(completed_at);
```

**Key Metrics**:
- Lead Time (Issue作成→完了)
- Cycle Time (作業開始→完了)
- Code Quality Score
- Cost per Issue

#### F2: fact_code_generation

**Purpose**: コード生成タスクの詳細メトリクス

```sql
CREATE TABLE fact_code_generation (
    code_gen_key BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
    agent_key BIGINT REFERENCES dim_agent(agent_key),
    time_key INT REFERENCES dim_time(time_key),
    issue_key BIGINT REFERENCES dim_issue(issue_key),

    -- Generation Metrics
    total_files_generated INT DEFAULT 0,
    total_lines_generated INT DEFAULT 0,
    total_functions_generated INT DEFAULT 0,
    total_tests_generated INT DEFAULT 0,

    -- Build Metrics
    compilation_time_ms INT,
    clippy_warnings INT DEFAULT 0,
    clippy_errors INT DEFAULT 0,
    fmt_issues INT DEFAULT 0,

    -- AI Metrics
    ai_model_name VARCHAR(100),
    ai_model_tokens_input INT DEFAULT 0,
    ai_model_tokens_output INT DEFAULT 0,
    ai_generation_cost_usd DECIMAL(10,4) DEFAULT 0,
    ai_prompt_count INT DEFAULT 0,

    -- Quality Metrics
    cyclomatic_complexity_avg DECIMAL(5,2),
    code_duplication_percent DECIMAL(5,2),
    maintainability_index DECIMAL(5,2),
    test_count INT DEFAULT 0,

    -- Performance
    generation_duration_ms BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL,

    CONSTRAINT positive_lines CHECK (total_lines_generated >= 0)
);

CREATE INDEX idx_fcg_agent ON fact_code_generation(agent_key);
CREATE INDEX idx_fcg_time ON fact_code_generation(time_key);
CREATE INDEX idx_fcg_created ON fact_code_generation(created_at);
```

**Key Metrics**:
- Lines per Hour
- Cost per Line
- AI Token Usage
- Code Quality Score

#### F3: fact_deployment

**Purpose**: デプロイメント実行の追跡

```sql
CREATE TABLE fact_deployment (
    deployment_key BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
    infrastructure_key BIGINT REFERENCES dim_infrastructure(infrastructure_key),
    time_key INT REFERENCES dim_time(time_key),
    issue_key BIGINT REFERENCES dim_issue(issue_key),
    agent_key BIGINT REFERENCES dim_agent(agent_key),

    -- Deployment Metrics
    deployment_duration_seconds INT NOT NULL,
    rollback_count INT DEFAULT 0,
    resource_count INT DEFAULT 0,
    container_count INT DEFAULT 0,

    -- Health Metrics
    health_check_pass_rate DECIMAL(5,2) CHECK (health_check_pass_rate BETWEEN 0 AND 100),
    error_count INT DEFAULT 0,
    warning_count INT DEFAULT 0,

    -- Cost Metrics
    infrastructure_cost_usd DECIMAL(10,2) DEFAULT 0,
    data_transfer_cost_usd DECIMAL(10,2) DEFAULT 0,
    total_cost_usd DECIMAL(10,2) GENERATED ALWAYS AS
        (infrastructure_cost_usd + data_transfer_cost_usd) STORED,

    -- Status & Type
    deployment_status VARCHAR(20) NOT NULL CHECK (
        deployment_status IN ('SUCCESS', 'FAILED', 'ROLLED_BACK', 'PARTIAL')
    ),
    deployment_type VARCHAR(20) CHECK (
        deployment_type IN ('BLUE_GREEN', 'CANARY', 'ROLLING', 'RECREATE')
    ),
    environment VARCHAR(20) CHECK (
        environment IN ('dev', 'staging', 'production')
    ),

    -- Temporal Data
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,

    -- Degenerate Dimensions
    commit_sha VARCHAR(40) NOT NULL,
    pipeline_id VARCHAR(100),

    CONSTRAINT valid_duration CHECK (completed_at >= started_at)
);

CREATE INDEX idx_fd_infra ON fact_deployment(infrastructure_key);
CREATE INDEX idx_fd_time ON fact_deployment(time_key);
CREATE INDEX idx_fd_status ON fact_deployment(deployment_status);
CREATE INDEX idx_fd_env ON fact_deployment(environment);
```

**Key Metrics**:
- Deployment Frequency
- Mean Time To Recovery (MTTR)
- Change Failure Rate
- Deployment Success Rate

#### F4: fact_agent_execution

**Purpose**: Agent実行ログの集約

```sql
CREATE TABLE fact_agent_execution (
    execution_key BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
    agent_key BIGINT REFERENCES dim_agent(agent_key),
    time_key INT REFERENCES dim_time(time_key),
    issue_key BIGINT REFERENCES dim_issue(issue_key),
    worktree_key BIGINT REFERENCES dim_worktree(worktree_key),

    -- Performance Metrics
    execution_duration_ms BIGINT NOT NULL,
    memory_usage_mb INT,
    cpu_usage_percent DECIMAL(5,2),
    disk_io_mb INT,

    -- API Metrics
    api_calls_count INT DEFAULT 0,
    api_errors_count INT DEFAULT 0,
    cache_hit_count INT DEFAULT 0,
    cache_miss_count INT DEFAULT 0,
    cache_hit_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN (cache_hit_count + cache_miss_count) > 0
            THEN (cache_hit_count::DECIMAL / (cache_hit_count + cache_miss_count) * 100)
            ELSE 0
        END
    ) STORED,

    -- AI/LLM Metrics
    llm_provider VARCHAR(50),
    llm_model VARCHAR(100),
    llm_tokens_input INT DEFAULT 0,
    llm_tokens_output INT DEFAULT 0,
    llm_requests_count INT DEFAULT 0,
    llm_cost_usd DECIMAL(10,4) DEFAULT 0,

    -- Execution Status
    exit_code INT NOT NULL,
    error_count INT DEFAULT 0,
    warning_count INT DEFAULT 0,
    retry_count INT DEFAULT 0,

    -- Result
    success BOOLEAN NOT NULL,
    error_message TEXT,

    -- Temporal Data
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,

    CONSTRAINT valid_execution_time CHECK (completed_at >= started_at)
);

CREATE INDEX idx_fae_agent ON fact_agent_execution(agent_key);
CREATE INDEX idx_fae_time ON fact_agent_execution(time_key);
CREATE INDEX idx_fae_success ON fact_agent_execution(success);
CREATE INDEX idx_fae_completed ON fact_agent_execution(completed_at);
```

**Key Metrics**:
- Agent Utilization
- Average Execution Time
- Success Rate
- Cost Efficiency (Cost per Task)

#### F5: fact_performance_metrics

**Purpose**: システムパフォーマンスの時系列メトリクス

```sql
CREATE TABLE fact_performance_metrics (
    metric_key BIGSERIAL PRIMARY KEY,

    -- Foreign Keys
    time_key INT REFERENCES dim_time(time_key),
    infrastructure_key BIGINT REFERENCES dim_infrastructure(infrastructure_key),

    -- System Resource Metrics
    cpu_utilization_percent DECIMAL(5,2) CHECK (cpu_utilization_percent BETWEEN 0 AND 100),
    memory_utilization_percent DECIMAL(5,2) CHECK (memory_utilization_percent BETWEEN 0 AND 100),
    disk_usage_percent DECIMAL(5,2) CHECK (disk_usage_percent BETWEEN 0 AND 100),
    disk_io_mbps DECIMAL(10,2),
    network_in_mbps DECIMAL(10,2),
    network_out_mbps DECIMAL(10,2),

    -- Application Metrics
    request_count BIGINT DEFAULT 0,
    request_rate_per_sec DECIMAL(10,2),
    error_count INT DEFAULT 0,
    error_rate DECIMAL(5,4) GENERATED ALWAYS AS (
        CASE
            WHEN request_count > 0
            THEN (error_count::DECIMAL / request_count)
            ELSE 0
        END
    ) STORED,

    -- Latency Metrics (milliseconds)
    p50_latency_ms INT,
    p90_latency_ms INT,
    p95_latency_ms INT,
    p99_latency_ms INT,
    max_latency_ms INT,

    -- Database Metrics
    db_connection_count INT DEFAULT 0,
    db_connection_pool_usage_percent DECIMAL(5,2),
    db_query_count BIGINT DEFAULT 0,
    db_query_time_avg_ms DECIMAL(10,2),
    db_query_time_p95_ms INT,
    db_deadlock_count INT DEFAULT 0,
    db_slow_query_count INT DEFAULT 0,

    -- Cache Metrics
    cache_hit_count BIGINT DEFAULT 0,
    cache_miss_count BIGINT DEFAULT 0,
    cache_eviction_count INT DEFAULT 0,
    cache_size_mb INT,

    measured_at TIMESTAMP NOT NULL,
    measurement_interval_seconds INT DEFAULT 60
);

CREATE INDEX idx_fpm_time ON fact_performance_metrics(time_key);
CREATE INDEX idx_fpm_infra ON fact_performance_metrics(infrastructure_key);
CREATE INDEX idx_fpm_measured ON fact_performance_metrics(measured_at);

-- Hypertable for TimescaleDB (optional, for time-series optimization)
-- SELECT create_hypertable('fact_performance_metrics', 'measured_at');
```

**Key Metrics**:
- System Health Score
- Resource Utilization Trends
- Application Performance
- Database Performance

---

### Dimension Tables

#### D1: dim_time (Type 1 SCD)

**Purpose**: 時間ディメンション（カレンダー階層）

```sql
CREATE TABLE dim_time (
    time_key INT PRIMARY KEY,

    -- Date Fields
    full_date DATE NOT NULL UNIQUE,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
    day_name VARCHAR(10),
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_year INT CHECK (day_of_year BETWEEN 1 AND 366),

    -- Week Fields
    week_of_year INT CHECK (week_of_year BETWEEN 1 AND 53),
    week_of_month INT CHECK (week_of_month BETWEEN 1 AND 5),

    -- Month Fields
    month INT CHECK (month BETWEEN 1 AND 12),
    month_name VARCHAR(10),
    month_abbr VARCHAR(3),

    -- Quarter Fields
    quarter INT CHECK (quarter BETWEEN 1 AND 4),
    quarter_name VARCHAR(2),

    -- Year Fields
    year INT,

    -- Special Flags
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    is_business_day BOOLEAN,
    holiday_name VARCHAR(100),

    -- Fiscal Calendar
    fiscal_year INT,
    fiscal_quarter INT CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INT CHECK (fiscal_month BETWEEN 1 AND 12),
    fiscal_week INT
);

CREATE INDEX idx_dt_full_date ON dim_time(full_date);
CREATE INDEX idx_dt_year_month ON dim_time(year, month);
CREATE INDEX idx_dt_fiscal ON dim_time(fiscal_year, fiscal_quarter);
```

**Population Script** (generate 10 years of data):

```sql
-- Function to populate dim_time
CREATE OR REPLACE FUNCTION populate_dim_time(
    start_date DATE,
    end_date DATE
)
RETURNS VOID AS $$
DECLARE
    current_date DATE;
    fiscal_start_month INT := 4; -- April starts fiscal year
BEGIN
    current_date := start_date;

    WHILE current_date <= end_date LOOP
        INSERT INTO dim_time (
            time_key,
            full_date,
            day_of_week,
            day_name,
            day_of_month,
            day_of_year,
            week_of_year,
            week_of_month,
            month,
            month_name,
            month_abbr,
            quarter,
            quarter_name,
            year,
            is_weekend,
            is_business_day,
            fiscal_year,
            fiscal_quarter,
            fiscal_month
        ) VALUES (
            TO_CHAR(current_date, 'YYYYMMDD')::INT,
            current_date,
            EXTRACT(ISODOW FROM current_date),
            TO_CHAR(current_date, 'Day'),
            EXTRACT(DAY FROM current_date),
            EXTRACT(DOY FROM current_date),
            EXTRACT(WEEK FROM current_date),
            CEIL(EXTRACT(DAY FROM current_date)::DECIMAL / 7),
            EXTRACT(MONTH FROM current_date),
            TO_CHAR(current_date, 'Month'),
            TO_CHAR(current_date, 'Mon'),
            EXTRACT(QUARTER FROM current_date),
            'Q' || EXTRACT(QUARTER FROM current_date),
            EXTRACT(YEAR FROM current_date),
            EXTRACT(ISODOW FROM current_date) IN (6, 7),
            EXTRACT(ISODOW FROM current_date) NOT IN (6, 7),
            CASE
                WHEN EXTRACT(MONTH FROM current_date) >= fiscal_start_month
                THEN EXTRACT(YEAR FROM current_date)
                ELSE EXTRACT(YEAR FROM current_date) - 1
            END,
            CASE
                WHEN EXTRACT(MONTH FROM current_date) >= fiscal_start_month
                THEN CEIL((EXTRACT(MONTH FROM current_date) - fiscal_start_month + 1)::DECIMAL / 3)
                ELSE CEIL((EXTRACT(MONTH FROM current_date) + 12 - fiscal_start_month + 1)::DECIMAL / 3)
            END,
            CASE
                WHEN EXTRACT(MONTH FROM current_date) >= fiscal_start_month
                THEN EXTRACT(MONTH FROM current_date) - fiscal_start_month + 1
                ELSE EXTRACT(MONTH FROM current_date) + 12 - fiscal_start_month + 1
            END
        );

        current_date := current_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Populate 10 years
SELECT populate_dim_time('2020-01-01'::DATE, '2030-12-31'::DATE);
```

#### D2: dim_issue (Type 2 SCD)

**Purpose**: Issue次元（履歴保持）

```sql
CREATE TABLE dim_issue (
    issue_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    issue_id VARCHAR(50) NOT NULL,
    issue_number INT NOT NULL,

    -- Descriptive Attributes
    title VARCHAR(500),
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('P0', 'P1', 'P2', 'P3', 'P4')),
    complexity VARCHAR(20) CHECK (complexity IN ('trivial', 'low', 'medium', 'high', 'critical')),
    issue_type VARCHAR(50),
    category VARCHAR(100),

    -- Source Information
    repository VARCHAR(200),
    created_by VARCHAR(100),
    assigned_to VARCHAR(100),

    -- Labels (array for multiple labels)
    labels TEXT[],

    -- Type 2 SCD Fields
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,

    -- Audit Fields
    record_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_di_issue_id ON dim_issue(issue_id);
CREATE INDEX idx_di_current ON dim_issue(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_di_effective ON dim_issue(effective_date, expiration_date);
CREATE UNIQUE INDEX idx_di_natural_key_current ON dim_issue(issue_id, issue_number)
    WHERE is_current = TRUE;
```

**SCD Type 2 Trigger**:

```sql
CREATE OR REPLACE FUNCTION dim_issue_scd2()
RETURNS TRIGGER AS $$
BEGIN
    -- Close current record
    UPDATE dim_issue
    SET
        expiration_date = CURRENT_DATE,
        is_current = FALSE,
        record_updated_at = CURRENT_TIMESTAMP
    WHERE
        issue_id = NEW.issue_id
        AND issue_number = NEW.issue_number
        AND is_current = TRUE;

    -- Insert new version
    NEW.effective_date := CURRENT_DATE;
    NEW.expiration_date := NULL;
    NEW.is_current := TRUE;
    NEW.version := COALESCE((
        SELECT MAX(version) + 1
        FROM dim_issue
        WHERE issue_id = NEW.issue_id AND issue_number = NEW.issue_number
    ), 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dim_issue_scd2
    BEFORE INSERT ON dim_issue
    FOR EACH ROW
    EXECUTE FUNCTION dim_issue_scd2();
```

#### D3: dim_agent (Type 1 SCD)

```sql
CREATE TABLE dim_agent (
    agent_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    agent_id VARCHAR(100) NOT NULL UNIQUE,

    -- Descriptive Attributes
    agent_name VARCHAR(200) NOT NULL,
    agent_type VARCHAR(50) CHECK (agent_type IN (
        'CodeGen', 'Review', 'Deployment', 'Issue',
        'Coordinator', 'Business', 'Marketing', 'Sales'
    )),
    agent_category VARCHAR(50) CHECK (agent_category IN ('Technical', 'Business')),

    -- AI Model Information
    ai_model VARCHAR(100),
    ai_provider VARCHAR(50),
    model_version VARCHAR(50),

    -- Technical Details
    framework_version VARCHAR(50),
    capabilities TEXT[],
    max_concurrent_tasks INT,

    -- Cost Model
    cost_per_hour_usd DECIMAL(10,4),
    cost_per_token_usd DECIMAL(10,8),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_da_type ON dim_agent(agent_type);
CREATE INDEX idx_da_active ON dim_agent(is_active) WHERE is_active = TRUE;
```

#### D4: dim_infrastructure (Type 2 SCD)

```sql
CREATE TABLE dim_infrastructure (
    infrastructure_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    resource_id VARCHAR(200) NOT NULL,

    -- Descriptive Attributes
    resource_type VARCHAR(100) CHECK (resource_type IN (
        'VPC', 'Subnet', 'EC2', 'ECS', 'RDS', 'S3',
        'Lambda', 'ALB', 'CloudFront', 'Route53'
    )),
    resource_name VARCHAR(200),

    -- Location
    cloud_provider VARCHAR(50) DEFAULT 'AWS',
    region VARCHAR(50),
    availability_zone VARCHAR(50),

    -- Configuration
    instance_type VARCHAR(100),
    cpu_count INT,
    memory_gb INT,
    storage_gb INT,
    storage_type VARCHAR(50),

    -- Network
    vpc_id VARCHAR(100),
    subnet_id VARCHAR(100),
    security_group_ids TEXT[],

    -- Cost
    hourly_cost_usd DECIMAL(10,4),
    monthly_cost_usd DECIMAL(10,2),

    -- Tags
    tags JSONB,

    -- Type 2 SCD Fields
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,

    -- Audit Fields
    record_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dinf_resource_id ON dim_infrastructure(resource_id);
CREATE INDEX idx_dinf_current ON dim_infrastructure(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_dinf_type ON dim_infrastructure(resource_type);
CREATE INDEX idx_dinf_region ON dim_infrastructure(region);
CREATE INDEX idx_dinf_tags ON dim_infrastructure USING GIN(tags);
```

#### D5: dim_label (Type 1 SCD)

```sql
CREATE TABLE dim_label (
    label_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    label_name VARCHAR(100) NOT NULL UNIQUE,

    -- Miyabi 57-label system
    label_category VARCHAR(50) CHECK (label_category IN (
        'Status', 'Priority', 'Type', 'Component', 'Effort',
        'Impact', 'Technology', 'Phase', 'Quality', 'Meta', 'Custom'
    )),
    label_priority VARCHAR(20),

    -- Visual
    color VARCHAR(7),
    icon VARCHAR(50),

    -- Metadata
    description TEXT,
    usage_guidelines TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dl_category ON dim_label(label_category);
CREATE INDEX idx_dl_active ON dim_label(is_active) WHERE is_active = TRUE;
```

#### D6: dim_worktree (Type 1 SCD)

```sql
CREATE TABLE dim_worktree (
    worktree_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    worktree_path VARCHAR(500) NOT NULL UNIQUE,

    -- Descriptive Attributes
    branch_name VARCHAR(200),
    base_branch VARCHAR(200),
    status VARCHAR(50) CHECK (status IN ('active', 'completed', 'abandoned', 'merged')),

    -- Associated Work
    associated_issue_id VARCHAR(50),
    associated_pr_number INT,

    -- Metadata
    created_by VARCHAR(100),
    purpose TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    cleaned_up_at TIMESTAMP
);

CREATE INDEX idx_dw_branch ON dim_worktree(branch_name);
CREATE INDEX idx_dw_status ON dim_worktree(status);
CREATE INDEX idx_dw_issue ON dim_worktree(associated_issue_id);
```

---

## 🔄 ETL Pipeline

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MIYABI ETL PIPELINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      │
│  │   EXTRACT    │  →   │  TRANSFORM   │  →   │     LOAD     │      │
│  └──────────────┘      └──────────────┘      └──────────────┘      │
│         │                      │                      │              │
│  [Data Sources]         [Processing]          [Data Warehouse]     │
│  - PostgreSQL           - Validation          - Fact Tables         │
│  - GitHub API           - Cleansing           - Dimension Tables    │
│  - AWS CloudWatch       - Enrichment          - Aggregations        │
│  - Prometheus           - Transformation                            │
│  - Application Logs     - Business Rules                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### ETL Framework: Apache Airflow

**Directory Structure**:
```
miyabi-etl/
├── dags/
│   ├── daily_issue_processing.py
│   ├── hourly_agent_metrics.py
│   ├── realtime_performance_metrics.py
│   └── weekly_dimension_refresh.py
├── plugins/
│   ├── miyabi_operators/
│   │   ├── github_operator.py
│   │   ├── aws_metrics_operator.py
│   │   └── postgres_bulk_loader.py
│   └── miyabi_hooks/
│       ├── miyabi_db_hook.py
│       └── github_api_hook.py
├── config/
│   ├── connections.yaml
│   └── variables.yaml
└── sql/
    ├── extract/
    ├── transform/
    └── load/
```

### ETL Jobs Configuration

#### Job 1: Daily Issue Processing ETL

```yaml
dag_id: daily_issue_processing_etl
schedule: "0 2 * * *"  # 2 AM daily
catchup: true
max_active_runs: 1

tasks:
  - task_id: extract_issues
    operator: PostgresOperator
    sql: sql/extract/extract_issues.sql
    conn_id: miyabi_source_db

  - task_id: extract_pull_requests
    operator: GitHubOperator
    repo: miyabi-private
    query: pulls?state=all&since={{ ds }}

  - task_id: transform_issue_facts
    operator: PythonOperator
    python_callable: transform.process_issue_facts

  - task_id: load_fact_issue_processing
    operator: PostgresBulkOperator
    table: fact_issue_processing
    conn_id: miyabi_dw
    conflict_resolution: upsert
```

**Extract SQL** (`sql/extract/extract_issues.sql`):

```sql
-- Extract issues with all related data
SELECT
    i.id AS issue_id,
    i.number AS issue_number,
    i.title,
    i.description,
    i.priority,
    i.complexity,
    i.created_at,
    i.updated_at,
    i.closed_at,

    -- Agent execution data
    ae.agent_id,
    ae.started_at AS agent_started_at,
    ae.completed_at AS agent_completed_at,
    ae.execution_duration_ms,
    ae.memory_usage_mb,
    ae.cpu_usage_percent,
    ae.llm_tokens_input,
    ae.llm_tokens_output,
    ae.llm_cost_usd,

    -- Code generation data
    cg.total_files_generated,
    cg.total_lines_generated,
    cg.compilation_time_ms,
    cg.clippy_warnings,
    cg.fmt_issues,

    -- Review data
    rr.review_score,
    rr.test_coverage_percent,

    -- Deployment data
    dp.deployment_status,
    dp.deployment_duration_seconds,

    -- Label history
    array_agg(DISTINCT lh.label_name) AS labels,

    -- Worktree
    ws.worktree_path,
    ws.branch_name

FROM issues i
LEFT JOIN agent_execution_logs ae ON i.id = ae.issue_id
LEFT JOIN code_gen_tasks cg ON i.id = cg.issue_id
LEFT JOIN review_results rr ON i.id = rr.issue_id
LEFT JOIN deployment_pipelines dp ON i.id = dp.issue_id
LEFT JOIN label_history lh ON i.id = lh.issue_id
LEFT JOIN worktree_states ws ON i.id = ws.associated_issue_id

WHERE
    i.updated_at >= '{{ ds }}'::DATE
    AND i.updated_at < '{{ ds }}'::DATE + INTERVAL '1 day'

GROUP BY
    i.id, ae.id, cg.id, rr.id, dp.id, ws.id

ORDER BY i.updated_at DESC;
```

**Transform Python** (`transform/process_issue_facts.py`):

```python
from datetime import datetime
from typing import Dict, List, Any
import pandas as pd

def process_issue_facts(ti, **context):
    """
    Transform extracted issue data into fact table format
    """
    # Pull data from XCom
    raw_data = ti.xcom_pull(task_ids='extract_issues')
    df = pd.DataFrame(raw_data)

    # Calculate derived metrics
    df['processing_duration_seconds'] = (
        (df['agent_completed_at'] - df['agent_started_at']).dt.total_seconds()
    )

    df['build_success'] = (
        (df['clippy_warnings'] == 0) & (df['fmt_issues'] == 0)
    )

    df['test_success'] = df['test_coverage_percent'] > 70

    df['deployment_success'] = (
        df['deployment_status'] == 'SUCCESS'
    )

    # Calculate costs
    df['ai_cost_usd'] = df['llm_cost_usd']
    df['infrastructure_cost_usd'] = calculate_infrastructure_cost(df)

    # Lookup dimension keys
    df['issue_key'] = lookup_dimension_key('dim_issue', df['issue_id'])
    df['agent_key'] = lookup_dimension_key('dim_agent', df['agent_id'])
    df['time_key'] = df['agent_started_at'].dt.strftime('%Y%m%d').astype(int)
    df['worktree_key'] = lookup_dimension_key('dim_worktree', df['worktree_path'])

    # Get primary label
    df['label_key'] = df['labels'].apply(get_primary_label_key)

    # Select fact table columns
    fact_columns = [
        'issue_processing_key',
        'issue_key',
        'agent_key',
        'time_key',
        'label_key',
        'worktree_key',
        'processing_duration_seconds',
        'lines_of_code_generated',
        'files_modified',
        'review_score',
        'test_coverage_percent',
        'clippy_warnings',
        'fmt_issues',
        'build_success',
        'test_success',
        'deployment_success',
        'ai_cost_usd',
        'infrastructure_cost_usd',
        'started_at',
        'completed_at',
        'issue_number',
        'commit_sha',
        'pr_number'
    ]

    result = df[fact_columns].to_dict('records')

    # Push to XCom for load task
    ti.xcom_push(key='transformed_facts', value=result)

    return len(result)

def lookup_dimension_key(dim_table: str, natural_key: Any) -> int:
    """Lookup dimension surrogate key"""
    # Implementation using SQLAlchemy or psycopg2
    pass

def calculate_infrastructure_cost(df: pd.DataFrame) -> pd.Series:
    """Calculate infrastructure cost based on resource usage"""
    # AWS pricing logic
    pass

def get_primary_label_key(labels: List[str]) -> int:
    """Get the most significant label for this issue"""
    priority_order = ['P0', 'P1', 'P2', 'P3', 'P4']
    for priority in priority_order:
        if priority in labels:
            return lookup_dimension_key('dim_label', priority)
    return lookup_dimension_key('dim_label', labels[0]) if labels else None
```

**Load SQL** (`sql/load/load_fact_issue_processing.sql`):

```sql
-- Bulk insert with conflict resolution
INSERT INTO fact_issue_processing (
    issue_key,
    agent_key,
    time_key,
    label_key,
    worktree_key,
    processing_duration_seconds,
    lines_of_code_generated,
    files_modified,
    review_score,
    test_coverage_percent,
    clippy_warnings,
    fmt_issues,
    build_success,
    test_success,
    deployment_success,
    ai_cost_usd,
    infrastructure_cost_usd,
    started_at,
    completed_at,
    issue_number,
    commit_sha,
    pr_number
)
SELECT * FROM staging.issue_processing_facts
ON CONFLICT (issue_number, started_at)
DO UPDATE SET
    processing_duration_seconds = EXCLUDED.processing_duration_seconds,
    lines_of_code_generated = EXCLUDED.lines_of_code_generated,
    review_score = EXCLUDED.review_score,
    updated_at = CURRENT_TIMESTAMP;
```

#### Job 2: Hourly Agent Metrics ETL

```yaml
dag_id: hourly_agent_metrics_etl
schedule: "0 * * * *"  # Every hour
catchup: false
max_active_runs: 1

tasks:
  - task_id: extract_agent_logs
    operator: PostgresOperator
    sql: sql/extract/extract_agent_execution.sql

  - task_id: enrich_with_llm_data
    operator: PythonOperator
    python_callable: transform.enrich_llm_metrics

  - task_id: load_fact_agent_execution
    operator: PostgresBulkOperator
    table: fact_agent_execution
```

#### Job 3: Real-time Performance Metrics

```yaml
dag_id: realtime_performance_metrics
schedule: "*/5 * * * *"  # Every 5 minutes
catchup: false

tasks:
  - task_id: collect_cloudwatch_metrics
    operator: AWSCloudWatchOperator
    namespace: Miyabi/Production
    metrics:
      - CPUUtilization
      - MemoryUtilization
      - NetworkIn
      - NetworkOut

  - task_id: collect_prometheus_metrics
    operator: PrometheusOperator
    queries:
      - request_rate
      - error_rate
      - latency_p95

  - task_id: load_performance_metrics
    operator: PostgresBulkOperator
    table: fact_performance_metrics
```

### Data Quality Checks

```python
# airflow/dags/data_quality_checks.py

from airflow.providers.common.sql.operators.sql import SQLCheckOperator

# Check for duplicate records
duplicate_check = SQLCheckOperator(
    task_id='check_duplicates',
    conn_id='miyabi_dw',
    sql="""
        SELECT COUNT(*) = 0
        FROM (
            SELECT issue_number, started_at, COUNT(*)
            FROM fact_issue_processing
            GROUP BY issue_number, started_at
            HAVING COUNT(*) > 1
        ) duplicates
    """
)

# Check for referential integrity
ref_integrity_check = SQLCheckOperator(
    task_id='check_referential_integrity',
    conn_id='miyabi_dw',
    sql="""
        SELECT COUNT(*) = 0
        FROM fact_issue_processing f
        LEFT JOIN dim_issue d ON f.issue_key = d.issue_key AND d.is_current = TRUE
        WHERE d.issue_key IS NULL
    """
)

# Check for data freshness
freshness_check = SQLCheckOperator(
    task_id='check_data_freshness',
    conn_id='miyabi_dw',
    sql="""
        SELECT MAX(completed_at) > CURRENT_TIMESTAMP - INTERVAL '2 hours'
        FROM fact_issue_processing
    """
)
```

---

## 📈 Data Marts

### Mart 1: Development Performance Mart

```sql
CREATE MATERIALIZED VIEW mart_development_performance AS
SELECT
    dt.year,
    dt.quarter,
    dt.month,
    dt.week_of_year,
    di.priority,
    di.complexity,
    da.agent_type,

    -- Volume Metrics
    COUNT(DISTINCT f.issue_processing_key) AS total_issues,
    SUM(f.files_modified) AS total_files_modified,
    SUM(f.lines_of_code_generated) AS total_lines_generated,

    -- Time Metrics
    AVG(f.processing_duration_seconds) AS avg_processing_time_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.processing_duration_seconds) AS median_processing_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY f.processing_duration_seconds) AS p95_processing_time,

    -- Quality Metrics
    AVG(f.review_score) AS avg_review_score,
    AVG(f.test_coverage_percent) AS avg_test_coverage,
    SUM(f.clippy_warnings) AS total_clippy_warnings,
    SUM(f.fmt_issues) AS total_fmt_issues,

    -- Success Rates
    AVG(CASE WHEN f.build_success THEN 100.0 ELSE 0.0 END) AS build_success_rate,
    AVG(CASE WHEN f.test_success THEN 100.0 ELSE 0.0 END) AS test_success_rate,
    AVG(CASE WHEN f.deployment_success THEN 100.0 ELSE 0.0 END) AS deployment_success_rate,

    -- Cost Metrics
    SUM(f.ai_cost_usd) AS total_ai_cost_usd,
    SUM(f.infrastructure_cost_usd) AS total_infra_cost_usd,
    AVG(f.ai_cost_usd) AS avg_cost_per_issue,

    -- DORA Metrics
    COUNT(DISTINCT f.issue_processing_key) FILTER (WHERE f.deployment_success) /
        NULLIF(EXTRACT(DAY FROM MAX(f.completed_at) - MIN(f.started_at)), 0) AS deployment_frequency_per_day,
    AVG(f.processing_duration_seconds) FILTER (WHERE f.deployment_success) / 3600.0 AS mean_lead_time_hours,
    AVG(CASE WHEN NOT f.deployment_success THEN 100.0 ELSE 0.0 END) AS change_failure_rate

FROM fact_issue_processing f
JOIN dim_time dt ON f.time_key = dt.time_key
JOIN dim_issue di ON f.issue_key = di.issue_key AND di.is_current = TRUE
JOIN dim_agent da ON f.agent_key = da.agent_key

GROUP BY
    dt.year, dt.quarter, dt.month, dt.week_of_year,
    di.priority, di.complexity, da.agent_type;

CREATE UNIQUE INDEX idx_mart_dev_perf ON mart_development_performance(
    year, quarter, month, week_of_year, priority, complexity, agent_type
);

-- Refresh schedule: Daily
```

### Mart 2: Agent Performance Mart

```sql
CREATE MATERIALIZED VIEW mart_agent_performance AS
SELECT
    dt.year,
    dt.month,
    da.agent_name,
    da.agent_type,
    da.ai_model,

    -- Execution Metrics
    COUNT(*) AS total_executions,
    SUM(CASE WHEN f.success THEN 1 ELSE 0 END) AS successful_executions,
    AVG(CASE WHEN f.success THEN 100.0 ELSE 0.0 END) AS success_rate,

    -- Performance Metrics
    AVG(f.execution_duration_ms) AS avg_execution_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY f.execution_duration_ms) AS p95_execution_ms,
    AVG(f.memory_usage_mb) AS avg_memory_mb,
    AVG(f.cpu_usage_percent) AS avg_cpu_percent,

    -- API & Cache Metrics
    SUM(f.api_calls_count) AS total_api_calls,
    AVG(f.cache_hit_rate) AS avg_cache_hit_rate,

    -- LLM Metrics
    SUM(f.llm_tokens_input) AS total_input_tokens,
    SUM(f.llm_tokens_output) AS total_output_tokens,
    SUM(f.llm_requests_count) AS total_llm_requests,
    SUM(f.llm_cost_usd) AS total_llm_cost,
    AVG(f.llm_cost_usd) AS avg_cost_per_execution,

    -- Error Metrics
    SUM(f.error_count) AS total_errors,
    SUM(f.retry_count) AS total_retries,

    -- Efficiency Metrics
    SUM(f.llm_tokens_output) / NULLIF(SUM(f.execution_duration_ms) / 1000.0, 0) AS tokens_per_second,
    SUM(f.llm_cost_usd) / NULLIF(COUNT(*), 0) AS cost_efficiency_score

FROM fact_agent_execution f
JOIN dim_time dt ON f.time_key = dt.time_key
JOIN dim_agent da ON f.agent_key = da.agent_key

GROUP BY dt.year, dt.month, da.agent_name, da.agent_type, da.ai_model;

CREATE UNIQUE INDEX idx_mart_agent_perf ON mart_agent_performance(
    year, month, agent_name, agent_type
);
```

### Mart 3: Infrastructure Cost Mart

```sql
CREATE MATERIALIZED VIEW mart_infrastructure_cost AS
SELECT
    dt.year,
    dt.month,
    dt.day_of_month,
    dinf.resource_type,
    dinf.region,
    dinf.instance_type,

    -- Deployment Metrics
    COUNT(DISTINCT fd.deployment_key) AS total_deployments,
    AVG(fd.deployment_duration_seconds) AS avg_deployment_duration,

    -- Cost Breakdown
    SUM(fd.infrastructure_cost_usd) AS total_infrastructure_cost,
    SUM(fd.data_transfer_cost_usd) AS total_data_transfer_cost,
    SUM(fd.total_cost_usd) AS total_cost,

    -- Resource Utilization (from performance metrics)
    AVG(fpm.cpu_utilization_percent) AS avg_cpu_utilization,
    AVG(fpm.memory_utilization_percent) AS avg_memory_utilization,
    AVG(fpm.disk_usage_percent) AS avg_disk_usage,

    -- Cost Efficiency
    SUM(fd.total_cost_usd) / NULLIF(COUNT(DISTINCT fd.deployment_key), 0) AS cost_per_deployment,
    SUM(fd.total_cost_usd) / NULLIF(SUM(fd.deployment_duration_seconds) / 3600.0, 0) AS cost_per_hour,

    -- Health Score
    AVG(fd.health_check_pass_rate) AS avg_health_score,
    SUM(fd.error_count) AS total_errors,
    SUM(fd.rollback_count) AS total_rollbacks

FROM fact_deployment fd
JOIN dim_time dt ON fd.time_key = dt.time_key
JOIN dim_infrastructure dinf ON fd.infrastructure_key = dinf.infrastructure_key AND dinf.is_current = TRUE
LEFT JOIN fact_performance_metrics fpm ON
    fpm.infrastructure_key = fd.infrastructure_key
    AND fpm.time_key = dt.time_key

GROUP BY
    dt.year, dt.month, dt.day_of_month,
    dinf.resource_type, dinf.region, dinf.instance_type;

CREATE UNIQUE INDEX idx_mart_infra_cost ON mart_infrastructure_cost(
    year, month, day_of_month, resource_type, region
);
```

---

## 🚀 Implementation Guide

### Phase 1: Foundation (Week 1-2)

1. **Database Setup**
   ```bash
   # Create database
   createdb miyabi_dw

   # Install extensions
   psql miyabi_dw -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
   psql miyabi_dw -c "CREATE EXTENSION IF NOT EXISTS pg_stat_statements;"

   # Run DDL scripts
   psql miyabi_dw -f sql/ddl/dimensions.sql
   psql miyabi_dw -f sql/ddl/facts.sql
   psql miyabi_dw -f sql/ddl/indexes.sql
   ```

2. **Dimension Population**
   ```bash
   # Populate dim_time (10 years)
   psql miyabi_dw -c "SELECT populate_dim_time('2020-01-01', '2030-12-31');"

   # Initial dimension loads
   psql miyabi_dw -f sql/initial_load/load_dim_agent.sql
   psql miyabi_dw -f sql/initial_load/load_dim_label.sql
   ```

3. **Airflow Setup**
   ```bash
   # Install Airflow
   pip install apache-airflow[postgres,celery,redis]

   # Initialize database
   airflow db init

   # Create admin user
   airflow users create \
       --username admin \
       --firstname Admin \
       --lastname Miyabi \
       --role Admin \
       --email admin@miyabi.dev
   ```

### Phase 2: ETL Development (Week 3-4)

1. **Extract Layer**
   - Implement source connectors
   - Create staging tables
   - Configure incremental extraction

2. **Transform Layer**
   - Data validation rules
   - Business logic implementation
   - Data quality checks

3. **Load Layer**
   - Bulk loading optimization
   - Conflict resolution
   - Error handling

### Phase 3: Data Marts (Week 5)

1. **Create Materialized Views**
   ```bash
   psql miyabi_dw -f sql/marts/mart_development_performance.sql
   psql miyabi_dw -f sql/marts/mart_agent_performance.sql
   psql miyabi_dw -f sql/marts/mart_infrastructure_cost.sql
   ```

2. **Schedule Refresh Jobs**
   ```python
   # airflow/dags/refresh_marts.py
   refresh_dev_perf = PostgresOperator(
       task_id='refresh_development_performance',
       sql='REFRESH MATERIALIZED VIEW CONCURRENTLY mart_development_performance'
   )
   ```

### Phase 4: BI Integration (Week 6)

1. **Install Metabase**
   ```bash
   docker run -d -p 3000:3000 \
       -e MB_DB_TYPE=postgres \
       -e MB_DB_DBNAME=miyabi_dw \
       -e MB_DB_PORT=5432 \
       -e MB_DB_USER=metabase \
       -e MB_DB_PASS=secret \
       -e MB_DB_HOST=postgres \
       --name metabase metabase/metabase
   ```

2. **Create Dashboards**
   - Development Performance Dashboard
   - Agent Performance Dashboard
   - Infrastructure Cost Dashboard
   - DORA Metrics Dashboard

### Phase 5: Monitoring & Optimization (Week 7-8)

1. **Performance Monitoring**
   ```sql
   -- Create monitoring views
   CREATE VIEW etl_job_performance AS
   SELECT
       dag_id,
       task_id,
       execution_date,
       duration,
       state
   FROM airflow.task_instance
   WHERE execution_date > CURRENT_DATE - 7;
   ```

2. **Query Optimization**
   - Analyze slow queries
   - Add missing indexes
   - Optimize materialized view refresh

3. **Data Retention Policies**
   ```sql
   -- Archive old fact data
   CREATE TABLE fact_issue_processing_archive
       (LIKE fact_issue_processing INCLUDING ALL)
       PARTITION BY RANGE (completed_at);

   -- Move data older than 2 years to archive
   INSERT INTO fact_issue_processing_archive
   SELECT * FROM fact_issue_processing
   WHERE completed_at < CURRENT_DATE - INTERVAL '2 years';
   ```

---

## 📝 Maintenance & Operations

### Daily Operations

```bash
# Check ETL job status
airflow dags list-runs -d daily_issue_processing_etl

# Refresh materialized views
psql miyabi_dw -c "REFRESH MATERIALIZED VIEW CONCURRENTLY mart_development_performance;"

# Vacuum and analyze
psql miyabi_dw -c "VACUUM ANALYZE fact_issue_processing;"
```

### Weekly Operations

```bash
# Update table statistics
psql miyabi_dw -c "ANALYZE;"

# Check dimension SCD updates
psql miyabi_dw -f sql/maintenance/check_scd_integrity.sql

# Archive old data
psql miyabi_dw -f sql/maintenance/archive_old_facts.sql
```

### Monthly Operations

```bash
# Full vacuum
psql miyabi_dw -c "VACUUM FULL ANALYZE;"

# Rebuild indexes
psql miyabi_dw -f sql/maintenance/rebuild_indexes.sql

# Update dimension forecasts
psql miyabi_dw -f sql/maintenance/forecast_dimensions.sql
```

---

## 🎯 Success Metrics

### Data Quality KPIs

- **Data Accuracy**: 99.9%
- **Data Freshness**: < 1 hour lag
- **ETL Success Rate**: > 99.5%
- **Query Performance**: p95 < 5 seconds

### Business KPIs

- **Issue Resolution Time**: Track trend
- **Agent Efficiency**: Cost per task
- **Deployment Frequency**: DORA metric
- **Infrastructure Cost Optimization**: 20% reduction target

---

## 📚 References

- [Kimball Dimensional Modeling](https://www.kimballgroup.com)
- [Apache Airflow Documentation](https://airflow.apache.org)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [DORA Metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-18
**Maintained By**: Miyabi Architecture Team
