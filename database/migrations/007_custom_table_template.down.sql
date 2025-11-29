-- Miyabi Marketplace Database - Rollback Migration 007
-- Rollback: Custom table creation
-- Version: 1.0.0
-- Created: 2025-11-29
-- Description: Rollback script for migration 007

-- ============================================================================
-- ROLLBACK CUSTOM TABLE MIGRATION
-- ============================================================================

-- Drop functions first
DROP FUNCTION IF EXISTS get_active_custom_records(UUID);

-- Drop related tables (cascade to remove foreign key constraints)
DROP TABLE IF EXISTS custom_table_tags CASCADE;

-- Drop main table
DROP TABLE IF EXISTS custom_table CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Verify tables are dropped
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'custom_table'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE EXCEPTION 'Rollback failed: custom_table still exists';
    END IF;

    RAISE NOTICE 'Rollback of migration 007_custom_table_template complete';
END $$;
