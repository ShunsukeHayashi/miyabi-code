-- Miyabi Data Warehouse - Agent Performance Mart
-- Version: 1.0.0

-- ============================================================================
-- AGENT PERFORMANCE MART
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mart_agent_performance AS
SELECT
    dt.year,
    dt.quarter,
    dt.month,
    dt.week_of_year,
    da.agent_type,
    da.agent_name,
    da.ai_model,
    da.ai_provider,

    -- Volume Metrics
    COUNT(DISTINCT f.execution_key) AS total_executions,
    COUNT(DISTINCT f.issue_key) AS unique_issues_handled,
    SUM(f.llm_requests_count) AS total_llm_requests,

    -- Performance Metrics (in milliseconds)
    AVG(f.execution_duration_ms) AS avg_execution_time_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.execution_duration_ms) AS median_execution_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY f.execution_duration_ms) AS p95_execution_time_ms,
    MIN(f.execution_duration_ms) AS min_execution_time_ms,
    MAX(f.execution_duration_ms) AS max_execution_time_ms,

    -- Resource Usage
    AVG(f.memory_usage_mb) AS avg_memory_mb,
    MAX(f.memory_usage_mb) AS peak_memory_mb,
    AVG(f.cpu_usage_percent) AS avg_cpu_percent,
    MAX(f.cpu_usage_percent) AS peak_cpu_percent,
    SUM(f.disk_io_mb) AS total_disk_io_mb,

    -- API Metrics
    SUM(f.api_calls_count) AS total_api_calls,
    SUM(f.api_errors_count) AS total_api_errors,
    AVG(CASE
        WHEN f.api_calls_count > 0
        THEN (f.api_errors_count::DECIMAL / f.api_calls_count * 100)
        ELSE 0
    END) AS avg_api_error_rate,

    -- Cache Performance
    SUM(f.cache_hit_count) AS total_cache_hits,
    SUM(f.cache_miss_count) AS total_cache_misses,
    AVG(CASE
        WHEN (f.cache_hit_count + f.cache_miss_count) > 0
        THEN (f.cache_hit_count::DECIMAL / (f.cache_hit_count + f.cache_miss_count) * 100)
        ELSE 0
    END) AS avg_cache_hit_rate,

    -- LLM Token Usage
    SUM(f.llm_tokens_input) AS total_tokens_input,
    SUM(f.llm_tokens_output) AS total_tokens_output,
    SUM(f.llm_tokens_input + f.llm_tokens_output) AS total_tokens,
    AVG(f.llm_tokens_input + f.llm_tokens_output) AS avg_tokens_per_execution,

    -- LLM Cost Metrics
    SUM(f.llm_cost_usd) AS total_llm_cost_usd,
    AVG(f.llm_cost_usd) AS avg_llm_cost_per_execution,
    SUM(f.llm_cost_usd) / NULLIF(COUNT(DISTINCT f.issue_key), 0) AS avg_llm_cost_per_issue,

    -- Success Metrics
    COUNT(DISTINCT f.execution_key) FILTER (WHERE f.success = TRUE) AS successful_executions,
    COUNT(DISTINCT f.execution_key) FILTER (WHERE f.success = FALSE) AS failed_executions,
    AVG(CASE WHEN f.success THEN 100.0 ELSE 0.0 END) AS success_rate,

    -- Error Metrics
    SUM(f.error_count) AS total_errors,
    SUM(f.warning_count) AS total_warnings,
    AVG(f.retry_count) AS avg_retry_count,
    MAX(f.retry_count) AS max_retry_count,

    -- Efficiency Metrics
    AVG(CASE
        WHEN f.execution_duration_ms > 0
        THEN ((f.llm_tokens_input + f.llm_tokens_output)::DECIMAL / f.execution_duration_ms * 1000)
        ELSE 0
    END) AS tokens_per_second,
    AVG(CASE
        WHEN f.llm_cost_usd > 0
        THEN ((f.llm_tokens_input + f.llm_tokens_output)::DECIMAL / f.llm_cost_usd)
        ELSE 0
    END) AS tokens_per_dollar,

    -- Temporal Bounds
    MIN(f.started_at) AS period_start,
    MAX(f.completed_at) AS period_end

FROM fact_agent_execution f
JOIN dim_time dt ON f.time_key = dt.time_key
JOIN dim_agent da ON f.agent_key = da.agent_key

GROUP BY
    dt.year, dt.quarter, dt.month, dt.week_of_year,
    da.agent_type, da.agent_name, da.ai_model, da.ai_provider;

CREATE UNIQUE INDEX idx_mart_agent_perf ON mart_agent_performance(
    year, quarter, month, week_of_year, agent_type, agent_name, ai_model
);

CREATE INDEX idx_mart_agent_perf_year_month ON mart_agent_performance(year, month);
CREATE INDEX idx_mart_agent_perf_agent_type ON mart_agent_performance(agent_type);
CREATE INDEX idx_mart_agent_perf_ai_model ON mart_agent_performance(ai_model);

COMMENT ON MATERIALIZED VIEW mart_agent_performance IS
    'Agent performance metrics including LLM usage, cost, and efficiency indicators';
