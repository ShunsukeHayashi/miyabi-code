-- Drop Tasks Table and Dependencies

DROP TRIGGER IF EXISTS prevent_task_cycles ON task_dependencies;
DROP FUNCTION IF EXISTS check_task_cycle();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;

DROP INDEX IF EXISTS idx_task_dependencies_depends_on;
DROP INDEX IF EXISTS idx_task_dependencies_task_id;
DROP INDEX IF EXISTS idx_tasks_created_at;
DROP INDEX IF EXISTS idx_tasks_issue_number;
DROP INDEX IF EXISTS idx_tasks_agent_type;
DROP INDEX IF EXISTS idx_tasks_priority;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_repository_id;
DROP INDEX IF EXISTS idx_tasks_user_id;

DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS tasks;
