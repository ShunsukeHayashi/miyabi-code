-- Example Migration: Audit Logs / Activity Tracking
-- Description: Comprehensive audit trail for user actions and system events
-- Use Case: Track all user activities for security, compliance, and analytics
-- Version: 1.0.0

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who performed the action
    user_id UUID REFERENCES web_users(id) ON DELETE SET NULL,
    actor_type VARCHAR(20) NOT NULL DEFAULT 'user',
    actor_ip_address INET,
    actor_user_agent TEXT,

    -- What action was performed
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Action details
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info',
    status VARCHAR(20) NOT NULL DEFAULT 'success',

    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changes JSONB,

    -- Additional context
    metadata JSONB DEFAULT '{}',
    error_message TEXT,
    stack_trace TEXT,

    -- Request context
    request_id VARCHAR(255),
    session_id VARCHAR(255),
    api_endpoint TEXT,
    http_method VARCHAR(10),

    -- Timing
    created_at TIMESTAMP DEFAULT NOW(),
    duration_ms INTEGER,

    -- Constraints
    CONSTRAINT valid_actor_type CHECK (
        actor_type IN ('user', 'system', 'agent', 'webhook', 'cron', 'admin')
    ),
    CONSTRAINT valid_event_type CHECK (
        event_type IN (
            'create', 'read', 'update', 'delete',
            'login', 'logout', 'authenticate',
            'deploy', 'rollback', 'execute',
            'subscribe', 'unsubscribe', 'purchase',
            'grant', 'revoke', 'approve', 'reject'
        )
    ),
    CONSTRAINT valid_severity CHECK (
        severity IN ('debug', 'info', 'warning', 'error', 'critical')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('success', 'failure', 'partial')
    )
);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system activities';
COMMENT ON COLUMN audit_logs.actor_type IS 'Type of actor: user, system, agent, webhook, cron, admin';
COMMENT ON COLUMN audit_logs.action IS 'Specific action performed (e.g., user.login, plugin.install)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, plugin, subscription)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.event_type IS 'General event category (create, update, delete, etc.)';
COMMENT ON COLUMN audit_logs.severity IS 'Log severity level';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous state of the resource (for updates)';
COMMENT ON COLUMN audit_logs.new_values IS 'New state of the resource (for creates/updates)';
COMMENT ON COLUMN audit_logs.changes IS 'Calculated diff between old and new values';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, created_at DESC);

-- Time-based queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_created_at_date ON audit_logs((created_at::DATE));

-- Event filtering
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- Composite indexes for common queries
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX idx_audit_logs_org_event ON audit_logs(organization_id, event_type, created_at DESC);
CREATE INDEX idx_audit_logs_severity_status ON audit_logs(severity, status, created_at DESC);

-- Request tracking
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id);
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id);

-- JSONB indexes for metadata queries
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN(metadata);
CREATE INDEX idx_audit_logs_changes ON audit_logs USING GIN(changes);

-- Partial indexes for errors only (faster error queries)
CREATE INDEX idx_audit_logs_errors ON audit_logs(severity, created_at DESC)
    WHERE severity IN ('error', 'critical');

CREATE INDEX idx_audit_logs_failures ON audit_logs(status, created_at DESC)
    WHERE status = 'failure';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Log user action
CREATE OR REPLACE FUNCTION log_user_action(
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id TEXT,
    p_organization_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        actor_type,
        action,
        resource_type,
        resource_id,
        organization_id,
        event_type,
        severity,
        metadata
    ) VALUES (
        p_user_id,
        'user',
        p_action,
        p_resource_type,
        p_resource_id,
        p_organization_id,
        'update',  -- Default, can be customized
        'info',
        p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_user_action IS 'Quick function to log a user action';

-- Function: Get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    event_type VARCHAR,
    action VARCHAR,
    count BIGINT,
    last_occurrence TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.event_type,
        al.action,
        COUNT(*) AS count,
        MAX(al.created_at) AS last_occurrence
    FROM audit_logs al
    WHERE al.user_id = p_user_id
      AND al.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY al.event_type, al.action
    ORDER BY count DESC, last_occurrence DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_activity_summary IS 'Get summary of user activities over time period';

-- Function: Get security events
CREATE OR REPLACE FUNCTION get_security_events(
    p_organization_id UUID,
    p_hours INTEGER DEFAULT 24
) RETURNS TABLE (
    id UUID,
    user_id UUID,
    action VARCHAR,
    severity VARCHAR,
    created_at TIMESTAMP,
    actor_ip_address INET,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.user_id,
        al.action,
        al.severity,
        al.created_at,
        al.actor_ip_address,
        al.metadata
    FROM audit_logs al
    WHERE al.organization_id = p_organization_id
      AND al.created_at >= NOW() - (p_hours || ' hours')::INTERVAL
      AND (
          al.action LIKE '%login%'
          OR al.action LIKE '%authenticate%'
          OR al.action LIKE '%permission%'
          OR al.action LIKE '%role%'
          OR al.severity IN ('error', 'critical')
      )
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_security_events IS 'Get security-related events for monitoring';

-- Function: Cleanup old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
    p_retention_days INTEGER DEFAULT 365
) RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < NOW() - (p_retention_days || ' days')::INTERVAL
      AND severity NOT IN ('error', 'critical');  -- Keep errors longer

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    INSERT INTO audit_logs (
        actor_type,
        action,
        resource_type,
        event_type,
        severity,
        metadata
    ) VALUES (
        'system',
        'audit_logs.cleanup',
        'audit_logs',
        'delete',
        'info',
        jsonb_build_object(
            'deleted_count', v_deleted_count,
            'retention_days', p_retention_days
        )
    );

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Delete audit logs older than retention period (keeps errors)';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Recent errors
CREATE OR REPLACE VIEW recent_audit_errors AS
SELECT
    al.id,
    al.user_id,
    wu.github_username,
    al.action,
    al.resource_type,
    al.resource_id,
    al.severity,
    al.error_message,
    al.created_at
FROM audit_logs al
LEFT JOIN web_users wu ON wu.id = al.user_id
WHERE al.created_at >= NOW() - INTERVAL '7 days'
  AND (al.severity IN ('error', 'critical') OR al.status = 'failure')
ORDER BY al.created_at DESC;

COMMENT ON VIEW recent_audit_errors IS 'Recent error and failure events (last 7 days)';

-- View: Daily activity stats
CREATE OR REPLACE VIEW daily_activity_stats AS
SELECT
    DATE(created_at) AS activity_date,
    actor_type,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users,
    COUNT(DISTINCT organization_id) AS unique_orgs
FROM audit_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), actor_type, event_type
ORDER BY activity_date DESC, event_count DESC;

COMMENT ON VIEW daily_activity_stats IS 'Daily activity statistics (last 30 days)';

-- ============================================================================
-- TRIGGER: Auto-calculate changes
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_log_calculate_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- If both old_values and new_values are present, calculate diff
    IF NEW.old_values IS NOT NULL AND NEW.new_values IS NOT NULL THEN
        NEW.changes = jsonb_strip_nulls(
            NEW.new_values - NEW.old_values
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_log_changes ON audit_logs;
CREATE TRIGGER trg_audit_log_changes
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION audit_log_calculate_changes();

COMMENT ON TRIGGER trg_audit_log_changes ON audit_logs IS 'Auto-calculate changes between old and new values';

-- ============================================================================
-- PARTITIONING (Optional - for high-volume logs)
-- ============================================================================

-- For very high-volume audit logs, consider table partitioning by month:
--
-- CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
--     FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
--
-- CREATE TABLE audit_logs_2025_12 PARTITION OF audit_logs
--     FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Example: Log a plugin installation
/*
INSERT INTO audit_logs (
    user_id,
    actor_type,
    action,
    resource_type,
    resource_id,
    event_type,
    severity,
    new_values,
    metadata
) VALUES (
    (SELECT id FROM web_users LIMIT 1),
    'user',
    'plugin.install',
    'subscription',
    'sub_123',
    'create',
    'info',
    jsonb_build_object(
        'plugin_id', 'miyabi-lark',
        'tier', 'pro',
        'status', 'active'
    ),
    jsonb_build_object(
        'source', 'marketplace',
        'payment_method', 'stripe'
    )
);
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'audit_logs';

    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname LIKE '%audit%';

    RAISE NOTICE 'Audit logs migration complete';
    RAISE NOTICE '  - Indexes created: %', index_count;
    RAISE NOTICE '  - Functions created: %', function_count;
    RAISE NOTICE '  - Views: recent_audit_errors, daily_activity_stats';
END $$;

-- ============================================================================
-- MAINTENANCE NOTES
-- ============================================================================

-- To schedule automatic cleanup (run monthly):
-- SELECT cleanup_old_audit_logs(365);  -- Keep 1 year of logs

-- To analyze table performance periodically:
-- ANALYZE audit_logs;

-- To check table size:
-- SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));
