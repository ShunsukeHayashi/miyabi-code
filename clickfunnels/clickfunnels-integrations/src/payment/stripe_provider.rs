//! Stripe Payment Provider Implementation

use super::types::*;
use super::PaymentClient;
use async_trait::async_trait;
use reqwest::Client;
// use serde_json::json; // Unused
use std::collections::HashMap;

const STRIPE_API_URL: &str = "https://api.stripe.com/v1";

pub struct StripeClient {
    api_key: String,
    client: Client,
}

impl StripeClient {
    pub fn new(api_key: String) -> PaymentResult<Self> {
        if api_key.is_empty() {
            return Err(PaymentError::ConfigError(
                "API key cannot be empty".to_string(),
            ));
        }

        Ok(Self {
            api_key,
            client: Client::new(),
        })
    }

    fn parse_stripe_status(status: &str) -> PaymentStatus {
        match status {
            "requires_payment_method" | "requires_confirmation" => PaymentStatus::Pending,
            "processing" => PaymentStatus::Processing,
            "succeeded" => PaymentStatus::Succeeded,
            "canceled" => PaymentStatus::Canceled,
            _ => PaymentStatus::Failed,
        }
    }
}

#[async_trait]
impl PaymentClient for StripeClient {
    async fn create_payment_intent(
        &self,
        amount: i64,
        currency: Currency,
        metadata: Option<HashMap<String, String>>,
    ) -> PaymentResult<PaymentIntent> {
        if amount <= 0 {
            return Err(PaymentError::InvalidAmount(
                "Amount must be positive".to_string(),
            ));
        }

        let mut form_data = vec![
            ("amount", amount.to_string()),
            ("currency", currency.as_str().to_string()),
        ];

        // Store metadata keys to avoid temporary value issues
        let mut metadata_entries = Vec::new();
        if let Some(meta) = &metadata {
            for (key, value) in meta {
                metadata_entries.push((format!("metadata[{}]", key), value.clone()));
            }
        }

        for (key, value) in &metadata_entries {
            form_data.push((key.as_str(), value.clone()));
        }

        let response = self
            .client
            .post(format!("{}/payment_intents", STRIPE_API_URL))
            .basic_auth(&self.api_key, Some(""))
            .form(&form_data)
            .send()
            .await?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await?;

            let payment_intent = PaymentIntent {
                id: json["id"].as_str().unwrap_or("").to_string(),
                amount,
                currency,
                status: Self::parse_stripe_status(json["status"].as_str().unwrap_or("failed")),
                payment_method: None,
                client_secret: json["client_secret"].as_str().map(|s| s.to_string()),
                metadata: metadata.unwrap_or_default(),
                created_at: json["created"].as_i64().unwrap_or(0),
            };

            tracing::info!("Payment intent created: id={}", payment_intent.id);
            Ok(payment_intent)
        } else {
            let status = response.status();
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            if status.as_u16() == 429 {
                Err(PaymentError::RateLimitExceeded)
            } else if status.as_u16() == 401 || status.as_u16() == 403 {
                Err(PaymentError::AuthError(format!(
                    "Stripe auth failed: {}",
                    error_text
                )))
            } else {
                Err(PaymentError::ApiError(format!(
                    "Stripe API error ({}): {}",
                    status, error_text
                )))
            }
        }
    }

    async fn capture_payment(&self, payment_id: &str) -> PaymentResult<PaymentIntent> {
        let response = self
            .client
            .post(format!(
                "{}/payment_intents/{}/capture",
                STRIPE_API_URL, payment_id
            ))
            .basic_auth(&self.api_key, Some(""))
            .send()
            .await?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await?;

            let payment_intent = PaymentIntent {
                id: json["id"].as_str().unwrap_or("").to_string(),
                amount: json["amount"].as_i64().unwrap_or(0),
                currency: Currency::USD, // Parse from response
                status: Self::parse_stripe_status(json["status"].as_str().unwrap_or("failed")),
                payment_method: None,
                client_secret: json["client_secret"].as_str().map(|s| s.to_string()),
                metadata: HashMap::new(),
                created_at: json["created"].as_i64().unwrap_or(0),
            };

            tracing::info!("Payment captured: id={}", payment_intent.id);
            Ok(payment_intent)
        } else {
            Err(PaymentError::ApiError(format!(
                "Failed to capture payment: {}",
                response.text().await.unwrap_or_default()
            )))
        }
    }

    async fn refund_payment(&self, payment_id: &str, amount: Option<i64>) -> PaymentResult<String> {
        let mut form_data = vec![("payment_intent", payment_id.to_string())];

        if let Some(amt) = amount {
            form_data.push(("amount", amt.to_string()));
        }

        let response = self
            .client
            .post(format!("{}/refunds", STRIPE_API_URL))
            .basic_auth(&self.api_key, Some(""))
            .form(&form_data)
            .send()
            .await?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await?;
            let refund_id = json["id"].as_str().unwrap_or("").to_string();

            tracing::info!(
                "Refund created: id={}, payment_id={}",
                refund_id,
                payment_id
            );
            Ok(refund_id)
        } else {
            Err(PaymentError::ApiError(format!(
                "Failed to refund payment: {}",
                response.text().await.unwrap_or_default()
            )))
        }
    }

    async fn get_payment_status(&self, payment_id: &str) -> PaymentResult<PaymentStatus> {
        let response = self
            .client
            .get(format!("{}/payment_intents/{}", STRIPE_API_URL, payment_id))
            .basic_auth(&self.api_key, Some(""))
            .send()
            .await?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await?;
            Ok(Self::parse_stripe_status(
                json["status"].as_str().unwrap_or("failed"),
            ))
        } else if response.status().as_u16() == 404 {
            Err(PaymentError::PaymentNotFound(payment_id.to_string()))
        } else {
            Err(PaymentError::ApiError(format!(
                "Failed to get payment status: {}",
                response.text().await.unwrap_or_default()
            )))
        }
    }

    fn provider_name(&self) -> &str {
        "Stripe"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stripe_client_new() {
        let client = StripeClient::new("sk_test_123".to_string());
        assert!(client.is_ok());
    }

    #[test]
    fn test_stripe_client_empty_key() {
        let client = StripeClient::new("".to_string());
        assert!(client.is_err());
    }

    #[test]
    fn test_parse_stripe_status() {
        assert_eq!(
            StripeClient::parse_stripe_status("succeeded"),
            PaymentStatus::Succeeded
        );
        assert_eq!(
            StripeClient::parse_stripe_status("processing"),
            PaymentStatus::Processing
        );
        assert_eq!(
            StripeClient::parse_stripe_status("canceled"),
            PaymentStatus::Canceled
        );
    }
}
