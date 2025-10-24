//! Miyabi E2E Test Framework
//!
//! Provides comprehensive end-to-end testing utilities including:
//! - Test harness with setup/teardown
//! - Mock GitHub API server
//! - Test fixtures and sample data
//! - Helper utilities for common operations
//!
//! # Example
//!
//! ```rust,no_run
//! use miyabi_e2e_tests::harness::TestHarness;
//!
//! #[tokio::test]
//! async fn test_full_workflow() {
//!     let harness = TestHarness::new().await;
//!     let issue = harness.fixtures().sample_issue();
//!
//!     // Run test...
//!
//!     harness.cleanup().await;
//! }
//! ```

pub mod fixtures;
pub mod harness;
pub mod helpers;
pub mod mocks;

// Re-export commonly used types
pub use fixtures::{Fixtures, SampleData};
pub use harness::{TestContext, TestHarness};
pub use helpers::{
    assert_file_contains, assert_file_exists, create_test_commit, create_test_file,
    wait_for_condition,
};
pub use mocks::{MockGitHub, MockGitHubBuilder};

/// Result type for E2E tests
pub type E2EResult<T> = Result<T, Box<dyn std::error::Error + Send + Sync>>;
