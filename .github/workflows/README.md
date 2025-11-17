# Miyabi GitHub Actions Workflows

完全自動実行システムのGitHub Actions実装

**Version**: 2.0.0
**Last Updated**: 2025-11-17

---

## 🤖 Codex Autonomous Coordinator

**NEW**: MUGEN と MAJIN の Self-hosted Runner 上で Claude Code を使用して自律的にタスクを実行するワークフロー

### Self-hosted Runners

| Runner | ホスト | ラベル | ステータス |
|--------|--------|--------|-----------|
| **MUGEN** | EC2 (US West 2) | `mugen`, `docker`, `terraform` | 🟢 Online |
| **MAJIN** | EC2 (Tokyo) | `majin`, `gpu`, `docker` | 🟢 Online |
| **Mac** | MacBook Pro | `miyabi-light`, `miyabi-heavy` | 🟢 Online |

### 使い方

#### Issue ラベルで実行
```bash
gh issue edit 123 --add-label "codex-execute"
```

#### コメントコマンドで実行
Issue に投稿:
```
/codex          # 自動選択
/codex mugen    # MUGEN で実行
/codex majin    # MAJIN (GPU) で実行
```

#### 手動実行
Actions タブ → **Codex Autonomous Coordinator** → Run workflow

---

## 📂 Structure

```
.github/
├── workflows/
│   ├── scheduled/                    # 定期実行タスク
│   │   └── demo-system-report.yml   # デモ: システムレポート生成
│   ├── event-driven/                 # イベント駆動タスク
│   │   └── batch-issue-creation.yml # Batch Issue作成
│   └── README.md                     # このファイル
└── scripts/
    └── setup-runner.sh               # Self-hosted runner セットアップ
```

---

## 🚀 Quick Start

### 1. Self-Hosted Runnerのセットアップ

#### Option A: AWS EC2手動起動

```bash
# 1. EC2インスタンス起動 (Ubuntu 22.04)
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.medium \
  --key-name your-key \
  --user-data file://.github/scripts/setup-runner.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Project,Value=Miyabi}]'

# 2. GitHub runner tokenを取得
# Settings > Actions > Runners > New self-hosted runner

# 3. 環境変数を設定してスクリプト実行
export GITHUB_REPO="customer-cloud/miyabi-private"
export GITHUB_RUNNER_TOKEN="YOUR_TOKEN_HERE"
export RUNNER_LABELS="miyabi-general,linux,x64"
bash .github/scripts/setup-runner.sh
```

#### Option B: AWS Auto Scaling Group (推奨)

Terraformテンプレート使用 (詳細は `.claude/docs/GITHUB_ACTIONS_AUTONOMOUS_EXECUTION.md` 参照)

### 2. ワークフローのテスト

#### デモタスク実行 (System Report)

```bash
# Manual trigger
gh workflow run demo-system-report.yml

# 実行状況確認
gh run list --workflow=demo-system-report.yml

# ログ確認
gh run view --log
```

**期待される結果**:
- 実行時間: ~15秒
- GitHub Issueが自動作成される
- システム情報レポートが生成される

#### Batch Issue Creation実行

```bash
# Dry-run mode (プレビューのみ)
gh workflow run batch-issue-creation.yml \
  -f template_name=orchestrator-improvements \
  -f dry_run=true

# Production mode (実際にIssue作成)
gh workflow run batch-issue-creation.yml \
  -f template_name=orchestrator-improvements \
  -f dry_run=false

# Priority filter
gh workflow run batch-issue-creation.yml \
  -f template_name=orchestrator-improvements \
  -f priority_filter=P0 \
  -f dry_run=true
```

---

## 📋 Available Workflows

### Scheduled Workflows

#### 🌸 Demo System Report
- **File**: `scheduled/demo-system-report.yml`
- **Schedule**: 毎日 9:00 JST
- **Duration**: ~15秒
- **Runner**: `[self-hosted, miyabi-general]`
- **Purpose**: システム情報レポート生成のデモ

**Manual trigger**:
```bash
gh workflow run demo-system-report.yml
```

### Event-Driven Workflows

#### 🎯 Batch Issue Creation
- **File**: `event-driven/batch-issue-creation.yml`
- **Trigger**: Manual (workflow_dispatch)
- **Duration**: ~5-60分 (issue数による)
- **Runner**: `[self-hosted, miyabi-compute]`
- **Purpose**: 複数のGitHub Issueを一括作成

**Parameters**:
- `template_name`: テンプレート名 (例: `orchestrator-improvements`)
- `dry_run`: プレビューモード (default: `true`)
- `priority_filter`: 優先度フィルタ (例: `P0`, `P1`, `all`)

**Manual trigger**:
```bash
gh workflow run batch-issue-creation.yml \
  -f template_name=YOUR_TEMPLATE \
  -f dry_run=false
```

---

## 🏷️ Runner Labels

Self-hosted runnerのラベル体系:

### General Purpose
```yaml
runs-on: [self-hosted, miyabi-general]
```
- Instance: t3.medium (2 vCPU, 4GB)
- Use: 軽量タスク, レポート生成, Issue管理

### Compute
```yaml
runs-on: [self-hosted, miyabi-compute]
```
- Instance: c6i.2xlarge (8 vCPU, 16GB)
- Use: Batch処理, データ解析, ベンチマーク

### GPU
```yaml
runs-on: [self-hosted, miyabi-gpu, gpu]
```
- Instance: g4dn.xlarge (4 vCPU, 16GB, NVIDIA T4)
- Use: ML学習, 3D可視化, 動画処理

### Memory
```yaml
runs-on: [self-hosted, miyabi-memory]
```
- Instance: r6i.2xlarge (8 vCPU, 64GB)
- Use: 大規模データ処理, worktree操作

---

## 📝 Creating New Workflows

### Template Structure

```yaml
name: 🎯 Your Workflow Name

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at 9:00 JST
  workflow_dispatch:     # Manual trigger

jobs:
  your-job:
    runs-on: [self-hosted, miyabi-general]
    timeout-minutes: 30

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🚀 Execute headless task
        run: |
          claude -p "$(cat .claude/prompts/your-prompt.txt)

          $(cat .claude/templates/your-template.json)"

      - name: 📤 Process results
        # Create issue, PR, or upload artifacts
```

### Best Practices

1. **Always use timeout**: `timeout-minutes: 30`
2. **Label outputs**: Use emoji for visual clarity
3. **Upload artifacts**: Keep logs for debugging
4. **Fail gracefully**: Add error handling
5. **Notify on completion**: Use GitHub Issue or external notification

---

## 🔐 Required Secrets

GitHub Settings > Secrets and variables > Actions:

```yaml
# AWS (for self-hosted runners)
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# GitHub
GITHUB_TOKEN               # Automatically provided
GITHUB_RUNNER_TOKEN        # For runner registration

# External integrations
LARK_WEBHOOK_URL          # Lark notifications
ANTHROPIC_API_KEY         # Claude API
```

---

## 📊 Monitoring

### Check Workflow Status

```bash
# List recent runs
gh run list --limit 10

# View specific run
gh run view RUN_ID --log

# Re-run failed workflows
gh run rerun RUN_ID
```

### Check Runner Status

```bash
# List runners
gh api repos/customer-cloud/miyabi-private/actions/runners | jq '.runners[] | {name, status, labels}'

# Remove offline runner
gh api -X DELETE repos/customer-cloud/miyabi-private/actions/runners/RUNNER_ID
```

### Logs

Workflow実行ログ:
- GitHub Actions UI: https://github.com/customer-cloud/miyabi-private/actions
- Artifacts: 各ワークフローの `upload-artifact` step

Runner logs:
```bash
# On EC2 instance
sudo journalctl -u actions.runner.*.service -f
```

---

## 💰 Cost Optimization

### Spot Instances

```yaml
# In EC2 launch template
InstanceMarketOptions:
  MarketType: spot
  SpotOptions:
    MaxPrice: "0.05"
```

**節約**: ~70%

### Auto-Shutdown

`.github/scripts/setup-runner.sh` includes auto-shutdown logic:
- Idle for 10 minutes → shutdown
- Configurable via `IDLE_THRESHOLD` env var

### Reserved Capacity

常時稼働runner用:
- 1x t3.medium (Reserved 1-year)
- Cost: ~$15/month (vs $35 on-demand)

---

## 🐛 Troubleshooting

### Workflow Not Triggering

```bash
# Check workflow syntax
gh workflow view demo-system-report.yml

# Check runner availability
gh api repos/customer-cloud/miyabi-private/actions/runners
```

### Runner Offline

```bash
# SSH to EC2
ssh ubuntu@INSTANCE_IP

# Check service
sudo systemctl status actions.runner.*.service

# Restart service
sudo systemctl restart actions.runner.*.service

# Check logs
sudo journalctl -u actions.runner.*.service -n 100
```

### Headless Task Fails

```bash
# Download artifacts
gh run download RUN_ID

# Check logs
cat path/to/downloaded/log

# Re-run with verbose logging
# Add to workflow: run: bash -x ./script.sh
```

---

## 📚 Related Documentation

- [GITHUB_ACTIONS_AUTONOMOUS_EXECUTION.md](../.claude/docs/GITHUB_ACTIONS_AUTONOMOUS_EXECUTION.md) - 完全なアーキテクチャドキュメント
- [AUTONOMOUS_OPERATION_ARCHITECTURE.md](../.claude/docs/AUTONOMOUS_OPERATION_ARCHITECTURE.md) - 自律実行アーキテクチャ
- [BATCH_ISSUE_CREATION.md](../.claude/docs/BATCH_ISSUE_CREATION.md) - Batch Issue作成システム

---

## ✅ Next Steps

1. ✅ Self-hosted runnerをセットアップ
2. ✅ Demo workflowを実行してテスト
3. [ ] 既存の71タスクを段階的に移行
4. [ ] モニタリングダッシュボード構築
5. [ ] コスト最適化の実施

---

**Version**: 1.0.0
**Status**: Production Ready
**Contact**: hayashi.s@customercloud.ai

🌸 **Miyabi Society - Infinite Scale Through GitHub** 🌸
