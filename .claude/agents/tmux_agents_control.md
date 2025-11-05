# 🎭 Miyabi Orchestra - Agent Control Quick Reference

**Quick access guide for controlling the 6 Miyabi Orchestra agents via tmux**

**✅ W1-W5 Complete Workflow Coverage - 100% Automation Achieved**

---

## 🎯 Agent Configuration

| Agent | Pane ID | Role | Workflow | Working Dir |
|-------|---------|------|----------|-------------|
| 🎼 **Conductor** | `%1` | Main control | - | `/Users/shunsuke/Dev/miyabi-private` |
| 🔍 **みつけるん** | `%10` | Issue Triage | W1 | `/Users/shunsuke/Dev/miyabi-private` |
| 🎼 **しきるん** | `%11` | Task Decomposition | W2 | `/Users/shunsuke/Dev/miyabi-private` |
| 🎹 **カエデ** | `%2` | Code Implementation | W3 | `/Users/shunsuke/Dev/miyabi-private` |
| 🎺 **サクラ** | `%5` | Code Review | W4 | `/Users/shunsuke/Dev/miyabi-private` |
| 🥁 **ツバキ** | `%3` | Pull Request | W3 | `/Users/shunsuke/Dev/miyabi-private` |
| 🎷 **ボタン** | `%4` | Deployment | W5 | `/Users/shunsuke/Dev/miyabi-private` |

---

## ⚡ Quick Start Commands

### Start All Agents (Parallel Launch - 6 Agents)

```bash
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %10 Enter & \
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %11 Enter & \
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %2 Enter & \
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %5 Enter & \
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %3 Enter & \
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && cc" && sleep 0.5 && tmux send-keys -t %4 Enter & \
wait
```

### Test All Agents (Confirm Readiness - 6 Agents)

```bash
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「みつけるん」です。[みつけるん] 準備OK！ と発言してください。" && sleep 0.5 && tmux send-keys -t %10 Enter
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「しきるん」です。[しきるん] 準備OK！ と発言してください。" && sleep 0.5 && tmux send-keys -t %11 Enter
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。[カエデ] 準備OK！ と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。[サクラ] 準備OK！ と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。[ツバキ] 準備OK！ と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。[ボタン] 準備OK！ と発言してください。" && sleep 0.5 && tmux send-keys -t %4 Enter
```

---

## 📖 Table of Contents

1. [🔍 みつけるん (IssueAgent)](#mitsuke) ⭐ W1
2. [🎼 しきるん (CoordinatorAgent)](#shikiru) ⭐ W2
3. [🎹 カエデ (CodeGenAgent)](#kaede) - W3
4. [🎺 サクラ (ReviewAgent)](#sakura) - W4
5. [🥁 ツバキ (PRAgent)](#tsubaki) - W3
6. [🎷 ボタン (DeploymentAgent)](#botan) - W5
7. [📊 Monitoring & Status](#monitoring)
8. [🔄 Token Management](#token-management)
9. [🎯 Common Workflows](#workflows)
10. [🚨 Troubleshooting](#troubleshooting)
11. [⌨️ Navigation](#navigation)
12. [📝 Communication Protocol](#communication)
13. [🎨 Custom Behaviors](#custom-behaviors)

---

<a name="mitsuke"></a>

## 🔍 みつけるん (IssueAgent) - Pane %10

### Basic Issue Triage

```bash
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「みつけるん」です。最新のIssueのトリアージを行ってください。完了したら [みつけるん] トリアージ完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %10 Enter
```

### Auto Label Inference (57-label system)

```bash
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「みつけるん」です。issue-analysisスキルを使用してIssue #XXXのLabel推定を行ってください。完了したら [みつけるん] Label推定完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %10 Enter
```

### Triage Specific Issue

```bash
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「みつけるん」です。Issue #270のトリアージを行い、適切なLabel、優先度、state:pendingを付与してください。完了したら [みつけるん] トリアージ完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %10 Enter
```

### Check Status

```bash
tmux capture-pane -t %10 -p | tail -10
```

### Check for Completion

```bash
tmux capture-pane -t %10 -p | grep "\[みつけるん\]"
```

### Clear Context

```bash
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %10 Enter
```

---

<a name="shikiru"></a>

## 🎼 しきるん (CoordinatorAgent) - Pane %11

### Basic Task Decomposition

```bash
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「しきるん」です。Issue #270をTask配列に分解し、DAGを構築してください。完了したら [しきるん] タスク分解完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %11 Enter
```

### With Agent Assignment

```bash
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「しきるん」です。agent-executionスキルを使用してIssue #270のタスク分解とAgent割り当てを行ってください。完了したら [しきるん] 計画完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %11 Enter
```

### Wait for みつけるん Then Decompose

```bash
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「しきるん」です。みつけるんが トリアージ完了 と発言したら、タスク分解を開始してください。完了したら [しきるん] タスク分解完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %11 Enter
```

### Full Planning with Estimation

```bash
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「しきるん」です。Issue #270のタスク分解、DAG構築、Agent割り当て、推定時間算出を行い、GitHub commentに計画を投稿してください。完了したら [しきるん] 計画完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %11 Enter
```

### Check Status

```bash
tmux capture-pane -t %11 -p | tail -10
```

### Check for Completion

```bash
tmux capture-pane -t %11 -p | grep "\[しきるん\]"
```

### Clear Context

```bash
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %11 Enter
```

---

<a name="kaede"></a>

## 🎹 カエデ (CodeGenAgent) - Pane %2

### Basic Task Assignment (Rust Commands最適化版) ⭐ NEW

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270の実装を行ってください。

【実装フェーズ】
1. agent-executionスキルとrust-developmentスキルを使用
2. コード実装・テスト作成

【検証フェーズ - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください。1つでも失敗したら即座に停止して報告してください:
- cargo build --release
- cargo test --all
- cargo clippy -- -D warnings

【完了報告】
全て成功したら [カエデ] 実装完了 と発言してください。失敗した場合は [カエデ] エラー: {詳細} と報告してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### Quick Check (開発中の高速チェック)

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270のクイックチェックを実行してください。

以下を&&チェーンで実行:
- cargo check
- cargo test -- --test-threads=1
- cargo clippy -- -W clippy::all

完了したら [カエデ] チェック完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### With Conductor Reporting

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」- pane2です。Issue #270の実装を行ってください。エラー時は[カエデ]を付けてtmux send-keys -t %1でConductorに報告してください。完了したら同様に報告してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### Check Status

```bash
tmux capture-pane -t %2 -p | tail -10
```

### Check for Completion

```bash
tmux capture-pane -t %2 -p | grep "\[カエデ\]"
```

### Clear Context

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %2 Enter
```

---

<a name="sakura"></a>
## 🎺 サクラ (ReviewAgent) - Pane %5

### Full Security Audit (Rust Commands最適化版) ⭐ NEW

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。Issue #270の完全セキュリティ監査を実行してください。

【セキュリティチェック - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください:
- cargo audit（脆弱性スキャン）
- cargo clippy -- -D warnings -W clippy::all（コード品質）
- cargo test --all（全テスト実行）

【品質評価】
1. 品質スコア算出（0-100点）
2. セキュリティissue列挙
3. 改善推奨事項まとめ

【完了報告】
GitHub commentに投稿して [サクラ] レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter
```

### Quick Review (緊急時の高速レビュー)

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。クイックレビューを実行してください。

以下を&&チェーンで実行:
- cargo clippy -- -D warnings
- cargo test --all

完了したら [サクラ] クイックレビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter
```

### Wait for カエデ Then Review

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが Issue #270実装完了 と発言したら、フルセキュリティ監査を開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter
```

### Check Status

```bash
tmux capture-pane -t %5 -p | tail -10
```

### Clear Context

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %5 Enter
```

---

<a name="tsubaki"></a>
## 🥁 ツバキ (PRAgent) - Pane %3

### PR作成前チェック (Rust Commands最適化版) ⭐ NEW

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。Issue #270のPR作成前チェックと作成を実行してください。

【検証フェーズ - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください:
- cargo fmt -- --check（フォーマット確認）
- cargo clippy -- -D warnings（最終品質チェック）
- cargo test --all（全テスト実行）

【PR作成フェーズ】
全て成功したら:
1. Conventional Commits準拠のPR作成
2. 57ラベル体系に基づくラベル付与
3. GitHub commentに検証結果投稿

【完了報告】
全て成功したら [ツバキ] PR作成完了 と発言してください。失敗した場合は [ツバキ] エラー: {詳細} と報告してください。" && sleep 0.5 && tmux send-keys -t %3 Enter
```

### Basic PR Creation

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。現在のブランチでPR作成を行ってください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter
```

### Wait for サクラ Then Create PR

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter
```

### Create PR with Specific Title

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。タイトル「feat: Issue #270実装」でPRを作成してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter
```

### Check Status

```bash
tmux capture-pane -t %3 -p | tail -10
```

### Clear Context

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %3 Enter
```

---

<a name="botan"></a>
## 🎷 ボタン (DeploymentAgent) - Pane %4

### デプロイ前検証 (Rust Commands最適化版) ⭐ NEW

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。Issue #270のデプロイ前検証とデプロイを実行してください。

【検証フェーズ - Rust Commands一括実行】
以下を&&チェーンでシーケンシャルに実行してください:
- cargo build --release（リリースビルド）
- cargo test --release（リリースモードテスト）
- cargo clippy --release -- -D warnings（リリース最終チェック）

【デプロイフェーズ】
全て成功したら:
1. Firebase/Cloud Buildへのデプロイ実行
2. ヘルスチェック実行
3. デプロイ結果をGitHub commentに投稿

【完了報告】
全て成功したら [ボタン] デプロイ完了 と発言してください。失敗した場合は [ボタン] エラー: {詳細} と報告してください。" && sleep 0.5 && tmux send-keys -t %4 Enter
```

### Basic Deploy Task

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。デプロイを実行してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %4 Enter
```

### Wait for ツバキ Then Deploy

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。ツバキが PR作成完了 と発言したら、デプロイを開始してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %4 Enter
```

### Check Status

```bash
tmux capture-pane -t %4 -p | tail -10
```

### Clear Context

```bash
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %4 Enter
```

---

<a name="monitoring"></a>
## 📊 Monitoring & Status

### Dashboard (All Agents)

```bash
./scripts/miyabi-dashboard.sh
```

### Check All Agents Status (6 Agents)

```bash
for pane in %10 %11 %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | tail -5
    echo ""
done
```

### Search for Completions

```bash
for pane in %10 %11 %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | grep "完了"
    echo ""
done
```

### Search for Errors

```bash
for pane in %10 %11 %2 %5 %3 %4; do
    echo "=== $pane ==="
    tmux capture-pane -t $pane -p | grep -i "error\|エラー"
    echo ""
done
```

### Search for Specific Agent Messages

```bash
# みつけるんの発言
tmux capture-pane -t %10 -p | grep "\[みつけるん\]"

# しきるんの発言
tmux capture-pane -t %11 -p | grep "\[しきるん\]"

# カエデの発言
tmux capture-pane -t %2 -p | grep "\[カエデ\]"

# サクラの発言
tmux capture-pane -t %5 -p | grep "\[サクラ\]"

# ツバキの発言
tmux capture-pane -t %3 -p | grep "\[ツバキ\]"

# ボタンの発言
tmux capture-pane -t %4 -p | grep "\[ボタン\]"
```

---

<a name="token-management"></a>
## 🔄 Token Management

### Clear Individual Agent

```bash
# みつけるん
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %10 Enter

# しきるん
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %11 Enter

# カエデ
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %2 Enter

# サクラ
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %5 Enter

# ツバキ
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %3 Enter

# ボタン
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %4 Enter
```

### Clear All Agents (Sequential - 6 Agents)

```bash
for pane in %10 %11 %2 %5 %3 %4; do
    tmux send-keys -t $pane "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t $pane Enter
    sleep 0.5
done
```

### Check Token Usage

```bash
# Run in Conductor pane
ccusage
```

---

<a name="workflows"></a>
## 🎯 Common Workflows

### Workflow 0: Complete W1-W5 Automation (みつけるん → しきるん → カエデ → サクラ → ツバキ → ボタン)

**✅ 100% Complete Workflow Coverage - Full Automation**

```bash
# Step 0: みつけるん - Issue Triage (W1)
tmux send-keys -t %10 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「みつけるん」です。最新のIssueをトリアージしてください。Label推定、優先度設定、state:pendingを付与してください。完了したら [みつけるん] トリアージ完了 Issue #XXX と発言してください。" && sleep 0.5 && tmux send-keys -t %10 Enter

# Step 1: しきるん - Task Decomposition (W2, wait for みつけるん)
tmux send-keys -t %11 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「しきるん」です。みつけるんが トリアージ完了 と発言したら、そのIssueをTask配列に分解し、DAG構築、Agent割り当てを行ってください。完了したら [しきるん] タスク分解完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %11 Enter

# Step 2: カエデ - Implementation (W3, wait for しきるん)
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。しきるんが タスク分解完了 と発言したら、実装を開始してください。agent-executionスキルを使用してください。完了したら [カエデ] 実装完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter

# Step 3: サクラ - Review (W4, wait for カエデ)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが 実装完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter

# Step 4: ツバキ - PR Creation (W3, wait for サクラ)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter

# Step 5: ボタン - Deploy (W5, wait for ツバキ)
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。ツバキが PR作成完了 と発言したら、デプロイを開始してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %4 Enter
```

**Monitoring Progress**:
```bash
# Watch all agents
watch -n 2 'for pane in %10 %11 %2 %5 %3 %4; do echo "=== $pane ==="; tmux capture-pane -t $pane -p | tail -3; done'
```

---

### Workflow 1: Full Pipeline (Issue → Implementation → Review → PR → Deploy)

```bash
# Step 1: カエデ - Implementation
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270の実装をagent-executionスキルで行ってください。完了したら [カエデ] Issue #270実装完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter

# Step 2: サクラ - Review (wait for カエデ)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが Issue #270実装完了 と発言したら、コードレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter

# Step 3: ツバキ - PR Creation (wait for サクラ)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、PR作成を開始してください。完了したら [ツバキ] PR作成完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter

# Step 4: ボタン - Deploy (wait for ツバキ)
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。ツバキが PR作成完了 と発言したら、デプロイを開始してください。完了したら [ボタン] デプロイ完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %4 Enter
```

### Workflow 2: Parallel Review (Multiple Reviewers)

```bash
# カエデ - Implementation
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。Issue #270の実装を行ってください。完了したら [カエデ] 実装完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter

# サクラ - Code Quality Review (wait for カエデ)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが 実装完了 と発言したら、コード品質レビューを開始してください。完了したら [サクラ] 品質レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter

# ツバキ - Security Review (wait for カエデ)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。カエデが 実装完了 と発言したら、セキュリティレビューを開始してください。完了したら [ツバキ] セキュリティレビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter

# ボタン - Performance Review (wait for カエデ)
tmux send-keys -t %4 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ボタン」です。カエデが 実装完了 と発言したら、パフォーマンスレビューを開始してください。完了したら [ボタン] パフォーマンスレビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %4 Enter
```

### Workflow 3: Emergency Hotfix

```bash
# カエデ - Quick fix
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。緊急バグ修正を行ってください。Issue #280。完了したら [カエデ] 修正完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %2 Enter

# サクラ - Quick review (parallel start)
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「サクラ」です。カエデが 修正完了 と発言したら、クイックレビューを開始してください。完了したら [サクラ] レビュー完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %5 Enter

# ツバキ - Immediate PR (wait for サクラ)
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「ツバキ」です。サクラが レビュー完了 と発言したら、即座にPR作成してください。完了したら [ツバキ] PR完了 と発言してください。" && sleep 0.5 && tmux send-keys -t %3 Enter
```

---

<a name="troubleshooting"></a>
## 🚨 Troubleshooting Quick Fixes

### Agent Not Responding

```bash
# Check what agent is doing
tmux capture-pane -t %2 -p | tail -20

# If stuck, clear and restart
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && /clear" && sleep 0.5 && tmux send-keys -t %2 Enter
sleep 2
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && あなたは「カエデ」です。準備できましたか？" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### Agent Reported Error

```bash
# Check error details
tmux capture-pane -t %2 -p | grep -A 5 "エラー\|error"

# Ask agent to self-resolve
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && 発生したエラーを調査して解決を試みてください。解決できない場合のみ報告してください。" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### Agent Waiting Forever

```bash
# Check what agent is waiting for
tmux capture-pane -t %5 -p | tail -10

# Send manual trigger
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && 待機を終了して、タスクを開始してください。" && sleep 0.5 && tmux send-keys -t %5 Enter
```

### Command Not Executing

```bash
# Verify basic style is used
# ✅ Correct:
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && [instruction]" && sleep 0.5 && tmux send-keys -t %2 Enter

# ❌ Incorrect:
tmux send-keys -t %2 '[instruction]' Enter  # Wrong quotes, no cd, no sleep
```

---

<a name="navigation"></a>
## ⌨️ Navigation Quick Reference

| Action | Command |
|--------|---------|
| Move to Conductor | `Ctrl-a + 1` |
| Move to みつけるん | `Ctrl-a + 0` (then `:select-pane -t %10`) |
| Move to しきるん | `Ctrl-a + 0` (then `:select-pane -t %11`) |
| Move to カエデ | `Ctrl-a + 2` |
| Move to サクラ | `Ctrl-a + 5` (pane %5) |
| Move to ツバキ | `Ctrl-a + 3` |
| Move to ボタン | `Ctrl-a + 4` |
| Show pane numbers | `Ctrl-a + q` |
| Maximize/restore pane | `Ctrl-a + z` |
| Previous pane | `Ctrl-a + o` |

**Direct Pane Selection**:
```bash
# Jump to specific pane by ID
tmux select-pane -t %10  # みつけるん
tmux select-pane -t %11  # しきるん
tmux select-pane -t %2   # カエデ
tmux select-pane -t %5   # サクラ
tmux select-pane -t %3   # ツバキ
tmux select-pane -t %4   # ボタン
```

---

<a name="communication"></a>
## 📝 Agent Communication Protocol

### Standard Reporting Format

```
[Agent名] {ステータス}: {詳細}
```

**Examples**:
- `[みつけるん] 完了: Issue #270のトリアージが完了しました。Label: bug/high, state:pending`
- `[しきるん] 完了: Task分解完了。5タスク、DAG構築済み、Agent割り当て済み`
- `[カエデ] 完了: Issue #270の実装が完了しました`
- `[サクラ] 進行中: コードレビューを実施中です（進捗50%）`
- `[ツバキ] エラー: PR作成に失敗しました。GitHub APIエラー`
- `[ボタン] 待機: ツバキのPR完了を待機中`

**W1-W5 Workflow Examples**:
- `[みつけるん] トリアージ完了 Issue #280` ➜ triggers しきるん
- `[しきるん] タスク分解完了` ➜ triggers カエデ
- `[カエデ] 実装完了` ➜ triggers サクラ
- `[サクラ] レビュー完了` ➜ triggers ツバキ
- `[ツバキ] PR作成完了` ➜ triggers ボタン
- `[ボタン] デプロイ完了` ➜ End of workflow

### Agent-to-Conductor Reporting

```bash
# Agent sends message to Conductor (%1)
tmux send-keys -t %1 '[カエデ] タスク完了しました' && sleep 0.1 && tmux send-keys -t %1 Enter
```

### Agent-to-Agent Communication

```bash
# サクラ waits for カエデ's message
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && カエデが 完了 と発言したら、次のタスクを開始してください。" && sleep 0.1 && tmux send-keys -t %5 Enter
```

---

<a name="custom-behaviors"></a>
## 🎨 Custom Agent Behaviors

### カエデ with Custom Sub-Agent

```bash
tmux send-keys -t %2 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --agents '{\"miyabi-coder\": {\"description\": \"Miyabi specialist\", \"prompt\": \"You are Kaede, CodeGenAgent. Follow CLAUDE.md.\", \"tools\": [\"Read\", \"Edit\", \"Write\", \"Bash\", \"Grep\", \"Skill\"], \"model\": \"sonnet\"}}'" && sleep 0.5 && tmux send-keys -t %2 Enter
```

### サクラ with JSON Output

```bash
tmux send-keys -t %5 "cd '/Users/shunsuke/Dev/miyabi-private' && claude -p 'Issue #270のレビュー結果は？' --output-format json > /tmp/sakura-review.json" && sleep 0.5 && tmux send-keys -t %5 Enter
```

### ツバキ with Context Injection

```bash
tmux send-keys -t %3 "cd '/Users/shunsuke/Dev/miyabi-private' && claude --append-system-prompt 'Miyabi PR規約: Conventional Commits準拠、57ラベル体系使用'" && sleep 0.5 && tmux send-keys -t %3 Enter
```

---

## 📚 Related Documentation

- **Comprehensive Guide**: `.claude/CODEX_TMUX_PARALLEL_EXECUTION.md`
- **Advanced Techniques**: `.claude/TMUX_ADVANCED_TECHNIQUES.md`
- **Command Reference**: `docs/CLAUDE_CODE_COMMANDS.md`
- **Visual Guide**: `docs/VISUAL_GUIDE.md`
- **Full Index**: `.claude/TMUX_INTEGRATION_INDEX.md`

---

## 💡 Tips

1. **Always use the basic style**: `tmux send-keys -t %N "cd '/path' && [instruction]" && sleep 0.5 && tmux send-keys -t %N Enter`
2. **Double quotes required**: Single quotes won't work in Claude Code interactive mode
3. **Include `cd` command**: Ensures agents work in correct directory
4. **Add `sleep 0.5`**: Critical for proper command execution and reducing screen flicker (increased from 0.1 to prevent tmux blinking)
5. **Clear context regularly**: Use `/clear` after major tasks to manage tokens
6. **Monitor with Dashboard**: `./scripts/miyabi-dashboard.sh` for overall status
7. **Use grep for filtering**: `tmux capture-pane -t %2 -p | grep "pattern"` to find specific messages
8. **Test agents first**: Send simple "準備OK" messages before complex tasks
9. **W1-W5 Complete Coverage**: With 6 agents deployed, you now have 100% workflow automation from Issue triage to deployment
10. **Start with みつけるん**: For full automation, always initiate Workflow 0 with みつけるん's triage
11. **Chain agents explicitly**: Use "wait for X then Y" pattern for reliable sequential execution
12. **Monitor all 6 agents**: Update your monitoring commands to include %10 and %11 for comprehensive status
13. **Use Rust Commands patterns**: For カエデ, サクラ, ツバキ, ボタン - use &&-chained commands for 50% faster execution

---

**🎭 Miyabi Orchestra - Agent Control Quick Reference**

**Version**: 1.0.0
**Last Updated**: 2025-11-03
**Location**: `/Users/shunsuke/Dev/miyabi-private/.claude/agents/tmux_agents_control.md`