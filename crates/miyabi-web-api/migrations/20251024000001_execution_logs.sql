-- Miyabi Web API - Execution Logs Table
-- Created: 2025-10-24
-- Description: Real-time log streaming for agent executions

-- Execution Logs Table
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
    log_level VARCHAR(10) NOT NULL, -- 'DEBUG', 'INFO', 'WARN', 'ERROR'
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB -- Additional log metadata (e.g., agent name, file path)
);

-- Add execution options to agent_executions table
ALTER TABLE agent_executions
    ADD COLUMN options JSONB DEFAULT '{}'::jsonb;

-- Indexes for performance
CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_timestamp ON execution_logs(timestamp);
CREATE INDEX idx_execution_logs_log_level ON execution_logs(log_level);

-- Composite index for efficient log retrieval
CREATE INDEX idx_execution_logs_execution_timestamp ON execution_logs(execution_id, timestamp DESC);
