# Miyabi Data Warehouse

**Version**: 1.0.0
**Status**: Production Ready
**Architecture**: Star Schema with Apache Airflow ETL

---

## 📊 概要

Miyabiプロジェクトの運用データを分析・可視化するためのデータウェアハウス（DW）実装です。

### 主要機能

- ✅ **Star Schema設計** - 5個のFact Table、6個のDimension Table
- ✅ **Apache Airflow ETL** - 自動化されたデータパイプライン
- ✅ **Data Marts** - 事前集計された分析ビュー（DORA metrics含む）
- ✅ **Type 2 SCD** - Issue/Infrastructureの履歴トラッキング
- ✅ **Docker Compose** - 簡単なローカル環境構築

---

## 🏗️ アーキテクチャ

### Star Schema

```
                  ┌─────────────┐
                  │  dim_time   │
                  └─────┬───────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼──────┐ ┌──────▼─────┐
│  dim_issue   │ │ dim_agent  │ │ dim_label  │
│  (Type 2)    │ │            │ │            │
└───────┬──────┘ └─────┬──────┘ └──────┬─────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
              ┌─────────▼──────────┐
              │ fact_issue_        │
              │   processing       │◄────┐
              └────────────────────┘     │
                                         │
              ┌────────────────────┐     │
              │ fact_agent_        │     │
              │   execution        │◄────┤
              └────────────────────┘     │
                                         │
              ┌────────────────────┐     │
              │ fact_deployment    │◄────┤
              └────────────────────┘     │
                                         │
              ┌────────────────────┐     │
              │ fact_code_         │     │
              │   generation       │◄────┘
              └────────────────────┘

           ┌─────────────────┐
           │ dim_worktree    │
           └─────────────────┘
                   ▲
                   │
           ┌───────┴─────────┐
           │ dim_            │
           │ infrastructure  │
           │   (Type 2)      │
           └─────────────────┘
```

### Dimension Tables (6)

| Table | Type | Description |
|-------|------|-------------|
| `dim_time` | Type 1 | カレンダー・会計年度階層 |
| `dim_issue` | Type 2 | Issue属性（優先度、複雑度等）|
| `dim_agent` | Type 1 | Miyabi Agent定義 |
| `dim_infrastructure` | Type 2 | AWSリソース定義 |
| `dim_label` | Type 1 | Miyabi 57-label system |
| `dim_worktree` | Type 1 | Git Worktree管理 |

### Fact Tables (5)

| Table | Granularity | Description |
|-------|-------------|-------------|
| `fact_issue_processing` | Issue処理単位 | 処理時間、コスト、品質指標 |
| `fact_code_generation` | コード生成単位 | 生成行数、AI使用量、品質 |
| `fact_deployment` | デプロイ単位 | インフラコスト、ヘルスチェック |
| `fact_agent_execution` | Agent実行単位 | パフォーマンス、LLMコスト |
| `fact_performance_metrics` | 時系列メトリクス | システムリソース使用率 |

### Data Marts (3)

| Mart | Purpose | Key Metrics |
|------|---------|-------------|
| `mart_development_performance` | 開発パフォーマンス分析 | DORA metrics, 品質指標 |
| `mart_agent_performance` | Agent効率分析 | LLMコスト、成功率、トークン効率 |
| `mart_infrastructure_cost` | インフラコスト分析 | デプロイコスト、リソース使用率 |

---

## 🚀 セットアップ

### 前提条件

- Docker & Docker Compose
- PostgreSQL 15+ (source database)
- Python 3.11+ (Airflow用)

### 1. データウェアハウス初期化

```bash
cd miyabi-dw

# PostgreSQL起動 (Docker Compose)
docker-compose up -d postgres-dw

# データベース・テーブル作成
./scripts/init_dw.sh

# 初期Dimension data読み込み
./scripts/load_initial_dimensions.sh
```

### 2. Airflow起動

```bash
# Airflow全サービス起動
docker-compose up -d

# 初回のみ: Airflowデータベース初期化
docker-compose up airflow-init

# Webserver起動確認
# http://localhost:8080
# ユーザー名: admin
# パスワード: admin
```

### 3. ETL Pipeline有効化

```bash
# Airflow CLI経由でDAG有効化
docker-compose exec airflow-scheduler airflow dags unpause daily_issue_processing_etl
docker-compose exec airflow-scheduler airflow dags unpause hourly_agent_metrics_etl

# 手動トリガー（テスト用）
docker-compose exec airflow-scheduler airflow dags trigger daily_issue_processing_etl
```

### 4. 接続設定（重要）

Airflow Webserver UIで以下の接続を設定：

#### `miyabi_source_db` (Source Database)
```
Connection Type: Postgres
Host: host.docker.internal (macOS/Windows) または postgres (Linux)
Schema: miyabi
Login: postgres
Password: <your_password>
Port: 5432
```

#### `miyabi_dw` (Data Warehouse)
```
Connection Type: Postgres
Host: postgres-dw
Schema: miyabi_dw
Login: postgres
Password: postgres
Port: 5432
```

---

## 📅 ETL スケジュール

### Daily ETL (`daily_issue_processing_etl`)

**スケジュール**: 毎日2:00 AM
**処理内容**:
1. 前日分のIssue処理データを抽出
2. 品質指標・成功判定を計算
3. Dimension keyルックアップ
4. `fact_issue_processing`へロード
5. 参照整合性チェック

**タスクフロー**:
```
extract_issues → transform_issue_facts → load_fact_issue_processing → check_referential_integrity
```

### Hourly ETL (`hourly_agent_metrics_etl`)

**スケジュール**: 毎時0分
**処理内容**:
1. 過去1時間のAgent実行ログを抽出
2. LLMコスト計算、キャッシュヒット率算出
3. `fact_agent_execution`へロード
4. データ鮮度チェック

**タスクフロー**:
```
extract_agent_metrics → transform_agent_execution_facts → load_fact_agent_execution → check_data_freshness
```

---

## 📈 Data Marts活用方法

### Development Performance Mart

```sql
-- 月次のDORA metrics取得
SELECT
    year,
    month,
    deployment_frequency_per_day,
    mean_lead_time_hours,
    change_failure_rate,
    build_success_rate,
    test_success_rate
FROM mart_development_performance
WHERE year = 2025 AND priority = 'P1'
ORDER BY year, month;
```

### Agent Performance Mart

```sql
-- Agent別のコスト効率分析
SELECT
    agent_type,
    total_executions,
    total_llm_cost_usd,
    avg_llm_cost_per_execution,
    tokens_per_dollar,
    success_rate
FROM mart_agent_performance
WHERE year = 2025 AND month = 1
ORDER BY total_llm_cost_usd DESC;
```

### Infrastructure Cost Mart

```sql
-- 月次コストトレンド
SELECT
    year,
    month,
    cloud_provider,
    resource_type,
    total_cost,
    successful_deployments,
    cost_per_successful_deployment
FROM mart_infrastructure_cost
WHERE year = 2025
ORDER BY year, month, total_cost DESC;
```

---

## 🔧 運用

### Materialized View更新

Data Martsは Materialized View のため、定期的に更新が必要です：

```bash
# Airflow DAGとして実装する場合
docker-compose exec airflow-scheduler airflow dags trigger refresh_data_marts

# 手動更新（PostgreSQL直接）
docker-compose exec postgres-dw psql -U postgres -d miyabi_dw -c "
  REFRESH MATERIALIZED VIEW CONCURRENTLY mart_development_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mart_agent_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mart_infrastructure_cost;
"
```

### データ品質チェック

```sql
-- Fact Tableのデータ品質確認
SELECT * FROM v_fact_data_quality;

-- Dimension完全性チェック
SELECT
    COUNT(*) FILTER (WHERE is_current = TRUE) AS current_issues,
    COUNT(*) AS total_issue_versions
FROM dim_issue;
```

### ログ確認

```bash
# Airflow Scheduler ログ
docker-compose logs -f airflow-scheduler

# Airflow Webserver ログ
docker-compose logs -f airflow-webserver

# PostgreSQL ログ
docker-compose logs -f postgres-dw
```

---

## 📂 ディレクトリ構造

```
miyabi-dw/
├── airflow/
│   ├── dags/                      # Airflow DAG定義
│   │   ├── daily_issue_processing_etl.py
│   │   └── hourly_agent_metrics_etl.py
│   ├── plugins/                   # カスタムOperator/Hook
│   ├── logs/                      # Airflowログ（自動生成）
│   └── config/
│       └── airflow.cfg            # Airflow設定
├── sql/
│   ├── ddl/                       # DDL (Data Definition)
│   │   ├── 01_create_dimensions.sql
│   │   └── 02_create_facts.sql
│   ├── dml/                       # DML (Data Manipulation)
│   │   ├── load_dim_agent.sql
│   │   └── load_dim_label.sql
│   ├── marts/                     # Data Marts
│   │   ├── 01_mart_development_performance.sql
│   │   ├── 02_mart_agent_performance.sql
│   │   └── 03_mart_infrastructure_cost.sql
│   └── etl/                       # ETL用SQL
├── scripts/
│   ├── init_dw.sh                 # 初期化スクリプト
│   └── load_initial_dimensions.sh # 初期データ投入
├── docker-compose.yml             # Docker Compose定義
└── README.md                      # このファイル
```

---

## 🎯 DORA Metrics定義

### Deployment Frequency (デプロイ頻度)
```sql
COUNT(DISTINCT issue_processing_key) FILTER (WHERE deployment_success) /
    NULLIF(EXTRACT(DAY FROM MAX(completed_at) - MIN(started_at)), 0)
```

### Lead Time for Changes (変更リードタイム)
```sql
AVG(processing_duration_seconds) FILTER (WHERE deployment_success) / 3600.0
```

### Change Failure Rate (変更失敗率)
```sql
AVG(CASE WHEN NOT deployment_success THEN 100.0 ELSE 0.0 END)
```

### Mean Time to Restore (MTTR)
```
-- 将来実装予定（Incident trackingが必要）
```

---

## 🔐 セキュリティ

### 本番環境での注意事項

1. **パスワード変更必須**
   - `docker-compose.yml`のデフォルトパスワードを変更
   - Airflow Webserver秘密鍵を変更

2. **ネットワーク分離**
   - Source DBへのアクセスをVPN/Private Subnet経由に制限
   - Airflow WebserverをVPN背後に配置

3. **暗号化**
   - PostgreSQL接続にSSL/TLS使用
   - Fernet Keyを環境変数で管理

4. **アクセス制御**
   - Airflow RBACを有効化
   - PostgreSQL Role-Based Access Control設定

---

## 📊 パフォーマンスチューニング

### PostgreSQL設定

```sql
-- 大規模データセット用の推奨設定
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';
```

### インデックス最適化

```sql
-- パフォーマンス分析
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

-- 未使用インデックスの検出
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

---

## 🐛 トラブルシューティング

### Issue 1: Airflow DAGが表示されない

**原因**: DAGファイルのPython構文エラー
**解決策**:
```bash
# DAG構文チェック
docker-compose exec airflow-scheduler airflow dags list-import-errors
```

### Issue 2: ETLタスクが失敗

**原因**: 接続設定が不正確
**解決策**:
```bash
# 接続テスト
docker-compose exec airflow-scheduler airflow connections test miyabi_source_db
docker-compose exec airflow-scheduler airflow connections test miyabi_dw
```

### Issue 3: Materialized Viewの更新が遅い

**原因**: データ量増加によるクエリ性能低下
**解決策**:
```sql
-- Incremental Refreshに変更（将来実装）
-- または、パーティショニング導入
```

---

## 📚 参考資料

- [Apache Airflow公式ドキュメント](https://airflow.apache.org/docs/)
- [Kimball Dimensional Modeling](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/)
- [DORA Metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)

---

## 📝 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-18 | 初版リリース |

---

**Project**: Miyabi Data Warehouse
**Maintainer**: Miyabi Team
**License**: Proprietary
