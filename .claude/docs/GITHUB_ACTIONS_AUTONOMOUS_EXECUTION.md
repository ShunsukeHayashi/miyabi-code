# GitHub Actions + Self-Hosted Runner - 完全自動実行アーキテクチャ

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Vision**: GitHub as OS - 無限スケールの自律実行基盤

---

## 🎯 コンセプト

### 基本原則

1. **GitHub as Orchestration Platform** - GitHubをオーケストレーションの中心に
2. **Self-Hosted Runners on AWS EC2** - 無限にスケール可能な実行環境
3. **Headless Script Execution** - 既存のテンプレートシステムを活用
4. **Scheduled + Event-Driven** - 定期実行とイベント駆動の両対応
5. **Complete Automation** - 人間の介入不要

### 目標

- ✅ **定期実行タスクの完全自動化**
- ✅ **無限並列実行 (EC2スケール)**
- ✅ **GitHub Actionsでの統合管理**
- ✅ **コスト最適化 (実行時のみEC2起動)**

---

## 🏛️ アーキテクチャ概要

```
┌────────────────────────────────────────────────────────────────┐
│  GitHub Platform (Orchestration Hub)                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  GitHub Actions Workflows                                 │ │
│  │  - .github/workflows/                                     │ │
│  │  - Scheduled (cron)                                       │ │
│  │  - Event-driven (push, PR, issue, etc.)                  │ │
│  └────────────────┬─────────────────────────────────────────┘ │
│                   │                                             │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────┐
│  Self-Hosted Runners (AWS EC2 Fleet)                          │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │  Runner 1   │  │  Runner 2   │  │  Runner N   │  ...      │
│  │  (EC2 M)    │  │  (EC2 C)    │  │  (EC2 GPU)  │           │
│  │             │  │             │  │             │           │
│  │  - Claude   │  │  - Claude   │  │  - Claude   │           │
│  │  - Rust     │  │  - Node.js  │  │  - Python   │           │
│  │  - Git      │  │  - Docker   │  │  - CUDA     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                 │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  Headless Task Execution                                        │
│                                                                 │
│  claude -p "$(cat .claude/prompts/task.txt)                    │
│                                                                 │
│  $(cat .claude/templates/task.json)"                           │
│                                                                 │
│  Output → GitHub (Issues, PRs, Artifacts)                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 実行フロー

### Flow 1: スケジュール実行 (Cron)

```
1. GitHub Actions - Cron trigger
   - schedule: "0 9 * * *"  # 毎日9時
   ↓
2. Self-Hosted Runner起動
   - ラベルベースのRunner選択
   - runs-on: [self-hosted, miyabi-general]
   ↓
3. リポジトリチェックアウト
   - actions/checkout@v4
   ↓
4. Headless Script実行
   - ./.claude/scripts/daily-report.sh
   - claude -p "prompt + template"
   ↓
5. 結果の自動処理
   - GitHub Issueへの投稿
   - PRの自動作成
   - Artifactsのアップロード
   ↓
6. 通知送信
   - Lark/Slack notification
   - Layer 1 Maestroへの報告
```

### Flow 2: イベント駆動実行

```
1. GitHub Event発生
   - Issue作成
   - PR open
   - Comment追加
   ↓
2. Workflow trigger
   - on: issues, pull_request, issue_comment
   ↓
3. Runner起動 & 実行
   - 適切なRunnerを自動選択
   - タスクタイプに応じたEC2インスタンス
   ↓
4. Headless処理
   ↓
5. 結果フィードバック
   - Issueへのコメント
   - PRへのレビュー投稿
```

---

## 📋 Self-Hosted Runner構成

### Runner Types (ラベルベース)

#### 1. General Purpose Runner
```yaml
Labels: [self-hosted, miyabi-general, linux, x64]
Instance: t3.medium (2 vCPU, 4GB RAM)
Use Cases:
  - Code quality checks
  - Small reports
  - Issue management
  - Documentation generation
Auto-scaling: Yes
Cost: ~$0.05/hour
```

#### 2. Computation Runner
```yaml
Labels: [self-hosted, miyabi-compute, linux, x64]
Instance: c6i.2xlarge (8 vCPU, 16GB RAM)
Use Cases:
  - Batch issue creation
  - Data analysis
  - Performance benchmarks
  - Dependency audits
Auto-scaling: Yes
Cost: ~$0.34/hour
```

#### 3. GPU Runner
```yaml
Labels: [self-hosted, miyabi-gpu, linux, x64, gpu]
Instance: g4dn.xlarge (4 vCPU, 16GB RAM, NVIDIA T4)
Use Cases:
  - ML model training
  - 3D visualization
  - Video processing
  - VOICEVOX synthesis
Auto-scaling: Yes (on-demand)
Cost: ~$0.50/hour
```

#### 4. Memory Intensive Runner
```yaml
Labels: [self-hosted, miyabi-memory, linux, x64]
Instance: r6i.2xlarge (8 vCPU, 64GB RAM)
Use Cases:
  - Large dataset processing
  - Complex code analysis
  - Multi-worktree operations
Auto-scaling: Yes
Cost: ~$0.50/hour
```

### Runner Setup Script

```bash
#!/bin/bash
# .github/scripts/setup-runner.sh
# AWS EC2 UserData script for self-hosted runner

# Install dependencies
sudo apt-get update
sudo apt-get install -y \
  curl git jq build-essential \
  docker.io tmux vim

# Install Claude CLI
curl -fsSL https://claude.ai/install.sh | bash

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Install GitHub Actions Runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure runner (using registration token from GitHub API)
./config.sh \
  --url https://github.com/customer-cloud/miyabi-private \
  --token ${GITHUB_RUNNER_TOKEN} \
  --labels ${RUNNER_LABELS} \
  --name ${RUNNER_NAME} \
  --work _work \
  --unattended

# Install and start as systemd service
sudo ./svc.sh install
sudo ./svc.sh start
```

---

## 📂 GitHub Actionsワークフロー構造

```
.github/
├── workflows/
│   ├── scheduled/
│   │   ├── daily-reports.yml          # 日次レポート (9:00)
│   │   ├── weekly-summary.yml         # 週次サマリー (月曜9:00)
│   │   ├── code-quality-check.yml     # コード品質 (毎日12:00)
│   │   ├── security-scan.yml          # セキュリティスキャン (毎日0:00)
│   │   └── dependency-update.yml      # 依存更新チェック (毎週日曜)
│   ├── event-driven/
│   │   ├── issue-batch-create.yml     # Issue一括作成
│   │   ├── pr-review.yml              # PR自動レビュー
│   │   ├── callout-handler.yml        # コールアウト処理
│   │   └── notification-relay.yml     # 通知リレー
│   ├── on-demand/
│   │   ├── manual-task.yml            # 手動トリガー
│   │   └── emergency-response.yml     # 緊急対応
│   └── infrastructure/
│       ├── runner-scale-up.yml        # Runner増設
│       └── runner-cleanup.yml         # Runner削除
└── scripts/
    ├── setup-runner.sh                # Runner初期化
    ├── cleanup-runner.sh              # Runner削除
    └── scale-fleet.sh                 # Fleet管理
```

---

## 📝 ワークフロー例

### Example 1: Daily Progress Report

```yaml
# .github/workflows/scheduled/daily-reports.yml
name: 📊 Daily Progress Report

on:
  schedule:
    - cron: '0 0 * * *'  # 毎日 9:00 JST (00:00 UTC)
  workflow_dispatch:     # Manual trigger

jobs:
  generate-report:
    runs-on: [self-hosted, miyabi-general]
    timeout-minutes: 30

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for git log

      - name: 🔧 Setup environment
        run: |
          echo "REPORT_DATE=$(date +%Y-%m-%d)" >> $GITHUB_ENV
          mkdir -p .claude/logs

      - name: 📊 Generate daily report
        run: |
          cd ~/Dev/miyabi-private
          claude -p "$(cat .claude/prompts/daily-progress-report.txt)

          $(cat .claude/templates/daily-report-$(date +%Y%m%d).json)" \
          > .claude/logs/daily-report-${{ env.REPORT_DATE }}.log 2>&1

      - name: 📤 Create GitHub Issue
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('.claude/logs/daily-report-${{ env.REPORT_DATE }}.log', 'utf8');

            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `📊 Daily Progress Report - ${{ env.REPORT_DATE }}`,
              body: report,
              labels: ['📊 report', 'daily', 'automated']
            });

      - name: 📱 Notify Maestro (Lark)
        uses: foxundermoon/feishu-action@v2
        with:
          url: ${{ secrets.LARK_WEBHOOK_URL }}
          msg_type: text
          content: |
            {
              "text": "✅ Daily Report Generated: ${{ env.REPORT_DATE }}\nCheck GitHub Issue for details."
            }
```

### Example 2: Batch Issue Creation

```yaml
# .github/workflows/event-driven/issue-batch-create.yml
name: 🎯 Batch Issue Creation

on:
  workflow_dispatch:
    inputs:
      template_name:
        description: 'Template name (without .json)'
        required: true
        type: string
      dry_run:
        description: 'Dry run mode'
        required: false
        type: boolean
        default: true

jobs:
  create-issues:
    runs-on: [self-hosted, miyabi-general]
    timeout-minutes: 60

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🔍 Validate template
        run: |
          TEMPLATE=".claude/templates/${{ inputs.template_name }}.json"
          if [ ! -f "$TEMPLATE" ]; then
            echo "❌ Template not found: $TEMPLATE"
            exit 1
          fi
          jq empty "$TEMPLATE" || exit 1
          echo "✅ Template validated"

      - name: 🚀 Execute batch creation
        run: |
          FLAGS=""
          if [ "${{ inputs.dry_run }}" = "true" ]; then
            FLAGS="--dry-run"
          fi

          ./.claude/scripts/batch-create-issues.sh \
            ${{ inputs.template_name }} \
            $FLAGS

      - name: 📤 Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: batch-issue-creation-log
          path: .claude/logs/batch-create-issues_*.log
          retention-days: 30
```

### Example 3: Code Quality Check (Scheduled)

```yaml
# .github/workflows/scheduled/code-quality-check.yml
name: 🔍 Code Quality Check

on:
  schedule:
    - cron: '0 3 * * *'  # 毎日 12:00 JST (03:00 UTC)
  push:
    branches: [main, develop]
  workflow_dispatch:

jobs:
  quality-check:
    runs-on: [self-hosted, miyabi-compute]
    timeout-minutes: 120

    steps:
      - name: 📥 Checkout
        uses: actions/checkout@v4

      - name: 🦀 Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          components: rustfmt, clippy

      - name: 🔍 Run Clippy
        run: |
          cargo clippy --all-targets --all-features -- -D warnings \
          > .claude/logs/clippy-$(date +%Y%m%d).log 2>&1

      - name: 📊 Generate quality report
        run: |
          claude -p "$(cat .claude/prompts/code-quality-report.txt)

          $(cat .claude/templates/quality-metrics.json)" \
          > .claude/logs/quality-report-$(date +%Y%m%d).md

      - name: 📤 Post report as comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('.claude/logs/quality-report-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '.md', 'utf8');

            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

---

## 🚀 Auto-Scaling Strategy

### Strategy 1: GitHub Actions Fleet

GitHub Actionsの標準機能を使用:

```yaml
# .github/workflows/infrastructure/runner-scale-up.yml
name: 🔼 Scale Up Runners

on:
  workflow_dispatch:
    inputs:
      runner_type:
        type: choice
        options:
          - general
          - compute
          - gpu
          - memory
      count:
        type: number
        default: 1

jobs:
  scale-up:
    runs-on: ubuntu-latest
    steps:
      - name: 🚀 Launch EC2 instances
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: 🖥️ Create instances
        run: |
          case "${{ inputs.runner_type }}" in
            general)
              INSTANCE_TYPE="t3.medium"
              LABELS="miyabi-general"
              ;;
            compute)
              INSTANCE_TYPE="c6i.2xlarge"
              LABELS="miyabi-compute"
              ;;
            gpu)
              INSTANCE_TYPE="g4dn.xlarge"
              LABELS="miyabi-gpu,gpu"
              AMI="ami-gpu-enabled"
              ;;
            memory)
              INSTANCE_TYPE="r6i.2xlarge"
              LABELS="miyabi-memory"
              ;;
          esac

          # Launch instances with UserData
          aws ec2 run-instances \
            --image-id ${AMI:-ami-ubuntu-22.04} \
            --instance-type $INSTANCE_TYPE \
            --count ${{ inputs.count }} \
            --user-data file://.github/scripts/setup-runner.sh \
            --tag-specifications "ResourceType=instance,Tags=[{Key=Project,Value=Miyabi},{Key=RunnerType,Value=${{ inputs.runner_type }}}]" \
            --iam-instance-profile Name=MiyabiRunnerProfile
```

### Strategy 2: AWS Auto Scaling Groups

```yaml
# infrastructure/terraform/runner-asg.tf
resource "aws_autoscaling_group" "miyabi_runners_general" {
  name                = "miyabi-runners-general"
  vpc_zone_identifier = var.subnet_ids
  min_size            = 0
  max_size            = 10
  desired_capacity    = 0

  launch_template {
    id      = aws_launch_template.runner_general.id
    version = "$Latest"
  }

  tag {
    key                 = "Project"
    value               = "Miyabi"
    propagate_at_launch = true
  }

  # Scale up when queue depth > 0
  # Scale down when idle for 10 minutes
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "scale-up-on-queue"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.miyabi_runners_general.name
}
```

---

## 💰 コスト最適化

### 1. Spot Instances

```yaml
# Use Spot instances for non-critical tasks
spot_price: "0.05"  # t3.medium spot
interruption_behavior: terminate
```

**節約率**: 最大70%

### 2. Auto-Shutdown

```bash
# Runner idle check (in runner setup)
#!/bin/bash
# /usr/local/bin/check-idle.sh

IDLE_TIME=600  # 10 minutes

while true; do
  ACTIVE_JOBS=$(curl -s http://localhost:8080/jobs | jq '.activeJobs')

  if [ "$ACTIVE_JOBS" = "0" ]; then
    IDLE_COUNTER=$((IDLE_COUNTER + 60))

    if [ "$IDLE_COUNTER" -ge "$IDLE_TIME" ]; then
      echo "No jobs for 10 minutes, shutting down..."
      sudo shutdown -h now
    fi
  else
    IDLE_COUNTER=0
  fi

  sleep 60
done
```

### 3. Reserved Capacity

常時稼働Runnerには Reserved Instances:

```yaml
# Baseline runners (always on)
General Purpose: 1x t3.medium (Reserved 1-year)
Cost: ~$15/month (vs $35 on-demand)
Savings: 57%
```

---

## 📊 モニタリング & アラート

### CloudWatch Metrics

```yaml
# Custom metrics
- RunnerUtilization
- JobQueueDepth
- AverageJobDuration
- CostPerJob
- FailureRate
```

### Lark Notifications

```yaml
# .github/workflows/notification-relay.yml
on:
  workflow_run:
    workflows: ["*"]
    types: [completed]

jobs:
  notify:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion != 'success' }}
    steps:
      - name: 📱 Send failure alert
        uses: foxundermoon/feishu-action@v2
        with:
          url: ${{ secrets.LARK_WEBHOOK_URL }}
          msg_type: text
          content: |
            {
              "text": "❌ Workflow Failed: ${{ github.event.workflow_run.name }}\nRun: ${{ github.event.workflow_run.html_url }}"
            }
```

---

## 🔐 Security & Secrets

### GitHub Secrets

```yaml
# Required secrets
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
GITHUB_RUNNER_TOKEN
LARK_WEBHOOK_URL
ANTHROPIC_API_KEY

# Per-runner secrets (mounted via AWS Secrets Manager)
LARK_APP_ID
LARK_APP_SECRET
```

### IAM Role Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:TerminateInstances",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::miyabi-artifacts/*"
    }
  ]
}
```

---

## 📈 移行ロードマップ

### Phase 1: 基盤構築 (1週間)

- [ ] GitHub Actions workflow基本構造作成
- [ ] Self-hosted runner AMI構築
- [ ] Auto-scaling設定
- [ ] Secrets管理セットアップ

### Phase 2: パイロット実行 (1週間)

- [ ] Top 5タスクのワークフロー化
  - Daily progress report
  - Code quality check
  - Security scan
  - Batch issue creation
  - Dependency audit
- [ ] 実行テスト & デバッグ
- [ ] コスト測定

### Phase 3: 全タスク移行 (2-3週間)

- [ ] 71タスクの段階的移行
- [ ] 既存スクリプトのワークフロー化
- [ ] モニタリングダッシュボード構築

### Phase 4: 最適化 (継続的)

- [ ] コスト最適化
- [ ] パフォーマンスチューニング
- [ ] 予測的スケーリング

---

## 🎯 期待される効果

### Before (現状 - ローカル実行)

| 項目 | 状態 |
|------|------|
| 実行環境 | Macローカル (1台) |
| 並行実行 | 制限あり (tmux/worktree) |
| スケジュール | 手動 or cron (Mac稼働時のみ) |
| コスト | Mac使用時間 (100%) |
| 可用性 | Mac稼働時のみ |

### After (GitHub Actions + EC2)

| 項目 | 状態 |
|------|------|
| 実行環境 | AWS EC2 (無限スケール) |
| 並行実行 | 無制限 (N個同時実行) |
| スケジュール | 完全自動 (24/7) |
| コスト | 実行時のみ (~20% 削減) |
| 可用性 | 99.9% (GitHub SLA) |

**時間削減**: 100% (完全自動化)
**コスト削減**: ~80% (Spot + Reserved + Auto-shutdown)
**並行実行**: 10x → ∞ (理論上無限)

---

## 🔗 関連ドキュメント

- [AUTONOMOUS_OPERATION_ARCHITECTURE.md](./AUTONOMOUS_OPERATION_ARCHITECTURE.md)
- [MOBILE_FIRST_AUTONOMOUS_OPERATION.md](./MOBILE_FIRST_AUTONOMOUS_OPERATION.md)
- [HEADLESS_TASK_FRAMEWORK.md](./HEADLESS_TASK_FRAMEWORK.md)
- [BATCH_ISSUE_CREATION.md](./BATCH_ISSUE_CREATION.md)

---

## ✅ Quick Start

### 1. Runner AMIの準備

```bash
# Packer template
packer build .github/infrastructure/runner-ami.pkr.hcl
```

### 2. Terraformでインフラ構築

```bash
cd infrastructure/terraform
terraform init
terraform apply
```

### 3. 最初のワークフロー実行

```bash
# Manual trigger
gh workflow run daily-reports.yml

# Check status
gh run list
```

---

**Version**: 1.0.0
**Status**: 設計完了 - 実装準備中
**Next**: Phase 1実装開始

🌸 **Miyabi Society - Infinite Scale Through GitHub** 🌸
