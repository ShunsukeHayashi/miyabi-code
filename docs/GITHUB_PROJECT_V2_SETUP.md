# 🗂️ GitHub Project V2 セットアップガイド

**Issue**: #5 - Phase A: Data Persistence Layer
**作成日**: 2025-10-15
**対象**: GitHub Projects V2 を Miyabi の「データベース」として構成

---

## 📋 目次

1. [概要](#-概要)
2. [Project作成手順](#-project作成手順)
3. [Custom Fields設定](#-custom-fields設定)
4. [Views設定](#-views設定)
5. [自動化確認](#-自動化確認)
6. [トラブルシューティング](#-トラブルシューティング)

---

## 🎯 概要

GitHub Projects V2を「データベース」として活用し、Issue/PR/Agent実行データを構造化して管理します。

### メリット

- ✅ **リアルタイム可視化**: Issue/PRステータスを一元管理
- ✅ **KPI追跡**: 完了率、工数、品質スコア等を自動集計
- ✅ **Agent連携**: 自動ワークフローと統合

### アーキテクチャ

```
GitHub Issue/PR
     ↓ (自動追加)
Project V2 (Database)
     ├─ Custom Fields (8個)
     ├─ Views (4つ)
     └─ Automation (3 workflows)
```

---

## 🚀 Project作成手順

### Step 1: New Project作成

#### 方法A: GitHub UI（推奨）

1. GitHubにアクセス:
   ```
   https://github.com/users/ShunsukeHayashi/projects
   ```

2. **"New project"** ボタンをクリック

3. プロジェクト設定:
   - **Name**: `Miyabi - Autonomous Operations`
   - **Description**: `Agent Task Board - GitHub as Database`
   - **Template**: Start from scratch（またはTable）

4. **Create project** をクリック

#### 方法B: GitHub CLI

```bash
# gh CLI経由で作成
gh project create \
  --owner ShunsukeHayashi \
  --title "Miyabi - Autonomous Operations" \
  --format table

# 出力例:
# https://github.com/users/ShunsukeHayashi/projects/1
```

### Step 2: Project Number確認

Project URLからProject Numberを取得します。

**URL例**: `https://github.com/users/ShunsukeHayashi/projects/1`
→ Project Number: **1**

このNumberを`.github/workflows/project-sync.yml`等で使用します。

---

## 🔧 Custom Fields設定

Projects V2の**Custom Fields**を8個追加します。

### 追加手順

1. Project画面右上の **⚙️ Settings** をクリック
2. **Custom fields** セクションで **+ New field** をクリック
3. 以下の8フィールドを追加

---

### 1️⃣ Agent (Single select)

**用途**: 担当Agent指定

| Field Name | Agent |
|------------|-------|
| **Type** | Single select |
| **Options** | CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent, WaterSpiderAgent |

**設定手順**:
```
+ New field → "Agent"
Type: Single select
Options:
  - CoordinatorAgent
  - CodeGenAgent
  - ReviewAgent
  - IssueAgent
  - PRAgent
  - DeploymentAgent
  - RefresherAgent
  - WaterSpiderAgent
```

---

### 2️⃣ Status (Single select)

**用途**: タスクステータス追跡

| Field Name | Status |
|------------|--------|
| **Type** | Single select |
| **Options** | Pending, In Progress, Blocked, In Review, Done, Cancelled |

**設定手順**:
```
+ New field → "Status"
Type: Single select
Options:
  - Pending (📥)
  - In Progress (🏃)
  - Blocked (🚫)
  - In Review (👀)
  - Done (✅)
  - Cancelled (❌)
```

---

### 3️⃣ Priority (Single select)

**用途**: 優先度管理

| Field Name | Priority |
|------------|----------|
| **Type** | Single select |
| **Options** | P0-Critical, P1-High, P2-Medium, P3-Low |

**設定手順**:
```
+ New field → "Priority"
Type: Single select
Options:
  - P0-Critical (🔥)
  - P1-High (⚡)
  - P2-Medium (⚠️)
  - P3-Low (📝)
```

---

### 4️⃣ Phase (Single select)

**用途**: プロジェクトフェーズ管理

| Field Name | Phase |
|------------|-------|
| **Type** | Single select |
| **Options** | Phase 3, Phase 4, Phase 5, Phase 6, Phase 7, Phase 8, Backlog |

**設定手順**:
```
+ New field → "Phase"
Type: Single select
Options:
  - Phase 3 (miyabi-types)
  - Phase 4 (miyabi-cli)
  - Phase 5 (miyabi-agents)
  - Phase 6 (Content Creation)
  - Phase 7 (Marketing)
  - Phase 8 (Sales)
  - Backlog
```

---

### 5️⃣ Estimated Hours (Number)

**用途**: 見積もり工数

| Field Name | Estimated Hours |
|------------|-----------------|
| **Type** | Number |
| **Format** | Decimal (0.5, 1.0, 2.5, etc.) |

**設定手順**:
```
+ New field → "Estimated Hours"
Type: Number
```

---

### 6️⃣ Actual Hours (Number)

**用途**: 実績工数

| Field Name | Actual Hours |
|------------|--------------|
| **Type** | Number |
| **Format** | Decimal |

**設定手順**:
```
+ New field → "Actual Hours"
Type: Number
```

---

### 7️⃣ Quality Score (Number)

**用途**: ReviewAgentによる品質スコア（0-100点）

| Field Name | Quality Score |
|------------|---------------|
| **Type** | Number |
| **Range** | 0-100 |

**設定手順**:
```
+ New field → "Quality Score"
Type: Number
```

---

### 8️⃣ Cost (USD) (Number)

**用途**: API実行コスト追跡

| Field Name | Cost (USD) |
|------------|------------|
| **Type** | Number |
| **Format** | Decimal (例: 0.05, 1.20) |

**設定手順**:
```
+ New field → "Cost (USD)"
Type: Number
```

---

## 📊 Views設定

4つのViewを作成して、データを多角的に可視化します。

### View 1: Task Board (Kanban)

**用途**: Status別タスク管理

1. **+ New view** → **Board**
2. View name: `Task Board`
3. Group by: **Status**
4. Filter: None（全Issue表示）
5. Sort: Priority (High → Low)

**表示例**:
```
📥 Pending | 🏃 In Progress | 👀 In Review | ✅ Done
-----------|--------------|--------------|---------
Issue #270 | Issue #271   | Issue #272   | Issue #120
Issue #273 | Issue #274   |              | Issue #117
```

---

### View 2: Agent Workload (Table)

**用途**: Agent別タスク一覧

1. **+ New view** → **Table**
2. View name: `Agent Workload`
3. Group by: **Agent**
4. Columns: Title, Status, Priority, Estimated Hours, Actual Hours
5. Sort: Priority (High → Low)

**表示例**:
```
CoordinatorAgent
  - Issue #270 | In Progress | P1-High | 8h | 6h
  - Issue #271 | Pending     | P2-Medium | 4h | -

CodeGenAgent
  - Issue #272 | Done        | P0-Critical | 12h | 10h
```

---

### View 3: Phase Roadmap (Board)

**用途**: フェーズ別進捗管理

1. **+ New view** → **Board**
2. View name: `Phase Roadmap`
3. Group by: **Phase**
4. Filter: None
5. Sort: Priority (High → Low)

**表示例**:
```
Phase 3 | Phase 4 | Phase 5 | Backlog
--------|---------|---------|--------
✅ Done | 🏃 In Progress | 📥 Pending | 📝 Planning
```

---

### View 4: KPI Dashboard (Table)

**用途**: KPI・メトリクス追跡

1. **+ New view** → **Table**
2. View name: `KPI Dashboard`
3. Group by: None（全Issue）
4. Columns: Title, Status, Agent, Estimated Hours, Actual Hours, Quality Score, Cost (USD)
5. Sort: Status → Done (最近完了したものを上に)

**集計例**（手動計算またはGraphQL）:
```
Total Tasks: 137
Completed: 45 (33%)
Total Hours: 450h (Estimated: 600h)
Avg Quality Score: 87.5
Total Cost: $12.50
```

---

## ✅ 自動化確認

Project作成後、既存ワークフローが正しく動作するか確認します。

### 1. Issue自動追加テスト

**ワークフロー**: `.github/workflows/project-sync.yml`

```bash
# 新しいIssueを作成してテスト
gh issue create \
  --title "Test: Project Sync" \
  --body "Testing automatic project addition" \
  --label "enhancement"

# Project V2に自動追加されることを確認
# https://github.com/users/ShunsukeHayashi/projects/1
```

**期待動作**:
- ✅ Issueが自動的にProjectに追加される
- ✅ Priority、Phaseが自動設定される（ラベルベース）
- ✅ Statusが "Pending" に設定される

---

### 2. PR状態連動テスト

**ワークフロー**: `.github/workflows/project-pr-sync.yml`

```bash
# 新しいPRを作成
git checkout -b test/project-sync
echo "# Test" > test.md
git add test.md
git commit -m "test: Project sync test"
git push origin test/project-sync
gh pr create --title "Test: PR Sync" --body "Testing PR sync"

# PRの状態を変更
gh pr ready  # Draft → Ready for Review
# Project Statusが "In Review" に変わることを確認

gh pr merge --squash
# Project Statusが "Done" に変わることを確認
```

**期待動作**:
- ✅ PR作成時: Statusが "In Progress"
- ✅ Ready for Review: Statusが "In Review"
- ✅ Merge時: Statusが "Done"

---

### 3. 週次レポート生成テスト

**ワークフロー**: `.github/workflows/weekly-report.yml`

```bash
# 手動実行
gh workflow run weekly-report.yml

# 実行ログ確認
gh run list --workflow=weekly-report.yml

# 最新のrun詳細
gh run view --log
```

**期待動作**:
- ✅ Issueに週次レポートがポストされる
- ✅ KPI（完了率、工数、コスト）が集計される
- ✅ Agent別・Phase別の統計が表示される

---

## 🔧 トラブルシューティング

### 問題1: Issueが自動追加されない

**原因**: Project URLが正しくない

**解決**:
```bash
# project-sync.ymlを確認
vim .github/workflows/project-sync.yml

# project-urlを実際のProject URLに変更
# 誤: https://github.com/users/ShunsukeHayashi/projects/1
# 正: https://github.com/users/YOUR_USERNAME/projects/YOUR_NUMBER
```

### 問題2: Custom Fieldsが更新されない

**原因**: GraphQL APIのField IDが取得できていない

**解決**:
```bash
# Project V2のGraphQL IDを取得
gh api graphql -f query='
  query {
    user(login: "ShunsukeHayashi") {
      projectV2(number: 1) {
        id
        field(name: "Status") {
          ... on ProjectV2SingleSelectField {
            id
            options {
              id
              name
            }
          }
        }
      }
    }
  }
'

# 取得したIDをworkflowに反映
```

### 問題3: Permissionエラー

**エラー**:
```
Resource not accessible by integration
```

**解決**:
```bash
# Repository Settings → Actions → General → Workflow permissions
# "Read and write permissions" を選択

# または、Personal Access Token (PAT) を作成
# Scopes: project, repo
gh secret set GH_PROJECT_TOKEN
```

### 問題4: Project Numberがわからない

**解決**:
```bash
# CLI経由でProject一覧取得
gh project list --owner ShunsukeHayashi

# 出力例:
# NUMBER  TITLE                              STATE
# 1       Miyabi - Autonomous Operations     OPEN
```

---

## 📚 次のステップ

Project V2セットアップ完了後、以下を実施：

1. ✅ **Phase A完了確認**: 全5ステップが完了
2. 🔄 **Phase B開始**: Webhooks - Event Bus実装
3. 💬 **Phase C開始**: Discussions - Message Queue実装
4. 📊 **KPI Dashboard作成**: Grafana統合

---

## 🔗 関連リンク

- **GitHub Projects V2 Docs**: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- **GraphQL API for Projects**: https://docs.github.com/en/graphql/reference/objects#projectv2
- **Issue #5**: https://github.com/ShunsukeHayashi/miyabi-private/issues/5
- **Integration Plan**: [GITHUB_OS_INTEGRATION_PLAN.md](./architecture/GITHUB_OS_INTEGRATION_PLAN.md)

---

**作成日**: 2025-10-15
**最終更新**: 2025-10-15
**バージョン**: 1.0

🗂️ **GitHub Projects V2 - Data Persistence Layer Complete!**
