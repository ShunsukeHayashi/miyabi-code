-- Example Migration: Notification System
-- Description: Multi-channel notification system with preferences and templates
-- Use Case: Send notifications via email, webhook, LINE, Slack, etc.
-- Version: 1.0.0

-- ============================================================================
-- NOTIFICATION_TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template identification
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,

    -- Template content
    subject_template TEXT,
    body_template TEXT NOT NULL,
    html_template TEXT,

    -- Template metadata
    variables JSONB DEFAULT '[]',  -- Array of variable names
    required_variables JSONB DEFAULT '[]',
    default_values JSONB DEFAULT '{}',

    -- Channel support
    supported_channels TEXT[] DEFAULT ARRAY['email'],

    -- Template settings
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'normal',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_category CHECK (
        category IN ('system', 'user', 'plugin', 'billing', 'security', 'deployment')
    ),
    CONSTRAINT valid_priority CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    )
);

COMMENT ON TABLE notification_templates IS 'Reusable notification templates for multi-channel delivery';
COMMENT ON COLUMN notification_templates.code IS 'Unique template identifier (e.g., plugin.installed)';
COMMENT ON COLUMN notification_templates.variables IS 'List of available template variables';
COMMENT ON COLUMN notification_templates.supported_channels IS 'Channels this template supports';

-- ============================================================================
-- USER_NOTIFICATION_PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES web_users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Channel preferences
    email_enabled BOOLEAN DEFAULT true,
    email_address VARCHAR(255),
    webhook_enabled BOOLEAN DEFAULT false,
    webhook_url TEXT,
    line_enabled BOOLEAN DEFAULT false,
    slack_enabled BOOLEAN DEFAULT false,
    slack_webhook_url TEXT,

    -- Category preferences (what types of notifications to receive)
    category_preferences JSONB DEFAULT '{
        "system": true,
        "user": true,
        "plugin": true,
        "billing": true,
        "security": true,
        "deployment": true
    }',

    -- Delivery preferences
    digest_mode BOOLEAN DEFAULT false,
    digest_frequency VARCHAR(20) DEFAULT 'daily',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, organization_id),

    CONSTRAINT valid_digest_frequency CHECK (
        digest_frequency IN ('hourly', 'daily', 'weekly')
    )
);

COMMENT ON TABLE user_notification_preferences IS 'User preferences for notification delivery';
COMMENT ON COLUMN user_notification_preferences.digest_mode IS 'If true, batch notifications instead of real-time';
COMMENT ON COLUMN user_notification_preferences.quiet_hours_start IS 'Do not send notifications during this period';

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    user_id UUID NOT NULL REFERENCES web_users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Notification content
    template_code VARCHAR(100) REFERENCES notification_templates(code),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT,

    -- Notification metadata
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    action_url TEXT,
    action_label VARCHAR(100),

    -- Delivery channels
    channels TEXT[] DEFAULT ARRAY['email'],
    delivery_status JSONB DEFAULT '{}',  -- Status per channel

    -- State tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    read_at TIMESTAMP,
    archived_at TIMESTAMP,
    deleted_at TIMESTAMP,

    -- Context
    related_resource_type VARCHAR(50),
    related_resource_id TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,

    CONSTRAINT valid_category CHECK (
        category IN ('system', 'user', 'plugin', 'billing', 'security', 'deployment')
    ),
    CONSTRAINT valid_priority CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')
    )
);

COMMENT ON TABLE notifications IS 'Individual notification records';
COMMENT ON COLUMN notifications.template_code IS 'Template used to generate this notification';
COMMENT ON COLUMN notifications.delivery_status IS 'Delivery status per channel (email: sent, webhook: failed, etc.)';
COMMENT ON COLUMN notifications.scheduled_for IS 'When to send this notification (NULL = immediate)';

-- ============================================================================
-- NOTIFICATION_DELIVERIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,

    -- Delivery details
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    -- Delivery attempts
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP,
    next_retry_at TIMESTAMP,

    -- Delivery results
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    error_code VARCHAR(50),

    -- External tracking
    external_id VARCHAR(255),  -- e.g., SendGrid message ID
    provider VARCHAR(50),       -- e.g., sendgrid, ses, twilio

    -- Response tracking
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    bounced_at TIMESTAMP,
    bounce_reason TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_channel CHECK (
        channel IN ('email', 'webhook', 'line', 'slack', 'sms', 'push')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'cancelled')
    )
);

COMMENT ON TABLE notification_deliveries IS 'Individual delivery attempts per channel';
COMMENT ON COLUMN notification_deliveries.external_id IS 'External provider message ID for tracking';
COMMENT ON COLUMN notification_deliveries.opened_at IS 'When recipient opened the notification (email tracking)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Notification Templates
CREATE INDEX idx_notif_templates_code ON notification_templates(code);
CREATE INDEX idx_notif_templates_category ON notification_templates(category);
CREATE INDEX idx_notif_templates_active ON notification_templates(is_active);

-- User Preferences
CREATE INDEX idx_notif_prefs_user ON user_notification_preferences(user_id);
CREATE INDEX idx_notif_prefs_org ON user_notification_preferences(organization_id);

-- Notifications
CREATE INDEX idx_notifs_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifs_org ON notifications(organization_id, created_at DESC);
CREATE INDEX idx_notifs_status ON notifications(status);
CREATE INDEX idx_notifs_category ON notifications(category);
CREATE INDEX idx_notifs_priority ON notifications(priority);
CREATE INDEX idx_notifs_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifs_scheduled ON notifications(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_notifs_resource ON notifications(related_resource_type, related_resource_id);

-- Composite indexes
CREATE INDEX idx_notifs_user_status ON notifications(user_id, status, created_at DESC);
CREATE INDEX idx_notifs_user_unread ON notifications(user_id, created_at DESC)
    WHERE read_at IS NULL AND deleted_at IS NULL;

-- Deliveries
CREATE INDEX idx_deliveries_notif ON notification_deliveries(notification_id);
CREATE INDEX idx_deliveries_channel ON notification_deliveries(channel);
CREATE INDEX idx_deliveries_status ON notification_deliveries(status);
CREATE INDEX idx_deliveries_retry ON notification_deliveries(next_retry_at)
    WHERE status = 'pending' AND next_retry_at IS NOT NULL;
CREATE INDEX idx_deliveries_external ON notification_deliveries(external_id, provider);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Create notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
    p_user_id UUID,
    p_template_code VARCHAR,
    p_variables JSONB,
    p_organization_id UUID DEFAULT NULL,
    p_priority VARCHAR DEFAULT 'normal'
) RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_subject TEXT;
    v_body TEXT;
    v_html_body TEXT;
    v_notif_id UUID;
    v_prefs RECORD;
    v_channels TEXT[];
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM notification_templates
    WHERE code = p_template_code AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % not found or inactive', p_template_code;
    END IF;

    -- Get user preferences
    SELECT * INTO v_prefs
    FROM user_notification_preferences
    WHERE user_id = p_user_id
      AND (organization_id = p_organization_id OR organization_id IS NULL)
    LIMIT 1;

    -- Determine delivery channels based on preferences
    v_channels = ARRAY[]::TEXT[];
    IF v_prefs.email_enabled THEN
        v_channels = array_append(v_channels, 'email');
    END IF;
    IF v_prefs.webhook_enabled THEN
        v_channels = array_append(v_channels, 'webhook');
    END IF;
    IF v_prefs.line_enabled THEN
        v_channels = array_append(v_channels, 'line');
    END IF;

    -- Simple template variable replacement (can be enhanced with more complex templating)
    v_subject = v_template.subject_template;
    v_body = v_template.body_template;
    v_html_body = v_template.html_template;

    -- Create notification
    INSERT INTO notifications (
        user_id,
        organization_id,
        template_code,
        subject,
        body,
        html_body,
        category,
        priority,
        channels,
        status
    ) VALUES (
        p_user_id,
        p_organization_id,
        p_template_code,
        v_subject,
        v_body,
        v_html_body,
        v_template.category,
        p_priority,
        v_channels,
        CASE
            WHEN v_prefs.digest_mode THEN 'scheduled'
            ELSE 'pending'
        END
    )
    RETURNING id INTO v_notif_id;

    RETURN v_notif_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notification_from_template IS 'Create notification from template with variable substitution';

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
    p_notification_id UUID,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE notifications
    SET read_at = NOW()
    WHERE id = p_notification_id
      AND user_id = p_user_id
      AND read_at IS NULL;

    v_updated = FOUND;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(
    p_user_id UUID,
    p_organization_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id
      AND (p_organization_id IS NULL OR organization_id = p_organization_id)
      AND read_at IS NULL
      AND deleted_at IS NULL;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_notif_templates_updated ON notification_templates;
CREATE TRIGGER trg_notif_templates_updated
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_notif_prefs_updated ON user_notification_preferences;
CREATE TRIGGER trg_notif_prefs_updated
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS trg_notifs_updated ON notifications;
CREATE TRIGGER trg_notifs_updated
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert default notification templates
INSERT INTO notification_templates (code, name, category, subject_template, body_template, supported_channels, is_system) VALUES
('plugin.installed', 'Plugin Installed', 'plugin',
    'Plugin {{plugin_name}} installed successfully',
    'Your plugin {{plugin_name}} has been installed and is ready to use.',
    ARRAY['email', 'webhook', 'line'], true),

('subscription.expired', 'Subscription Expired', 'billing',
    'Your subscription to {{plugin_name}} has expired',
    'Your subscription to {{plugin_name}} expired on {{expiry_date}}. Renew now to continue using premium features.',
    ARRAY['email', 'line'], true),

('deployment.success', 'Deployment Successful', 'deployment',
    'Deployment to {{environment}} completed',
    'Your deployment to {{environment}} completed successfully at {{timestamp}}.',
    ARRAY['email', 'webhook', 'slack'], true),

('security.alert', 'Security Alert', 'security',
    'Security Alert: {{alert_type}}',
    'A security event was detected: {{alert_details}}. Please review immediately.',
    ARRAY['email', 'line', 'slack'], true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    template_count INTEGER;
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM notification_templates WHERE is_system = true;
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE tablename LIKE 'notif%';

    RAISE NOTICE 'Notification system migration complete';
    RAISE NOTICE '  - System templates: %', template_count;
    RAISE NOTICE '  - Indexes created: %', index_count;
END $$;
