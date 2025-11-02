//! ClickFunnels Integrations
//!
//! This crate provides integrations with third-party services:
//! - SMTP providers (SendGrid, Mailgun, AWS SES)
//! - Payment gateways (Stripe, PayPal, Square)
//! - Analytics platforms (Google Analytics 4)

pub mod analytics;
pub mod payment;
pub mod smtp;

// Re-export commonly used types
pub use smtp::{
    create_smtp_client, EmailAddress, EmailAttachment, EmailMessage, SmtpClient, SmtpConfig,
    SmtpProvider, SmtpResult,
};

pub use payment::{
    create_payment_client, PaymentClient, PaymentConfig, PaymentIntent, PaymentMethod,
    PaymentProvider, PaymentResult,
};

pub use analytics::{
    create_analytics_client, AnalyticsClient, AnalyticsConfig, AnalyticsEvent, AnalyticsProvider,
    AnalyticsResult,
};
