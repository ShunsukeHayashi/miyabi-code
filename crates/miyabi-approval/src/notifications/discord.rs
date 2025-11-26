//! Discord webhook integration

use super::{
    ApprovalRequest, MessageFormatter, Notifier, PlainTextFormatter, WorkflowStatusUpdate,
};
use crate::error::{ApprovalError, Result};
use serde::{Deserialize, Serialize};

/// Discord webhook notifier
pub struct DiscordNotifier {
    webhook_url: String,
    client: reqwest::Client,
    formatter: Box<dyn MessageFormatter + Send + Sync>,
}

/// Discord embed structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordEmbed {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<DiscordField>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub footer: Option<DiscordFooter>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<String>,
}

/// Discord embed field
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordField {
    pub name: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inline: Option<bool>,
}

/// Discord embed footer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscordFooter {
    pub text: String,
}

/// Discord webhook payload
#[derive(Debug, Clone, Serialize, Deserialize)]
struct DiscordPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    embeds: Option<Vec<DiscordEmbed>>,
}

impl DiscordNotifier {
    /// Create a new Discord notifier
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

    /// Send a Discord embed
    pub async fn send_embed(&self, embed: DiscordEmbed) -> Result<()> {
        self.send_embed_with_content(embed, None).await
    }

    /// Send a Discord embed with optional plain text content
    pub async fn send_embed_with_content(
        &self,
        embed: DiscordEmbed,
        content: Option<String>,
    ) -> Result<()> {
        let payload = DiscordPayload {
            content,
            embeds: Some(vec![embed]),
        };

        self.send_payload(&payload).await
    }

    /// Send a plain text message
    pub async fn send_text(&self, content: impl Into<String>) -> Result<()> {
        let payload = DiscordPayload {
            content: Some(content.into()),
            embeds: None,
        };

        self.send_payload(&payload).await
    }

    /// Send payload to Discord webhook
    async fn send_payload(&self, payload: &DiscordPayload) -> Result<()> {
        let response = self
            .client
            .post(&self.webhook_url)
            .json(payload)
            .send()
            .await
            .map_err(|e| ApprovalError::Other(format!("Discord webhook request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(ApprovalError::Other(format!(
                "Discord webhook failed with status {}: {}",
                status, body
            )));
        }

        Ok(())
    }

    /// Build approval request embed
    fn build_approval_embed(&self, req: &ApprovalRequest) -> DiscordEmbed {
        let mut fields = vec![
            DiscordField {
                name: "Workflow ID".to_string(),
                value: req.workflow_id.clone(),
                inline: Some(true),
            },
            DiscordField {
                name: "Requester".to_string(),
                value: req.requester.clone(),
                inline: Some(true),
            },
            DiscordField {
                name: "Required Approvers".to_string(),
                value: req.required_approvers.join(", "),
                inline: Some(false),
            },
            DiscordField {
                name: "Timeout".to_string(),
                value: format!("{} seconds", req.timeout_seconds),
                inline: Some(true),
            },
        ];

        if let Some(url) = &req.approve_url {
            fields.push(DiscordField {
                name: "Approve".to_string(),
                value: format!("[Click here]({})", url),
                inline: Some(true),
            });
        }

        if let Some(url) = &req.reject_url {
            fields.push(DiscordField {
                name: "Reject".to_string(),
                value: format!("[Click here]({})", url),
                inline: Some(true),
            });
        }

        DiscordEmbed {
            title: Some(format!("🔔 Approval Request: {}", req.title)),
            description: Some(req.details.clone()),
            color: Some(0x3498db), // Blue
            fields: Some(fields),
            footer: Some(DiscordFooter {
                text: "Miyabi Approval System".to_string(),
            }),
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
        }
    }

    /// Build status update embed
    fn build_status_embed(&self, status: &WorkflowStatusUpdate) -> DiscordEmbed {
        let mut fields = vec![
            DiscordField {
                name: "Workflow ID".to_string(),
                value: status.workflow_id.clone(),
                inline: Some(true),
            },
            DiscordField {
                name: "Status".to_string(),
                value: format!("{} {}", status.status_emoji(), status.status),
                inline: Some(true),
            },
            DiscordField {
                name: "Duration".to_string(),
                value: status.format_duration(),
                inline: Some(true),
            },
        ];

        if let Some(results) = &status.results {
            fields.push(DiscordField {
                name: "Results".to_string(),
                value: results.clone(),
                inline: Some(false),
            });
        }

        if let Some(error) = &status.error {
            fields.push(DiscordField {
                name: "Error".to_string(),
                value: error.clone(),
                inline: Some(false),
            });
        }

        DiscordEmbed {
            title: Some(format!("{} Workflow Status Update", status.status_emoji())),
            description: None,
            color: Some(status.status_color()),
            fields: Some(fields),
            footer: Some(DiscordFooter {
                text: "Miyabi Approval System".to_string(),
            }),
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
        }
    }
}

#[async_trait::async_trait]
impl Notifier for DiscordNotifier {
    async fn send_approval_request(&self, req: &ApprovalRequest) -> Result<()> {
        let embed = self.build_approval_embed(req);
        let content = self.formatter.format_approval_request(req);
        self.send_embed_with_content(embed, Some(content)).await
    }

    async fn send_status_update(&self, status: &WorkflowStatusUpdate) -> Result<()> {
        let embed = self.build_status_embed(status);
        let content = self.formatter.format_status_update(status);
        self.send_embed_with_content(embed, Some(content)).await
    }

    async fn send_error(&self, error: &str) -> Result<()> {
        let embed = DiscordEmbed {
            title: Some("❌ Error".to_string()),
            description: Some(error.to_string()),
            color: Some(0xe74c3c), // Red
            fields: None,
            footer: Some(DiscordFooter {
                text: "Miyabi Approval System".to_string(),
            }),
            timestamp: Some(chrono::Utc::now().to_rfc3339()),
        };

        let content = self.formatter.format_error(error);
        self.send_embed_with_content(embed, Some(content)).await
    }
}
