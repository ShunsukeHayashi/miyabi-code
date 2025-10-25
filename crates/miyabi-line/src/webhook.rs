//! LINE Webhook Handler

use crate::types::*;
use anyhow::{Context, Result};
use ring::hmac;

/// LINE Webhook Handler
pub struct WebhookHandler {
    channel_secret: String,
}

impl WebhookHandler {
    /// Create a new webhook handler
    pub fn new(channel_secret: String) -> Self {
        Self { channel_secret }
    }

    /// Create from environment variable
    pub fn from_env() -> Result<Self> {
        let channel_secret =
            std::env::var("LINE_CHANNEL_SECRET").context("LINE_CHANNEL_SECRET not set")?;
        Ok(Self::new(channel_secret))
    }

    /// Verify LINE signature
    pub fn verify_signature(&self, body: &[u8], signature: &str) -> Result<bool> {
        let key = hmac::Key::new(hmac::HMAC_SHA256, self.channel_secret.as_bytes());
        let tag = hmac::sign(&key, body);
        let expected = hex::encode(tag.as_ref());

        Ok(expected == signature)
    }

    /// Parse webhook request
    pub fn parse_request(&self, body: &str) -> Result<WebhookRequest> {
        serde_json::from_str(body).context("Failed to parse webhook request")
    }

    /// Handle webhook event
    pub async fn handle_event(&self, event: &Event) -> Result<Option<String>> {
        match event {
            Event::Message(msg_event) => self.handle_message_event(msg_event).await,
            Event::Postback(pb_event) => self.handle_postback_event(pb_event).await,
            Event::Follow(follow_event) => self.handle_follow_event(follow_event).await,
            Event::Unfollow(unfollow_event) => self.handle_unfollow_event(unfollow_event).await,
        }
    }

    /// Handle message event
    async fn handle_message_event(&self, event: &MessageEvent) -> Result<Option<String>> {
        match &event.message {
            Message::Text { text, .. } => {
                tracing::info!("Received text message: {}", text);
                // Return the text for processing
                Ok(Some(text.clone()))
            }
            Message::Image { .. } => {
                tracing::info!("Received image message");
                Ok(None)
            }
            Message::Sticker { .. } => {
                tracing::info!("Received sticker message");
                Ok(None)
            }
        }
    }

    /// Handle postback event
    async fn handle_postback_event(&self, event: &PostbackEvent) -> Result<Option<String>> {
        tracing::info!("Received postback: {}", event.postback.data);
        Ok(Some(event.postback.data.clone()))
    }

    /// Handle follow event (user added bot as friend)
    async fn handle_follow_event(&self, event: &FollowEvent) -> Result<Option<String>> {
        tracing::info!("User {} followed the bot", event.source.user_id);
        Ok(Some("follow".to_string()))
    }

    /// Handle unfollow event (user blocked the bot)
    async fn handle_unfollow_event(&self, event: &UnfollowEvent) -> Result<Option<String>> {
        tracing::info!("User {} unfollowed the bot", event.source.user_id);
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_webhook_handler_creation() {
        let handler = WebhookHandler::new("test_secret".to_string());
        assert_eq!(handler.channel_secret, "test_secret");
    }

    #[test]
    fn test_parse_request() {
        let handler = WebhookHandler::new("test_secret".to_string());
        let json = r#"{
            "destination": "Uxxxxx",
            "events": []
        }"#;
        let request = handler.parse_request(json).unwrap();
        assert_eq!(request.destination, "Uxxxxx");
        assert_eq!(request.events.len(), 0);
    }
}
