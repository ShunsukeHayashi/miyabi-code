//! LINE Messaging API Client
//!
//! Provides integration with LINE Messaging API for bot functionality.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use thiserror::Error;

/// LINE API error
#[derive(Error, Debug)]
pub enum LineError {
    #[error("HTTP request failed: {0}")]
    Request(#[from] reqwest::Error),

    #[error("LINE API error: {message}")]
    ApiError { message: String },

    #[error("Invalid signature")]
    InvalidSignature,

    #[error("Missing channel access token")]
    MissingAccessToken,
}

pub type Result<T> = std::result::Result<T, LineError>;

/// LINE Messaging API Client
#[derive(Clone)]
pub struct LineClient {
    channel_access_token: String,
    http_client: Client,
    api_base_url: String,
}

impl LineClient {
    /// Create a new LINE client
    pub fn new(channel_access_token: String) -> Self {
        Self {
            channel_access_token,
            http_client: Client::new(),
            api_base_url: "https://api.line.me/v2/bot".to_string(),
        }
    }

    /// Reply to a message
    pub async fn reply_message(
        &self,
        reply_token: &str,
        messages: Vec<LineMessage>,
    ) -> Result<()> {
        let url = format!("{}/message/reply", self.api_base_url);

        let payload = ReplyMessageRequest {
            reply_token: reply_token.to_string(),
            messages,
        };

        let response = self
            .http_client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.channel_access_token))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LineError::ApiError {
                message: error_text,
            });
        }

        Ok(())
    }

    /// Push message to a user
    pub async fn push_message(
        &self,
        to: &str,
        messages: Vec<LineMessage>,
    ) -> Result<()> {
        let url = format!("{}/message/push", self.api_base_url);

        let payload = PushMessageRequest {
            to: to.to_string(),
            messages,
        };

        let response = self
            .http_client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.channel_access_token))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LineError::ApiError {
                message: error_text,
            });
        }

        Ok(())
    }

    /// Get user profile
    pub async fn get_profile(&self, user_id: &str) -> Result<UserProfile> {
        let url = format!("{}/profile/{}", self.api_base_url, user_id);

        let response = self
            .http_client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.channel_access_token))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(LineError::ApiError {
                message: error_text,
            });
        }

        let profile = response.json::<UserProfile>().await?;
        Ok(profile)
    }
}

/// Reply message request payload
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ReplyMessageRequest {
    reply_token: String,
    messages: Vec<LineMessage>,
}

/// Push message request payload
#[derive(Debug, Clone, Serialize, Deserialize)]
struct PushMessageRequest {
    to: String,
    messages: Vec<LineMessage>,
}

/// LINE message
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LineMessage {
    #[serde(rename = "text")]
    Text { text: String },

    #[serde(rename = "flex")]
    Flex {
        #[serde(rename = "altText")]
        alt_text: String,
        contents: serde_json::Value,
    },
}

impl LineMessage {
    /// Create a text message
    pub fn text(text: impl Into<String>) -> Self {
        Self::Text { text: text.into() }
    }

    /// Create a flex message (Bubble or Carousel)
    pub fn flex(alt_text: impl Into<String>, contents: serde_json::Value) -> Self {
        Self::Flex {
            alt_text: alt_text.into(),
            contents,
        }
    }
}

/// User profile
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub user_id: String,
    pub display_name: String,
    pub picture_url: Option<String>,
    pub status_message: Option<String>,
}

/// Verify LINE signature
pub fn verify_signature(
    channel_secret: &str,
    body: &[u8],
    signature: &str,
) -> bool {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;

    type HmacSha256 = Hmac<Sha256>;

    let mut mac = match HmacSha256::new_from_slice(channel_secret.as_bytes()) {
        Ok(mac) => mac,
        Err(_) => return false,
    };

    mac.update(body);

    let result = mac.finalize();
    let expected = result.into_bytes();

    // Decode the signature from base64
    let decoded_signature = match base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD,
        signature,
    ) {
        Ok(sig) => sig,
        Err(_) => return false,
    };

    // Constant-time comparison
    use std::cmp::min;
    let mut matches = true;
    let len = min(expected.len(), decoded_signature.len());

    for i in 0..len {
        if expected[i] != decoded_signature[i] {
            matches = false;
        }
    }

    // Check length equality
    if expected.len() != decoded_signature.len() {
        matches = false;
    }

    matches
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_line_message_text() {
        let msg = LineMessage::text("Hello");
        match msg {
            LineMessage::Text { text } => assert_eq!(text, "Hello"),
            _ => panic!("Expected text message"),
        }
    }

    #[test]
    fn test_verify_signature() {
        let channel_secret = "test_secret";
        let body = b"test body";

        // Generate valid signature
        use hmac::{Hmac, Mac};
        use sha2::Sha256;
        type HmacSha256 = Hmac<Sha256>;

        let mut mac = HmacSha256::new_from_slice(channel_secret.as_bytes()).unwrap();
        mac.update(body);
        let result = mac.finalize();
        let signature = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, result.into_bytes());

        assert!(verify_signature(channel_secret, body, &signature));
        assert!(!verify_signature(channel_secret, body, "invalid_signature"));
    }
}
