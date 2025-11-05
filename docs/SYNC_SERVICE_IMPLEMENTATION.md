# GitHub ↔ Lark 双方向同期サービス実装

**Version**: 1.0.0
**Component**: miyabi-lark-sync
**Status**: 🔧 Implementation Ready

---

## 📋 実装概要

### 目的

GitHub Issues と Lark Tasks/Base を双方向にリアルタイム同期し、データの整合性を保つ。

### アーキテクチャ

```
GitHub Webhook → Express Server → Sync Logic → Lark API
     ↓                                            ↑
   Issue Event                              Task Event
     ↓                                            ↑
Lark Callback ← Express Server ← Event Router ← Lark
```

---

## 🔧 実装コード

### src/index.ts

```typescript
import express from 'express';
import { Octokit } from '@octokit/rest';
import * as lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// GitHub Client
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Lark Client
const larkClient = new lark.Client({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  disableTokenCache: false,
});

// Mapping Store (本番環境では Redis/PostgreSQL を使用)
const syncMapping = new Map<number, {
  larkTaskId: string;
  larkBaseRecordId: string;
  lastSyncedAt: Date;
}>();

//============================================================================
// GitHub → Lark 同期
//============================================================================

/**
 * GitHub Webhook Handler
 */
app.post('/webhooks/github', async (req, res) => {
  const event = req.body;
  const eventType = req.headers['x-github-event'];

  console.log(`📥 GitHub Event: ${eventType} - ${event.action}`);

  try {
    switch (eventType) {
      case 'issues':
        await handleIssueEvent(event);
        break;
      case 'pull_request':
        await handlePREvent(event);
        break;
      default:
        console.log(`⚠️  Unhandled event type: ${eventType}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error handling GitHub webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Issue Event Handler
 */
async function handleIssueEvent(event: any): Promise<void> {
  const { action, issue } = event;

  switch (action) {
    case 'opened':
      await syncIssueToLark(issue.number);
      break;
    case 'edited':
      await syncIssueToLark(issue.number);
      break;
    case 'closed':
      await closeIssueInLark(issue.number);
      break;
    case 'labeled':
    case 'unlabeled':
      await syncIssueLabelsToLark(issue.number);
      break;
    default:
      console.log(`⚠️  Unhandled issue action: ${action}`);
  }
}

/**
 * GitHub Issue → Lark Task + Base Record
 */
async function syncIssueToLark(issueNumber: number): Promise<void> {
  console.log(`🔄 Syncing Issue #${issueNumber} to Lark...`);

  // 1. GitHub Issue取得
  const { data: issue } = await octokit.issues.get({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    issue_number: issueNumber,
  });

  // 2. ラベルから情報抽出
  const labels = issue.labels.map((l: any) =>
    typeof l === 'string' ? l : l.name
  );
  const agent = extractLabel(labels, 'agent') || 'unassigned';
  const priority = extractLabel(labels, 'priority') || 'P2-Medium';
  const estimate = extractLabel(labels, 'estimate') || 'M';
  const state = extractLabel(labels, 'state') || 'pending';

  // 3. Lark Task作成/更新
  const larkTask = await createOrUpdateLarkTask({
    githubIssue: issueNumber,
    title: issue.title,
    description: `GitHub Issue #${issue.number}\n\n${issue.body}`,
    agent,
    priority,
    state,
    githubUrl: issue.html_url,
  });

  // 4. Lark Base Record作成/更新
  const baseRecord = await createOrUpdateBaseRecord({
    issueNumber: issue.number,
    title: issue.title,
    agent,
    priority,
    estimate,
    status: state,
    createdAt: issue.created_at,
    githubUrl: issue.html_url,
    larkTaskUrl: larkTask.url,
  });

  // 5. マッピング保存
  syncMapping.set(issue.number, {
    larkTaskId: larkTask.guid,
    larkBaseRecordId: baseRecord.record_id,
    lastSyncedAt: new Date(),
  });

  console.log(`✅ Issue #${issueNumber} synced to Lark`);
}

/**
 * Lark Task作成/更新
 */
async function createOrUpdateLarkTask(params: {
  githubIssue: number;
  title: string;
  description: string;
  agent: string;
  priority: string;
  state: string;
  githubUrl: string;
}): Promise<any> {
  // 既存タスク検索
  const existingTasks = await larkClient.task.v1.task.list({
    page_size: 10,
  });

  const existing = existingTasks.data?.items?.find(
    (task: any) => task.extra?.github_issue === params.githubIssue
  );

  const taskData = {
    summary: params.title,
    description: params.description,
    extra: JSON.stringify({
      github_issue: params.githubIssue,
      github_url: params.githubUrl,
      agent: params.agent,
      priority: params.priority,
    }),
    // members: [{ id: getAgentLarkUserId(params.agent) }],
  };

  if (existing) {
    // 更新
    await larkClient.task.v1.task.patch({
      task_guid: existing.guid!,
      task: taskData,
    });
    return existing;
  } else {
    // 新規作成
    const result = await larkClient.task.v1.task.create({
      task: taskData,
    });
    return result.data?.task;
  }
}

/**
 * Lark Base Record作成/更新
 */
async function createOrUpdateBaseRecord(params: {
  issueNumber: number;
  title: string;
  agent: string;
  priority: string;
  estimate: string;
  status: string;
  createdAt: string;
  githubUrl: string;
  larkTaskUrl?: string;
}): Promise<any> {
  const appToken = process.env.LARK_BASE_APP_TOKEN!;
  const tableId = process.env.LARK_BASE_ISSUE_TABLE_ID!;

  const fields = {
    'Issue Number': params.issueNumber,
    'Title': params.title,
    'Agent': params.agent,
    'Priority': params.priority,
    'Estimate': params.estimate,
    'Status': params.status,
    'Created At': new Date(params.createdAt).getTime(),
    'GitHub URL': params.githubUrl,
    'Lark Task URL': params.larkTaskUrl || '',
  };

  // 既存レコード検索
  const existingRecords = await larkClient.bitable.v1.appTableRecord.search({
    app_token: appToken,
    table_id: tableId,
    filter: {
      conjunction: 'and',
      conditions: [
        {
          field_name: 'Issue Number',
          operator: 'is',
          value: [params.issueNumber.toString()],
        },
      ],
    },
  });

  if (existingRecords.data?.items && existingRecords.data.items.length > 0) {
    // 更新
    const recordId = existingRecords.data.items[0].record_id!;
    await larkClient.bitable.v1.appTableRecord.update({
      app_token: appToken,
      table_id: tableId,
      record_id: recordId,
      record: { fields },
    });
    return { record_id: recordId };
  } else {
    // 新規作成
    const result = await larkClient.bitable.v1.appTableRecord.create({
      app_token: appToken,
      table_id: tableId,
      record: { fields },
    });
    return result.data?.record;
  }
}

//============================================================================
// Lark → GitHub 同期
//============================================================================

/**
 * Lark Event Callback Handler
 */
app.post('/webhooks/lark', async (req, res) => {
  const event = req.body;

  console.log(`📥 Lark Event: ${event.header?.event_type}`);

  try {
    // URL Verification (初回のみ)
    if (event.type === 'url_verification') {
      return res.json({ challenge: event.challenge });
    }

    // Event処理
    switch (event.header?.event_type) {
      case 'task.v1.task.updated':
        await handleLarkTaskUpdate(event.event);
        break;
      case 'bitable.app_table_record.changed':
        await handleBaseRecordChanged(event.event);
        break;
      default:
        console.log(`⚠️  Unhandled Lark event: ${event.header?.event_type}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error handling Lark webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Lark Task更新 → GitHub Issue更新
 */
async function handleLarkTaskUpdate(event: any): Promise<void> {
  const taskGuid = event.task?.guid;

  // Task詳細取得
  const taskResult = await larkClient.task.v1.task.get({
    task_guid: taskGuid,
  });

  const task = taskResult.data?.task;
  if (!task || !task.extra) return;

  const extra = JSON.parse(task.extra);
  const githubIssue = extra.github_issue;

  if (!githubIssue) {
    console.log('⚠️  Task has no linked GitHub Issue');
    return;
  }

  // GitHub Issue更新
  const newState = larkStatusToGitHubState(task.status);

  if (newState === 'closed') {
    await octokit.issues.update({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      issue_number: githubIssue,
      state: 'closed',
    });
    console.log(`✅ Closed GitHub Issue #${githubIssue} from Lark`);
  }
}

//============================================================================
// ヘルパー関数
//============================================================================

function extractLabel(labels: string[], prefix: string): string | null {
  const label = labels.find((l) => l.includes(`${prefix}:`));
  return label ? label.split(':')[1] : null;
}

function larkStatusToGitHubState(larkStatus?: string): string {
  const mapping: Record<string, string> = {
    completed: 'closed',
    cancelled: 'closed',
    todo: 'open',
    doing: 'open',
  };
  return mapping[larkStatus || ''] || 'open';
}

async function closeIssueInLark(issueNumber: number): Promise<void> {
  const mapping = syncMapping.get(issueNumber);
  if (!mapping) return;

  await larkClient.task.v1.task.patch({
    task_guid: mapping.larkTaskId,
    task: {
      status: 'completed',
    },
  });

  console.log(`✅ Closed Lark Task for Issue #${issueNumber}`);
}

async function syncIssueLabelsToLark(issueNumber: number): Promise<void> {
  // ラベル変更を Lark に同期
  await syncIssueToLark(issueNumber);
}

async function handlePREvent(event: any): Promise<void> {
  // PR イベントのハンドリング（将来実装）
  console.log(`🔄 PR Event: ${event.action}`);
}

async function handleBaseRecordChanged(event: any): Promise<void> {
  // Base Record変更のハンドリング（将来実装）
  console.log(`🔄 Base Record Changed`);
}

//============================================================================
// サーバー起動
//============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Miyabi-Lark Sync Service running on port ${PORT}`);
  console.log(`📥 GitHub Webhook: http://localhost:${PORT}/webhooks/github`);
  console.log(`📥 Lark Callback: http://localhost:${PORT}/webhooks/lark`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('👋 Shutting down gracefully...');
  process.exit(0);
});
```

---

## 🔐 環境変数

```.env
# GitHub
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_OWNER=ShunsukeHayashi
GITHUB_REPO=Miyabi

# Lark
LARK_APP_ID=cli_xxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Lark Base
LARK_BASE_APP_TOKEN=N4p3bChGhajodqs96chj5UDXpRb
LARK_BASE_ISSUE_TABLE_ID=tblwRRR6Bi2P5XxE

# Server
PORT=3000
```

---

## 🚀 デプロイ

### ローカル開発

```bash
cd integrations/miyabi-lark-sync
npm install
npm run dev
```

### 本番デプロイ（Cloud Run）

```bash
# Dockerfile作成
cat > Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
EOF

# ビルド & デプロイ
npm run build
gcloud run deploy miyabi-lark-sync \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated
```

---

## 📊 監視

### ヘルスチェック

```bash
curl http://localhost:3000/health
```

### ログ

```bash
tail -f logs/sync.log
```

---

**Version**: 1.0.0
**Maintained by**: Miyabi Team
