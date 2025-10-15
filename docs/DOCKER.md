# 🐳 Miyabi Docker 完全ガイド - Rust Edition

**作成日**: 2025-10-15
**バージョン**: 2.0 (Rust Edition)
**対象**: Mac mini SSH環境 + GitHub Actions self-hosted runner

---

## 📋 目次

1. [Quick Start](#-quick-start)
2. [環境構築](#-環境構築)
3. [ビルド手順](#-ビルド手順)
4. [実行方法](#-実行方法)
5. [SSH経由でのリモート実行](#-ssh経由でのリモート実行)
6. [トラブルシューティング](#-トラブルシューティング)
7. [本番環境デプロイ](#-本番環境デプロイ)
8. [監視・メトリクス](#-監視メトリクス)

---

## 🚀 Quick Start

### 最小構成（本番環境）

```bash
# 1. 環境変数設定
cp .env.example .env
vim .env  # GITHUB_TOKENとREPOSITORY設定

# 2. ビルド＋起動
docker-compose up -d

# 3. ログ確認
docker-compose logs -f miyabi-agent

# 4. ステータス確認
docker-compose exec miyabi-agent miyabi --version
```

### フル構成（データベース＋監視）

```bash
# データベース、キャッシュ、監視を全て起動
docker-compose --profile with-database --profile with-cache --profile monitoring up -d

# Grafanaにアクセス
open http://localhost:3000
# ID: admin / PW: .envで設定したGRAFANA_PASSWORD
```

---

## 🛠️ 環境構築

### 必須要件

- **Docker**: 20.10.0以上
- **Docker Compose**: 2.0.0以上
- **ディスク空き容量**: 5GB以上（ビルドキャッシュ含む）
- **メモリ**: 4GB以上推奨

### インストール確認

```bash
# Docker バージョン確認
docker --version
# Docker version 24.0.7, build afdd53b

# Docker Compose バージョン確認
docker-compose --version
# Docker Compose version v2.23.0
```

### 環境変数設定

```bash
# .env.exampleをコピー
cp .env.example .env

# 必須環境変数を設定
vim .env
```

**最小限必要な環境変数**:
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPOSITORY=owner/repo
GITHUB_REPOSITORY_OWNER=owner
```

**推奨環境変数**（オプション）:
```bash
# Rust設定
RUST_LOG=info
RUST_BACKTRACE=0

# データベース
POSTGRES_PASSWORD=secure_password_here
REDIS_PASSWORD=redis_password_here

# 監視
GRAFANA_PASSWORD=admin
```

---

## 🔨 ビルド手順

### 1. 本番環境イメージビルド（最小サイズ）

```bash
# Dockerfileのruntimeステージをビルド
docker build --target runtime -t miyabi:latest .

# イメージサイズ確認
docker images miyabi:latest
# REPOSITORY   TAG       SIZE
# miyabi       latest    ~200MB（Rust最適化ビルド）
```

**ビルド時間**:
- 初回: 15-20分（依存関係ダウンロード＋コンパイル）
- 2回目以降: 5-10分（キャッシュ利用）

### 2. 開発環境イメージビルド

```bash
# Dockerfileのdevelopmentステージをビルド
docker build --target development -t miyabi:dev .

# イメージサイズ確認
docker images miyabi:dev
# REPOSITORY   TAG       SIZE
# miyabi       dev       ~1.5GB（開発ツール込み）
```

### 3. マルチプラットフォームビルド（Mac mini ARM64対応）

```bash
# Docker buildx セットアップ（初回のみ）
docker buildx create --use --name miyabi-builder

# ARM64 + x86_64 両対応ビルド
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target runtime \
  -t miyabi:latest \
  --push \
  .
```

### 4. docker-compose経由ビルド

```bash
# docker-compose.ymlに基づいてビルド
docker-compose build

# 特定サービスのみビルド
docker-compose build miyabi-agent
```

---

## ▶️ 実行方法

### 基本実行

#### 1. 本番環境（最小構成）

```bash
# バックグラウンド起動
docker-compose up -d miyabi-agent

# フォアグラウンド起動（ログ確認しながら）
docker-compose up miyabi-agent
```

#### 2. データベース付き起動

```bash
# PostgreSQL + Redis + Miyabiを起動
docker-compose --profile with-database --profile with-cache up -d

# データベース接続確認
docker-compose exec postgres psql -U miyabi -d miyabi -c '\dt'
```

#### 3. 監視付き起動

```bash
# Prometheus + Grafana + Miyabiを起動
docker-compose --profile monitoring up -d

# Prometheusにアクセス
open http://localhost:9090

# Grafanaにアクセス
open http://localhost:3000
```

#### 4. 開発環境起動

```bash
# 開発用コンテナを起動（インタラクティブモード）
docker-compose --profile development run --rm miyabi-dev

# コンテナ内でビルド
miyabi@container:/app$ cargo build
miyabi@container:/app$ cargo test
miyabi@container:/app$ cargo run --bin miyabi -- status
```

### Agent実行

#### ワンショット実行

```bash
# CoordinatorAgentでIssue #270を処理
docker-compose run --rm miyabi-agent \
  miyabi agent run coordinator --issue 270

# ReviewAgentでコード品質レビュー
docker-compose run --rm miyabi-agent \
  miyabi agent run review --issue 271
```

#### 常駐実行（RefresherAgent等）

```bash
# RefresherAgentを1時間ごとに実行（cron相当）
docker-compose up -d miyabi-agent

# ログを監視
docker-compose logs -f miyabi-agent
```

### ログ確認

```bash
# 全サービスのログ
docker-compose logs -f

# 特定サービスのログ
docker-compose logs -f miyabi-agent

# 最新100行のみ表示
docker-compose logs --tail=100 miyabi-agent

# タイムスタンプ付きログ
docker-compose logs -f -t miyabi-agent
```

### コンテナ管理

```bash
# 起動中のコンテナ確認
docker-compose ps

# コンテナ停止
docker-compose stop

# コンテナ停止＋削除
docker-compose down

# ボリューム含めて完全削除
docker-compose down -v

# イメージも削除
docker-compose down --rmi all -v
```

---

## 🌐 SSH経由でのリモート実行

Mac miniをDocker実行サーバーとして使用する場合の手順です。

### 1. Mac miniセットアップ

**Mac mini側での作業**:

```bash
# Docker Desktop for Macインストール
brew install --cask docker

# Docker起動確認
docker ps

# プロジェクトをクローン
git clone https://github.com/owner/miyabi-private.git
cd miyabi-private

# 環境変数設定
cp .env.example .env
vim .env  # GITHUB_TOKEN等を設定
```

### 2. SSH接続設定

**ローカルマシン側での作業**:

```bash
# SSH公開鍵をMac miniにコピー（初回のみ）
ssh-copy-id user@mac-mini.local

# SSH接続確認
ssh user@mac-mini.local
```

### 3. SSH経由でのDocker操作

#### リモートビルド

```bash
# Mac miniでビルド実行
ssh user@mac-mini.local "cd ~/miyabi-private && docker-compose build"
```

#### リモート起動

```bash
# Mac miniでコンテナ起動
ssh user@mac-mini.local "cd ~/miyabi-private && docker-compose up -d"

# ステータス確認
ssh user@mac-mini.local "cd ~/miyabi-private && docker-compose ps"
```

#### リモートログ確認

```bash
# リアルタイムログ監視
ssh user@mac-mini.local "cd ~/miyabi-private && docker-compose logs -f miyabi-agent"
```

#### リモートAgent実行

```bash
# SSH経由でAgent実行
ssh user@mac-mini.local "cd ~/miyabi-private && \
  docker-compose run --rm miyabi-agent miyabi agent run coordinator --issue 270"
```

### 4. Docker Context（上級者向け）

Docker Contextを使うとSSHコマンドを毎回実行せずに済みます。

```bash
# Docker Contextを作成
docker context create mac-mini \
  --docker "host=ssh://user@mac-mini.local"

# Contextを使用
docker context use mac-mini

# 以降、通常のdockerコマンドがMac miniで実行される
docker ps
docker-compose up -d

# ローカルに戻す
docker context use default
```

---

## 🔧 トラブルシューティング

### ビルドエラー

#### 1. 依存関係ダウンロード失敗

**エラー**:
```
error: failed to download `serde v1.0.193`
```

**解決方法**:
```bash
# ネットワーク確認
ping crates.io

# Cargoキャッシュクリア
rm -rf ~/.cargo/registry
docker-compose build --no-cache
```

#### 2. ディスク容量不足

**エラー**:
```
ERROR: failed to solve: error writing layer blob: no space left on device
```

**解決方法**:
```bash
# 未使用Dockerイメージ削除
docker image prune -a

# 未使用ボリューム削除
docker volume prune

# ビルドキャッシュ削除
docker builder prune -a
```

#### 3. メモリ不足

**エラー**:
```
signal: killed (OOM)
```

**解決方法**:
```bash
# Docker Desktopのメモリ設定を増やす（8GB推奨）
# Docker Desktop → Settings → Resources → Memory: 8GB

# または、並列ビルド数を減らす
docker build --build-arg CARGO_BUILD_JOBS=1 -t miyabi:latest .
```

### 実行時エラー

#### 1. GitHub Token認証失敗

**エラー**:
```
Error: GitHub authentication failed
```

**解決方法**:
```bash
# .envファイルを確認
cat .env | grep GITHUB_TOKEN

# トークンが正しいか確認
gh auth status

# 環境変数を再設定
docker-compose down
vim .env  # GITHUB_TOKENを修正
docker-compose up -d
```

#### 2. ポート競合

**エラー**:
```
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**解決方法**:
```bash
# 使用中のポート確認
lsof -i :3000

# docker-compose.ymlでポート番号変更
vim docker-compose.yml
# ports:
#   - "3001:3000"  # ローカルポートを3001に変更

# 再起動
docker-compose up -d
```

#### 3. コンテナが即座に終了

**エラー**:
```
miyabi-agent exited with code 0
```

**解決方法**:
```bash
# ログ確認
docker-compose logs miyabi-agent

# コマンド上書きで起動
docker-compose run --rm --entrypoint bash miyabi-agent

# コンテナ内で手動実行
bash-5.1$ miyabi --version
bash-5.1$ miyabi status
```

### SSH接続エラー

#### 1. SSH接続タイムアウト

**エラー**:
```
ssh: connect to host mac-mini.local port 22: Operation timed out
```

**解決方法**:
```bash
# Mac miniのSSH設定確認
# Mac mini → System Settings → Sharing → Remote Login: ON

# ネットワーク確認
ping mac-mini.local

# ホスト名をIPアドレスに変更
ssh user@192.168.1.100
```

#### 2. Docker Context接続失敗

**エラー**:
```
error during connect: Get "http://docker.example.com/v1.24/info": dial tcp: lookup docker.example.com: no such host
```

**解決方法**:
```bash
# Context削除
docker context rm mac-mini

# 正しいSSHホストでContext再作成
docker context create mac-mini --docker "host=ssh://user@mac-mini.local"

# 接続確認
docker context use mac-mini
docker ps
```

---

## 🚀 本番環境デプロイ

### 1. セキュリティ強化

#### パスワード変更

```bash
# .envファイルのパスワードを変更
vim .env
# POSTGRES_PASSWORD=<強力なパスワード>
# REDIS_PASSWORD=<強力なパスワード>
# GRAFANA_PASSWORD=<強力なパスワード>
```

#### 非rootユーザー実行確認

```bash
# コンテナ内のユーザー確認
docker-compose exec miyabi-agent whoami
# 出力: miyabi（非rootユーザー）
```

#### ポート公開制限

```bash
# docker-compose.ymlで外部公開ポートを制限
vim docker-compose.yml
# ports:
#   - "127.0.0.1:3000:3000"  # localhostのみ公開
```

### 2. リソース制限

```yaml
# docker-compose.ymlでリソース制限
services:
  miyabi-agent:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 3. ヘルスチェック

```bash
# ヘルスチェック確認
docker-compose ps
# STATE列が "healthy" であることを確認

# 手動ヘルスチェック
docker-compose exec miyabi-agent miyabi --version
```

### 4. ログローテーション

```yaml
# docker-compose.ymlでログローテーション設定
services:
  miyabi-agent:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 5. バックアップ

```bash
# データベースバックアップ
docker-compose exec postgres pg_dump -U miyabi miyabi > backup.sql

# ボリュームバックアップ
docker run --rm \
  -v miyabi-private_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# リストア
docker run --rm \
  -v miyabi-private_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

---

## 📊 監視・メトリクス

### 1. Prometheus + Grafana起動

```bash
# 監視スタック起動
docker-compose --profile monitoring up -d

# Prometheusにアクセス
open http://localhost:9090

# Grafanaにアクセス
open http://localhost:3000
# ID: admin
# PW: .envのGRAFANA_PASSWORD
```

### 2. メトリクス確認

**Prometheusクエリ例**:
```promql
# CPU使用率
rate(container_cpu_usage_seconds_total{name="miyabi-agent"}[5m])

# メモリ使用量
container_memory_usage_bytes{name="miyabi-agent"}

# ネットワークトラフィック
rate(container_network_transmit_bytes_total{name="miyabi-agent"}[5m])
```

### 3. アラート設定

**prometheus.yml**（例）:
```yaml
rule_files:
  - 'alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
```

**alerts.yml**（例）:
```yaml
groups:
  - name: miyabi
    interval: 30s
    rules:
      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes{name="miyabi-agent"} > 3GB
        for: 5m
        annotations:
          summary: "Miyabi agent high memory usage"
```

### 4. ログ監視

```bash
# リアルタイムログ監視
docker-compose logs -f miyabi-agent

# エラーログのみ抽出
docker-compose logs miyabi-agent 2>&1 | grep ERROR

# JSON形式ログをjqで整形
docker-compose logs --no-log-prefix miyabi-agent | jq .
```

---

## 📚 参考資料

### 関連ドキュメント
- [SELF_HOSTED_RUNNER_SETUP.md](./SELF_HOSTED_RUNNER_SETUP.md) - Self-hosted runner セットアップ
- [REFRESHER_AGENT_SELF_HOSTED_SETUP.md](./REFRESHER_AGENT_SELF_HOSTED_SETUP.md) - RefresherAgent設定
- [RUST_MIGRATION_REQUIREMENTS.md](./RUST_MIGRATION_REQUIREMENTS.md) - Rust移行要件

### 公式ドキュメント
- [Docker Compose CLI](https://docs.docker.com/compose/reference/)
- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)

---

## 🦀 Rust Edition の利点

Docker環境でRust Editionを使用する利点：

1. **高速実行**: Node.js版より50%以上高速
2. **低メモリ使用量**: Node.js版より30%以上削減
3. **単一バイナリ**: 依存関係不要（runtime imageが200MB程度）
4. **コンパイル時型安全性**: ランタイムエラー削減

---

**作成日**: 2025-10-15
**最終更新**: 2025-10-15
**バージョン**: 2.0 (Rust Edition)

🦀 **Miyabi - Rust 2021 Edition - Docker Optimized**
