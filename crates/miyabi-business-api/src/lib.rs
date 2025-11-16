//! Miyabi Business API
//!
//! AIFactory business logic integrated into Miyabi.
//!
//! # Features
//! - Product management (CRUD)
//! - Order processing
//! - AI job execution (5 Business Agents)
//! - Payment processing
//! - Approval workflows

pub mod agents;
pub mod error;
pub mod models;
pub mod routes;
pub mod services;

pub use error::{BusinessApiError, Result};

// Re-export business types from miyabi-types
pub use miyabi_types::{AiJob, Approval, Order, Payment, Product};

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
