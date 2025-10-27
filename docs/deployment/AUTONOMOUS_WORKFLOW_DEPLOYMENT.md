# 🚀 完全自律ワークフロー デプロイガイド

**Version**: 1.0.0
**Target**: Miyabi完全自律ワークフロー（Phase 1-9）
**Deployment Time**: 30-45分

---

## 📋 Table of Contents

1. [デプロイ前チェックリスト](#デプロイ前チェックリスト)
2. [環境変数設定](#環境変数設定)
3. [Webhook設定](#webhook設定)
4. [デプロイ手順](#デプロイ手順)
5. [動作確認](#動作確認)
6. [トラブルシューティング](#トラブルシューティング)

---

## ✅ デプロイ前チェックリスト

### 必須項目

- [ ] **GitHub Token**: `repo`, `workflow`, `admin:repo_hook` 権限
- [ ] **Anthropic API Key**: Claude API アクセス
- [ ] **環境**: Rust 1.75.0+, cargo installed
- [ ] **テスト**: 全統合テスト（145 tests）パス済み
- [ ] **ビルド**: `cargo build --release` 成功

### 推奨項目

- [ ] **Discord/Slack Webhook**: 通知設定（オプション）
- [ ] **Monitoring**: ログ収集・監視設定
- [ ] **Backup**: 設定ファイルバックアップ
- [ ] **Rollback Plan**: 問題発生時のロールバック手順

---

## 🔐 環境変数設定

### 必須環境変数

```bash
# GitHub Access Token (必須)
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Anthropic API Key (Phase 4で必要)
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Device Identifier (オプション)
export DEVICE_IDENTIFIER="Production-Server-01"
```

### オプション環境変数

```bash
# Discord Webhook (通知用)
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Slack Webhook (通知用)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Log Level
export RUST_LOG="info,miyabi=debug"

# Dry Run Mode (テスト用)
export MIYABI_DRY_RUN="false"
```

### 環境変数検証

```bash
# 環境変数チェックスクリプト
./scripts/check-env.sh
```

**出力例**:
```
✅ GITHUB_TOKEN: SET
✅ ANTHROPIC_API_KEY: SET
✅ DEVICE_IDENTIFIER: Production-Server-01
⚠️  DISCORD_WEBHOOK_URL: NOT_SET (optional)
⚠️  SLACK_WEBHOOK_URL: NOT_SET (optional)

Environment check: PASSED
```

---

## 🔔 Webhook設定

### GitHub Webhook設定手順

#### 1. Repository Settings → Webhooks

```
https://github.com/{owner}/{repo}/settings/hooks
```

#### 2. Add webhook

**Payload URL**:
```
https://your-server.com/api/webhooks/github
```

**Content type**: `application/json`

**Secret**: （Webhook署名検証用）
```bash
# Generate secret
openssl rand -hex 32
```

#### 3. イベント選択

**Select individual events**:
- [x] Issues
- [x] Issue comments
- [x] Pull requests
- [x] Pull request reviews
- [x] Pull request review comments
- [x] Push
- [x] Workflow runs

#### 4. Active

- [x] Active

#### 5. Save webhook

---

## 🚀 デプロイ手順

### Step 1: ビルド

```bash
# プロジェクトルートで実行
cd /path/to/miyabi-private

# Release build
cargo build --release

# バイナリ確認
ls -lh target/release/miyabi
```

**出力例**:
```
-rwxr-xr-x  1 user  staff   45M Oct 28 10:00 miyabi
```

### Step 2: テスト実行

```bash
# 全テスト実行
cargo test --all

# 統合テスト実行
cargo test --package miyabi-orchestrator --test phase1_integration_test
cargo test --package miyabi-orchestrator --test phase2_integration_test
cargo test --package miyabi-orchestrator --test phase6_9_integration_test
```

**期待結果**: `145 passed; 0 failed`

### Step 3: インストール

#### Option A: システムワイドインストール

```bash
# Install to /usr/local/bin
sudo cp target/release/miyabi /usr/local/bin/

# Verify
miyabi --version
```

#### Option B: ユーザーディレクトリインストール

```bash
# Install to ~/.local/bin
mkdir -p ~/.local/bin
cp target/release/miyabi ~/.local/bin/

# Add to PATH (if not already)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Verify
miyabi --version
```

### Step 4: 設定ファイル配置

```bash
# Create config directory
mkdir -p ~/.config/miyabi

# Copy config template
cp .miyabi/config.example.toml ~/.config/miyabi/config.toml

# Edit configuration
vim ~/.config/miyabi/config.toml
```

**config.toml例**:
```toml
[orchestrator]
autonomous_mode = true
auto_approve_complexity = 5.0
auto_merge_quality = 80.0
dry_run = false

[github]
repository = "owner/repo"
webhook_secret = "your-webhook-secret"

[agents]
max_concurrency = 5
timeout_seconds = 600

[notifications]
discord_enabled = false
slack_enabled = false
```

### Step 5: サービス起動（オプション）

#### Systemd Service

```bash
# Create service file
sudo vim /etc/systemd/system/miyabi-orchestrator.service
```

**Service内容**:
```ini
[Unit]
Description=Miyabi Autonomous Workflow Orchestrator
After=network.target

[Service]
Type=simple
User=miyabi
WorkingDirectory=/opt/miyabi
Environment="GITHUB_TOKEN=ghp_xxx"
Environment="ANTHROPIC_API_KEY=sk-ant-xxx"
ExecStart=/usr/local/bin/miyabi orchestrator start
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

**サービス有効化**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable miyabi-orchestrator
sudo systemctl start miyabi-orchestrator
sudo systemctl status miyabi-orchestrator
```

---

## ✅ 動作確認

### 1. ヘルスチェック

```bash
# Orchestrator status
miyabi orchestrator status

# Health check
curl http://localhost:8080/health
```

**期待レスポンス**:
```json
{
  "status": "healthy",
  "version": "0.1.1",
  "uptime": "2h 15m",
  "active_workflows": 0
}
```

### 2. Webhook受信テスト

```bash
# GitHub webhookテスト送信
gh api repos/{owner}/{repo}/hooks/{hook_id}/test \
  -X POST \
  -f event=issues
```

**ログ確認**:
```bash
tail -f logs/miyabi-orchestrator.log
```

**期待ログ**:
```
[INFO] Webhook received: issues.opened
[INFO] Phase 1: Issue Analysis starting...
[INFO] Phase 1 complete: Issue #123 (complexity: 3.2)
```

### 3. 小規模Issueテスト

#### テストIssue作成

**Title**: `test: Small complexity test for autonomous workflow`

**Body**:
```markdown
## Test Description
This is a small complexity test issue (< 3.0) for validating the autonomous workflow.

## Expected Behavior
- Complexity should be < 3.0
- Auto-approved (no human intervention)
- Complete Phase 1-9 within 45 minutes

## Test Checklist
- [ ] Phase 1: Issue Analysis (< 2 min)
- [ ] Phase 2: Task Decomposition (< 5 min)
- [ ] Phase 3: Worktree Creation (< 2 min)
- [ ] Phase 4: Claude Code Execution (< 10 min)
- [ ] Phase 6: Quality Check (< 3 min)
- [ ] Phase 7: PR Creation (< 1 min)
- [ ] Phase 8: Code Review (< 5 min)
- [ ] Phase 9: Auto-Merge (< 3 min)
```

**Labels**: `test`, `complexity:low`, `priority:P3`

#### 監視コマンド

```bash
# リアルタイムログ監視
tail -f logs/miyabi-orchestrator.log | grep "Phase"

# Message Queue監視
miyabi queue status

# Active workflows
miyabi orchestrator list
```

---

## 🎯 成功基準

### Phase別完了時間

| Phase | 目標時間 | 内容 |
|-------|---------|------|
| Phase 1 | < 2分 | Issue Analysis & Auto-Label |
| Phase 2 | < 5分 | Task Decomposition & DAG |
| Phase 3 | < 2分 | Worktree Creation |
| Phase 4 | < 10分 | Claude Code Execution (5-Worlds) |
| Phase 6 | < 3分 | Quality Check & Auto-Fix |
| Phase 7 | < 1分 | PR Creation |
| Phase 8 | < 5分 | Code Review |
| Phase 9 | < 3分 | Auto-Merge & Deployment |

**Total**: < 45分

### 品質指標

- **Issue処理成功率**: ≥ 85%
- **PR自動マージ率**: ≥ 70%
- **品質スコア平均**: ≥ 80/100
- **テストカバレッジ**: 100% (113/113 tests pass)

---

## 🔧 トラブルシューティング

### Issue: Webhook not received

**原因**: Webhook設定ミス、ネットワーク問題

**解決策**:
```bash
# Webhook delivery確認
gh api repos/{owner}/{repo}/hooks/{hook_id}/deliveries

# Redelivery
gh api repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts \
  -X POST
```

### Issue: Phase 4失敗（Claude Code Execution）

**原因**: ANTHROPIC_API_KEY未設定、レート制限

**解決策**:
```bash
# API Key確認
echo $ANTHROPIC_API_KEY

# Rate limit確認
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
  https://api.anthropic.com/v1/messages/rate_limit
```

### Issue: Phase 6失敗（Quality Check）

**原因**: cargo/clippy/rustc not found

**解決策**:
```bash
# Rust toolchain確認
rustc --version
cargo --version
clippy --version

# Install clippy
rustup component add clippy
```

### Issue: Message Queue詰まり

**原因**: SessionManager overload

**解決策**:
```bash
# Queue status確認
miyabi queue status

# Clear queue
miyabi queue clear

# Restart orchestrator
sudo systemctl restart miyabi-orchestrator
```

---

## 📊 モニタリング

### ログ監視

```bash
# リアルタイムログ
tail -f logs/miyabi-orchestrator.log

# エラーログのみ
tail -f logs/miyabi-orchestrator.log | grep ERROR

# Phase完了通知のみ
tail -f logs/miyabi-orchestrator.log | grep "✅ Phase"
```

### メトリクス収集

```bash
# Prometheus metrics (if enabled)
curl http://localhost:9090/metrics

# Custom metrics
miyabi metrics show
```

**主要メトリクス**:
- `miyabi_issues_processed_total`
- `miyabi_prs_created_total`
- `miyabi_auto_merge_total`
- `miyabi_phase_duration_seconds`
- `miyabi_quality_score_avg`

---

## 🔄 ロールバック手順

### 問題発生時

```bash
# 1. Orchestrator停止
sudo systemctl stop miyabi-orchestrator

# 2. バックアップから復元
cp ~/.config/miyabi/config.toml.backup ~/.config/miyabi/config.toml

# 3. 前バージョンに戻す
sudo cp /usr/local/bin/miyabi.backup /usr/local/bin/miyabi

# 4. 再起動
sudo systemctl start miyabi-orchestrator

# 5. 確認
miyabi --version
sudo systemctl status miyabi-orchestrator
```

---

## 📝 チェックリスト: デプロイ完了

- [ ] 環境変数設定完了
- [ ] Webhook設定完了
- [ ] ビルド・インストール完了
- [ ] 設定ファイル配置完了
- [ ] サービス起動完了（オプション）
- [ ] ヘルスチェック成功
- [ ] Webhook受信テスト成功
- [ ] 小規模Issueテスト成功（< 45分）
- [ ] ログ監視設定完了
- [ ] メトリクス収集設定完了（オプション）
- [ ] ロールバック手順確認完了

---

**Deployment Status**: Ready for Production 🚀

**最終更新**: 2025-10-28

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
