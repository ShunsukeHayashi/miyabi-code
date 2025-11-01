//! Payment Gateway Integration Module
//!
//! Provides payment processing capabilities through multiple providers:
//! - Stripe
//! - PayPal
//! - Square

pub mod stripe_provider;
pub mod paypal;
pub mod square;
pub mod types;

pub use types::{
    PaymentProvider, PaymentConfig, PaymentIntent, PaymentMethod,
    PaymentStatus, PaymentResult, PaymentError, Currency,
};

use async_trait::async_trait;

/// Payment Gateway Client trait
#[async_trait]
pub trait PaymentClient: Send + Sync {
    /// Create a payment intent
    async fn create_payment_intent(
        &self,
        amount: i64,
        currency: Currency,
        metadata: Option<std::collections::HashMap<String, String>>,
    ) -> PaymentResult<PaymentIntent>;

    /// Capture a payment
    async fn capture_payment(&self, payment_id: &str) -> PaymentResult<PaymentIntent>;

    /// Refund a payment
    async fn refund_payment(&self, payment_id: &str, amount: Option<i64>) -> PaymentResult<String>;

    /// Get payment status
    async fn get_payment_status(&self, payment_id: &str) -> PaymentResult<PaymentStatus>;

    /// Get provider name
    fn provider_name(&self) -> &str;
}

/// Create a payment client based on the provider type
pub fn create_payment_client(config: PaymentConfig) -> PaymentResult<Box<dyn PaymentClient>> {
    match config.provider {
        PaymentProvider::Stripe => {
            let client = stripe_provider::StripeClient::new(config.api_key)?;
            Ok(Box::new(client))
        }
        PaymentProvider::PayPal => {
            let client = paypal::PayPalClient::new(
                config.client_id.ok_or_else(|| {
                    PaymentError::ConfigError("PayPal requires client_id".to_string())
                })?,
                config.client_secret.ok_or_else(|| {
                    PaymentError::ConfigError("PayPal requires client_secret".to_string())
                })?,
                config.sandbox.unwrap_or(false),
            )?;
            Ok(Box::new(client))
        }
        PaymentProvider::Square => {
            let client = square::SquareClient::new(
                config.api_key,
                config.sandbox.unwrap_or(false),
            )?;
            Ok(Box::new(client))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_stripe_client() {
        let config = PaymentConfig {
            provider: PaymentProvider::Stripe,
            api_key: "sk_test_123".to_string(),
            client_id: None,
            client_secret: None,
            sandbox: None,
        };

        let result = create_payment_client(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_create_paypal_client_missing_credentials() {
        let config = PaymentConfig {
            provider: PaymentProvider::PayPal,
            api_key: String::new(),
            client_id: None,
            client_secret: None,
            sandbox: Some(true),
        };

        let result = create_payment_client(config);
        assert!(result.is_err());
    }
}
