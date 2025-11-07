//! Seedance API Client
//!
//! BytePlus Seedance API integration for video generation.
//!
//! # Features
//! - Task creation and polling
//! - Authentication with API key
//! - Error handling and retry logic
//! - Video URL retrieval

mod client;
mod models;
mod error;

pub use client::SeedanceClient;
pub use models::*;
pub use error::{SeedanceError, Result};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_module_exports() {
        // Smoke test to ensure all public types are accessible
        let _ = SeedanceError::ApiError("test".to_string());
    }
}
