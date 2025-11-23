-- Miyabi Data Warehouse - Load dim_agent
-- Version: 1.0.0
-- This script loads agent definitions into the dimension table

-- ============================================================================
-- LOAD MIYABI AGENTS
-- ============================================================================

INSERT INTO dim_agent (
    agent_id,
    agent_name,
    agent_type,
    agent_category,
    ai_model,
    ai_provider,
    model_version,
    framework_version,
    capabilities,
    max_concurrent_tasks,
    cost_per_hour_usd,
    cost_per_token_usd,
    is_active
) VALUES
    -- Technical Agents
    ('agent-codegen', 'CodeGen Agent', 'CodeGen', 'Technical', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['code_generation', 'rust', 'automated_testing'], 5, 0.50, 0.000003, TRUE),

    ('agent-review', 'Review Agent', 'Review', 'Technical', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['code_review', 'static_analysis', 'quality_metrics'], 10, 0.30, 0.000003, TRUE),

    ('agent-deployment', 'Deployment Agent', 'Deployment', 'Technical', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['ci_cd', 'infrastructure', 'health_checks', 'rollback'], 3, 0.40, 0.000003, TRUE),

    ('agent-issue', 'Issue Agent', 'Issue', 'Technical', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['issue_analysis', 'label_inference', 'priority_classification'], 15, 0.20, 0.000003, TRUE),

    ('agent-coordinator', 'Coordinator Agent', 'Coordinator', 'Technical', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['dag_management', 'task_orchestration', 'parallel_execution'], 1, 0.60, 0.000003, TRUE),

    -- Business Agents
    ('agent-business-strategy', 'Business Strategy Agent', 'Business', 'Business', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['business_planning', 'persona_development', 'product_concept'], 3, 0.45, 0.000003, TRUE),

    ('agent-marketing', 'Marketing Agent', 'Marketing', 'Business', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['content_marketing', 'sns_strategy', 'seo'], 5, 0.35, 0.000003, TRUE),

    ('agent-sales', 'Sales Agent', 'Sales', 'Business', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['lead_generation', 'sales_funnel', 'conversion_optimization'], 5, 0.40, 0.000003, TRUE),

    ('agent-crm', 'CRM Agent', 'CRM', 'Business', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['customer_management', 'ltv_optimization', 'churn_reduction'], 8, 0.30, 0.000003, TRUE),

    ('agent-analytics', 'Analytics Agent', 'Analytics', 'Business', 'claude-sonnet-4', 'Anthropic', '20250415', '1.0.0',
     ARRAY['data_analysis', 'kpi_tracking', 'pdca_cycle'], 5, 0.35, 0.000003, TRUE)

ON CONFLICT (agent_id) DO UPDATE SET
    agent_name = EXCLUDED.agent_name,
    agent_type = EXCLUDED.agent_type,
    agent_category = EXCLUDED.agent_category,
    ai_model = EXCLUDED.ai_model,
    ai_provider = EXCLUDED.ai_provider,
    model_version = EXCLUDED.model_version,
    framework_version = EXCLUDED.framework_version,
    capabilities = EXCLUDED.capabilities,
    max_concurrent_tasks = EXCLUDED.max_concurrent_tasks,
    cost_per_hour_usd = EXCLUDED.cost_per_hour_usd,
    cost_per_token_usd = EXCLUDED.cost_per_token_usd,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Verify load
SELECT
    agent_type,
    agent_category,
    COUNT(*) AS agent_count,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_count
FROM dim_agent
GROUP BY agent_type, agent_category
ORDER BY agent_category, agent_type;

-- Display loaded agents
SELECT
    agent_id,
    agent_name,
    agent_type,
    agent_category,
    ai_model,
    max_concurrent_tasks,
    cost_per_hour_usd,
    is_active
FROM dim_agent
ORDER BY agent_category, agent_type;
