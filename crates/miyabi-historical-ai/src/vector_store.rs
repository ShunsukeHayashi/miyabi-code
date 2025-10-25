//! Vector store module for Qdrant integration
//!
//! This module provides functionality to store and retrieve vector embeddings
//! using Qdrant vector database.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// A document stored in the vector database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    /// Unique document ID
    pub id: String,
    /// The text content
    pub text: String,
    /// The embedding vector
    pub embedding: Vec<f32>,
    /// Metadata (e.g., figure name, source, timestamp)
    pub metadata: HashMap<String, String>,
    /// Similarity score (populated during search)
    #[serde(default)]
    pub score: f32,
}

impl Document {
    /// Create a new document
    pub fn new(id: String, text: String, embedding: Vec<f32>) -> Self {
        Self {
            id,
            text,
            embedding,
            metadata: HashMap::new(),
            score: 0.0,
        }
    }

    /// Add metadata to the document
    pub fn with_metadata(mut self, key: String, value: String) -> Self {
        self.metadata.insert(key, value);
        self
    }

    /// Set the similarity score
    pub fn with_score(mut self, score: f32) -> Self {
        self.score = score;
        self
    }
}

/// Vector store for managing document embeddings
///
/// Note: This is a mock implementation. When Qdrant is set up, replace with actual client.
pub struct VectorStore {
    collection_name: String,
    embedding_dim: usize,
    /// Mock storage: In-memory documents
    /// In production, this would be replaced with actual Qdrant client
    documents: std::sync::Arc<tokio::sync::RwLock<Vec<Document>>>,
}

impl VectorStore {
    /// Create a new vector store
    ///
    /// # Arguments
    /// * `collection_name` - Name of the Qdrant collection
    /// * `embedding_dim` - Dimension of embedding vectors
    pub async fn new(collection_name: String, embedding_dim: usize) -> Result<Self> {
        Ok(Self {
            collection_name,
            embedding_dim,
            documents: std::sync::Arc::new(tokio::sync::RwLock::new(Vec::new())),
        })
    }

    /// Initialize the collection in Qdrant
    ///
    /// In production, this would create the collection with proper configuration:
    /// - Vector dimension
    /// - Distance metric (cosine similarity)
    /// - Storage settings
    pub async fn initialize_collection(&self) -> Result<()> {
        tracing::info!(
            "Initializing collection '{}' with dimension {}",
            self.collection_name,
            self.embedding_dim
        );

        // Mock: Just log the operation
        // In production with Qdrant:
        // self.client.create_collection(...).await?;

        Ok(())
    }

    /// Insert a single document
    pub async fn insert(&self, document: Document) -> Result<()> {
        // Validate embedding dimension
        if document.embedding.len() != self.embedding_dim {
            anyhow::bail!(
                "Embedding dimension mismatch: expected {}, got {}",
                self.embedding_dim,
                document.embedding.len()
            );
        }

        let mut docs = self.documents.write().await;
        docs.push(document);

        Ok(())
    }

    /// Insert multiple documents
    pub async fn insert_batch(&self, documents: Vec<Document>) -> Result<()> {
        for doc in documents {
            self.insert(doc).await?;
        }
        Ok(())
    }

    /// Search for similar documents
    ///
    /// # Arguments
    /// * `query_embedding` - The query vector
    /// * `top_k` - Number of results to return
    /// * `filter` - Optional metadata filter (e.g., {"figure": "織田信長"})
    ///
    /// # Returns
    /// A list of documents sorted by similarity score (descending)
    pub async fn search(
        &self,
        query_embedding: &[f32],
        top_k: usize,
        filter: Option<HashMap<String, String>>,
    ) -> Result<Vec<Document>> {
        // Validate embedding dimension
        if query_embedding.len() != self.embedding_dim {
            anyhow::bail!(
                "Query embedding dimension mismatch: expected {}, got {}",
                self.embedding_dim,
                query_embedding.len()
            );
        }

        let docs = self.documents.read().await;

        // Apply metadata filter if provided
        let filtered_docs: Vec<&Document> = if let Some(filter) = &filter {
            docs.iter()
                .filter(|doc| {
                    filter
                        .iter()
                        .all(|(key, value)| doc.metadata.get(key) == Some(value))
                })
                .collect()
        } else {
            docs.iter().collect()
        };

        // Calculate cosine similarity for each document
        let mut scored_docs: Vec<Document> = filtered_docs
            .into_iter()
            .map(|doc| {
                let score = cosine_similarity(query_embedding, &doc.embedding);
                let mut doc_clone = doc.clone();
                doc_clone.score = score;
                doc_clone
            })
            .collect();

        // Sort by score (descending)
        scored_docs.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());

        // Take top k
        Ok(scored_docs.into_iter().take(top_k).collect())
    }

    /// Get collection info
    pub fn collection_name(&self) -> &str {
        &self.collection_name
    }

    /// Get embedding dimension
    pub fn embedding_dim(&self) -> usize {
        self.embedding_dim
    }

    /// Get total document count (for testing)
    pub async fn count(&self) -> usize {
        self.documents.read().await.len()
    }
}

/// Calculate cosine similarity between two vectors
fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }

    let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let magnitude_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let magnitude_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

    if magnitude_a == 0.0 || magnitude_b == 0.0 {
        return 0.0;
    }

    dot_product / (magnitude_a * magnitude_b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert!((cosine_similarity(&a, &b) - 1.0).abs() < 0.001);

        let c = vec![1.0, 0.0, 0.0];
        let d = vec![0.0, 1.0, 0.0];
        assert!((cosine_similarity(&c, &d) - 0.0).abs() < 0.001);

        let e = vec![1.0, 1.0, 0.0];
        let f = vec![1.0, 0.0, 0.0];
        let sim = cosine_similarity(&e, &f);
        assert!(sim > 0.7 && sim < 0.8);
    }

    #[tokio::test]
    async fn test_document_creation() {
        let doc = Document::new(
            "doc1".to_string(),
            "Test content".to_string(),
            vec![0.1, 0.2, 0.3],
        )
        .with_metadata("figure".to_string(), "織田信長".to_string())
        .with_score(0.95);

        assert_eq!(doc.id, "doc1");
        assert_eq!(doc.text, "Test content");
        assert_eq!(doc.embedding.len(), 3);
        assert_eq!(doc.metadata.get("figure").unwrap(), "織田信長");
        assert_eq!(doc.score, 0.95);
    }

    #[tokio::test]
    async fn test_vector_store_insert() {
        let store = VectorStore::new("test_collection".to_string(), 3)
            .await
            .unwrap();

        let doc = Document::new(
            "doc1".to_string(),
            "Test".to_string(),
            vec![0.1, 0.2, 0.3],
        );

        store.insert(doc).await.unwrap();
        assert_eq!(store.count().await, 1);
    }

    #[tokio::test]
    async fn test_vector_store_search() {
        let store = VectorStore::new("test_collection".to_string(), 3)
            .await
            .unwrap();

        // Insert some documents
        let doc1 = Document::new("doc1".to_string(), "Text 1".to_string(), vec![1.0, 0.0, 0.0])
            .with_metadata("figure".to_string(), "織田信長".to_string());

        let doc2 = Document::new("doc2".to_string(), "Text 2".to_string(), vec![0.0, 1.0, 0.0])
            .with_metadata("figure".to_string(), "豊臣秀吉".to_string());

        let doc3 = Document::new("doc3".to_string(), "Text 3".to_string(), vec![0.9, 0.1, 0.0])
            .with_metadata("figure".to_string(), "織田信長".to_string());

        store.insert(doc1).await.unwrap();
        store.insert(doc2).await.unwrap();
        store.insert(doc3).await.unwrap();

        // Search without filter
        let query = vec![1.0, 0.0, 0.0];
        let results = store.search(&query, 2, None).await.unwrap();

        assert_eq!(results.len(), 2);
        assert_eq!(results[0].id, "doc1"); // Most similar
        assert!(results[0].score > results[1].score);

        // Search with filter
        let mut filter = HashMap::new();
        filter.insert("figure".to_string(), "織田信長".to_string());

        let filtered_results = store.search(&query, 10, Some(filter)).await.unwrap();
        assert_eq!(filtered_results.len(), 2);
        for result in filtered_results {
            assert_eq!(result.metadata.get("figure").unwrap(), "織田信長");
        }
    }

    #[tokio::test]
    async fn test_dimension_validation() {
        let store = VectorStore::new("test_collection".to_string(), 3)
            .await
            .unwrap();

        // Wrong dimension should fail
        let doc = Document::new(
            "doc1".to_string(),
            "Test".to_string(),
            vec![0.1, 0.2], // Only 2 dimensions
        );

        let result = store.insert(doc).await;
        assert!(result.is_err());

        // Search with wrong dimension should fail
        let query = vec![1.0, 0.0]; // Only 2 dimensions
        let result = store.search(&query, 1, None).await;
        assert!(result.is_err());
    }
}
