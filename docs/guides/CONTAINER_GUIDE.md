# 🐳 Container Guide - Miyabi Docker & GHCR

**目的**: MiyabiをDockerコンテナとして実行し、GitHub Container Registry (GHCR)から簡単にデプロイする方法を説明します。

**対象読者**: Docker経験者、DevOpsエンジニア、自動化したい開発者

---

## 📦 クイックスタート

### 1. イメージ取得

```bash
# 最新版
docker pull ghcr.io/shunsukehayashi/miyabi-private:latest

# 特定バージョン
docker pull ghcr.io/shunsukehayashi/miyabi-private:v1.0.0

# 開発版 (develop branch)
docker pull ghcr.io/shunsukehayashi/miyabi-private:develop
```

### 2. 基本実行

```bash
# バージョン確認
docker run --rm ghcr.io/shunsukehayashi/miyabi-private:latest --version

# ヘルプ表示
docker run --rm ghcr.io/shunsukehayashi/miyabi-private:latest --help

# ステータス確認
docker run --rm ghcr.io/shunsukehayashi/miyabi-private:latest status
```

---

## 🏗️ ビルドアーキテクチャ

### Multi-Stage Build

Dockerfileは5ステージで最適化されています：

```
Stage 1: base-builder     - Rust環境セットアップ (1.5GB)
Stage 2: dependencies     - 依存関係キャッシュ (2GB)
Stage 3: builder          - アプリケーションビルド (2.5GB)
Stage 4: runtime          - 本番環境 (最小化: ~150MB) ⭐
Stage 5: development      - 開発環境 (フル機能: ~2GB)
```

**最終イメージサイズ**: 約150MB (runtime)

### プラットフォーム対応

- ✅ `linux/amd64` - x86_64 (Intel/AMD)
- ✅ `linux/arm64` - ARM64 (Apple Silicon, Raspberry Pi等)

---

## 📚 使用例

### Agent実行

```bash
# CoordinatorAgent実行 (Issue #270を処理)
docker run --rm \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  agent run coordinator --issue 270

# 並列実行 (Issue #270, #271, #272を並行処理)
docker run --rm \
  -v $(pwd)/.worktrees:/app/.worktrees \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  agent run coordinator --issues 270,271,272 --concurrency 3
```

### Git操作 (Worktree)

```bash
# ボリュームマウントでWorktree永続化
docker run --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  agent run coordinator --issue 270
```

### GitHub Actions統合

```yaml
# .github/workflows/agent-execution.yml
jobs:
  run-agent:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/shunsukehayashi/miyabi-private:latest
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    steps:
      - name: Execute CoordinatorAgent
        run: miyabi agent run coordinator --issue ${{ github.event.issue.number }}
```

---

## 🔧 ローカルビルド

### 本番環境イメージ

```bash
# 本番環境 (runtime stage)
docker build --target runtime -t miyabi:latest .

# マルチプラットフォーム
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --target runtime \
  -t miyabi:latest \
  --push \
  .
```

### 開発環境イメージ

```bash
# 開発環境 (development stage)
docker build --target development -t miyabi:dev .

# 実行 (ソースコードマウント + ホットリロード)
docker run --rm \
  -v $(pwd):/app \
  -it miyabi:dev bash
```

---

## 🔐 環境変数

### 必須

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_xxxxx` |
| `ANTHROPIC_API_KEY` | Anthropic API Key (Agent実行時) | `sk-ant-xxxxx` |

### オプション

| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| `RUST_LOG` | ログレベル | `info` |
| `RUST_BACKTRACE` | バックトレース | `0` (無効) |
| `DEVICE_IDENTIFIER` | デバイス識別子 | `Docker` |

### 環境変数ファイル

```bash
# .env ファイル作成
cat > .env <<EOF
GITHUB_TOKEN=ghp_xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
RUST_LOG=debug
EOF

# 実行
docker run --rm --env-file .env \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  status
```

---

## 📊 パフォーマンス最適化

### レイヤーキャッシュ

Dockerfileは依存関係を最初にビルドするため、ソースコード変更時も高速：

```
ソースコード変更なし  → 全キャッシュヒット (10秒)
ソースコード変更あり  → 依存関係キャッシュ (2分)
Cargo.lock変更       → 依存関係再ビルド (8分)
```

### ビルドキャッシュ (GitHub Actions)

GitHub Actions Cacheを使用して、ビルド時間を80%削減：

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

---

## 🔍 トラブルシューティング

### Issue: コンテナが起動しない

```bash
# ログ確認
docker logs <container-id>

# デバッグモード実行
docker run --rm -e RUST_LOG=debug \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  --version
```

### Issue: GitHub API認証エラー

```bash
# トークン確認
docker run --rm -e GITHUB_TOKEN=$GITHUB_TOKEN \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  -c "gh auth status"

# トークンスコープ確認 (必要: repo, workflow, read:org)
```

### Issue: Worktreeが保存されない

```bash
# ボリュームマウント必須
docker run --rm \
  -v $(pwd)/.worktrees:/app/.worktrees \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  agent run coordinator --issue 270
```

### Issue: イメージが大きすぎる

```bash
# イメージサイズ確認
docker images ghcr.io/shunsukehayashi/miyabi-private

# runtime stageを使用 (最小化)
docker build --target runtime -t miyabi:slim .

# developmentは開発専用 (大きい)
```

---

## 🚀 デプロイパターン

### パターン1: GitHub Actions (推奨)

```yaml
# Self-hosted runner + Docker
jobs:
  deploy:
    runs-on: self-hosted
    steps:
      - name: Pull latest image
        run: docker pull ghcr.io/shunsukehayashi/miyabi-private:latest

      - name: Run agent
        run: |
          docker run --rm \
            -e GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }} \
            ghcr.io/shunsukehayashi/miyabi-private:latest \
            agent run coordinator --issue ${{ github.event.issue.number }}
```

### パターン2: docker-compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  miyabi:
    image: ghcr.io/shunsukehayashi/miyabi-private:latest
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - RUST_LOG=info
    volumes:
      - ./.worktrees:/app/.worktrees
    command: agent run coordinator --issue 270
```

```bash
# 実行
docker-compose up
```

### パターン3: Kubernetes

```yaml
# kubernetes/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: miyabi-agent
spec:
  replicas: 1
  selector:
    matchLabels:
      app: miyabi
  template:
    metadata:
      labels:
        app: miyabi
    spec:
      containers:
      - name: miyabi
        image: ghcr.io/shunsukehayashi/miyabi-private:latest
        env:
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: miyabi-secrets
              key: github-token
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: miyabi-secrets
              key: anthropic-api-key
```

---

## 📈 監視・ログ

### ログ出力

```bash
# リアルタイムログ
docker logs -f <container-id>

# JSON形式ログ (構造化)
docker run --rm \
  -e RUST_LOG=info \
  ghcr.io/shunsukehayashi/miyabi-private:latest \
  agent run coordinator --issue 270 2>&1 | jq .
```

### ヘルスチェック

```bash
# ヘルスチェック確認
docker inspect --format='{{json .State.Health}}' <container-id> | jq .

# Dockerfile内でのヘルスチェック (30秒間隔)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD miyabi --version || exit 1
```

---

## 🔒 セキュリティベストプラクティス

### 1. 非rootユーザー実行

```dockerfile
# Dockerfileで設定済み
USER miyabi
```

### 2. 最小イメージ

```
debian:bookworm-slim (runtime base) - セキュリティ更新適用
ca-certificates + git + gh のみインストール
```

### 3. イメージスキャン (Trivy)

```bash
# ローカルスキャン
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image ghcr.io/shunsukehayashi/miyabi-private:latest

# CI/CD自動スキャン (.github/workflows/docker-publish.yml)
```

### 4. シークレット管理

```bash
# ❌ ハードコード禁止
docker run --rm -e GITHUB_TOKEN=ghp_xxxxx ...

# ✅ 環境変数ファイル使用
docker run --rm --env-file .env ...

# ✅ Kubernetes Secrets
kubectl create secret generic miyabi-secrets \
  --from-literal=github-token=$GITHUB_TOKEN
```

---

## 📚 関連ドキュメント

- [Dockerfile](../Dockerfile) - Multi-stage build定義
- [docker-compose.yml](../docker-compose.yml) - Compose設定
- [.github/workflows/docker-publish.yml](../.github/workflows/docker-publish.yml) - CI/CD自動化
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - デプロイ全般ガイド

---

## ❓ FAQ

### Q: イメージはどこから取得できますか？

**A**: GitHub Container Registry (GHCR)から公開されています：
```bash
docker pull ghcr.io/shunsukehayashi/miyabi-private:latest
```

### Q: プライベートリポジトリのイメージを取得するには？

**A**: GitHub Personal Access Tokenで認証が必要です：
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker pull ghcr.io/shunsukehayashi/miyabi-private:latest
```

### Q: ARM64 (Apple Silicon)で動作しますか？

**A**: はい、マルチプラットフォーム対応です：
```bash
docker pull ghcr.io/shunsukehayashi/miyabi-private:latest
# 自動的にlinux/arm64イメージが取得されます
```

### Q: イメージサイズが大きい場合は？

**A**: `runtime` targetを使用してください（開発版は大きい）：
```bash
docker build --target runtime -t miyabi:slim .
```

### Q: Windowsで動作しますか？

**A**: はい、Docker Desktop for Windows (WSL2)で動作します：
```powershell
docker pull ghcr.io/shunsukehayashi/miyabi-private:latest
docker run --rm ghcr.io/shunsukehayashi/miyabi-private:latest --version
```

---

**最終更新**: 2025-10-15
**バージョン**: 2.0 (Rust Edition)
