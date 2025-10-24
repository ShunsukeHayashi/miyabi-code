-- Rollback execution logs migration

DROP INDEX IF EXISTS idx_execution_logs_execution_timestamp;
DROP INDEX IF EXISTS idx_execution_logs_log_level;
DROP INDEX IF EXISTS idx_execution_logs_timestamp;
DROP INDEX IF EXISTS idx_execution_logs_execution_id;

ALTER TABLE agent_executions DROP COLUMN IF EXISTS options;

DROP TABLE IF EXISTS execution_logs;
