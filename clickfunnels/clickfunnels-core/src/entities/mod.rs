//! Core Domain Entities for ClickFunnels
//!
//! This module contains all core domain models for the ClickFunnels system:
//! - User: User accounts with authentication and subscriptions
//! - Funnel: Marketing funnels with conversion tracking
//! - Page: Landing pages with WYSIWYG content and SEO
//! - Integration: Third-party integrations (email, payment, analytics)
//! - Affiliate: BackPack affiliate system with referral tracking and commissions
//! - EmailAutomation: Follow-up funnels with automated email sequences

pub mod user;
pub mod funnel;
pub mod page;
pub mod integration;
pub mod affiliate;
pub mod email_automation;

// Re-export entities for convenient access
pub use user::{User, UserStatus, SubscriptionTier};
pub use funnel::{Funnel, FunnelStatus, FunnelType};
pub use page::{Page, PageStatus, PageType};
pub use integration::{Integration, IntegrationStatus, IntegrationType, Provider};
pub use affiliate::{
    Affiliate, AffiliateStatus, Commission, CommissionStatus, CommissionStructure,
    CommissionTier, Payout, PayoutMethod, PayoutStatus, Referral, ReferralStatus,
};
pub use email_automation::{
    DeliveryStatus, EmailCondition, EmailDelay, EmailDelivery, EmailSequence, SequenceEmail,
    SequenceSettings, SequenceStats, SequenceStatus, SequenceSubscriber, SequenceTrigger,
    SubscriberStatus, TimeWindow,
};
