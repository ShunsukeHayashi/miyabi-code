# Claudable Setup Guide

**作成日**: 2025-10-25
**バージョン**: v1.0
**ステータス**: ✅ Setup完了

---

## 📋 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [セットアップ手順](#セットアップ手順)
4. [動作確認](#動作確認)
5. [トラブルシューティング](#トラブルシューティング)

---

## 概要

ClaudableはAI駆動のNext.jsアプリケーションビルダーです。Miyabi CodeGenAgentと統合し、フロントエンド生成を自動化します。

### アーキテクチャ

```
Miyabi CodeGenAgent
      ↓ HTTP POST /generate
Claudable API (http://localhost:8080)
      ↓
Generated Next.js App (TypeScript + Tailwind + shadcn/ui)
      ↓
Worktree Integration → npm install → build
```

### ポート

- **Frontend (Next.js)**: http://localhost:3001
- **API (FastAPI)**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs

---

## 前提条件

### 必須

1. **Docker & Docker Compose**
   ```bash
   docker --version  # 20.10+
   docker-compose --version  # 2.0+
   ```

2. **Anthropic API Key**
   - Get from: https://console.anthropic.com/
   - Required for Claude Code integration

### 推奨

- **8GB+ RAM** (Docker container用)
- **10GB+ Disk Space** (Claudableイメージ + 生成ファイル)

---

## セットアップ手順

### 1. 環境変数設定

`.env`ファイルに以下を追加：

```bash
# Claudable Configuration
CLAUDABLE_API_URL=http://localhost:8080
CLAUDABLE_API_KEY=  # Optional, for production

# REQUIRED: Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**テンプレート使用**:
```bash
# .env.exampleから.envを作成（まだの場合）
cp .env.example .env

# .envをエディタで開いてANTHROPIC_API_KEYを設定
vim .env
```

---

### 2. Dockerイメージビルド

```bash
# Claudableイメージをビルド
docker-compose build claudable
```

**初回ビルド時間**: 5-10分（依存関係インストール）

**ビルド確認**:
```bash
docker images | grep miyabi-claudable

# Expected output:
# miyabi-claudable    latest    abc123def456    2 minutes ago    1.2GB
```

---

### 3. Claudableコンテナ起動

```bash
# Claudableサービスを起動
docker-compose --profile claudable up -d

# ログ確認（起動プロセスを監視）
docker-compose logs -f claudable
```

**起動完了までの時間**: 1-2分

**起動ログ例**:
```
claudable_1  | ✓ Frontend ready on http://localhost:3000
claudable_1  | ✓ API server running on http://localhost:8080
claudable_1  | ✓ SQLite database initialized
```

---

### 4. ヘルスチェック

```bash
# API health endpoint
curl http://localhost:8080/health

# Expected:
# {"status":"ok"}
```

```bash
# Frontend確認
open http://localhost:3001  # macOS
# or
curl -I http://localhost:3001  # Check HTTP 200
```

---

## 動作確認

### Test 1: API疎通テスト

```bash
# /generate エンドポイントテスト
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Create a simple Next.js homepage with a header",
    "framework": "nextjs",
    "agent": "claude-code"
  }' | jq .

# Expected output:
# {
#   "project_id": "proj_abc123",
#   "files": [
#     {
#       "path": "app/page.tsx",
#       "content": "...",
#       "type": "typescript"
#     }
#   ],
#   "dependencies": ["next@14.0.0", ...],
#   "structure": { ... }
# }
```

### Test 2: Frontend UIアクセス

```bash
# ブラウザでFrontendを開く
open http://localhost:3001

# または
curl http://localhost:3001 | head -20
```

### Test 3: API Documentation

```bash
# Swagger UI
open http://localhost:8080/docs

# API仕様確認
curl http://localhost:8080/openapi.json | jq .
```

---

## Miyabi CodeGenAgent統合

### 1. CodeGenAgentでのClaudable使用

```bash
# Claudable統合有効化でAgent実行
cargo run --bin miyabi-cli -- agent run codegen \
  --issue 600 \
  --with-claudable

# Frontend taskが自動検出されると、Claudableが起動します
```

### 2. 自動Frontend検出キーワード

以下のキーワードを含むタスクはClaudableで処理されます：

```
ui, dashboard, frontend, web app, webapp,
next.js, nextjs, react, landing page, lp,
form, chart, table, component,
tailwind, css, design, layout
```

### 3. E2E Example

```bash
# 1. LINEでメッセージ送信
"ダッシュボードUIを作って。グラフと表を表示したい"

# 2. 自動的にIssue作成される

# 3. CoordinatorAgentがIssueを分析

# 4. CodeGenAgentがfrontend taskを検出

# 5. Claudable API呼び出し → Next.js app生成

# 6. Worktreeに統合 → npm install → build

# 7. ReviewAgent品質チェック

# 8. PRAgent自動PR作成
```

---

## トラブルシューティング

### Issue 1: Dockerコンテナ起動失敗

**症状**:
```
Error: Container miyabi-claudable exited with code 1
```

**解決策**:
```bash
# ログ確認
docker-compose logs claudable

# よくある原因:
# 1. ポート8080が既に使用されている
netstat -an | grep 8080

# 2. ANTHROPIC_API_KEYが設定されていない
grep ANTHROPIC_API_KEY .env

# 3. Dockerメモリ不足
docker system df
docker system prune  # 不要イメージ削除
```

---

### Issue 2: API接続エラー

**症状**:
```bash
curl http://localhost:8080/health
# curl: (7) Failed to connect to localhost port 8080
```

**解決策**:
```bash
# 1. コンテナステータス確認
docker ps | grep claudable

# 2. コンテナが起動していない場合
docker-compose --profile claudable up -d

# 3. ヘルスチェック失敗している場合
docker inspect miyabi-claudable | jq '.[].State.Health'

# 4. ポート確認
docker port miyabi-claudable
```

---

### Issue 3: ビルド時間が長い

**症状**:
```
Downloading dependencies... (10+ minutes)
```

**解決策**:
```bash
# キャッシュ使用の確認
docker-compose build --progress=plain claudable

# ネットワーク確認
ping github.com
ping npmjs.org

# タイムアウト延長（必要に応じて）
export COMPOSE_HTTP_TIMEOUT=300
docker-compose build claudable
```

---

### Issue 4: npm installエラー

**症状**:
```
npm ERR! code EACCES
npm ERR! permission denied
```

**解決策**:
```bash
# Dockerfileのパーミッション確認
cat docker/claudable/Dockerfile | grep USER

# コンテナ内で手動実行
docker exec -it miyabi-claudable bash
cd /app
npm install
```

---

### Issue 5: APIが404を返す

**症状**:
```bash
curl http://localhost:8080/generate
# {"detail":"Not Found"}
```

**解決策**:
```bash
# 1. API Documentation確認
curl http://localhost:8080/docs

# 2. 正しいエンドポイント確認
curl http://localhost:8080/  # ルート

# 3. ログでエラー確認
docker-compose logs -f claudable | grep ERROR
```

---

## パフォーマンスチューニング

### Docker Resource Limits

`docker-compose.yml`でClaudableリソースを調整:

```yaml
claudable:
  # ...
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 4G
      reservations:
        cpus: '0.5'
        memory: 1G
```

### 生成速度最適化

| 設定 | デフォルト | 最適化後 |
|------|----------|---------|
| LLM temperature | 0.7 | 0.2 (速度優先) |
| max_tokens | 4096 | 2048 (小規模生成) |
| parallel builds | 1 | 4 (並列化) |

---

## メンテナンス

### ログローテーション

```bash
# ログサイズ確認
docker logs miyabi-claudable | wc -l

# ログクリア
docker-compose down claudable
docker-compose up -d claudable
```

### データベースバックアップ

```bash
# SQLiteデータベースバックアップ
docker cp miyabi-claudable:/app/apps/api/data/claudable.db \
  ./backups/claudable-$(date +%Y%m%d).db
```

### アップデート

```bash
# 1. 最新Claudableイメージ取得
docker-compose build --no-cache claudable

# 2. コンテナ再起動
docker-compose down claudable
docker-compose --profile claudable up -d

# 3. 動作確認
curl http://localhost:8080/health
```

---

## セキュリティ

### 本番環境での注意事項

1. **API Key管理**
   ```bash
   # .envを.gitignoreに追加
   echo ".env" >> .gitignore

   # Secret management使用（推奨）
   # - AWS Secrets Manager
   # - HashiCorp Vault
   # - GitHub Secrets
   ```

2. **ネットワーク制限**
   ```yaml
   # docker-compose.yml
   claudable:
     # ...
     networks:
       - miyabi-network
     # 外部アクセス制限
   ```

3. **HTTPS化**
   ```bash
   # nginxリバースプロキシ設定
   # Let's Encrypt証明書使用
   ```

---

## 参考リンク

- **Claudable Repository**: https://github.com/opactorai/Claudable
- **Anthropic API**: https://console.anthropic.com/
- **Miyabi Integration**: [CLAUDABLE_INTEGRATION.md](./CLAUDABLE_INTEGRATION.md)
- **Implementation Plan**: [CLAUDABLE_IMPLEMENTATION_PLAN.md](./CLAUDABLE_IMPLEMENTATION_PLAN.md)

---

**Status**: ✅ Setup完了
**Tested**: 2025-10-25
**Maintainer**: Miyabi DevOps Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
