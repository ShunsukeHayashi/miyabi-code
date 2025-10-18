# Miyabi Discord MCP Server

**Version**: 1.0.0

Discord API を JSON-RPC 2.0 インターフェースでラップし、Miyabiから簡単にDiscordサーバーを操作できるようにするMCPサーバーです。

---

## 🎯 目的

- DiscordサーバーをCLI/スクリプトから操作
- JSON-RPC 2.0による統一的なインターフェース
- Miyabiエコシステムとの統合

---

## 📋 主要機能

### サーバー管理
- ✅ サーバー情報取得 (`discord.guild.get`)
- ⚠️ サーバー作成（Bot制限により非推奨）

### チャンネル管理
- 🚧 カテゴリ作成 (`discord.channel.create_category`)
- 🚧 テキストチャンネル作成 (`discord.channel.create_text`)
- 🚧 音声チャンネル作成 (`discord.channel.create_voice`)
- 🚧 フォーラムチャンネル作成 (`discord.channel.create_forum`)
- 🚧 チャンネル権限更新 (`discord.channel.update_permissions`)

### ロール管理
- 🚧 ロール作成 (`discord.role.create`)
- 🚧 ロール割り当て (`discord.role.assign`)

### メッセージ管理
- 🚧 メッセージ送信 (`discord.message.send`)
- 🚧 Embedメッセージ送信 (`discord.message.send_embed`)
- 🚧 メッセージピン留め (`discord.message.pin`)

### モデレーション
- 🚧 メンバーキック (`discord.moderation.kick`)
- 🚧 メンバーBAN (`discord.moderation.ban`)
- 🚧 メンバータイムアウト (`discord.moderation.timeout`)

### バッチ操作
- 🚧 サーバー一括セットアップ (`discord.batch.setup_server`)

### ヘルスチェック
- ✅ ヘルスチェック (`discord.health`)

**凡例**:
- ✅: 実装済み
- 🚧: TODO（スケルトンのみ）
- ⚠️: 制限あり

---

## 🚀 使い方

### 前提条件

1. **Discord Bot Tokenの取得**

   [Discord Developer Portal](https://discord.com/developers/applications) でBotアプリケーションを作成し、Bot Tokenを取得してください。

2. **必要な権限**

   Botに以下の権限を付与してください：
   ```
   MANAGE_GUILD
   MANAGE_CHANNELS
   MANAGE_ROLES
   KICK_MEMBERS
   BAN_MEMBERS
   MODERATE_MEMBERS
   SEND_MESSAGES
   MANAGE_MESSAGES
   ```

   計算された権限値: `1099780092426`

   **Bot招待URL**:
   ```
   https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=1099780092426&scope=bot
   ```

---

### インストール

```bash
# リポジトリクローン
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi/crates/miyabi-discord-mcp-server

# ビルド
cargo build --release

# バイナリは以下に生成されます
# target/release/miyabi-discord-mcp-server
```

---

### 設定

#### 環境変数

`.env` ファイルを作成し、Discord Bot Tokenを設定してください：

```bash
DISCORD_BOT_TOKEN=your_bot_token_here
RUST_LOG=miyabi_discord_mcp_server=info
```

---

### 実行

#### stdio モード

```bash
# ヘルスチェック
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "discord.health"
}' | cargo run --release -- --mode stdio

# サーバー情報取得
echo '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "discord.guild.get",
  "params": {
    "guild_id": "1234567890"
  }
}' | cargo run --release -- --mode stdio
```

#### HTTPモード（未実装）

```bash
cargo run --release -- --mode http --port 8080
```

---

## 📖 API仕様

完全なAPI仕様は [DISCORD_MCP_SERVER_DESIGN.md](../../docs/DISCORD_MCP_SERVER_DESIGN.md) を参照してください。

### サーバー情報取得の例

**リクエスト**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "discord.guild.get",
  "params": {
    "guild_id": "1234567890"
  }
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
    "member_count": 42,
    "channels": [...],
    "roles": [...]
  }
}
```

---

## 🔧 開発

### テスト実行

```bash
cargo test
```

### Linter実行

```bash
cargo clippy -- -D warnings
```

### フォーマット

```bash
cargo fmt
```

---

## 🛣️ ロードマップ

### Phase 1: 基本機能実装（完了）
- [x] Crate作成
- [x] Discord APIクライアント実装
- [x] JSON-RPC 2.0ハンドラー実装
- [x] サーバー情報取得機能
- [x] ヘルスチェック機能

### Phase 2: コア機能実装（進行中）
- [ ] チャンネル作成（カテゴリ、テキスト、音声、フォーラム）
- [ ] ロール作成・割り当て
- [ ] メッセージ送信（通常、Embed）
- [ ] チャンネル権限設定

### Phase 3: 高度な機能（未着手）
- [ ] モデレーション機能（キック、BAN、タイムアウト）
- [ ] バッチセットアップ機能
- [ ] HTTPモード実装
- [ ] 統合テスト実装

---

## 📝 注意事項

1. **Bot accountsはサーバー作成不可**

   Discord APIの制限により、通常のBot accountsはサーバー（Guild）を作成できません。
   サーバーは手動で作成し、Botを招待してください。

2. **Rate Limiting**

   Discord APIにはレート制限があります：
   - Global: 50 requests/second
   - Per-route: 5 requests/second

   実装には適切なレート制限ハンドリングが必要です（未実装）。

3. **セキュリティ**

   Discord Bot Tokenは**絶対に公開しないでください**。
   `.env`ファイルは`.gitignore`に追加してください。

---

## 📚 参考資料

- [Discord Developer Portal](https://discord.com/developers/docs/intro)
- [Twilight (Discord API Library for Rust)](https://twilight.rs/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

---

## 📄 ライセンス

MIT License

---

**作成者**: Claude Code
**最終更新**: 2025-10-18
