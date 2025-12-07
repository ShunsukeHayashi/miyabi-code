# Miyabi Character Studio - Database Schema Design

**Version**: 1.0
**Date**: 2025-12-07
**Database**: PostgreSQL 15+
**ORM**: SQLx (Rust)
**Deployment**: AWS RDS (db.t4g.micro → db.t4g.small)

---

## 🎯 Database Design Principles

1. **Normalization**: 第3正規形まで正規化
2. **Indexing**: クエリパフォーマンス最適化
3. **Data Integrity**: Foreign Key Constraints
4. **Scalability**: パーティショニング戦略 (Phase 2)
5. **Security**: Row-Level Security (RLS) - Phase 2

---

## 📊 Entity Relationship Diagram (ERD)

```
┌──────────────┐
│   users      │
├──────────────┤
│ id (PK)      │◄──────────────┐
│ email        │               │
│ password_hash│               │
│ name         │               │
│ plan         │               │1
│ stripe_*     │               │
│ created_at   │               │
│ updated_at   │               │
└──────────────┘               │
                               │
                               │ user_id (FK)
                               │
┌──────────────┐               │
│ user_credits │               │
├──────────────┤               │
│ user_id (PK) │◄──────────────┤
│ monthly_quota│               │
│ used_*       │               │
│ reset_date   │               │
│ created_at   │               │
└──────────────┘               │
                               │
                               │
┌──────────────┐               │
│ characters   │               │
├──────────────┤               │
│ id (PK)      │               │
│ user_id (FK) │◄──────────────┤
│ name         │               │
│ base_image_* │               │1
│ features     │               │
│ gemini_*     │               │
│ created_at   │               │
└──────────────┘               │
       │                       │
       │ character_id (FK)     │
       │                       │
       ▼                       │
┌──────────────┐               │
│ differences  │               │
├──────────────┤               │
│ id (PK)      │               │
│ character_id │◄──────────────┘
│ expression   │               N
│ image_url    │
│ consistency_*│
│ generation_* │
│ created_at   │
└──────────────┘
       │
       │ character_id (FK)
       │
       ▼
┌──────────────┐
│ generation_  │
│ jobs         │
├──────────────┤
│ id (PK)      │
│ character_id │◄──────────────┐
│ batch_id     │               │
│ total_diffs  │               │
│ completed    │               │
│ status       │               │
│ created_at   │               │
└──────────────┘               │
                               │
                               │
┌──────────────┐               │
│ credit_      │               │
│ transactions │               │
├──────────────┤               │
│ id (PK)      │               │
│ user_id (FK) │◄──────────────┘
│ character_id │
│ diffs_gen    │
│ credits_used │
│ created_at   │
└──────────────┘
```

---

## 📋 Table Definitions

### 1. users
ユーザーアカウント情報

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    plan VARCHAR(10) NOT NULL DEFAULT 'free'
        CHECK (plan IN ('free', 'basic', 'pro')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Comments
COMMENT ON TABLE users IS 'ユーザーアカウント情報';
COMMENT ON COLUMN users.plan IS 'プラン種別: free, basic, pro';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe顧客ID';
```

**Sample Data:**
```sql
INSERT INTO users (email, password_hash, name, plan) VALUES
('yume@example.com', '$2b$12$...', '佐藤ゆめ', 'basic');
```

---

### 2. user_credits
ユーザークレジット管理

```sql
CREATE TABLE user_credits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_quota INT NOT NULL,
    used_this_month INT NOT NULL DEFAULT 0,
    reset_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_used_quota CHECK (used_this_month >= 0),
    CONSTRAINT chk_monthly_quota CHECK (monthly_quota > 0)
);

-- Indexes
CREATE INDEX idx_user_credits_reset_date ON user_credits(reset_date);

-- Trigger: プラン変更時にquota自動更新
CREATE OR REPLACE FUNCTION update_user_quota()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.plan = 'free' THEN
        UPDATE user_credits SET monthly_quota = 5 WHERE user_id = NEW.id;
    ELSIF NEW.plan = 'basic' THEN
        UPDATE user_credits SET monthly_quota = 20 WHERE user_id = NEW.id;
    ELSIF NEW.plan = 'pro' THEN
        UPDATE user_credits SET monthly_quota = 999999 WHERE user_id = NEW.id; -- 無制限
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quota
AFTER UPDATE OF plan ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_quota();

-- Comments
COMMENT ON TABLE user_credits IS 'ユーザークレジット使用状況';
COMMENT ON COLUMN user_credits.monthly_quota IS '月間生成可能キャラクター数';
COMMENT ON COLUMN user_credits.used_this_month IS '今月使用済みキャラクター数';
```

**Sample Data:**
```sql
INSERT INTO user_credits (user_id, monthly_quota, used_this_month, reset_date) VALUES
('550e8400-e29b-41d4-a716-446655440000', 20, 7, '2026-03-01 00:00:00');
```

---

### 3. characters
キャラクター情報（ベース画像 + AI分析結果）

```sql
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    base_image_url TEXT NOT NULL,
    base_image_s3_key VARCHAR(255) NOT NULL,
    features JSONB NOT NULL,
    gemini_prompt TEXT NOT NULL,
    consistency_score DECIMAL(5, 2),
    art_style VARCHAR(20) CHECK (art_style IN ('illustration', 'realistic', '3d', 'anime')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 100)
);

-- Indexes
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_created_at ON characters(created_at DESC);
CREATE INDEX idx_characters_features ON characters USING GIN (features); -- JSONB Index

-- Comments
COMMENT ON TABLE characters IS 'キャラクター情報（ベース画像 + AI分析）';
COMMENT ON COLUMN characters.features IS 'JSON: { hair: {...}, eyes: {...}, outfit: {...} }';
COMMENT ON COLUMN characters.gemini_prompt IS '一貫性維持用マスタープロンプト';
COMMENT ON COLUMN characters.consistency_score IS 'ベース画像の一貫性スコア (0-100)';
```

**Sample Data:**
```sql
INSERT INTO characters (user_id, name, base_image_url, base_image_s3_key, features, gemini_prompt, consistency_score, art_style) VALUES
('550e8400-e29b-41d4-a716-446655440000',
 'ゆめちゃん',
 'https://cdn.miyabi.ai/characters/.../base.png',
 'characters/550e8400.../char_abc123/base.png',
 '{
    "hair": {"color": "pink", "style": "long", "length": "waist"},
    "eyes": {"color": "blue", "shape": "round"},
    "outfit": {"primary": "white dress", "secondary": "ribbon", "accessories": ["earrings"]},
    "bodyType": "slender"
 }'::jsonb,
 'A cute anime-style character with long pink hair, blue round eyes, wearing a white dress with ribbon...',
 95.2,
 'illustration'
);
```

---

### 4. differences
生成された差分画像

```sql
CREATE TABLE differences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    expression VARCHAR(50) NOT NULL CHECK (expression IN ('neutral', 'happy', 'angry', 'sad', 'surprised', 'custom')),
    image_url TEXT NOT NULL,
    image_s3_key VARCHAR(255) NOT NULL,
    consistency_score DECIMAL(5, 2),
    generation_time INT, -- seconds
    resolution VARCHAR(10) CHECK (resolution IN ('1K', '2K', '4K')),
    aspect_ratio VARCHAR(10) CHECK (aspect_ratio IN ('1:1', '3:4', '4:3', '9:16', '16:9')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_consistency_score CHECK (consistency_score >= 0 AND consistency_score <= 100),
    CONSTRAINT chk_generation_time CHECK (generation_time > 0)
);

-- Indexes
CREATE INDEX idx_differences_character_id ON differences(character_id);
CREATE INDEX idx_differences_expression ON differences(expression);
CREATE INDEX idx_differences_created_at ON differences(created_at DESC);

-- Composite Index for common query
CREATE INDEX idx_differences_char_expr ON differences(character_id, expression);

-- Comments
COMMENT ON TABLE differences IS '生成された差分画像';
COMMENT ON COLUMN differences.expression IS '表情種類: neutral, happy, angry, sad, surprised, custom';
COMMENT ON COLUMN differences.consistency_score IS 'ベース画像との一貫性スコア (0-100)';
COMMENT ON COLUMN differences.generation_time IS 'AI生成時間 (秒)';
```

**Sample Data:**
```sql
INSERT INTO differences (character_id, expression, image_url, image_s3_key, consistency_score, generation_time, resolution, aspect_ratio) VALUES
('char_abc123', 'neutral', 'https://cdn.miyabi.ai/.../neutral.png', 'differences/.../neutral.png', 96.1, 45, '2K', '1:1'),
('char_abc123', 'happy', 'https://cdn.miyabi.ai/.../happy.png', 'differences/.../happy.png', 95.7, 48, '2K', '1:1');
```

---

### 5. generation_jobs
バッチ生成ジョブ管理（SQSキューとの連携）

```sql
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    total_differences INT NOT NULL,
    completed INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,

    CONSTRAINT chk_completed CHECK (completed >= 0 AND completed <= total_differences)
);

-- Indexes
CREATE INDEX idx_generation_jobs_batch_id ON generation_jobs(batch_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

-- Comments
COMMENT ON TABLE generation_jobs IS 'バッチ生成ジョブ管理';
COMMENT ON COLUMN generation_jobs.batch_id IS 'API返却用のバッチID (例: batch_xyz789)';
COMMENT ON COLUMN generation_jobs.status IS 'pending, processing, completed, failed';
```

**Sample Data:**
```sql
INSERT INTO generation_jobs (character_id, batch_id, total_differences, completed, status) VALUES
('char_abc123', 'batch_xyz789', 5, 3, 'processing');
```

---

### 6. credit_transactions
クレジット使用履歴（監査ログ）

```sql
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    differences_generated INT NOT NULL,
    credits_used INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_diffs_gen CHECK (differences_generated > 0),
    CONSTRAINT chk_credits_used CHECK (credits_used > 0)
);

-- Indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);

-- Partition by Month (Phase 2 - 大量データ対策)
-- CREATE TABLE credit_transactions_2026_01 PARTITION OF credit_transactions
-- FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Comments
COMMENT ON TABLE credit_transactions IS 'クレジット使用履歴（監査ログ）';
COMMENT ON COLUMN credit_transactions.differences_generated IS '生成した差分枚数';
COMMENT ON COLUMN credit_transactions.credits_used IS '消費クレジット数（通常1キャラ=1クレジット）';
```

**Sample Data:**
```sql
INSERT INTO credit_transactions (user_id, character_id, differences_generated, credits_used) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'char_abc123', 5, 1);
```

---

## 🔍 Indexes Strategy

### Primary Indexes (自動作成)
- すべてのPRIMARY KEY
- すべてのUNIQUE制約

### Secondary Indexes (手動作成)

#### Query Pattern 1: ユーザーのキャラクター一覧取得
```sql
-- クエリ:
SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC LIMIT 20;

-- 最適化Index:
CREATE INDEX idx_characters_user_created ON characters(user_id, created_at DESC);
```

#### Query Pattern 2: キャラクターの差分一覧取得
```sql
-- クエリ:
SELECT * FROM differences WHERE character_id = ? ORDER BY expression;

-- 最適化Index:
CREATE INDEX idx_differences_char_expr ON differences(character_id, expression);
```

#### Query Pattern 3: ユーザーのクレジット履歴取得（月別）
```sql
-- クエリ:
SELECT * FROM credit_transactions
WHERE user_id = ?
  AND created_at >= '2025-12-01'
  AND created_at < '2026-01-01'
ORDER BY created_at DESC;

-- 最適化Index:
CREATE INDEX idx_credit_transactions_user_created
ON credit_transactions(user_id, created_at DESC);
```

#### Query Pattern 4: JSONB検索（特定の髪色のキャラクター）
```sql
-- クエリ:
SELECT * FROM characters WHERE features @> '{"hair": {"color": "pink"}}';

-- 最適化Index:
CREATE INDEX idx_characters_features ON characters USING GIN (features);
```

---

## 🚀 Performance Optimization

### 1. Connection Pooling (SQLx)
```rust
// src/config.rs
use sqlx::postgres::PgPoolOptions;

pub async fn create_db_pool() -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20) // MVP: 20, Production: 50-100
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(600))
        .connect(&std::env::var("DATABASE_URL")?)
        .await
}
```

### 2. Query Optimization
```rust
// Bad: N+1 Query Problem
for character in characters {
    let diffs = sqlx::query_as!(Difference, "SELECT * FROM differences WHERE character_id = $1", character.id)
        .fetch_all(&pool).await?;
}

// Good: JOIN Query
let characters_with_diffs = sqlx::query!(
    r#"
    SELECT
        c.id, c.name, c.base_image_url,
        d.id as diff_id, d.expression, d.image_url, d.consistency_score
    FROM characters c
    LEFT JOIN differences d ON c.id = d.character_id
    WHERE c.user_id = $1
    ORDER BY c.created_at DESC, d.expression
    "#,
    user_id
)
.fetch_all(&pool)
.await?;
```

### 3. Materialized Views (Phase 2)
```sql
-- よく使う集計クエリをMaterialized Viewに
CREATE MATERIALIZED VIEW user_stats AS
SELECT
    u.id,
    u.email,
    u.plan,
    COUNT(DISTINCT c.id) as total_characters,
    COUNT(DISTINCT d.id) as total_differences,
    AVG(d.consistency_score) as avg_consistency
FROM users u
LEFT JOIN characters c ON u.id = c.user_id
LEFT JOIN differences d ON c.id = d.character_id
GROUP BY u.id;

CREATE UNIQUE INDEX idx_user_stats_id ON user_stats(id);

-- 定期更新（1日1回）
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

---

## 🔐 Security

### 1. Row-Level Security (RLS) - Phase 2
```sql
-- ユーザーは自分のデータのみアクセス可能
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY characters_user_policy ON characters
FOR ALL
USING (user_id = current_setting('app.current_user_id')::uuid);
```

### 2. Prepared Statements (SQLx)
```rust
// SQLインジェクション対策（SQLxは自動的にprepared statement）
sqlx::query_as!(
    Character,
    "SELECT * FROM characters WHERE user_id = $1",
    user_id
)
.fetch_all(&pool)
.await?;
```

### 3. Password Hashing
```rust
use bcrypt::{hash, verify, DEFAULT_COST};

// 登録時
let password_hash = hash(password, DEFAULT_COST)?;
sqlx::query!("INSERT INTO users (email, password_hash) VALUES ($1, $2)", email, password_hash)
    .execute(&pool).await?;

// ログイン時
let user = sqlx::query_as!(User, "SELECT * FROM users WHERE email = $1", email)
    .fetch_one(&pool).await?;
verify(password, &user.password_hash)?;
```

---

## 📊 Monitoring & Maintenance

### 1. Database Monitoring Queries
```sql
-- アクティブな接続数
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- 実行時間が長いクエリ
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 seconds'
ORDER BY duration DESC;

-- テーブルサイズ
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index使用状況
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 2. Backup Strategy
```bash
# Daily Automated Backup (AWS RDS)
# - 自動バックアップ: 毎日 03:00 JST
# - 保持期間: 7日間
# - ポイントインタイムリカバリ: 最大7日前まで

# Manual Backup
pg_dump -h <rds-endpoint> -U postgres -d miyabi_character_studio > backup_$(date +%Y%m%d).sql

# Restore
psql -h <rds-endpoint> -U postgres -d miyabi_character_studio < backup_20251207.sql
```

---

## 🔗 Next Steps

このデータベース設計を元に、最終ドキュメントを作成:
1. **開発ロードマップ** (`06-development-roadmap.md`) - 2ヶ月MVP → 6ヶ月フル機能の段階的計画

---

**Author**: ProductDesignAgent
**Last Updated**: 2025-12-07
**Status**: ✅ Completed
