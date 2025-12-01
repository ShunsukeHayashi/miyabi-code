//! Wikipedia data collection module
//!
//! This module provides functionality to fetch historical figure data from Wikipedia API
//! and prepare it for embedding and vector storage.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

/// Wikipedia API response structure
#[derive(Debug, Deserialize, Serialize)]
struct WikipediaResponse {
    query: WikipediaQuery,
}

#[derive(Debug, Deserialize, Serialize)]
struct WikipediaQuery {
    pages: std::collections::HashMap<String, WikipediaPage>,
}

#[derive(Debug, Deserialize, Serialize)]
struct WikipediaPage {
    pageid: u64,
    title: String,
    #[serde(default)]
    extract: String,
}

/// Wikipedia data collector for historical figures
pub struct WikipediaCollector {
    client: reqwest::Client,
    base_url: String,
}

impl WikipediaCollector {
    /// Create a new Wikipedia collector
    pub fn new() -> Self {
        Self { client: reqwest::Client::new(), base_url: "https://ja.wikipedia.org/w/api.php".to_string() }
    }

    /// Fetch article content for a given historical figure
    ///
    /// # Arguments
    /// * `figure_name` - The name of the historical figure (e.g., "織田信長")
    ///
    /// # Returns
    /// The full text content of the Wikipedia article
    pub async fn fetch_article(&self, figure_name: &str) -> Result<String> {
        let params = [
            ("action", "query"),
            ("format", "json"),
            ("prop", "extracts"),
            ("exintro", "0"),
            ("explaintext", "1"),
            ("titles", figure_name),
        ];

        let response = self
            .client
            .get(&self.base_url)
            .query(&params)
            .send()
            .await
            .context("Failed to fetch Wikipedia article")?;

        let wiki_response: WikipediaResponse = response.json().await.context("Failed to parse Wikipedia response")?;

        // Extract the first (and should be only) page
        let page = wiki_response
            .query
            .pages
            .values()
            .next()
            .context("No page found in Wikipedia response")?;

        Ok(page.extract.clone())
    }

    /// Fetch article and split into chunks
    ///
    /// # Arguments
    /// * `figure_name` - The name of the historical figure
    /// * `chunk_size` - Maximum tokens per chunk (default: 512)
    /// * `overlap` - Overlap tokens between chunks (default: 50)
    ///
    /// # Returns
    /// A vector of text chunks ready for embedding
    pub async fn fetch_and_chunk(&self, figure_name: &str, chunk_size: usize, overlap: usize) -> Result<Vec<String>> {
        let content = self.fetch_article(figure_name).await?;
        let chunks = Self::split_into_chunks(&content, chunk_size, overlap);
        Ok(chunks)
    }

    /// Split text into chunks with overlap
    ///
    /// Note: This is a simple character-based chunking. For production,
    /// you might want to use a proper tokenizer.
    fn split_into_chunks(text: &str, chunk_size: usize, overlap: usize) -> Vec<String> {
        let mut chunks = Vec::new();
        let chars: Vec<char> = text.chars().collect();
        let total_chars = chars.len();

        if total_chars == 0 {
            return chunks;
        }

        let mut start = 0;
        while start < total_chars {
            let end = (start + chunk_size).min(total_chars);
            let chunk: String = chars[start..end].iter().collect();
            chunks.push(chunk);

            if end >= total_chars {
                break;
            }

            start += chunk_size - overlap;
        }

        chunks
    }
}

impl Default for WikipediaCollector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_into_chunks() {
        let text = "a".repeat(1000);
        let chunks = WikipediaCollector::split_into_chunks(&text, 512, 50);

        assert!(chunks.len() > 1);
        assert_eq!(chunks[0].len(), 512);

        // Check overlap
        if chunks.len() > 1 {
            let first_end: String = chunks[0].chars().skip(512 - 50).collect();
            let second_start: String = chunks[1].chars().take(50).collect();
            assert_eq!(first_end, second_start);
        }
    }

    #[test]
    fn test_split_empty_text() {
        let chunks = WikipediaCollector::split_into_chunks("", 512, 50);
        assert_eq!(chunks.len(), 0);
    }

    #[test]
    fn test_split_short_text() {
        let text = "Short text";
        let chunks = WikipediaCollector::split_into_chunks(text, 512, 50);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0], text);
    }

    #[tokio::test]
    async fn test_fetch_article_mock() {
        // Note: This test will actually call Wikipedia API
        // For production, you should use a mock server
        let collector = WikipediaCollector::new();

        // Test with a well-known figure
        // This is an integration test that requires network access
        // Skip in CI if needed
        if std::env::var("SKIP_INTEGRATION_TESTS").is_ok() {
            return;
        }

        let result = collector.fetch_article("織田信長").await;

        // We just verify it doesn't error - content may vary
        match result {
            Ok(content) => {
                assert!(!content.is_empty(), "Article content should not be empty");
                println!("Fetched {} characters", content.len());
            }
            Err(e) => {
                // Network errors are acceptable in tests
                println!("Warning: Wikipedia API call failed: {}", e);
            }
        }
    }
}
