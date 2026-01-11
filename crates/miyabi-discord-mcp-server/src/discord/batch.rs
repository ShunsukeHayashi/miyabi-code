//! Batch operations for Discord server setup
//!
//! Provides batch operations to set up multiple categories, channels, and roles
//! in a single request.

use crate::discord::DiscordClient;
use crate::error::Result;
use crate::models::*;

impl DiscordClient {
    /// Batch setup server with categories, channels, and roles
    ///
    /// Creates categories first, then channels under each category,
    /// and finally roles. Returns all created resources.
    pub async fn batch_setup_server(
        &self,
        request: BatchSetupServerRequest,
    ) -> Result<BatchSetupServerResponse> {
        tracing::info!(
            "Starting batch setup for guild {}: {} categories, {} roles",
            request.guild_id,
            request.categories.len(),
            request.roles.len()
        );

        let mut created_categories = Vec::new();
        let mut created_channels = Vec::new();
        let mut created_roles = Vec::new();

        // Step 1: Create roles first (they might be needed for permissions)
        for role_def in &request.roles {
            tracing::debug!("Creating role: {}", role_def.name);

            let role_request = CreateRoleRequest {
                guild_id: request.guild_id.clone(),
                name: role_def.name.clone(),
                color: role_def.color,
                hoist: Some(true),
                permissions: role_def.permissions,
                mentionable: Some(true),
            };

            match self.create_role(role_request).await {
                Ok(response) => {
                    created_roles.push(RoleInfo {
                        role_id: response.role_id,
                        name: response.name,
                        color: response.color,
                        permissions: response.permissions,
                    });
                }
                Err(e) => {
                    tracing::warn!("Failed to create role {}: {:?}", role_def.name, e);
                    // Continue with other roles
                }
            }
        }

        // Step 2: Create categories and their channels
        for category_def in &request.categories {
            tracing::debug!("Creating category: {}", category_def.name);

            // Create category
            let category_request = CreateCategoryRequest {
                guild_id: request.guild_id.clone(),
                name: category_def.name.clone(),
                position: None,
            };

            let category_response = match self.create_category(category_request).await {
                Ok(response) => {
                    created_categories.push(ChannelInfo {
                        channel_id: response.channel_id.clone(),
                        name: response.name.clone(),
                        r#type: response.r#type.clone(),
                        parent_id: None,
                    });
                    Some(response)
                }
                Err(e) => {
                    tracing::warn!("Failed to create category {}: {:?}", category_def.name, e);
                    None
                }
            };

            // Create channels under this category
            if let Some(category) = category_response {
                for channel_def in &category_def.channels {
                    tracing::debug!(
                        "Creating channel: {} (type: {}) under category {}",
                        channel_def.name,
                        channel_def.r#type,
                        category.name
                    );

                    let channel_result = match channel_def.r#type.as_str() {
                        "text" => {
                            let req = CreateTextChannelRequest {
                                guild_id: request.guild_id.clone(),
                                name: channel_def.name.clone(),
                                parent_id: Some(category.channel_id.clone()),
                                topic: None,
                                nsfw: None,
                                rate_limit_per_user: None,
                                permission_overwrites: None,
                            };
                            self.create_text_channel(req).await.map(|r| ChannelInfo {
                                channel_id: r.channel_id,
                                name: r.name,
                                r#type: r.r#type,
                                parent_id: r.parent_id,
                            })
                        }
                        "voice" => {
                            let req = CreateVoiceChannelRequest {
                                guild_id: request.guild_id.clone(),
                                name: channel_def.name.clone(),
                                parent_id: Some(category.channel_id.clone()),
                                bitrate: None,
                                user_limit: None,
                            };
                            self.create_voice_channel(req).await.map(|r| ChannelInfo {
                                channel_id: r.channel_id,
                                name: r.name,
                                r#type: r.r#type,
                                parent_id: r.parent_id,
                            })
                        }
                        "forum" => {
                            let req = CreateForumChannelRequest {
                                guild_id: request.guild_id.clone(),
                                name: channel_def.name.clone(),
                                parent_id: Some(category.channel_id.clone()),
                                topic: None,
                                default_reaction_emoji: None,
                            };
                            self.create_forum_channel(req).await.map(|r| ChannelInfo {
                                channel_id: r.channel_id,
                                name: r.name,
                                r#type: r.r#type,
                                parent_id: r.parent_id,
                            })
                        }
                        _ => {
                            tracing::warn!("Unknown channel type: {}", channel_def.r#type);
                            continue;
                        }
                    };

                    match channel_result {
                        Ok(info) => created_channels.push(info),
                        Err(e) => {
                            tracing::warn!(
                                "Failed to create channel {}: {:?}",
                                channel_def.name,
                                e
                            );
                        }
                    }
                }
            }
        }

        tracing::info!(
            "Batch setup complete: {} categories, {} channels, {} roles",
            created_categories.len(),
            created_channels.len(),
            created_roles.len()
        );

        Ok(BatchSetupServerResponse {
            categories: created_categories,
            channels: created_channels,
            roles: created_roles,
        })
    }
}
