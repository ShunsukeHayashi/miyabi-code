-- Stripe Billing Integration Schema
-- Migration: 20251129000000_stripe_billing

-- ============================================================================
-- Subscription Plans
-- ============================================================================

CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'unpaid');

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Stripe IDs
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),

    -- Plan details
    plan subscription_plan NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',

    -- Billing period
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,

    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_org_subscription UNIQUE (organization_id)
);

-- ============================================================================
-- Plan Limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS plan_limits (
    plan subscription_plan PRIMARY KEY,

    -- Execution limits
    monthly_agent_executions INT NOT NULL,
    monthly_api_calls INT NOT NULL,

    -- Organization limits
    max_organizations INT NOT NULL,
    max_members_per_org INT NOT NULL,

    -- Feature flags
    priority_support BOOLEAN DEFAULT FALSE,
    custom_agents BOOLEAN DEFAULT FALSE,
    advanced_analytics BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plan limits
INSERT INTO plan_limits (plan, monthly_agent_executions, monthly_api_calls, max_organizations, max_members_per_org, priority_support, custom_agents, advanced_analytics)
VALUES
    ('free', 3, 100, 1, 3, FALSE, FALSE, FALSE),
    ('pro', 100, 10000, 5, 20, FALSE, TRUE, FALSE),
    ('enterprise', -1, -1, -1, -1, TRUE, TRUE, TRUE)  -- -1 means unlimited
ON CONFLICT (plan) DO UPDATE SET
    monthly_agent_executions = EXCLUDED.monthly_agent_executions,
    monthly_api_calls = EXCLUDED.monthly_api_calls,
    max_organizations = EXCLUDED.max_organizations,
    max_members_per_org = EXCLUDED.max_members_per_org,
    priority_support = EXCLUDED.priority_support,
    custom_agents = EXCLUDED.custom_agents,
    advanced_analytics = EXCLUDED.advanced_analytics,
    updated_at = NOW();

-- ============================================================================
-- Usage Records (per billing period)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Billing period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Usage counts
    agent_executions INT NOT NULL DEFAULT 0,
    api_calls INT NOT NULL DEFAULT 0,

    -- Storage usage (bytes)
    storage_used_bytes BIGINT NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint per org per period
    CONSTRAINT unique_usage_period UNIQUE (organization_id, period_start)
);

-- ============================================================================
-- Usage Events (granular tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Event details
    event_type VARCHAR(50) NOT NULL,  -- 'agent_execution', 'api_call', etc.
    agent_type VARCHAR(100),

    -- Resource info
    resource_id VARCHAR(255),
    resource_type VARCHAR(50),

    -- Cost tracking
    credits_used INT DEFAULT 1,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Stripe Webhook Events (for idempotency)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    payload JSONB NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================================================
-- Invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Stripe IDs
    stripe_invoice_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),

    -- Invoice details
    amount_due INT NOT NULL,  -- in cents
    amount_paid INT DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL,  -- 'draft', 'open', 'paid', 'void', 'uncollectible'

    -- URLs
    hosted_invoice_url TEXT,
    invoice_pdf_url TEXT,

    -- Period
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,

    -- Timestamps
    due_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE INDEX idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX idx_usage_records_period ON usage_records(period_start, period_end);

CREATE INDEX idx_usage_events_org ON usage_events(organization_id);
CREATE INDEX idx_usage_events_created ON usage_events(created_at);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);

CREATE INDEX idx_stripe_events_stripe_id ON stripe_events(stripe_event_id);
CREATE INDEX idx_stripe_events_processed ON stripe_events(processed);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get current usage for an organization
CREATE OR REPLACE FUNCTION get_current_usage(org_id UUID)
RETURNS TABLE (
    agent_executions INT,
    api_calls INT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ur.agent_executions,
        ur.api_calls,
        ur.period_start,
        ur.period_end
    FROM usage_records ur
    WHERE ur.organization_id = org_id
      AND ur.period_start <= NOW()
      AND ur.period_end >= NOW()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Check if organization has exceeded limits
CREATE OR REPLACE FUNCTION check_usage_limit(org_id UUID, usage_type VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    current_plan subscription_plan;
    plan_limit INT;
    current_usage INT;
BEGIN
    -- Get current plan
    SELECT s.plan INTO current_plan
    FROM subscriptions s
    WHERE s.organization_id = org_id
      AND s.status = 'active'
    LIMIT 1;

    -- Default to free if no subscription
    IF current_plan IS NULL THEN
        current_plan := 'free';
    END IF;

    -- Get limit for the plan
    IF usage_type = 'agent_executions' THEN
        SELECT pl.monthly_agent_executions INTO plan_limit
        FROM plan_limits pl WHERE pl.plan = current_plan;
    ELSIF usage_type = 'api_calls' THEN
        SELECT pl.monthly_api_calls INTO plan_limit
        FROM plan_limits pl WHERE pl.plan = current_plan;
    ELSE
        RETURN TRUE;  -- Unknown type, allow
    END IF;

    -- Unlimited (-1)
    IF plan_limit = -1 THEN
        RETURN TRUE;
    END IF;

    -- Get current usage
    SELECT
        CASE usage_type
            WHEN 'agent_executions' THEN ur.agent_executions
            WHEN 'api_calls' THEN ur.api_calls
            ELSE 0
        END INTO current_usage
    FROM usage_records ur
    WHERE ur.organization_id = org_id
      AND ur.period_start <= NOW()
      AND ur.period_end >= NOW();

    -- Check limit
    RETURN COALESCE(current_usage, 0) < plan_limit;
END;
$$ LANGUAGE plpgsql;

-- Increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
    org_id UUID,
    usage_type VARCHAR,
    increment_by INT DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    period_start_date TIMESTAMPTZ;
    period_end_date TIMESTAMPTZ;
BEGIN
    -- Get current period (monthly)
    period_start_date := date_trunc('month', NOW());
    period_end_date := period_start_date + INTERVAL '1 month';

    -- Upsert usage record
    INSERT INTO usage_records (organization_id, period_start, period_end, agent_executions, api_calls)
    VALUES (org_id, period_start_date, period_end_date, 0, 0)
    ON CONFLICT (organization_id, period_start) DO NOTHING;

    -- Update the counter
    IF usage_type = 'agent_executions' THEN
        UPDATE usage_records
        SET agent_executions = agent_executions + increment_by,
            updated_at = NOW()
        WHERE organization_id = org_id
          AND period_start = period_start_date;
    ELSIF usage_type = 'api_calls' THEN
        UPDATE usage_records
        SET api_calls = api_calls + increment_by,
            updated_at = NOW()
        WHERE organization_id = org_id
          AND period_start = period_start_date;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_usage_records_updated_at
    BEFORE UPDATE ON usage_records
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();
