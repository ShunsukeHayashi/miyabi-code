//! Mailgun SMTP Provider Implementation
//!
//! Uses Mailgun's HTTP API for sending emails.

use super::types::*;
use super::SmtpClient;
use async_trait::async_trait;
use reqwest::Client;
use std::collections::HashMap;

pub struct MailgunClient {
    api_key: String,
    domain: String,
    client: Client,
}

impl MailgunClient {
    pub fn new(api_key: String, domain: String) -> SmtpResult<Self> {
        if api_key.is_empty() {
            return Err(SmtpError::ConfigError("API key cannot be empty".to_string()));
        }
        if domain.is_empty() {
            return Err(SmtpError::ConfigError("Domain cannot be empty".to_string()));
        }

        Ok(Self {
            api_key,
            domain,
            client: Client::new(),
        })
    }

    fn get_api_url(&self) -> String {
        format!("https://api.mailgun.net/v3/{}/messages", self.domain)
    }
}

#[async_trait]
impl SmtpClient for MailgunClient {
    async fn send_email(&self, message: &EmailMessage) -> SmtpResult<String> {
        let mut form_data = HashMap::new();

        // From
        let from_str = if let Some(name) = &message.from.name {
            format!("{} <{}>", name, message.from.email)
        } else {
            message.from.email.clone()
        };
        form_data.insert("from", from_str);

        // To
        let to_str = message
            .to
            .iter()
            .map(|addr| {
                if let Some(name) = &addr.name {
                    format!("{} <{}>", name, addr.email)
                } else {
                    addr.email.clone()
                }
            })
            .collect::<Vec<_>>()
            .join(",");
        form_data.insert("to", to_str);

        // CC
        if let Some(cc) = &message.cc {
            let cc_str = cc
                .iter()
                .map(|addr| {
                    if let Some(name) = &addr.name {
                        format!("{} <{}>", name, addr.email)
                    } else {
                        addr.email.clone()
                    }
                })
                .collect::<Vec<_>>()
                .join(",");
            form_data.insert("cc", cc_str);
        }

        // BCC
        if let Some(bcc) = &message.bcc {
            let bcc_str = bcc
                .iter()
                .map(|addr| {
                    if let Some(name) = &addr.name {
                        format!("{} <{}>", name, addr.email)
                    } else {
                        addr.email.clone()
                    }
                })
                .collect::<Vec<_>>()
                .join(",");
            form_data.insert("bcc", bcc_str);
        }

        // Subject
        form_data.insert("subject", message.subject.clone());

        // Body
        if let Some(text) = &message.text_body {
            form_data.insert("text", text.clone());
        }
        if let Some(html) = &message.html_body {
            form_data.insert("html", html.clone());
        }

        // Reply-To
        if let Some(reply_to) = &message.reply_to {
            let reply_str = if let Some(name) = &reply_to.name {
                format!("{} <{}>", name, reply_to.email)
            } else {
                reply_to.email.clone()
            };
            form_data.insert("h:Reply-To", reply_str);
        }

        // Send request
        let response = self
            .client
            .post(self.get_api_url())
            .basic_auth("api", Some(&self.api_key))
            .form(&form_data)
            .send()
            .await?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await?;
            let message_id = json["id"]
                .as_str()
                .unwrap_or("unknown")
                .to_string();

            tracing::info!("Email sent via Mailgun: message_id={}", message_id);
            Ok(message_id)
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());

            if status.as_u16() == 429 {
                Err(SmtpError::RateLimitExceeded)
            } else if status.as_u16() == 401 || status.as_u16() == 403 {
                Err(SmtpError::AuthError(format!("Mailgun auth failed: {}", error_text)))
            } else {
                Err(SmtpError::ApiError(format!(
                    "Mailgun API error ({}): {}",
                    status, error_text
                )))
            }
        }
    }

    async fn verify_connection(&self) -> SmtpResult<bool> {
        // Verify by getting domain info
        let url = format!("https://api.mailgun.net/v3/domains/{}", self.domain);
        let response = self
            .client
            .get(&url)
            .basic_auth("api", Some(&self.api_key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }

    fn provider_name(&self) -> &str {
        "Mailgun"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mailgun_client_new() {
        let client = MailgunClient::new(
            "test_api_key".to_string(),
            "example.com".to_string(),
        );
        assert!(client.is_ok());
    }

    #[test]
    fn test_mailgun_client_empty_key() {
        let client = MailgunClient::new(
            "".to_string(),
            "example.com".to_string(),
        );
        assert!(client.is_err());
    }

    #[test]
    fn test_mailgun_client_empty_domain() {
        let client = MailgunClient::new(
            "test_key".to_string(),
            "".to_string(),
        );
        assert!(client.is_err());
    }

    #[test]
    fn test_get_api_url() {
        let client = MailgunClient::new(
            "test_key".to_string(),
            "example.com".to_string(),
        ).unwrap();

        assert_eq!(
            client.get_api_url(),
            "https://api.mailgun.net/v3/example.com/messages"
        );
    }
}
