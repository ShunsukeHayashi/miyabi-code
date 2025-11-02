//! SendGrid SMTP Provider Implementation
//!
//! Uses SendGrid's Web API v3 for sending emails.

use super::types::*;
use super::SmtpClient;
use async_trait::async_trait;
use base64::{engine::general_purpose, Engine as _};
use reqwest::Client;
use serde_json::json;

const SENDGRID_API_URL: &str = "https://api.sendgrid.com/v3/mail/send";

pub struct SendGridClient {
    api_key: String,
    client: Client,
}

impl SendGridClient {
    pub fn new(api_key: String) -> SmtpResult<Self> {
        if api_key.is_empty() {
            return Err(SmtpError::ConfigError(
                "API key cannot be empty".to_string(),
            ));
        }

        Ok(Self {
            api_key,
            client: Client::new(),
        })
    }

    fn build_sendgrid_payload(&self, message: &EmailMessage) -> serde_json::Value {
        let mut personalizations = vec![json!({
            "to": message.to.iter().map(|addr| {
                if let Some(name) = &addr.name {
                    json!({"email": addr.email, "name": name})
                } else {
                    json!({"email": addr.email})
                }
            }).collect::<Vec<_>>(),
        })];

        if let Some(cc) = &message.cc {
            personalizations[0]["cc"] = json!(cc
                .iter()
                .map(|addr| {
                    if let Some(name) = &addr.name {
                        json!({"email": addr.email, "name": name})
                    } else {
                        json!({"email": addr.email})
                    }
                })
                .collect::<Vec<_>>());
        }

        if let Some(bcc) = &message.bcc {
            personalizations[0]["bcc"] = json!(bcc
                .iter()
                .map(|addr| {
                    if let Some(name) = &addr.name {
                        json!({"email": addr.email, "name": name})
                    } else {
                        json!({"email": addr.email})
                    }
                })
                .collect::<Vec<_>>());
        }

        let from = if let Some(name) = &message.from.name {
            json!({"email": message.from.email, "name": name})
        } else {
            json!({"email": message.from.email})
        };

        let mut content = vec![];
        if let Some(text) = &message.text_body {
            content.push(json!({"type": "text/plain", "value": text}));
        }
        if let Some(html) = &message.html_body {
            content.push(json!({"type": "text/html", "value": html}));
        }

        let mut payload = json!({
            "personalizations": personalizations,
            "from": from,
            "subject": message.subject,
            "content": content,
        });

        if let Some(reply_to) = &message.reply_to {
            payload["reply_to"] = if let Some(name) = &reply_to.name {
                json!({"email": reply_to.email, "name": name})
            } else {
                json!({"email": reply_to.email})
            };
        }

        if let Some(attachments) = &message.attachments {
            payload["attachments"] = json!(attachments
                .iter()
                .map(|att| {
                    json!({
                        "content": general_purpose::STANDARD.encode(&att.content),
                        "filename": att.filename,
                        "type": att.content_type,
                    })
                })
                .collect::<Vec<_>>());
        }

        payload
    }
}

#[async_trait]
impl SmtpClient for SendGridClient {
    async fn send_email(&self, message: &EmailMessage) -> SmtpResult<String> {
        let payload = self.build_sendgrid_payload(message);

        let response = self
            .client
            .post(SENDGRID_API_URL)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await?;

        if response.status().is_success() {
            // SendGrid returns 202 Accepted with X-Message-Id header
            let message_id = response
                .headers()
                .get("X-Message-Id")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("unknown")
                .to_string();

            tracing::info!("Email sent via SendGrid: message_id={}", message_id);
            Ok(message_id)
        } else {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            if status.as_u16() == 429 {
                Err(SmtpError::RateLimitExceeded)
            } else if status.as_u16() == 401 || status.as_u16() == 403 {
                Err(SmtpError::AuthError(format!(
                    "SendGrid auth failed: {}",
                    error_text
                )))
            } else {
                Err(SmtpError::ApiError(format!(
                    "SendGrid API error ({}): {}",
                    status, error_text
                )))
            }
        }
    }

    async fn verify_connection(&self) -> SmtpResult<bool> {
        // SendGrid doesn't have a dedicated health check endpoint
        // We can verify by attempting to retrieve API key scopes
        let response = self
            .client
            .get("https://api.sendgrid.com/v3/scopes")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }

    fn provider_name(&self) -> &str {
        "SendGrid"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sendgrid_client_new() {
        let client = SendGridClient::new("test_api_key".to_string());
        assert!(client.is_ok());
    }

    #[test]
    fn test_sendgrid_client_empty_key() {
        let client = SendGridClient::new("".to_string());
        assert!(client.is_err());
    }

    #[test]
    fn test_build_sendgrid_payload() {
        let client = SendGridClient::new("test_key".to_string()).unwrap();
        let message = EmailMessage::simple(
            EmailAddress::new("from@example.com".to_string()),
            EmailAddress::new("to@example.com".to_string()),
            "Test Subject".to_string(),
            "Test Body".to_string(),
        );

        let payload = client.build_sendgrid_payload(&message);

        assert_eq!(payload["subject"], "Test Subject");
        assert_eq!(payload["from"]["email"], "from@example.com");
        assert!(payload["content"].is_array());
    }
}
