# Issue #972: PostgreSQL Connection Enablement - 完全実装プラン

**Version**: 1.0
**Created**: 2025-11-25
**Issue**: https://github.com/customer-cloud/miyabi-private/issues/972
**Branch**: `feature/972-postgresql-connection`
**Priority**: P0 (Critical)

---

## Executive Summary

Issue #972 は **Phase 1.1: PostgreSQL Connection Enablement** として、Miyabi Web API の PostgreSQL 接続を完全に有効化するタスクです。

**現在の状態**: 実装は **85% 完了**しています。コード自体は全て実装済みですが、検証とテストが残っています。

---

## 1. 成功基準の検証状態

| # | 成功基準 | 状態 | 詳細 |
|---|---------|------|------|
| 1 | PostgreSQL 接続確立 | ✅ 実装済み | `lib.rs:153-166` でコネクションプール設定済み |
| 2 | コネクションプールが100+同時リクエスト処理 | ⚠️ 設定済み/未検証 | `max_connections: 100` 設定済み、負荷テスト未実施 |
| 3 | Health Check が DB 統計を返す | ✅ 実装済み | `health.rs` で DatabaseStats 含むレスポンス |
| 4 | Telegram Bot が機能状態を維持 | ⚠️ 未検証 | `telegram.rs` は DB 非依存だが統合テスト未実施 |

---

## 2. 現在の実装状態

### 2.1 完了済みコンポーネント

#### コネクションプール設定 (`lib.rs:153-166`)
```rust
let db = sqlx::postgres::PgPoolOptions::new()
    .max_connections(100)          // ✅ 100+ 同時リクエスト対応
    .min_connections(10)           // ✅ ウォーム接続維持
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Some(Duration::from_secs(600)))
    .max_lifetime(Some(Duration::from_secs(1800)))
    .connect(&config.database_url)
    .await?;
```

#### Health Check エンドポイント (`routes/health.rs`)
```rust
pub struct DatabaseStats {
    pub active_connections: u32,
    pub idle_connections: u32,
    pub max_connections: u32,
    pub status: String,
}
```

#### 環境設定 (`.env`)
```bash
DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi
JWT_SECRET=dev_jwt_secret_change_in_production_min_32_chars_required
GITHUB_CLIENT_ID=dev_client_id
GITHUB_CLIENT_SECRET=dev_client_secret
```

#### マイグレーションファイル (`migrations/`)
- `20251024000000_initial_schema.sql` - 基本スキーマ
- `20251024000001_execution_logs.sql` - 実行ログ
- `20251120000000_create_tasks_table.sql` - タスクテーブル
- `20251123000000_fix_github_id_type.sql` - GitHub ID 型修正
- `20251123000001_fix_timestamp_types.sql` - タイムスタンプ型修正

### 2.2 未完了タスク

1. **マイグレーション実行の検証**
2. **サーバー起動テスト**
3. **Health Check エンドポイントの動作確認**
4. **Telegram Bot 統合テスト**
5. **負荷テスト (100+ 同時リクエスト)**

---

## 3. 実装プラン

### Phase A: 環境検証 (30分)

#### A.1 PostgreSQL データベース確認
```bash
# 1. PostgreSQL 接続確認
psql postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi -c "SELECT 1"

# 2. データベース存在確認
psql -h localhost -U miyabi_admin -d miyabi -c "\\dt"
```

#### A.2 マイグレーション実行
```bash
cd crates/miyabi-web-api
sqlx migrate run --database-url "postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi"
```

### Phase B: ビルド & サーバー起動 (30分)

#### B.1 ビルド
```bash
cargo build -p miyabi-web-api --release
```

#### B.2 サーバー起動テスト
```bash
cd crates/miyabi-web-api
cargo run --bin miyabi-web-api
```

#### B.3 Health Check 検証
```bash
curl -s http://localhost:4000/api/v1/health | jq .
```

**期待されるレスポンス**:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "database": {
    "active_connections": 1,
    "idle_connections": 9,
    "max_connections": 100,
    "status": "connected"
  }
}
```

### Phase C: 統合テスト (1時間)

#### C.1 Telegram Bot 検証
```bash
# Webhook エンドポイントテスト
curl -X POST http://localhost:4000/api/v1/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"update_id": 1, "message": {"message_id": 1, "chat": {"id": 123, "type": "private"}, "text": "/start"}}'
```

#### C.2 認証エンドポイント検証
```bash
# GitHub OAuth 初期化
curl -v http://localhost:4000/api/v1/auth/github

# Mock Login (開発用)
curl -X POST http://localhost:4000/api/v1/auth/mock \
  -H "Content-Type: application/json" \
  -d '{"github_id": 12345, "email": "test@example.com", "name": "Test User"}'
```

#### C.3 データベース依存ルート検証
```bash
# Dashboard Summary
curl http://localhost:4000/api/v1/dashboard/summary | jq .

# Workflows
curl http://localhost:4000/api/v1/workflows | jq .

# Repositories
curl http://localhost:4000/api/v1/repositories | jq .
```

### Phase D: 負荷テスト (1時間)

#### D.1 同時リクエストテスト
```bash
# wrk または hey を使用
hey -n 1000 -c 100 http://localhost:4000/api/v1/health

# または k6 を使用
k6 run --vus 100 --duration 30s -e URL=http://localhost:4000/api/v1/health load-test.js
```

**成功基準**:
- 100 同時接続で全リクエストが成功 (HTTP 200)
- 平均レスポンス時間 < 100ms
- エラー率 < 1%

### Phase E: ドキュメント & クローズ (30分)

#### E.1 テスト結果記録
Issue #972 に以下をコメント:
- 全成功基準の達成状態
- Health Check レスポンスのスクリーンショット
- 負荷テスト結果

#### E.2 PR 作成 (必要な場合)
```bash
gh pr create --title "feat(web-api): PostgreSQL Connection Enablement #972" \
  --body "## Summary
- PostgreSQL connection fully enabled
- Connection pool configured for 100+ concurrent requests
- Health check returns DB statistics
- Telegram bot remains functional

## Test Results
[負荷テスト結果を記載]

Closes #972"
```

---

## 4. 残りの実装が必要な項目

### 4.1 統合テストファイル作成

**ファイル**: `crates/miyabi-web-api/tests/integration_test.rs`

```rust
//! Integration tests for miyabi-web-api
//!
//! These tests require a running PostgreSQL database

use miyabi_web_api::{create_app, AppConfig};
use axum_test::TestServer;

#[tokio::test]
async fn test_health_check_returns_db_stats() {
    let config = AppConfig::from_env().unwrap();
    let app = create_app(config).await.unwrap();
    let server = TestServer::new(app).unwrap();

    let response = server.get("/api/v1/health").await;

    response.assert_status_ok();

    let json: serde_json::Value = response.json();
    assert_eq!(json["status"], "ok");
    assert!(json["database"].is_object());
    assert_eq!(json["database"]["status"], "connected");
}

#[tokio::test]
async fn test_telegram_webhook_without_db() {
    // Telegram webhook should work without database
    let config = AppConfig::from_env().unwrap();
    let app = create_app(config).await.unwrap();
    let server = TestServer::new(app).unwrap();

    let response = server
        .post("/api/v1/telegram/webhook")
        .json(&serde_json::json!({
            "update_id": 1,
            "message": {
                "message_id": 1,
                "chat": {"id": 123, "type": "private"},
                "text": "/help"
            }
        }))
        .await;

    response.assert_status_ok();
}
```

### 4.2 負荷テストスクリプト

**ファイル**: `crates/miyabi-web-api/tests/load_test.js` (k6用)

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const url = __ENV.URL || 'http://localhost:4000/api/v1/health';

  const response = http.get(url);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'has database stats': (r) => JSON.parse(r.body).database !== null,
    'database is connected': (r) => JSON.parse(r.body).database.status === 'connected',
  });

  sleep(0.1);
}
```

### 4.3 .env.example 作成

**ファイル**: `crates/miyabi-web-api/.env.example`

```bash
# Database Configuration
DATABASE_URL=postgresql://miyabi_admin:your_password@localhost:5432/miyabi

# Server Configuration
SERVER_ADDRESS=0.0.0.0:4000

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your_jwt_secret_min_32_characters_required

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:4000/api/v1/auth/github/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Environment
ENVIRONMENT=development

# Logging
RUST_LOG=info,miyabi_web_api=debug

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
AUTHORIZED_CHAT_IDS=123456789,987654321

# GitHub for Issue creation
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=customer-cloud
GITHUB_REPO=miyabi-private

# OpenAI for GPT-4 analysis
OPENAI_API_KEY=your_openai_api_key
```

---

## 5. リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| PostgreSQL 接続失敗 | サーバー起動不可 | エラーメッセージ改善済み、接続URLガイド提供 |
| マイグレーション競合 | スキーマ不整合 | down マイグレーション準備済み |
| 負荷テスト失敗 | 100+同時接続未達 | コネクションプール設定調整 |
| Telegram Bot 回帰 | ユーザー影響 | DB非依存設計確認済み |

---

## 6. 完了チェックリスト

### 必須 (Must Have)
- [ ] PostgreSQL 接続成功 (SELECT 1 テスト)
- [ ] マイグレーション実行成功
- [ ] サーバー正常起動
- [ ] Health Check が DB 統計を返す
- [ ] Telegram webhook 正常動作

### 推奨 (Should Have)
- [ ] 100 同時リクエストテスト通過
- [ ] 統合テストファイル作成
- [ ] .env.example 作成

### あれば良い (Nice to Have)
- [ ] k6 負荷テストスクリプト
- [ ] CI/CD パイプライン追加

---

## 7. 次のステップ

Issue #972 完了後は以下に進みます:

1. **Phase 1.2**: #973 - Base Schema Migration
2. **Phase 1.3**: #974 - Organization/Team Schema
3. **Phase 2.1**: #978 - Backend API Reconstruction

---

**プラン作成者**: Claude Code
**レビュー**: Pending
**承認**: Pending
