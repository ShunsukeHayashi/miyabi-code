//! LINE Messaging API Client

use crate::types::*;
use anyhow::{Context, Result};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};

/// LINE Messaging API Client
pub struct LineClient {
    channel_access_token: String,
    http_client: reqwest::Client,
    base_url: String,
}

impl LineClient {
    /// Create a new LINE client
    pub fn new(channel_access_token: String) -> Self {
        Self {
            channel_access_token,
            http_client: reqwest::Client::new(),
            base_url: "https://api.line.me/v2/bot".to_string(),
        }
    }

    /// Create from environment variable
    pub fn from_env() -> Result<Self> {
        let channel_access_token = std::env::var("LINE_CHANNEL_ACCESS_TOKEN")
            .context("LINE_CHANNEL_ACCESS_TOKEN not set")?;
        Ok(Self::new(channel_access_token))
    }

    /// Build authorization headers
    fn build_headers(&self) -> Result<HeaderMap> {
        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", self.channel_access_token))?,
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        Ok(headers)
    }

    /// Reply to a message
    pub async fn reply_message(
        &self,
        reply_token: &str,
        messages: Vec<ReplyMessage>,
    ) -> Result<()> {
        let url = format!("{}/message/reply", self.base_url);
        let request = ReplyRequest {
            reply_token: reply_token.to_string(),
            messages,
        };

        let response = self
            .http_client
            .post(&url)
            .headers(self.build_headers()?)
            .json(&request)
            .send()
            .await
            .context("Failed to send reply message")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("LINE API error ({}): {}", status, error_text);
        }

        Ok(())
    }

    /// Push a message to a user
    pub async fn push_message(&self, to: &str, messages: Vec<ReplyMessage>) -> Result<()> {
        let url = format!("{}/message/push", self.base_url);
        let request = PushRequest {
            to: to.to_string(),
            messages,
        };

        let response = self
            .http_client
            .post(&url)
            .headers(self.build_headers()?)
            .json(&request)
            .send()
            .await
            .context("Failed to send push message")?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("LINE API error ({}): {}", status, error_text);
        }

        Ok(())
    }

    /// Send a simple text message
    pub async fn reply_text(&self, reply_token: &str, text: &str) -> Result<()> {
        self.reply_message(
            reply_token,
            vec![ReplyMessage::Text {
                text: text.to_string(),
            }],
        )
        .await
    }

    /// Push a simple text message
    pub async fn push_text(&self, to: &str, text: &str) -> Result<()> {
        self.push_message(
            to,
            vec![ReplyMessage::Text {
                text: text.to_string(),
            }],
        )
        .await
    }

    /// Send a Flex Message
    pub async fn reply_flex(
        &self,
        reply_token: &str,
        alt_text: &str,
        contents: FlexContainer,
    ) -> Result<()> {
        self.reply_message(
            reply_token,
            vec![ReplyMessage::Flex {
                alt_text: alt_text.to_string(),
                contents,
            }],
        )
        .await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_line_client_creation() {
        let client = LineClient::new("test_token".to_string());
        assert_eq!(client.channel_access_token, "test_token");
    }

    #[test]
    fn test_build_headers() {
        let client = LineClient::new("test_token".to_string());
        let headers = client.build_headers().unwrap();
        assert!(headers.contains_key(AUTHORIZATION));
        assert!(headers.contains_key(CONTENT_TYPE));
    }
}
