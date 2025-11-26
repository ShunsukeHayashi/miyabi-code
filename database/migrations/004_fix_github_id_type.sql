-- Migration: Fix github_id type from INTEGER to BIGINT
-- Issue: github_id should be BIGINT (INT8) to match Rust i64 type
-- Date: 2025-11-26

-- Step 1: Alter the column type from INTEGER to BIGINT
ALTER TABLE web_users
ALTER COLUMN github_id TYPE BIGINT;

-- Step 2: Update index if needed (should be automatic but explicit is safer)
DROP INDEX IF EXISTS idx_web_users_github_id;
CREATE INDEX idx_web_users_github_id ON web_users(github_id);

-- Update comment
COMMENT ON COLUMN web_users.github_id IS 'GitHub user ID (BIGINT for compatibility with Rust i64)';
