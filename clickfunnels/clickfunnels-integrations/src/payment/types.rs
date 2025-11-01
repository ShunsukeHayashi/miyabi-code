//! Payment Gateway Types and Configuration

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Payment provider types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaymentProvider {
    Stripe,
    PayPal,
    Square,
}

/// Currency codes (ISO 4217)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Currency {
    USD,
    EUR,
    GBP,
    JPY,
    CAD,
    AUD,
}

impl Currency {
    pub fn as_str(&self) -> &str {
        match self {
            Currency::USD => "usd",
            Currency::EUR => "eur",
            Currency::GBP => "gbp",
            Currency::JPY => "jpy",
            Currency::CAD => "cad",
            Currency::AUD => "aud",
        }
    }
}

/// Payment status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaymentStatus {
    Pending,
    Processing,
    Succeeded,
    Failed,
    Canceled,
    Refunded,
}

/// Payment method type
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaymentMethod {
    Card {
        last4: String,
        brand: String,
        exp_month: u32,
        exp_year: u32,
    },
    BankAccount {
        last4: String,
        bank_name: String,
    },
    PayPalAccount {
        email: String,
    },
    Other(String),
}

/// Payment intent
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentIntent {
    pub id: String,
    pub amount: i64,
    pub currency: Currency,
    pub status: PaymentStatus,
    pub payment_method: Option<PaymentMethod>,
    pub client_secret: Option<String>,
    pub metadata: HashMap<String, String>,
    pub created_at: i64,
}

/// Payment configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentConfig {
    pub provider: PaymentProvider,
    pub api_key: String,
    pub client_id: Option<String>,       // For PayPal
    pub client_secret: Option<String>,   // For PayPal
    pub sandbox: Option<bool>,           // Use sandbox/test mode
}

/// Payment error types
#[derive(Error, Debug)]
pub enum PaymentError {
    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Authentication error: {0}")]
    AuthError(String),

    #[error("Network error: {0}")]
    NetworkError(String),

    #[error("API error: {0}")]
    ApiError(String),

    #[error("Invalid amount: {0}")]
    InvalidAmount(String),

    #[error("Payment declined: {0}")]
    PaymentDeclined(String),

    #[error("Payment not found: {0}")]
    PaymentNotFound(String),

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type PaymentResult<T> = Result<T, PaymentError>;

impl From<reqwest::Error> for PaymentError {
    fn from(err: reqwest::Error) -> Self {
        PaymentError::NetworkError(err.to_string())
    }
}

impl From<serde_json::Error> for PaymentError {
    fn from(err: serde_json::Error) -> Self {
        PaymentError::ApiError(err.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_currency_as_str() {
        assert_eq!(Currency::USD.as_str(), "usd");
        assert_eq!(Currency::EUR.as_str(), "eur");
        assert_eq!(Currency::GBP.as_str(), "gbp");
    }

    #[test]
    fn test_payment_method_card() {
        let pm = PaymentMethod::Card {
            last4: "4242".to_string(),
            brand: "Visa".to_string(),
            exp_month: 12,
            exp_year: 2025,
        };

        match pm {
            PaymentMethod::Card { last4, .. } => assert_eq!(last4, "4242"),
            _ => panic!("Expected Card payment method"),
        }
    }

    #[test]
    fn test_payment_status() {
        let status = PaymentStatus::Succeeded;
        assert_eq!(status, PaymentStatus::Succeeded);
    }
}
