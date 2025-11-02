//! Square Payment Provider Implementation (stub)

use super::types::*;
use super::PaymentClient;
use async_trait::async_trait;
use std::collections::HashMap;

pub struct SquareClient {
    #[allow(dead_code)]
    api_key: String,
    #[allow(dead_code)]
    sandbox: bool,
}

impl SquareClient {
    pub fn new(api_key: String, sandbox: bool) -> PaymentResult<Self> {
        if api_key.is_empty() {
            return Err(PaymentError::ConfigError(
                "API key cannot be empty".to_string(),
            ));
        }

        Ok(Self { api_key, sandbox })
    }

    #[allow(dead_code)]
    fn get_api_url(&self) -> &str {
        if self.sandbox {
            "https://connect.squareupsandbox.com"
        } else {
            "https://connect.squareup.com"
        }
    }
}

#[async_trait]
impl PaymentClient for SquareClient {
    async fn create_payment_intent(
        &self,
        amount: i64,
        currency: Currency,
        _metadata: Option<HashMap<String, String>>,
    ) -> PaymentResult<PaymentIntent> {
        // Stub implementation
        Ok(PaymentIntent {
            id: format!("square_stub_{}", uuid::Uuid::new_v4()),
            amount,
            currency,
            status: PaymentStatus::Pending,
            payment_method: None,
            client_secret: Some("stub_secret".to_string()),
            metadata: HashMap::new(),
            created_at: chrono::Utc::now().timestamp(),
        })
    }

    async fn capture_payment(&self, payment_id: &str) -> PaymentResult<PaymentIntent> {
        // Stub implementation
        Ok(PaymentIntent {
            id: payment_id.to_string(),
            amount: 0,
            currency: Currency::USD,
            status: PaymentStatus::Succeeded,
            payment_method: None,
            client_secret: None,
            metadata: HashMap::new(),
            created_at: chrono::Utc::now().timestamp(),
        })
    }

    async fn refund_payment(
        &self,
        _payment_id: &str,
        _amount: Option<i64>,
    ) -> PaymentResult<String> {
        Ok("stub_refund_id".to_string())
    }

    async fn get_payment_status(&self, _payment_id: &str) -> PaymentResult<PaymentStatus> {
        Ok(PaymentStatus::Succeeded)
    }

    fn provider_name(&self) -> &str {
        "Square"
    }
}
