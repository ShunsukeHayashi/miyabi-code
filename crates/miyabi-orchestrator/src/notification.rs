//! Notification system for Phase 1 completion and escalation events

use anyhow::Result;
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

/// Notification type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NotificationType {
    /// Phase 1 completed successfully
    Phase1Complete,
    /// High complexity - escalated to human
    Escalation,
    /// Error occurred during execution
    Error,
}

/// Notification message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    /// Notification type
    pub notification_type: NotificationType,
    /// Issue number
    pub issue_number: u64,
    /// Title/summary
    pub title: String,
    /// Detailed message
    pub message: String,
    /// Optional metadata
    pub metadata: Option<serde_json::Value>,
}

impl Notification {
    /// Create a Phase 1 completion notification
    pub fn phase1_complete(issue_number: u64, complexity: f64, labels: Vec<String>) -> Self {
        Self {
            notification_type: NotificationType::Phase1Complete,
            issue_number,
            title: format!("Phase 1 Complete: Issue #{}", issue_number),
            message: format!(
                "Issue #{} analyzed successfully.\nComplexity: {:.1}/10.0\nLabels: {}",
                issue_number,
                complexity,
                labels.join(", ")
            ),
            metadata: serde_json::json!({
                "complexity": complexity,
                "labels": labels,
            })
            .into(),
        }
    }

    /// Create an escalation notification
    pub fn escalation(issue_number: u64, complexity: f64, reason: String) -> Self {
        Self {
            notification_type: NotificationType::Escalation,
            issue_number,
            title: format!("🚨 Escalation Required: Issue #{}", issue_number),
            message: format!(
                "Issue #{} requires human review.\nComplexity: {:.1}/10.0\nReason: {}",
                issue_number, complexity, reason
            ),
            metadata: serde_json::json!({
                "complexity": complexity,
                "reason": reason,
            })
            .into(),
        }
    }

    /// Create an error notification
    pub fn error(issue_number: u64, error_message: String) -> Self {
        Self {
            notification_type: NotificationType::Error,
            issue_number,
            title: format!("❌ Error: Issue #{}", issue_number),
            message: format!("Error occurred while processing Issue #{}:\n{}", issue_number, error_message),
            metadata: serde_json::json!({
                "error": error_message,
            })
            .into(),
        }
    }
}

/// Notification service
pub struct NotificationService {
    /// Discord webhook URL (optional)
    discord_webhook: Option<String>,
    /// Slack webhook URL (optional)
    slack_webhook: Option<String>,
    /// Enable notifications
    enabled: bool,
}

impl NotificationService {
    /// Create a new notification service
    pub fn new() -> Self {
        Self { discord_webhook: None, slack_webhook: None, enabled: false }
    }

    /// Enable Discord notifications
    pub fn with_discord(mut self, webhook_url: String) -> Self {
        self.discord_webhook = Some(webhook_url);
        self.enabled = true;
        self
    }

    /// Enable Slack notifications
    pub fn with_slack(mut self, webhook_url: String) -> Self {
        self.slack_webhook = Some(webhook_url);
        self.enabled = true;
        self
    }

    /// Send a notification
    pub async fn send(&self, notification: &Notification) -> Result<()> {
        if !self.enabled {
            info!("📢 Notification (disabled): {}", notification.title);
            info!("   {}", notification.message);
            return Ok(());
        }

        info!("📢 Sending notification: {}", notification.title);

        // Send to Discord if configured
        if let Some(webhook) = &self.discord_webhook {
            self.send_to_discord(webhook, notification).await?;
        }

        // Send to Slack if configured
        if let Some(webhook) = &self.slack_webhook {
            self.send_to_slack(webhook, notification).await?;
        }

        Ok(())
    }

    /// Send notification to Discord
    async fn send_to_discord(&self, webhook_url: &str, notification: &Notification) -> Result<()> {
        // For now, just log (would use reqwest in production)
        info!("   → Discord webhook: {}", webhook_url);
        info!("   → Message: {}", notification.message);

        // TODO: Implement actual Discord webhook call
        // let client = reqwest::Client::new();
        // client.post(webhook_url)
        //     .json(&discord_payload)
        //     .send()
        //     .await?;

        warn!("   Discord webhook not implemented yet (logged only)");
        Ok(())
    }

    /// Send notification to Slack
    async fn send_to_slack(&self, webhook_url: &str, notification: &Notification) -> Result<()> {
        // For now, just log (would use reqwest in production)
        info!("   → Slack webhook: {}", webhook_url);
        info!("   → Message: {}", notification.message);

        // TODO: Implement actual Slack webhook call
        // let client = reqwest::Client::new();
        // client.post(webhook_url)
        //     .json(&slack_payload)
        //     .send()
        //     .await?;

        warn!("   Slack webhook not implemented yet (logged only)");
        Ok(())
    }
}

impl Default for NotificationService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_notification_phase1_complete() {
        let notification =
            Notification::phase1_complete(123, 4.5, vec!["type:feature".to_string(), "priority:P2-Medium".to_string()]);

        assert_eq!(notification.notification_type, NotificationType::Phase1Complete);
        assert_eq!(notification.issue_number, 123);
        assert!(notification.title.contains("Phase 1 Complete"));
        assert!(notification.message.contains("4.5"));
    }

    #[test]
    fn test_notification_escalation() {
        let notification = Notification::escalation(456, 8.5, "High complexity requires review".to_string());

        assert_eq!(notification.notification_type, NotificationType::Escalation);
        assert_eq!(notification.issue_number, 456);
        assert!(notification.title.contains("Escalation"));
        assert!(notification.message.contains("8.5"));
    }

    #[test]
    fn test_notification_error() {
        let notification = Notification::error(789, "GitHub API error".to_string());

        assert_eq!(notification.notification_type, NotificationType::Error);
        assert_eq!(notification.issue_number, 789);
        assert!(notification.title.contains("Error"));
    }

    #[tokio::test]
    async fn test_notification_service_disabled() {
        let service = NotificationService::new();
        let notification = Notification::phase1_complete(123, 4.5, vec![]);

        let result = service.send(&notification).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_notification_service_with_discord() {
        let service = NotificationService::new().with_discord("https://discord.com/webhook/test".to_string());

        let notification = Notification::phase1_complete(123, 4.5, vec![]);
        let result = service.send(&notification).await;

        // Should succeed (but not actually send in test mode)
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_notification_service_with_slack() {
        let service = NotificationService::new().with_slack("https://hooks.slack.com/services/test".to_string());

        let notification = Notification::phase1_complete(123, 4.5, vec![]);
        let result = service.send(&notification).await;

        // Should succeed (but not actually send in test mode)
        assert!(result.is_ok());
    }
}
