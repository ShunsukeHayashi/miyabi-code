//! AWS SES SMTP Provider Implementation
//!
//! Uses AWS SDK for SES (Simple Email Service).

use super::types::*;
use super::SmtpClient;
use async_trait::async_trait;
use aws_config::BehaviorVersion;
use aws_sdk_ses::{Client as SesClient, types::{Body, Content, Destination, Message}};

pub struct AwsSesClient {
    client: Option<SesClient>,
    region: String,
}

impl AwsSesClient {
    pub fn new(region: String) -> Self {
        Self {
            client: None,
            region,
        }
    }

    async fn get_client(&mut self) -> SmtpResult<&SesClient> {
        if self.client.is_none() {
            let config = aws_config::defaults(BehaviorVersion::latest())
                .region(aws_config::Region::new(self.region.clone()))
                .load()
                .await;
            self.client = Some(SesClient::new(&config));
        }

        Ok(self.client.as_ref().unwrap())
    }
}

#[async_trait]
impl SmtpClient for AwsSesClient {
    async fn send_email(&self, message: &EmailMessage) -> SmtpResult<String> {
        let mut client_mut = Self {
            client: self.client.clone(),
            region: self.region.clone(),
        };
        let client = client_mut.get_client().await?;

        // Build destination
        let mut destination = Destination::builder();
        for addr in &message.to {
            destination = destination.to_addresses(&addr.email);
        }
        if let Some(cc) = &message.cc {
            for addr in cc {
                destination = destination.cc_addresses(&addr.email);
            }
        }
        if let Some(bcc) = &message.bcc {
            for addr in bcc {
                destination = destination.bcc_addresses(&addr.email);
            }
        }

        // Build message body
        let mut body_builder = Body::builder();
        if let Some(text) = &message.text_body {
            body_builder = body_builder.text(
                Content::builder()
                    .data(text)
                    .charset("UTF-8")
                    .build()
                    .map_err(|e| SmtpError::ApiError(format!("Failed to build text content: {}", e)))?,
            );
        }
        if let Some(html) = &message.html_body {
            body_builder = body_builder.html(
                Content::builder()
                    .data(html)
                    .charset("UTF-8")
                    .build()
                    .map_err(|e| SmtpError::ApiError(format!("Failed to build HTML content: {}", e)))?,
            );
        }

        // Build message
        let aws_message = Message::builder()
            .subject(
                Content::builder()
                    .data(&message.subject)
                    .charset("UTF-8")
                    .build()
                    .map_err(|e| SmtpError::ApiError(format!("Failed to build subject: {}", e)))?,
            )
            .body(body_builder.build())
            .build();

        // Send email
        let result = client
            .send_email()
            .source(&message.from.email)
            .destination(destination.build())
            .message(aws_message)
            .send()
            .await
            .map_err(|e| SmtpError::ApiError(format!("AWS SES send failed: {}", e)))?;

        let message_id = result.message_id().to_string();
        tracing::info!("Email sent via AWS SES: message_id={}", message_id);
        Ok(message_id)
    }

    async fn verify_connection(&self) -> SmtpResult<bool> {
        let mut client_mut = Self {
            client: self.client.clone(),
            region: self.region.clone(),
        };
        let client = client_mut.get_client().await?;

        // Verify by checking account sending quota
        let result = client
            .get_send_quota()
            .send()
            .await;

        Ok(result.is_ok())
    }

    fn provider_name(&self) -> &str {
        "AWS SES"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aws_ses_client_new() {
        let client = AwsSesClient::new("us-east-1".to_string());
        assert_eq!(client.region, "us-east-1");
        assert!(client.client.is_none());
    }
}
