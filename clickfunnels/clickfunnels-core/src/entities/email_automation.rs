//! Email Automation Entity - Follow-Up Funnels
//!
//! Manages automated email sequences with triggers, delays, and conditions.

use chrono::{DateTime, Datelike, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Email sequence status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SequenceStatus {
    Draft,
    Active,
    Paused,
    Archived,
}

/// Trigger type for starting a sequence
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SequenceTrigger {
    /// Trigger on funnel entry
    FunnelEntry { funnel_id: String },
    /// Trigger on page visit
    PageVisit { page_id: String },
    /// Trigger on form submission
    FormSubmit { form_id: String },
    /// Trigger on product purchase
    Purchase { product_id: String },
    /// Trigger on tag assignment
    TagAdded { tag: String },
    /// Manual trigger
    Manual,
    /// API trigger
    Api { webhook_url: String },
}

/// Email sequence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailSequence {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub status: SequenceStatus,
    pub trigger: SequenceTrigger,
    pub emails: Vec<SequenceEmail>,
    pub settings: SequenceSettings,
    pub stats: SequenceStats,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Settings for a sequence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequenceSettings {
    /// Send emails during specific hours only
    pub send_window: Option<TimeWindow>,
    /// Stop sending if user unsubscribes
    pub respect_unsubscribe: bool,
    /// Stop sending if user purchases
    pub stop_on_purchase: bool,
    /// Maximum emails per day
    pub max_emails_per_day: Option<i32>,
    /// Track opens and clicks
    pub tracking_enabled: bool,
}

/// Time window for sending emails
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeWindow {
    /// Start hour (0-23)
    pub start_hour: u8,
    /// End hour (0-23)
    pub end_hour: u8,
    /// Days of week (0 = Sunday, 6 = Saturday)
    pub days_of_week: Vec<u8>,
}

/// Individual email in a sequence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequenceEmail {
    pub id: String,
    pub sequence_id: String,
    pub order: i32,
    pub subject: String,
    pub from_name: String,
    pub from_email: String,
    pub reply_to: Option<String>,
    pub html_body: String,
    pub text_body: Option<String>,
    pub delay: EmailDelay,
    pub conditions: Vec<EmailCondition>,
    pub created_at: DateTime<Utc>,
}

/// Delay before sending an email
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EmailDelay {
    /// Send immediately
    Immediate,
    /// Wait for a duration after the previous email
    Duration { days: i32, hours: i32, minutes: i32 },
    /// Send at a specific time
    ScheduledTime { datetime: DateTime<Utc> },
    /// Wait until a specific day of week
    DayOfWeek { day: u8, hour: u8 },
}

/// Condition for sending an email
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EmailCondition {
    /// Check if user has a specific tag
    HasTag { tag: String },
    /// Check if user does not have a tag
    NotHasTag { tag: String },
    /// Check if user opened previous email
    OpenedPrevious { email_id: String },
    /// Check if user clicked link in previous email
    ClickedPrevious { email_id: String },
    /// Check if user made a purchase
    MadePurchase { product_id: Option<String> },
    /// Custom field value
    CustomField { field: String, value: String },
}

/// Sequence statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequenceStats {
    pub total_subscribers: i64,
    pub active_subscribers: i64,
    pub completed_subscribers: i64,
    pub unsubscribed: i64,
    pub total_emails_sent: i64,
    pub total_opens: i64,
    pub total_clicks: i64,
    pub open_rate: f64,
    pub click_rate: f64,
}

/// Subscriber in a sequence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SequenceSubscriber {
    pub id: String,
    pub sequence_id: String,
    pub user_id: String,
    pub email: String,
    pub status: SubscriberStatus,
    pub current_email_index: i32,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub unsubscribed_at: Option<DateTime<Utc>>,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SubscriberStatus {
    Active,
    Paused,
    Completed,
    Unsubscribed,
    Bounced,
}

/// Email delivery record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailDelivery {
    pub id: String,
    pub sequence_id: String,
    pub email_id: String,
    pub subscriber_id: String,
    pub recipient_email: String,
    pub status: DeliveryStatus,
    pub sent_at: Option<DateTime<Utc>>,
    pub opened_at: Option<DateTime<Utc>>,
    pub clicked_at: Option<DateTime<Utc>>,
    pub bounced_at: Option<DateTime<Utc>>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeliveryStatus {
    Scheduled,
    Sending,
    Sent,
    Opened,
    Clicked,
    Bounced,
    Failed,
}

impl EmailSequence {
    /// Create a new email sequence
    pub fn new(name: String, trigger: SequenceTrigger) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: None,
            status: SequenceStatus::Draft,
            trigger,
            emails: vec![],
            settings: SequenceSettings::default(),
            stats: SequenceStats::default(),
            created_at: now,
            updated_at: now,
        }
    }

    /// Add an email to the sequence
    pub fn add_email(&mut self, email: SequenceEmail) {
        self.emails.push(email);
        self.updated_at = Utc::now();
    }

    /// Activate the sequence
    pub fn activate(&mut self) {
        self.status = SequenceStatus::Active;
        self.updated_at = Utc::now();
    }

    /// Pause the sequence
    pub fn pause(&mut self) {
        self.status = SequenceStatus::Paused;
        self.updated_at = Utc::now();
    }

    /// Get email by order
    pub fn get_email(&self, order: i32) -> Option<&SequenceEmail> {
        self.emails.iter().find(|e| e.order == order)
    }

    /// Calculate total sequence duration
    pub fn total_duration(&self) -> Duration {
        let mut total = Duration::zero();
        for email in &self.emails {
            total += email.delay.to_duration();
        }
        total
    }
}

impl SequenceEmail {
    /// Create a new sequence email
    pub fn new(
        sequence_id: String,
        order: i32,
        subject: String,
        from_name: String,
        from_email: String,
        html_body: String,
        delay: EmailDelay,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            sequence_id,
            order,
            subject,
            from_name,
            from_email,
            reply_to: None,
            html_body,
            text_body: None,
            delay,
            conditions: vec![],
            created_at: Utc::now(),
        }
    }

    /// Add a condition to the email
    pub fn add_condition(mut self, condition: EmailCondition) -> Self {
        self.conditions.push(condition);
        self
    }

    /// Check if all conditions are met
    pub fn check_conditions(&self, _context: &HashMap<String, String>) -> bool {
        // In real implementation, would evaluate conditions against context
        // For now, return true if no conditions
        self.conditions.is_empty()
    }
}

impl EmailDelay {
    /// Convert delay to Duration
    pub fn to_duration(&self) -> Duration {
        match self {
            EmailDelay::Immediate => Duration::zero(),
            EmailDelay::Duration {
                days,
                hours,
                minutes,
            } => {
                Duration::days(*days as i64)
                    + Duration::hours(*hours as i64)
                    + Duration::minutes(*minutes as i64)
            }
            EmailDelay::ScheduledTime { datetime } => {
                let now = Utc::now();
                if *datetime > now {
                    *datetime - now
                } else {
                    Duration::zero()
                }
            }
            EmailDelay::DayOfWeek { .. } => Duration::zero(), // Requires more complex calculation
        }
    }

    /// Calculate next send time from a given start time
    pub fn calculate_send_time(&self, start_time: DateTime<Utc>) -> DateTime<Utc> {
        match self {
            EmailDelay::Immediate => start_time,
            EmailDelay::Duration {
                days,
                hours,
                minutes,
            } => {
                start_time
                    + Duration::days(*days as i64)
                    + Duration::hours(*hours as i64)
                    + Duration::minutes(*minutes as i64)
            }
            EmailDelay::ScheduledTime { datetime } => *datetime,
            EmailDelay::DayOfWeek { day, hour } => {
                // Find next occurrence of the specified day of week
                let mut next = start_time;
                while next.weekday().num_days_from_sunday() != *day as u32 {
                    next += Duration::days(1);
                }
                next.date_naive().and_hms_opt(*hour as u32, 0, 0).unwrap().and_utc()
            }
        }
    }
}

impl SequenceSubscriber {
    /// Create a new subscriber
    pub fn new(sequence_id: String, user_id: String, email: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            sequence_id,
            user_id,
            email,
            status: SubscriberStatus::Active,
            current_email_index: 0,
            started_at: Utc::now(),
            completed_at: None,
            unsubscribed_at: None,
            metadata: HashMap::new(),
        }
    }

    /// Move to next email
    pub fn advance(&mut self) {
        self.current_email_index += 1;
    }

    /// Mark as completed
    pub fn complete(&mut self) {
        self.status = SubscriberStatus::Completed;
        self.completed_at = Some(Utc::now());
    }

    /// Unsubscribe
    pub fn unsubscribe(&mut self) {
        self.status = SubscriberStatus::Unsubscribed;
        self.unsubscribed_at = Some(Utc::now());
    }
}

impl Default for SequenceSettings {
    fn default() -> Self {
        Self {
            send_window: None,
            respect_unsubscribe: true,
            stop_on_purchase: false,
            max_emails_per_day: None,
            tracking_enabled: true,
        }
    }
}

impl Default for SequenceStats {
    fn default() -> Self {
        Self {
            total_subscribers: 0,
            active_subscribers: 0,
            completed_subscribers: 0,
            unsubscribed: 0,
            total_emails_sent: 0,
            total_opens: 0,
            total_clicks: 0,
            open_rate: 0.0,
            click_rate: 0.0,
        }
    }
}

impl SequenceStats {
    /// Update statistics after sending an email
    pub fn record_send(&mut self) {
        self.total_emails_sent += 1;
    }

    /// Record an email open
    pub fn record_open(&mut self) {
        self.total_opens += 1;
        self.open_rate = if self.total_emails_sent > 0 {
            (self.total_opens as f64 / self.total_emails_sent as f64) * 100.0
        } else {
            0.0
        };
    }

    /// Record a click
    pub fn record_click(&mut self) {
        self.total_clicks += 1;
        self.click_rate = if self.total_emails_sent > 0 {
            (self.total_clicks as f64 / self.total_emails_sent as f64) * 100.0
        } else {
            0.0
        };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sequence_creation() {
        let trigger = SequenceTrigger::FunnelEntry {
            funnel_id: "funnel123".to_string(),
        };
        let sequence = EmailSequence::new("Welcome Series".to_string(), trigger);

        assert_eq!(sequence.name, "Welcome Series");
        assert_eq!(sequence.status, SequenceStatus::Draft);
        assert!(sequence.emails.is_empty());
    }

    #[test]
    fn test_sequence_activation() {
        let trigger = SequenceTrigger::Manual;
        let mut sequence = EmailSequence::new("Test Sequence".to_string(), trigger);

        sequence.activate();
        assert_eq!(sequence.status, SequenceStatus::Active);
    }

    #[test]
    fn test_add_email_to_sequence() {
        let trigger = SequenceTrigger::Manual;
        let mut sequence = EmailSequence::new("Test Sequence".to_string(), trigger);

        let email = SequenceEmail::new(
            sequence.id.clone(),
            1,
            "Welcome!".to_string(),
            "John Doe".to_string(),
            "john@example.com".to_string(),
            "<p>Welcome!</p>".to_string(),
            EmailDelay::Immediate,
        );

        sequence.add_email(email);
        assert_eq!(sequence.emails.len(), 1);
    }

    #[test]
    fn test_immediate_delay() {
        let delay = EmailDelay::Immediate;
        let duration = delay.to_duration();
        assert_eq!(duration, Duration::zero());
    }

    #[test]
    fn test_duration_delay() {
        let delay = EmailDelay::Duration {
            days: 1,
            hours: 2,
            minutes: 30,
        };
        let duration = delay.to_duration();
        let expected = Duration::days(1) + Duration::hours(2) + Duration::minutes(30);
        assert_eq!(duration, expected);
    }

    #[test]
    fn test_calculate_send_time() {
        let start = Utc::now();
        let delay = EmailDelay::Duration {
            days: 1,
            hours: 0,
            minutes: 0,
        };
        let send_time = delay.calculate_send_time(start);
        assert!(send_time > start);
    }

    #[test]
    fn test_subscriber_creation() {
        let subscriber = SequenceSubscriber::new(
            "seq123".to_string(),
            "user456".to_string(),
            "user@example.com".to_string(),
        );

        assert_eq!(subscriber.status, SubscriberStatus::Active);
        assert_eq!(subscriber.current_email_index, 0);
    }

    #[test]
    fn test_subscriber_advance() {
        let mut subscriber = SequenceSubscriber::new(
            "seq123".to_string(),
            "user456".to_string(),
            "user@example.com".to_string(),
        );

        subscriber.advance();
        assert_eq!(subscriber.current_email_index, 1);

        subscriber.advance();
        assert_eq!(subscriber.current_email_index, 2);
    }

    #[test]
    fn test_subscriber_completion() {
        let mut subscriber = SequenceSubscriber::new(
            "seq123".to_string(),
            "user456".to_string(),
            "user@example.com".to_string(),
        );

        subscriber.complete();
        assert_eq!(subscriber.status, SubscriberStatus::Completed);
        assert!(subscriber.completed_at.is_some());
    }

    #[test]
    fn test_subscriber_unsubscribe() {
        let mut subscriber = SequenceSubscriber::new(
            "seq123".to_string(),
            "user456".to_string(),
            "user@example.com".to_string(),
        );

        subscriber.unsubscribe();
        assert_eq!(subscriber.status, SubscriberStatus::Unsubscribed);
        assert!(subscriber.unsubscribed_at.is_some());
    }

    #[test]
    fn test_stats_record_send() {
        let mut stats = SequenceStats::default();
        stats.record_send();
        assert_eq!(stats.total_emails_sent, 1);
    }

    #[test]
    fn test_stats_record_open() {
        let mut stats = SequenceStats::default();
        stats.record_send();
        stats.record_open();

        assert_eq!(stats.total_opens, 1);
        assert_eq!(stats.open_rate, 100.0);
    }

    #[test]
    fn test_stats_record_click() {
        let mut stats = SequenceStats::default();
        stats.record_send();
        stats.record_send();
        stats.record_click();

        assert_eq!(stats.total_clicks, 1);
        assert_eq!(stats.click_rate, 50.0);
    }

    #[test]
    fn test_email_with_conditions() {
        let email = SequenceEmail::new(
            "seq123".to_string(),
            1,
            "Test".to_string(),
            "John".to_string(),
            "john@example.com".to_string(),
            "<p>Test</p>".to_string(),
            EmailDelay::Immediate,
        )
        .add_condition(EmailCondition::HasTag {
            tag: "vip".to_string(),
        });

        assert_eq!(email.conditions.len(), 1);
    }

    #[test]
    fn test_sequence_total_duration() {
        let trigger = SequenceTrigger::Manual;
        let mut sequence = EmailSequence::new("Test".to_string(), trigger);

        let email1 = SequenceEmail::new(
            sequence.id.clone(),
            1,
            "Email 1".to_string(),
            "John".to_string(),
            "john@example.com".to_string(),
            "<p>Test</p>".to_string(),
            EmailDelay::Duration {
                days: 1,
                hours: 0,
                minutes: 0,
            },
        );

        let email2 = SequenceEmail::new(
            sequence.id.clone(),
            2,
            "Email 2".to_string(),
            "John".to_string(),
            "john@example.com".to_string(),
            "<p>Test</p>".to_string(),
            EmailDelay::Duration {
                days: 2,
                hours: 0,
                minutes: 0,
            },
        );

        sequence.add_email(email1);
        sequence.add_email(email2);

        let total = sequence.total_duration();
        assert_eq!(total, Duration::days(3));
    }
}
