# Telegram Bot認証機能 設計ドキュメント

**作成日**: 2025-10-26
**バージョン**: 1.0.0

## 🎯 目的

Telegram Botに認証機能を追加し、特定のユーザーのみがMiyabi Agentを実行できるようにする。

## 📋 認証方式の比較

### 方式1: Chat IDホワイトリスト ⭐️ **推奨**

**概要**: 許可されたChat IDのリストを管理し、そのユーザーのみがBotを使用可能

**メリット**:
- ✅ 実装が最もシンプル
- ✅ Telegram側の設定不要
- ✅ 環境変数またはデータベースで管理可能
- ✅ 即座に有効化/無効化可能

**デメリット**:
- ❌ ユーザー追加時に手動でChat IDを取得する必要がある
- ❌ 大規模な組織では管理が煩雑

**実装例**:
```rust
// .env
AUTHORIZED_CHAT_IDS=7654362070,1234567890,9876543210

// telegram.rs
async fn is_authorized(chat_id: i64) -> bool {
    let authorized_ids = std::env::var("AUTHORIZED_CHAT_IDS")
        .unwrap_or_default()
        .split(',')
        .filter_map(|s| s.parse::<i64>().ok())
        .collect::<Vec<_>>();

    authorized_ids.contains(&chat_id)
}
```

---

### 方式2: Telegram Login Widget

**概要**: WebアプリにTelegramログインボタンを設置し、ユーザー認証後にChat IDを登録

**メリット**:
- ✅ ユーザー自身でアカウント登録可能
- ✅ Telegram公式の認証フロー
- ✅ ユーザー情報（名前、写真等）も取得可能

**デメリット**:
- ❌ Webアプリケーションが必要
- ❌ 実装が複雑
- ❌ データベースが必須

**参考**: https://core.telegram.org/widgets/login

---

### 方式3: ワンタイムパスワード (OTP)

**概要**: Bot起動時に管理者が生成したOTPを入力させる

**メリット**:
- ✅ 一時的なアクセス権限付与が可能
- ✅ Chat ID事前登録不要

**デメリット**:
- ❌ 毎回OTP生成・共有が必要
- ❌ UX が悪い

---

### 方式4: 組織管理（Role-Based Access Control）

**概要**: GitHubの組織メンバーシップをベースに認証

**メリット**:
- ✅ GitHubのアクセス権限と統合
- ✅ 組織メンバーなら自動的にアクセス可能

**デメリット**:
- ❌ GitHub API連携が必要
- ❌ 実装が複雑
- ❌ Chat IDとGitHubアカウントの紐付けが必要

---

## 🎯 推奨実装: Chat IDホワイトリスト

### Phase 1: 基本認証 (Week 1)

#### 1.1 環境変数ベース
```bash
# .env
AUTHORIZED_CHAT_IDS=7654362070,1234567890
```

#### 1.2 実装
```rust
// crates/miyabi-web-api/src/routes/telegram.rs

/// Check if user is authorized
async fn is_authorized(chat_id: i64) -> bool {
    let authorized_ids = std::env::var("AUTHORIZED_CHAT_IDS")
        .unwrap_or_default()
        .split(',')
        .filter_map(|s| s.trim().parse::<i64>().ok())
        .collect::<Vec<_>>();

    authorized_ids.contains(&chat_id)
}

/// Handle incoming text messages
async fn handle_message(state: AppState, message: Message) -> Result<()> {
    let chat_id = message.chat.id;

    // Authorization check
    if !is_authorized(chat_id).await {
        let client = create_telegram_client()?;
        let lang = message.from.as_ref()
            .map(Language::from_user)
            .unwrap_or(Language::English);

        let unauthorized_text = match lang {
            Language::English => "❌ Unauthorized. Please contact the administrator.",
            Language::Japanese => "❌ 認証されていません。管理者にお問い合わせください。",
        };

        client.send_message(chat_id, unauthorized_text).await?;
        return Ok(());
    }

    // ... existing message handling
}
```

#### 1.3 Chat ID取得ヘルパー
```rust
/// Handle /getid command
async fn handle_getid_command(chat_id: i64, user: &User) -> Result<()> {
    let client = create_telegram_client()?;

    let text = format!(
        r#"
👤 **Your Telegram Information**

**Chat ID**: `{}`
**Name**: {} {}
**Username**: @{}

To get authorized, send this Chat ID to the administrator.
"#,
        chat_id,
        user.first_name,
        user.last_name.as_deref().unwrap_or(""),
        user.username.as_deref().unwrap_or("N/A")
    );

    client.send_message(chat_id, &text).await?;
    Ok(())
}
```

---

### Phase 2: データベース管理 (Week 2-3) - Optional

#### 2.1 スキーマ
```sql
CREATE TABLE authorized_users (
    chat_id BIGINT PRIMARY KEY,
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    github_username TEXT,
    role TEXT NOT NULL DEFAULT 'user', -- user, admin
    authorized_at TIMESTAMP NOT NULL DEFAULT NOW(),
    authorized_by BIGINT, -- admin's chat_id
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

#### 2.2 実装
```rust
// crates/miyabi-web-api/src/models/authorized_user.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthorizedUser {
    pub chat_id: i64,
    pub telegram_username: Option<String>,
    pub first_name: String,
    pub last_name: Option<String>,
    pub github_username: Option<String>,
    pub role: UserRole,
    pub authorized_at: DateTime<Utc>,
    pub authorized_by: Option<i64>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UserRole {
    User,
    Admin,
}

// Database queries
impl AppState {
    pub async fn is_user_authorized(&self, chat_id: i64) -> Result<bool> {
        let result = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM authorized_users WHERE chat_id = $1 AND is_active = TRUE)"
        )
        .bind(chat_id)
        .fetch_one(&self.db)
        .await?;

        Ok(result)
    }

    pub async fn authorize_user(
        &self,
        chat_id: i64,
        user: &User,
        authorized_by: i64,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO authorized_users (
                chat_id, telegram_username, first_name, last_name, authorized_by
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (chat_id) DO UPDATE SET is_active = TRUE
            "#
        )
        .bind(chat_id)
        .bind(&user.username)
        .bind(&user.first_name)
        .bind(&user.last_name)
        .bind(authorized_by)
        .execute(&self.db)
        .await?;

        Ok(())
    }
}
```

#### 2.3 管理者コマンド
```rust
// /authorize <chat_id> - Authorize a user (admin only)
// /revoke <chat_id> - Revoke authorization (admin only)
// /listusers - List all authorized users (admin only)

async fn handle_admin_command(
    state: AppState,
    chat_id: i64,
    command: &str,
    args: Vec<&str>,
) -> Result<()> {
    // Check if user is admin
    if !state.is_user_admin(chat_id).await? {
        return Err(AppError::Authorization("Admin access required".to_string()));
    }

    match command {
        "authorize" => {
            if args.is_empty() {
                return Err(AppError::Validation("Usage: /authorize <chat_id>".to_string()));
            }
            let target_chat_id: i64 = args[0].parse()?;
            state.authorize_user(target_chat_id, chat_id).await?;
            // Send confirmation
        }
        "revoke" => {
            // ... similar implementation
        }
        "listusers" => {
            let users = state.list_authorized_users().await?;
            // Format and send user list
        }
        _ => {}
    }

    Ok(())
}
```

---

## 🔐 セキュリティ考慮事項

### 1. Rate Limiting
```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use chrono::{DateTime, Duration, Utc};

struct RateLimiter {
    requests: Arc<Mutex<HashMap<i64, Vec<DateTime<Utc>>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    async fn check_rate_limit(&self, chat_id: i64) -> bool {
        let mut requests = self.requests.lock().await;
        let now = Utc::now();
        let cutoff = now - self.window;

        let user_requests = requests.entry(chat_id).or_insert_with(Vec::new);
        user_requests.retain(|&req_time| req_time > cutoff);

        if user_requests.len() >= self.max_requests {
            return false; // Rate limit exceeded
        }

        user_requests.push(now);
        true
    }
}
```

### 2. ログ記録
```rust
// 全ての認証試行をログに記録
tracing::info!(
    "Auth attempt: chat_id={}, username={}, result={}",
    chat_id,
    username,
    if authorized { "success" } else { "denied" }
);
```

### 3. 監査ログ
```sql
CREATE TABLE auth_audit_log (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    action TEXT NOT NULL, -- login, command, unauthorized_attempt
    result TEXT NOT NULL, -- success, denied
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata JSONB
);
```

---

## 📊 実装優先度

### High Priority (Phase 1)
- ✅ Chat IDホワイトリスト（環境変数ベース）
- ✅ `/getid` コマンド
- ✅ 未認証ユーザーへのエラーメッセージ
- ✅ 基本的なログ記録

### Medium Priority (Phase 2)
- ⏳ データベースベースの認証管理
- ⏳ 管理者コマンド (`/authorize`, `/revoke`, `/listusers`)
- ⏳ Rate limiting

### Low Priority (Phase 3)
- 📋 Telegram Login Widget統合
- 📋 GitHub組織連携
- 📋 監査ログダッシュボード

---

## 🎯 推奨実装プラン

### Week 1: 基本認証
1. Chat IDホワイトリスト実装
2. `/getid` コマンド追加
3. 未認証ユーザーハンドリング
4. テスト

### Week 2-3: 拡張機能（Optional）
1. PostgreSQLテーブル作成
2. データベースクエリ実装
3. 管理者コマンド実装
4. Rate limiting追加

---

## 📝 使用例

### 管理者側
```bash
# 1. ユーザーにBotを検索してもらう
# ユーザー: @Miyabi_auto_bot を検索

# 2. ユーザーに /getid を実行してもらう
# ユーザー: /getid
# Bot: Your Chat ID: 7654362070

# 3. 環境変数に追加
export AUTHORIZED_CHAT_IDS=7654362070,1234567890

# または、管理者コマンドで認証
# Admin: /authorize 7654362070
```

### ユーザー側
```
User: /start
Bot: ❌ 認証されていません。Chat IDを取得するには /getid を実行してください。

User: /getid
Bot:
👤 Your Telegram Information
Chat ID: 7654362070
Name: はやし しゅんすけ
...

# 管理者にChat IDを送信

# 認証後
User: /start
Bot: 🌸 Miyabi Bot へようこそ！...
```

---

## 🔗 参考リンク

- [Telegram Bot API - Authentication](https://core.telegram.org/bots/api#authorizing-your-bot)
- [Telegram Login Widget](https://core.telegram.org/widgets/login)
- [Best Practices for Bot Security](https://core.telegram.org/bots/faq#what-messages-can-my-bot-see)

---

**このドキュメントは Issue #563 の認証機能拡張に対応します。**
