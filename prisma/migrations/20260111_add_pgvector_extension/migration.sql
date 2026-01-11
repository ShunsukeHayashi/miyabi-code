-- Add pgvector extension for vector similarity search
-- This migration enables AI-powered semantic search for courses and content

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for storing vector representations of content
CREATE TABLE "content_embeddings" (
    "id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_text" TEXT NOT NULL,
    "embedding" vector(3072) NOT NULL, -- OpenAI text-embedding-3-large dimension
    "model" TEXT NOT NULL DEFAULT 'text-embedding-3-large',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_embeddings_pkey" PRIMARY KEY ("id")
);

-- Create indexes for efficient similarity search
CREATE INDEX "content_embeddings_content_type_idx" ON "content_embeddings"("content_type");
CREATE INDEX "content_embeddings_content_id_idx" ON "content_embeddings"("content_id");
CREATE UNIQUE INDEX "content_embeddings_content_type_content_id_key" ON "content_embeddings"("content_type", "content_id");

-- Create HNSW index for fast vector similarity search
CREATE INDEX "content_embeddings_embedding_cosine_idx" ON "content_embeddings"
USING hnsw (embedding vector_cosine_ops);

-- Create IVFFlat index as fallback (better for smaller datasets)
CREATE INDEX "content_embeddings_embedding_l2_idx" ON "content_embeddings"
USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

-- Create search query table for search analytics
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "query_text" TEXT NOT NULL,
    "query_embedding" vector(3072),
    "results_count" INTEGER NOT NULL DEFAULT 0,
    "clicked_result_id" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- Create indexes for search analytics
CREATE INDEX "search_queries_user_id_idx" ON "search_queries"("user_id");
CREATE INDEX "search_queries_created_at_idx" ON "search_queries"("created_at");
CREATE INDEX "search_queries_session_id_idx" ON "search_queries"("session_id");

-- Add foreign key constraints
ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;