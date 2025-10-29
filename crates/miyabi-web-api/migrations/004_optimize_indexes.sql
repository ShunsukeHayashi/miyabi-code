-- migrations/004_optimize_indexes.sql
-- パフォーマンス最適化用インデックス戦略

-- =============================================================================
-- 1. agent_executions テーブのインデックス最適化
-- =============================================================================

-- パターン: ユーザーごとの実行履歴を高速に取得
-- クエリ例: SELECT * FROM agent_executions WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_created_at
  ON agent_executions(user_id, created_at DESC)
  INCLUDE (status, agent_type);

-- パターン: ステータスでフィルタリング
-- クエリ例: SELECT * FROM agent_executions WHERE user_id = ? AND status = 'running'
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_status
  ON agent_executions(user_id, status)
  INCLUDE (created_at, agent_type);

-- パターン: Repository で検索
-- クエリ例: SELECT * FROM agent_executions WHERE repository_id = ?
CREATE INDEX IF NOT EXISTS idx_agent_executions_repository
  ON agent_executions(repository_id)
  INCLUDE (user_id, status);

-- パターン: 時系列検索（期間指定）
-- クエリ例: SELECT * FROM agent_executions WHERE created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_agent_executions_created_at
  ON agent_executions(created_at DESC)
  INCLUDE (user_id, status);

-- パターン: Agent タイプ別統計
-- クエリ例: SELECT agent_type, COUNT(*) FROM agent_executions WHERE user_id = ? GROUP BY agent_type
CREATE INDEX IF NOT EXISTS idx_agent_executions_user_agent_type
  ON agent_executions(user_id, agent_type);

-- =============================================================================
-- 2. repositories テーブのインデックス最適化
-- =============================================================================

-- パターン: ユーザーのリポジトリ一覧取得
-- クエリ例: SELECT * FROM repositories WHERE user_id = ? AND is_active = true
CREATE INDEX IF NOT EXISTS idx_repositories_user_active
  ON repositories(user_id, is_active)
  INCLUDE (name, full_name);

-- パターン: GitHub リポジトリID で検索
-- クエリ例: SELECT * FROM repositories WHERE github_repo_id = ?
CREATE INDEX IF NOT EXISTS idx_repositories_github_id
  ON repositories(github_repo_id);

-- パターン: 所有者別検索
-- クエリ例: SELECT * FROM repositories WHERE owner = ?
CREATE INDEX IF NOT EXISTS idx_repositories_owner
  ON repositories(owner);

-- =============================================================================
-- 3. web_users テーブのインデックス最適化
-- =============================================================================

-- パターン: GitHub ID で認証
-- クエリ例: SELECT * FROM web_users WHERE github_id = ?
CREATE INDEX IF NOT EXISTS idx_web_users_github_id
  ON web_users(github_id);

-- パターン: LINE ID で検索
-- クエリ例: SELECT * FROM web_users WHERE line_user_id = ?
CREATE INDEX IF NOT EXISTS idx_web_users_line_id
  ON web_users(line_user_id);

-- =============================================================================
-- 4. workflows テーブのインデックス最適化
-- =============================================================================

-- パターン: ユーザーのワークフロー取得
-- クエリ例: SELECT * FROM workflows WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_workflows_user_created
  ON workflows(user_id, created_at DESC);

-- パターン: リポジトリのワークフロー取得
-- クエリ例: SELECT * FROM workflows WHERE repository_id = ?
CREATE INDEX IF NOT EXISTS idx_workflows_repository
  ON workflows(repository_id)
  INCLUDE (user_id);

-- パターン: テンプレート検索
-- クエリ例: SELECT * FROM workflows WHERE is_template = true AND is_public = true
CREATE INDEX IF NOT EXISTS idx_workflows_template_public
  ON workflows(is_template, is_public);

-- =============================================================================
-- 5. line_messages テーブのインデックス最適化
-- =============================================================================

-- パターン: ユーザーのメッセージ履歴
-- クエリ例: SELECT * FROM line_messages WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_line_messages_user_created
  ON line_messages(user_id, created_at DESC);

-- パターン: LINE User ID で検索
-- クエリ例: SELECT * FROM line_messages WHERE line_user_id = ?
CREATE INDEX IF NOT EXISTS idx_line_messages_line_user
  ON line_messages(line_user_id);

-- =============================================================================
-- 6. websocket_connections テーブのインデックス最適化
-- =============================================================================

-- パターン: アクティブな接続を取得
-- クエリ例: SELECT * FROM websocket_connections WHERE user_id = ?
CREATE INDEX IF NOT EXISTS idx_websocket_connections_user
  ON websocket_connections(user_id);

-- パターン: 接続ID で高速検索
-- クエリ例: SELECT * FROM websocket_connections WHERE connection_id = ?
CREATE INDEX IF NOT EXISTS idx_websocket_connections_id
  ON websocket_connections(connection_id);

-- =============================================================================
-- パフォーマンス統計更新
-- =============================================================================

-- インデックス作成後、テーブル統計を更新
-- クエリプランを最適化
ANALYZE agent_executions;
ANALYZE repositories;
ANALYZE web_users;
ANALYZE workflows;
ANALYZE line_messages;
ANALYZE websocket_connections;

-- =============================================================================
-- インデックス活用ガイド
-- =============================================================================
--
-- 1. インデックス確認クエリ:
--    SELECT schemaname, tablename, indexname, indexdef
--    FROM pg_indexes
--    WHERE schemaname = 'public'
--    ORDER BY tablename, indexname;
--
-- 2. インデックス使用状況確認:
--    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
--    FROM pg_stat_user_indexes
--    ORDER BY idx_scan DESC;
--
-- 3. 低速クエリ分析:
--    EXPLAIN ANALYZE
--    SELECT * FROM agent_executions
--    WHERE user_id = 1 AND status = 'running'
--    ORDER BY created_at DESC
--    LIMIT 10;
--
-- 4. インデックスサイズ確認:
--    SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid))
--    FROM pg_indexes
--    JOIN pg_class ON pg_class.relname = pg_indexes.indexname
--    ORDER BY pg_relation_size(indexrelid) DESC;
