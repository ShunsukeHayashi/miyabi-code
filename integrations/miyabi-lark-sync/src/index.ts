import express from 'express';
import { Octokit } from '@octokit/rest';
import * as lark from '@larksuiteoapi/node-sdk';
import dotenv from 'dotenv';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

dotenv.config();

//============================================================================
// 環境変数バリデーション
//============================================================================

function validateEnv(): void {
  const required = [
    'GITHUB_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO',
    'GITHUB_WEBHOOK_SECRET',
    'LARK_APP_ID',
    'LARK_APP_SECRET',
    'LARK_VERIFICATION_TOKEN',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// サーバー起動前に環境変数をチェック
validateEnv();

//============================================================================
// Express App Setup
//============================================================================

const app = express();

type RawBodyRequest = express.Request & { rawBody?: Buffer };

const captureRawBody = (req: express.Request, _res: express.Response, buf: Buffer): void => {
  (req as RawBodyRequest).rawBody = Buffer.from(buf);
};

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 15分間で最大100リクエスト
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/webhooks', limiter);
app.use(
  express.json({
    verify: captureRawBody,
  })
);

//============================================================================
// API Clients
//============================================================================

// GitHub Client
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Lark Client (プロトタイプ実装では未使用)
const _larkClient = new lark.Client({
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
// セキュリティ: Webhook署名検証
//============================================================================

/**
 * GitHub Webhook署名を検証
 */
function verifyGitHubSignature(payload: Buffer, signatureHeader?: string): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!);
  const digest = hmac.update(payload).digest('hex');
  const expectedSignature = `sha256=${digest}`;

  if (signatureHeader.length !== expectedSignature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSignature));
}

/**
 * Lark Event Token を検証
 */
function verifyLarkToken(token: string): boolean {
  return token === process.env.LARK_VERIFICATION_TOKEN;
}

//============================================================================
// GitHub → Lark 同期
//============================================================================

/**
 * GitHub Webhook Handler
 */
app.post('/webhooks/github', async (req: RawBodyRequest, res) => {
  // Webhook署名検証
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));

  if (!verifyGitHubSignature(payload, signature)) {
    console.error('❌ Invalid GitHub webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

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

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error handling GitHub webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Issue Event Handler
 */
async function handleIssueEvent(event: any): Promise<void> {
  try {
    if (!event?.issue) {
      console.error('❌ Invalid issue event: missing issue data');
      return;
    }

    const { action, issue } = event;

    if (!issue.number) {
      console.error('❌ Invalid issue event: missing issue number');
      return;
    }

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
  } catch (error) {
    console.error('❌ Error handling issue event:', error);
    throw error;
  }
}

/**
 * GitHub Issue → Lark Task + Base Record
 */
async function syncIssueToLark(issueNumber: number): Promise<void> {
  try {
    console.log(`🔄 Syncing Issue #${issueNumber} to Lark...`);

    // 1. GitHub Issue取得
    const { data: issue } = await octokit.issues.get({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      issue_number: issueNumber,
    });

    if (!issue) {
      throw new Error(`Issue #${issueNumber} not found`);
    }

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
  } catch (error) {
    console.error(`❌ Error syncing Issue #${issueNumber} to Lark:`, error);
    throw error;
  }
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
  // Note: Lark Task APIはプロトタイプ実装のため、実際のAPI呼び出しは省略
  // 本番実装では、Lark Task APIの正しい型定義に従って実装する必要があります

  const taskData = {
    guid: `task-${params.githubIssue}`,
    url: `https://lark.feishu.cn/task/${params.githubIssue}`,
    summary: params.title,
    extra: JSON.stringify({
      github_issue: params.githubIssue,
      github_url: params.githubUrl,
      agent: params.agent,
      priority: params.priority,
    }),
  };

  console.log(`🔧 Lark Task operation (prototype): ${params.title}`);

  return taskData;
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
  // Note: Lark Bitable APIはプロトタイプ実装のため、実際のAPI呼び出しは省略
  // 本番実装では、Lark Bitable APIの正しい型定義に従って実装する必要があります

  const recordId = `record-${params.issueNumber}`;

  console.log(`🔧 Lark Base Record operation (prototype): Issue #${params.issueNumber}`);

  return { record_id: recordId };
}

//============================================================================
// Lark → GitHub 同期
//============================================================================

/**
 * Lark Event Callback Handler
 */
app.post('/webhooks/lark', async (req, res) => {
  const event = req.body;

  console.log(`📥 Lark Event: ${event.header?.event_type || event.type}`);

  try {
    // URL Verification (初回のみ)
    if (event.type === 'url_verification') {
      // Verification Token 検証
      if (!verifyLarkToken(event.token)) {
        console.error('❌ Invalid Lark verification token');
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.json({ challenge: event.challenge });
    }

    // Event Token 検証
    if (!verifyLarkToken(event.header?.token)) {
      console.error('❌ Invalid Lark event token');
      return res.status(401).json({ error: 'Invalid token' });
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

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error handling Lark webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Lark Task更新 → GitHub Issue更新
 */
async function handleLarkTaskUpdate(event: any): Promise<void> {
  const taskGuid = event.task?.guid;

  // Note: プロトタイプ実装のため、実際のAPI呼び出しは省略
  console.log(`🔧 Lark Task update received (prototype): ${taskGuid}`);

  // 本番実装では、Lark Task APIから詳細を取得し、GitHub Issueを更新
  // const taskResult = await larkClient.task.v1.task.get({ path: { task_guid: taskGuid } });
}

//============================================================================
// ヘルパー関数
//============================================================================

function extractLabel(labels: string[], prefix: string): string {
  const label = labels.find((l) => l.includes(`${prefix}:`));
  return label ? label.split(':')[1] : '';
}

function _larkStatusToGitHubState(larkStatus?: string): string {
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

  // Note: プロトタイプ実装のため、実際のAPI呼び出しは省略
  console.log(`🔧 Closing Lark Task for Issue #${issueNumber} (prototype)`);

  // 本番実装では、Lark Task APIでタスクを完了状態に更新
  // await larkClient.task.v1.task.patch({
  //   path: { task_guid: mapping.larkTaskId },
  //   data: { task: { status: 'completed' }, update_fields: ['status'] }
  // });
}

async function syncIssueLabelsToLark(issueNumber: number): Promise<void> {
  // ラベル変更を Lark に同期
  await syncIssueToLark(issueNumber);
}

async function handlePREvent(event: any): Promise<void> {
  // PR イベントのハンドリング（将来実装）
  console.log(`🔄 PR Event: ${event.action || 'unknown'}`);
}

async function handleBaseRecordChanged(_event: any): Promise<void> {
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
