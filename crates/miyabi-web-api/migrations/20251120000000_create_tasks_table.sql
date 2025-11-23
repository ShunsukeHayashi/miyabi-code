-- Create Tasks Table and Dependencies
-- Created: 2025-11-20
-- Description: Task management with DAG dependencies

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    priority VARCHAR(10) DEFAULT 'P2', -- 'P0', 'P1', 'P2'
    agent_type VARCHAR(50), -- Optional: which agent should execute this
    issue_number INTEGER, -- Optional: linked GitHub issue
    execution_id UUID, -- Optional: linked to agent_executions
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 3600,
    metadata JSONB DEFAULT '{}',
    result JSONB, -- Task execution result
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Task Dependencies Table (DAG edges)
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(20) DEFAULT 'finish_to_start', -- 'finish_to_start', 'start_to_start', 'finish_to_finish'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_repository_id ON tasks(repository_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_agent_type ON tasks(agent_type);
CREATE INDEX idx_tasks_issue_number ON tasks(issue_number);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to detect circular dependencies
CREATE OR REPLACE FUNCTION check_task_cycle()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple cycle detection: check if depends_on_task already depends on task
    IF EXISTS (
        WITH RECURSIVE dep_chain AS (
            SELECT depends_on_task_id as task_id
            FROM task_dependencies
            WHERE task_id = NEW.depends_on_task_id

            UNION

            SELECT td.depends_on_task_id
            FROM task_dependencies td
            INNER JOIN dep_chain dc ON td.task_id = dc.task_id
        )
        SELECT 1 FROM dep_chain WHERE task_id = NEW.task_id
    ) THEN
        RAISE EXCEPTION 'Circular dependency detected';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent circular dependencies
CREATE TRIGGER prevent_task_cycles
    BEFORE INSERT OR UPDATE ON task_dependencies
    FOR EACH ROW EXECUTE FUNCTION check_task_cycle();
