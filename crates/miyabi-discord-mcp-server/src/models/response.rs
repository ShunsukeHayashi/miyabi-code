use serde::{Deserialize, Serialize};

/// サーバー作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGuildResponse {
    pub guild_id: String,
    pub name: String,
    pub owner_id: String,
    pub created_at: String,
}

/// チャンネル情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelInfo {
    pub channel_id: String,
    pub name: String,
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

/// ロール情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleInfo {
    pub role_id: String,
    pub name: String,
    pub color: u32,
    pub permissions: u64,
}

/// サーバー情報レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetGuildResponse {
    pub guild_id: String,
    pub name: String,
    pub owner_id: String,
    pub member_count: u32,
    pub channels: Vec<ChannelInfo>,
    pub roles: Vec<RoleInfo>,
}

/// カテゴリ作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryResponse {
    pub channel_id: String,
    pub name: String,
    pub r#type: String,
}

/// テキストチャンネル作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTextChannelResponse {
    pub channel_id: String,
    pub name: String,
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

/// 音声チャンネル作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVoiceChannelResponse {
    pub channel_id: String,
    pub name: String,
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

/// フォーラムチャンネル作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateForumChannelResponse {
    pub channel_id: String,
    pub name: String,
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
}

/// ロール作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRoleResponse {
    pub role_id: String,
    pub name: String,
    pub color: u32,
    pub permissions: u64,
}

/// メッセージ送信レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageResponse {
    pub message_id: String,
    pub channel_id: String,
    pub content: String,
    pub timestamp: String,
}

/// バッチセットアップレスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSetupServerResponse {
    pub categories: Vec<ChannelInfo>,
    pub channels: Vec<ChannelInfo>,
    pub roles: Vec<RoleInfo>,
}

/// ヘルスチェックレスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub discord_api_connected: bool,
    pub rate_limit_remaining: u32,
    pub version: String,
}
