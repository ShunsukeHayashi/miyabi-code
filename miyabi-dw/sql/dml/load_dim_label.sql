-- Miyabi Data Warehouse - Load dim_label
-- Version: 1.0.0
-- This script loads the Miyabi 57-label system into the dimension table

-- ============================================================================
-- LOAD MIYABI 57-LABEL SYSTEM
-- ============================================================================

INSERT INTO dim_label (
    label_name,
    label_category,
    label_priority,
    color,
    icon,
    description,
    usage_guidelines,
    is_active
) VALUES
    -- Status Labels (7)
    ('status:backlog', 'Status', 'low', '#d4d4d4', '📋', 'Issue is in the backlog', 'Use for issues not yet started', TRUE),
    ('status:todo', 'Status', 'medium', '#0969da', '📝', 'Issue is ready to start', 'Use when issue is ready for work', TRUE),
    ('status:in-progress', 'Status', 'high', '#1f883d', '🔄', 'Issue is currently being worked on', 'Use when actively working', TRUE),
    ('status:blocked', 'Status', 'high', '#bc4c00', '🚧', 'Issue is blocked', 'Use when waiting for external dependency', TRUE),
    ('status:review', 'Status', 'high', '#8250df', '👀', 'Issue is in review', 'Use when PR is submitted and awaiting review', TRUE),
    ('status:done', 'Status', 'low', '#1a7f37', '✅', 'Issue is completed', 'Use when issue is fully completed', TRUE),
    ('status:wontfix', 'Status', 'low', '#57606a', '❌', 'Issue will not be fixed', 'Use for issues that will not be addressed', TRUE),

    -- Priority Labels (5)
    ('P0', 'Priority', 'critical', '#d73a4a', '🔴', 'Critical priority - drop everything', 'Immediate action required, system down', TRUE),
    ('P1', 'Priority', 'high', '#e99695', '🟠', 'High priority - next up', 'Should be addressed in current sprint', TRUE),
    ('P2', 'Priority', 'medium', '#fbca04', '🟡', 'Medium priority - normal queue', 'Normal priority, handle in order', TRUE),
    ('P3', 'Priority', 'low', '#0e8a16', '🟢', 'Low priority - when convenient', 'Nice to have, low urgency', TRUE),
    ('P4', 'Priority', 'lowest', '#c5def5', '⚪', 'Lowest priority - backlog', 'Long-term backlog item', TRUE),

    -- Type Labels (8)
    ('type:bug', 'Type', 'high', '#d73a4a', '🐛', 'Bug fix', 'Something is not working as expected', TRUE),
    ('type:feature', 'Type', 'medium', '#0075ca', '✨', 'New feature', 'New functionality or capability', TRUE),
    ('type:enhancement', 'Type', 'medium', '#a2eeef', '⬆️', 'Enhancement', 'Improvement to existing feature', TRUE),
    ('type:refactor', 'Type', 'medium', '#fbca04', '♻️', 'Refactoring', 'Code restructuring without behavior change', TRUE),
    ('type:docs', 'Type', 'low', '#0075ca', '📚', 'Documentation', 'Documentation improvements', TRUE),
    ('type:test', 'Type', 'medium', '#c5def5', '🧪', 'Testing', 'Test coverage or test infrastructure', TRUE),
    ('type:chore', 'Type', 'low', '#fef2c0', '🔧', 'Chore', 'Maintenance work, dependency updates', TRUE),
    ('type:security', 'Type', 'critical', '#d73a4a', '🔒', 'Security', 'Security vulnerability or improvement', TRUE),

    -- Component Labels (10)
    ('comp:cli', 'Component', 'medium', '#0e8a16', '💻', 'CLI component', 'miyabi-cli crate', TRUE),
    ('comp:core', 'Component', 'high', '#d73a4a', '🧠', 'Core component', 'miyabi-core crate', TRUE),
    ('comp:agent', 'Component', 'high', '#1f883d', '🤖', 'Agent system', 'miyabi-agent-* crates', TRUE),
    ('comp:worktree', 'Component', 'medium', '#0075ca', '🌳', 'Worktree management', 'miyabi-worktree crate', TRUE),
    ('comp:approval', 'Component', 'medium', '#fbca04', '✅', 'Approval system', 'miyabi-approval crate', TRUE),
    ('comp:claudable', 'Component', 'medium', '#8250df', '🔮', 'Claudable protocol', 'miyabi-claudable crate', TRUE),
    ('comp:web-api', 'Component', 'medium', '#0969da', '🌐', 'Web API', 'miyabi-web-api crate', TRUE),
    ('comp:benchmark', 'Component', 'low', '#c5def5', '📊', 'Benchmark', 'miyabi-benchmark crate', TRUE),
    ('comp:a2a', 'Component', 'medium', '#1f883d', '🔗', 'Agent-to-Agent', 'miyabi-a2a crate', TRUE),
    ('comp:infra', 'Component', 'medium', '#bc4c00', '🏗️', 'Infrastructure', 'Deployment and infrastructure', TRUE),

    -- Effort Labels (5)
    ('effort:xs', 'Effort', 'low', '#c5def5', '⏱️', 'Extra small - < 1 hour', 'Very quick fix', TRUE),
    ('effort:s', 'Effort', 'low', '#0e8a16', '🕐', 'Small - 1-4 hours', 'Half-day work', TRUE),
    ('effort:m', 'Effort', 'medium', '#fbca04', '🕑', 'Medium - 1-2 days', 'Full-day to 2 days', TRUE),
    ('effort:l', 'Effort', 'medium', '#e99695', '🕒', 'Large - 3-5 days', 'Full week', TRUE),
    ('effort:xl', 'Effort', 'high', '#d73a4a', '🕓', 'Extra large - > 1 week', 'Multi-week effort', TRUE),

    -- Impact Labels (5)
    ('impact:critical', 'Impact', 'critical', '#d73a4a', '💥', 'Critical business impact', 'Affects core functionality', TRUE),
    ('impact:high', 'Impact', 'high', '#e99695', '📈', 'High impact', 'Significant user value', TRUE),
    ('impact:medium', 'Impact', 'medium', '#fbca04', '📊', 'Medium impact', 'Moderate user value', TRUE),
    ('impact:low', 'Impact', 'low', '#0e8a16', '📉', 'Low impact', 'Minor improvement', TRUE),
    ('impact:none', 'Impact', 'lowest', '#c5def5', '⚪', 'No user impact', 'Internal only', TRUE),

    -- Technology Labels (7)
    ('tech:rust', 'Technology', 'high', '#dea584', '🦀', 'Rust', 'Rust programming language', TRUE),
    ('tech:typescript', 'Technology', 'medium', '#3178c6', '📘', 'TypeScript', 'TypeScript/JavaScript', TRUE),
    ('tech:sql', 'Technology', 'medium', '#336791', '🗃️', 'SQL/Database', 'Database related', TRUE),
    ('tech:docker', 'Technology', 'medium', '#2496ed', '🐳', 'Docker', 'Container related', TRUE),
    ('tech:aws', 'Technology', 'medium', '#ff9900', '☁️', 'AWS', 'Amazon Web Services', TRUE),
    ('tech:github', 'Technology', 'low', '#181717', '🐙', 'GitHub', 'GitHub integration', TRUE),
    ('tech:ci-cd', 'Technology', 'medium', '#2088ff', '🔄', 'CI/CD', 'Continuous integration/deployment', TRUE),

    -- Phase Labels (5)
    ('phase:design', 'Phase', 'medium', '#0075ca', '🎨', 'Design phase', 'Architecture and design', TRUE),
    ('phase:implementation', 'Phase', 'high', '#1f883d', '⚒️', 'Implementation phase', 'Active development', TRUE),
    ('phase:testing', 'Phase', 'high', '#fbca04', '🧪', 'Testing phase', 'Quality assurance', TRUE),
    ('phase:deployment', 'Phase', 'high', '#8250df', '🚀', 'Deployment phase', 'Release and deployment', TRUE),
    ('phase:monitoring', 'Phase', 'medium', '#0e8a16', '📊', 'Monitoring phase', 'Post-deployment monitoring', TRUE),

    -- Quality Labels (3)
    ('quality:good', 'Quality', 'low', '#0e8a16', '✨', 'Good code quality', 'High quality implementation', TRUE),
    ('quality:needs-improvement', 'Quality', 'medium', '#fbca04', '⚠️', 'Needs improvement', 'Quality issues present', TRUE),
    ('quality:technical-debt', 'Quality', 'high', '#d73a4a', '💸', 'Technical debt', 'Accumulating technical debt', TRUE),

    -- Meta Labels (2)
    ('good-first-issue', 'Meta', 'low', '#7057ff', '🌟', 'Good first issue', 'Suitable for newcomers', TRUE),
    ('help-wanted', 'Meta', 'medium', '#008672', '🤝', 'Help wanted', 'Extra attention needed', TRUE)

ON CONFLICT (label_name) DO UPDATE SET
    label_category = EXCLUDED.label_category,
    label_priority = EXCLUDED.label_priority,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    usage_guidelines = EXCLUDED.usage_guidelines,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Verify load
SELECT
    label_category,
    COUNT(*) AS label_count,
    SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_count
FROM dim_label
GROUP BY label_category
ORDER BY label_category;

-- Display all labels
SELECT
    label_name,
    label_category,
    label_priority,
    color,
    icon,
    description
FROM dim_label
ORDER BY
    CASE label_category
        WHEN 'Status' THEN 1
        WHEN 'Priority' THEN 2
        WHEN 'Type' THEN 3
        WHEN 'Component' THEN 4
        WHEN 'Effort' THEN 5
        WHEN 'Impact' THEN 6
        WHEN 'Technology' THEN 7
        WHEN 'Phase' THEN 8
        WHEN 'Quality' THEN 9
        WHEN 'Meta' THEN 10
    END,
    label_name;
