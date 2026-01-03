-- Course Authentication System Tables
-- Issue #1300: Database schema for comprehensive authentication integration

-- User credentials table (separate from main user table for security)
CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    salt TEXT,
    reset_token TEXT,
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- User login history for security tracking
CREATE TABLE IF NOT EXISTS user_login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    action VARCHAR(20) DEFAULT 'LOGIN' CHECK (action IN ('LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_RESET')),
    success BOOLEAN DEFAULT TRUE,
    failure_reason TEXT,
    session_duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment security logs for anti-cheating measures
CREATE TABLE IF NOT EXISTS assessment_security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL, -- References assessments(id) when that table exists
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address INET,
    focus_loss_count INTEGER DEFAULT 0,
    copy_paste_attempts INTEGER DEFAULT 0,
    tab_switches INTEGER DEFAULT 0,
    screenshot_attempts INTEGER DEFAULT 0,
    suspicious_activity JSONB DEFAULT '{}',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, assessment_id, start_time)
);

-- Security audit logs for comprehensive tracking
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    severity VARCHAR(10) DEFAULT 'INFO' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security alerts for high-priority events
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE')),
    severity VARCHAR(10) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course access schedules for time-based access control
CREATE TABLE IF NOT EXISTS course_access_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    allowed_hours INTEGER[] DEFAULT '{}', -- Array of hours 0-23
    allowed_days INTEGER[] DEFAULT '{}', -- Array of days 0-6 (0=Sunday)
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content integrity tracking
CREATE TABLE IF NOT EXISTS content_integrity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('LESSON', 'ASSESSMENT', 'RESOURCE')),
    content_id UUID NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    signature VARCHAR(128), -- HMAC signature
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verification_result BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- JWT token blacklist for logout/invalidation
CREATE TABLE IF NOT EXISTS jwt_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id VARCHAR(100) NOT NULL, -- JWT ID claim
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(50) DEFAULT 'LOGOUT' CHECK (reason IN ('LOGOUT', 'SECURITY', 'ADMIN_ACTION', 'PASSWORD_CHANGE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(token_id)
);

-- Course instructor assignments (extends existing relationships)
CREATE TABLE IF NOT EXISTS course_instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, instructor_id)
);

-- Rate limiting tracking (for production Redis replacement)
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(100) NOT NULL, -- IP or user ID
    action VARCHAR(50) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    violations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, action, window_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON user_login_history(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_security_user_id ON assessment_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_security_assessment_id ON assessment_security_logs(assessment_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_course_access_schedules_course_id ON course_access_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_content_integrity_content ON content_integrity_logs(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_jwt_blacklist_token_id ON jwt_blacklist(token_id);
CREATE INDEX IF NOT EXISTS idx_jwt_blacklist_expires_at ON jwt_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_course_instructors_course_id ON course_instructors(course_id);
CREATE INDEX IF NOT EXISTS idx_course_instructors_instructor_id ON course_instructors(instructor_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action ON rate_limit_tracking(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_end ON rate_limit_tracking(window_end);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credentials_updated_at
    BEFORE UPDATE ON user_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_alerts_updated_at
    BEFORE UPDATE ON security_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_access_schedules_updated_at
    BEFORE UPDATE ON course_access_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_instructors_updated_at
    BEFORE UPDATE ON course_instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_tracking_updated_at
    BEFORE UPDATE ON rate_limit_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE OR REPLACE VIEW user_security_summary AS
SELECT
    u.id,
    u.email,
    u.username,
    u.role,
    uc.last_password_change,
    COUNT(DISTINCT lh.id) as login_count,
    MAX(lh.login_at) as last_login,
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.severity IN ('HIGH', 'CRITICAL')) as security_incidents
FROM users u
LEFT JOIN user_credentials uc ON u.id = uc.user_id
LEFT JOIN user_login_history lh ON u.id = lh.user_id AND lh.success = true
LEFT JOIN security_audit_logs sa ON u.id = sa.user_id
GROUP BY u.id, u.email, u.username, u.role, uc.last_password_change;

CREATE OR REPLACE VIEW course_security_overview AS
SELECT
    c.id,
    c.title,
    c.status,
    COUNT(DISTINCT e.user_id) as enrolled_students,
    COUNT(DISTINCT ci.instructor_id) as assigned_instructors,
    COUNT(DISTINCT cas.id) as access_schedule_count,
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.event_type = 'UNAUTHORIZED_ACCESS_ATTEMPT') as unauthorized_attempts
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'ACTIVE'
LEFT JOIN course_instructors ci ON c.id = ci.course_id AND ci.is_active = true
LEFT JOIN course_access_schedules cas ON c.id = cas.course_id AND cas.is_active = true
LEFT JOIN security_audit_logs sa ON sa.details->>'courseId' = c.id::text
GROUP BY c.id, c.title, c.status;

-- Cleanup procedures for maintenance
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM jwt_blacklist WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM security_audit_logs WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default data
INSERT INTO course_access_schedules (course_id, name, allowed_hours, allowed_days, timezone)
SELECT
    id,
    'Default Schedule',
    ARRAY[6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22], -- 6 AM to 10 PM
    ARRAY[0,1,2,3,4,5,6], -- All days
    'UTC'
FROM courses
WHERE NOT EXISTS (
    SELECT 1 FROM course_access_schedules WHERE course_id = courses.id
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO miyabi_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO miyabi_app_user;
GRANT EXECUTE ON FUNCTION cleanup_expired_tokens() TO miyabi_app_user;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs(INTEGER) TO miyabi_app_user;

-- Comments for documentation
COMMENT ON TABLE user_credentials IS 'Stores password hashes separately from main user table for security';
COMMENT ON TABLE user_login_history IS 'Tracks all login/logout events for security auditing';
COMMENT ON TABLE assessment_security_logs IS 'Logs potential cheating indicators during assessments';
COMMENT ON TABLE security_audit_logs IS 'Comprehensive security event logging';
COMMENT ON TABLE security_alerts IS 'High-priority security events requiring attention';
COMMENT ON TABLE course_access_schedules IS 'Time-based access control for courses';
COMMENT ON TABLE content_integrity_logs IS 'Tracks content tampering and integrity verification';
COMMENT ON TABLE jwt_blacklist IS 'Invalidated JWT tokens for logout/security purposes';
COMMENT ON TABLE course_instructors IS 'Course-specific instructor assignments with permissions';
COMMENT ON TABLE rate_limit_tracking IS 'Rate limiting data (use Redis in production)';

COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Removes expired JWT blacklist entries';
COMMENT ON FUNCTION cleanup_old_audit_logs(INTEGER) IS 'Removes audit logs older than specified days';

COMMENT ON VIEW user_security_summary IS 'Security overview for each user';
COMMENT ON VIEW course_security_overview IS 'Security metrics for each course';