-- Create Integrations table
-- Part of ClickFunnels Complete Auto-Implementation
-- SWML θ₄ Phase P0 Task T003

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);

-- Add updated_at trigger
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE
    ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE integrations IS 'External service integrations (SMTP, Payment, Analytics)';
COMMENT ON COLUMN integrations.type IS 'Integration type: smtp, payment, analytics, etc.';
COMMENT ON COLUMN integrations.config IS 'Integration-specific configuration (API keys, endpoints, etc.)';
