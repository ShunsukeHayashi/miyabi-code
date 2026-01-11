-- Initialize pgvector extension for Miyabi
-- This script runs automatically when the PostgreSQL container starts

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE NOTICE 'pgvector extension installed successfully';
  ELSE
    RAISE EXCEPTION 'pgvector extension failed to install';
  END IF;
END $$;
