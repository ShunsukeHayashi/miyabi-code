use serde::{Deserialize, Serialize};

/// サーバー作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGuildRequest {
    /// Name of the resource
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Base64-encoded icon image
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Server verification level (0-4)
    pub verification_level: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Default message notification level
    pub default_message_notifications: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Explicit content filter level
    pub explicit_content_filter: Option<u8>,
}

/// サーバー情報取得リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetGuildRequest {
    /// Discord server/guild ID
    pub guild_id: String,
}

/// カテゴリ作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Name of the resource
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Display position/order
    pub position: Option<u32>,
}

/// 権限オーバーライト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionOverwrite {
    /// Resource ID
    pub id: String,
    /// Type
    pub r#type: String, // "role" or "member"
    /// Allowed permission bits
    pub allow: u64,
    /// Deny
    pub deny: u64,
}

/// テキストチャンネル作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTextChannelRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Name of the resource
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Parent category/channel ID
    pub parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Channel topic/description
    pub topic: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Whether channel is marked as NSFW
    pub nsfw: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Slowmode delay in seconds
    pub rate_limit_per_user: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Permission overrides for roles/users
    pub permission_overwrites: Option<Vec<PermissionOverwrite>>,
}

/// 音声チャンネル作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVoiceChannelRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Name of the resource
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Parent category/channel ID
    pub parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Voice channel bitrate
    pub bitrate: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Maximum users in voice channel
    pub user_limit: Option<u32>,
}

/// フォーラムチャンネル作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateForumChannelRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Name of the resource
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Parent category/channel ID
    pub parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Channel topic/description
    pub topic: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Default reaction emoji for forum posts
    pub default_reaction_emoji: Option<String>,
}

/// チャンネル権限更新リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateChannelPermissionsRequest {
    /// Discord channel ID
    pub channel_id: String,
    /// Overwrites
    pub overwrites: Vec<PermissionOverwrite>,
}

/// ロール作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRoleRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Name of the resource
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Role color (RGB integer)
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Whether role is displayed separately
    pub hoist: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Permission bitfield
    pub permissions: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Whether role is mentionable
    pub mentionable: Option<bool>,
}

/// ロール割り当てリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignRoleRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Discord user ID
    pub user_id: String,
    /// Discord role ID
    pub role_id: String,
}

/// Embedフィールド
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbedField {
    /// Name of the resource
    pub name: String,
    /// Value
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Inline
    pub inline: Option<bool>,
}

/// Embedフッター
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbedFooter {
    /// Text
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Icon Url
    pub icon_url: Option<String>,
}

/// Embed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Embed {
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Embed title
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Description text
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Role color (RGB integer)
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Embed fields
    pub fields: Option<Vec<EmbedField>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Embed footer
    pub footer: Option<EmbedFooter>,
}

/// メッセージ送信リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    /// Discord channel ID
    pub channel_id: String,
    /// Message content
    pub content: String,
}

/// Embedメッセージ送信リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendEmbedRequest {
    /// Discord channel ID
    pub channel_id: String,
    /// Message embeds
    pub embeds: Vec<Embed>,
}

/// メッセージピン留めリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PinMessageRequest {
    /// Discord channel ID
    pub channel_id: String,
    /// Discord message ID
    pub message_id: String,
}

/// メンバーキックリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KickMemberRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Discord user ID
    pub user_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Reason
    pub reason: Option<String>,
}

/// メンバーBANリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BanMemberRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Discord user ID
    pub user_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Reason
    pub reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Delete Message Days
    pub delete_message_days: Option<u8>,
}

/// メンバータイムアウトリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeoutMemberRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Discord user ID
    pub user_id: String,
    /// Duration Seconds
    pub duration_seconds: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Reason
    pub reason: Option<String>,
}

/// バッチセットアップ用のチャンネル定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchChannelDef {
    /// Name of the resource
    pub name: String,
    /// Type
    pub r#type: String, // "text", "voice", "forum"
}

/// バッチセットアップ用のカテゴリ定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchCategoryDef {
    /// Name of the resource
    pub name: String,
    /// Channels
    pub channels: Vec<BatchChannelDef>,
}

/// バッチセットアップ用のロール定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchRoleDef {
    /// Name of the resource
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Role color (RGB integer)
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Permission bitfield
    pub permissions: Option<u64>,
}

/// バッチセットアップリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSetupServerRequest {
    /// Discord server/guild ID
    pub guild_id: String,
    /// Categories
    pub categories: Vec<BatchCategoryDef>,
    /// Roles
    pub roles: Vec<BatchRoleDef>,
}
