//! Text embedding module
//!
//! This module provides functionality to convert text chunks into vector embeddings.
//! For now, this uses mock embeddings. In production, you would integrate with
//! an actual embedding model (e.g., OpenAI embeddings, sentence-transformers, etc.)

use anyhow::Result;
use serde::{Deserialize, Serialize};

/// Configuration for text chunking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkConfig {
    /// Maximum tokens per chunk
    pub chunk_size: usize,
    /// Overlap tokens between chunks
    pub overlap: usize,
}

impl Default for ChunkConfig {
    fn default() -> Self {
        Self {
            chunk_size: 512,
            overlap: 50,
        }
    }
}

/// Text embedder that converts text to vector embeddings
pub struct TextEmbedder {
    config: ChunkConfig,
    /// Dimension of the embedding vectors
    embedding_dim: usize,
}

impl TextEmbedder {
    /// Create a new text embedder
    ///
    /// # Arguments
    /// * `config` - Chunking configuration
    /// * `embedding_dim` - Dimension of embedding vectors (default: 384 for sentence-transformers)
    pub fn new(config: ChunkConfig, embedding_dim: usize) -> Self {
        Self {
            config,
            embedding_dim,
        }
    }

    /// Get the embedding dimension
    pub fn embedding_dim(&self) -> usize {
        self.embedding_dim
    }

    /// Generate embedding for a single text chunk
    ///
    /// Note: This is a MOCK implementation. In production, you would:
    /// 1. Use OpenAI Embeddings API
    /// 2. Use sentence-transformers via Python binding
    /// 3. Use a local embedding model
    ///
    /// The mock creates a deterministic vector based on text content.
    pub async fn embed_text(&self, text: &str) -> Result<Vec<f32>> {
        // Mock embedding: improved hash-based vector generation
        // This ensures the same text always produces the same embedding
        let mut embedding = vec![0.0f32; self.embedding_dim];

        // Use character-based features with multiple passes for better distribution
        let bytes = text.as_bytes();

        // Pass 1: Character values
        for (i, &byte) in bytes.iter().enumerate() {
            let idx = i % self.embedding_dim;
            embedding[idx] += (byte as f32) / 255.0;
        }

        // Pass 2: Character pairs (bigrams)
        for i in 0..bytes.len().saturating_sub(1) {
            let idx = (bytes[i] as usize ^ bytes[i + 1] as usize) % self.embedding_dim;
            embedding[idx] += 0.5;
        }

        // Pass 3: Position-weighted features
        for (pos, &byte) in bytes.iter().enumerate() {
            let idx = ((byte as usize) + pos) % self.embedding_dim;
            embedding[idx] += (pos as f32) / (bytes.len() as f32 + 1.0);
        }

        // Normalize the vector
        let magnitude: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        if magnitude > 0.0 {
            for val in &mut embedding {
                *val /= magnitude;
            }
        }

        Ok(embedding)
    }

    /// Generate embeddings for multiple text chunks
    pub async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>> {
        let mut embeddings = Vec::with_capacity(texts.len());

        for text in texts {
            let embedding = self.embed_text(text).await?;
            embeddings.push(embedding);
        }

        Ok(embeddings)
    }

    /// Get chunk configuration
    pub fn chunk_config(&self) -> &ChunkConfig {
        &self.config
    }
}

impl Default for TextEmbedder {
    fn default() -> Self {
        Self::new(ChunkConfig::default(), 384)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_embed_text() {
        let embedder = TextEmbedder::default();
        let text = "織田信長は戦国時代の武将である。";

        let embedding = embedder.embed_text(text).await.unwrap();

        assert_eq!(embedding.len(), 384);

        // Check normalization (L2 norm should be ~1.0)
        let magnitude: f32 = embedding.iter().map(|x| x * x).sum::<f32>().sqrt();
        assert!((magnitude - 1.0).abs() < 0.001);
    }

    #[tokio::test]
    async fn test_embed_deterministic() {
        let embedder = TextEmbedder::default();
        let text = "Test text";

        let embedding1 = embedder.embed_text(text).await.unwrap();
        let embedding2 = embedder.embed_text(text).await.unwrap();

        // Same text should produce same embedding
        assert_eq!(embedding1, embedding2);
    }

    #[tokio::test]
    async fn test_embed_different_texts() {
        let embedder = TextEmbedder::default();
        let text1 = "織田信長";
        let text2 = "豊臣秀吉";

        let embedding1 = embedder.embed_text(text1).await.unwrap();
        let embedding2 = embedder.embed_text(text2).await.unwrap();

        // Different texts should produce different embeddings
        assert_ne!(embedding1, embedding2);
    }

    #[tokio::test]
    async fn test_embed_batch() {
        let embedder = TextEmbedder::default();
        let texts = vec![
            "織田信長".to_string(),
            "豊臣秀吉".to_string(),
            "徳川家康".to_string(),
        ];

        let embeddings = embedder.embed_batch(&texts).await.unwrap();

        assert_eq!(embeddings.len(), 3);
        for embedding in embeddings {
            assert_eq!(embedding.len(), 384);
        }
    }

    #[test]
    fn test_chunk_config_default() {
        let config = ChunkConfig::default();
        assert_eq!(config.chunk_size, 512);
        assert_eq!(config.overlap, 50);
    }
}
