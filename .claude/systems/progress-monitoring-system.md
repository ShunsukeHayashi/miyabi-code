# 🎯 Progress Monitoring System - リアルタイム進捗監視

**Version**: 1.0.0
**Created**: 2025-11-15
**Purpose**: バックグラウンドタスクの進捗を自動収集しWebUIに表示

---

## 1. システム概要

```
┌─────────────────────────────────────────────────────────┐
│              Progress Monitoring System                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────┐ │
│  │  Task Runner │───>│ Progress      │───>│ WebUI   │ │
│  │  (Background)│    │ Aggregator    │    │ Display │ │
│  └──────────────┘    └───────────────┘    └─────────┘ │
│         │                     │                  │      │
│         ├─ CDK Deploy         ├─ Collect logs    │      │
│         ├─ Agent Execution    ├─ Parse status    │      │
│         ├─ Issue Creation     ├─ Calculate %     │      │
│         └─ Build/Test         └─ Store in DB     │      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. データ構造

### 2.1 Progress Record

```json
{
  "progress_id": "progress-<timestamp>-<uuid>",
  "task_id": "task-1763202335960-e48f83d9",
  "task_type": "cdk_deploy | agent_execution | issue_creation | build",
  "status": "pending | running | completed | failed",
  "progress": {
    "current": 29,
    "total": 29,
    "percentage": 100
  },
  "started_at": "2025-11-15T19:40:00+09:00",
  "updated_at": "2025-11-15T19:45:00+09:00",
  "completed_at": "2025-11-15T19:45:02+09:00",
  "duration_seconds": 302,
  "details": {
    "phase": "CloudFormation Stack Creation",
    "current_step": "CloudFront Distribution",
    "log_file": ".claude/logs/cdk-deploy-learn-fixed.log"
  },
  "metadata": {
    "project_id": "miyabi-webui",
    "agent": "orchestrator",
    "priority": "P1"
  }
}
```

### 2.2 Multi-Project Tracking

```json
{
  "project_id": "miyabi-webui",
  "project_name": "Miyabi WebUI",
  "status": "active",
  "tasks": [
    {
      "task_id": "task-1763202335960-e48f83d9",
      "name": "CDK Deploy",
      "status": "completed",
      "progress": 100
    }
  ],
  "created_at": "2025-11-15T19:00:00+09:00",
  "owner": "orchestrator"
}
```

---

## 3. 実装コンポーネント

### 3.1 Progress Collector (進捗収集器)

**ファイル**: `.claude/scripts/collect-progress.sh`

**機能**:
- 全バックグラウンドタスクをスキャン
- ログファイルから進捗情報を抽出
- JSON形式で進捗データベースに保存

**実行頻度**: 5秒ごと (WebUI auto-refreshと同期)

### 3.2 Progress Aggregator (進捗集約器)

**ファイル**: `web-ui/api/progress.js`

**API Endpoint**:
```
GET /api/progress
GET /api/progress/:task_id
GET /api/projects
GET /api/projects/:project_id/progress
```

**レスポンス例**:
```json
{
  "timestamp": "2025-11-15T19:45:02+09:00",
  "projects": [
    {
      "project_id": "miyabi-webui",
      "project_name": "Miyabi WebUI",
      "overall_progress": 100,
      "active_tasks": 0,
      "completed_tasks": 4,
      "failed_tasks": 0
    }
  ],
  "tasks": [
    {
      "task_id": "task-cdk-deploy",
      "name": "CDK Deploy",
      "status": "completed",
      "progress": 100,
      "started_at": "2025-11-15T19:40:00+09:00",
      "completed_at": "2025-11-15T19:45:02+09:00"
    },
    {
      "task_id": "task-uiux-agent",
      "name": "UI/UX Agent Review",
      "status": "completed",
      "progress": 100
    },
    {
      "task_id": "task-security-agent",
      "name": "Security Agent Audit",
      "status": "completed",
      "progress": 100
    }
  ]
}
```

### 3.3 WebUI Progress Display

**ファイル**: `web-ui/public/index.html` (拡張)

**追加セクション**:
```html
<!-- Real-time Progress Monitoring -->
<div class="progress-monitor">
  <h2>📊 リアルタイム進捗モニター</h2>

  <!-- Project Overview -->
  <div class="project-overview">
    <h3>プロジェクト概要</h3>
    <div id="projects-list"></div>
  </div>

  <!-- Active Tasks -->
  <div class="active-tasks">
    <h3>実行中タスク</h3>
    <div id="active-tasks-list"></div>
  </div>

  <!-- Completed Tasks -->
  <div class="completed-tasks">
    <h3>完了タスク</h3>
    <div id="completed-tasks-list"></div>
  </div>
</div>
```

**プログレスバー**:
```html
<div class="task-progress">
  <div class="progress-bar-container">
    <div class="progress-bar" style="width: 75%"></div>
  </div>
  <span class="progress-text">75% (21/29 resources)</span>
  <span class="eta">ETA: 2 minutes</span>
</div>
```

---

## 4. マルチプロジェクト管理

### 4.1 Project Schema

```typescript
interface Project {
  project_id: string;           // "miyabi-webui", "miyabi-mobile", etc.
  project_name: string;
  description: string;
  status: "active" | "paused" | "completed" | "archived";
  created_at: string;
  owner: string;                // "orchestrator", "coordinator-mugen", etc.

  // Multi-tenant support
  account_id?: string;          // For multi-tenant isolation

  // Resources
  resources: {
    github_repo: string;
    s3_bucket?: string;
    cloudfront_distribution?: string;
    api_endpoint?: string;
  };

  // Tasks
  tasks: Task[];

  // Metrics
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    success_rate: number;
    avg_completion_time_seconds: number;
  };
}
```

### 4.2 Project Management API

```typescript
// Create new project
POST /api/projects
{
  "project_name": "New Project",
  "description": "Project description",
  "owner": "orchestrator"
}

// List all projects
GET /api/projects

// Get project details
GET /api/projects/:project_id

// Update project
PATCH /api/projects/:project_id
{
  "status": "completed"
}

// Delete project
DELETE /api/projects/:project_id
```

### 4.3 Project Directory Structure

```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/
├── projects/
│   ├── miyabi-webui/
│   │   ├── project.json          # Project metadata
│   │   ├── tasks/                # Task records
│   │   ├── logs/                 # Project-specific logs
│   │   └── outputs/              # Build artifacts
│   │
│   ├── miyabi-mobile/
│   │   ├── project.json
│   │   └── ...
│   │
│   └── miyabi-api/
│       └── ...
```

---

## 5. 実装フェーズ

### Phase 1: Progress Monitoring (Week 1)
- ✅ Progress data structure design
- ⏳ Implement progress collector script
- ⏳ Create progress API endpoints
- ⏳ Add WebUI progress display

### Phase 2: Multi-Project Management (Week 2)
- ⏳ Project schema and database
- ⏳ Project management API
- ⏳ Project directory structure
- ⏳ WebUI project switcher

### Phase 3: Real-time Updates (Week 3)
- ⏳ WebSocket integration (optional)
- ⏳ Server-Sent Events (SSE)
- ⏳ Optimistic UI updates
- ⏳ Notification system

### Phase 4: Analytics & Reporting (Week 4)
- ⏳ Project analytics dashboard
- ⏳ Historical progress charts
- ⏳ Performance metrics
- ⏳ Export reports (CSV, JSON)

---

## 6. 技術スタック

**Backend**:
- Node.js + Express.js (API server)
- SQLite or JSON files (lightweight storage)
- Shell scripts (progress collection)

**Frontend**:
- Vanilla JavaScript (no framework overhead)
- Chart.js (progress visualization)
- Auto-refresh (5-second intervals)

**Real-time** (Optional):
- WebSocket (ws library)
- Server-Sent Events (native)

---

## 7. モニタリング例

### 7.1 CDK Deploy Progress

```
📦 CDK Deploy (task-cdk-deploy-001)
├── Status: Running
├── Progress: 75% (21/29 resources)
├── Phase: CloudFront Distribution
├── Started: 19:40:00
├── ETA: 2 minutes
└── Log: .claude/logs/cdk-deploy-learn-fixed.log
```

### 7.2 Agent Execution Progress

```
🤖 UI/UX Agent (task-uiux-agent-001)
├── Status: Completed
├── Progress: 100%
├── Phase: Review Generation
├── Duration: 3m 45s
└── Output: .claude/logs/uiux-agent-review-20251115.log
```

### 7.3 Multi-Project Overview

```
📊 Project Overview (3 active projects)
├── miyabi-webui: 100% (4/4 tasks completed)
├── miyabi-mobile: 60% (3/5 tasks running)
└── miyabi-api: 25% (1/4 tasks pending)
```

---

## 8. ユーザー要求への対応

### 要求1: リアルタイム進捗表示
✅ 5秒ごとの自動リフレッシュ
✅ プログレスバーによる視覚化
✅ ETA (完了予定時刻) 表示

### 要求2: バックグラウンドタスク管理
✅ 全バックグラウンドプロセスを自動検出
✅ ログファイルから進捗抽出
✅ WebUIに統合表示

### 要求3: マルチプロジェクト管理
✅ プロジェクトごとに独立管理
✅ プロジェクト一覧表示
✅ プロジェクト切り替え機能

---

## 9. 次のアクション

1. **Progress Collector実装** (15分)
   - `.claude/scripts/collect-progress.sh` 作成
   - バックグラウンドプロセスをスキャン
   - ログファイル解析

2. **Progress API実装** (20分)
   - `/api/progress` エンドポイント
   - `/api/projects` エンドポイト
   - データベース連携

3. **WebUI拡張** (25分)
   - プログレスモニター表示追加
   - プロジェクト一覧表示
   - リアルタイム更新

---

**Orchestrator**: Layer 2 - Mac Agent
**System**: Progress Monitoring & Multi-Project Management
**Status**: ✅ Design Complete → ⏳ Implementation Starting

🌸 **"リアルタイムの透明性 - すべての進捗を可視化する"** 🌸
