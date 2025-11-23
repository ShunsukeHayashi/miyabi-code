-- Fix github_id column type to BIGINT
ALTER TABLE users ALTER COLUMN github_id TYPE BIGINT;
ALTER TABLE repositories ALTER COLUMN github_repo_id TYPE BIGINT;
