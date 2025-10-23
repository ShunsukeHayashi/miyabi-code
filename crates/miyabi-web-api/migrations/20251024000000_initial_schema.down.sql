-- Rollback Initial Database Schema

-- Drop triggers
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
DROP TRIGGER IF EXISTS update_agent_executions_updated_at ON agent_executions;
DROP TRIGGER IF EXISTS update_repositories_updated_at ON repositories;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_websocket_connections_connection_id;
DROP INDEX IF EXISTS idx_websocket_connections_user_id;
DROP INDEX IF EXISTS idx_line_messages_line_user_id;
DROP INDEX IF EXISTS idx_line_messages_user_id;
DROP INDEX IF EXISTS idx_workflows_repository_id;
DROP INDEX IF EXISTS idx_workflows_user_id;
DROP INDEX IF EXISTS idx_agent_executions_repository_id;
DROP INDEX IF EXISTS idx_agent_executions_status;
DROP INDEX IF EXISTS idx_agent_executions_user_id;

-- Drop tables (in reverse order of creation to handle foreign key constraints)
DROP TABLE IF EXISTS websocket_connections;
DROP TABLE IF EXISTS line_messages;
DROP TABLE IF EXISTS workflows;
DROP TABLE IF EXISTS agent_executions;
DROP TABLE IF EXISTS repositories;
DROP TABLE IF EXISTS users;
