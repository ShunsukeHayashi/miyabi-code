-- Miyabi Web API - Initial Schema Migration
-- Version: 001
-- Created: 2025-10-24
-- Description: Create 7 core tables for Miyabi Web UI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table 1: users
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id BIGINT NOT NULL UNIQUE,
    github_login VARCHAR(255) NOT NULL UNIQUE,
    github_name VARCHAR(255),
    github_email VARCHAR(255),
    github_avatar_url TEXT,
    github_access_token TEXT NOT NULL, -- Encrypted in production
    github_token_expires_at TIMESTAMPTZ,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_github_login ON users(github_login);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'GitHub OAuth authenticated users';
COMMENT ON COLUMN users.github_access_token IS 'GitHub Personal Access Token (should be encrypted)';

-- =====================================================
-- Table 2: repositories
-- =====================================================
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id BIGINT NOT NULL,
    github_owner VARCHAR(255) NOT NULL,
    github_repo_name VARCHAR(255) NOT NULL,
    github_full_name VARCHAR(511) NOT NULL, -- owner/repo
    github_default_branch VARCHAR(255) NOT NULL DEFAULT 'main',
    github_description TEXT,
    github_is_private BOOLEAN NOT NULL DEFAULT FALSE,
    github_html_url TEXT NOT NULL,
    github_clone_url TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    miyabi_config JSONB, -- .miyabi.yml parsed content
    webhook_id BIGINT, -- GitHub webhook ID
    webhook_secret VARCHAR(255), -- Webhook verification secret
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, github_repo_id)
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_full_name ON repositories(github_full_name);
CREATE INDEX idx_repositories_is_enabled ON repositories(is_enabled);
CREATE INDEX idx_repositories_last_synced_at ON repositories(last_synced_at);

COMMENT ON TABLE repositories IS 'GitHub repositories connected to Miyabi';
COMMENT ON COLUMN repositories.miyabi_config IS 'Parsed .miyabi.yml configuration (JSONB)';

-- =====================================================
-- Table 3: agent_executions
-- =====================================================
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_type VARCHAR(100) NOT NULL, -- CoordinatorAgent, CodeGenAgent, etc.
    issue_number INTEGER,
    issue_title TEXT,
    task_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER NOT NULL DEFAULT 0, -- 0-100
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    input_params JSONB NOT NULL, -- Agent input parameters
    output_result JSONB, -- Agent output result
    worktree_path VARCHAR(512), -- Git worktree path
    commit_sha VARCHAR(40), -- Git commit SHA
    pr_number INTEGER, -- Created PR number
    logs TEXT[], -- Array of log messages
    metadata JSONB, -- Additional metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_executions_repository_id ON agent_executions(repository_id);
CREATE INDEX idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX idx_agent_executions_agent_type ON agent_executions(agent_type);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_created_at ON agent_executions(created_at DESC);
CREATE INDEX idx_agent_executions_issue_number ON agent_executions(issue_number) WHERE issue_number IS NOT NULL;

COMMENT ON TABLE agent_executions IS 'Miyabi Agent execution history';
COMMENT ON COLUMN agent_executions.logs IS 'Array of execution logs (text[])';

-- =====================================================
-- Table 4: workflows
-- =====================================================
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_definition JSONB NOT NULL, -- React Flow nodes/edges
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    trigger_type VARCHAR(50) NOT NULL, -- manual, webhook, schedule
    trigger_config JSONB, -- Trigger-specific configuration
    last_executed_at TIMESTAMPTZ,
    execution_count INTEGER NOT NULL DEFAULT 0,
    success_count INTEGER NOT NULL DEFAULT 0,
    failure_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(repository_id, name)
);

CREATE INDEX idx_workflows_repository_id ON workflows(repository_id);
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_is_enabled ON workflows(is_enabled);
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX idx_workflows_last_executed_at ON workflows(last_executed_at DESC);

COMMENT ON TABLE workflows IS 'User-defined workflows (visual editor)';
COMMENT ON COLUMN workflows.workflow_definition IS 'React Flow graph definition (JSONB)';

-- =====================================================
-- Table 5: line_messages
-- =====================================================
CREATE TABLE line_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE SET NULL,
    line_user_id VARCHAR(255) NOT NULL, -- LINE user ID
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    message_type VARCHAR(50) NOT NULL, -- text, image, video, etc.
    message_text TEXT,
    message_payload JSONB, -- LINE message JSON
    reply_token VARCHAR(255), -- LINE reply token
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    agent_execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_line_messages_user_id ON line_messages(user_id);
CREATE INDEX idx_line_messages_line_user_id ON line_messages(line_user_id);
CREATE INDEX idx_line_messages_direction ON line_messages(direction);
CREATE INDEX idx_line_messages_is_processed ON line_messages(is_processed);
CREATE INDEX idx_line_messages_created_at ON line_messages(created_at DESC);

COMMENT ON TABLE line_messages IS 'LINE Bot messages (Phase 6)';
COMMENT ON COLUMN line_messages.message_payload IS 'Full LINE message JSON payload';

-- =====================================================
-- Table 6: websocket_connections
-- =====================================================
CREATE TABLE websocket_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) NOT NULL UNIQUE, -- WebSocket connection ID
    client_ip INET,
    user_agent TEXT,
    subscribed_channels TEXT[], -- Array of channel names
    last_ping_at TIMESTAMPTZ,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ
);

CREATE INDEX idx_websocket_connections_user_id ON websocket_connections(user_id);
CREATE INDEX idx_websocket_connections_connection_id ON websocket_connections(connection_id);
CREATE INDEX idx_websocket_connections_connected_at ON websocket_connections(connected_at DESC);
CREATE INDEX idx_websocket_connections_active ON websocket_connections(user_id, connected_at) WHERE disconnected_at IS NULL;

COMMENT ON TABLE websocket_connections IS 'Active WebSocket connections for real-time updates';
COMMENT ON COLUMN websocket_connections.subscribed_channels IS 'Array of subscribed channel names';

-- =====================================================
-- Table 7: audit_logs (Bonus - for security)
-- =====================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- login, logout, agent_execute, workflow_create, etc.
    resource_type VARCHAR(100), -- repository, agent_execution, workflow, etc.
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS 'Audit trail for all user actions';

-- =====================================================
-- Updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_executions_updated_at BEFORE UPDATE ON agent_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Initial data (optional)
-- =====================================================
-- None for MVP

-- =====================================================
-- Grant permissions (production)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO miyabi_web_api;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO miyabi_web_api;
