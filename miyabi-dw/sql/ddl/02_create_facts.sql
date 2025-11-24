-- Miyabi Data Warehouse - Fact Tables DDL
-- Version: 1.0.0
-- PostgreSQL 15+

-- ============================================================================
-- FACT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- F1: fact_issue_processing
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_issue_processing (
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

    CONSTRAINT valid_duration CHECK (completed_at >= started_at),
    CONSTRAINT positive_lines CHECK (lines_of_code_generated >= 0)
);

CREATE INDEX idx_fip_time ON fact_issue_processing(time_key);
CREATE INDEX idx_fip_agent ON fact_issue_processing(agent_key);
CREATE INDEX idx_fip_issue ON fact_issue_processing(issue_key);
CREATE INDEX idx_fip_completed ON fact_issue_processing(completed_at);
CREATE INDEX idx_fip_issue_started ON fact_issue_processing(issue_number, started_at);
CREATE UNIQUE INDEX idx_fip_unique_processing ON fact_issue_processing(issue_number, started_at);

COMMENT ON TABLE fact_issue_processing IS 'Comprehensive metrics for issue processing lifecycle';

-- ----------------------------------------------------------------------------
-- F2: fact_code_generation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_code_generation (
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

    CONSTRAINT positive_lines_gen CHECK (total_lines_generated >= 0)
);

CREATE INDEX idx_fcg_agent ON fact_code_generation(agent_key);
CREATE INDEX idx_fcg_time ON fact_code_generation(time_key);
CREATE INDEX idx_fcg_issue ON fact_code_generation(issue_key);
CREATE INDEX idx_fcg_created ON fact_code_generation(created_at);
CREATE INDEX idx_fcg_model ON fact_code_generation(ai_model_name);

COMMENT ON TABLE fact_code_generation IS 'Detailed metrics for AI-driven code generation tasks';

-- ----------------------------------------------------------------------------
-- F3: fact_deployment
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_deployment (
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

    CONSTRAINT valid_deploy_duration CHECK (completed_at >= started_at)
);

CREATE INDEX idx_fd_infra ON fact_deployment(infrastructure_key);
CREATE INDEX idx_fd_time ON fact_deployment(time_key);
CREATE INDEX idx_fd_issue ON fact_deployment(issue_key);
CREATE INDEX idx_fd_agent ON fact_deployment(agent_key);
CREATE INDEX idx_fd_status ON fact_deployment(deployment_status);
CREATE INDEX idx_fd_env ON fact_deployment(environment);
CREATE INDEX idx_fd_completed ON fact_deployment(completed_at);

COMMENT ON TABLE fact_deployment IS 'Deployment execution tracking with cost and health metrics';

-- ----------------------------------------------------------------------------
-- F4: fact_agent_execution
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_agent_execution (
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

    CONSTRAINT valid_exec_time CHECK (completed_at >= started_at)
);

CREATE INDEX idx_fae_agent ON fact_agent_execution(agent_key);
CREATE INDEX idx_fae_time ON fact_agent_execution(time_key);
CREATE INDEX idx_fae_issue ON fact_agent_execution(issue_key);
CREATE INDEX idx_fae_worktree ON fact_agent_execution(worktree_key);
CREATE INDEX idx_fae_success ON fact_agent_execution(success);
CREATE INDEX idx_fae_completed ON fact_agent_execution(completed_at);
CREATE INDEX idx_fae_llm_model ON fact_agent_execution(llm_model);

COMMENT ON TABLE fact_agent_execution IS 'Agent execution logs with performance and cost metrics';

-- ----------------------------------------------------------------------------
-- F5: fact_performance_metrics
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fact_performance_metrics (
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

-- For TimescaleDB optimization (optional)
-- SELECT create_hypertable('fact_performance_metrics', 'measured_at', if_not_exists => TRUE);

COMMENT ON TABLE fact_performance_metrics IS 'System and application performance time-series metrics';

-- ============================================================================
-- STAGING TABLES (for ETL)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS staging;

-- Staging table for issue processing facts
CREATE TABLE IF NOT EXISTS staging.issue_processing_facts (
    LIKE fact_issue_processing INCLUDING ALL
);

-- Staging table for code generation facts
CREATE TABLE IF NOT EXISTS staging.code_generation_facts (
    LIKE fact_code_generation INCLUDING ALL
);

-- Staging table for deployment facts
CREATE TABLE IF NOT EXISTS staging.deployment_facts (
    LIKE fact_deployment INCLUDING ALL
);

-- Staging table for agent execution facts
CREATE TABLE IF NOT EXISTS staging.agent_execution_facts (
    LIKE fact_agent_execution INCLUDING ALL
);

-- Staging table for performance metrics
CREATE TABLE IF NOT EXISTS staging.performance_metrics_facts (
    LIKE fact_performance_metrics INCLUDING ALL
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get or create time_key
CREATE OR REPLACE FUNCTION get_time_key(p_date TIMESTAMP)
RETURNS INT AS $$
BEGIN
    RETURN TO_CHAR(p_date, 'YYYYMMDD')::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_time_key IS 'Convert timestamp to time_key for dimension lookup';

-- ============================================================================
-- DATA QUALITY VIEWS
-- ============================================================================

-- View to check fact table data quality
CREATE OR REPLACE VIEW v_fact_data_quality AS
SELECT
    'fact_issue_processing' AS table_name,
    COUNT(*) AS total_records,
    COUNT(CASE WHEN issue_key IS NULL THEN 1 END) AS null_issue_key,
    COUNT(CASE WHEN agent_key IS NULL THEN 1 END) AS null_agent_key,
    COUNT(CASE WHEN time_key IS NULL THEN 1 END) AS null_time_key,
    MIN(started_at) AS earliest_record,
    MAX(completed_at) AS latest_record
FROM fact_issue_processing

UNION ALL

SELECT
    'fact_code_generation',
    COUNT(*),
    COUNT(CASE WHEN issue_key IS NULL THEN 1 END),
    COUNT(CASE WHEN agent_key IS NULL THEN 1 END),
    COUNT(CASE WHEN time_key IS NULL THEN 1 END),
    MIN(created_at),
    MAX(created_at)
FROM fact_code_generation

UNION ALL

SELECT
    'fact_deployment',
    COUNT(*),
    COUNT(CASE WHEN issue_key IS NULL THEN 1 END),
    COUNT(CASE WHEN agent_key IS NULL THEN 1 END),
    COUNT(CASE WHEN time_key IS NULL THEN 1 END),
    MIN(started_at),
    MAX(completed_at)
FROM fact_deployment

UNION ALL

SELECT
    'fact_agent_execution',
    COUNT(*),
    COUNT(CASE WHEN issue_key IS NULL THEN 1 END),
    COUNT(CASE WHEN agent_key IS NULL THEN 1 END),
    COUNT(CASE WHEN time_key IS NULL THEN 1 END),
    MIN(started_at),
    MAX(completed_at)
FROM fact_agent_execution

UNION ALL

SELECT
    'fact_performance_metrics',
    COUNT(*),
    0, -- No issue_key in performance metrics
    0, -- No agent_key
    COUNT(CASE WHEN time_key IS NULL THEN 1 END),
    MIN(measured_at),
    MAX(measured_at)
FROM fact_performance_metrics;

COMMENT ON VIEW v_fact_data_quality IS 'Data quality metrics for all fact tables';
