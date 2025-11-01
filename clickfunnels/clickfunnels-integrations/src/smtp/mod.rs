//! SMTP Integration Module
//!
//! Provides email sending capabilities through multiple providers:
//! - SendGrid (API-based)
//! - Mailgun (API-based)
//! - AWS SES (SDK-based)

pub mod sendgrid;
pub mod mailgun;
pub mod aws_ses;
pub mod types;

pub use types::{EmailMessage, EmailAddress, EmailAttachment, SmtpProvider, SmtpConfig, SmtpResult};

use async_trait::async_trait;

/// SMTP Provider trait
///
/// Implement this trait to add support for additional email providers.
#[async_trait]
pub trait SmtpClient: Send + Sync {
    /// Send an email message
    async fn send_email(&self, message: &EmailMessage) -> SmtpResult<String>;

    /// Verify the connection and credentials
    async fn verify_connection(&self) -> SmtpResult<bool>;

    /// Get provider name
    fn provider_name(&self) -> &str;
}

/// Create an SMTP client based on the provider type
pub fn create_smtp_client(config: SmtpConfig) -> SmtpResult<Box<dyn SmtpClient>> {
    match config.provider {
        SmtpProvider::SendGrid => {
            let client = sendgrid::SendGridClient::new(config.api_key)?;
            Ok(Box::new(client))
        }
        SmtpProvider::Mailgun => {
            let client = mailgun::MailgunClient::new(
                config.api_key,
                config.domain.ok_or_else(|| {
                    SmtpError::ConfigError("Mailgun requires domain".to_string())
                })?,
            )?;
            Ok(Box::new(client))
        }
        SmtpProvider::AwsSes => {
            let client = aws_ses::AwsSesClient::new(
                config.aws_region.ok_or_else(|| {
                    SmtpError::ConfigError("AWS SES requires region".to_string())
                })?,
            );
            Ok(Box::new(client))
        }
    }
}

pub use types::SmtpError;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_sendgrid_client() {
        let config = SmtpConfig {
            provider: SmtpProvider::SendGrid,
            api_key: "test_key".to_string(),
            domain: None,
            aws_region: None,
        };

        let result = create_smtp_client(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_create_mailgun_client_missing_domain() {
        let config = SmtpConfig {
            provider: SmtpProvider::Mailgun,
            api_key: "test_key".to_string(),
            domain: None,
            aws_region: None,
        };

        let result = create_smtp_client(config);
        assert!(result.is_err());
    }
}
