// database_optimized.rs
// SQL クエリ最適化パターン & ベストプラクティス

use sqlx::PgPool;
use crate::models::*;
use crate::error::ApiError;

/// N+1 クエリ問題を解決するための最適化パターン
///
/// ❌ 非効率なパターン（N+1 問題）:
/// ```ignore
/// // ハンドラで1回、ループ内で N回 = N+1 回のクエリ実行
/// let users = get_all_users(&pool).await?;
/// for user in users {
///     let repos = get_user_repositories(&pool, user.id).await?;
/// }
/// ```
///
/// ✅ 効率的なパターン（JOIN を使用）:
/// ```ignore
/// let users_with_repos = get_users_with_repositories(&pool).await?;
/// ```

/// パターン 1: LEFT JOIN で関連データを一度に取得
pub async fn get_agent_executions_with_repository(
    pool: &PgPool,
    user_id: i64,
) -> Result<Vec<(AgentExecution, Option<Repository>)>, ApiError> {
    let results = sqlx::query_as::<_, (AgentExecution, Option<Repository>)>(
        r#"
        SELECT
            ae.id, ae.user_id, ae.repository_id, ae.agent_type,
            ae.status, ae.started_at, ae.completed_at, ae.result, ae.error_message,
            r.id, r.user_id, r.github_repo_id, r.owner, r.name,
            r.full_name, r.default_branch, r.is_active, r.created_at, r.updated_at
        FROM agent_executions ae
        LEFT JOIN repositories r ON ae.repository_id = r.id
        WHERE ae.user_id = $1
        ORDER BY ae.started_at DESC
        LIMIT 100
        "#
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(results)
}

/// パターン 2: インデックス活用で高速フィルタリング
///
/// 必要な SQL インデックス:
/// ```sql
/// CREATE INDEX idx_agent_executions_user_status
///   ON agent_executions(user_id, status);
///
/// CREATE INDEX idx_agent_executions_created_at
///   ON agent_executions(created_at DESC);
/// ```
pub async fn get_executions_by_status(
    pool: &PgPool,
    user_id: i64,
    status: &str,
) -> Result<Vec<AgentExecution>, ApiError> {
    let executions = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT
            id, user_id, repository_id, agent_type, status,
            started_at, completed_at, result, error_message, created_at, updated_at
        FROM agent_executions
        WHERE user_id = $1 AND status = $2
        ORDER BY created_at DESC
        "#
    )
    .bind(user_id)
    .bind(status)
    .fetch_all(pool)
    .await?;

    Ok(executions)
}

/// パターン 3: DISTINCT で重複を除去（クライアント側ではなく DB 側で）
pub async fn get_unique_repositories(
    pool: &PgPool,
    user_id: i64,
) -> Result<Vec<Repository>, ApiError> {
    let repos = sqlx::query_as::<_, Repository>(
        r#"
        SELECT DISTINCT
            r.id, r.user_id, r.github_repo_id, r.owner, r.name,
            r.full_name, r.default_branch, r.is_active, r.created_at, r.updated_at
        FROM repositories r
        WHERE r.user_id = $1 AND r.is_active = true
        ORDER BY r.name ASC
        "#
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;

    Ok(repos)
}

/// パターン 4: ページネーションでメモリ効率化
pub struct PaginationParams {
    pub limit: i32,
    pub offset: i32,
}

pub async fn get_executions_paginated(
    pool: &PgPool,
    user_id: i64,
    params: PaginationParams,
) -> Result<(Vec<AgentExecution>, i64), ApiError> {
    // 1. 全体件数取得（キャッシュ可能）
    let total: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM agent_executions WHERE user_id = $1"
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    // 2. ページ分割データ取得
    let executions = sqlx::query_as::<_, AgentExecution>(
        r#"
        SELECT
            id, user_id, repository_id, agent_type, status,
            started_at, completed_at, result, error_message, created_at, updated_at
        FROM agent_executions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
        "#
    )
    .bind(user_id)
    .bind(params.limit)
    .bind(params.offset)
    .fetch_all(pool)
    .await?;

    Ok((executions, total.0))
}

/// パターン 5: バルク操作でパフォーマンス向上
///
/// ❌ 非効率: ループで複数INSERT
/// ```ignore
/// for item in items {
///     insert_item(&pool, item).await?; // N回のクエリ
/// }
/// ```
///
/// ✅ 効率的: 1つの INSERT...VALUES で複数行
pub async fn insert_executions_bulk(
    pool: &PgPool,
    executions: Vec<AgentExecution>,
) -> Result<u64, ApiError> {
    if executions.is_empty() {
        return Ok(0);
    }

    // VALUES (...), (...), (...) でまとめて INSERT
    let mut query = String::from(
        "INSERT INTO agent_executions (user_id, repository_id, agent_type, status, started_at) VALUES "
    );

    for (i, exec) in executions.iter().enumerate() {
        if i > 0 {
            query.push(',');
        }
        query.push_str(&format!(
            "({}, {}, '{}', '{}', NOW())",
            exec.user_id, exec.repository_id, exec.agent_type, "pending"
        ));
    }

    let rows = sqlx::query(&query)
        .execute(pool)
        .await?
        .rows_affected();

    Ok(rows)
}

/// パターン 6: EXPLAIN ANALYZE でクエリ分析
///
/// 使用方法:
/// ```bash
/// EXPLAIN ANALYZE
/// SELECT * FROM agent_executions WHERE user_id = 1 AND status = 'running';
/// ```
///
/// 出力例:
/// ```
/// Seq Scan on agent_executions  (cost=0.00..1000.00 rows=1 width=100)
///   Filter: (user_id = 1 AND status = 'running'::text)
/// ```
///
/// cost が高い場合（例：1000.00）→ インデックスが必要

/// パターン 7: 複合インデックスで複数条件を高速化
///
/// ```sql
/// -- 単一インデックス: 条件1 のみ最適化
/// CREATE INDEX idx_user ON agent_executions(user_id);
///
/// -- 複合インデックス: 複数条件を同時に最適化
/// CREATE INDEX idx_user_status_created
///   ON agent_executions(user_id, status, created_at DESC);
/// ```

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_query_optimization_patterns() {
        // クエリ最適化パターンの単体テスト例
        // 実装時に足す
    }
}
