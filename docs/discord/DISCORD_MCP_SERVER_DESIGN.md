# Miyabi Discord MCP Server 設計書

**Version**: 1.0.0
**作成日**: 2025-10-18
**担当**: Claude Code
**関連Issue**: #213

---

## 📋 目次

1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [JSON-RPC 2.0 API仕様](#json-rpc-20-api仕様)
4. [実装計画](#実装計画)
5. [セキュリティ](#セキュリティ)
6. [使用例](#使用例)

---

## 概要

### 🎯 目的

**「Discord API をJSON-RPC 2.0インターフェースでラップし、Miyabiから簡単にDiscordサーバーを操作できるようにする」**

### 主要機能

1. **サーバー管理**
   - サーバー作成
   - サーバー設定更新
   - サーバー情報取得

2. **チャンネル管理**
   - カテゴリ作成
   - テキストチャンネル作成
   - 音声チャンネル作成
   - フォーラムチャンネル作成
   - チャンネル権限設定

3. **ロール管理**
   - ロール作成
   - ロール権限設定
   - メンバーへのロール付与

4. **メッセージ管理**
   - メッセージ送信
   - Embed送信
   - ピン留め管理

5. **モデレーション**
   - メンバーキック
   - メンバーBAN
   - タイムアウト設定

---

## アーキテクチャ

### 🏗️ システム構成

```
┌─────────────────────────────────────────────────┐
│         Claude Code / Miyabi CLI                 │
│  - コマンド実行                                    │
│  - スクリプト実行                                  │
└────────────────────┬────────────────────────────┘
                     │
                     │ JSON-RPC 2.0
                     ▼
┌─────────────────────────────────────────────────┐
│     Miyabi Discord MCP Server (Rust)             │
│  - JSON-RPC 2.0 Handler                         │
│  - Discord API Wrapper                          │
│  - Rate Limiter                                 │
└────────────────────┬────────────────────────────┘
                     │
                     │ Discord REST API
                     ▼
┌─────────────────────────────────────────────────┐
│              Discord API                         │
│  - Servers (Guilds)                             │
│  - Channels                                     │
│  - Roles                                        │
│  - Members                                      │
└─────────────────────────────────────────────────┘
```

---

### Crate構造

```
crates/miyabi-discord-mcp-server/
├── Cargo.toml
├── src/
│   ├── main.rs              # エントリーポイント
│   ├── lib.rs               # ライブラリルート
│   ├── rpc/
│   │   ├── mod.rs
│   │   ├── handler.rs       # JSON-RPC 2.0ハンドラー
│   │   └── methods.rs       # RPCメソッド実装
│   ├── discord/
│   │   ├── mod.rs
│   │   ├── client.rs        # Discord APIクライアント
│   │   ├── guild.rs         # サーバー操作
│   │   ├── channel.rs       # チャンネル操作
│   │   ├── role.rs          # ロール操作
│   │   └── message.rs       # メッセージ操作
│   ├── models/
│   │   ├── mod.rs
│   │   ├── request.rs       # リクエスト型
│   │   └── response.rs      # レスポンス型
│   └── error.rs             # エラー型
└── tests/
    └── integration_test.rs
```

---

## JSON-RPC 2.0 API仕様

### 📡 メソッド一覧

#### 1. サーバー管理

##### `discord.guild.create`

**説明**: 新しいDiscordサーバーを作成

**パラメータ**:
```json
{
  "name": "Miyabi Community",
  "icon": "data:image/png;base64,...",  // optional
  "verification_level": 2,               // optional (0-4)
  "default_message_notifications": 0,    // optional (0-1)
  "explicit_content_filter": 2           // optional (0-2)
}
```

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "guild_id": "1234567890",
    "name": "Miyabi Community",
    "owner_id": "9876543210",
    "created_at": "2025-10-18T10:00:00Z"
  }
}
```

---

##### `discord.guild.get`

**説明**: サーバー情報取得

**パラメータ**:
```json
{
  "guild_id": "1234567890"
}
```

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "guild_id": "1234567890",
    "name": "Miyabi Community",
    "owner_id": "9876543210",
    "member_count": 42,
    "channels": [...],
    "roles": [...]
  }
}
```

---

#### 2. チャンネル管理

##### `discord.channel.create_category`

**説明**: カテゴリ作成

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "name": "WELCOME & RULES",
  "position": 0
}
```

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "channel_id": "1111111111",
    "name": "WELCOME & RULES",
    "type": "category"
  }
}
```

---

##### `discord.channel.create_text`

**説明**: テキストチャンネル作成

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "parent_id": "1111111111",  // category ID
  "name": "welcome",
  "topic": "Welcome to Miyabi Community!",
  "nsfw": false,
  "rate_limit_per_user": 0,
  "permission_overwrites": [
    {
      "id": "role_id_or_user_id",
      "type": "role",  // or "member"
      "allow": 1024,   // VIEW_CHANNEL
      "deny": 2048     // SEND_MESSAGES
    }
  ]
}
```

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "channel_id": "2222222222",
    "name": "welcome",
    "type": "text",
    "parent_id": "1111111111"
  }
}
```

---

##### `discord.channel.create_voice`

**説明**: 音声チャンネル作成

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "parent_id": "1111111111",
  "name": "🎤 General Voice",
  "bitrate": 64000,
  "user_limit": 0  // 0 = unlimited
}
```

---

##### `discord.channel.create_forum`

**説明**: フォーラムチャンネル作成

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "parent_id": "1111111111",
  "name": "faq",
  "topic": "Frequently Asked Questions",
  "default_reaction_emoji": "❓"
}
```

---

##### `discord.channel.update_permissions`

**説明**: チャンネル権限更新

**パラメータ**:
```json
{
  "channel_id": "2222222222",
  "overwrites": [
    {
      "id": "role_id",
      "type": "role",
      "allow": 1024,  // VIEW_CHANNEL
      "deny": 2048    // SEND_MESSAGES
    }
  ]
}
```

---

#### 3. ロール管理

##### `discord.role.create`

**説明**: ロール作成

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "name": "Moderator",
  "color": 16744448,  // 0xFF8000 (orange)
  "hoist": true,      // display separately
  "permissions": 8,   // ADMINISTRATOR
  "mentionable": true
}
```

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "role_id": "3333333333",
    "name": "Moderator",
    "color": 16744448,
    "permissions": 8
  }
}
```

---

##### `discord.role.assign`

**説明**: メンバーにロール付与

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "user_id": "9876543210",
  "role_id": "3333333333"
}
```

---

#### 4. メッセージ管理

##### `discord.message.send`

**説明**: メッセージ送信

**パラメータ**:
```json
{
  "channel_id": "2222222222",
  "content": "Welcome to Miyabi Community! 🎉"
}
```

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "message_id": "4444444444",
    "channel_id": "2222222222",
    "content": "Welcome to Miyabi Community! 🎉",
    "timestamp": "2025-10-18T10:00:00Z"
  }
}
```

---

##### `discord.message.send_embed`

**説明**: Embedメッセージ送信

**パラメータ**:
```json
{
  "channel_id": "2222222222",
  "embeds": [
    {
      "title": "📜 Miyabi Community Rules",
      "description": "Please read and follow these rules.",
      "color": 5814783,  // 0x58B9FF (blue)
      "fields": [
        {
          "name": "Rule 1",
          "value": "Be respectful",
          "inline": false
        }
      ],
      "footer": {
        "text": "Last updated: 2025-10-18"
      }
    }
  ]
}
```

---

##### `discord.message.pin`

**説明**: メッセージをピン留め

**パラメータ**:
```json
{
  "channel_id": "2222222222",
  "message_id": "4444444444"
}
```

---

#### 5. モデレーション

##### `discord.moderation.kick`

**説明**: メンバーをキック

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "user_id": "9876543210",
  "reason": "Violation of rules"
}
```

---

##### `discord.moderation.ban`

**説明**: メンバーをBAN

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "user_id": "9876543210",
  "reason": "Serious violation",
  "delete_message_days": 7
}
```

---

##### `discord.moderation.timeout`

**説明**: メンバーをタイムアウト

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "user_id": "9876543210",
  "duration_seconds": 3600,  // 1 hour
  "reason": "Spam"
}
```

---

#### 6. バッチ操作

##### `discord.batch.setup_server`

**説明**: サーバーを一括セットアップ（カテゴリ、チャンネル、ロール）

**パラメータ**:
```json
{
  "guild_id": "1234567890",
  "categories": [
    {
      "name": "WELCOME & RULES",
      "channels": [
        {"name": "welcome", "type": "text"},
        {"name": "rules", "type": "text"}
      ]
    }
  ],
  "roles": [
    {"name": "Admin", "color": 16711680, "permissions": 8},
    {"name": "Moderator", "color": 16744448, "permissions": 2146958591}
  ]
}
```

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "categories": [
      {"category_id": "1111111111", "name": "WELCOME & RULES"}
    ],
    "channels": [
      {"channel_id": "2222222222", "name": "welcome"},
      {"channel_id": "2222222223", "name": "rules"}
    ],
    "roles": [
      {"role_id": "3333333333", "name": "Admin"},
      {"role_id": "3333333334", "name": "Moderator"}
    ]
  }
}
```

---

#### 7. ヘルスチェック

##### `discord.health`

**説明**: MCP Server ヘルスチェック

**パラメータ**: なし

**レスポンス**:
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "result": {
    "status": "healthy",
    "discord_api_connected": true,
    "rate_limit_remaining": 45,
    "version": "1.0.0"
  }
}
```

---

## 実装計画

### 🦀 使用技術スタック

**コアライブラリ**:
- `twilight` - Discord APIクライアント（Rust）
  - `twilight-http` - REST API
  - `twilight-model` - Discord型定義
  - `twilight-gateway` - WebSocket（将来）
- `tokio` - 非同期ランタイム
- `serde` + `serde_json` - JSON シリアライゼーション
- `jsonrpc-core` - JSON-RPC 2.0 実装
- `thiserror` - エラーハンドリング

### 依存関係（Cargo.toml）

```toml
[package]
name = "miyabi-discord-mcp-server"
version = "1.0.0"
edition = "2021"

[dependencies]
# Discord API
twilight-http = "0.15"
twilight-model = "0.15"

# Async runtime
tokio = { version = "1.35", features = ["full"] }

# JSON-RPC 2.0
jsonrpc-core = "18.0"
jsonrpc-stdio-server = "18.0"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = "0.3"

# Environment variables
dotenv = "0.15"

[dev-dependencies]
tokio-test = "0.4"
```

---

### Phase 1: 基本機能実装（1週間）

**タスク**:
- [x] Crate作成
- [ ] Discord APIクライアント実装（`discord/client.rs`）
- [ ] JSON-RPC 2.0ハンドラー実装（`rpc/handler.rs`）
- [ ] サーバー作成機能（`discord.guild.create`）
- [ ] チャンネル作成機能（`discord.channel.create_text`）
- [ ] ロール作成機能（`discord.role.create`）

**完了基準**:
- 基本的なDiscord操作ができる
- JSON-RPC 2.0でリクエストを受け付けられる

---

### Phase 2: 高度な機能（2週間）

**タスク**:
- [ ] カテゴリ作成
- [ ] 音声チャンネル作成
- [ ] フォーラムチャンネル作成
- [ ] チャンネル権限設定
- [ ] メッセージ送信（通常、Embed）
- [ ] モデレーション機能

**完了基準**:
- 全RPC メソッドが実装されている
- DISCORD_SERVER_STRUCTURE.mdに従ったサーバー構築が自動化できる

---

### Phase 3: バッチ操作・テスト（1週間）

**タスク**:
- [ ] バッチセットアップ機能（`discord.batch.setup_server`）
- [ ] 統合テスト実装
- [ ] エラーハンドリング強化
- [ ] ドキュメント作成

**完了基準**:
- 1コマンドでサーバー全体をセットアップできる
- テストカバレッジ80%以上

---

## セキュリティ

### 🔒 認証・認可

#### Discord Bot Token管理

**保存方法**:
- 環境変数: `DISCORD_BOT_TOKEN`
- `.env` ファイル（`.gitignore`に追加必須）

**ローテーション**:
- 6ヶ月ごとにトークンローテーション推奨

---

#### 権限スコープ

**Bot に必要な権限**:
```
MANAGE_GUILD          = 1 << 5   (32)
MANAGE_CHANNELS       = 1 << 4   (16)
MANAGE_ROLES          = 1 << 28  (268435456)
KICK_MEMBERS          = 1 << 1   (2)
BAN_MEMBERS           = 1 << 2   (4)
MODERATE_MEMBERS      = 1 << 40  (1099511627776)
SEND_MESSAGES         = 1 << 11  (2048)
MANAGE_MESSAGES       = 1 << 13  (8192)
```

**計算**: `32 + 16 + 268435456 + 2 + 4 + 1099511627776 + 2048 + 8192 = 1099780092426`

**Bot招待URL**:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=1099780092426&scope=bot
```

---

### Rate Limiting

**Discord API Rate Limits**:
- **Global**: 50 requests/second
- **Per-route**: 5 requests/second

**実装**:
```rust
use std::time::Duration;
use tokio::time::sleep;

pub struct RateLimiter {
    requests: Arc<Mutex<VecDeque<Instant>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    pub async fn acquire(&self) {
        let mut requests = self.requests.lock().await;

        // 古いリクエストを削除
        let now = Instant::now();
        requests.retain(|&t| now.duration_since(t) < self.window);

        // レート制限チェック
        if requests.len() >= self.max_requests {
            let wait_time = self.window - now.duration_since(*requests.front().unwrap());
            drop(requests);
            sleep(wait_time).await;
        }

        requests.push_back(now);
    }
}
```

---

## 使用例

### CLI から実行

#### 1. サーバー作成

```bash
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "discord.guild.create",
  "params": {
    "name": "Miyabi Community",
    "verification_level": 2,
    "explicit_content_filter": 2
  }
}' | miyabi-discord-mcp-server --mode stdio
```

---

#### 2. チャンネル作成

```bash
echo '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "discord.channel.create_text",
  "params": {
    "guild_id": "1234567890",
    "name": "welcome",
    "topic": "Welcome to Miyabi Community!"
  }
}' | miyabi-discord-mcp-server --mode stdio
```

---

#### 3. バッチセットアップ（全構造を一括作成）

```bash
cat docs/DISCORD_SERVER_STRUCTURE.json | \
  miyabi-discord-mcp-server --mode stdio --method discord.batch.setup_server
```

---

### スクリプトから実行

#### Python スクリプト例

```python
import json
import subprocess

def call_discord_mcp(method, params):
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    }

    result = subprocess.run(
        ["miyabi-discord-mcp-server", "--mode", "stdio"],
        input=json.dumps(request),
        capture_output=True,
        text=True
    )

    return json.loads(result.stdout)

# サーバー作成
response = call_discord_mcp("discord.guild.create", {
    "name": "Miyabi Community",
    "verification_level": 2
})

guild_id = response["result"]["guild_id"]

# チャンネル作成
call_discord_mcp("discord.channel.create_text", {
    "guild_id": guild_id,
    "name": "welcome"
})
```

---

#### Rust スクリプト例

```rust
use serde_json::json;
use std::process::{Command, Stdio};
use std::io::Write;

fn call_discord_mcp(method: &str, params: serde_json::Value) -> serde_json::Value {
    let request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params
    });

    let mut child = Command::new("miyabi-discord-mcp-server")
        .arg("--mode")
        .arg("stdio")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("Failed to spawn");

    child.stdin.as_mut().unwrap()
        .write_all(request.to_string().as_bytes())
        .expect("Failed to write");

    let output = child.wait_with_output().expect("Failed to read");
    serde_json::from_slice(&output.stdout).expect("Failed to parse")
}

#[tokio::main]
async fn main() {
    // サーバー作成
    let response = call_discord_mcp("discord.guild.create", json!({
        "name": "Miyabi Community"
    }));

    let guild_id = response["result"]["guild_id"].as_str().unwrap();

    // チャンネル作成
    call_discord_mcp("discord.channel.create_text", json!({
        "guild_id": guild_id,
        "name": "welcome"
    }));
}
```

---

**設計書完了！🎉**

**次のステップ**: Phase 2（Rust crate作成）に進みます。

---

**Discord MCP Server設計者**: Claude Code
**最終更新**: 2025-10-18
