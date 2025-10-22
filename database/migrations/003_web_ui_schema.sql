-- Miyabi Web UI Platform - Database Schema
-- Version: 1.0
-- Created: 2025-10-22
-- Description: PostgreSQL schema for Miyabi No-Code Web UI (7 tables)

-- ============================================================
-- 1. Web Users Table (extends users table)
-- ============================================================
CREATE TABLE IF NOT EXISTS web_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id INTEGER UNIQUE NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    line_user_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE web_users IS 'User accounts connected via GitHub OAuth for Web UI';
COMMENT ON COLUMN web_users.github_id IS 'GitHub user ID';
COMMENT ON COLUMN web_users.line_user_id IS 'LINE user ID for LINE Bot integration';

-- ============================================================
-- 2. Repositories Table
-- ============================================================
CREATE TABLE IF NOT EXISTS repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    github_repo_id INTEGER UNIQUE NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    default_branch VARCHAR(255) DEFAULT 'main',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE repositories IS 'GitHub repositories connected to Miyabi Web UI';
COMMENT ON COLUMN repositories.github_repo_id IS 'GitHub repository ID';
COMMENT ON COLUMN repositories.is_active IS 'Whether the repository is actively monitored';

-- ============================================================
-- 3. Agent Executions Table
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL,
    issue_number INTEGER,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_agent_type CHECK (
        agent_type IN ('Coordinator', 'CodeGen', 'Review', 'Deployment', 'PR', 'Issue')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'running', 'completed', 'failed')
    )
);

COMMENT ON TABLE agent_executions IS 'Agent execution history and status';
COMMENT ON COLUMN agent_executions.agent_type IS 'Type of agent executed (Coordinator, CodeGen, Review, Deployment, PR, Issue)';
COMMENT ON COLUMN agent_executions.status IS 'Execution status (pending, running, completed, failed)';
COMMENT ON COLUMN agent_executions.result IS 'JSON result of agent execution';

-- ============================================================
-- 4. Workflows Table
-- ============================================================
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE workflows IS 'React Flow workflow definitions created by users';
COMMENT ON COLUMN workflows.definition IS 'React Flow workflow definition (nodes and edges in JSON)';
COMMENT ON COLUMN workflows.is_template IS 'Whether this workflow can be used as a template';
COMMENT ON COLUMN workflows.is_public IS 'Whether this workflow is publicly visible';

-- ============================================================
-- 5. LINE Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS line_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    message_text TEXT,
    parsed_intent VARCHAR(50),
    issue_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_message_type CHECK (
        message_type IN ('text', 'postback', 'image', 'video', 'audio', 'file', 'location', 'sticker')
    )
);

COMMENT ON TABLE line_messages IS 'LINE Bot message log';
COMMENT ON COLUMN line_messages.message_type IS 'Message type (text, postback, image, video, audio, file, location, sticker)';
COMMENT ON COLUMN line_messages.parsed_intent IS 'Intent parsed by GPT-4';
COMMENT ON COLUMN line_messages.issue_number IS 'GitHub issue number created from this message';

-- ============================================================
-- 6. WebSocket Connections Table
-- ============================================================
CREATE TABLE IF NOT EXISTS websocket_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    connected_at TIMESTAMP DEFAULT NOW(),
    last_ping_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE websocket_connections IS 'Active WebSocket connections for real-time updates';
COMMENT ON COLUMN websocket_connections.connection_id IS 'Unique connection identifier';
COMMENT ON COLUMN websocket_connections.last_ping_at IS 'Last ping timestamp for connection health check';

-- ============================================================
-- Indexes for Performance
-- ============================================================

-- Web Users indexes
CREATE INDEX IF NOT EXISTS idx_web_users_github_id ON web_users(github_id);
CREATE INDEX IF NOT EXISTS idx_web_users_github_username ON web_users(github_username);
CREATE INDEX IF NOT EXISTS idx_web_users_line_user_id ON web_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_web_users_email ON web_users(email);

-- Repositories indexes
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_repositories_is_active ON repositories(is_active);

-- Agent Executions indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_id ON agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_repository_id ON agent_executions(repository_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_type ON agent_executions(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created_at ON agent_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_repo_status ON agent_executions(user_id, repository_id, status);

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_repository_id ON workflows(repository_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_template ON workflows(is_template);
CREATE INDEX IF NOT EXISTS idx_workflows_is_public ON workflows(is_public);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);

-- LINE Messages indexes
CREATE INDEX IF NOT EXISTS idx_line_messages_user_id ON line_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_line_messages_line_user_id ON line_messages(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_messages_created_at ON line_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_line_messages_issue_number ON line_messages(issue_number);

-- WebSocket Connections indexes
CREATE INDEX IF NOT EXISTS idx_websocket_connections_user_id ON websocket_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_connection_id ON websocket_connections(connection_id);
CREATE INDEX IF NOT EXISTS idx_websocket_connections_last_ping ON websocket_connections(last_ping_at);

-- ============================================================
-- Functions
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_web_ui_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_web_ui_updated_at_column IS 'Auto-update updated_at timestamp on row update';

-- ============================================================
-- Triggers
-- ============================================================

-- Apply updated_at trigger to tables
DROP TRIGGER IF EXISTS update_web_users_updated_at ON web_users;
CREATE TRIGGER update_web_users_updated_at
    BEFORE UPDATE ON web_users
    FOR EACH ROW
    EXECUTE FUNCTION update_web_ui_updated_at_column();

DROP TRIGGER IF EXISTS update_repositories_updated_at ON repositories;
CREATE TRIGGER update_repositories_updated_at
    BEFORE UPDATE ON repositories
    FOR EACH ROW
    EXECUTE FUNCTION update_web_ui_updated_at_column();

DROP TRIGGER IF EXISTS update_agent_executions_updated_at ON agent_executions;
CREATE TRIGGER update_agent_executions_updated_at
    BEFORE UPDATE ON agent_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_web_ui_updated_at_column();

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_web_ui_updated_at_column();

COMMENT ON TRIGGER update_web_users_updated_at ON web_users IS 'Auto-update updated_at timestamp';
COMMENT ON TRIGGER update_repositories_updated_at ON repositories IS 'Auto-update updated_at timestamp';
COMMENT ON TRIGGER update_agent_executions_updated_at ON agent_executions IS 'Auto-update updated_at timestamp';
COMMENT ON TRIGGER update_workflows_updated_at ON workflows IS 'Auto-update updated_at timestamp';

-- ============================================================
-- Sample Data for Development (Optional)
-- ============================================================

-- Uncomment to insert sample data
/*
INSERT INTO web_users (github_id, github_username, email, avatar_url) VALUES
(11504206, 'ShunsukeHayashi', 'shunsuke@example.com', 'https://avatars.githubusercontent.com/u/11504206');
*/

-- ============================================================
-- Migration Complete
-- ============================================================

-- Note: This schema is designed for the Miyabi No-Code Web UI MVP
-- Tables: web_users, repositories, agent_executions, workflows, line_messages, websocket_connections
