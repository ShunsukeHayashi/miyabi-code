use crate::discord::DiscordClient;
use crate::models::*;
use jsonrpc_core::{Error, IoHandler, Params};
use std::sync::Arc;

/// JSON-RPC 2.0ハンドラー
pub struct RpcHandler {
    discord_client: Arc<DiscordClient>,
    io: IoHandler,
}

impl RpcHandler {
    /// 新しいRPCハンドラーを作成
    pub fn new(discord_client: Arc<DiscordClient>) -> Self {
        let io = IoHandler::new();
        let mut handler = Self { discord_client, io };

        // 全RPCメソッドを登録
        handler.register_guild_methods();
        handler.register_channel_methods();
        handler.register_role_methods();
        handler.register_message_methods();
        handler.register_batch_methods();
        handler.register_health_method();

        handler
    }

    /// サーバー（Guild）関連メソッドを登録
    fn register_guild_methods(&mut self) {
        let client = Arc::clone(&self.discord_client);

        // discord.guild.get
        self.io.add_method("discord.guild.get", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: GetGuildRequest = params.parse()?;
                client
                    .get_guild(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // TODO: 他のguildメソッドを追加
    }

    /// チャンネル関連メソッドを登録
    fn register_channel_methods(&mut self) {
        // discord.channel.create_category
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.channel.create_category", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: CreateCategoryRequest = params.parse()?;
                client
                    .create_category(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // discord.channel.create_text
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.channel.create_text", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: CreateTextChannelRequest = params.parse()?;
                client
                    .create_text_channel(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // discord.channel.create_voice
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.channel.create_voice", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: CreateVoiceChannelRequest = params.parse()?;
                client
                    .create_voice_channel(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // discord.channel.create_forum
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.channel.create_forum", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: CreateForumChannelRequest = params.parse()?;
                client
                    .create_forum_channel(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // discord.channel.update_permissions
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.channel.update_permissions", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: UpdateChannelPermissionsRequest = params.parse()?;
                client
                    .update_channel_permissions(request)
                    .await
                    .map(|_| serde_json::json!({"success": true}))
                    .map_err(|_e| Error::internal_error())
            }
        });
    }

    /// ロール関連メソッドを登録
    fn register_role_methods(&mut self) {
        // discord.role.create
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.role.create", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: CreateRoleRequest = params.parse()?;
                client
                    .create_role(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // discord.role.assign
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.role.assign", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: AssignRoleRequest = params.parse()?;
                client
                    .assign_role(request)
                    .await
                    .map(|_| serde_json::json!({"success": true}))
                    .map_err(|_e| Error::internal_error())
            }
        });
    }

    /// メッセージ関連メソッドを登録
    fn register_message_methods(&mut self) {
        // discord.message.send
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.message.send", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: SendMessageRequest = params.parse()?;
                client
                    .send_message(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // discord.message.send_embed
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.message.send_embed", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: SendEmbedRequest = params.parse()?;
                client
                    .send_embed(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });

        // discord.message.pin
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.message.pin", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: PinMessageRequest = params.parse()?;
                client
                    .pin_message(request)
                    .await
                    .map(|_| serde_json::json!({"success": true}))
                    .map_err(|_e| Error::internal_error())
            }
        });
    }

    /// バッチ関連メソッドを登録
    fn register_batch_methods(&mut self) {
        // discord.batch.setup_server
        let client = Arc::clone(&self.discord_client);
        self.io.add_method("discord.batch.setup_server", move |params: Params| {
            let client = Arc::clone(&client);
            async move {
                let request: BatchSetupServerRequest = params.parse()?;
                client
                    .batch_setup_server(request)
                    .await
                    .map(|res| serde_json::to_value(res).unwrap())
                    .map_err(|_e| Error::internal_error())
            }
        });
    }

    /// ヘルスチェックメソッドを登録
    fn register_health_method(&mut self) {
        let client = Arc::clone(&self.discord_client);

        self.io.add_method("discord.health", move |_params: Params| {
            let client = Arc::clone(&client);
            async move {
                let connected = client.health_check().await.unwrap_or(false);

                let response = HealthResponse {
                    status: if connected {
                        "healthy".to_string()
                    } else {
                        "unhealthy".to_string()
                    },
                    discord_api_connected: connected,
                    rate_limit_remaining: 50, // TODO: 実際のレート制限を取得
                    version: env!("CARGO_PKG_VERSION").to_string(),
                };

                Ok(serde_json::to_value(response).unwrap())
            }
        });
    }

    /// IoHandlerを取得
    pub fn io_handler(&self) -> &IoHandler {
        &self.io
    }
}
