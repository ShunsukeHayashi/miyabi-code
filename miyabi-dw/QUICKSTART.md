# Miyabi Data Warehouse - Quick Start Guide

**所要時間**: 10分

---

## 🚀 最速セットアップ（3ステップ）

### Step 1: 環境変数設定

```bash
cd miyabi-dw
cp .env.example .env
# .envファイルを編集（必要に応じて）
```

### Step 2: データウェアハウス起動

```bash
# 全サービス起動（Airflow + PostgreSQL）
docker-compose up -d

# 初回のみ: Airflow初期化
docker-compose up airflow-init

# ログ確認
docker-compose logs -f
```

### Step 3: データベース初期化

```bash
# DWデータベース・テーブル作成
./scripts/init_dw.sh

# 初期データ投入（Agents, Labels等）
./scripts/load_initial_dimensions.sh
```

---

## ✅ 動作確認

### Airflow Web UI

```
URL: http://localhost:8080
ユーザー名: admin
パスワード: admin
```

**確認項目**:
- [ ] DAGが2つ表示される（`daily_issue_processing_etl`, `hourly_agent_metrics_etl`）
- [ ] 接続設定が正常（Admin > Connections）

### PostgreSQL接続

```bash
# Data Warehouse接続
docker-compose exec postgres-dw psql -U postgres -d miyabi_dw

# テーブル確認
\dt

# Dimension確認
SELECT COUNT(*) FROM dim_agent;
SELECT COUNT(*) FROM dim_label;
SELECT COUNT(*) FROM dim_time;
```

---

## 🎯 初回ETL実行

### 手動トリガー（テスト用）

```bash
# Daily ETL実行
docker-compose exec airflow-scheduler \
  airflow dags trigger daily_issue_processing_etl

# Hourly ETL実行
docker-compose exec airflow-scheduler \
  airflow dags trigger hourly_agent_metrics_etl
```

### スケジュール有効化

```bash
# DAGを有効化（自動実行開始）
docker-compose exec airflow-scheduler \
  airflow dags unpause daily_issue_processing_etl

docker-compose exec airflow-scheduler \
  airflow dags unpause hourly_agent_metrics_etl
```

---

## 📊 データ確認

### Fact Tableにデータが入っているか

```sql
-- Issue Processing Facts
SELECT COUNT(*) FROM fact_issue_processing;

-- Agent Execution Facts
SELECT COUNT(*) FROM fact_agent_execution;
```

### Data Marts更新

```bash
docker-compose exec postgres-dw psql -U postgres -d miyabi_dw <<EOF
REFRESH MATERIALIZED VIEW mart_development_performance;
REFRESH MATERIALIZED VIEW mart_agent_performance;
REFRESH MATERIALIZED VIEW mart_infrastructure_cost;
EOF
```

### サンプルクエリ実行

```sql
-- Development Performance（月次DORA metrics）
SELECT
    year, month,
    total_issues,
    deployment_frequency_per_day,
    mean_lead_time_hours,
    build_success_rate
FROM mart_development_performance
WHERE year = 2025
ORDER BY year, month;

-- Agent Performance（コスト分析）
SELECT
    agent_type,
    total_executions,
    total_llm_cost_usd,
    success_rate
FROM mart_agent_performance
WHERE year = 2025 AND month = 1
ORDER BY total_llm_cost_usd DESC;
```

---

## 🔧 トラブルシューティング

### Issue: "Connection refused" エラー

**原因**: Source DBに接続できない
**解決策**:
```bash
# .envファイルのSource DB設定を確認
cat .env | grep MIYABI_SOURCE

# または、Airflow UI > Admin > Connections > miyabi_source_db を編集
# Host: host.docker.internal (macOS/Windows) または 実IPアドレス
```

### Issue: DAGがImport Errorになる

**原因**: Python依存関係不足
**解決策**:
```bash
# Airflow Schedulerログ確認
docker-compose logs airflow-scheduler | grep ERROR

# Pythonパッケージ追加が必要な場合
docker-compose exec airflow-scheduler pip install <package-name>
docker-compose restart airflow-scheduler
```

### Issue: Materialized Viewが空

**原因**: Fact Tableにデータがない
**解決策**:
```bash
# ETLを実行してからRefresh
docker-compose exec airflow-scheduler airflow dags trigger daily_issue_processing_etl

# ETL完了後、Materialized View更新
docker-compose exec postgres-dw psql -U postgres -d miyabi_dw -c \
  "REFRESH MATERIALIZED VIEW mart_development_performance;"
```

---

## 🛑 停止・クリーンアップ

### サービス停止

```bash
# 全サービス停止
docker-compose stop

# 全サービス停止 + コンテナ削除
docker-compose down
```

### データ完全削除（注意）

```bash
# ⚠️ データベースボリューム含めて完全削除
docker-compose down -v
```

---

## 📚 次のステップ

1. **カスタムDAG作成** - `airflow/dags/`にPythonファイル追加
2. **データマート追加** - `sql/marts/`に新しいMaterialized View追加
3. **Grafana連携** - PostgreSQL Data SourceとしてDWを接続
4. **アラート設定** - Airflow SMTP設定でエラー通知

---

**完了したら**: [README.md](README.md) で詳細な運用方法を確認してください。
