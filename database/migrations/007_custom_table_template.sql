-- Miyabi Marketplace Database - Custom Table Migration Template
-- Migration 007: Custom table creation
-- Version: 1.0.0
-- Created: 2025-11-29
-- Description: Template for adding new custom tables

-- ============================================================================
-- CUSTOM TABLE
-- ============================================================================
-- Replace 'custom_table' with your actual table name
-- Customize columns, constraints, and indexes as needed

CREATE TABLE IF NOT EXISTS custom_table (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys (examples - modify as needed)
    user_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Core Fields (customize as needed)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- JSON Fields (for flexible data storage)
    metadata JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',

    -- Numeric Fields (examples)
    priority INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,

    -- Boolean Flags (examples)
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,

    -- Constraints (customize as needed)
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'pending', 'archived'))
);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE custom_table IS 'Custom table for [describe purpose here]';
COMMENT ON COLUMN custom_table.id IS 'Unique identifier';
COMMENT ON COLUMN custom_table.user_id IS 'Reference to user who created this record';
COMMENT ON COLUMN custom_table.organization_id IS 'Organization this record belongs to';
COMMENT ON COLUMN custom_table.status IS 'Current status of the record';
COMMENT ON COLUMN custom_table.metadata IS 'Additional flexible metadata in JSON format';
COMMENT ON COLUMN custom_table.is_active IS 'Whether this record is currently active';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary indexes
CREATE INDEX IF NOT EXISTS idx_custom_table_user_id ON custom_table(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_table_org_id ON custom_table(organization_id);

-- Status and flags
CREATE INDEX IF NOT EXISTS idx_custom_table_status ON custom_table(status);
CREATE INDEX IF NOT EXISTS idx_custom_table_is_active ON custom_table(is_active);

-- Timestamps
CREATE INDEX IF NOT EXISTS idx_custom_table_created_at ON custom_table(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_table_updated_at ON custom_table(updated_at DESC);

-- Composite indexes (for common query patterns)
CREATE INDEX IF NOT EXISTS idx_custom_table_user_status ON custom_table(user_id, status);
CREATE INDEX IF NOT EXISTS idx_custom_table_org_active ON custom_table(organization_id, is_active);

-- JSONB indexes (if you need to query JSON fields)
CREATE INDEX IF NOT EXISTS idx_custom_table_metadata ON custom_table USING GIN(metadata);

-- Soft delete support
CREATE INDEX IF NOT EXISTS idx_custom_table_deleted_at ON custom_table(deleted_at)
    WHERE deleted_at IS NULL;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS trg_custom_table_updated_at ON custom_table;
CREATE TRIGGER trg_custom_table_updated_at
    BEFORE UPDATE ON custom_table
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TRIGGER trg_custom_table_updated_at ON custom_table IS 'Auto-update updated_at timestamp';

-- ============================================================================
-- OPTIONAL: ADDITIONAL RELATED TABLES
-- ============================================================================

-- Example: Many-to-many relationship table
CREATE TABLE IF NOT EXISTS custom_table_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_table_id UUID NOT NULL REFERENCES custom_table(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(custom_table_id, tag_id)
);

COMMENT ON TABLE custom_table_tags IS 'Tags associated with custom table records';

CREATE INDEX IF NOT EXISTS idx_custom_table_tags_table ON custom_table_tags(custom_table_id);
CREATE INDEX IF NOT EXISTS idx_custom_table_tags_tag ON custom_table_tags(tag_id);

-- ============================================================================
-- FUNCTIONS (Optional)
-- ============================================================================

-- Example: Function to get active records
CREATE OR REPLACE FUNCTION get_active_custom_records(
    p_organization_id UUID
) RETURNS TABLE (
    id UUID,
    name VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.id,
        ct.name,
        ct.status,
        ct.created_at
    FROM custom_table ct
    WHERE ct.organization_id = p_organization_id
      AND ct.is_active = true
      AND ct.deleted_at IS NULL
    ORDER BY ct.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_active_custom_records IS 'Get all active custom records for an organization';

-- ============================================================================
-- ROW LEVEL SECURITY (Optional - enable if needed)
-- ============================================================================

-- Enable RLS
-- ALTER TABLE custom_table ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
-- CREATE POLICY "custom_table_select_own"
--     ON custom_table FOR SELECT
--     USING (
--         auth.uid() = user_id
--         OR EXISTS (
--             SELECT 1 FROM organization_members om
--             WHERE om.organization_id = custom_table.organization_id
--               AND om.user_id = auth.uid()
--               AND om.status = 'active'
--         )
--     );

-- Users can insert their own records
-- CREATE POLICY "custom_table_insert_own"
--     ON custom_table FOR INSERT
--     WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
-- CREATE POLICY "custom_table_update_own"
--     ON custom_table FOR UPDATE
--     USING (auth.uid() = user_id);

-- Admins can delete records
-- CREATE POLICY "custom_table_delete_admin"
--     ON custom_table FOR DELETE
--     USING (
--         EXISTS (
--             SELECT 1 FROM organization_members om
--             WHERE om.organization_id = custom_table.organization_id
--               AND om.user_id = auth.uid()
--               AND om.role IN ('owner', 'admin')
--         )
--     );

-- ============================================================================
-- SAMPLE DATA (Optional - for development/testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
INSERT INTO custom_table (user_id, organization_id, name, description, status, priority) VALUES
(
    (SELECT id FROM web_users LIMIT 1),
    (SELECT id FROM organizations LIMIT 1),
    'Sample Record 1',
    'This is a sample description',
    'active',
    1
),
(
    (SELECT id FROM web_users LIMIT 1),
    (SELECT id FROM organizations LIMIT 1),
    'Sample Record 2',
    'Another sample description',
    'pending',
    2
);
*/

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count tables created
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('custom_table', 'custom_table_tags');

    -- Count indexes created
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'custom_table';

    RAISE NOTICE 'Migration 007_custom_table_template complete';
    RAISE NOTICE '  - Tables created: %', table_count;
    RAISE NOTICE '  - Indexes created: %', index_count;

    IF table_count < 1 THEN
        RAISE EXCEPTION 'Migration failed: Expected tables were not created';
    END IF;
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (Create separate .down.sql file)
-- ============================================================================

-- To create a rollback script, create: 007_custom_table_template.down.sql
-- With the following content:
--
-- DROP TABLE IF EXISTS custom_table_tags CASCADE;
-- DROP TABLE IF EXISTS custom_table CASCADE;
-- DROP FUNCTION IF EXISTS get_active_custom_records(UUID);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
