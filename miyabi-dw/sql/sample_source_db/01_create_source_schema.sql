-- Miyabi Source Database Schema (Sample/Test)
-- Version: 1.0.0
-- Purpose: Sample source database for ETL testing

-- ============================================================================
-- ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    number INT NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('P0', 'P1', 'P2', 'P3', 'P4')),
    complexity VARCHAR(20) CHECK (complexity IN ('trivial', 'low', 'medium', 'high', 'critical')),
    issue_type VARCHAR(50),
    repository VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_issues_updated_at ON issues(updated_at);
CREATE INDEX idx_issues_number ON issues(number);

-- ============================================================================
-- AGENT EXECUTION LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_execution_logs (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id),
    agent_id VARCHAR(100) NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    execution_duration_ms BIGINT,
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    llm_tokens_input INT,
    llm_tokens_output INT,
    llm_cost_usd DECIMAL(10,4),
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_exec_issue_id ON agent_execution_logs(issue_id);
CREATE INDEX idx_agent_exec_completed ON agent_execution_logs(completed_at);

-- ============================================================================
-- CODE GENERATION TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS code_gen_tasks (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id) UNIQUE,
    total_files_generated INT DEFAULT 0,
    total_lines_generated INT DEFAULT 0,
    compilation_time_ms BIGINT,
    clippy_warnings INT DEFAULT 0,
    fmt_issues INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_codegen_issue_id ON code_gen_tasks(issue_id);

-- ============================================================================
-- REVIEW RESULTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS review_results (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id) UNIQUE,
    review_score DECIMAL(3,2) CHECK (review_score BETWEEN 0 AND 1),
    test_coverage_percent DECIMAL(5,2),
    security_issues_found INT DEFAULT 0,
    performance_issues_found INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_review_issue_id ON review_results(issue_id);

-- ============================================================================
-- DEPLOYMENT PIPELINES
-- ============================================================================
CREATE TABLE IF NOT EXISTS deployment_pipelines (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id) UNIQUE,
    deployment_status VARCHAR(50) CHECK (deployment_status IN ('pending', 'running', 'success', 'failed', 'rolled_back')),
    deployment_duration_seconds INT,
    infrastructure_cost_usd DECIMAL(10,4),
    environment VARCHAR(50) CHECK (environment IN ('development', 'staging', 'production')),
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deployment_issue_id ON deployment_pipelines(issue_id);
CREATE INDEX idx_deployment_status ON deployment_pipelines(deployment_status);

-- ============================================================================
-- COMMITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS commits (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id),
    commit_sha VARCHAR(40) NOT NULL UNIQUE,
    pr_number INT,
    commit_message TEXT,
    author VARCHAR(100),
    committed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commits_issue_id ON commits(issue_id);
CREATE INDEX idx_commits_pr_number ON commits(pr_number);

-- ============================================================================
-- LABEL HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS label_history (
    id SERIAL PRIMARY KEY,
    issue_id INT REFERENCES issues(id),
    label_name VARCHAR(100) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP
);

CREATE INDEX idx_label_history_issue_id ON label_history(issue_id);
CREATE INDEX idx_label_history_label ON label_history(label_name);

-- ============================================================================
-- WORKTREE STATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS worktree_states (
    id SERIAL PRIMARY KEY,
    associated_issue_id INT REFERENCES issues(id) UNIQUE,
    worktree_path VARCHAR(500) NOT NULL,
    branch_name VARCHAR(200),
    status VARCHAR(50) CHECK (status IN ('active', 'completed', 'abandoned', 'merged')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cleaned_up_at TIMESTAMP
);

CREATE INDEX idx_worktree_issue_id ON worktree_states(associated_issue_id);
CREATE INDEX idx_worktree_status ON worktree_states(status);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE issues IS 'Source table for GitHub issues';
COMMENT ON TABLE agent_execution_logs IS 'Miyabi agent execution tracking';
COMMENT ON TABLE code_gen_tasks IS 'Code generation task results';
COMMENT ON TABLE review_results IS 'Code review outcomes';
COMMENT ON TABLE deployment_pipelines IS 'Deployment pipeline execution';
COMMENT ON TABLE commits IS 'Git commit information';
COMMENT ON TABLE label_history IS 'Issue label change history';
COMMENT ON TABLE worktree_states IS 'Git worktree session tracking';
