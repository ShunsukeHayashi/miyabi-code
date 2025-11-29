# Database Connection Pool Optimization

**Version**: 1.0
**Date**: 2025-11-29
**Status**: ✅ Completed

---

## 概要

SQLxのデータベース接続プール設定を環境別に最適化し、本番環境・開発環境・テスト環境それぞれに適した設定を自動適用するように改善しました。

---

## 実装内容

### 1. DatabasePoolConfig 構造体の追加

`crates/miyabi-web-api/src/config.rs:7-111`

環境別の接続プール設定を管理する新しい構造体を追加しました。

```rust
pub struct DatabasePoolConfig {
    pub max_connections: u32,
    pub min_connections: u32,
    pub acquire_timeout: Duration,
    pub idle_timeout: Option<Duration>,
    pub max_lifetime: Option<Duration>,
    pub test_before_acquire: bool,
}
```

#### 環境別のプリセット

**Production設定** (`DatabasePoolConfig::production()`)
- `max_connections: 100` - Lambda同時実行数に対応
- `min_connections: 10` - ウォーム接続を維持
- `acquire_timeout: 30s` - 本番ワークロードに対応
- `idle_timeout: 600s (10分)` - 未使用接続のクリーンアップ
- `max_lifetime: 1800s (30分)` - 古い接続の防止
- `test_before_acquire: true` - 接続テスト有効

**Development設定** (`DatabasePoolConfig::development()`)
- `max_connections: 20` - ローカルDB負荷軽減
- `min_connections: 5`
- `acquire_timeout: 10s` - 高速フィードバック
- `idle_timeout: 300s (5分)`
- `max_lifetime: 900s (15分)`
- `test_before_acquire: false`

**Test設定** (`DatabasePoolConfig::test()`)
- `max_connections: 5` - テスト干渉防止
- `min_connections: 1`
- `acquire_timeout: 5s` - 高速テスト実行
- `idle_timeout: 60s (1分)`
- `max_lifetime: 300s (5分)`
- `test_before_acquire: false`

---

### 2. 環境変数からのオーバーライド

`DatabasePoolConfig::from_env(environment: &str)`

環境変数から個別の設定をオーバーライド可能：

| 環境変数 | デフォルト値 (例: production) |
|---------|------------------------------|
| `DB_MAX_CONNECTIONS` | 100 |
| `DB_MIN_CONNECTIONS` | 10 |
| `DB_ACQUIRE_TIMEOUT_SECS` | 30 |
| `DB_IDLE_TIMEOUT_SECS` | 600 |
| `DB_MAX_LIFETIME_SECS` | 1800 |
| `DB_TEST_BEFORE_ACQUIRE` | true |

---

### 3. AppConfig統合

`crates/miyabi-web-api/src/config.rs:115-230`

`AppConfig`構造体に`database_pool`フィールドを追加し、環境に応じた設定を自動ロード：

```rust
pub struct AppConfig {
    // ... existing fields
    #[serde(skip)]
    pub database_pool: Option<DatabasePoolConfig>,
}

impl AppConfig {
    pub fn database_pool(&self) -> DatabasePoolConfig {
        self.database_pool
            .clone()
            .unwrap_or_else(|| DatabasePoolConfig::from_env(&self.environment))
    }
}
```

---

### 4. lib.rs プール初期化の最適化

`crates/miyabi-web-api/src/lib.rs:155-193`

接続プール初期化ロジックを改善：

**変更前**:
```rust
let db = sqlx::postgres::PgPoolOptions::new()
    .max_connections(100)
    .min_connections(10)
    .acquire_timeout(Duration::from_secs(30))
    .idle_timeout(Some(Duration::from_secs(600)))
    .max_lifetime(Some(Duration::from_secs(1800)))
    .connect(&config.database_url)
    .await?;
```

**変更後**:
```rust
let pool_config = config.database_pool();

let mut pool_options = PgPoolOptions::new()
    .max_connections(pool_config.max_connections)
    .min_connections(pool_config.min_connections)
    .acquire_timeout(pool_config.acquire_timeout)
    .test_before_acquire(pool_config.test_before_acquire);

if let Some(idle_timeout) = pool_config.idle_timeout {
    pool_options = pool_options.idle_timeout(idle_timeout);
}

if let Some(max_lifetime) = pool_config.max_lifetime {
    pool_options = pool_options.max_lifetime(max_lifetime);
}

let db = pool_options.connect(&config.database_url).await?;
```

**改善点**:
- 環境に応じた自動設定適用
- 詳細なログ出力追加
- 柔軟な環境変数オーバーライド

---

### 5. テストヘルパーの最適化

`crates/miyabi-web-api/tests/helpers/database.rs:22-42`

テスト用データベース接続プールを最適化：

```rust
let pool_config = DatabasePoolConfig::test();

let mut pool_options = PgPoolOptions::new()
    .max_connections(pool_config.max_connections)
    .min_connections(pool_config.min_connections)
    .acquire_timeout(pool_config.acquire_timeout)
    .test_before_acquire(pool_config.test_before_acquire);
```

**メリット**:
- テスト環境用の軽量設定（max_connections: 5）
- テスト実行速度の向上
- テスト間の干渉防止

---

### 6. 環境変数ドキュメント

#### `.env.example` (新規作成)
`crates/miyabi-web-api/.env.example`

包括的な環境変数テンプレートを作成：
- データベース接続プール設定のドキュメント
- 全ての環境変数の説明とデフォルト値
- セキュリティベストプラクティス
- 環境別の推奨設定

#### `.env` (更新)
`crates/miyabi-web-api/.env`

開発環境用の設定にプール設定のコメントを追加。

---

## 使用方法

### 1. 環境変数設定なし（デフォルト動作）

環境変数`ENVIRONMENT`の値に応じて自動的に最適な設定を適用：

```bash
# 本番環境
ENVIRONMENT=production
# → max_connections=100, min_connections=10

# 開発環境
ENVIRONMENT=development
# → max_connections=20, min_connections=5

# テスト環境
ENVIRONMENT=test
# → max_connections=5, min_connections=1
```

### 2. 環境変数で個別設定

特定の設定のみをオーバーライド：

```bash
ENVIRONMENT=production
DB_MAX_CONNECTIONS=150      # 本番デフォルトの100から増加
DB_MIN_CONNECTIONS=20       # 本番デフォルトの10から増加
```

### 3. 完全カスタマイズ

全ての設定を環境変数で制御：

```bash
ENVIRONMENT=production
DB_MAX_CONNECTIONS=200
DB_MIN_CONNECTIONS=20
DB_ACQUIRE_TIMEOUT_SECS=60
DB_IDLE_TIMEOUT_SECS=1200
DB_MAX_LIFETIME_SECS=3600
DB_TEST_BEFORE_ACQUIRE=true
```

---

## テスト

### ユニットテスト追加

`crates/miyabi-web-api/src/config.rs:274-312`

接続プール設定の動作を検証するテストを追加：

```rust
#[test]
fn test_database_pool_configs() {
    // Production, Development, Test 設定のテスト
}

#[test]
fn test_pool_config_from_env() {
    // 環境別の自動設定のテスト
}
```

### テスト実行

```bash
cd crates/miyabi-web-api
cargo test config::tests::test_database_pool_configs
cargo test config::tests::test_pool_config_from_env
```

---

## パフォーマンス改善

### Before vs After

| 環境 | Before | After | 改善点 |
|------|--------|-------|--------|
| **Production** | 固定値100 | 環境変数対応 | 柔軟な調整可能 |
| **Development** | 100（過剰） | 20 | ローカルDB負荷軽減 |
| **Test** | 100（過剰） | 5 | テスト高速化 |

### 期待される効果

**本番環境**:
- Lambda同時実行数（100+）に対応可能
- ウォーム接続維持でレイテンシ削減
- 長めのタイムアウトで安定性向上

**開発環境**:
- ローカルPostgreSQLの負荷軽減
- 開発者体験の向上
- リソース使用量の最適化

**テスト環境**:
- テスト実行速度の向上
- テスト間の干渉防止
- CI/CD パイプラインの高速化

---

## セキュリティ考慮事項

1. **本番環境での接続テスト**
   - `test_before_acquire: true` を本番のみ有効化
   - 無効な接続の早期検出

2. **タイムアウト設定**
   - `acquire_timeout` で無限待機を防止
   - `idle_timeout` で未使用接続を解放

3. **接続寿命管理**
   - `max_lifetime` で古い接続を定期的に更新
   - ネットワーク切断時の自動復旧

---

## トラブルシューティング

### 接続エラーが発生する場合

1. **環境変数の確認**
   ```bash
   echo $DATABASE_URL
   echo $ENVIRONMENT
   echo $DB_MAX_CONNECTIONS
   ```

2. **PostgreSQL max_connections の確認**
   ```sql
   SHOW max_connections;
   ```

   アプリケーションの `max_connections` が PostgreSQL の設定を超えないようにしてください。

3. **ログの確認**
   ```bash
   RUST_LOG=debug cargo run
   ```

### パフォーマンスが低い場合

1. **プール設定の調整**
   - `max_connections` を増やす
   - `min_connections` を増やしてウォーム接続を確保

2. **タイムアウトの調整**
   - `acquire_timeout` を延長
   - `idle_timeout` を短縮して接続を効率的に再利用

---

## 関連ファイル

| ファイル | 説明 |
|---------|------|
| `crates/miyabi-web-api/src/config.rs` | 接続プール設定構造体 |
| `crates/miyabi-web-api/src/lib.rs` | プール初期化ロジック |
| `crates/miyabi-web-api/tests/helpers/database.rs` | テスト用プール設定 |
| `crates/miyabi-web-api/.env` | 開発環境設定 |
| `crates/miyabi-web-api/.env.example` | 環境変数テンプレート |

---

## 今後の改善案

1. **動的スケーリング**
   - 負荷に応じた接続プールサイズの自動調整
   - メトリクス収集による最適化

2. **接続プールメトリクス**
   - Prometheus/Grafana統合
   - リアルタイム監視ダッシュボード

3. **マルチテナント対応**
   - テナント別接続プール
   - リソース分離

4. **Read/Write分離**
   - Read Replicaへの接続プール
   - 負荷分散

---

## まとめ

✅ **完了した項目**:
- [x] 環境別接続プール設定構造体の作成
- [x] AppConfig への統合
- [x] lib.rs プール初期化の最適化
- [x] テストヘルパーの最適化
- [x] 環境変数ドキュメントの作成
- [x] ユニットテストの追加

📊 **成果**:
- 環境に応じた最適な接続プール設定の自動適用
- 本番環境での柔軟な調整が可能
- 開発・テスト環境でのリソース効率化
- 詳細なドキュメントと使用例の提供

🚀 **次のステップ**:
- MUGEN/MAJINでのビルドテスト実行
- 本番環境デプロイ前の負荷テスト
- メトリクス収集の実装

---

**作成者**: Claude Code (A3-Worker)
**レビュー**: Pending
**デプロイ**: Pending
