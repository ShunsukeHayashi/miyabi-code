//! ClickFunnels Integrations
//!
//! This crate provides integrations with third-party services:
//! - SMTP providers (SendGrid, Mailgun, AWS SES)
//! - Payment gateways (Stripe, PayPal, Square)
//! - Analytics platforms (Google Analytics 4)

pub mod smtp;
pub mod payment;
pub mod analytics;

// Re-export commonly used types
pub use smtp::{
    EmailMessage, EmailAddress, EmailAttachment,
    SmtpProvider, SmtpConfig, SmtpClient, SmtpResult,
    create_smtp_client,
};

pub use payment::{
    PaymentProvider, PaymentConfig, PaymentClient,
    PaymentIntent, PaymentMethod, PaymentResult,
    create_payment_client,
};

pub use analytics::{
    AnalyticsProvider, AnalyticsConfig, AnalyticsClient,
    AnalyticsEvent, AnalyticsResult,
    create_analytics_client,
};
