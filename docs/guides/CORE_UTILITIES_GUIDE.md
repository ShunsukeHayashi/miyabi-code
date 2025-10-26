# Miyabi Core Utilities - 統一API使用ガイド

**作成日**: 2025-10-19
**ステータス**: v1.0.0
**対象**: 全Miyabiクレート開発者

---

## 📋 目次

1. [概要](#概要)
2. [Logging](#logging)
3. [Retry Logic](#retry-logic)
4. [Security](#security)
5. [マイグレーションガイド](#マイグレーションガイド)
6. [ベストプラクティス](#ベストプラクティス)

---

## 概要

### 🎯 目的

`miyabi-core` は、全クレートで共通利用される横断的関心事を提供します：

- **統一的なロギング**: `tracing`ベースの構造化ログ
- **統一的なリトライロジック**: 指数バックオフ付きリトライ
- **統一的なセキュリティ**: 脆弱性スキャン・シークレット管理

### ✅ メリット

1. **コード重複の削減**: 同じロジックを各クレートで実装しない
2. **一貫性**: 全クレートで同じエラーハンドリング・ログ形式
3. **保守性向上**: 中央で修正すれば全クレートに反映
4. **セキュリティ強化**: セキュリティベストプラクティスを共有

---

## Logging

### 基本的な使用方法

#### 1. 初期化（アプリケーション起動時）

```rust
use miyabi_core::{init_logger, LogFormat, LogLevel, LoggerConfig};

fn main() {
    // シンプルな初期化（デフォルト設定）
    miyabi_core::init_logger();

    // カスタム設定
    let config = LoggerConfig {
        level: LogLevel::Debug,
        format: LogFormat::Json, // CI/CDでJSON形式
        file_directory: Some("./logs".to_string()),
        rotation: tracing_appender::rolling::Rotation::DAILY,
    };
    miyabi_core::init_logger_with_config(&config);
}
```

#### 2. ログ出力（構造化ログ）

```rust
use tracing::{info, warn, error, debug};

// 基本的なログ
info!("Task started");

// 構造化ログ（フィールド付き）
info!(
    task_id = %task.id,
    agent_type = ?agent.agent_type(),
    "Agent execution started"
);

// エラーログ
error!(
    error = %e,
    task_id = %task.id,
    "Agent execution failed"
);

// デバッグログ
debug!(
    retry_attempt = attempt,
    backoff_ms = backoff,
    "Retrying operation"
);
```

### ログレベルの選択

| レベル | 用途 | 例 |
|--------|------|-----|
| **error** | エラー・失敗 | API呼び出し失敗、データベースエラー |
| **warn** | 警告・非推奨 | リトライ中、設定値が推奨範囲外 |
| **info** | 重要なイベント | Agent実行開始・完了、Issue処理 |
| **debug** | デバッグ情報 | 内部状態、中間値 |
| **trace** | 詳細トレース | 関数呼び出し、ループ内の値 |

### フォーマット選択

```rust
use miyabi_core::LogFormat;

// 開発環境: 色付き・人間可読
LogFormat::Pretty

// CI/CD: コンパクト・高速
LogFormat::Compact

// 本番環境: JSON・構造化
LogFormat::Json
```

---

## Retry Logic

### 基本的な使用方法

#### 1. デフォルト設定でリトライ

```rust
use miyabi_core::retry_with_backoff;
use miyabi_types::error::Result;

async fn my_operation() -> Result<String> {
    // リトライ可能な操作
    retry_with_backoff(|| async {
        // GitHub API呼び出し等
        call_external_api().await
    }).await
}
```

#### 2. カスタム設定でリトライ

```rust
use miyabi_core::{retry_with_backoff, RetryConfig};

async fn aggressive_retry() -> Result<String> {
    let config = RetryConfig {
        max_attempts: 5,           // 5回リトライ
        initial_delay_ms: 50,      // 初期50ms
        max_delay_ms: 10_000,      // 最大10秒
        backoff_multiplier: 2.0,   // 指数バックオフ
    };

    retry_with_backoff_config(|| async {
        call_unreliable_api().await
    }, &config).await
}
```

#### 3. プリセット設定

```rust
// 高速リトライ（APIコール向け）
let config = RetryConfig::aggressive(); // 5回, 50ms初期

// デフォルト（一般用途）
let config = RetryConfig::default(); // 3回, 100ms初期

// 保守的（重い処理向け）
let config = RetryConfig::conservative(); // 2回, 500ms初期
```

### リトライ対象エラーの判定

```rust
use miyabi_core::is_retryable;
use miyabi_types::error::MiyabiError;

match my_operation().await {
    Ok(result) => Ok(result),
    Err(e) => {
        if is_retryable(&e) {
            // リトライ可能なエラー（ネットワーク等）
            warn!("Retryable error: {}", e);
            retry_operation().await
        } else {
            // リトライ不可（無効な入力等）
            error!("Non-retryable error: {}", e);
            Err(e)
        }
    }
}
```

### バックオフ計算

指数バックオフの仕組み:

```
Attempt 1: 100ms
Attempt 2: 200ms (100 * 2^1)
Attempt 3: 400ms (100 * 2^2)
Attempt 4: 800ms (100 * 2^3)
...
Max: 30,000ms (設定値)
```

---

## Security

### 脆弱性スキャン

#### 1. cargo-audit実行

```rust
use miyabi_core::{run_cargo_audit, SecurityAuditResult};

async fn security_check() -> Result<()> {
    let result = run_cargo_audit("./").await?;

    println!("Security Score: {}/100", result.score);
    println!("Critical: {}", result.critical_count);
    println!("High: {}", result.high_count);

    if result.score < 70 {
        error!("Security score too low: {}", result.score);
        return Err(MiyabiError::SecurityAudit(
            "Failed security threshold".to_string()
        ));
    }

    Ok(())
}
```

#### 2. 脆弱性の処理

```rust
for vuln in result.vulnerabilities {
    match vuln.severity {
        VulnerabilitySeverity::Critical => {
            error!(
                id = %vuln.id,
                package = %vuln.package,
                "CRITICAL vulnerability found"
            );
            // 即座に対応が必要
        }
        VulnerabilitySeverity::High => {
            warn!(
                id = %vuln.id,
                package = %vuln.package,
                "HIGH vulnerability found"
            );
            // 近日中に対応
        }
        _ => {
            info!(
                id = %vuln.id,
                package = %vuln.package,
                "Vulnerability found (non-critical)"
            );
        }
    }
}
```

### シークレット管理

#### 環境変数の安全な取得

```rust
use std::env;
use miyabi_types::error::{MiyabiError, Result};

fn get_github_token() -> Result<String> {
    env::var("GITHUB_TOKEN")
        .map_err(|_| MiyabiError::Config(
            "GITHUB_TOKEN not set. Set it with: export GITHUB_TOKEN=ghp_xxx".to_string()
        ))
}

// ❌ 悪い例: トークンをログに出力
error!("API call failed with token: {}", token);

// ✅ 良い例: トークンを隠す
error!("API call failed (token: ***REDACTED***)");
```

#### シークレットのマスキング

```rust
fn mask_secret(secret: &str) -> String {
    if secret.len() <= 8 {
        "***".to_string()
    } else {
        format!("{}***{}", &secret[..4], &secret[secret.len()-4..])
    }
}

// 例: "ghp_1234567890abcdef" → "ghp_***cdef"
```

---

## マイグレーションガイド

### Before: 独自実装

#### ロギング（Before）

```rust
// ❌ println!での出力
println!("Task started: {}", task.id);

// ❌ 独自のログマクロ
log_info!("Task started");
```

#### リトライ（Before）

```rust
// ❌ 独自のリトライループ
for attempt in 0..3 {
    match my_operation().await {
        Ok(result) => return Ok(result),
        Err(e) if attempt < 2 => {
            tokio::time::sleep(Duration::from_millis(100 * 2_u64.pow(attempt))).await;
            continue;
        }
        Err(e) => return Err(e),
    }
}
```

### After: miyabi-core使用

#### ロギング（After）

```rust
// ✅ tracing使用
use tracing::info;

info!(
    task_id = %task.id,
    "Task started"
);
```

#### リトライ（After）

```rust
// ✅ miyabi-core使用
use miyabi_core::retry_with_backoff;

retry_with_backoff(|| async {
    my_operation().await
}).await?
```

---

## ベストプラクティス

### 1. ログのベストプラクティス

✅ **良い例**:
```rust
info!(
    task_id = %task.id,
    agent_type = ?agent.agent_type(),
    duration_ms = duration.as_millis(),
    "Agent execution completed"
);
```

❌ **悪い例**:
```rust
println!("Agent done"); // 構造化されていない
info!("Agent {} done for task {}", agent, task); // フィールドなし
```

### 2. リトライのベストプラクティス

✅ **良い例**:
```rust
// リトライ可能なエラーのみリトライ
if is_retryable(&error) {
    retry_with_backoff(operation).await
} else {
    return Err(error); // 即座に失敗
}
```

❌ **悪い例**:
```rust
// すべてのエラーをリトライ（無駄なリトライ）
retry_with_backoff(operation).await
```

### 3. セキュリティのベストプラクティス

✅ **良い例**:
```rust
// 環境変数から取得
let token = env::var("GITHUB_TOKEN")?;

// ログにはマスク
info!(token = "***REDACTED***", "API call started");
```

❌ **悪い例**:
```rust
// ハードコード
let token = "ghp_1234567890abcdef"; // ❌ NG

// ログに平文出力
info!(token = %token, "API call started"); // ❌ NG
```

---

## チェックリスト

### 新規コード作成時

- [ ] `tracing`でログ出力
- [ ] 外部API呼び出しには`retry_with_backoff`使用
- [ ] 環境変数からシークレット取得
- [ ] エラーログにシークレット含まない
- [ ] 構造化ログ（フィールド付き）を使用

### 既存コードレビュー時

- [ ] `println!` → `tracing`へ移行
- [ ] 独自リトライ → `miyabi-core::retry`へ移行
- [ ] ハードコードされたシークレット削除
- [ ] ログにシークレット含まれていないか確認

---

## 参考資料

### ドキュメント

- [miyabi-core API Docs](../crates/miyabi-core/src/lib.rs)
- [tracing Documentation](https://docs.rs/tracing)
- [cargo-audit](https://github.com/RustSec/rustsec/tree/main/cargo-audit)

### コード例

- [miyabi-agents orchestration.rs](../crates/miyabi-agents/src/orchestration.rs) - リトライ実装例
- [miyabi-worktree telemetry.rs](../crates/miyabi-worktree/src/telemetry.rs) - 構造化ログ例

---

**作成者**: Claude Code (miyabi)
**最終更新**: 2025-10-19
**関連Issue**: #206 (Consolidate Cross-Cutting Concerns)
