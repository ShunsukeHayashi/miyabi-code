-- Miyabi Data Warehouse - Infrastructure Cost Mart
-- Version: 1.0.0

-- ============================================================================
-- INFRASTRUCTURE COST MART
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mart_infrastructure_cost AS
SELECT
    dt.year,
    dt.quarter,
    dt.month,
    dt.week_of_year,
    di.cloud_provider,
    di.region,
    di.resource_type,
    di.instance_type,

    -- Deployment Volume
    COUNT(DISTINCT fd.deployment_key) AS total_deployments,
    COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_status = 'SUCCESS') AS successful_deployments,
    COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_status = 'FAILED') AS failed_deployments,
    COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_status = 'ROLLED_BACK') AS rolled_back_deployments,

    -- Success Rate
    AVG(CASE WHEN fd.deployment_status = 'SUCCESS' THEN 100.0 ELSE 0.0 END) AS deployment_success_rate,

    -- Deployment Duration Metrics (in seconds)
    AVG(fd.deployment_duration_seconds) AS avg_deployment_time_seconds,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fd.deployment_duration_seconds) AS median_deployment_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY fd.deployment_duration_seconds) AS p95_deployment_time,
    MIN(fd.deployment_duration_seconds) AS min_deployment_time,
    MAX(fd.deployment_duration_seconds) AS max_deployment_time,

    -- Resource Metrics
    AVG(fd.resource_count) AS avg_resource_count,
    MAX(fd.resource_count) AS max_resource_count,
    AVG(fd.container_count) AS avg_container_count,
    MAX(fd.container_count) AS max_container_count,

    -- Health Metrics
    AVG(fd.health_check_pass_rate) AS avg_health_check_pass_rate,
    SUM(fd.error_count) AS total_deployment_errors,
    SUM(fd.warning_count) AS total_deployment_warnings,
    SUM(fd.rollback_count) AS total_rollbacks,

    -- Cost Metrics (USD)
    SUM(fd.infrastructure_cost_usd) AS total_infrastructure_cost,
    SUM(fd.data_transfer_cost_usd) AS total_data_transfer_cost,
    SUM(fd.total_cost_usd) AS total_cost,
    AVG(fd.total_cost_usd) AS avg_cost_per_deployment,

    -- Cost by Environment
    SUM(fd.total_cost_usd) FILTER (WHERE fd.environment = 'production') AS production_cost,
    SUM(fd.total_cost_usd) FILTER (WHERE fd.environment = 'staging') AS staging_cost,
    SUM(fd.total_cost_usd) FILTER (WHERE fd.environment = 'dev') AS dev_cost,

    -- Cost Breakdown
    SUM(fd.infrastructure_cost_usd) / NULLIF(SUM(fd.total_cost_usd), 0) * 100 AS infrastructure_cost_percent,
    SUM(fd.data_transfer_cost_usd) / NULLIF(SUM(fd.total_cost_usd), 0) * 100 AS data_transfer_cost_percent,

    -- Deployment Type Distribution
    COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_type = 'BLUE_GREEN') AS blue_green_deployments,
    COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_type = 'CANARY') AS canary_deployments,
    COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_type = 'ROLLING') AS rolling_deployments,
    COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_type = 'RECREATE') AS recreate_deployments,

    -- Cost Efficiency Metrics
    SUM(fd.total_cost_usd) / NULLIF(COUNT(DISTINCT fd.deployment_key) FILTER (WHERE fd.deployment_status = 'SUCCESS'), 0) AS cost_per_successful_deployment,
    SUM(fd.total_cost_usd) / NULLIF(SUM(fd.deployment_duration_seconds) / 3600.0, 0) AS cost_per_hour,

    -- Infrastructure Details (from dimension)
    AVG(di.cpu_count) AS avg_cpu_count,
    AVG(di.memory_gb) AS avg_memory_gb,
    AVG(di.storage_gb) AS avg_storage_gb,
    AVG(di.hourly_cost_usd) AS avg_hourly_infra_cost,
    AVG(di.monthly_cost_usd) AS avg_monthly_infra_cost,

    -- Temporal Bounds
    MIN(fd.started_at) AS period_start,
    MAX(fd.completed_at) AS period_end

FROM fact_deployment fd
JOIN dim_time dt ON fd.time_key = dt.time_key
JOIN dim_infrastructure di ON fd.infrastructure_key = di.infrastructure_key AND di.is_current = TRUE

GROUP BY
    dt.year, dt.quarter, dt.month, dt.week_of_year,
    di.cloud_provider, di.region, di.resource_type, di.instance_type;

CREATE UNIQUE INDEX idx_mart_infra_cost ON mart_infrastructure_cost(
    year, quarter, month, week_of_year, cloud_provider, region, resource_type, instance_type
);

CREATE INDEX idx_mart_infra_cost_year_month ON mart_infrastructure_cost(year, month);
CREATE INDEX idx_mart_infra_cost_provider ON mart_infrastructure_cost(cloud_provider);
CREATE INDEX idx_mart_infra_cost_region ON mart_infrastructure_cost(region);
CREATE INDEX idx_mart_infra_cost_type ON mart_infrastructure_cost(resource_type);

COMMENT ON MATERIALIZED VIEW mart_infrastructure_cost IS
    'Infrastructure cost and deployment metrics aggregated by time and resource attributes';

-- ============================================================================
-- SUPPLEMENTARY VIEW: Cost Trend Analysis
-- ============================================================================

CREATE OR REPLACE VIEW v_cost_trend_analysis AS
SELECT
    year,
    month,
    cloud_provider,

    -- Current Month
    total_cost AS current_month_cost,
    total_deployments AS current_month_deployments,

    -- Previous Month (using LAG)
    LAG(total_cost) OVER (
        PARTITION BY cloud_provider
        ORDER BY year, month
    ) AS previous_month_cost,
    LAG(total_deployments) OVER (
        PARTITION BY cloud_provider
        ORDER BY year, month
    ) AS previous_month_deployments,

    -- Month-over-Month Growth
    ((total_cost - LAG(total_cost) OVER (
        PARTITION BY cloud_provider
        ORDER BY year, month
    )) / NULLIF(LAG(total_cost) OVER (
        PARTITION BY cloud_provider
        ORDER BY year, month
    ), 0) * 100) AS cost_growth_percent,

    -- 3-Month Moving Average
    AVG(total_cost) OVER (
        PARTITION BY cloud_provider
        ORDER BY year, month
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS three_month_avg_cost,

    -- Year-to-Date Total
    SUM(total_cost) OVER (
        PARTITION BY cloud_provider, year
        ORDER BY month
    ) AS ytd_total_cost

FROM mart_infrastructure_cost
GROUP BY year, month, cloud_provider, total_cost, total_deployments
ORDER BY year DESC, month DESC, cloud_provider;

COMMENT ON VIEW v_cost_trend_analysis IS
    'Cost trend analysis with MoM growth, moving averages, and YTD totals';
