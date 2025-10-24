use serde::{Deserialize, Serialize};

/// サーバー作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGuildResponse {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Name of the resource
    pub name: String,
    /// Owner Id
    pub owner_id: String,
    /// Creation timestamp
    pub created_at: String,
}

/// チャンネル情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelInfo {
    /// Discord channel ID
    pub channel_id: String,
    /// Name of the resource
    pub name: String,
    /// Type of resource ("role" or "member")
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Parent category/channel ID
    pub parent_id: Option<String>,
}

/// ロール情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleInfo {
    /// Discord role ID
    pub role_id: String,
    /// Name of the resource
    pub name: String,
    /// Role color (RGB integer)
    pub color: u32,
    /// Permission bitfield
    pub permissions: u64,
}

/// サーバー情報レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetGuildResponse {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Name of the resource
    pub name: String,
    /// Owner Id
    pub owner_id: String,
    /// Member count
    pub member_count: u32,
    /// Channels
    pub channels: Vec<ChannelInfo>,
    /// Roles
    pub roles: Vec<RoleInfo>,
}

/// カテゴリ作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryResponse {
    /// Discord channel ID
    pub channel_id: String,
    /// Name of the resource
    pub name: String,
    /// Type of resource ("role" or "member")
    pub r#type: String,
}

/// テキストチャンネル作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTextChannelResponse {
    /// Discord channel ID
    pub channel_id: String,
    /// Name of the resource
    pub name: String,
    /// Type of resource ("role" or "member")
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Parent category/channel ID
    pub parent_id: Option<String>,
}

/// 音声チャンネル作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVoiceChannelResponse {
    /// Discord channel ID
    pub channel_id: String,
    /// Name of the resource
    pub name: String,
    /// Type of resource ("role" or "member")
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Parent category/channel ID
    pub parent_id: Option<String>,
}

/// フォーラムチャンネル作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateForumChannelResponse {
    /// Discord channel ID
    pub channel_id: String,
    /// Name of the resource
    pub name: String,
    /// Type of resource ("role" or "member")
    pub r#type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Parent category/channel ID
    pub parent_id: Option<String>,
}

/// ロール作成レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRoleResponse {
    /// Discord role ID
    pub role_id: String,
    /// Name of the resource
    pub name: String,
    /// Role color (RGB integer)
    pub color: u32,
    /// Permission bitfield
    pub permissions: u64,
}

/// メッセージ送信レスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageResponse {
    /// Discord message ID
    pub message_id: String,
    /// Discord channel ID
    pub channel_id: String,
    /// Message content
    pub content: String,
    /// Timestamp
    pub timestamp: String,
}

/// バッチセットアップレスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSetupServerResponse {
    /// Categories
    pub categories: Vec<ChannelInfo>,
    /// Channels
    pub channels: Vec<ChannelInfo>,
    /// Roles
    pub roles: Vec<RoleInfo>,
}

/// ヘルスチェックレスポンス
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthResponse {
    /// Status
    pub status: String,
    /// Discord api connected
    pub discord_api_connected: bool,
    /// Rate Limit Remaining
    pub rate_limit_remaining: u32,
    /// Version
    pub version: String,
}
