-- Miyabi Data Warehouse - Dimension Tables DDL
-- Version: 1.0.0
-- PostgreSQL 15+

-- ============================================================================
-- DIMENSION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- D1: dim_time (Type 1 SCD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_time (
    time_key INT PRIMARY KEY,

    -- Date Fields
    full_date DATE NOT NULL UNIQUE,
    day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
    day_name VARCHAR(10),
    day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
    day_of_year INT CHECK (day_of_year BETWEEN 1 AND 366),

    -- Week Fields
    week_of_year INT CHECK (week_of_year BETWEEN 1 AND 53),
    week_of_month INT CHECK (week_of_month BETWEEN 1 AND 5),

    -- Month Fields
    month INT CHECK (month BETWEEN 1 AND 12),
    month_name VARCHAR(10),
    month_abbr VARCHAR(3),

    -- Quarter Fields
    quarter INT CHECK (quarter BETWEEN 1 AND 4),
    quarter_name VARCHAR(2),

    -- Year Fields
    year INT,

    -- Special Flags
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    is_business_day BOOLEAN,
    holiday_name VARCHAR(100),

    -- Fiscal Calendar (Fiscal year starts in April)
    fiscal_year INT,
    fiscal_quarter INT CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INT CHECK (fiscal_month BETWEEN 1 AND 12),
    fiscal_week INT
);

CREATE INDEX idx_dt_full_date ON dim_time(full_date);
CREATE INDEX idx_dt_year_month ON dim_time(year, month);
CREATE INDEX idx_dt_fiscal ON dim_time(fiscal_year, fiscal_quarter);

COMMENT ON TABLE dim_time IS 'Time dimension with calendar and fiscal hierarchies';

-- ----------------------------------------------------------------------------
-- D2: dim_issue (Type 2 SCD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_issue (
    issue_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    issue_id VARCHAR(50) NOT NULL,
    issue_number INT NOT NULL,

    -- Descriptive Attributes
    title VARCHAR(500),
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('P0', 'P1', 'P2', 'P3', 'P4')),
    complexity VARCHAR(20) CHECK (complexity IN ('trivial', 'low', 'medium', 'high', 'critical')),
    issue_type VARCHAR(50),
    category VARCHAR(100),

    -- Source Information
    repository VARCHAR(200),
    created_by VARCHAR(100),
    assigned_to VARCHAR(100),

    -- Labels (array for multiple labels)
    labels TEXT[],

    -- Type 2 SCD Fields
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,

    -- Audit Fields
    record_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_di_issue_id ON dim_issue(issue_id);
CREATE INDEX idx_di_issue_number ON dim_issue(issue_number);
CREATE INDEX idx_di_current ON dim_issue(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_di_effective ON dim_issue(effective_date, expiration_date);
CREATE UNIQUE INDEX idx_di_natural_key_current ON dim_issue(issue_id, issue_number)
    WHERE is_current = TRUE;

COMMENT ON TABLE dim_issue IS 'Issue dimension with Type 2 SCD for historical tracking';

-- ----------------------------------------------------------------------------
-- D3: dim_agent (Type 1 SCD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_agent (
    agent_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    agent_id VARCHAR(100) NOT NULL UNIQUE,

    -- Descriptive Attributes
    agent_name VARCHAR(200) NOT NULL,
    agent_type VARCHAR(50) CHECK (agent_type IN (
        'CodeGen', 'Review', 'Deployment', 'Issue',
        'Coordinator', 'Business', 'Marketing', 'Sales', 'CRM', 'Analytics'
    )),
    agent_category VARCHAR(50) CHECK (agent_category IN ('Technical', 'Business')),

    -- AI Model Information
    ai_model VARCHAR(100),
    ai_provider VARCHAR(50),
    model_version VARCHAR(50),

    -- Technical Details
    framework_version VARCHAR(50),
    capabilities TEXT[],
    max_concurrent_tasks INT,

    -- Cost Model
    cost_per_hour_usd DECIMAL(10,4),
    cost_per_token_usd DECIMAL(10,8),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit Fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_da_type ON dim_agent(agent_type);
CREATE INDEX idx_da_category ON dim_agent(agent_category);
CREATE INDEX idx_da_active ON dim_agent(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE dim_agent IS 'Agent dimension for Miyabi autonomous agents';

-- ----------------------------------------------------------------------------
-- D4: dim_infrastructure (Type 2 SCD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_infrastructure (
    infrastructure_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    resource_id VARCHAR(200) NOT NULL,

    -- Descriptive Attributes
    resource_type VARCHAR(100) CHECK (resource_type IN (
        'VPC', 'Subnet', 'EC2', 'ECS', 'RDS', 'S3',
        'Lambda', 'ALB', 'CloudFront', 'Route53', 'EKS'
    )),
    resource_name VARCHAR(200),

    -- Location
    cloud_provider VARCHAR(50) DEFAULT 'AWS',
    region VARCHAR(50),
    availability_zone VARCHAR(50),

    -- Configuration
    instance_type VARCHAR(100),
    cpu_count INT,
    memory_gb INT,
    storage_gb INT,
    storage_type VARCHAR(50),

    -- Network
    vpc_id VARCHAR(100),
    subnet_id VARCHAR(100),
    security_group_ids TEXT[],

    -- Cost
    hourly_cost_usd DECIMAL(10,4),
    monthly_cost_usd DECIMAL(10,2),

    -- Tags
    tags JSONB,

    -- Type 2 SCD Fields
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    version INT NOT NULL DEFAULT 1,

    -- Audit Fields
    record_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dinf_resource_id ON dim_infrastructure(resource_id);
CREATE INDEX idx_dinf_current ON dim_infrastructure(is_current) WHERE is_current = TRUE;
CREATE INDEX idx_dinf_type ON dim_infrastructure(resource_type);
CREATE INDEX idx_dinf_region ON dim_infrastructure(region);
CREATE INDEX idx_dinf_tags ON dim_infrastructure USING GIN(tags);
CREATE UNIQUE INDEX idx_dinf_natural_key_current ON dim_infrastructure(resource_id)
    WHERE is_current = TRUE;

COMMENT ON TABLE dim_infrastructure IS 'Infrastructure resource dimension with Type 2 SCD';

-- ----------------------------------------------------------------------------
-- D5: dim_label (Type 1 SCD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_label (
    label_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    label_name VARCHAR(100) NOT NULL UNIQUE,

    -- Miyabi 57-label system
    label_category VARCHAR(50) CHECK (label_category IN (
        'Status', 'Priority', 'Type', 'Component', 'Effort',
        'Impact', 'Technology', 'Phase', 'Quality', 'Meta', 'Custom'
    )),
    label_priority VARCHAR(20),

    -- Visual
    color VARCHAR(7),
    icon VARCHAR(50),

    -- Metadata
    description TEXT,
    usage_guidelines TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dl_category ON dim_label(label_category);
CREATE INDEX idx_dl_priority ON dim_label(label_priority);
CREATE INDEX idx_dl_active ON dim_label(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE dim_label IS 'Label dimension for Miyabi 57-label system';

-- ----------------------------------------------------------------------------
-- D6: dim_worktree (Type 1 SCD)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dim_worktree (
    worktree_key BIGSERIAL PRIMARY KEY,

    -- Natural Key
    worktree_path VARCHAR(500) NOT NULL UNIQUE,

    -- Descriptive Attributes
    branch_name VARCHAR(200),
    base_branch VARCHAR(200),
    status VARCHAR(50) CHECK (status IN ('active', 'completed', 'abandoned', 'merged')),

    -- Associated Work
    associated_issue_id VARCHAR(50),
    associated_pr_number INT,

    -- Metadata
    created_by VARCHAR(100),
    purpose TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    cleaned_up_at TIMESTAMP
);

CREATE INDEX idx_dw_branch ON dim_worktree(branch_name);
CREATE INDEX idx_dw_status ON dim_worktree(status);
CREATE INDEX idx_dw_issue ON dim_worktree(associated_issue_id);

COMMENT ON TABLE dim_worktree IS 'Worktree dimension for Git worktree management';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function to populate dim_time
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION populate_dim_time(
    start_date DATE,
    end_date DATE
)
RETURNS VOID AS $$
DECLARE
    iter_date DATE;
    fiscal_start_month INT := 4; -- April starts fiscal year
BEGIN
    iter_date := start_date;

    WHILE iter_date <= end_date LOOP
        INSERT INTO dim_time (
            time_key,
            full_date,
            day_of_week,
            day_name,
            day_of_month,
            day_of_year,
            week_of_year,
            week_of_month,
            month,
            month_name,
            month_abbr,
            quarter,
            quarter_name,
            year,
            is_weekend,
            is_business_day,
            fiscal_year,
            fiscal_quarter,
            fiscal_month
        ) VALUES (
            TO_CHAR(iter_date, 'YYYYMMDD')::INT,
            iter_date,
            EXTRACT(ISODOW FROM iter_date)::INT,
            TO_CHAR(iter_date, 'Day'),
            EXTRACT(DAY FROM iter_date)::INT,
            EXTRACT(DOY FROM iter_date)::INT,
            EXTRACT(WEEK FROM iter_date)::INT,
            CEIL(EXTRACT(DAY FROM iter_date)::DECIMAL / 7)::INT,
            EXTRACT(MONTH FROM iter_date)::INT,
            TO_CHAR(iter_date, 'Month'),
            TO_CHAR(iter_date, 'Mon'),
            EXTRACT(QUARTER FROM iter_date)::INT,
            'Q' || EXTRACT(QUARTER FROM iter_date),
            EXTRACT(YEAR FROM iter_date)::INT,
            EXTRACT(ISODOW FROM iter_date)::INT IN (6, 7),
            EXTRACT(ISODOW FROM iter_date)::INT NOT IN (6, 7),
            CASE
                WHEN EXTRACT(MONTH FROM iter_date) >= fiscal_start_month
                THEN EXTRACT(YEAR FROM iter_date)::INT
                ELSE EXTRACT(YEAR FROM iter_date)::INT - 1
            END,
            CASE
                WHEN EXTRACT(MONTH FROM iter_date) >= fiscal_start_month
                THEN CEIL((EXTRACT(MONTH FROM iter_date) - fiscal_start_month + 1)::DECIMAL / 3)::INT
                ELSE CEIL((EXTRACT(MONTH FROM iter_date) + 12 - fiscal_start_month + 1)::DECIMAL / 3)::INT
            END,
            CASE
                WHEN EXTRACT(MONTH FROM iter_date) >= fiscal_start_month
                THEN (EXTRACT(MONTH FROM iter_date) - fiscal_start_month + 1)::INT
                ELSE (EXTRACT(MONTH FROM iter_date) + 12 - fiscal_start_month + 1)::INT
            END
        )
        ON CONFLICT (time_key) DO NOTHING;

        iter_date := iter_date + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION populate_dim_time IS 'Populate dim_time with date range';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to miyabi_etl role (create this role separately)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO miyabi_etl;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO miyabi_etl;
