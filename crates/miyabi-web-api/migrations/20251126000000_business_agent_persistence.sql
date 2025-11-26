-- Business Agent Persistence Enhancement
-- Created: 2025-11-26
-- Description: Add analysis metrics and enhance agent_executions for business agents

-- Add user_id to agent_executions if not exists (for business agents)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='agent_executions' AND column_name='user_id'
    ) THEN
        ALTER TABLE agent_executions ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add error_message column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='agent_executions' AND column_name='error_message'
    ) THEN
        ALTER TABLE agent_executions ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- Rename result_summary to result for consistency
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='agent_executions' AND column_name='result_summary'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='agent_executions' AND column_name='result'
    ) THEN
        ALTER TABLE agent_executions RENAME COLUMN result_summary TO result;
    END IF;
END $$;

-- Create business_agent_analytics table for detailed metrics
CREATE TABLE IF NOT EXISTS business_agent_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,

    -- Generic analytics data
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Market research specific
    competitors_analyzed INTEGER,
    market_size_usd BIGINT,
    growth_rate_percent DECIMAL(5,2),

    -- Sales/Marketing specific
    conversion_rate DECIMAL(5,2),
    target_audience_size INTEGER,
    estimated_revenue_usd BIGINT,

    -- Content/Analytics specific
    engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
    reach_estimate INTEGER,
    roi_percent DECIMAL(7,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_execution_logs for detailed execution tracking
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,
    log_level VARCHAR(20) NOT NULL, -- 'debug', 'info', 'warn', 'error'
    message TEXT NOT NULL,
    metadata JSONB,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_agent_analytics_execution_id
    ON business_agent_analytics(execution_id);

CREATE INDEX IF NOT EXISTS idx_business_agent_analytics_agent_type
    ON business_agent_analytics(agent_type);

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_execution_id
    ON agent_execution_logs(execution_id);

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_log_level
    ON agent_execution_logs(log_level);

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_logged_at
    ON agent_execution_logs(logged_at DESC);

-- Update trigger for business_agent_analytics
CREATE TRIGGER update_business_agent_analytics_updated_at
    BEFORE UPDATE ON business_agent_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE business_agent_analytics IS 'Detailed analytics and metrics for business agent executions';
COMMENT ON TABLE agent_execution_logs IS 'Detailed execution logs for debugging and monitoring';

-- Create view for easy analytics querying
CREATE OR REPLACE VIEW v_business_agent_summary AS
SELECT
    ae.id AS execution_id,
    ae.repository_id,
    ae.user_id,
    ae.agent_type,
    ae.status,
    ae.started_at,
    ae.completed_at,
    ae.quality_score,
    ae.pr_number,
    baa.competitors_analyzed,
    baa.market_size_usd,
    baa.conversion_rate,
    baa.engagement_score,
    baa.estimated_revenue_usd,
    COUNT(ael.id) as log_count,
    COUNT(CASE WHEN ael.log_level = 'error' THEN 1 END) as error_count
FROM agent_executions ae
LEFT JOIN business_agent_analytics baa ON ae.id = baa.execution_id
LEFT JOIN agent_execution_logs ael ON ae.id = ael.execution_id
GROUP BY
    ae.id, ae.repository_id, ae.user_id, ae.agent_type, ae.status,
    ae.started_at, ae.completed_at, ae.quality_score, ae.pr_number,
    baa.competitors_analyzed, baa.market_size_usd, baa.conversion_rate,
    baa.engagement_score, baa.estimated_revenue_usd;

COMMENT ON VIEW v_business_agent_summary IS 'Summary view combining execution data with analytics metrics';
