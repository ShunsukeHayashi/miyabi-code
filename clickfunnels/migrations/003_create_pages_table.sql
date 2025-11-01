-- Create Pages table
-- Part of ClickFunnels Complete Auto-Implementation
-- SWML θ₄ Phase P0 Task T003

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    funnel_id UUID NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    html_content TEXT,
    css_content TEXT,
    js_content TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_pages_funnel_id ON pages(funnel_id);
CREATE INDEX idx_pages_path ON pages(path);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_order_index ON pages(funnel_id, order_index);

-- Add unique constraint on funnel_id + path
CREATE UNIQUE INDEX idx_pages_funnel_path ON pages(funnel_id, path);

-- Add updated_at trigger
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE
    ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
