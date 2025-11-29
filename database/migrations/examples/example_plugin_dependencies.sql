-- Example Migration: Plugin Dependencies
-- Description: Track plugin dependencies and compatibility
-- Use Case: When a plugin requires another plugin to function
-- Version: 1.0.0

-- ============================================================================
-- PLUGIN_DEPENDENCIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS plugin_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Plugin relationship
    plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,
    required_plugin_id TEXT NOT NULL REFERENCES plugins(id) ON DELETE CASCADE,

    -- Version constraints
    minimum_version VARCHAR(50),
    maximum_version VARCHAR(50),
    exact_version VARCHAR(50),

    -- Dependency metadata
    dependency_type VARCHAR(20) NOT NULL DEFAULT 'required',
    description TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    UNIQUE(plugin_id, required_plugin_id),
    CONSTRAINT valid_dependency_type CHECK (
        dependency_type IN ('required', 'optional', 'recommended', 'conflict')
    ),
    CONSTRAINT no_self_dependency CHECK (plugin_id != required_plugin_id)
);

COMMENT ON TABLE plugin_dependencies IS 'Plugin dependency relationships and version requirements';
COMMENT ON COLUMN plugin_dependencies.dependency_type IS 'required, optional, recommended, or conflict';
COMMENT ON COLUMN plugin_dependencies.minimum_version IS 'Minimum compatible version (semantic versioning)';
COMMENT ON COLUMN plugin_dependencies.conflict IS 'When dependency_type is conflict, this plugin cannot coexist';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_plugin_deps_plugin ON plugin_dependencies(plugin_id);
CREATE INDEX idx_plugin_deps_required ON plugin_dependencies(required_plugin_id);
CREATE INDEX idx_plugin_deps_type ON plugin_dependencies(dependency_type);
CREATE INDEX idx_plugin_deps_plugin_type ON plugin_dependencies(plugin_id, dependency_type);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Check if plugin dependencies are satisfied
CREATE OR REPLACE FUNCTION check_plugin_dependencies(
    p_plugin_id TEXT
) RETURNS TABLE (
    dependency_satisfied BOOLEAN,
    required_plugin TEXT,
    required_version VARCHAR,
    installed_version VARCHAR,
    issue TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN s.id IS NULL THEN FALSE
            WHEN pd.exact_version IS NOT NULL AND p.version != pd.exact_version THEN FALSE
            WHEN pd.minimum_version IS NOT NULL AND p.version < pd.minimum_version THEN FALSE
            WHEN pd.maximum_version IS NOT NULL AND p.version > pd.maximum_version THEN FALSE
            ELSE TRUE
        END AS dependency_satisfied,
        pd.required_plugin_id AS required_plugin,
        COALESCE(pd.exact_version, pd.minimum_version, 'any') AS required_version,
        p.version AS installed_version,
        CASE
            WHEN s.id IS NULL THEN 'Plugin not installed'
            WHEN pd.exact_version IS NOT NULL AND p.version != pd.exact_version
                THEN 'Version mismatch: requires exact ' || pd.exact_version
            WHEN pd.minimum_version IS NOT NULL AND p.version < pd.minimum_version
                THEN 'Version too old: requires >= ' || pd.minimum_version
            WHEN pd.maximum_version IS NOT NULL AND p.version > pd.maximum_version
                THEN 'Version too new: requires <= ' || pd.maximum_version
            ELSE NULL
        END AS issue
    FROM plugin_dependencies pd
    LEFT JOIN plugins p ON p.id = pd.required_plugin_id
    LEFT JOIN subscriptions s ON s.plugin_id = p.id
    WHERE pd.plugin_id = p_plugin_id
      AND pd.dependency_type = 'required';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_plugin_dependencies IS 'Verify all required dependencies are satisfied';

-- Get dependency tree for a plugin
CREATE OR REPLACE FUNCTION get_plugin_dependency_tree(
    p_plugin_id TEXT,
    p_max_depth INTEGER DEFAULT 5
) RETURNS TABLE (
    depth INTEGER,
    plugin_id TEXT,
    plugin_name TEXT,
    dependency_type VARCHAR,
    version_requirement VARCHAR
) AS $$
WITH RECURSIVE dependency_tree AS (
    -- Base case: direct dependencies
    SELECT
        1 AS depth,
        pd.required_plugin_id AS plugin_id,
        p.name AS plugin_name,
        pd.dependency_type,
        COALESCE(pd.exact_version, pd.minimum_version, 'any') AS version_requirement
    FROM plugin_dependencies pd
    JOIN plugins p ON p.id = pd.required_plugin_id
    WHERE pd.plugin_id = p_plugin_id

    UNION ALL

    -- Recursive case: dependencies of dependencies
    SELECT
        dt.depth + 1,
        pd.required_plugin_id,
        p.name,
        pd.dependency_type,
        COALESCE(pd.exact_version, pd.minimum_version, 'any')
    FROM dependency_tree dt
    JOIN plugin_dependencies pd ON pd.plugin_id = dt.plugin_id
    JOIN plugins p ON p.id = pd.required_plugin_id
    WHERE dt.depth < p_max_depth
)
SELECT * FROM dependency_tree
ORDER BY depth, plugin_name;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_plugin_dependency_tree IS 'Get complete dependency tree for a plugin';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trg_plugin_deps_updated_at ON plugin_dependencies;
CREATE TRIGGER trg_plugin_deps_updated_at
    BEFORE UPDATE ON plugin_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Example: miyabi-lark plugin depends on miyabi-core
-- INSERT INTO plugin_dependencies (plugin_id, required_plugin_id, minimum_version, dependency_type) VALUES
-- ('miyabi-lark', 'miyabi-core', '1.0.0', 'required');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Plugin dependencies migration complete';
    RAISE NOTICE 'Functions: check_plugin_dependencies, get_plugin_dependency_tree';
END $$;
