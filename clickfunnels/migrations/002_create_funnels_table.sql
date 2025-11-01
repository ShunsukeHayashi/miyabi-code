-- Create Funnels table
-- Part of ClickFunnels Complete Auto-Implementation
-- SWML θ₄ Phase P0 Task T003

CREATE TABLE funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_funnels_user_id ON funnels(user_id);
CREATE INDEX idx_funnels_status ON funnels(status);
CREATE INDEX idx_funnels_type ON funnels(type);

-- Add updated_at trigger
CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE
    ON funnels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
