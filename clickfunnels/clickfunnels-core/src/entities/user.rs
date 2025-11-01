//! User Entity - Core domain model for ClickFunnels users
//!
//! This module defines the User entity with authentication, profile,
//! and subscription management capabilities.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// User subscription tier
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SubscriptionTier {
    /// Free tier with limited features
    Free,
    /// Startup tier for small businesses
    Startup,
    /// Professional tier with advanced features
    Professional,
    /// Enterprise tier with unlimited features
    Enterprise,
}

impl Default for SubscriptionTier {
    fn default() -> Self {
        Self::Free
    }
}

/// User status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum UserStatus {
    /// Active user
    Active,
    /// Suspended user (temporary)
    Suspended,
    /// Deleted user (soft delete)
    Deleted,
}

impl Default for UserStatus {
    fn default() -> Self {
        Self::Active
    }
}

/// User Entity
///
/// Represents a user in the ClickFunnels system with authentication,
/// profile information, and subscription details.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    /// Unique user identifier
    pub id: Uuid,

    /// User email (unique, used for authentication)
    pub email: String,

    /// Hashed password (bcrypt)
    #[serde(skip_serializing)]
    pub password_hash: String,

    /// User's full name
    pub full_name: String,

    /// User's company name (optional)
    pub company_name: Option<String>,

    /// User's subscription tier
    pub subscription_tier: SubscriptionTier,

    /// User account status
    pub status: UserStatus,

    /// Email verification status
    pub email_verified: bool,

    /// Email verification token (expires after 24h)
    pub email_verification_token: Option<String>,

    /// Password reset token (expires after 1h)
    pub password_reset_token: Option<String>,

    /// Password reset token expiry
    pub password_reset_expires_at: Option<DateTime<Utc>>,

    /// Total funnels created by this user
    pub funnels_count: i32,

    /// Total pages created by this user
    pub pages_count: i32,

    /// Last login timestamp
    pub last_login_at: Option<DateTime<Utc>>,

    /// Account creation timestamp
    pub created_at: DateTime<Utc>,

    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

impl User {
    /// Create a new User with default values
    pub fn new(email: String, password_hash: String, full_name: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            email,
            password_hash,
            full_name,
            company_name: None,
            subscription_tier: SubscriptionTier::default(),
            status: UserStatus::default(),
            email_verified: false,
            email_verification_token: None,
            password_reset_token: None,
            password_reset_expires_at: None,
            funnels_count: 0,
            pages_count: 0,
            last_login_at: None,
            created_at: now,
            updated_at: now,
        }
    }

    /// Check if user is active
    pub fn is_active(&self) -> bool {
        self.status == UserStatus::Active
    }

    /// Check if user email is verified
    pub fn is_email_verified(&self) -> bool {
        self.email_verified
    }

    /// Check if user has a valid password reset token
    pub fn has_valid_reset_token(&self, token: &str) -> bool {
        if let (Some(stored_token), Some(expires_at)) =
            (&self.password_reset_token, self.password_reset_expires_at) {
            stored_token == token && expires_at > Utc::now()
        } else {
            false
        }
    }

    /// Update last login timestamp
    pub fn update_last_login(&mut self) {
        self.last_login_at = Some(Utc::now());
        self.updated_at = Utc::now();
    }

    /// Verify email
    pub fn verify_email(&mut self, token: &str) -> Result<(), &'static str> {
        if let Some(stored_token) = &self.email_verification_token {
            if stored_token == token {
                self.email_verified = true;
                self.email_verification_token = None;
                self.updated_at = Utc::now();
                Ok(())
            } else {
                Err("Invalid verification token")
            }
        } else {
            Err("No verification token set")
        }
    }

    /// Set password reset token
    pub fn set_password_reset_token(&mut self, token: String) {
        self.password_reset_token = Some(token);
        self.password_reset_expires_at = Some(Utc::now() + chrono::Duration::hours(1));
        self.updated_at = Utc::now();
    }

    /// Reset password
    pub fn reset_password(&mut self, token: &str, new_password_hash: String) -> Result<(), &'static str> {
        if self.has_valid_reset_token(token) {
            self.password_hash = new_password_hash;
            self.password_reset_token = None;
            self.password_reset_expires_at = None;
            self.updated_at = Utc::now();
            Ok(())
        } else {
            Err("Invalid or expired reset token")
        }
    }

    /// Upgrade subscription tier
    pub fn upgrade_subscription(&mut self, new_tier: SubscriptionTier) {
        self.subscription_tier = new_tier;
        self.updated_at = Utc::now();
    }

    /// Increment funnels count
    pub fn increment_funnels_count(&mut self) {
        self.funnels_count += 1;
        self.updated_at = Utc::now();
    }

    /// Increment pages count
    pub fn increment_pages_count(&mut self) {
        self.pages_count += 1;
        self.updated_at = Utc::now();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_user() {
        let user = User::new(
            "test@example.com".to_string(),
            "hashed_password".to_string(),
            "Test User".to_string(),
        );

        assert_eq!(user.email, "test@example.com");
        assert_eq!(user.full_name, "Test User");
        assert_eq!(user.subscription_tier, SubscriptionTier::Free);
        assert_eq!(user.status, UserStatus::Active);
        assert!(!user.email_verified);
        assert_eq!(user.funnels_count, 0);
        assert_eq!(user.pages_count, 0);
    }

    #[test]
    fn test_is_active() {
        let mut user = User::new(
            "test@example.com".to_string(),
            "hashed_password".to_string(),
            "Test User".to_string(),
        );

        assert!(user.is_active());

        user.status = UserStatus::Suspended;
        assert!(!user.is_active());
    }

    #[test]
    fn test_verify_email() {
        let mut user = User::new(
            "test@example.com".to_string(),
            "hashed_password".to_string(),
            "Test User".to_string(),
        );

        let token = "verification_token_123".to_string();
        user.email_verification_token = Some(token.clone());

        assert!(user.verify_email(&token).is_ok());
        assert!(user.is_email_verified());
        assert!(user.email_verification_token.is_none());
    }

    #[test]
    fn test_password_reset() {
        let mut user = User::new(
            "test@example.com".to_string(),
            "old_hash".to_string(),
            "Test User".to_string(),
        );

        let token = "reset_token_456".to_string();
        user.set_password_reset_token(token.clone());

        assert!(user.has_valid_reset_token(&token));
        assert!(user.reset_password(&token, "new_hash".to_string()).is_ok());
        assert_eq!(user.password_hash, "new_hash");
        assert!(user.password_reset_token.is_none());
    }

    #[test]
    fn test_upgrade_subscription() {
        let mut user = User::new(
            "test@example.com".to_string(),
            "hashed_password".to_string(),
            "Test User".to_string(),
        );

        assert_eq!(user.subscription_tier, SubscriptionTier::Free);

        user.upgrade_subscription(SubscriptionTier::Professional);
        assert_eq!(user.subscription_tier, SubscriptionTier::Professional);
    }

    #[test]
    fn test_increment_counts() {
        let mut user = User::new(
            "test@example.com".to_string(),
            "hashed_password".to_string(),
            "Test User".to_string(),
        );

        assert_eq!(user.funnels_count, 0);
        assert_eq!(user.pages_count, 0);

        user.increment_funnels_count();
        user.increment_pages_count();

        assert_eq!(user.funnels_count, 1);
        assert_eq!(user.pages_count, 1);
    }
}
