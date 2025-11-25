-- Rollback RBAC Schema
-- Issue: #975

DROP FUNCTION IF EXISTS has_permission(UUID, UUID, VARCHAR);
DROP VIEW IF EXISTS user_effective_permissions;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
