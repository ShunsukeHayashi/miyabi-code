//! SMTP Types and Configuration

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// SMTP Provider types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SmtpProvider {
    SendGrid,
    Mailgun,
    AwsSes,
}

/// SMTP Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmtpConfig {
    pub provider: SmtpProvider,
    pub api_key: String,
    pub domain: Option<String>,      // Required for Mailgun
    pub aws_region: Option<String>,  // Required for AWS SES
}

/// Email address with optional name
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAddress {
    pub email: String,
    pub name: Option<String>,
}

impl EmailAddress {
    pub fn new(email: String) -> Self {
        Self { email, name: None }
    }

    pub fn with_name(email: String, name: String) -> Self {
        Self {
            email,
            name: Some(name),
        }
    }
}

/// Email attachment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAttachment {
    pub filename: String,
    pub content: Vec<u8>,
    pub content_type: String,
}

/// Email message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailMessage {
    pub from: EmailAddress,
    pub to: Vec<EmailAddress>,
    pub cc: Option<Vec<EmailAddress>>,
    pub bcc: Option<Vec<EmailAddress>>,
    pub subject: String,
    pub text_body: Option<String>,
    pub html_body: Option<String>,
    pub attachments: Option<Vec<EmailAttachment>>,
    pub reply_to: Option<EmailAddress>,
    pub headers: Option<std::collections::HashMap<String, String>>,
}

impl EmailMessage {
    /// Create a simple text email
    pub fn simple(from: EmailAddress, to: EmailAddress, subject: String, body: String) -> Self {
        Self {
            from,
            to: vec![to],
            cc: None,
            bcc: None,
            subject,
            text_body: Some(body),
            html_body: None,
            attachments: None,
            reply_to: None,
            headers: None,
        }
    }

    /// Create an HTML email
    pub fn html(
        from: EmailAddress,
        to: EmailAddress,
        subject: String,
        html_body: String,
        text_body: Option<String>,
    ) -> Self {
        Self {
            from,
            to: vec![to],
            cc: None,
            bcc: None,
            subject,
            text_body,
            html_body: Some(html_body),
            attachments: None,
            reply_to: None,
            headers: None,
        }
    }
}

/// SMTP Error types
#[derive(Error, Debug)]
pub enum SmtpError {
    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Authentication error: {0}")]
    AuthError(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Invalid email address: {0}")]
    InvalidEmail(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type SmtpResult<T> = Result<T, SmtpError>;

impl From<reqwest::Error> for SmtpError {
    fn from(err: reqwest::Error) -> Self {
        SmtpError::NetworkError(err.to_string())
    }
}

impl From<serde_json::Error> for SmtpError {
    fn from(err: serde_json::Error) -> Self {
        SmtpError::ApiError(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_address_new() {
        let addr = EmailAddress::new("test@example.com".to_string());
        assert_eq!(addr.email, "test@example.com");
        assert!(addr.name.is_none());
    }

    #[test]
    fn test_email_address_with_name() {
        let addr = EmailAddress::with_name("test@example.com".to_string(), "Test User".to_string());
        assert_eq!(addr.email, "test@example.com");
        assert_eq!(addr.name, Some("Test User".to_string()));
    }

    #[test]
    fn test_simple_email_message() {
        let from = EmailAddress::new("sender@example.com".to_string());
        let to = EmailAddress::new("recipient@example.com".to_string());
        let msg = EmailMessage::simple(
            from,
            to,
            "Test Subject".to_string(),
            "Test Body".to_string(),
        );

        assert_eq!(msg.subject, "Test Subject");
        assert_eq!(msg.text_body, Some("Test Body".to_string()));
        assert!(msg.html_body.is_none());
        assert_eq!(msg.to.len(), 1);
    }

    #[test]
    fn test_html_email_message() {
        let from = EmailAddress::new("sender@example.com".to_string());
        let to = EmailAddress::new("recipient@example.com".to_string());
        let msg = EmailMessage::html(
            from,
            to,
            "Test Subject".to_string(),
            "<h1>Test HTML</h1>".to_string(),
            Some("Test Text".to_string()),
        );

        assert_eq!(msg.subject, "Test Subject");
        assert_eq!(msg.html_body, Some("<h1>Test HTML</h1>".to_string()));
        assert_eq!(msg.text_body, Some("Test Text".to_string()));
    }
}
