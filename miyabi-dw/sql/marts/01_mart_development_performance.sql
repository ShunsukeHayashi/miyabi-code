-- Miyabi Data Warehouse - Development Performance Mart
-- Version: 1.0.0

-- ============================================================================
-- DEVELOPMENT PERFORMANCE MART
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mart_development_performance AS
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

    -- Time Metrics (in seconds)
    AVG(f.processing_duration_seconds) AS avg_processing_time_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY f.processing_duration_seconds) AS median_processing_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY f.processing_duration_seconds) AS p95_processing_time,
    MIN(f.processing_duration_seconds) AS min_processing_time,
    MAX(f.processing_duration_seconds) AS max_processing_time,

    -- Quality Metrics
    AVG(f.review_score) AS avg_review_score,
    AVG(f.test_coverage_percent) AS avg_test_coverage,
    SUM(f.clippy_warnings) AS total_clippy_warnings,
    SUM(f.fmt_issues) AS total_fmt_issues,

    -- Success Rates (as percentages)
    AVG(CASE WHEN f.build_success THEN 100.0 ELSE 0.0 END) AS build_success_rate,
    AVG(CASE WHEN f.test_success THEN 100.0 ELSE 0.0 END) AS test_success_rate,
    AVG(CASE WHEN f.deployment_success THEN 100.0 ELSE 0.0 END) AS deployment_success_rate,

    -- Cost Metrics
    SUM(f.ai_cost_usd) AS total_ai_cost_usd,
    SUM(f.infrastructure_cost_usd) AS total_infra_cost_usd,
    SUM(f.ai_cost_usd + f.infrastructure_cost_usd) AS total_cost_usd,
    AVG(f.ai_cost_usd + f.infrastructure_cost_usd) AS avg_cost_per_issue,

    -- Productivity Metrics
    SUM(f.lines_of_code_generated) / NULLIF(SUM(f.processing_duration_seconds) / 3600.0, 0) AS lines_per_hour,
    COUNT(DISTINCT f.issue_processing_key) / NULLIF(EXTRACT(DAY FROM MAX(f.completed_at) - MIN(f.started_at)), 0) AS issues_per_day,

    -- DORA Metrics
    COUNT(DISTINCT f.issue_processing_key) FILTER (WHERE f.deployment_success) /
        NULLIF(EXTRACT(DAY FROM MAX(f.completed_at) - MIN(f.started_at)), 0) AS deployment_frequency_per_day,
    AVG(f.processing_duration_seconds) FILTER (WHERE f.deployment_success) / 3600.0 AS mean_lead_time_hours,
    AVG(CASE WHEN NOT COALESCE(f.deployment_success, FALSE) THEN 100.0 ELSE 0.0 END) AS change_failure_rate,

    -- Temporal Bounds
    MIN(f.started_at) AS period_start,
    MAX(f.completed_at) AS period_end

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

CREATE INDEX idx_mart_dev_perf_year_month ON mart_development_performance(year, month);
CREATE INDEX idx_mart_dev_perf_priority ON mart_development_performance(priority);
CREATE INDEX idx_mart_dev_perf_agent ON mart_development_performance(agent_type);

COMMENT ON MATERIALIZED VIEW mart_development_performance IS
    'Development performance metrics with DORA indicators, aggregated by time/priority/agent';
