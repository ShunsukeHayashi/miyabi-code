//! テキスト埋め込み生成

use crate::config::KnowledgeConfig;
use crate::error::{KnowledgeError, Result};
use tracing::{debug, info};

/// 埋め込み生成トレイト
#[async_trait::async_trait]
pub trait EmbeddingGenerator: Send + Sync {
    /// テキストから埋め込みベクトルを生成
    async fn generate(&self, text: &str) -> Result<Vec<f32>>;

    /// バッチ生成
    async fn generate_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>>;

    /// 次元数を取得
    fn dimension(&self) -> usize;
}

/// Ollama埋め込み生成実装
pub struct OllamaEmbedding {
    config: KnowledgeConfig,
    client: reqwest::Client,
}

impl OllamaEmbedding {
    /// 新しいOllamaEmbeddingを作成
    pub fn new(config: KnowledgeConfig) -> Result<Self> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .map_err(|e| KnowledgeError::Embedding(format!("Failed to create client: {}", e)))?;

        info!("Initializing Ollama embedding with model: {}", config.embeddings.model);

        Ok(Self { config, client })
    }

    /// Ollamaエンドポイント取得
    fn endpoint(&self) -> String {
        self.config
            .embeddings
            .endpoint
            .clone()
            .unwrap_or_else(|| "http://localhost:11434".to_string())
    }
}

#[async_trait::async_trait]
impl EmbeddingGenerator for OllamaEmbedding {
    async fn generate(&self, text: &str) -> Result<Vec<f32>> {
        debug!("Generating embedding for text: {} chars", text.len());

        let endpoint = format!("{}/api/embeddings", self.endpoint());

        let response = self
            .client
            .post(&endpoint)
            .json(&serde_json::json!({
                "model": self.config.embeddings.model,
                "prompt": text,
            }))
            .send()
            .await
            .map_err(|e| KnowledgeError::Embedding(format!("Request failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(KnowledgeError::Embedding(format!(
                "Ollama API error ({}): {}",
                status, error_text
            )));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| KnowledgeError::Embedding(format!("Failed to parse response: {}", e)))?;

        let embedding = result["embedding"]
            .as_array()
            .ok_or_else(|| KnowledgeError::Embedding("No embedding in response".to_string()))?
            .iter()
            .map(|v| v.as_f64().unwrap_or(0.0) as f32)
            .collect::<Vec<f32>>();

        if embedding.len() != self.config.embeddings.dimension {
            return Err(KnowledgeError::Embedding(format!(
                "Unexpected embedding dimension: expected {}, got {}",
                self.config.embeddings.dimension,
                embedding.len()
            )));
        }

        debug!("Generated embedding: {} dimensions", embedding.len());
        Ok(embedding)
    }

    async fn generate_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>> {
        info!("Generating embeddings for {} texts", texts.len());

        let mut embeddings = Vec::new();
        for text in texts {
            let embedding = self.generate(text).await?;
            embeddings.push(embedding);
        }

        info!("Generated {} embeddings", embeddings.len());
        Ok(embeddings)
    }

    fn dimension(&self) -> usize {
        self.config.embeddings.dimension
    }
}

/// OpenAI埋め込み生成実装
pub struct OpenAIEmbedding {
    config: KnowledgeConfig,
    client: reqwest::Client,
}

impl OpenAIEmbedding {
    /// 新しいOpenAIEmbeddingを作成
    pub fn new(config: KnowledgeConfig) -> Result<Self> {
        let api_key = config
            .embeddings
            .api_key
            .as_ref()
            .ok_or_else(|| KnowledgeError::Config("OpenAI API key not set".to_string()))?;

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .default_headers({
                let mut headers = reqwest::header::HeaderMap::new();
                headers.insert(
                    reqwest::header::AUTHORIZATION,
                    reqwest::header::HeaderValue::from_str(&format!("Bearer {}", api_key)).unwrap(),
                );
                headers
            })
            .build()
            .map_err(|e| KnowledgeError::Embedding(format!("Failed to create client: {}", e)))?;

        info!("Initializing OpenAI embedding with model: {}", config.embeddings.model);

        Ok(Self { config, client })
    }
}

#[async_trait::async_trait]
impl EmbeddingGenerator for OpenAIEmbedding {
    async fn generate(&self, text: &str) -> Result<Vec<f32>> {
        debug!("Generating OpenAI embedding for text: {} chars", text.len());

        let response = self
            .client
            .post("https://api.openai.com/v1/embeddings")
            .json(&serde_json::json!({
                "model": self.config.embeddings.model,
                "input": text,
            }))
            .send()
            .await
            .map_err(|e| KnowledgeError::Embedding(format!("Request failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(KnowledgeError::Embedding(format!(
                "OpenAI API error ({}): {}",
                status, error_text
            )));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| KnowledgeError::Embedding(format!("Failed to parse response: {}", e)))?;

        let embedding = result["data"][0]["embedding"]
            .as_array()
            .ok_or_else(|| KnowledgeError::Embedding("No embedding in response".to_string()))?
            .iter()
            .map(|v| v.as_f64().unwrap_or(0.0) as f32)
            .collect::<Vec<f32>>();

        debug!("Generated embedding: {} dimensions", embedding.len());
        Ok(embedding)
    }

    async fn generate_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>> {
        info!("Generating OpenAI embeddings for {} texts", texts.len());

        let response = self
            .client
            .post("https://api.openai.com/v1/embeddings")
            .json(&serde_json::json!({
                "model": self.config.embeddings.model,
                "input": texts,
            }))
            .send()
            .await
            .map_err(|e| KnowledgeError::Embedding(format!("Request failed: {}", e)))?;

        let status = response.status();
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(KnowledgeError::Embedding(format!(
                "OpenAI API error ({}): {}",
                status, error_text
            )));
        }

        let result: serde_json::Value = response
            .json()
            .await
            .map_err(|e| KnowledgeError::Embedding(format!("Failed to parse response: {}", e)))?;

        let embeddings: Vec<Vec<f32>> = result["data"]
            .as_array()
            .ok_or_else(|| KnowledgeError::Embedding("No embeddings in response".to_string()))?
            .iter()
            .map(|item| {
                item["embedding"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_f64().unwrap_or(0.0) as f32)
                    .collect::<Vec<f32>>()
            })
            .collect();

        info!("Generated {} embeddings", embeddings.len());
        Ok(embeddings)
    }

    fn dimension(&self) -> usize {
        self.config.embeddings.dimension
    }
}

/// 埋め込みジェネレータを作成
pub fn create_embedding_generator(config: KnowledgeConfig) -> Result<Box<dyn EmbeddingGenerator>> {
    match config.embeddings.provider.as_str() {
        "ollama" => Ok(Box::new(OllamaEmbedding::new(config)?)),
        "openai" => Ok(Box::new(OpenAIEmbedding::new(config)?)),
        provider => {
            Err(KnowledgeError::Config(format!("Unsupported embedding provider: {}", provider)))
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore] // Requires Ollama running
    async fn test_ollama_embedding() {
        let config = KnowledgeConfig::default();
        let generator = OllamaEmbedding::new(config).unwrap();

        let embedding = generator.generate("Test text").await.unwrap();
        assert_eq!(embedding.len(), 384);
    }

    #[test]
    fn test_create_embedding_generator() {
        let config = KnowledgeConfig::default();
        let generator = create_embedding_generator(config);
        assert!(generator.is_ok());
    }
}
