//! Affiliate Entity - BackPack System
//!
//! Manages affiliate tracking, referrals, commissions, and payouts.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Affiliate status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AffiliateStatus {
    Pending,
    Active,
    Suspended,
    Terminated,
}

/// Commission structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommissionStructure {
    /// Base commission percentage (0-100)
    pub base_percentage: f64,
    /// Tiered commission rates based on sales volume
    pub tiers: Vec<CommissionTier>,
    /// Recurring commission enabled
    pub recurring: bool,
    /// Lifetime commission enabled
    pub lifetime: bool,
}

/// Commission tier based on performance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommissionTier {
    /// Minimum sales amount to reach this tier
    pub min_sales: i64,
    /// Commission percentage for this tier
    pub percentage: f64,
}

/// Affiliate entity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Affiliate {
    pub id: String,
    pub user_id: String,
    pub referral_code: String,
    pub status: AffiliateStatus,
    pub commission_structure: CommissionStructure,
    pub total_referrals: i32,
    pub total_sales: i64,
    pub total_commissions_earned: i64,
    pub total_commissions_paid: i64,
    pub metadata: HashMap<String, String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Referral tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Referral {
    pub id: String,
    pub affiliate_id: String,
    pub referred_user_id: String,
    pub referral_code: String,
    pub conversion_date: Option<DateTime<Utc>>,
    pub first_purchase_date: Option<DateTime<Utc>>,
    pub total_purchases: i64,
    pub status: ReferralStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ReferralStatus {
    Pending,
    Converted,
    Expired,
}

/// Commission calculation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commission {
    pub id: String,
    pub affiliate_id: String,
    pub referral_id: String,
    pub order_id: String,
    pub sale_amount: i64,
    pub commission_percentage: f64,
    pub commission_amount: i64,
    pub status: CommissionStatus,
    pub created_at: DateTime<Utc>,
    pub paid_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CommissionStatus {
    Pending,
    Approved,
    Paid,
    Cancelled,
    Refunded,
}

/// Payout request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Payout {
    pub id: String,
    pub affiliate_id: String,
    pub amount: i64,
    pub currency: String,
    pub method: PayoutMethod,
    pub status: PayoutStatus,
    pub commission_ids: Vec<String>,
    pub requested_at: DateTime<Utc>,
    pub processed_at: Option<DateTime<Utc>>,
    pub transaction_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PayoutMethod {
    BankTransfer,
    PayPal,
    Stripe,
    Check,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PayoutStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

impl Affiliate {
    /// Create a new affiliate
    pub fn new(user_id: String, commission_structure: CommissionStructure) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            user_id,
            referral_code: Self::generate_referral_code(),
            status: AffiliateStatus::Pending,
            commission_structure,
            total_referrals: 0,
            total_sales: 0,
            total_commissions_earned: 0,
            total_commissions_paid: 0,
            metadata: HashMap::new(),
            created_at: now,
            updated_at: now,
        }
    }

    /// Generate a unique referral code
    fn generate_referral_code() -> String {
        let uuid = Uuid::new_v4();
        let code = format!("{:x}", uuid.as_u128());
        code[..8].to_uppercase()
    }

    /// Activate the affiliate
    pub fn activate(&mut self) {
        self.status = AffiliateStatus::Active;
        self.updated_at = Utc::now();
    }

    /// Suspend the affiliate
    pub fn suspend(&mut self) {
        self.status = AffiliateStatus::Suspended;
        self.updated_at = Utc::now();
    }

    /// Calculate commission for a sale
    pub fn calculate_commission(&self, sale_amount: i64) -> i64 {
        let percentage = self.get_commission_percentage();
        (sale_amount as f64 * percentage / 100.0) as i64
    }

    /// Get applicable commission percentage based on total sales
    fn get_commission_percentage(&self) -> f64 {
        // Check tiers from highest to lowest
        for tier in self.commission_structure.tiers.iter().rev() {
            if self.total_sales >= tier.min_sales {
                return tier.percentage;
            }
        }
        self.commission_structure.base_percentage
    }

    /// Record a new referral
    pub fn add_referral(&mut self) {
        self.total_referrals += 1;
        self.updated_at = Utc::now();
    }

    /// Record a sale and commission
    pub fn record_sale(&mut self, sale_amount: i64, commission_amount: i64) {
        self.total_sales += sale_amount;
        self.total_commissions_earned += commission_amount;
        self.updated_at = Utc::now();
    }

    /// Record a payout
    pub fn record_payout(&mut self, payout_amount: i64) {
        self.total_commissions_paid += payout_amount;
        self.updated_at = Utc::now();
    }

    /// Get pending commission balance
    pub fn pending_balance(&self) -> i64 {
        self.total_commissions_earned - self.total_commissions_paid
    }

    /// Check if eligible for payout
    pub fn is_payout_eligible(&self, minimum_payout: i64) -> bool {
        self.status == AffiliateStatus::Active && self.pending_balance() >= minimum_payout
    }
}

impl CommissionStructure {
    /// Create a simple flat-rate commission structure
    pub fn flat_rate(percentage: f64) -> Self {
        Self {
            base_percentage: percentage,
            tiers: vec![],
            recurring: false,
            lifetime: false,
        }
    }

    /// Create a tiered commission structure
    pub fn tiered(base_percentage: f64, tiers: Vec<CommissionTier>) -> Self {
        Self {
            base_percentage,
            tiers,
            recurring: false,
            lifetime: false,
        }
    }

    /// Enable recurring commissions
    pub fn with_recurring(mut self) -> Self {
        self.recurring = true;
        self
    }

    /// Enable lifetime commissions
    pub fn with_lifetime(mut self) -> Self {
        self.lifetime = true;
        self
    }
}

impl Commission {
    /// Create a new commission
    pub fn new(
        affiliate_id: String,
        referral_id: String,
        order_id: String,
        sale_amount: i64,
        commission_percentage: f64,
    ) -> Self {
        let commission_amount = (sale_amount as f64 * commission_percentage / 100.0) as i64;
        Self {
            id: Uuid::new_v4().to_string(),
            affiliate_id,
            referral_id,
            order_id,
            sale_amount,
            commission_percentage,
            commission_amount,
            status: CommissionStatus::Pending,
            created_at: Utc::now(),
            paid_at: None,
        }
    }

    /// Approve the commission
    pub fn approve(&mut self) {
        self.status = CommissionStatus::Approved;
    }

    /// Mark as paid
    pub fn mark_paid(&mut self) {
        self.status = CommissionStatus::Paid;
        self.paid_at = Some(Utc::now());
    }

    /// Cancel the commission
    pub fn cancel(&mut self) {
        self.status = CommissionStatus::Cancelled;
    }

    /// Process refund
    pub fn refund(&mut self) {
        self.status = CommissionStatus::Refunded;
    }
}

impl Payout {
    /// Create a new payout request
    pub fn new(
        affiliate_id: String,
        amount: i64,
        currency: String,
        method: PayoutMethod,
        commission_ids: Vec<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            affiliate_id,
            amount,
            currency,
            method,
            status: PayoutStatus::Pending,
            commission_ids,
            requested_at: Utc::now(),
            processed_at: None,
            transaction_id: None,
        }
    }

    /// Start processing the payout
    pub fn start_processing(&mut self) {
        self.status = PayoutStatus::Processing;
    }

    /// Mark as completed
    pub fn complete(&mut self, transaction_id: String) {
        self.status = PayoutStatus::Completed;
        self.transaction_id = Some(transaction_id);
        self.processed_at = Some(Utc::now());
    }

    /// Mark as failed
    pub fn fail(&mut self) {
        self.status = PayoutStatus::Failed;
        self.processed_at = Some(Utc::now());
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_affiliate_creation() {
        let commission_structure = CommissionStructure::flat_rate(10.0);
        let affiliate = Affiliate::new("user123".to_string(), commission_structure);

        assert_eq!(affiliate.user_id, "user123");
        assert_eq!(affiliate.status, AffiliateStatus::Pending);
        assert_eq!(affiliate.referral_code.len(), 8);
        assert_eq!(affiliate.total_referrals, 0);
    }

    #[test]
    fn test_affiliate_activation() {
        let commission_structure = CommissionStructure::flat_rate(10.0);
        let mut affiliate = Affiliate::new("user123".to_string(), commission_structure);

        affiliate.activate();
        assert_eq!(affiliate.status, AffiliateStatus::Active);
    }

    #[test]
    fn test_flat_rate_commission() {
        let commission_structure = CommissionStructure::flat_rate(10.0);
        let affiliate = Affiliate::new("user123".to_string(), commission_structure);

        let commission = affiliate.calculate_commission(10000); // $100.00
        assert_eq!(commission, 1000); // $10.00
    }

    #[test]
    fn test_tiered_commission() {
        let tiers = vec![
            CommissionTier {
                min_sales: 0,
                percentage: 10.0,
            },
            CommissionTier {
                min_sales: 100000, // $1000
                percentage: 15.0,
            },
            CommissionTier {
                min_sales: 500000, // $5000
                percentage: 20.0,
            },
        ];

        let commission_structure = CommissionStructure::tiered(10.0, tiers);
        let mut affiliate = Affiliate::new("user123".to_string(), commission_structure);

        // Base rate
        let commission1 = affiliate.calculate_commission(10000);
        assert_eq!(commission1, 1000); // 10%

        // Reach tier 2
        affiliate.total_sales = 150000;
        let commission2 = affiliate.calculate_commission(10000);
        assert_eq!(commission2, 1500); // 15%

        // Reach tier 3
        affiliate.total_sales = 600000;
        let commission3 = affiliate.calculate_commission(10000);
        assert_eq!(commission3, 2000); // 20%
    }

    #[test]
    fn test_referral_tracking() {
        let commission_structure = CommissionStructure::flat_rate(10.0);
        let mut affiliate = Affiliate::new("user123".to_string(), commission_structure);

        affiliate.add_referral();
        affiliate.add_referral();
        assert_eq!(affiliate.total_referrals, 2);
    }

    #[test]
    fn test_sales_recording() {
        let commission_structure = CommissionStructure::flat_rate(10.0);
        let mut affiliate = Affiliate::new("user123".to_string(), commission_structure);

        affiliate.record_sale(10000, 1000);
        affiliate.record_sale(20000, 2000);

        assert_eq!(affiliate.total_sales, 30000);
        assert_eq!(affiliate.total_commissions_earned, 3000);
    }

    #[test]
    fn test_pending_balance() {
        let commission_structure = CommissionStructure::flat_rate(10.0);
        let mut affiliate = Affiliate::new("user123".to_string(), commission_structure);

        affiliate.record_sale(10000, 1000);
        assert_eq!(affiliate.pending_balance(), 1000);

        affiliate.record_payout(500);
        assert_eq!(affiliate.pending_balance(), 500);
    }

    #[test]
    fn test_payout_eligibility() {
        let commission_structure = CommissionStructure::flat_rate(10.0);
        let mut affiliate = Affiliate::new("user123".to_string(), commission_structure);

        affiliate.activate();
        affiliate.record_sale(10000, 1000);

        assert!(affiliate.is_payout_eligible(500)); // Minimum $5
        assert!(!affiliate.is_payout_eligible(2000)); // Minimum $20
    }

    #[test]
    fn test_commission_lifecycle() {
        let mut commission = Commission::new(
            "affiliate123".to_string(),
            "referral456".to_string(),
            "order789".to_string(),
            10000,
            10.0,
        );

        assert_eq!(commission.status, CommissionStatus::Pending);
        assert_eq!(commission.commission_amount, 1000);

        commission.approve();
        assert_eq!(commission.status, CommissionStatus::Approved);

        commission.mark_paid();
        assert_eq!(commission.status, CommissionStatus::Paid);
        assert!(commission.paid_at.is_some());
    }

    #[test]
    fn test_payout_lifecycle() {
        let mut payout = Payout::new(
            "affiliate123".to_string(),
            5000,
            "USD".to_string(),
            PayoutMethod::PayPal,
            vec!["comm1".to_string(), "comm2".to_string()],
        );

        assert_eq!(payout.status, PayoutStatus::Pending);

        payout.start_processing();
        assert_eq!(payout.status, PayoutStatus::Processing);

        payout.complete("txn_abc123".to_string());
        assert_eq!(payout.status, PayoutStatus::Completed);
        assert_eq!(payout.transaction_id, Some("txn_abc123".to_string()));
    }

    #[test]
    fn test_recurring_commission_structure() {
        let structure = CommissionStructure::flat_rate(10.0).with_recurring();
        assert!(structure.recurring);
    }

    #[test]
    fn test_lifetime_commission_structure() {
        let structure = CommissionStructure::flat_rate(10.0).with_lifetime();
        assert!(structure.lifetime);
    }
}
