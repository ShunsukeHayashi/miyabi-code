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
        // TODO: 実装
    }

    /// ロール関連メソッドを登録
    fn register_role_methods(&mut self) {
        // TODO: 実装
    }

    /// メッセージ関連メソッドを登録
    fn register_message_methods(&mut self) {
        // TODO: 実装
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
