use serde::{Deserialize, Serialize};

/// サーバー作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateGuildRequest {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verification_level: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_message_notifications: Option<u8>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explicit_content_filter: Option<u8>,
}

/// サーバー情報取得リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetGuildRequest {
    pub guild_id: String,
}

/// カテゴリ作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub guild_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub position: Option<u32>,
}

/// 権限オーバーライト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionOverwrite {
    pub id: String,
    pub r#type: String, // "role" or "member"
    pub allow: u64,
    pub deny: u64,
}

/// テキストチャンネル作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTextChannelRequest {
    pub guild_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub topic: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nsfw: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate_limit_per_user: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permission_overwrites: Option<Vec<PermissionOverwrite>>,
}

/// 音声チャンネル作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateVoiceChannelRequest {
    pub guild_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bitrate: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_limit: Option<u32>,
}

/// フォーラムチャンネル作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateForumChannelRequest {
    pub guild_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub topic: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_reaction_emoji: Option<String>,
}

/// チャンネル権限更新リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateChannelPermissionsRequest {
    pub channel_id: String,
    pub overwrites: Vec<PermissionOverwrite>,
}

/// ロール作成リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRoleRequest {
    pub guild_id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hoist: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permissions: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mentionable: Option<bool>,
}

/// ロール割り当てリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignRoleRequest {
    pub guild_id: String,
    pub user_id: String,
    pub role_id: String,
}

/// Embedフィールド
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbedField {
    pub name: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub inline: Option<bool>,
}

/// Embedフッター
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbedFooter {
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_url: Option<String>,
}

/// Embed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Embed {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fields: Option<Vec<EmbedField>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub footer: Option<EmbedFooter>,
}

/// メッセージ送信リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub channel_id: String,
    pub content: String,
}

/// Embedメッセージ送信リクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendEmbedRequest {
    pub channel_id: String,
    pub embeds: Vec<Embed>,
}

/// メッセージピン留めリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PinMessageRequest {
    pub channel_id: String,
    pub message_id: String,
}

/// メンバーキックリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KickMemberRequest {
    pub guild_id: String,
    pub user_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

/// メンバーBANリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BanMemberRequest {
    pub guild_id: String,
    pub user_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delete_message_days: Option<u8>,
}

/// メンバータイムアウトリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeoutMemberRequest {
    pub guild_id: String,
    pub user_id: String,
    pub duration_seconds: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

/// バッチセットアップ用のチャンネル定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchChannelDef {
    pub name: String,
    pub r#type: String, // "text", "voice", "forum"
}

/// バッチセットアップ用のカテゴリ定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchCategoryDef {
    pub name: String,
    pub channels: Vec<BatchChannelDef>,
}

/// バッチセットアップ用のロール定義
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchRoleDef {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub permissions: Option<u64>,
}

/// バッチセットアップリクエスト
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchSetupServerRequest {
    pub guild_id: String,
    pub categories: Vec<BatchCategoryDef>,
    pub roles: Vec<BatchRoleDef>,
}
