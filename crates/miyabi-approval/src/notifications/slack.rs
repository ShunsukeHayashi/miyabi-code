//! Slack webhook integration

use super::{
    ApprovalRequest, MessageFormatter, Notifier, PlainTextFormatter, WorkflowStatusUpdate,
};
use crate::error::{ApprovalError, Result};
use serde::{Deserialize, Serialize};

/// Slack webhook notifier
pub struct SlackNotifier {
    webhook_url: String,
    client: reqwest::Client,
    formatter: Box<dyn MessageFormatter + Send + Sync>,
}

/// Slack block structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackBlock {
    #[serde(rename = "type")]
    pub block_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<SlackText>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<SlackText>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accessory: Option<SlackAccessory>,
}

/// Slack text structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackText {
    #[serde(rename = "type")]
    pub text_type: String,
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emoji: Option<bool>,
}

/// Slack accessory (for buttons)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlackAccessory {
    #[serde(rename = "type")]
    pub accessory_type: String,
    pub text: SlackText,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
}

/// Slack webhook payload
#[derive(Debug, Clone, Serialize, Deserialize)]
struct SlackPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    blocks: Option<Vec<SlackBlock>>,
}

impl SlackNotifier {
    /// Create a new Slack notifier
    pub fn new(webhook_url: impl Into<String>) -> Self {
        Self {
            webhook_url: webhook_url.into(),
            client: reqwest::Client::new(),
            formatter: Box::new(PlainTextFormatter),
        }
    }

    /// Create with custom formatter
    pub fn with_formatter(
        webhook_url: impl Into<String>,
        formatter: impl MessageFormatter + Send + Sync + 'static,
    ) -> Self {
        Self {
            webhook_url: webhook_url.into(),
            client: reqwest::Client::new(),
            formatter: Box::new(formatter),
        }
    }

    /// Send Slack blocks
    pub async fn send_blocks(&self, blocks: Vec<SlackBlock>) -> Result<()> {
        let payload = SlackPayload {
            text: None,
            blocks: Some(blocks),
        };

        self.send_payload(&payload).await
    }

    /// Send a plain text message
    pub async fn send_text(&self, content: impl Into<String>) -> Result<()> {
        let payload = SlackPayload {
            text: Some(content.into()),
            blocks: None,
        };

        self.send_payload(&payload).await
    }

    /// Send payload to Slack webhook
    async fn send_payload(&self, payload: &SlackPayload) -> Result<()> {
        let response = self
            .client
            .post(&self.webhook_url)
            .json(payload)
            .send()
            .await
            .map_err(|e| ApprovalError::Other(format!("Slack webhook request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(ApprovalError::Other(format!(
                "Slack webhook failed with status {}: {}",
                status, body
            )));
        }

        Ok(())
    }

    /// Build approval request blocks
    fn build_approval_blocks(&self, req: &ApprovalRequest) -> Vec<SlackBlock> {
        let mut blocks = vec![
            // Header
            SlackBlock {
                block_type: "header".to_string(),
                text: Some(SlackText {
                    text_type: "plain_text".to_string(),
                    text: format!("🔔 Approval Request: {}", req.title),
                    emoji: Some(true),
                }),
                fields: None,
                accessory: None,
            },
            // Description
            SlackBlock {
                block_type: "section".to_string(),
                text: Some(SlackText {
                    text_type: "mrkdwn".to_string(),
                    text: req.details.clone(),
                    emoji: None,
                }),
                fields: None,
                accessory: None,
            },
            // Fields
            SlackBlock {
                block_type: "section".to_string(),
                text: None,
                fields: Some(vec![
                    SlackText {
                        text_type: "mrkdwn".to_string(),
                        text: format!("*Workflow ID:*\n{}", req.workflow_id),
                        emoji: None,
                    },
                    SlackText {
                        text_type: "mrkdwn".to_string(),
                        text: format!("*Requester:*\n{}", req.requester),
                        emoji: None,
                    },
                    SlackText {
                        text_type: "mrkdwn".to_string(),
                        text: format!(
                            "*Required Approvers:*\n{}",
                            req.required_approvers.join(", ")
                        ),
                        emoji: None,
                    },
                    SlackText {
                        text_type: "mrkdwn".to_string(),
                        text: format!("*Timeout:*\n{} seconds", req.timeout_seconds),
                        emoji: None,
                    },
                ]),
                accessory: None,
            },
            // Divider
            SlackBlock {
                block_type: "divider".to_string(),
                text: None,
                fields: None,
                accessory: None,
            },
        ];

        // Add approve button if URL provided
        if let Some(url) = &req.approve_url {
            blocks.push(SlackBlock {
                block_type: "section".to_string(),
                text: Some(SlackText {
                    text_type: "mrkdwn".to_string(),
                    text: "Ready to approve?".to_string(),
                    emoji: None,
                }),
                fields: None,
                accessory: Some(SlackAccessory {
                    accessory_type: "button".to_string(),
                    text: SlackText {
                        text_type: "plain_text".to_string(),
                        text: "✅ Approve".to_string(),
                        emoji: Some(true),
                    },
                    url: Some(url.clone()),
                    value: Some("approve".to_string()),
                }),
            });
        }

        // Add reject button if URL provided
        if let Some(url) = &req.reject_url {
            blocks.push(SlackBlock {
                block_type: "section".to_string(),
                text: Some(SlackText {
                    text_type: "mrkdwn".to_string(),
                    text: "Need to reject?".to_string(),
                    emoji: None,
                }),
                fields: None,
                accessory: Some(SlackAccessory {
                    accessory_type: "button".to_string(),
                    text: SlackText {
                        text_type: "plain_text".to_string(),
                        text: "❌ Reject".to_string(),
                        emoji: Some(true),
                    },
                    url: Some(url.clone()),
                    value: Some("reject".to_string()),
                }),
            });
        }

        blocks
    }

    /// Build status update blocks
    fn build_status_blocks(&self, status: &WorkflowStatusUpdate) -> Vec<SlackBlock> {
        let mut blocks = vec![
            // Header
            SlackBlock {
                block_type: "header".to_string(),
                text: Some(SlackText {
                    text_type: "plain_text".to_string(),
                    text: format!("{} Workflow Status Update", status.status_emoji()),
                    emoji: Some(true),
                }),
                fields: None,
                accessory: None,
            },
            // Fields
            SlackBlock {
                block_type: "section".to_string(),
                text: None,
                fields: Some(vec![
                    SlackText {
                        text_type: "mrkdwn".to_string(),
                        text: format!("*Workflow ID:*\n{}", status.workflow_id),
                        emoji: None,
                    },
                    SlackText {
                        text_type: "mrkdwn".to_string(),
                        text: format!("*Status:*\n{} {}", status.status_emoji(), status.status),
                        emoji: None,
                    },
                    SlackText {
                        text_type: "mrkdwn".to_string(),
                        text: format!("*Duration:*\n{}", status.format_duration()),
                        emoji: None,
                    },
                ]),
                accessory: None,
            },
        ];

        // Add results if available
        if let Some(results) = &status.results {
            blocks.push(SlackBlock {
                block_type: "section".to_string(),
                text: Some(SlackText {
                    text_type: "mrkdwn".to_string(),
                    text: format!("*Results:*\n{}", results),
                    emoji: None,
                }),
                fields: None,
                accessory: None,
            });
        }

        // Add error if available
        if let Some(error) = &status.error {
            blocks.push(SlackBlock {
                block_type: "section".to_string(),
                text: Some(SlackText {
                    text_type: "mrkdwn".to_string(),
                    text: format!("*Error:*\n{}", error),
                    emoji: None,
                }),
                fields: None,
                accessory: None,
            });
        }

        blocks
    }
}

#[async_trait::async_trait]
impl Notifier for SlackNotifier {
    async fn send_approval_request(&self, req: &ApprovalRequest) -> Result<()> {
        let blocks = self.build_approval_blocks(req);
        self.send_blocks(blocks).await
    }

    async fn send_status_update(&self, status: &WorkflowStatusUpdate) -> Result<()> {
        let blocks = self.build_status_blocks(status);
        self.send_blocks(blocks).await
    }

    async fn send_error(&self, error: &str) -> Result<()> {
        let blocks = vec![
            SlackBlock {
                block_type: "header".to_string(),
                text: Some(SlackText {
                    text_type: "plain_text".to_string(),
                    text: "❌ Error".to_string(),
                    emoji: Some(true),
                }),
                fields: None,
                accessory: None,
            },
            SlackBlock {
                block_type: "section".to_string(),
                text: Some(SlackText {
                    text_type: "mrkdwn".to_string(),
                    text: error.to_string(),
                    emoji: None,
                }),
                fields: None,
                accessory: None,
            },
        ];

        self.send_blocks(blocks).await
    }
}
