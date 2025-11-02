//! ClickFunnels Core - Domain Models and Business Logic
//!
//! This crate contains the core domain entities, business logic,
//! and shared utilities for the ClickFunnels system.

pub mod entities;

// Re-export entities for convenient access
pub use entities::{
    Funnel, FunnelStatus, FunnelType, Integration, IntegrationStatus, IntegrationType, Page,
    PageStatus, PageType, Provider, SubscriptionTier, User, UserStatus,
};
