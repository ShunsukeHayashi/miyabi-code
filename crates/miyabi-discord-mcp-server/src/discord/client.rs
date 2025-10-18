use crate::error::Result;
use std::sync::Arc;
use twilight_http::Client;

/// Discord APIクライアント
pub struct DiscordClient {
    http: Arc<Client>,
}

impl DiscordClient {
    /// 新しいクライアントを作成
    ///
    /// # 引数
    ///
    /// * `token` - Discord Bot Token
    ///
    /// # 例
    ///
    /// ```no_run
    /// use miyabi_discord_mcp_server::discord::DiscordClient;
    ///
    /// let client = DiscordClient::new("YOUR_BOT_TOKEN".to_string());
    /// ```
    pub fn new(token: String) -> Self {
        let http = Arc::new(Client::new(token));
        Self { http }
    }

    /// HTTPクライアントの参照を取得
    pub fn http(&self) -> &Arc<Client> {
        &self.http
    }

    /// ヘルスチェック
    pub async fn health_check(&self) -> Result<bool> {
        // 簡単なAPI呼び出しでヘルスチェック
        // 例: Get Current User
        match self.http.current_user().await {
            Ok(_) => Ok(true),
            Err(e) => {
                tracing::error!("Health check failed: {}", e);
                Ok(false)
            }
        }
    }
}
